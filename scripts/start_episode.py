#!/usr/bin/env python3
"""Create a portable Remotion project from a brief and phrase-timed SRT.

Production is the default. Use --draft for a clearly labelled, unvoiced demo.
This command does not install packages, download media or run external services.
"""
from __future__ import annotations
import argparse
import copy
import hashlib
import json
from pathlib import Path
import re
import shutil
import sys
import tempfile

import effect_library
import source_episode as compiler

ROOT_FIELDS = {'title', 'width', 'height', 'fps', 'duration', 'sampleDuration',
               'shots', 'media', 'source', 'timing', 'captions'}
SHOT_FIELDS = {'id', 'effect', 'title', 'content', 'intent', 'presenter', 'enter',
               'accent', 'background', 'camera', 'sounds'}
SRT_TIME = re.compile(r'^(\d{2,}):([0-5]\d):([0-5]\d)[,.](\d{3})$')


def srt_error(index, message):
    raise compiler.Invalid(f'字幕 {index}: {message}。请修正该条 SRT，再重新运行。')


def parse_srt(value):
    """Parse existing phrase cues; never fabricate word-level alignment."""
    value = value.lstrip('\ufeff').replace('\r\n', '\n').replace('\r', '\n')
    blocks = re.split(r'\n[ \t]*\n', value.strip())
    cues, seen, previous_end = [], set(), 0.0
    for position, block in enumerate(blocks, 1):
        if not block.strip():
            continue
        lines = [line.strip() for line in block.strip().split('\n')]
        index = lines[0] if lines else f'块 {position}'
        if not re.fullmatch(r'[1-9]\d*', index):
            srt_error(index, '序号必须为正整数；每条字幕之间保留一个空行')
        number = int(index)
        if number in seen:
            srt_error(number, '序号重复；请为每条字幕分配唯一序号')
        if len(lines) < 3:
            srt_error(number, '缺少时码或字幕文字；空白条目应删除')
        parts = re.split(r'\s*-->\s*', lines[1])
        if len(parts) != 2:
            srt_error(number, '时码格式应为 00:00:00,000 --> 00:00:01,000')
        times = []
        for part in parts:
            match = SRT_TIME.fullmatch(part)
            if not match:
                srt_error(number, '非法时码；分秒为 00–59，毫秒为三位，可用逗号或点分隔')
            hours, minutes, seconds, milliseconds = map(int, match.groups())
            times.append(hours * 3600 + minutes * 60 + seconds + milliseconds / 1000)
        start, end = times
        if start >= end:
            srt_error(number, '结束时间必须晚于开始时间')
        if start < previous_end:
            srt_error(number, '与上一条字幕重叠或顺序倒退；请按最终音轨重新对齐')
        caption = ' '.join(line for line in lines[2:] if line)
        if not caption:
            srt_error(number, '字幕文字为空；请补全或删除该条')
        if len(caption) > 42:
            srt_error(number, f'文字有 {len(caption)} 字符，超过 42；请按实际语句拆分并重新对齐')
        cues.append({'id': f'srt-{number}', 'start': start, 'end': end, 'text': caption})
        seen.add(number)
        previous_end = end
    compiler.need(cues, 'SRT 没有字幕；请提供与最终音轨对齐的非空 SRT。')
    return cues


def cue_number(value, location):
    compiler.need(isinstance(value, int) and not isinstance(value, bool) and value > 0,
                  f'{location}: cue 必须为 SRT 的正整数序号。')
    return f'srt-{value}'


def normalize_media_path(value, media_root):
    compiler.need(isinstance(value, str) and value.strip() == value and value,
                  '素材路径必须为非空字符串。')
    path = Path(value).expanduser()
    if not path.is_absolute():
        path = media_root / compiler.relative(value)
    compiler.reject_links(path)
    try:
        relative = path.resolve().relative_to(media_root.resolve()).as_posix()
    except ValueError as exc:
        raise compiler.Invalid('素材必须位于 --media-dir 内；请复制所需素材到工作目录，或选用包含素材的根目录。') from exc
    return compiler.relative(relative)


def normalize_assets(plan, media_root):
    for name, value in list(plan['media'].items()):
        plan['media'][name] = normalize_media_path(value, media_root)
    if plan['source'].get('mapping'):
        plan['source']['mapping'] = normalize_media_path(plan['source']['mapping'], media_root)
    for scene in plan['scenes']:
        content = scene['content']
        compiler.need(isinstance(content, dict) and isinstance(content.get('items'), list),
                      f'{scene["id"]}.content 必须为对象并包含 items 数组。')
        if content.get('avatar'):
            content['avatar'] = normalize_media_path(content['avatar'], media_root)
        for item in content['items']:
            compiler.need(isinstance(item, dict), f'{scene["id"]}.content.items 每项必须为对象。')
            for name in ('image', 'replacementImage', 'video'):
                if name in item:
                    item[name] = normalize_media_path(item[name], media_root)
        ui = content.get('ui', {})
        compiler.need(isinstance(ui, dict), f'{scene["id"]}.content.ui 必须为对象。')
        compiler.need(isinstance(ui.get('nodes', []), list) and isinstance(ui.get('tracks', []), list),
                      f'{scene["id"]}.content.ui 的 nodes/tracks 必须为数组。')
        for node in ui.get('nodes', []):
            compiler.need(isinstance(node, dict), 'UI node 必须为对象。')
            if 'image' in node:
                node['image'] = normalize_media_path(node['image'], media_root)
        for track in ui.get('tracks', []):
            compiler.need(isinstance(track, dict) and isinstance(track.get('frames'), list), 'UI track 需要 frames 数组。')
            for frame in track['frames']:
                compiler.need(isinstance(frame, dict) and isinstance(frame.get('set'), dict), 'UI frame 需要 set 对象。')
                if 'image' in frame['set']:
                    frame['set']['image'] = normalize_media_path(frame['set']['image'], media_root)


def source_and_media(brief, draft, voice=None, presenter=None, source_type=None):
    media = copy.deepcopy(brief.get('media', {}))
    source = copy.deepcopy(brief.get('source', {}))
    compiler.need(isinstance(media, dict), 'brief.media 必须为对象。')
    compiler.need(isinstance(source, dict), 'brief.source 必须为对象。')
    if voice is not None:
        media['voice'] = str(voice)
    if presenter is not None:
        media['presenter'] = str(presenter)
    if source_type is not None:
        source['type'] = source_type
        # Explicitly switching to one of these routes entails no human roughcut.
        # Never manufacture done/mapping for either human-presenter route.
        if source_type in ('digital-human', 'narration'):
            source['roughcut'] = 'skipped-digital' if source_type == 'digital-human' else 'not-needed'
    if 'type' not in source:
        compiler.need(draft or 'presenter' not in media,
                      '请用 source.type 或 --source-type 说明口播是 digital-human、raw-presenter 还是 roughcut-presenter；不能自动把真人素材当数字人。')
        source['type'] = 'narration' if 'voice' in media and 'presenter' not in media else 'demo'
    if 'roughcut' not in source:
        if source['type'] == 'digital-human':
            source['roughcut'] = 'skipped-digital'
        elif source['type'] in ('narration', 'demo'):
            source['roughcut'] = 'not-needed'
        else:
            source['roughcut'] = 'pending'
    if not draft:
        compiler.need(media.get('voice') or media.get('presenter'),
                      '正式工程需要最终配音 --voice 或带声音的口播 --presenter；无声音示例请显式加 --draft。')
    return source, media


def make_plan(brief, cues=None, draft=False, voice=None, presenter=None, source_type=None):
    compiler.keys(brief, ['shots'], ROOT_FIELDS, 'brief')
    compiler.need(isinstance(brief['shots'], list) and brief['shots'], 'brief.shots 必须为非空数组。')
    source, media = source_and_media(brief, draft, voice, presenter, source_type)
    for index, shot in enumerate(brief['shots'], 1):
        additional = {'cueStart', 'actions'} if cues else {'duration', 'marks', 'markCues'}
        required = ['effect', 'title', 'content'] + (['cueStart', 'actions'] if cues else [])
        compiler.keys(shot, required, SHOT_FIELDS | additional, f'shots[{index}]')
        compiler.need(shot['effect'] in compiler.EFFECTS, f'shots[{index}]: 未知 effect {shot["effect"]}。')
    if not cues:
        compiler.need(draft, '正式工程必须提供与最终音轨对齐的 --srt；不能从字数猜测时间。')
        plan = effect_library.compose(brief)
        if 'duration' in brief:
            compiler.need(compiler.number(brief['duration']) and abs(brief['duration'] - plan['duration']) < .001,
                          'brief.duration 与各镜头及转场计算出的总时长不同。')
        if 'sampleDuration' in brief:
            # compose historically clamps this field; the one-command entry must not.
            plan['sample']['duration'] = brief['sampleDuration']
        plan.update(timing='demo', source=source, media=media)
        plan['sample']['reason'] = '演示时序；没有提供实测口播字幕，不声称声音同步。'
        return plan
    compiler.need('captions' not in brief and 'timing' not in brief,
                  '提供 --srt 时请移除 brief.captions/timing；字幕来自 SRT，--draft 决定是否为演示。')
    cue_map = {cue['id']: cue for cue in cues}
    plan = {'version': 3, 'title': brief.get('title', '本期竖屏讲解'),
            'width': brief.get('width', 1080), 'height': brief.get('height', 1920),
            'fps': brief.get('fps', 30), 'duration': brief.get('duration', cues[-1]['end']),
            'timing': 'demo' if draft else 'measured', 'source': source, 'media': media,
            'sample': {}, 'captions': copy.deepcopy(cues), 'scenes': []}
    compiler.need(compiler.number(plan['duration']), 'brief.duration 必须为有限秒数。')
    starts = []
    for index, shot in enumerate(brief['shots'], 1):
        cue_id = cue_number(shot['cueStart'], f'shots[{index}].cueStart')
        compiler.need(cue_id in cue_map, f'shots[{index}].cueStart: 找不到字幕 {shot["cueStart"]}。')
        starts.append(cue_map[cue_id]['start'])
    for index, shot in enumerate(brief['shots']):
        enter = copy.deepcopy(shot.get('enter', {'type': 'cut', 'duration': 0}))
        compiler.keys(enter, ['type', 'duration'], ['type', 'duration', 'x', 'y'], f'shots[{index+1}].enter')
        compiler.need(compiler.number(enter['duration']), f'shots[{index+1}].enter.duration 必须为秒数。')
        start = 0 if index == 0 else round(starts[index] - enter['duration'], 6)
        end = starts[index+1] if index + 1 < len(starts) else plan['duration']
        names = compiler.EFFECTS[shot['effect']]
        actions = shot['actions']
        if shot['effect'] == 'ui-stage':
            compiler.need(isinstance(actions, dict) and 'resolve' in actions, 'ui-stage.actions 至少需要 resolve。')
            names = list(actions)
        compiler.keys(actions, names, names, f'shots[{index+1}].actions')
        marks, mark_cues = {}, {}
        for name in names:
            action = actions[name]
            location = f'shots[{index+1}].actions.{name}'
            compiler.keys(action, ['cue', 'edge'], ['cue', 'edge', 'offset'], location)
            cue_id = cue_number(action['cue'], location)
            compiler.need(cue_id in cue_map, f'{location}: 找不到字幕 {action["cue"]}。')
            compiler.need(action['edge'] in ('start', 'end'), f'{location}.edge 只能为 start/end。')
            offset = action.get('offset', 0)
            compiler.need(compiler.number(offset), f'{location}.offset 必须为有限秒数。')
            marks[name] = round(cue_map[cue_id][action['edge']] + offset - start, 6)
            mark_cues[name] = cue_id
        scene = {'id': shot.get('id', f'shot-{index+1}'), 'start': start, 'end': end,
                 'mechanism': shot['effect'], 'intent': shot.get('intent', shot['title']),
                 'title': shot['title'], 'presenter': shot.get('presenter', 'hidden'),
                 'enter': enter, 'marks': marks, 'markCues': mark_cues,
                 'content': copy.deepcopy(shot['content'])}
        for key in ('accent', 'background', 'camera', 'sounds'):
            if key in shot:
                scene[key] = copy.deepcopy(shot[key])
        plan['scenes'].append(scene)
    if 'sampleDuration' in brief:
        sample = brief['sampleDuration']
        compiler.need(compiler.number(sample) and 10 <= sample <= min(15, plan['duration']),
                      'sampleDuration 必须在 10–15 秒内，且不超过总时长。')
        compiler.need(any(abs(cue['end'] - sample) < .001 for cue in cues),
                      'sampleDuration 必须等于 SRT 中一个实际句尾；请选 10–15 秒内的字幕结束时间。')
    else:
        candidates = [cue['end'] for cue in cues if 10 <= cue['end'] <= min(15, plan['duration'])]
        compiler.need(candidates, 'SRT 在 10–15 秒内没有句尾；请调整开头或实测字幕，再指定 sampleDuration。')
        sample = min(candidates, key=lambda end: (abs(end - 12), end))
    plan['sample'] = {'duration': sample, 'reason': '本期开头，停在已有 SRT 的完整句尾。' + ('演示模式，不声称真实口播已对齐。' if draft else '')}
    return plan


def start(brief_path, out, media_dir=None, srt=None, voice=None, presenter=None, source_type=None, draft=False):
    brief_path = Path(brief_path).expanduser().absolute()
    media_root = Path(media_dir).expanduser().absolute() if media_dir else brief_path.parent
    destination = Path(out).expanduser().absolute()
    compiler.reject_links(brief_path)
    compiler.reject_links(media_root)
    compiler.reject_links(destination)
    compiler.need(not destination.exists(), '输出目录已存在；请另选新目录，已有工程不会被覆盖。')
    resolved = destination.resolve()
    compiler.need(compiler.ROOT != resolved and compiler.ROOT not in resolved.parents and resolved not in compiler.ROOT.parents,
                  '请把工程创建在 Skill 文件夹以外。')
    compiler.need(srt is not None or draft, '正式工程必须提供与最终音轨对齐的 --srt；无声演示请显式加 --draft。')
    brief = compiler.load(brief_path)
    srt_bytes = None
    if srt is not None:
        srt_path = Path(srt).expanduser().absolute()
        compiler.reject_links(srt_path)
        srt_bytes = srt_path.read_bytes()
    cues = parse_srt(srt_bytes.decode('utf-8-sig')) if srt_bytes is not None else None
    plan = make_plan(brief, cues, draft, voice, presenter, source_type)
    normalize_assets(plan, media_root)
    try:
        compiler.validate(plan, production=not draft, media_dir=media_root)
    except compiler.Invalid as exc:
        raise compiler.Invalid(f'{exc}；请检查字幕落点、actions、素材和 source 的真实状态，原工程未改动。') from exc
    # Keep all failed builds outside the requested destination. The final project is
    # only moved into place after assets and both reports are complete.
    destination.parent.mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory(prefix='.start-episode-', dir=destination.parent) as temporary:
        stage = Path(temporary)
        plan_file = stage / 'episode.json'
        plan_file.write_text(json.dumps(plan, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
        app = stage / 'app'
        build_report = compiler.build(plan_file, app, media_root, production=not draft)
        inputs = app / 'inputs'
        inputs.mkdir()
        shutil.copyfile(plan_file, inputs / 'episode.json')
        portable_brief = copy.deepcopy(brief)
        portable_brief['source'], portable_brief['media'] = copy.deepcopy(plan['source']), copy.deepcopy(plan['media'])
        if 'timing' in portable_brief:
            portable_brief['timing'] = plan['timing']
        for shot, scene in zip(portable_brief['shots'], plan['scenes']):
            shot['content'] = copy.deepcopy(scene['content'])
        (inputs / 'brief.json').write_text(json.dumps(portable_brief, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
        if srt_bytes is not None:
            (inputs / 'captions.srt').write_bytes(srt_bytes)
        report = {'version': 1, 'mode': 'draft' if draft else 'production', 'timing': plan['timing'],
                  'label': 'DEMO — no claim of measured narration' if draft else 'Measured phrase cues and validated final audio',
                  'inputs': {'brief': 'inputs/brief.json', 'episode': 'inputs/episode.json'},
                  'sourceType': plan['source']['type'], 'roughcut': plan['source']['roughcut'],
                  'duration': plan['duration'], 'sampleDuration': plan['sample']['duration'],
                  'sceneCount': len(plan['scenes']), 'cueCount': len(plan['captions']),
                  'alignment': 'existing SRT phrase cues; no word-level alignment generated' if cues else 'demo timing; no measured SRT',
                  'episodeSha256': build_report['episodeSha256'],
                  'nextCommands': ['npm ci', 'npm run render', 'npm run render:full']}
        if srt_bytes is not None:
            report['inputs']['srt'] = 'inputs/captions.srt'
            report['srtSha256'] = hashlib.sha256(srt_bytes).hexdigest()
        (app / 'START_REPORT.json').write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
        compiler.need(not destination.exists(), '输出目录已在运行中出现；请另选新目录，已有工程不会被覆盖。')
        app.rename(destination)
    return report


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--brief', type=Path, required=True)
    parser.add_argument('--out', type=Path, required=True)
    parser.add_argument('--media-dir', type=Path)
    parser.add_argument('--srt', type=Path)
    parser.add_argument('--voice', type=Path)
    parser.add_argument('--presenter', type=Path)
    parser.add_argument('--source-type', choices=['narration', 'digital-human', 'roughcut-presenter', 'raw-presenter'])
    parser.add_argument('--draft', action='store_true')
    args = parser.parse_args(argv)
    try:
        report = start(args.brief, args.out, args.media_dir, args.srt, args.voice, args.presenter, args.source_type, args.draft)
        print(json.dumps(report, ensure_ascii=False, indent=2))
        return 0
    except (compiler.Invalid, OSError, UnicodeError, ValueError, TypeError, KeyError) as exc:
        print(f'ERROR: {exc}', file=sys.stderr)
        return 1


if __name__ == '__main__':
    if hasattr(sys.stdout, 'reconfigure'):
        sys.stdout.reconfigure(encoding='utf-8')
        sys.stderr.reconfigure(encoding='utf-8')
    raise SystemExit(main())
