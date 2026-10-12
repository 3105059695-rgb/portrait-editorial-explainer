"""Contract and portability checks for the source-grounded renderer."""
import copy
import importlib.util
import json
from pathlib import Path
import tempfile
import unittest

ROOT=Path(__file__).resolve().parents[1]
spec=importlib.util.spec_from_file_location('source_episode',ROOT/'scripts/source_episode.py')
m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)

class SourceEpisodeTests(unittest.TestCase):
    def setUp(self):
        self.p=m.load(ROOT/'examples/source-style/token-calibration.json')
    def bad(self,p):
        with self.assertRaises(m.Invalid): m.validate(p)
    def test_examples_validate(self):
        for path in (ROOT/'examples/source-style').glob('*.json'):
            with self.subTest(path=path.name): m.validate(m.load(path),media_dir=ROOT/'examples/source-style/media')
    def test_nan_rejected(self):
        self.p['duration']=float('nan');self.bad(self.p)
    def test_opening_minimum(self):
        self.p['sample']['duration']=9.9;self.bad(self.p)
    def test_unknown_field_rejected(self):
        self.p['fixedTopic']='career';self.bad(self.p)
    def test_unknown_effect_rejected(self):
        self.p['scenes'][0]['mechanism']='magic';self.bad(self.p)
    def test_mark_order(self):
        self.p['scenes'][0]['marks']['resolve']=.2;self.bad(self.p)
    def test_caption_overlap(self):
        self.p['captions'][1]['start']=0;self.bad(self.p)
    def test_result_cue_is_local_plus_start(self):
        s=self.p['scenes'][0];s['markCues']={'resolve':'c1'};self.bad(self.p)
        s['markCues']={'resolve':'c3'};m.validate(self.p)
    def test_transition_overlap_exact(self):
        p=m.load(ROOT/'examples/source-style/comic-calibration.json')
        p['scenes'][1]['start']+=.2
        with self.assertRaisesRegex(m.Invalid,'overlap'):m.validate(p,media_dir=ROOT/'examples/source-style/media')
    def test_no_silent_poster_truncation(self):
        p=m.load(ROOT/'examples/source-style/travel-opening.json');s=p['scenes'][0]
        s['content']['items']*=2
        with self.assertRaisesRegex(m.Invalid,'3..5'):m.validate(p,media_dir=ROOT/'examples/source-style/media')
    def test_path_escape(self):
        for value in ('../voice.wav','C:/secret.wav','https://site/voice.wav','/tmp/voice.wav','foo//bar.png'):
            with self.subTest(value=value),self.assertRaises(m.Invalid):m.relative(value)
    def test_demo_not_production(self):
        with self.assertRaises(m.Invalid):m.validate(self.p,production=True)
    def test_missing_asset(self):
        self.p['media']['voice']='missing.wav'
        with tempfile.TemporaryDirectory() as d, self.assertRaisesRegex(m.Invalid,'Missing/empty'):m.validate(self.p,media_dir=d)
    def test_build_and_preserve_existing(self):
        with tempfile.TemporaryDirectory() as d:
            dest=Path(d)/'project'
            result=m.build(ROOT/'examples/source-style/token-calibration.json',dest)
            self.assertTrue((dest/'validate_episode.py').is_file())
            self.assertEqual(result['styleApproval'],'pending')
            sentinel=dest/'important.txt';sentinel.write_text('keep')
            with self.assertRaises(m.Invalid):m.build(ROOT/'examples/source-style/token-calibration.json',dest)
            self.assertEqual(sentinel.read_text(),'keep')
    def test_portable_media_hash_and_copy(self):
        with tempfile.TemporaryDirectory() as d:
            dest=Path(d)/'project'
            result=m.build(ROOT/'examples/source-style/travel-opening.json',dest,ROOT/'examples/source-style/media')
            self.assertTrue(result['assets'])
            for item in result['assets']:
                self.assertEqual(m.hashlib.sha256((dest/'public'/item['path']).read_bytes()).hexdigest(),item['sha256'])
            self.assertNotIn(str(ROOT),json.dumps(result))

class UICompositionTests(unittest.TestCase):
    def setUp(self):
        self.p=m.load(ROOT/'examples/source-style/ui-research-opening.json')
        self.ui=self.p['scenes'][0]['content']['ui']
        self.media=ROOT/'examples/source-style/media'
    def test_authored_marks_not_a_fixed_story(self):
        self.p['scenes'][0]['marks']={'custom-purpose':4,'resolve':9}
        m.validate(self.p,media_dir=self.media)
    def test_unknown_track_cannot_silently_do_nothing(self):
        self.ui['tracks'][0]['nodeId']='missing'
        with self.assertRaisesRegex(m.Invalid,'nodeId'): m.validate(self.p,media_dir=self.media)
    def test_partial_keys_cannot_change_identity(self):
        self.ui['tracks'][0]['frames'][0]['set']['id']='new'
        with self.assertRaisesRegex(m.Invalid,'unknown keys'): m.validate(self.p,media_dir=self.media)
    def test_out_of_scene_camera_and_node_keys(self):
        for target in (self.ui['camera'][-1],self.ui['tracks'][0]['frames'][-1]):
            old=target['at'];target['at']=16
            with self.assertRaises(m.Invalid): m.validate(self.p,media_dir=self.media)
            target['at']=old
    def test_state_image_is_included_in_portable_assets(self):
        self.ui['tracks'].append({'nodeId':'thumba','frames':[{'at':5,'set':{'image':'illustrations/page-9.svg'}}]})
        self.assertIn('illustrations/page-9.svg',m.validate(self.p,media_dir=self.media))
        self.ui['tracks'][-1]['frames'][0]['set']['image']='../private.png'
        with self.assertRaises(m.Invalid):m.validate(self.p,media_dir=self.media)
    def test_chart_requires_finite_supplied_values(self):
        self.ui['nodes'].append({'id':'chart','type':'chart','x':10,'y':10,'w':90,'h':90,'points':[1,float('nan')]})
        with self.assertRaisesRegex(m.Invalid,'finite data'):m.validate(self.p,media_dir=self.media)
    def test_resolve_is_last_semantic_event(self):
        self.p['scenes'][0]['marks']['late']=14
        with self.assertRaisesRegex(m.Invalid,'last semantic'):m.validate(self.p,media_dir=self.media)

if __name__=='__main__':unittest.main()
