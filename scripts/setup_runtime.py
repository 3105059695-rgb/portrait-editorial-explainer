#!/usr/bin/env python3
"""Finish one-click installation and prove the runtime with a real 12-second render."""
from __future__ import annotations
import argparse
from datetime import datetime, timezone
import hashlib
import json
from pathlib import Path
import re
import shutil
import sys
import uuid

sys.path.insert(0, str(Path(__file__).resolve().parent))
import install_skill
from runtime_support import atomic_json, read_browser_cache, read_runtime, run, runtime_environment, scoped_browser_path, script_command

VERSION = '3.4.0'
RECEIPT = '.portrait-install-receipt.json'


def sha256(path):
    with Path(path).open('rb') as stream:
        digest = hashlib.sha256()
        while chunk := stream.read(1024 * 1024):
            digest.update(chunk)
        return digest.hexdigest()


def recognized_skill(destination):
    try:
        entry = (destination / 'SKILL.md').read_text(encoding='utf-8-sig')
        if re.search(r'^name:\s*[\"\']?portrait-editorial-explainer[\"\']?\s*$', entry, re.M):
            return all((destination / name).is_dir() for name in ('scripts', 'assets', 'references', 'agents'))
    except OSError:
        pass
    try:
        receipt = json.loads((destination / RECEIPT).read_text(encoding='utf-8'))
        return receipt.get('skill') == install_skill.SKILL_NAME and receipt.get('destination') == str(destination)
    except (OSError, ValueError):
        return False


def safe_destination(source, destination):
    install_skill.reject_link_ancestors(source)
    install_skill.reject_link_ancestors(destination)
    source, destination = source.resolve(), destination.resolve()
    if source == destination or source in destination.parents or destination in source.parents:
        raise install_skill.InstallError('Source and Skill destination must be separate, non-nested directories.')
    if destination.exists():
        if not destination.is_dir():
            raise install_skill.InstallError('Skill destination must be a directory.')
        # Preserve unknown files, but never traverse or overwrite a link/junction.
        for path in destination.rglob('*'):
            if install_skill.is_link(path):
                raise install_skill.InstallError(f'Link or junction in installed Skill: {path}')
        if any(destination.iterdir()) and not recognized_skill(destination):
            raise install_skill.InstallError('Existing nonempty directory is not this Skill. Choose another Skills directory.')
    return source, destination


def install_or_update(source, skills_dir, app_home):
    source, destination = safe_destination(Path(source).absolute(), Path(skills_dir).absolute() / install_skill.SKILL_NAME)
    app_home = Path(app_home).absolute()
    install_skill.reject_link_ancestors(app_home)
    # build_plan supplies the same public allowlist used by the manual installer.
    # A non-created empty planning path permits a backed-up update of an existing Skill.
    planning = app_home / ('install-plan-' + uuid.uuid4().hex)
    source, _, directories, files = install_skill.build_plan(source, planning)
    changed = []
    for relative in files:
        target = destination / relative
        install_skill.reject_link_ancestors(target)
        if target.exists() and not target.is_file():
            raise install_skill.InstallError(f'Cannot replace a directory with a file: {relative}')
        if target.exists() and sha256(target) != sha256(source / relative):
            changed.append(relative)
    for relative in directories:
        if (destination / relative).exists() and not (destination / relative).is_dir():
            raise install_skill.InstallError(f'Cannot replace a file with a directory: {relative}')
    # Include generated local launcher/receipt in the same pre-write backup.
    for name in ('Use-Skill.cmd', RECEIPT):
        target = destination / name
        install_skill.reject_link_ancestors(target)
        if target.exists() and not target.is_file():
            raise install_skill.InstallError(f'Expected generated file, found a directory: {name}')
        if target.is_file() and Path(name) not in changed:
            changed.append(Path(name))
    stamp = datetime.now(timezone.utc).strftime('%Y%m%dT%H%M%SZ') + '-' + uuid.uuid4().hex[:8]
    backup = app_home / 'backups' / stamp
    backup_items = []
    for relative in changed:
        origin, copy = destination / relative, backup / relative
        install_skill.reject_link_ancestors(copy)
        copy.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(origin, copy)
        digest = sha256(origin)
        if sha256(copy) != digest:
            raise OSError('Backup verification failed; installed Skill was not changed.')
        backup_items.append({'path': relative.as_posix(), 'sha256': digest})
    if backup_items:
        atomic_json(backup / 'BACKUP_MANIFEST.json', {'destination': str(destination), 'files': backup_items})
    destination.mkdir(parents=True, exist_ok=True)
    receipt = {'skill': install_skill.SKILL_NAME, 'version': VERSION, 'status': 'installing',
               'destination': str(destination), 'backup': str(backup) if backup_items else None}
    atomic_json(destination / RECEIPT, receipt)
    try:
        for relative in directories:
            install_skill.reject_link_ancestors(destination / relative)
            (destination / relative).mkdir(parents=True, exist_ok=True)
        manifest = []
        for relative in files:
            origin, target = source / relative, destination / relative
            install_skill.reject_link_ancestors(origin)
            install_skill.reject_link_ancestors(target)
            digest = sha256(origin)
            if not target.exists() or sha256(target) != digest:
                temporary = target.with_name(target.name + '.' + uuid.uuid4().hex + '.tmp')
                shutil.copy2(origin, temporary)
                if sha256(temporary) != digest:
                    raise OSError(f'Copy verification failed: {relative}')
                temporary.replace(target)
            manifest.append({'path': relative.as_posix(), 'sha256': digest})
        receipt.update(status='installed', files=manifest)
        atomic_json(destination / RECEIPT, receipt)
    except Exception:
        receipt['status'] = 'failed'
        atomic_json(destination / RECEIPT, receipt)
        raise
    return destination, receipt


def cmd_literal(value):
    value = str(value)
    if any(char in value for char in ('\r', '\n', '"')):
        raise ValueError('Unsupported quote/newline in local installation path.')
    # Literal percent is doubled in generated batch files; expansion is disabled for !.
    return value.replace('%', '%%')


def write_skill_launcher(skill_root, config):
    executable = cmd_literal(config['installerExecutable'])
    runtime = cmd_literal(config['_runtimeFile'])
    launcher = ('@echo off\r\nchcp 65001 >nul\r\nsetlocal DisableDelayedExpansion\r\n'
                f'set "PORTRAIT_INSTALLER_EXE={executable}"\r\n'
                f'set "PORTRAIT_RUNTIME_FILE={runtime}"\r\n'
                'if "%~1"=="" goto help\r\n'
                '"%PORTRAIT_INSTALLER_EXE%" --runtime-file "%PORTRAIT_RUNTIME_FILE%" --run-script %*\r\n'
                'set "RESULT=%ERRORLEVEL%"\r\nexit /b %RESULT%\r\n'
                ':help\r\necho Skill installed: portrait-editorial-explainer\r\n'
                'echo In Codex: use $portrait-editorial-explainer with your video or narration.\r\n'
                'echo Agent CLI: Use-Skill.cmd start_episode.py -- --brief BRIEF --srt SRT --out PROJECT\r\n'
                'echo Project folders include Open-Preview.cmd and Render-Opening.cmd.\r\n'
                'echo Restart Codex if the Skill is not yet listed.\r\npause\r\n')
    (Path(skill_root) / 'Use-Skill.cmd').write_text(launcher, encoding='utf-8', newline='')
    bridge = Path(config['appHome']) / 'Use-Skill.cmd'
    install_skill.reject_link_ancestors(bridge)
    bridge.write_text(launcher, encoding='utf-8', newline='')


def verify_sample(video, config, env):
    result = run([config['ffprobe'], '-v', 'error', '-select_streams', 'v:0', '-count_frames',
                  '-show_entries', 'stream=width,height,nb_read_frames,r_frame_rate:format=duration', '-of', 'json', video], env=env, capture=True)
    report = json.loads(result.stdout)
    stream = report['streams'][0]
    if (stream.get('width'), stream.get('height'), int(stream.get('nb_read_frames', -1)), stream.get('r_frame_rate')) != (540, 960, 360, '30/1'):
        raise ValueError('Sample render has unexpected size, frame count or frame rate.')
    if abs(float(report['format']['duration']) - 12) > .1:
        raise ValueError('Sample render is not 12 seconds.')
    run([config['ffmpeg'], '-v', 'error', '-xerror', '-i', video,
         '-c:v', 'rawvideo', '-c:a', 'pcm_s16le', '-f', 'null', '-'], env=env, capture=True)
    return {'width': 540, 'height': 960, 'frames': 360, 'fps': 30, 'duration': float(report['format']['duration']), 'fullDecode': True}


def remember_browser(project, config):
    """Reuse the first downloaded browser in place; never copy its large payload."""
    app_home = Path(config['appHome'])
    cache_root = Path(project) / 'node_modules/.remotion'
    install_skill.reject_link_ancestors(cache_root)
    browser = None
    if cache_root.is_dir():
        for candidate in sorted(cache_root.rglob('chrome-headless-shell.exe')):
            browser = scoped_browser_path(str(candidate.absolute()), app_home)
            if browser:
                break
    if browser is None:
        # A repeat installation can have rendered through the existing browser cache.
        browser = read_browser_cache(app_home)
    if browser is not None:
        target = app_home / 'browser.json'
        install_skill.reject_link_ancestors(target)
        atomic_json(target, {'schemaVersion': 1, 'executable': str(browser), 'managedBy': install_skill.SKILL_NAME})
    return browser


def setup(source, skills_dir, app_home, runtime_file):
    app_home = Path(app_home).absolute()
    install_skill.reject_link_ancestors(app_home)
    result_path = app_home / 'setup-result.json'
    install_skill.reject_link_ancestors(result_path)
    result = {'status': 'installing', 'version': VERSION}
    atomic_json(result_path, result)
    try:
        config = read_runtime(runtime_file)
        expected_skill = (Path(skills_dir).absolute() / install_skill.SKILL_NAME).resolve()
        if Path(config['appHome']).resolve() != app_home.resolve() or Path(config['skillRoot']).resolve() != expected_skill:
            raise ValueError('Runtime configuration does not match the selected installation directories.')
        env = runtime_environment(config)
        print('[1/5] Installing Skill with verified backups...', flush=True)
        skill_root, receipt = install_or_update(source, skills_dir, app_home)
        write_skill_launcher(skill_root, config)
        result.update(skillRoot=str(skill_root), backup=receipt['backup'])
        print('[2/5] Creating the included 12-second sample...', flush=True)
        example = app_home / 'examples' / VERSION / uuid.uuid4().hex[:12]
        run(script_command(config, skill_root / 'scripts/start_episode.py', '--brief', skill_root / 'examples/quickstart/brief.json',
                           '--srt', skill_root / 'examples/quickstart/captions.srt', '--out', example, '--draft'), env=env)
        result['projectRoot'] = str(example)
        print('[3/5] Installing dependencies and checking TypeScript...', flush=True)
        run(script_command(config, skill_root / 'scripts/run_project.py', '--project', example, '--action', 'check', '--runtime-file', runtime_file), env=env)
        print('[4/5] Rendering sample (the first run downloads the Remotion browser)...', flush=True)
        run(script_command(config, skill_root / 'scripts/run_project.py', '--project', example, '--action', 'render', '--runtime-file', runtime_file), env=env)
        print('[5/5] Checking and decoding every rendered frame...', flush=True)
        video = example / 'out/opening.mp4'
        checks = verify_sample(video, config, env)
        browser = remember_browser(example, config)
        if browser:
            checks['browserCached'] = True
        result.update(status='ready', sampleVideo=str(video), checks={'dependencyInstall': True, 'typescript': True, 'render': checks})
        atomic_json(result_path, result)
        print('READY: Skill installed and the actual sample render passed.', flush=True)
        return result
    except Exception as exc:
        result.update(status='failed', error=str(exc), recovery='Rerun the installer. Existing files have verified backups; partial example projects are preserved.')
        atomic_json(result_path, result)
        raise


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__)
    for name in ('source', 'skills-dir', 'app-home', 'runtime-file'):
        parser.add_argument('--' + name, required=True, type=Path)
    args = parser.parse_args(argv)
    try:
        setup(args.source, args.skills_dir, args.app_home, args.runtime_file)
        return 0
    except Exception as exc:
        print(f'INSTALLATION FAILED: {exc}', file=sys.stderr)
        return 1


if __name__ == '__main__':
    raise SystemExit(main())
