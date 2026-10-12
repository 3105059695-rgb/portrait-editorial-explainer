"""Author-facing effect recipes must remain runnable and truthful about inputs."""
from pathlib import Path
import copy
import json
import subprocess
import sys
import tempfile
import unittest

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'scripts'))
import effect_library as library
import effect_recipes as recipes
import source_episode as compiler


class EffectRecipesTests(unittest.TestCase):
    def cli(self, *args):
        return subprocess.run([sys.executable, str(ROOT / 'scripts/effect_library.py'), *args],
                              capture_output=True, text=True, encoding='utf-8')

    def test_all_effects_have_media_free_runnable_recipes(self):
        self.assertEqual(set(recipes.SPECS), set(compiler.EFFECTS))
        for effect in compiler.EFFECTS:
            with self.subTest(effect=effect):
                recipe = recipes.describe(effect)
                shot = recipe['shot']
                self.assertEqual(shot['effect'], effect)
                # Each shot is independently usable within an ordinary >=10s brief.
                plan = library.compose({'title': '用途演示', 'shots': [copy.deepcopy(shot) for _ in range(3)]})
                self.assertEqual(compiler.validate(plan), [])
                self.assertEqual(recipe['marks']['required'], compiler.EFFECTS[effect])
                self.assertTrue(all((ROOT / path).is_file() for path in recipe['references']))
                required = recipe['content_fields']['required']
                self.assertTrue(set(required) <= set(shot['content']))
                self.assertIn('演示', recipe['example_notice'])
                serialized = json.dumps(shot, ensure_ascii=False)
                for bad in ('NASA', 'scene-a.jpg', 'media-sample.mp4', 'C:\\', 'E:\\', 'D:\\'):
                    self.assertNotIn(bad, serialized)
                self.assertNotRegex(serialized, r'(?i)bearer\s+[A-Za-z0-9_.-]+')

    def test_free_ui_finishes_at_the_declared_resolve(self):
        shot = recipes.describe('ui-stage')['shot']
        frames = [f['at'] for track in shot['content']['ui']['tracks'] for f in track['frames']]
        self.assertEqual(shot['marks']['resolve'], max(frames))
        self.assertGreater(len(shot['content']['ui']['nodes']), 0)
        self.assertGreater(len(frames), 0)

    def test_known_renderer_caps_are_disclosed(self):
        self.assertEqual(recipes.describe('workflow-route')['items_count']['recommended'][1], 6)
        self.assertIn('前 2 项', recipes.describe('challenge-split')['items_count']['rendering_behavior'])
        self.assertIn('前 9 项', recipes.describe('prompt-substitute')['items_count']['rendering_behavior'])
        self.assertNotIn('columns', recipes.describe('reference-search')['layout_parameters']['content.pack'])
        self.assertIn('depth', recipes.describe('remix-cube')['layout_parameters']['content.pack'])

    def test_describe_cli_and_compose_from_its_json(self):
        r = self.cli('describe', 'reference-search', '--json')
        self.assertEqual(r.returncode, 0, r.stderr)
        recipe = json.loads(r.stdout)
        self.assertEqual(recipe['effect'], 'reference-search')
        self.assertNotIn('code', recipe['shot']['content'])
        self.assertNotIn('metric', recipe['shot']['content'])
        readable = self.cli('describe', 'reference-search')
        self.assertEqual(readable.returncode, 0, readable.stderr)
        self.assertIn('必填（校验要求）', readable.stdout)
        with tempfile.TemporaryDirectory() as directory:
            brief = Path(directory) / 'brief.json'
            plan = Path(directory) / 'episode.json'
            brief.write_text(json.dumps({'shots': [recipe['shot']] * 3}, ensure_ascii=False), encoding='utf-8')
            result = self.cli('compose', str(brief), '--out', str(plan))
            self.assertEqual(result.returncode, 0, result.stderr)
            compiler.validate(json.loads(plan.read_text(encoding='utf-8')))

    def test_unknown_effect_fails_without_traceback_and_search_is_literal(self):
        r = self.cli('describe', 'does-not-exist', '--json')
        self.assertNotEqual(r.returncode, 0)
        self.assertIn('Unknown effect', r.stderr)
        self.assertNotIn('Traceback', r.stderr)
        matched = self.cli('find', '放大镜', '--json')
        self.assertEqual(matched.returncode, 0, matched.stderr)
        self.assertEqual([entry['effect'] for entry in json.loads(matched.stdout)], ['reference-search'])
        empty = self.cli('find', 'no-such-meaning', '--json')
        self.assertEqual(empty.returncode, 0, empty.stderr)
        self.assertEqual(json.loads(empty.stdout), [])

    def test_existing_published_examples_unchanged(self):
        catalog = json.loads((ROOT / 'examples/full-effects/catalog.json').read_text(encoding='utf-8-sig'))
        desk = json.loads((ROOT / 'examples/full-effects/desk-opening.json').read_text(encoding='utf-8-sig'))
        self.assertEqual(library.catalog(), catalog)
        self.assertEqual(library.example(), desk)


if __name__ == '__main__':
    unittest.main()
