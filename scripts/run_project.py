#!/usr/bin/env python3
"""Run a generated Skill project using the locally installed Windows runtime."""
from __future__ import annotations
import argparse
import hashlib
import json
import math
from pathlib import Path
import sys

sys.path.insert(0, str(Path(__file__).resolve().parent))
import install_skill
from runtime_support import atomic_json, read_runtime, run, runtime_environment

PROJECT_NAMES = {'portrait-editorial-source-style', 'portrait-editorial-adaptive-engine'}


def project_info(project):
    project = Path(project).expanduser().absolute()
    install_skill.reject_link_ancestors(project)
    for relative in ('package.json', 'package-lock.json', 'BUILD_REPORT.json', 'src/episode.json'):
        path = project / relative
        install_skill.reject_link_ancestors(path)
        if not path.is_file():
            raise ValueError(f'Not a generated Skill project; missing {relative}.')
    package = json.loads((project / 'package.json').read_text(encoding='utf-8-sig'))
    if package.get('name') not in PROJECT_NAMES:
        raise ValueError('Project name does not match this Skill. Select a generated project.')
    return project.resolve(), package


def ensure_dependencies(project, config, env):
    lock_hash = hashlib.sha256((project / 'package-lock.json').read_bytes()).hexdigest()
    marker = project / '.portrait-dependencies.json'
    install_skill.reject_link_ancestors(marker)
    install_skill.reject_link_ancestors(project / 'node_modules')
    try:
        previous = json.loads(marker.read_text(encoding='utf-8'))
    except (OSError, ValueError):
        previous = {}
    expected = {'lockSha256': lock_hash, 'node': config['node']}
    if not (project / 'node_modules' / '.package-lock.json').is_file() or previous != expected:
        print('[dependencies] Installing locked project packages...', flush=True)
        run([config['node'], config['npmCli'], 'ci', '--no-fund', '--no-audit'], cwd=project, env=env)
        atomic_json(marker, expected)


def run_project(project, action='render', runtime_file=None):
    project, package = project_info(project)
    config = read_runtime(runtime_file)
    env = runtime_environment(config)
    legacy_opening = None
    if package['name'] == 'portrait-editorial-adaptive-engine' and action == 'render':
        episode = json.loads((project / 'src/episode.json').read_text(encoding='utf-8-sig'))
        candidates = [cue.get('end') for cue in episode.get('captions', []) if isinstance(cue, dict)]
        candidates = [end for end in candidates if isinstance(end, (int, float)) and math.isfinite(end) and 10 <= end <= min(15, episode['duration'])]
        if not candidates:
            raise ValueError('This v2 project has no caption sentence ending between 10 and 15 seconds. Use Render-Full.cmd, or create a v3 project with a selected opening boundary.')
        legacy_opening = min(candidates, key=lambda end: (abs(end - 12), end))
    ensure_dependencies(project, config, env)
    script = {'preview': 'dev', 'render': 'render', 'full': 'render:full', 'check': 'check'}[action]
    args = [config['node'], config['npmCli'], 'run', script]
    if action == 'full' and script not in package.get('scripts', {}):
        # The legacy v2 engine's default render already exports the complete timeline.
        args = [config['node'], config['npmCli'], 'run', 'render']
    elif script not in package.get('scripts', {}):
        raise ValueError(f'Project does not define npm script: {script}')
    print(f'[project] {action}: {project}', flush=True)
    run(args, cwd=project, env=env)
    if legacy_opening is not None:
        print(f'[project] v2 opening ends at the existing caption boundary {legacy_opening}s.', flush=True)
        run([config['ffmpeg'], '-y', '-v', 'error', '-i', project / 'out/adaptive-portrait.mp4',
             '-t', str(legacy_opening), '-c:v', 'libx264', '-crf', '18', '-preset', 'fast',
             '-c:a', 'aac', '-movflags', '+faststart', project / 'out/opening.mp4'], cwd=project, env=env)


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--project', required=True, type=Path)
    parser.add_argument('--action', choices=['preview', 'render', 'full', 'check'], default='render')
    parser.add_argument('--runtime-file', type=Path)
    args = parser.parse_args(argv)
    try:
        run_project(args.project, args.action, args.runtime_file)
        return 0
    except Exception as exc:
        print(f'ERROR: {exc}', file=sys.stderr)
        return 1


if __name__ == '__main__':
    raise SystemExit(main())
