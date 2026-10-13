#!/usr/bin/env python3
"""Local runtime helpers. Configuration belongs to the installing user, not the package."""
from __future__ import annotations
import json
import os
from pathlib import Path
import subprocess
import sys
import uuid
import install_skill

APP_DIRECTORY = 'PortraitEditorialExplainer'
RUN_SCRIPT = ('import runpy,sys; p=sys.argv.pop(1); '
              'sys.path.insert(0,str(__import__("pathlib").Path(p).parent)); '
              'sys.argv[0]=p; runpy.run_path(p,run_name="__main__")')


def scoped_browser_path(value, app_home):
    """Accept only a real Remotion browser inside this installation's examples."""
    if not isinstance(value, str) or not Path(value).is_absolute():
        return None
    path, home = Path(value), Path(app_home)
    try:
        install_skill.reject_link_ancestors(home)
        install_skill.reject_link_ancestors(path)
        relative = path.resolve().relative_to((home / 'examples').resolve())
        parts = relative.parts
        has_remotion_directory = any(a == 'node_modules' and b == '.remotion' for a, b in zip(parts, parts[1:]))
        if path.name != 'chrome-headless-shell.exe' or not has_remotion_directory or not path.is_file():
            return None
        return path.resolve()
    except (OSError, ValueError):
        return None


def read_browser_cache(app_home):
    file = Path(app_home) / 'browser.json'
    try:
        install_skill.reject_link_ancestors(file)
        record = json.loads(file.read_text(encoding='utf-8-sig'))
        if not isinstance(record, dict) or record.get('schemaVersion') != 1:
            return None
        return scoped_browser_path(record.get('executable'), app_home)
    except (OSError, ValueError):
        return None


def read_runtime(path=None):
    selected = path or os.environ.get('PORTRAIT_RUNTIME_FILE')
    if selected is None:
        local = os.environ.get('LOCALAPPDATA')
        if not local:
            raise ValueError('Windows runtime is not installed. Use the Windows one-click installer; macOS/Linux can use npm directly.')
        selected = Path(local) / APP_DIRECTORY / 'runtime.json'
    selected = Path(selected).expanduser().absolute()
    config = json.loads(selected.read_text(encoding='utf-8-sig'))
    if config.get('schemaVersion') != 1:
        raise ValueError('Unsupported runtime.json schema; rerun the one-click installer.')
    for key in ('appHome', 'python', 'node', 'npmCli', 'ffmpeg', 'ffprobe', 'skillRoot', 'installerExecutable'):
        value = config.get(key)
        if not isinstance(value, str) or not Path(value).is_absolute():
            raise ValueError(f'runtime.json needs an absolute {key} path.')
        if key not in ('appHome', 'skillRoot') and not Path(value).is_file():
            raise ValueError(f'Runtime component is missing: {key}. Rerun the installer.')
    config['_runtimeFile'] = str(selected)
    # Never persist this temporary property back into the C# runtime contract.
    config.pop('_browserExecutable', None)
    browser = read_browser_cache(config['appHome'])
    if browser:
        config['_browserExecutable'] = str(browser)
    return config


def runtime_environment(config, base=None):
    env = dict(os.environ if base is None else base)
    directories = list(dict.fromkeys(str(Path(config[key]).parent) for key in ('python', 'node', 'ffmpeg', 'ffprobe')))
    env['PATH'] = os.pathsep.join(directories + [env.get('PATH', '')])
    env['PYTHON'] = config['python']
    env['PYTHONIOENCODING'] = 'utf-8'
    env['PYTHONUTF8'] = '1'
    env['PORTRAIT_RUNTIME_FILE'] = config['_runtimeFile']
    env['PORTRAIT_INSTALLER_EXE'] = config['installerExecutable']
    # The cache is optional; stale files must fall back to Remotion's normal download.
    env.pop('REMOTION_BROWSER_EXECUTABLE', None)
    browser = scoped_browser_path(config.get('_browserExecutable'), config['appHome'])
    if browser:
        env['REMOTION_BROWSER_EXECUTABLE'] = str(browser)
    # A caller's Python installation must not alter the embeddable runtime.
    env.pop('PYTHONHOME', None)
    env.pop('PYTHONPATH', None)
    return env


def script_command(config, script, *arguments):
    return [config['python'], '-X', 'utf8', '-c', RUN_SCRIPT, str(script), *map(str, arguments)]


def run(command, *, cwd=None, env=None, capture=False):
    try:
        return subprocess.run(list(map(str, command)), cwd=cwd, env=env, check=True,
                              text=True, encoding='utf-8', errors='replace',
                              stdout=subprocess.PIPE if capture else None,
                              stderr=subprocess.PIPE if capture else None)
    except subprocess.CalledProcessError as exc:
        if capture and exc.stderr:
            print(exc.stderr[-8000:], file=sys.stderr, flush=True)
        raise


def atomic_json(path, value):
    path = Path(path)
    path.parent.mkdir(parents=True, exist_ok=True)
    temporary = path.with_name(path.name + '.' + uuid.uuid4().hex + '.tmp')
    temporary.write_text(json.dumps(value, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    temporary.replace(path)


def project_launcher(action):
    """Generic ASCII launcher: no author's paths or PowerShell execution policy changes."""
    if action not in ('preview', 'render', 'full'):
        raise ValueError('Unknown launcher action')
    return ('@echo off\r\nsetlocal DisableDelayedExpansion\r\n'
            'if not defined PORTRAIT_RUNTIME_FILE set "PORTRAIT_RUNTIME_FILE=%LOCALAPPDATA%\\PortraitEditorialExplainer\\runtime.json"\r\n'
            'if not exist "%PORTRAIT_RUNTIME_FILE%" goto missing\r\n'
            'if defined PORTRAIT_INSTALLER_EXE goto direct\r\n'
            'set "PORTRAIT_BRIDGE=%LOCALAPPDATA%\\PortraitEditorialExplainer\\Use-Skill.cmd"\r\n'
            'if not exist "%PORTRAIT_BRIDGE%" goto missing\r\n'
            '"%PORTRAIT_BRIDGE%" run_project.py -- --project "%~dp0." --action ' + action + '\r\n'
            'exit /b %ERRORLEVEL%\r\n:direct\r\n'
            'if not exist "%PORTRAIT_INSTALLER_EXE%" goto missing\r\n'
            '"%PORTRAIT_INSTALLER_EXE%" --runtime-file "%PORTRAIT_RUNTIME_FILE%" --run-script run_project.py -- --project "%~dp0." --action ' + action + '\r\n'
            ':finished\r\n'
            'set "RESULT=%ERRORLEVEL%"\r\nif not "%RESULT%"=="0" pause\r\nexit /b %RESULT%\r\n'
            ':missing\r\necho Install the Windows one-click package first:\r\n'
            'echo https://github.com/3105059695-rgb/portrait-editorial-explainer/releases/latest\r\n'
            'echo macOS/Linux: follow README and use npm.\r\npause\r\nexit /b 1\r\n')


def write_project_launchers(destination):
    destination = Path(destination)
    for name, action in [('Open-Preview.cmd', 'preview'), ('Render-Opening.cmd', 'render'), ('Render-Full.cmd', 'full')]:
        with (destination / name).open('x', encoding='ascii', newline='') as stream:
            stream.write(project_launcher(action))
