"""Safety regression tests. Every installation target stays in a temporary directory."""

from __future__ import annotations

import importlib.util
import json
import os
from pathlib import Path
import shutil
import subprocess
import sys
import tempfile
from types import SimpleNamespace
import unittest
from unittest.mock import patch


REPO = Path(__file__).resolve().parents[1]
SPEC = importlib.util.spec_from_file_location("install_skill", REPO / "scripts" / "install_skill.py")
INSTALLER = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(INSTALLER)
DOCTOR_SPEC = importlib.util.spec_from_file_location("doctor", REPO / "scripts" / "doctor.py")
DOCTOR = importlib.util.module_from_spec(DOCTOR_SPEC)
DOCTOR_SPEC.loader.exec_module(DOCTOR)


class InstallSafetyTests(unittest.TestCase):
    def setUp(self):
        self.sandbox = tempfile.TemporaryDirectory(prefix="skill-install-test-")
        self.addCleanup(self.sandbox.cleanup)
        self.base = Path(self.sandbox.name)
        self.source = self.base / "source"
        self.source.mkdir()
        for entry in ("agents", "scripts", "references", "assets"):
            (self.source / entry).mkdir()
        (self.source / "SKILL.md").write_text("---\nname: portrait-editorial-explainer\n---\n", encoding="utf-8")
        (self.source / "assets" / "example.txt").write_text("public example", encoding="utf-8")
        shutil.copy2(REPO / "scripts" / "install_skill.py", self.source / "scripts" / "install_skill.py")
        self.destination = self.base / "skills" / INSTALLER.SKILL_NAME

    def run_cli(self, *arguments, codex_home=None):
        environment = os.environ.copy()
        environment["CODEX_HOME"] = str(codex_home or self.base / "isolated-codex-home")
        return subprocess.run([sys.executable, "-X", "utf8", str(self.source / "scripts" / "install_skill.py"), *map(str, arguments)], capture_output=True, text=True, encoding="utf-8", env=environment, check=False)

    def make_link(self, link, target, *, directory=False):
        try:
            link.symlink_to(target, target_is_directory=directory)
        except (OSError, NotImplementedError) as exc:
            self.skipTest(f"OS does not allow test symlinks: {exc}")

    def test_dry_run_creates_nothing(self):
        result = self.run_cli("--skills-dir", self.destination.parent, "--dry-run")
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertFalse(self.destination.parent.exists())

    def test_empty_unicode_destination_and_repeat_guard(self):
        self.destination = self.base / "临时 技能" / INSTALLER.SKILL_NAME
        self.destination.mkdir(parents=True)
        result = self.run_cli("--skills-dir", self.destination.parent)
        self.assertEqual(result.returncode, 0, result.stderr)
        before = {str(path.relative_to(self.destination)): path.read_bytes() for path in self.destination.rglob("*") if path.is_file()}
        repeated = self.run_cli("--skills-dir", self.destination.parent)
        self.assertEqual(repeated.returncode, 1)
        self.assertIn("Recovery:", repeated.stderr)
        after = {str(path.relative_to(self.destination)): path.read_bytes() for path in self.destination.rglob("*") if path.is_file()}
        self.assertEqual(before, after)

    def test_nonempty_destination_does_not_overwrite(self):
        self.destination.mkdir(parents=True)
        sentinel = self.destination / "SKILL.md"
        sentinel.write_text("user's existing skill", encoding="utf-8")
        result = self.run_cli("--skills-dir", self.destination.parent)
        self.assertEqual(result.returncode, 1)
        self.assertEqual(sentinel.read_text(encoding="utf-8"), "user's existing skill")
        self.assertEqual(list(self.destination.iterdir()), [sentinel])

    def test_codex_home_override_is_subprocess_scoped(self):
        override = self.base / "独立 Codex"
        old_value = os.environ.get("CODEX_HOME")
        result = self.run_cli(codex_home=override)
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertTrue((override / "skills" / INSTALLER.SKILL_NAME / "SKILL.md").is_file())
        self.assertEqual(os.environ.get("CODEX_HOME"), old_value)

    def test_skills_dir_takes_precedence_over_codex_home(self):
        override = self.base / "unused-codex-home"
        result = self.run_cli("--skills-dir", self.destination.parent, codex_home=override)
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertTrue((self.destination / "SKILL.md").is_file())
        self.assertFalse(override.exists())

    def test_default_home_without_codex_home(self):
        with patch.dict(os.environ, {}, clear=True), patch.object(Path, "home", return_value=self.base):
            self.assertEqual(INSTALLER.default_skills_dir(), self.base / ".codex" / "skills")

    def test_allowlist_and_sensitive_generated_exclusions(self):
        (self.source / ".env").write_text("DO_NOT_COPY=secret", encoding="utf-8")
        (self.source / "private.txt").write_text("DO_NOT_COPY", encoding="utf-8")
        (self.source / "README.md").write_text("readme", encoding="utf-8")
        for directory in ("docs", "examples"):
            (self.source / directory).mkdir()
            (self.source / directory / "sample.md").write_text("sample", encoding="utf-8")
        for filename in ("LICENSE", "THIRD_PARTY_NOTICES.md"):
            (self.source / filename).write_text("notice", encoding="utf-8")
        for directory in ("node_modules", "out", ".git", "__pycache__", "test-results", "playwright-report"):
            target = self.source / "assets" / directory
            target.mkdir()
            (target / "private.txt").write_text("DO_NOT_COPY", encoding="utf-8")
        for filename in (".env", ".env.local", "cache.pyc", ".coverage"):
            (self.source / "assets" / filename).write_text("DO_NOT_COPY", encoding="utf-8")
        INSTALLER.install(self.source, self.destination)
        copied = [path for path in self.destination.rglob("*") if path.is_file()]
        self.assertTrue((self.destination / "assets" / "example.txt").is_file())
        self.assertTrue((self.destination / "LICENSE").is_file())
        self.assertTrue((self.destination / "examples" / "sample.md").is_file())
        for path in copied:
            self.assertNotIn(b"DO_NOT_COPY", path.read_bytes(), str(path))

    def test_source_ancestors_and_descendants_rejected(self):
        for destination in (self.source, self.source / "nested", self.base):
            with self.subTest(destination=destination), self.assertRaises(INSTALLER.InstallError):
                INSTALLER.install(self.source, destination, dry_run=True)
        self.assertFalse((self.source / "nested").exists())

    def test_source_symlink_rejected_before_creating_destination(self):
        private = self.base / "private.txt"
        private.write_text("private", encoding="utf-8")
        self.make_link(self.source / "assets" / "linked.txt", private)
        with self.assertRaises(INSTALLER.InstallError):
            INSTALLER.install(self.source, self.destination)
        self.assertFalse(self.destination.exists())

    def test_destination_symlink_parent_rejected(self):
        real = self.base / "real-parent"
        real.mkdir()
        linked = self.base / "linked-parent"
        self.make_link(linked, real, directory=True)
        with self.assertRaises(INSTALLER.InstallError):
            INSTALLER.install(self.source, linked / INSTALLER.SKILL_NAME)
        self.assertEqual(list(real.iterdir()), [])

    def test_windows_reparse_attribute_is_rejected(self):
        # Covers the junction guard even where Windows denies symlink creation.
        with patch.object(Path, "is_symlink", return_value=False), patch.object(Path, "lstat", return_value=SimpleNamespace(st_file_attributes=0x400)):
            self.assertTrue(INSTALLER.is_link(self.base / "junction"))
            with self.assertRaises(INSTALLER.InstallError):
                INSTALLER.reject_link_ancestors(self.base / "junction")

    def test_help_has_no_side_effect(self):
        result = self.run_cli("--help")
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertIn("--dry-run", result.stdout)
        self.assertFalse((self.base / "isolated-codex-home").exists())


class DoctorSafetyTests(unittest.TestCase):
    def test_missing_production_tools_do_not_block_skill_profile(self):
        def missing_tool(name, *unused):
            return {"name": name, "ok": False, "path": None, "version": None, "detail": "Not found on PATH."}

        with patch.object(DOCTOR, "probe_tool", side_effect=missing_tool):
            self.assertTrue(DOCTOR.run_checks("skill")["ok"])
            self.assertFalse(DOCTOR.run_checks("production")["ok"])

    def test_lock_root_drift_is_detected(self):
        with tempfile.TemporaryDirectory(prefix="skill-doctor-test-") as directory:
            root = Path(directory)
            package = {"name": "sample", "version": "1.0.0", "dependencies": {"example": "1.0.0"}}
            lock = {"name": "sample", "version": "1.0.0", "packages": {"": {**package, "dependencies": {"example": "2.0.0"}}}}
            (root / "package.json").write_text(json.dumps(package), encoding="utf-8")
            (root / "package-lock.json").write_text(json.dumps(lock), encoding="utf-8")
            self.assertTrue(any("dependencies" in issue for issue in DOCTOR.lock_issues(root)))

    def test_wrong_node_version_output_does_not_pass(self):
        fake = subprocess.CompletedProcess(["node", "--version"], 0, "not a node version", "")
        with patch.object(DOCTOR.shutil, "which", return_value="node"), patch.object(DOCTOR.subprocess, "run", return_value=fake):
            self.assertFalse(DOCTOR.probe_tool("node", ["--version"], r"^v\d+\.\d+\.\d+$")["ok"])


if __name__ == "__main__":
    unittest.main()
