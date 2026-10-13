"""Filesystem/update safety and subprocess contracts. External installs are mocked here."""
import json
import os
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest
from unittest.mock import patch

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'scripts'))
import run_project
import runtime_support
import setup_runtime


class RuntimeSetupTests(unittest.TestCase):
    def setUp(self):
        self.temporary = tempfile.TemporaryDirectory()
        self.root = Path(self.temporary.name)
        self.source = self.root / 'source'
        self.source.mkdir()
        (self.source / 'SKILL.md').write_text('---\nname: portrait-editorial-explainer\n---\nOriginal\n')
        for name in ('scripts', 'assets', 'references', 'agents'):
            (self.source / name).mkdir()
        (self.source / 'scripts/tool.py').write_text('old\n')
        self.skills = self.root / 'skills'
        self.app_home = self.root / 'runtime'

    def tearDown(self):
        self.temporary.cleanup()

    def config(self):
        self.app_home.mkdir(exist_ok=True)
        config = {'schemaVersion': 1, 'version': '3.4.0', 'appHome': str(self.app_home),
                  'skillRoot': str(self.skills / 'portrait-editorial-explainer')}
        for name in ('python', 'node', 'npmCli', 'ffmpeg', 'ffprobe', 'installerExecutable'):
            path = self.app_home / (name + '.exe')
            path.touch()
            config[name] = str(path)
        file = self.app_home / 'runtime.json'
        file.write_text(json.dumps(config), encoding='utf-8')
        config['_runtimeFile'] = str(file)
        return config

    def test_update_backs_up_before_changes_and_preserves_unmanaged_extra(self):
        target, first = setup_runtime.install_or_update(self.source, self.skills, self.app_home)
        (target / 'my-notes.txt').write_text('keep this')
        (self.source / 'scripts/tool.py').write_text('new\n')
        target, receipt = setup_runtime.install_or_update(self.source, self.skills, self.app_home)
        self.assertEqual((target / 'scripts/tool.py').read_text(), 'new\n')
        self.assertEqual((target / 'my-notes.txt').read_text(), 'keep this')
        backup = Path(receipt['backup'])
        self.assertEqual((backup / 'scripts/tool.py').read_text(), 'old\n')
        self.assertEqual(receipt['status'], 'installed')
        self.assertTrue(all(set(entry) == {'path', 'sha256'} for entry in receipt['files']))
        self.assertIsNone(first['backup'])

    def test_unrelated_target_is_untouched(self):
        target = self.skills / 'portrait-editorial-explainer'
        target.mkdir(parents=True)
        (target / 'important.txt').write_text('important')
        with self.assertRaisesRegex(ValueError, 'not this Skill'):
            setup_runtime.install_or_update(self.source, self.skills, self.app_home)
        self.assertEqual(list(target.iterdir()), [target / 'important.txt'])

    def test_nested_source_destination_rejected(self):
        with self.assertRaisesRegex(ValueError, 'non-nested'):
            setup_runtime.install_or_update(self.source, self.source / 'skills', self.app_home)

    def test_links_rejected(self):
        destination = self.skills / 'portrait-editorial-explainer'
        self.skills.mkdir()
        try:
            destination.symlink_to(self.source, target_is_directory=True)
        except OSError:
            self.skipTest('Symlink privileges are not available')
        with self.assertRaisesRegex(ValueError, 'links|junction'):
            setup_runtime.install_or_update(self.source, self.skills, self.app_home)

    def test_backup_failure_does_not_replace_installed_files(self):
        target, _ = setup_runtime.install_or_update(self.source, self.skills, self.app_home)
        (self.source / 'scripts/tool.py').write_text('new')
        with patch.object(setup_runtime.shutil, 'copy2', side_effect=OSError('disk full')):
            with self.assertRaisesRegex(OSError, 'disk full'):
                setup_runtime.install_or_update(self.source, self.skills, self.app_home)
        self.assertEqual((target / 'scripts/tool.py').read_text(), 'old\n')

    def test_partial_install_can_be_retried_without_deleting_extras(self):
        original_copy = setup_runtime.shutil.copy2
        def interrupted(origin, destination, *args, **kwargs):
            if Path(origin).name == 'tool.py':
                raise OSError('interrupted copy')
            return original_copy(origin, destination, *args, **kwargs)
        with patch.object(setup_runtime.shutil, 'copy2', side_effect=interrupted):
            with self.assertRaisesRegex(OSError, 'interrupted'):
                setup_runtime.install_or_update(self.source, self.skills, self.app_home)
        target = self.skills / 'portrait-editorial-explainer'
        (target / 'my-notes.txt').write_text('keep')
        _, receipt = setup_runtime.install_or_update(self.source, self.skills, self.app_home)
        self.assertEqual(receipt['status'], 'installed')
        self.assertEqual((target / 'scripts/tool.py').read_text(), 'old\n')
        self.assertEqual((target / 'my-notes.txt').read_text(), 'keep')

    def test_runtime_environment_only_changes_child_copy(self):
        config = self.config()
        before = {'PATH': 'original', 'PYTHONHOME': 'bad', 'PYTHONPATH': 'bad', 'OTHER': 'untouched'}
        child = runtime_support.runtime_environment(config, before)
        self.assertEqual(before['PATH'], 'original')
        self.assertEqual(before['PYTHONHOME'], 'bad')
        self.assertNotIn('PYTHONHOME', child)
        self.assertEqual(child['OTHER'], 'untouched')
        self.assertEqual(child['PYTHON'], config['python'])
        self.assertTrue(child['PATH'].endswith('original'))

    def browser(self):
        browser = self.app_home / 'examples/3.4.0/test-project/node_modules/.remotion/chrome-headless-shell/win64/chrome-headless-shell-win64/chrome-headless-shell.exe'
        browser.parent.mkdir(parents=True)
        browser.write_bytes(b'test executable placeholder')
        return browser

    def test_browser_cache_reused_by_subsequent_runtime_without_global_changes(self):
        config = self.config()
        browser = self.browser()
        original_runtime = Path(config['_runtimeFile']).read_bytes()
        project = self.app_home / 'examples/3.4.0/test-project'
        self.assertEqual(setup_runtime.remember_browser(project, config), browser.resolve())
        loaded = runtime_support.read_runtime(config['_runtimeFile'])
        self.assertEqual(loaded['_browserExecutable'], str(browser.resolve()))
        original = {'REMOTION_BROWSER_EXECUTABLE': 'unrelated-browser'}
        environment = runtime_support.runtime_environment(loaded, original)
        self.assertEqual(environment['REMOTION_BROWSER_EXECUTABLE'], str(browser.resolve()))
        self.assertEqual(original, {'REMOTION_BROWSER_EXECUTABLE': 'unrelated-browser'})
        self.assertEqual(Path(config['_runtimeFile']).read_bytes(), original_runtime)
        later_project = self.app_home / 'examples/3.4.0/later-project'
        self.assertEqual(setup_runtime.remember_browser(later_project, loaded), browser.resolve())

    def test_absent_deleted_or_foreign_browser_falls_back_to_normal_download(self):
        config = self.config()
        self.assertNotIn('_browserExecutable', runtime_support.read_runtime(config['_runtimeFile']))
        browser = self.browser()
        setup_runtime.remember_browser(self.app_home / 'examples/3.4.0/test-project', config)
        loaded = runtime_support.read_runtime(config['_runtimeFile'])
        browser.unlink()
        self.assertNotIn('REMOTION_BROWSER_EXECUTABLE', runtime_support.runtime_environment(loaded))
        self.assertNotIn('_browserExecutable', runtime_support.read_runtime(config['_runtimeFile']))
        foreign = self.root / 'foreign/chrome-headless-shell.exe'
        foreign.parent.mkdir()
        foreign.touch()
        (self.app_home / 'browser.json').write_text(json.dumps({'schemaVersion': 1, 'executable': str(foreign)}))
        self.assertNotIn('_browserExecutable', runtime_support.read_runtime(config['_runtimeFile']))

    def test_npm_ci_when_missing_or_lock_changed_only(self):
        project = self.root / 'project'
        project.mkdir()
        (project / 'package-lock.json').write_text('{"version":1}')
        config = self.config()
        def installed(*args, **kwargs):
            (project / 'node_modules').mkdir(exist_ok=True)
            (project / 'node_modules/.package-lock.json').write_text('{}')
        with patch.object(run_project, 'run', side_effect=installed) as command:
            run_project.ensure_dependencies(project, config, {})
            run_project.ensure_dependencies(project, config, {})
            self.assertEqual(command.call_count, 1)
            (project / 'package-lock.json').write_text('{"version":2}')
            run_project.ensure_dependencies(project, config, {})
            self.assertEqual(command.call_count, 2)
            self.assertEqual(command.call_args.args[0][:3], [config['node'], config['npmCli'], 'ci'])

    def test_failed_npm_never_records_dependencies_ready(self):
        project = self.root / 'project'
        project.mkdir()
        (project / 'package-lock.json').write_text('{}')
        with patch.object(run_project, 'run', side_effect=subprocess.CalledProcessError(1, ['npm'])):
            with self.assertRaises(subprocess.CalledProcessError):
                run_project.ensure_dependencies(project, self.config(), {})
        self.assertFalse((project / '.portrait-dependencies.json').exists())

    def test_launchers_are_portable_and_python_path_independent(self):
        runtime_support.write_project_launchers(self.root)
        for name in ('Open-Preview.cmd', 'Render-Opening.cmd', 'Render-Full.cmd'):
            content = (self.root / name).read_text()
            self.assertNotIn(str(self.root), content)
            self.assertNotIn('powershell', content.lower())
            self.assertNotIn('python ', content.lower())
            self.assertIn('DisableDelayedExpansion', content)
            self.assertIn('"%~dp0."', content)
            self.assertIn('PORTRAIT_RUNTIME_FILE', content)

    def test_bad_runtime_changes_old_ready_to_failed(self):
        self.app_home.mkdir()
        (self.app_home / 'setup-result.json').write_text('{"status":"ready"}')
        with self.assertRaises(OSError):
            setup_runtime.setup(self.source, self.skills, self.app_home, self.root / 'missing.json')
        report = json.loads((self.app_home / 'setup-result.json').read_text())
        self.assertEqual(report['status'], 'failed')
        self.assertNotIn('sampleVideo', report)

    def test_render_failure_has_no_ready_status_or_sample(self):
        config = self.config()
        with patch.object(setup_runtime, 'run', side_effect=subprocess.CalledProcessError(1, ['render'])):
            with self.assertRaises(subprocess.CalledProcessError):
                setup_runtime.setup(self.source, self.skills, self.app_home, config['_runtimeFile'])
        report = json.loads((self.app_home / 'setup-result.json').read_text())
        self.assertEqual(report['status'], 'failed')
        self.assertNotIn('sampleVideo', report)

    def test_reject_foreign_project_before_subprocess(self):
        project = self.root / 'foreign'
        project.mkdir()
        (project / 'package.json').write_text('{"name":"other"}')
        with patch.object(run_project, 'run') as command:
            with self.assertRaisesRegex(ValueError, 'Not a generated'):
                run_project.run_project(project, runtime_file='missing')
            command.assert_not_called()


if __name__ == '__main__':
    unittest.main()
