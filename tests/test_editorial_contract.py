"""Public editorial data is portable, time-local, and validated before compilation."""
from __future__ import annotations

import copy
import importlib.util
from pathlib import Path
import unittest

REPO = Path(__file__).resolve().parents[1]
SPEC = importlib.util.spec_from_file_location("editorial_validator", REPO / "scripts" / "validate_storyboard.py")
VALIDATOR = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(VALIDATOR)


def plan(duration=12.8, topic="种子如何长成幼苗"):
    return {
        "version": 2, "title": topic, "width": 1080, "height": 1920, "fps": 30,
        "duration": duration, "timing": "measured",
        "source": {"type": "digital-human", "roughcut": "skipped-digital"},
        "media": {"presenter": "media/speaker.mp4", "voice": "media/voice.wav"},
        "assets": [{"id": name, "path": f"media/{name}.svg", "role": "illustration", "source": "Original synthetic test asset"} for name in ("seed", "sprout", "pot")],
        "objects": [], "captions": [{"id": "c1", "start": 0, "end": duration, "text": "先看种子，再看它发芽后的样子。"}],
        "scenes": [{
            "id": "s1", "start": 0, "end": duration, "cueIds": ["c1"], "intent": "让种子的变化可以看见",
            "mechanism": "compare-pan", "title": "", "objectIds": [], "beats": [], "transition": "window", "presenter": "pip",
            "presenterStyle": {"shape": "portrait", "x": 24, "y": 678, "w": 126, "h": 165, "rotation": -3, "radius": 18},
            "editorial": {"background": "paper", "layers": [{
                "id": "hero", "assetId": "seed", "x": 90, "y": 290, "w": 220, "h": 260,
                "rotation": -5, "shadow": True, "foreground": False,
                "keys": [{"at": -.4, "x": -220, "opacity": 0}, {"at": .2, "x": 90, "opacity": 1}, {"at": duration - .5, "x": 240, "rotation": 0}],
            }], "camera": [{"at": -.3, "x": 200, "y": 420, "z": 2.4}, {"at": 1.1, "x": 270, "y": 447, "z": 1}]},
            "transitionAnchor": {"space": "layer", "layerId": "hero", "rect": {"x": 20, "y": 100, "w": 160, "h": 100}, "start": duration - .3, "duration": .3, "borderRadius": 6},
        }],
    }


class EditorialContractTests(unittest.TestCase):
    def invalid_at(self, data, path):
        result = VALIDATOR.validate_storyboard(data)
        self.assertFalse(result["valid"], result)
        self.assertTrue(any(error["path"] == path for error in result["errors"]), result)

    def test_new_topics_durations_and_scene_count_need_no_generic_glyph_objects(self):
        for duration, title in ((10.4, "种子发芽"), (14.2, "相机镜头里的光线"), (31.7, "处理厨房排水问题")):
            data = plan(duration, title)
            result = VALIDATOR.validate_storyboard(data)
            self.assertTrue(result["valid"], result)
            self.assertEqual([], result["warnings"], result)

    def test_local_keys_remain_local_after_scene_start_changes(self):
        data = plan(12)
        scene = data["scenes"][0]
        scene.update(start=4, end=12)
        scene["editorial"]["layers"][0]["keys"][-1]["at"] = 7.5
        scene["transitionAnchor"]["start"] = 7.7
        data["scenes"].insert(0, {"id": "intro", "start": 0, "end": 4, "cueIds": ["c1"], "intent": "先让讲解者出场", "mechanism": "presenter", "title": "", "objectIds": [], "beats": [], "transition": "cut", "presenter": "full", "editorial": {"background": "paper", "layers": []}})
        self.assertTrue(VALIDATOR.validate_storyboard(data)["valid"])
        scene["editorial"]["layers"][0]["keys"][-1]["at"] = 11.5
        self.invalid_at(data, "$.scenes[1].editorial.layers[0].keys[2].at")

    def test_negative_preroll_within_supported_range(self):
        data = plan()
        data["scenes"][0]["editorial"]["layers"][0]["keys"][0]["at"] = -1.5
        self.assertTrue(VALIDATOR.validate_storyboard(data)["valid"])
        data["scenes"][0]["editorial"]["layers"][0]["keys"][0]["at"] = -1.51
        self.invalid_at(data, "$.scenes[0].editorial.layers[0].keys[0].at")

    def test_missing_assets_and_duplicate_layer_ids(self):
        data = plan()
        data["scenes"][0]["editorial"]["layers"][0]["assetId"] = "private-missing"
        self.invalid_at(data, "$.scenes[0].editorial.layers[0].assetId")
        data = plan()
        data["scenes"][0]["editorial"]["layers"].append(copy.deepcopy(data["scenes"][0]["editorial"]["layers"][0]))
        self.invalid_at(data, "$.scenes[0].editorial.layers[1].id")

    def test_unsorted_and_duplicate_keys_are_rejected(self):
        for bad in (-.8, -.4):
            data = plan()
            data["scenes"][0]["editorial"]["layers"][0]["keys"][1]["at"] = bad
            self.invalid_at(data, "$.scenes[0].editorial.layers[0].keys[1].at")
        data = plan()
        data["scenes"][0]["editorial"]["camera"][1]["at"] = -.5
        self.invalid_at(data, "$.scenes[0].editorial.camera[1].at")

    def test_nonfinite_and_nonpositive_motion_values_are_rejected(self):
        for field, value in (("x", float("nan")), ("y", float("inf")), ("w", 0), ("scale", -1), ("opacity", 1.2), ("shadow", "true"), ("foreground", 1)):
            data = plan()
            data["scenes"][0]["editorial"]["layers"][0][field] = value
            self.invalid_at(data, f"$.scenes[0].editorial.layers[0].{field}")
        data = plan()
        data["scenes"][0]["editorial"]["camera"][0]["z"] = 0
        self.invalid_at(data, "$.scenes[0].editorial.camera[0].z")

    def test_surface_anchor_requires_existing_layer_and_in_bounds_rectangle(self):
        data = plan()
        data["scenes"][0]["transitionAnchor"]["layerId"] = "wrong"
        self.invalid_at(data, "$.scenes[0].transitionAnchor.layerId")
        data = plan()
        data["scenes"][0]["transitionAnchor"]["rect"]["w"] = 400
        self.invalid_at(data, "$.scenes[0].transitionAnchor.rect")
        data = plan()
        data["scenes"][0]["transitionAnchor"]["rect"]["x"] = -1
        self.invalid_at(data, "$.scenes[0].transitionAnchor.rect.x")

    def test_screen_anchor_and_transition_boundary(self):
        data = plan()
        anchor = data["scenes"][0]["transitionAnchor"]
        anchor.update(space="screen", rect={"x": 329, "y": 698, "w": 8, "h": 8})
        del anchor["layerId"]
        self.assertTrue(VALIDATOR.validate_storyboard(data)["valid"])
        anchor["duration"] = .8
        self.invalid_at(data, "$.scenes[0].transitionAnchor.duration")
        anchor["duration"] = .3
        data["scenes"][0]["transition"] = "cut"
        self.invalid_at(data, "$.scenes[0].transitionAnchor")

    def test_variable_film_frame_count_and_repeat_assets(self):
        for ids in (["seed", "seed"], ["seed", "sprout", "pot", "seed"], ["seed"] * 12):
            data = plan()
            data["scenes"][0]["editorial"]["filmstrip"] = {"assetIds": ids, "x": -15, "y": 489, "w": 570, "h": 166, "rotation": -5, "enterAt": -.1, "settleAt": .4, "threadAt": .5, "threadEnd": 1.3}
            self.assertTrue(VALIDATOR.validate_storyboard(data)["valid"])
        data["scenes"][0]["editorial"]["filmstrip"]["assetIds"] = ["seed", "missing"]
        self.invalid_at(data, "$.scenes[0].editorial.filmstrip.assetIds[1]")

    def test_film_intervals_cannot_be_empty_reversed_or_past_scene(self):
        for field, value, path in (("settleAt", 1, "settleAt"), ("threadEnd", 2, "threadEnd"), ("threadEnd", 99, "threadEnd")):
            data = plan()
            strip = {"assetIds": ["seed", "sprout"], "x": 0, "y": 490, "w": 540, "h": 166, "enterAt": 1, "settleAt": 1.5, "threadAt": 2, "threadEnd": 3}
            strip[field] = value
            data["scenes"][0]["editorial"]["filmstrip"] = strip
            self.invalid_at(data, f"$.scenes[0].editorial.filmstrip.{path}")

    def test_connections_and_evidence_are_validated(self):
        data = plan()
        editorial = data["scenes"][0]["editorial"]
        editorial["connections"] = [{"id": "route", "points": [{"x": 180, "y": 390}, {"x": 270, "y": 250}, {"x": 390, "y": 390}], "start": .2, "end": .8, "color": "#ee4767", "width": 4}]
        editorial["evidence"] = {"assetId": "sprout", "title": "生长记录", "note": "3天", "noteAt": 1.1, "lensStrength": 138}
        self.assertTrue(VALIDATOR.validate_storyboard(data)["valid"])
        editorial["connections"][0]["end"] = .1
        self.invalid_at(data, "$.scenes[0].editorial.connections[0].end")
        editorial["connections"][0]["end"] = .8
        editorial["evidence"]["noteAt"] = 99
        self.invalid_at(data, "$.scenes[0].editorial.evidence.noteAt")
        editorial["evidence"]["assetId"] = "missing"
        self.invalid_at(data, "$.scenes[0].editorial.evidence.assetId")

    def test_empty_editorial_only_allows_full_presenter(self):
        data = plan()
        del data["scenes"][0]["transitionAnchor"]
        data["scenes"][0]["editorial"]["layers"] = []
        self.invalid_at(data, "$.scenes[0].editorial")
        data["scenes"][0]["presenter"] = "full"
        self.assertTrue(VALIDATOR.validate_storyboard(data)["valid"])

    def test_presenter_geometry_and_unknown_typo_diagnostics(self):
        data = plan()
        data["scenes"][0]["presenterStyle"]["w"] = 0
        self.invalid_at(data, "$.scenes[0].presenterStyle.w")
        data = plan()
        data["scenes"][0]["editorial"]["layers"][0]["rotatoin"] = 12
        report = VALIDATOR.validate_storyboard(data)
        self.assertTrue(report["valid"])
        self.assertTrue(any(issue["path"].endswith("rotatoin") for issue in report["warnings"]))

    def test_malformed_optional_objects_do_not_crash_validation(self):
        for key, value in (("editorial", []), ("presenterStyle", True), ("transitionAnchor", [1])):
            data = plan()
            data["scenes"][0][key] = value
            self.invalid_at(data, "$.scenes[0]." + key)

    def test_without_editorial_existing_mechanism_requirements_still_apply(self):
        data = plan()
        del data["scenes"][0]["editorial"]
        del data["scenes"][0]["transitionAnchor"]
        self.invalid_at(data, "$.scenes[0].objectIds")
        self.invalid_at(data, "$.scenes[0].beats")

    def test_title_keys_follow_local_narration_and_validate_order_text_bounds(self):
        data = plan()
        editorial = data["scenes"][0]["editorial"]
        editorial.update(title="还只是种子", eyebrow="生长记录", titleKeys=[{"at": -.2, "title": "还只是种子"}, {"at": 1.4, "title": "已经发芽", "eyebrow": "继续观察"}])
        self.assertTrue(VALIDATOR.validate_storyboard(data)["valid"])
        for field, value, path in (("at", -.3, "at"), ("at", 99, "at"), ("at", float("nan"), "at"), ("title", 123, "title"), ("title", "字" * 41, "title"), ("eyebrow", True, "eyebrow")):
            changed = copy.deepcopy(data)
            changed["scenes"][0]["editorial"]["titleKeys"][1][field] = value
            self.invalid_at(changed, f"$.scenes[0].editorial.titleKeys[1].{path}")


if __name__ == "__main__":
    unittest.main()
