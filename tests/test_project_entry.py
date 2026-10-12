"""The public entry requires a current-episode plan, never a silent default demo."""
from __future__ import annotations

import hashlib
import json
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest


REPO = Path(__file__).resolve().parents[1]
ENTRY = REPO / "scripts" / "new_project.py"
STYLE = REPO / "references" / "approved-editing-direction.md"


class ProjectEntryTests(unittest.TestCase):
    def setUp(self):
        temporary = tempfile.TemporaryDirectory(prefix="episode-entry-test-")
        self.addCleanup(temporary.cleanup)
        self.base = Path(temporary.name)
        self.output = self.base / "episode"
        self.input = self.base / "current-episode.json"
        self.plan = json.loads((REPO / "examples" / "storyboards" / "water-filter.json").read_text(encoding="utf-8"))
        self.plan["title"] = "本期新分镜：先检查安装条件"
        self.input.write_text(json.dumps(self.plan, ensure_ascii=False), encoding="utf-8")

    def run_entry(self, *arguments):
        return subprocess.run(
            [sys.executable, "-X", "utf8", str(ENTRY), *map(str, arguments), "--out", str(self.output)],
            cwd=self.base, capture_output=True, text=True, encoding="utf-8", check=False,
        )

    def test_missing_input_has_no_automatic_ui_or_historical_v3_case(self):
        result = self.run_entry()
        self.assertEqual(result.returncode, 2, result.stdout + result.stderr)
        self.assertIn("需要本期分镜 JSON", result.stderr)
        self.assertIn("--input PLAN", result.stderr)
        self.assertIn("--case presenter-v3 --out NEW", result.stderr)
        self.assertFalse(self.output.exists())

    def test_real_plan_compiles_without_replacing_its_story_or_assets(self):
        result = self.run_entry("--input", self.input, "--media-dir", REPO / "examples" / "media", "--draft")
        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
        episode = json.loads((self.output / "src" / "episode.json").read_text(encoding="utf-8"))
        self.assertEqual(episode, {**self.plan, "renderMode": "draft"})
        self.assertEqual((self.output / "STYLE_TARGET.md").read_bytes(), STYLE.read_bytes())
        report_text = (self.output / "BUILD_REPORT.json").read_text(encoding="utf-8")
        report = json.loads(report_text)
        self.assertEqual(report["compiler"], "portrait-editorial-explainer/storyboard-v2")
        self.assertEqual(report["styleTarget"]["sha256"], hashlib.sha256(STYLE.read_bytes()).hexdigest())
        self.assertNotIn(str(self.base), report_text)
        for asset in self.plan["assets"]:
            self.assertEqual((self.output / "public" / asset["path"]).read_bytes(), (REPO / "examples" / "media" / asset["path"]).read_bytes())
        self.assertFalse((self.output / "node_modules").exists())

    def test_production_validation_is_not_bypassed(self):
        result = self.run_entry("--input", self.input, "--media-dir", REPO / "examples" / "media")
        self.assertEqual(result.returncode, 1, result.stdout + result.stderr)
        self.assertIn("$.timing", result.stderr)
        self.assertFalse(self.output.exists())

    def test_invalid_plan_does_not_fall_back_to_an_example(self):
        self.plan["scenes"][0]["mechanism"] = "invented-widget"
        self.input.write_text(json.dumps(self.plan), encoding="utf-8")
        result = self.run_entry("--input", self.input, "--draft")
        self.assertEqual(result.returncode, 1, result.stdout + result.stderr)
        self.assertIn("$.scenes[0].mechanism", result.stderr)
        self.assertFalse(self.output.exists())

    def test_missing_referenced_media_fails_before_output(self):
        result = self.run_entry("--input", self.input, "--media-dir", self.base, "--draft")
        self.assertEqual(result.returncode, 1, result.stdout + result.stderr)
        self.assertIn("referenced regular file is missing", result.stderr)
        self.assertFalse(self.output.exists())

    def test_explicit_cases_remain_available_and_labeled_as_calibration(self):
        for case in ("source-style", "adaptive", "presenter-v3", "approved-reference"):
            with self.subTest(case=case):
                self.output = self.base / case
                result = self.run_entry("--case", case)
                self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
                self.assertTrue((self.output / "package.json").is_file())
                self.assertIn("calibration case", result.stdout)
                self.assertIn("不是", result.stdout)
                if case == "source-style":
                    self.assertIn("仅辅助 UI 组件", result.stdout)
                if case == "presenter-v3":
                    self.assertIn("10.74 seconds", result.stdout)

    def test_case_cannot_silently_ignore_episode_arguments(self):
        for extra in (("--input", self.input), ("--media-dir", self.base), ("--draft",)):
            with self.subTest(extra=extra):
                result = self.run_entry("--case", "presenter-v3", *extra)
                self.assertEqual(result.returncode, 2, result.stdout + result.stderr)
                self.assertIn("cannot be combined", result.stderr)
                self.assertFalse(self.output.exists())


if __name__ == "__main__":
    unittest.main()
