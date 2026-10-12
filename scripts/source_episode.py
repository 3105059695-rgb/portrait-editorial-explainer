#!/usr/bin/env python3
"""Validate/build source-style v3 episodes. Standard-library only; no account access."""
from __future__ import annotations
import argparse
import hashlib
import json
import math
import os
from pathlib import Path
import shutil
import stat
import subprocess
import sys

EFFECTS = {
    'poster-route': ['focus', 'connect', 'resolve'],
    'selection-build': ['document', 'search', 'select', 'code', 'replace', 'resolve'],
    'ui-handoff': ['browse', 'select', 'open', 'copy', 'paste', 'send', 'resolve'],
    'token-intake': ['collect', 'resolve'],
    'creator-strip': ['badge', 'strip', 'resolve'],
    'upload-progress': ['launch', 'resolve'],
}
ROOT = Path(__file__).resolve().parents[1]

class Invalid(ValueError): pass

def need(test, message):
    if not test: raise Invalid(message)

def number(value):
    return isinstance(value, (int, float)) and not isinstance(value, bool) and math.isfinite(value)

def text(value, limit=120):
    return isinstance(value, str) and 0 < len(value.strip()) <= limit

def keys(obj, required, allowed, location):
    need(isinstance(obj, dict), f'{location}: expected object')
    need(set(required) <= set(obj), f'{location}: missing {set(required)-set(obj)}')
    need(set(obj) <= set(allowed), f'{location}: unknown keys {set(obj)-set(allowed)}')

def linked(path):
    return path.is_symlink() or bool(getattr(path.lstat(), 'st_file_attributes', 0) & getattr(stat,'FILE_ATTRIBUTE_REPARSE_POINT',0x400))

def reject_links(path):
    for p in [path, *path.parents]:
        if p.exists(): need(not linked(p), f'Symlinks/junctions are not accepted for input/output: {p.name}')

def relative(value):
    need(isinstance(value,str) and value.strip()==value and value, 'Media path must be a nonempty relative path')
    normalized=value.replace('\\','/')
    need(not normalized.startswith('/') and not any(x in normalized for x in (':','?','#','\x00')), 'Use paths relative to the media root, without URL/drive/query')
    need(all(part not in ('..','.','') for part in normalized.split('/')), 'Media paths must not contain .., . or empty segments')
    need(not any(ord(c)<32 for c in normalized), 'Media path contains control characters')
    return normalized

def asset_paths(plan):
    paths=list(plan['media'].values())
    mapping=plan['source'].get('mapping')
    if mapping: paths.append(mapping)
    for scene in plan['scenes']:
        c=scene['content']
        if c.get('avatar'): paths.append(c['avatar'])
        for item in c['items']:
            paths.extend(item[k] for k in ('image','replacementImage') if item.get(k))
    return sorted(set(relative(p) for p in paths))

def probe_duration(path):
    need(shutil.which('ffprobe'), 'Production validation requires ffprobe on PATH')
    try:
        info=json.loads(subprocess.check_output(['ffprobe','-v','error','-show_format','-show_streams','-of','json',str(path)],text=True,encoding='utf-8'))
        return float(info['format']['duration']), info['streams']
    except (OSError, subprocess.SubprocessError, KeyError, ValueError) as e:
        raise Invalid(f'Cannot probe required media {path.name}: {e}') from e

def validate(p, production=False, media_dir=None):
    keys(p, ['version','title','width','height','fps','duration','timing','source','media','sample','captions','scenes'], ['version','title','width','height','fps','duration','timing','source','media','sample','captions','scenes'], 'episode')
    need(p['version']==3 and text(p['title'],100),'Expected v3 episode and title')
    for k in ('width','height','fps'):
        need(isinstance(p[k],int) and not isinstance(p[k],bool),f'{k}: expected integer')
    need(320<=p['width']<=2160 and 400<=p['height']<=3840 and p['width']%2==p['height']%2==0,'Use even video dimensions in supported range')
    ratio=p['height']/p['width']
    need(1.25<=ratio<=1.8,'Use source aspect (544x720) or portrait (1080x1920); never stretch source footage')
    need(p['fps'] in (24,25,30,50,60),'Unsupported fps')
    need(number(p['duration']) and 10<=p['duration']<=1800,'duration must be 10..1800 seconds')
    need(p['timing'] in ('measured','demo'),'timing must be measured or demo')
    source=p['source']
    keys(source,['type','roughcut'],['type','roughcut','tool','mapping'],'source')
    need(source['type'] in ('raw-presenter','roughcut-presenter','digital-human','narration','demo'),'Unknown source.type')
    need(source['roughcut'] in ('pending','done','skipped-digital','not-needed'),'Unknown roughcut status')
    keys(p['media'],[],['presenter','voice','music'],'media')
    need(all(text(v,250) for v in p['media'].values()),'Omit absent media fields; do not use null/empty paths')
    keys(p['sample'],['duration','reason'],['duration','reason'],'sample')
    sd=p['sample']['duration']
    need(number(sd) and 10<=sd<=min(15,p['duration']) and text(p['sample']['reason'],250),'sample must be opening 0..10-15 seconds with reason')
    captions=p['captions']; need(isinstance(captions,list),'captions must be an array')
    cues={}; last=0
    for c in captions:
        keys(c,['id','start','end','text'],['id','start','end','text'],'caption')
        need(text(c['id'],64) and c['id'] not in cues,'Duplicate/empty caption id')
        need(number(c['start']) and number(c['end']) and last<=c['start']<c['end']<=p['duration'],'Caption time overlap/outside duration')
        need(text(c['text'],42),'Split captions into <=42 characters')
        last=c['end']; cues[c['id']]=c
    scenes=p['scenes']; need(isinstance(scenes,list) and 1<=len(scenes)<=200,'Need 1..200 scenes')
    ids=set(); previous=None
    for s in scenes:
        keys(s,['id','start','end','mechanism','intent','title','presenter','marks','content','enter'],['id','start','end','mechanism','intent','title','presenter','marks','content','enter','accent','background','markCues'],'scene')
        need(text(s['id'],64) and s['id'] not in ids and all(c.isalnum() or c in '_-' for c in s['id']),'Unique safe scene id required')
        ids.add(s['id'])
        need(s['mechanism'] in EFFECTS,'Unsupported mechanism; extend effect, contract and validator together')
        need(number(s['start']) and number(s['end']) and 0<=s['start']<s['end']<=p['duration'],'Invalid scene range')
        need(s['end']-s['start']>=1,'Scene too short')
        need(text(s['intent'],200) and text(s['title'],24),'Specify semantic intent and short title')
        need(s['presenter'] in ('hidden','pip','full'),'Unknown presenter mode')
        for color in ('accent','background'):
            if color in s:
                need(isinstance(s[color],str) and len(s[color])==7 and s[color][0]=='#' and all(x in '0123456789abcdefABCDEF' for x in s[color][1:]),f'{color}: use #RRGGBB')
        enter=s['enter']; keys(enter,['type','duration'],['type','duration','x','y'],'scene.enter')
        need(enter['type'] in ('cut','circle','window'),'Unknown transition')
        need(number(enter['duration']) and (enter['duration']==0 if enter['type']=='cut' else 0.12<=enter['duration']<=0.65),'Cut has duration0; masks need .12..65 seconds')
        for xy in ('x','y'):
            if xy in enter: need(number(enter[xy]) and 0<=enter[xy]<=100,'Transition anchor uses percentage0..100')
        if previous is None: need(s['start']==0 and enter['duration']==0,'Opening starts at zero with cut')
        else:
            need(abs(s['start']-(previous['end']-enter['duration']))<0.001,'Adjacent scenes must overlap exactly by incoming transition duration')
            need(s['start']>=previous['start']+previous['enter']['duration'] and s['end']>previous['end'],'No triple overlaps or backwards scene ends')
        previous=s
        marks=s['marks']; names=EFFECTS[s['mechanism']]
        keys(marks,names,names,'marks')
        need(all(number(marks[n]) and 0<=marks[n]<=s['end']-s['start'] for n in names),'Marks must fall inside local scene time')
        need(all(marks[b]>marks[a] for a,b in zip(names,names[1:])),'Action marks must be strictly increasing')
        need(marks['resolve']<=s['end']-s['start']-0.15,'Leave at least .15 sec to read the result')
        markcues=s.get('markCues',{})
        need(isinstance(markcues,dict) and set(markcues)<=set(names),'markCues references unknown mark')
        for name,cid in markcues.items():
            need(cid in cues,f'Missing caption cue {cid}')
            at=s['start']+marks[name]; cue=cues[cid]
            need(cue['start']-0.12<=at<=cue['end']+0.12,f'{s["id"]}.{name} result does not land in linked spoken cue')
        c=s['content']; keys(c,['items'],['items','selectedId','body','code','prompt','url','result','avatar','metric','emphasis'],'content')
        if 'emphasis' in c: need(text(c['emphasis'],24) and c['emphasis'] in s['title'],'emphasis must be a nonempty substring of title')
        need(isinstance(c['items'],list) and 1<=len(c['items'])<=12,'Need1..12 content items')
        if s['mechanism']=='poster-route': need(3<=len(c['items'])<=5,'poster-route needs3..5 items; more inputs need grouping or another shot')
        if s['mechanism']=='selection-build': need(4<=len(c['items'])<=9,'selection-build needs4..9 candidates; first4 become replacement tray')
        itemids=set()
        for item in c['items']:
            keys(item,['id','label'],['id','label','color','image','replacementImage','replacementLabel'],'item')
            need(text(item['id'],64) and item['id'] not in itemids and text(item['label'],16),'Unique itemid and short label required')
            itemids.add(item['id'])
            if 'replacementLabel' in item: need(text(item['replacementLabel'],16),'replacementLabel too long')
        if 'selectedId' in c: need(c['selectedId'] in itemids,'selectedId must reference an actual item')
        for field,limit in [('body',300),('code',1000),('prompt',100),('url',160),('result',40)]:
            if field in c: need(text(c[field],limit),f'{field}: max{limit} chars')
        if s['mechanism'] in ('selection-build','ui-handoff'): need('selectedId' in c,'Interactive effect requires selectedId')
        if s['mechanism']=='selection-build': need(all(k in c for k in ('body','code','prompt')),'selection-build needs body/code/prompt')
        if s['mechanism']=='ui-handoff': need(all(k in c for k in ('url','prompt','result')),'ui-handoff needs url/prompt/result')
        if 'metric' in c:
            metric=c['metric'];keys(metric,['value','unit','label'],['value','unit','label','events'],'metric')
            need(number(metric['value']) and 0<metric['value']<=1e9 and isinstance(metric['unit'],str) and len(metric['unit'])<=8 and text(metric['label'],20),'Invalid metric')
            if 'events' in metric: need(isinstance(metric['events'],int) and not isinstance(metric['events'],bool) and 2<=metric['events']<=160,'metric.events must be an integer2..160')
        if s['mechanism']=='token-intake': need('metric' in c,'Token effect needs a metric target')
        if production:
            need(set(markcues)==set(names),'Production requires every action mark linked to a measured caption cue')
    need(abs(scenes[-1]['end']-p['duration'])<0.001,'Scenes must cover the entire episode')
    paths=asset_paths(p)
    root=Path(media_dir).absolute() if media_dir else None
    if paths: need(root is not None,'Provide --media-dir for referenced media')
    if root:
        reject_links(root)
        for rel in paths:
            file=root/rel; reject_links(file)
            need(file.is_file() and file.stat().st_size>0,f'Missing/empty asset: {rel}')
    if production:
        need(p['timing']=='measured' and source['type']!='demo','Production needs measured final audio, not demo timings')
        need(captions and any(abs(c['end']-sd)<=1/p['fps']+0.001 for c in captions),'Opening sample must end on measured phrase boundary')
        if source['type']=='raw-presenter':
            need(source['roughcut']=='done' and source.get('tool')=='ChatCut' and source.get('mapping'),'Raw presenter needs actual ChatCut roughcut and mapping')
        if source['type']=='roughcut-presenter': need(source['roughcut']=='done','Confirm existing roughcut before use')
        if source['type']=='digital-human': need(source['roughcut']=='skipped-digital','Digital-human defaults to skipped roughcut')
        if source['type'] in ('raw-presenter','roughcut-presenter','digital-human'): need('presenter' in p['media'],'Presenter video is required')
        voice=p['media'].get('voice') or p['media'].get('presenter')
        need(voice,'Final voice or presenter with audio is required')
        dur,streams=probe_duration(root/voice)
        need(dur+1/p['fps']>=p['duration'] and any(s['codec_type']=='audio' for s in streams),'Final voice is too short or has no audio')
        if 'presenter' in p['media']:
            dur,streams=probe_duration(root/p['media']['presenter'])
            need(dur+1/p['fps']>=p['duration'] and any(s['codec_type']=='video' for s in streams),'Presenter is too short or has no video')
    return paths

def load(path):
    with Path(path).open(encoding='utf-8-sig') as stream: return json.load(stream)

def build(input_path,out,media_dir=None,production=False):
    p=load(input_path); paths=validate(p,production,media_dir)
    template=ROOT/'assets/source-style-template'
    need(template.is_dir(),'Build is available from the installed Skill scripts/source_episode.py')
    dest=Path(out).expanduser().absolute(); reject_links(dest)
    need(not dest.exists() or (dest.is_dir() and not any(dest.iterdir())),'Output must be a new or empty directory; nothing is replaced')
    resolved=dest.resolve(); need(ROOT!=resolved and ROOT not in resolved.parents and resolved not in ROOT.parents,'Build outside the Skill folder')
    for f in template.rglob('*'): need(not linked(f),'Template must not contain symlinks/junctions')
    shutil.copytree(template,dest,dirs_exist_ok=True,ignore=shutil.ignore_patterns('node_modules','out','__pycache__'))
    shutil.copy2(Path(__file__),dest/'validate_episode.py')
    planbytes=(json.dumps(p,ensure_ascii=False,indent=2)+'\n').encode('utf-8')
    (dest/'src/episode.json').write_bytes(planbytes)
    inventory=[]
    for rel in paths:
        origin=Path(media_dir)/rel; target=dest/'public'/rel
        if target.exists():
            need(target.read_bytes()==origin.read_bytes(),f'Asset collides with bundled file: {rel}; use a distinct relative filename')
        else:
            target.parent.mkdir(parents=True,exist_ok=True); shutil.copyfile(origin,target)
        inventory.append({'path':rel,'sha256':hashlib.sha256(target.read_bytes()).hexdigest()})
    report={'version':3,'episodeSha256':hashlib.sha256(planbytes).hexdigest(),'validation':'production' if production else 'draft','styleApproval':'pending','assets':inventory,'sourceType':p['source']['type'],'defaultExport':{'start':0,'end':p['sample']['duration']}}
    (dest/'BUILD_REPORT.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8')
    return report

def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('command',choices=['validate','build']);parser.add_argument('plan',type=Path)
    parser.add_argument('--out',type=Path);parser.add_argument('--media-dir',type=Path);parser.add_argument('--production',action='store_true')
    args=parser.parse_args()
    try:
        if args.command=='build':
            need(args.out,'build requires --out'); result=build(args.plan,args.out,args.media_dir,args.production)
        else:
            p=load(args.plan);paths=validate(p,args.production,args.media_dir);result={'valid':True,'assets':len(paths),'styleApproval':'pending','mode':'production' if args.production else 'draft'}
        print(json.dumps(result,ensure_ascii=False,indent=2)); return 0
    except (Invalid,OSError,ValueError,TypeError,KeyError) as exc:
        print(f'ERROR: {exc}',file=sys.stderr);return 1

if __name__=='__main__':
    if hasattr(sys.stdout,'reconfigure'): sys.stdout.reconfigure(encoding='utf-8');sys.stderr.reconfigure(encoding='utf-8')
    raise SystemExit(main())
