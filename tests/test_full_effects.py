"""Meaningful contracts for the expanded library and portable handoff."""
from pathlib import Path
import copy
import json
import subprocess
import sys
import tempfile
import unittest

ROOT=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT/'scripts'))
import effect_library as library
import source_episode as compiler

class FullEffectsTests(unittest.TestCase):
    def setUp(self):
        self.plan=library.catalog()
        self.media=ROOT/'examples/full-effects/media'

    def test_every_catalog_entry_exists_and_validates_in_both_aspects(self):
        self.assertEqual(len(self.plan['scenes']),40)
        self.assertEqual(len({s['mechanism'] for s in self.plan['scenes']}),40)
        self.assertEqual(set(compiler.PACK_EFFECTS),{r[0] for r in library.ROWS}-{'token-intake'})
        for width,height in [(540,960),(544,720)]:
            p=copy.deepcopy(self.plan);p.update(width=width,height=height)
            self.assertEqual(len(compiler.validate(p,media_dir=self.media)),4)

    def test_composer_keeps_new_subject_selected_object_count_and_camera(self):
        content={'items':[{'id':str(i),'label':f'物件{i}','value':i*9} for i in range(7)],'selectedId':'5','values':[5,8,13,21,34,55,89]}
        shot={'effect':'object-array-flip','title':'重新归组','duration':5.8,'content':content,'camera':[{'at':0,'x':180,'y':360,'scale':1.2},{'at':4,'x':300,'y':500,'scale':.9}]}
        p=library.compose({'title':'与目录不同的输入','shots':[shot,dict(shot,title='再次选择',effect='reference-search')]})
        compiler.validate(p)
        self.assertEqual(p['scenes'][0]['content'],content)
        self.assertEqual(p['scenes'][0]['camera'],shot['camera'])
        self.assertNotEqual([s['mechanism'] for s in p['scenes']],[s['mechanism'] for s in self.plan['scenes'][:2]])

    def test_video_asset_is_copied_and_uses_relative_reference(self):
        with tempfile.TemporaryDirectory() as d:
            plan=Path(d)/'plan.json';plan.write_text(json.dumps(self.plan,ensure_ascii=False),encoding='utf-8')
            dest=Path(d)/'app';report=compiler.build(plan,dest,self.media)
            self.assertEqual((dest/'public/media-sample.mp4').read_bytes(),(self.media/'media-sample.mp4').read_bytes())
            self.assertTrue((dest/'public/sfx/whoosh.wav').is_file())
            self.assertTrue((dest/'src/effects/IllustratedPack.tsx').is_file())
            self.assertEqual(len(report['assets']),4)
            self.assertNotIn(str(ROOT),(dest/'src/episode.json').read_text(encoding='utf-8'))

    def test_invalid_camera_sound_and_media_rate_fail_early(self):
        for field,bad in [('camera',[{'at':0,'x':0,'y':0,'scale':0}]),('sounds',[{'at':1,'name':'missing'}])]:
            p=copy.deepcopy(self.plan);p['scenes'][0][field]=bad
            with self.assertRaises(compiler.Invalid):compiler.validate(p,media_dir=self.media)
        p=copy.deepcopy(self.plan);p['scenes'][0]['content']['items'][0]['playbackRate']=0
        with self.assertRaises(compiler.Invalid):compiler.validate(p,media_dir=self.media)

    def test_public_entry_routes_v3_without_falling_back_to_old_case(self):
        with tempfile.TemporaryDirectory() as d:
            dest=Path(d)/'app'
            r=subprocess.run([sys.executable,str(ROOT/'scripts/new_project.py'),'--input',str(ROOT/'examples/full-effects/catalog.json'),'--media-dir',str(self.media),'--out',str(dest),'--draft'],capture_output=True,text=True,encoding='utf-8')
            self.assertEqual(r.returncode,0,r.stderr)
            p=json.loads((dest/'src/episode.json').read_text(encoding='utf-8'))
            self.assertEqual(p,self.plan)

if __name__=='__main__':unittest.main()
