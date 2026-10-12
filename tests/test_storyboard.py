"""Synthetic, nonprivate storyboard/compilation regressions; no installed packages."""
from __future__ import annotations

import copy
import hashlib
import importlib.util
import json
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest
from unittest.mock import patch

REPO = Path(__file__).resolve().parents[1]


def load_script(name):
    spec = importlib.util.spec_from_file_location(name, REPO / "scripts" / (name + ".py"))
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


VALIDATOR = load_script("validate_storyboard")
COMPILER = load_script("compile_storyboard")


def kitchen_plan():
    return {
        "version": 2, "title": "整理厨房工具", "width": 1080, "height": 1920,
        "fps": 30, "duration": 8.2, "timing": "measured",
        "source": {"type": "narration", "roughcut": "not-needed"},
        "media": {"presenter": None, "voice": "media/voice.wav"}, "assets": [],
        "objects": [{"id": "spoon", "kind": "product", "label": "勺子"}],
        "captions": [{"id": "c1", "start": 0.2, "end": 4, "text": "先找到经常用的勺子。"}, {"id": "c2", "start": 4.1, "end": 8.2, "text": "然后看清它的形状。"}],
        "scenes": [
            {"id": "s1", "start": 0, "end": 4.1, "cueIds": ["c1"], "intent": "介绍被整理的工具", "mechanism": "object-focus", "title": "常用工具", "objectIds": ["spoon"], "beats": [{"at": 1, "cueId": "c1", "action": "focus", "targetId": "spoon"}], "transition": "circle", "presenter": "hidden"},
            {"id": "s2", "start": 4.1, "end": 8.2, "cueIds": ["c2"], "intent": "让同一工具持续可见", "mechanism": "object-focus", "title": "看清形状", "objectIds": ["spoon"], "beats": [{"at": 5, "cueId": "c2", "action": "result", "targetId": "spoon"}], "transition": "match", "presenter": "hidden"}
        ]
    }


def research_plan(scene_count=11):
    """Another subject, scene count, duration, mechanism order and frame rate."""
    plan = kitchen_plan()
    plan.update(title="文献检索与引文关系", fps=50, duration=scene_count * 1.7)
    plan["objects"] = [{"id": name, "kind": "document", "label": name} for name in ("article", "reference")]
    plan["captions"], plan["scenes"] = [], []
    for index in range(scene_count):
        start, end = round(index * 1.7, 6), round((index + 1) * 1.7, 6)
        cue_id = f"cue{index}"
        mechanism = "question-thread" if index % 2 == 0 else "compare-pan"
        beats = [{"at": start + 0.4, "cueId": cue_id, "action": "connect", "targetId": "article", "withId": "reference"}] if mechanism == "question-thread" else [{"at": start + 0.3, "cueId": cue_id, "action": "focus", "targetId": "article"}, {"at": start + 1, "cueId": cue_id, "action": "select", "targetId": "reference"}]
        plan["captions"].append({"id": cue_id, "start": start, "end": end, "text": "查看引文关系。"})
        plan["scenes"].append({"id": f"scene{index}", "start": start, "end": end, "cueIds": [cue_id], "intent": "沿引用关系查看两篇资料", "mechanism": mechanism, "title": "引文关系", "objectIds": ["article", "reference"], "beats": beats, "transition": "window", "presenter": "hidden"})
    return plan


class StoryboardValidationTests(unittest.TestCase):
    def assertInvalidAt(self, plan, path, mode="production"):
        result = VALIDATOR.validate_storyboard(plan, mode)
        self.assertFalse(result["valid"], result)
        self.assertTrue(any(entry["path"] == path for entry in result["errors"]), result)
        self.assertTrue(all(entry["message"] and entry["fix"] for entry in result["errors"]))

    def test_two_unrelated_plans_and_arbitrary_scene_count(self):
        for plan in (kitchen_plan(), research_plan(), research_plan(19)):
            result = VALIDATOR.validate_storyboard(plan)
            self.assertTrue(result["valid"], result)

    def test_all_mechanisms_have_actual_minimum_structure(self):
        settings = {
            "object-focus": (1, "reveal"), "compare-pan": (2, "select"),
            "route-transfer": (3, "transfer"), "group-sort": (3, "group"),
            "evidence-zoom": (1, "focus"), "metric-build": (1, "count"),
            "question-thread": (2, "connect"), "presenter": (0, None)
        }
        for mechanism, (count, action) in settings.items():
            with self.subTest(mechanism=mechanism):
                plan = kitchen_plan()
                plan["objects"] = [{"id": f"o{x}", "kind": "document", "label": "资料"} for x in range(max(count, 1))]
                for scene in plan["scenes"]:
                    scene.update(mechanism=mechanism, objectIds=[f"o{x}" for x in range(count)], beats=[])
                    if action:
                        beat = {"at": scene["start"] + 1, "cueId": scene["cueIds"][0], "action": action, "targetId": "o0"}
                        if action in {"transfer", "group", "connect"}:
                            beat["withId"] = f"o{count - 1}"
                        scene["beats"].append(beat)
                    if mechanism == "compare-pan":
                        scene["beats"].append({**beat, "at": scene["start"] + 2, "targetId": "o1"})
                    if mechanism == "metric-build":
                        scene["metric"] = {"value": 2, "total": 5, "unit": "篇"}
                self.assertTrue(VALIDATOR.validate_storyboard(plan)["valid"])

    def test_unknown_mechanism(self):
        plan = kitchen_plan()
        plan["scenes"][0]["mechanism"] = "make-everything-cool"
        self.assertInvalidAt(plan, "$.scenes[0].mechanism")

    def test_nonfinite_boolean_and_negative_numbers(self):
        for value in (float("inf"), float("nan"), True, -3):
            plan = kitchen_plan()
            plan["duration"] = value
            self.assertInvalidAt(plan, "$.duration")

    def test_duplicate_ids_and_unknown_references(self):
        plan = kitchen_plan()
        plan["objects"].append(copy.deepcopy(plan["objects"][0]))
        self.assertInvalidAt(plan, "$.objects[1].id")
        plan = kitchen_plan()
        plan["scenes"][0]["objectIds"] = ["absent"]
        self.assertInvalidAt(plan, "$.scenes[0].objectIds[0]")

    def test_action_needs_caption_and_scene_object(self):
        for field, path in (("cueId", "$.scenes[0].beats[0].cueId"), ("targetId", "$.scenes[0].beats[0].targetId")):
            plan = kitchen_plan()
            plan["scenes"][0]["beats"][0][field] = "undeclared"
            self.assertInvalidAt(plan, path)

    def test_beat_out_of_cue_and_quantization_boundary(self):
        plan = kitchen_plan()
        plan["scenes"][0]["beats"][0]["at"] = 0
        self.assertInvalidAt(plan, "$.scenes[0].beats[0].at")
        plan["scenes"][0]["beats"][0]["at"] = 0.08
        self.assertTrue(VALIDATOR.validate_storyboard(plan)["valid"])
        plan["scenes"][0]["beats"][0]["at"] = 4.1
        self.assertInvalidAt(plan, "$.scenes[0].beats[0].at")

    def test_gap_overlap_and_minimum_scene_duration(self):
        for change in (4.2, 4.0, 8.0):
            plan = kitchen_plan()
            plan["scenes"][1]["start"] = change
            self.assertInvalidAt(plan, "$.scenes[1].start")
        plan = kitchen_plan()
        plan["scenes"][0]["end"] = 0.7
        self.assertInvalidAt(plan, "$.scenes[0].end")

    def test_caption_overlap_and_oversized_text(self):
        plan = kitchen_plan()
        plan["captions"][1]["start"] = 3.9
        self.assertInvalidAt(plan, "$.captions[1].start")
        plan = kitchen_plan()
        plan["objects"][0]["label"] = "字" * 17
        self.assertInvalidAt(plan, "$.objects[0].label")
        plan = kitchen_plan()
        plan["captions"][0]["text"] = "字" * 55
        self.assertInvalidAt(plan, "$.captions[0].text")

    def test_pending_raw_and_missing_media_production_rejected_draft_warns(self):
        plan = kitchen_plan()
        plan["source"] = {"type": "raw-presenter", "roughcut": "pending"}
        plan["media"]["voice"] = None
        plan["timing"] = "estimated"
        for path in ("$.source.roughcut", "$.media.presenter", "$.media.voice", "$.timing"):
            self.assertInvalidAt(plan, path)
        draft = VALIDATOR.validate_storyboard(plan, "draft")
        self.assertTrue(draft["valid"], draft)
        self.assertGreaterEqual(len(draft["warnings"]), 5)

    def test_chatcut_completed_state_and_digital_exemption(self):
        plan = kitchen_plan()
        plan["media"]["presenter"] = "media/presenter.mp4"
        plan["source"] = {"type": "roughcut-presenter", "roughcut": "done"}
        self.assertInvalidAt(plan, "$.source.tool")
        plan["source"]["tool"] = "ChatCut"
        self.assertTrue(VALIDATOR.validate_storyboard(plan)["valid"])
        plan["source"] = {"type": "digital-human", "roughcut": "skipped-digital"}
        self.assertTrue(VALIDATOR.validate_storyboard(plan)["valid"])

    def test_metric_finite_percentage_and_total(self):
        for metric, error_key in (({"value": float("inf"), "unit": "个"}, "value"), ({"value": 110, "unit": "%"}, "value"), ({"value": 4, "total": 3, "unit": "个"}, "value"), ({"value": 0, "total": 0, "unit": "个"}, "total")):
            plan = kitchen_plan()
            plan["scenes"][0]["mechanism"] = "metric-build"
            plan["scenes"][0]["beats"][0]["action"] = "count"
            plan["scenes"][0]["metric"] = metric
            self.assertInvalidAt(plan, "$.scenes[0].metric." + error_key)

    def test_portable_path_escapes(self):
        unsafe = ("../x.wav", "media/../x.wav", "/x.wav", "C:/x.wav", "C:x.wav", "media\\x.wav", "https://example.org/x.wav", "//server/x.wav", "media//x.wav", "media/./x.wav", "media/NUL.wav", "media/trailing./x.wav", "media/x.wav ")
        for path in unsafe:
            with self.subTest(path=path):
                plan = kitchen_plan()
                plan["media"]["voice"] = path
                self.assertInvalidAt(plan, "$.media.voice")

    def test_asset_source_required_only_in_production(self):
        plan = kitchen_plan()
        plan["assets"] = [{"id": "photo", "path": "media/photo.svg", "role": "evidence"}]
        self.assertInvalidAt(plan, "$.assets[0].source")
        self.assertTrue(VALIDATOR.validate_storyboard(plan, "draft")["valid"])

    def test_extension_preserved_warning_and_malformed_types_do_not_crash(self):
        plan = kitchen_plan()
        plan["future"] = {"camera": 3}
        before = copy.deepcopy(plan)
        result = VALIDATOR.validate_storyboard(plan)
        self.assertTrue(result["valid"])
        self.assertTrue(any(w["path"] == "$.future" for w in result["warnings"]))
        self.assertEqual(before, plan)
        for mutate in (
            lambda p: p["source"].update(type=[]),
            lambda p: p["scenes"][0].update(mechanism={}),
            lambda p: p["scenes"][0]["beats"][0].update(action=[]),
            lambda p: p["scenes"][0].update(objectIds=[{}]),
            lambda p: p.update(scenes=[None]),
        ):
            plan = kitchen_plan()
            mutate(plan)
            self.assertFalse(VALIDATOR.validate_storyboard(plan)["valid"])


class StoryboardCompilerTests(unittest.TestCase):
    def setUp(self):
        temporary = tempfile.TemporaryDirectory(prefix="storyboard-test-")
        self.addCleanup(temporary.cleanup)
        self.base = Path(temporary.name)
        self.template = self.base / "template"
        (self.template / "src").mkdir(parents=True)
        (self.template / "package.json").write_text('{"name":"synthetic-template"}', encoding="utf-8")
        (self.template / "src" / "episode.json").write_text('{"template":"replace me"}', encoding="utf-8")
        (self.template / "src" / "index.ts").write_text("// synthetic test template, not a renderer", encoding="utf-8")
        self.media = self.base / "media-root"
        (self.media / "media").mkdir(parents=True)
        (self.media / "media" / "voice.wav").write_bytes(b"synthetic file bytes; codec validation is a separate stage")
        self.input = self.base / "plan.json"
        self.output = self.base / "new-project"
        self.save(kitchen_plan())

    def save(self, plan):
        self.input.write_text(json.dumps(plan, ensure_ascii=False), encoding="utf-8")

    def build(self, **kwargs):
        return COMPILER.compile_storyboard(self.input, self.output, self.media, template_root=self.template, **kwargs)

    def test_compile_preserves_dynamic_json_extensions_media_and_provenance(self):
        plan = research_plan(19)
        plan["future"] = {"lighting": "soft"}
        self.save(plan)
        result = self.build()
        self.assertTrue(result["validation"]["valid"])
        actual = json.loads((self.output / "src" / "episode.json").read_text(encoding="utf-8"))
        self.assertEqual(actual, {**plan, "renderMode": "production"})
        self.assertEqual((self.output / "public" / "media" / "voice.wav").read_bytes(), (self.media / "media" / "voice.wav").read_bytes())
        report_text = (self.output / "BUILD_REPORT.json").read_text(encoding="utf-8")
        report = json.loads(report_text)
        self.assertEqual(report["sourceJson"]["sha256"], hashlib.sha256(self.input.read_bytes()).hexdigest())
        self.assertNotIn(str(self.base), report_text)
        self.assertFalse((self.output / "node_modules").exists())

    def test_invalid_plan_writes_nothing(self):
        plan = kitchen_plan()
        plan["scenes"][0]["mechanism"] = "unknown"
        self.save(plan)
        result = self.build()
        self.assertFalse(result["validation"]["valid"])
        self.assertFalse(self.output.exists())

    def test_missing_or_empty_media_writes_nothing_even_in_draft(self):
        for data in (None, b""):
            voice = self.media / "media" / "voice.wav"
            if data is None:
                voice.unlink()
            else:
                voice.write_bytes(data)
            with self.assertRaises(COMPILER.CompileError):
                self.build(draft=True)
            self.assertFalse(self.output.exists())

    def test_draft_flag_is_stamped_even_with_complete_inputs(self):
        self.build(draft=True)
        result = json.loads((self.output / "src" / "episode.json").read_text(encoding="utf-8"))
        self.assertEqual(result["renderMode"], "draft")

    def test_nonempty_destination_no_overwrite(self):
        self.output.mkdir()
        original = self.output / "keep.txt"
        original.write_bytes(b"important existing bytes")
        with self.assertRaises(COMPILER.CompileError):
            self.build()
        self.assertEqual(original.read_bytes(), b"important existing bytes")
        self.assertEqual(list(self.output.iterdir()), [original])

    def test_empty_existing_destination_and_repeat_guard(self):
        self.output.mkdir()
        self.build()
        with self.assertRaises(COMPILER.CompileError):
            self.build()

    def test_protected_source_ancestor_and_skill_destination(self):
        for destination in (self.template, self.base, REPO / "unsafe-new-project"):
            self.output = destination
            with self.assertRaises(COMPILER.CompileError):
                self.build()
        self.assertFalse((REPO / "unsafe-new-project").exists())

    def test_media_template_collision_preflight(self):
        target = self.template / "public" / "media"
        target.mkdir(parents=True)
        (target / "voice.wav").write_bytes(b"bundled sample")
        with self.assertRaises(COMPILER.CompileError):
            self.build()
        self.assertFalse(self.output.exists())

    def test_shared_media_is_copied_once(self):
        plan = kitchen_plan()
        plan["media"]["music"] = plan["media"]["voice"]
        self.save(plan)
        self.build()
        report = json.loads((self.output / "BUILD_REPORT.json").read_text(encoding="utf-8"))
        self.assertEqual(len(report["media"]), 1)
        self.assertEqual(len(report["media"][0]["references"]), 2)

    def test_source_changed_after_preflight_no_write(self):
        plan = COMPILER.prepare_build(self.input, self.output, self.media, template_root=self.template)
        (self.media / "media" / "voice.wav").write_bytes(b"changed after snapshot")
        with self.assertRaises(COMPILER.CompileError):
            COMPILER.execute_build(plan)
        self.assertFalse(self.output.exists())

    def make_symlink(self, link, target, directory=False):
        try:
            link.symlink_to(target, target_is_directory=directory)
        except (OSError, NotImplementedError) as exc:
            self.skipTest(f"OS cannot create test symlinks: {exc}")

    def test_symlink_media_rejected(self):
        voice = self.media / "media" / "voice.wav"
        voice.unlink()
        outside = self.base / "outside.wav"
        outside.write_bytes(b"must not be copied")
        self.make_symlink(voice, outside)
        with self.assertRaises(COMPILER.CompileError):
            self.build()
        self.assertFalse(self.output.exists())

    def test_symlink_output_ancestor_rejected(self):
        actual = self.base / "actual"
        actual.mkdir()
        link = self.base / "link"
        self.make_symlink(link, actual, True)
        self.output = link / "new"
        with self.assertRaises(COMPILER.CompileError):
            self.build()
        self.assertFalse((actual / "new").exists())

    def test_windows_reparse_attribute_detected(self):
        class ReparsePath:
            def is_symlink(self):
                return False
            def lstat(self):
                return type("Info", (), {"st_file_attributes": 0x400})()
        self.assertTrue(COMPILER.is_link(ReparsePath()))

    def test_cli_json_diagnostics_from_unrelated_working_directory(self):
        plan = kitchen_plan()
        plan["source"] = {"type": "raw-presenter", "roughcut": "pending"}
        self.save(plan)
        result = subprocess.run([sys.executable, "-X", "utf8", str(REPO / "scripts" / "validate_storyboard.py"), str(self.input), "--json"], cwd=self.base, capture_output=True, text=True, encoding="utf-8", check=False)
        self.assertEqual(result.returncode, 1, result.stderr)
        self.assertIn("$.source.roughcut", [entry["path"] for entry in json.loads(result.stdout)["errors"]])
        compile_result = subprocess.run([sys.executable, "-X", "utf8", str(REPO / "scripts" / "compile_storyboard.py"), "--input", str(self.input), "--out", str(self.output)], cwd=self.base, capture_output=True, text=True, encoding="utf-8", check=False)
        self.assertEqual(compile_result.returncode, 1)
        self.assertIn("$.source.roughcut", compile_result.stderr)
        self.assertFalse(self.output.exists())

    def test_duplicate_json_key_rejected(self):
        self.input.write_text('{"version":2,"version":1}', encoding="utf-8")
        with self.assertRaises(COMPILER.CompileError):
            self.build()
        self.assertFalse(self.output.exists())


if __name__ == "__main__":
    unittest.main()
