"""One-command handoff: measured cue math, honest source state and portability."""
import copy
import json
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest
from unittest.mock import patch

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'scripts'))
import source_episode as compiler
import start_episode as starter


class StartEpisodeTests(unittest.TestCase):
    def setUp(self):
        self.example = ROOT / 'examples/quickstart'
        self.brief = compiler.load(self.example / 'brief.json')
        self.srt = (self.example / 'captions.srt').read_text(encoding='utf-8')
        self.cues = starter.parse_srt(self.srt)

    def test_srt_bom_crlf_multiline_dot_and_original_numbers(self):
        cues = starter.parse_srt('\ufeff7\r\n00:00:00.000 --> 00:00:01,200\r\n第一行\r\n第二行\r\n\r\n42\r\n00:00:01,200 --> 00:00:02.000\r\n紧接上一条\r\n')
        self.assertEqual(cues[0], {'id': 'srt-7', 'start': 0, 'end': 1.2, 'text': '第一行 第二行'})
        self.assertEqual(cues[1]['id'], 'srt-42')

    def test_bad_srt_points_to_cue_and_fix(self):
        cases = [
            '1\n00:00:00,000 --> 00:00:01,000\n好\n\n1\n00:00:01,000 --> 00:00:02,000\n重复',
            '1\n00:00:00,000 --> 00:00:02,000\n好\n\n2\n00:00:01,000 --> 00:00:03,000\n重叠',
            '3\n00:60:00,000 --> 00:60:01,000\n坏时码',
            '4\n00:00:00,000 --> 00:00:01,000\n',
            '5\n00:00:00,000 --> 00:00:01,000\n' + '字' * 43,
            '6\n00:00:01,000 --> 00:00:01,000\n零时长',
        ]
        for value in cases:
            with self.subTest(value=value):
                with self.assertRaisesRegex(compiler.Invalid, r'字幕 \d+:.*请'):
                    starter.parse_srt(value)

    def test_measured_actions_include_incoming_overlap_not_proportions(self):
        plan = starter.make_plan(self.brief, self.cues, draft=True)
        compiler.validate(plan)
        self.assertEqual(plan['scenes'][0]['start'], 0)
        self.assertEqual(plan['scenes'][0]['end'], 4)
        self.assertEqual(plan['scenes'][1]['start'], 3.8)
        self.assertEqual(plan['scenes'][1]['marks'], {'reveal': .9, 'act': 2, 'resolve': 3.7})
        self.assertEqual(plan['scenes'][1]['markCues'], {'reveal': 'srt-4', 'act': 'srt-5', 'resolve': 'srt-6'})
        self.assertEqual(plan['scenes'][2]['start'], 8)
        self.assertEqual(plan['scenes'][2]['enter'], {'type': 'cut', 'duration': 0})
        self.assertEqual(plan['timing'], 'demo')

    def test_missing_actions_unknown_fields_and_bad_samples_fail(self):
        bad = copy.deepcopy(self.brief)
        del bad['shots'][0]['actions']['act']
        with self.assertRaises(compiler.Invalid):
            starter.make_plan(bad, self.cues, draft=True)
        bad = copy.deepcopy(self.brief)
        bad['shots'][0]['randomTheme'] = 'silently ignore me'
        with self.assertRaisesRegex(compiler.Invalid, 'unknown keys'):
            starter.make_plan(bad, self.cues, draft=True)
        for duration in [True, 9, 16, 11.5]:
            bad = copy.deepcopy(self.brief)
            bad['sampleDuration'] = duration
            with self.assertRaises(compiler.Invalid):
                starter.make_plan(bad, self.cues, draft=True)
        bad = copy.deepcopy(self.brief)
        del bad['sampleDuration']
        self.assertEqual(starter.make_plan(bad, self.cues, draft=True)['sample']['duration'], 12)

    def test_action_offset_cannot_escape_cue_or_remove_result_hold(self):
        for offset in [-1.7, 1]:
            bad = copy.deepcopy(self.brief)
            bad['shots'][0]['actions']['resolve']['offset'] = offset
            plan = starter.make_plan(bad, self.cues, draft=True)
            with self.assertRaises(compiler.Invalid):
                compiler.validate(plan)
        bad = copy.deepcopy(self.brief)
        bad['shots'][-1]['actions']['resolve']['edge'] = 'end'
        with self.assertRaisesRegex(compiler.Invalid, 'Leave at least'):
            compiler.validate(starter.make_plan(bad, self.cues, draft=True))

    def test_production_missing_audio_or_srt_leaves_no_output(self):
        with tempfile.TemporaryDirectory() as temporary:
            output = Path(temporary) / 'app'
            with self.assertRaisesRegex(compiler.Invalid, 'srt'):
                starter.start(self.example / 'brief.json', output)
            with self.assertRaisesRegex(compiler.Invalid, 'voice'):
                starter.start(self.example / 'brief.json', output, srt=self.example / 'captions.srt')
            self.assertFalse(output.exists())

    def test_raw_presenter_is_not_automatically_marked_roughcut_done(self):
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            (root / 'presenter.mp4').write_bytes(b'fake-media-only-tests-state-before-probe')
            bad = copy.deepcopy(self.brief)
            bad['source'] = {'type': 'raw-presenter', 'roughcut': 'pending'}
            (root / 'brief.json').write_text(json.dumps(bad), encoding='utf-8')
            with self.assertRaisesRegex(compiler.Invalid, 'ChatCut'):
                starter.start(root / 'brief.json', root / 'app', srt=self.example / 'captions.srt', presenter='presenter.mp4')
            self.assertFalse((root / 'app').exists())
        digital = copy.deepcopy(self.brief)
        digital['source'] = {'type': 'digital-human'}
        source, _ = starter.source_and_media(digital, True)
        self.assertEqual(source['roughcut'], 'skipped-digital')
        source, _ = starter.source_and_media(self.brief, True, presenter='avatar.mp4', source_type='digital-human')
        self.assertEqual(source['roughcut'], 'skipped-digital')
        source, _ = starter.source_and_media(self.brief, True, presenter='raw.mp4', source_type='raw-presenter')
        self.assertNotEqual(source['roughcut'], 'done')

    def test_production_output_has_relative_paths_and_original_srt(self):
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            media = root / 'media'
            media.mkdir()
            audio = media / 'voice.wav'
            audio.write_bytes(b'probe-is-mocked-this-test-checks-portable-paths')
            brief_file = root / 'brief.json'
            brief_file.write_text(json.dumps(self.brief), encoding='utf-8')
            with patch.object(compiler, 'probe_duration', return_value=(12, [{'codec_type': 'audio'}])):
                report = starter.start(brief_file, root / 'app', media_dir=media, srt=self.example / 'captions.srt', voice=audio)
            generated = json.loads((root / 'app/src/episode.json').read_text(encoding='utf-8'))
            self.assertEqual(generated['media'], {'voice': 'voice.wav'})
            self.assertEqual(generated['timing'], 'measured')
            self.assertEqual(report['mode'], 'production')
            self.assertEqual((root / 'app/inputs/captions.srt').read_bytes(), (self.example / 'captions.srt').read_bytes())
            for name in ['START_REPORT.json', 'inputs/brief.json', 'inputs/episode.json']:
                self.assertNotIn(str(root), (root / 'app' / name).read_text(encoding='utf-8'))
            self.assertEqual((root / 'app/public/voice.wav').read_bytes(), audio.read_bytes())

    def test_media_cannot_escape_root_and_existing_output_is_untouched(self):
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            media = root / 'media'
            media.mkdir()
            audio = root / 'outside.wav'
            audio.write_bytes(b'audio')
            with self.assertRaisesRegex(compiler.Invalid, 'media-dir'):
                starter.start(self.example / 'brief.json', root / 'app', media_dir=media, srt=self.example / 'captions.srt', voice=audio, draft=True)
            self.assertFalse((root / 'app').exists())
            existing = root / 'app'
            existing.mkdir()
            (existing / 'keep.txt').write_text('important', encoding='utf-8')
            with self.assertRaisesRegex(compiler.Invalid, '已存在'):
                starter.start(self.example / 'brief.json', existing, draft=True)
            self.assertEqual((existing / 'keep.txt').read_text(encoding='utf-8'), 'important')

    def test_draft_one_command_and_no_srt_compose_route(self):
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            result = subprocess.run([sys.executable, str(ROOT / 'scripts/start_episode.py'), '--brief', str(self.example / 'brief.json'), '--srt', str(self.example / 'captions.srt'), '--out', str(root / 'app'), '--draft'], capture_output=True, text=True, encoding='utf-8')
            self.assertEqual(result.returncode, 0, result.stderr)
            report = json.loads(result.stdout)
            self.assertEqual(report['timing'], 'demo')
            self.assertTrue((root / 'app/package-lock.json').is_file())
            self.assertFalse((root / 'app/node_modules').exists())
            bare = {'title': '没有口播的机制演示', 'sampleDuration': 12, 'shots': [
                {'effect': shot['effect'], 'title': shot['title'], 'duration': 4, 'content': shot['content']}
                for shot in self.brief['shots']]}
            bare_path = root / 'brief.json'
            bare_path.write_text(json.dumps(bare), encoding='utf-8')
            report = starter.start(bare_path, root / 'bare-app', draft=True)
            self.assertEqual(report['timing'], 'demo')
            self.assertEqual(report['cueCount'], 0)


if __name__ == '__main__':
    unittest.main()
