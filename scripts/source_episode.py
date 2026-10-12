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
    'ui-stage': ['resolve'],
    'poster-route': ['focus', 'connect', 'resolve'],
    'selection-build': ['document', 'search', 'select', 'code', 'replace', 'resolve'],
    'ui-handoff': ['browse', 'select', 'open', 'copy', 'paste', 'send', 'resolve'],
    'token-intake': ['collect', 'resolve'],
    'creator-strip': ['badge', 'strip', 'resolve'],
    'upload-progress': ['launch', 'resolve'],
}
PACK_EFFECTS = '''feed-montage magazine-collage code-editor idea-burst document-write reference-search code-build prompt-substitute kinetic-type challenge-split rejection-grid workflow-route object-array-flip comparison-bars premium-coins cost-columns quota-ring gallery-camera curved-screen window-detail unlock-reveal repository-copy prompt-send result-compare phone-focus curation-stamp reward-transfer media-stage creator-filmstrip upload-beam remix-cube microphone-swing robot-meter coin-growth question-bounce consumable-ban luxury-dome sharing-network celebration-type'''.split()
EFFECTS.update({name:['reveal','act','resolve'] for name in PACK_EFFECTS})
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
        ui=c.get('ui',{})
        paths.extend(n['image'] for n in ui.get('nodes',[]) if n.get('image'))
        paths.extend(f['set']['image'] for tr in ui.get('tracks',[]) for f in tr['frames'] if f['set'].get('image'))
        for item in c['items']:
            paths.extend(item[k] for k in ('image','replacementImage','video') if item.get(k))
    return sorted(set(relative(p) for p in paths))

UI_TYPES={'panel','text','button','input','badge','image','progress','line','chart','cursor'}
UI_FIELDS={'id','type','x','y','w','h','text','image','fill','color','stroke','radius','fontSize','weight','opacity','rotation','value','points','emphasis'}

def ui_properties(n, partial=False):
    keys(n,[] if partial else ['id','type','x','y','w','h'],UI_FIELDS-({'id','type'} if partial else set()),'UI node/keyframe')
    if not partial:
        need(text(n['id'],64) and n['type'] in UI_TYPES,'UI node needs id and supported type')
    for key in ('x','y','w','h','radius','fontSize','weight','opacity','rotation','value'):
        if key not in n: continue
        value=n[key];need(number(value),f'UI {key} must be finite numeric')
        low,high={'x':(-4000,4000),'y':(-4000,4000),'w':(0,4000),'h':(0,4000),'radius':(0,2000),'fontSize':(6,160),'weight':(100,900),'opacity':(0,1),'rotation':(-720,720),'value':(0,1)}[key]
        need(low<=value<=high,f'UI {key} outside {low}..{high}')
    for key in ('fill','color','stroke'):
        if key in n:
            value=n[key]
            need(isinstance(value,str) and (value=='none' or (len(value) in (7,9) and value[0]=='#' and all(c in '0123456789abcdefABCDEF' for c in value[1:]))),'UI colors use #RRGGBB / #RRGGBBAA / none')
    for key,limit in [('text',1000),('emphasis',80)]:
        if key in n: need(isinstance(n[key],str) and len(n[key])<=limit,f'UI {key} too long')
    if 'image' in n: relative(n['image'])
    if 'points' in n: need(isinstance(n['points'],list) and 1<=len(n['points'])<=300 and all(number(v) and abs(v)<=1e12 for v in n['points']),'UI chart requires finite data points')

def validate_ui(ui,duration):
    keys(ui,['nodes','tracks'],['nodes','tracks','camera','canvasHeight','showTitle','label'],'content.ui')
    need(isinstance(ui['nodes'],list) and 1<=len(ui['nodes'])<=200,'UI needs1..200 authored nodes')
    need(isinstance(ui['tracks'],list) and len(ui['tracks'])<=200,'UI tracks must be an array <=200')
    if 'canvasHeight' in ui: need(number(ui['canvasHeight']) and 400<=ui['canvasHeight']<=2000,'UI canvasHeight400..2000')
    if 'showTitle' in ui: need(isinstance(ui['showTitle'],bool),'UI showTitle must be boolean')
    if 'label' in ui: need(text(ui['label'],40),'UI label needs provenance, such as 示意界面')
    ids=set()
    for n in ui['nodes']:
        ui_properties(n)
        need(n['id'] not in ids,'Duplicate UI node id');ids.add(n['id'])
        if n['type']=='chart': need('points' in n,'UI chart needs data points')
        if n['type']=='image': need('image' in n,'UI image requires media path')
    tracked=set()
    for tr in ui['tracks']:
        keys(tr,['nodeId','frames'],['nodeId','frames'],'UI track')
        need(tr['nodeId'] in ids and tr['nodeId'] not in tracked,'UI track needs one unique known nodeId');tracked.add(tr['nodeId'])
        need(isinstance(tr['frames'],list) and 1<=len(tr['frames'])<=200,'UI track needs1..200 frames')
        last=-1
        for f in tr['frames']:
            keys(f,['at','set'],['at','set','ease'],'UI keyframe')
            need(number(f['at']) and last<f['at']<=duration,'UI keyframe time must increase within scene');last=f['at']
            need(f['at']>=0,'UI keyframe time must be nonnegative')
            need(f.get('ease','smooth') in ('smooth','out','linear'),'Unknown UI easing')
            need(isinstance(f['set'],dict) and f['set'],'UI keyframe cannot be empty');ui_properties(f['set'],True)
    camera=ui.get('camera',[]);need(isinstance(camera,list) and len(camera)<=200,'UI camera must be array <=200')
    last=-1
    for f in camera:
        keys(f,['at','x','y','scale'],['at','x','y','scale'],'UI camera frame')
        need(all(number(f[k]) for k in ('at','x','y','scale')),'UI camera values must be finite')
        need(last<f['at']<=duration and f['at']>=0 and abs(f['x'])<=4000 and abs(f['y'])<=4000 and .25<=f['scale']<=4,'Invalid UI camera range/time');last=f['at']

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
        keys(s,['id','start','end','mechanism','intent','title','presenter','marks','content','enter'],['id','start','end','mechanism','intent','title','presenter','marks','content','enter','accent','background','markCues','camera','sounds'],'scene')
        need(text(s['id'],64) and s['id'] not in ids and all(c.isalnum() or c in '_-' for c in s['id']),'Unique safe scene id required')
        ids.add(s['id'])
        need(s['mechanism'] in EFFECTS,'Unsupported mechanism; extend effect, contract and validator together')
        need(number(s['start']) and number(s['end']) and 0<=s['start']<s['end']<=p['duration'],'Invalid scene range')
        need(s['end']-s['start']>=1,'Scene too short')
        need(text(s['intent'],200) and text(s['title'],24),'Specify semantic intent and short title')
        if 'sounds' in s:
            need(isinstance(s['sounds'],list) and len(s['sounds'])<=60,'sounds must be an array up to60 events')
            for event in s['sounds']:
                keys(event,['at','name'],['at','name','volume'],'sound event')
                need(event['name'] in ('whoosh','tick','pop','chime','drop'),'Unknown bundled sound')
                need(number(event['at']) and 0<=event['at']<s['end']-s['start'],'Sound must land within scene')
                need(number(event.get('volume',.32)) and 0<=event.get('volume',.32)<=1,'Sound volume must be0..1')
        if 'camera' in s:
            need(s['mechanism'] in PACK_EFFECTS,'Scene camera is supported by the full effect pack; ui-stage uses content.ui.camera')
            need(isinstance(s['camera'],list) and 1<=len(s['camera'])<=100,'camera needs1..100 poses')
            last_at=-1
            for pose in s['camera']:
                keys(pose,['at','x','y','scale'],['at','x','y','scale','rotate'],'camera pose')
                need(all(number(v) for v in pose.values()),'camera pose must be finite')
                need(last_at<pose['at']<=s['end']-s['start'] and pose['at']>=0,'camera time must increase within scene')
                need(abs(pose['x'])<=4000 and abs(pose['y'])<=4000 and .25<=pose['scale']<=6 and abs(pose.get('rotate',0))<=360,'camera pose out of range')
                last_at=pose['at']
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
        if s['mechanism']=='ui-stage':
            need(isinstance(marks,dict) and 'resolve' in marks and 1<=len(marks)<=30,'UI marks need resolve and up to30 authored semantic milestones')
            need(all(text(n,64) for n in marks),'UI mark names must be nonempty')
            names=list(marks)
        keys(marks,names,names,'marks')
        need(all(number(marks[n]) and 0<=marks[n]<=s['end']-s['start'] for n in names),'Marks must fall inside local scene time')
        if s['mechanism']!='ui-stage':
            need(all(marks[b]>marks[a] for a,b in zip(names,names[1:])),'Action marks must be strictly increasing')
        else:
            need(max(marks.values())==marks['resolve'],'UI resolve must be the last semantic milestone')
        need(marks['resolve']<=s['end']-s['start']-0.15,'Leave at least .15 sec to read the result')
        markcues=s.get('markCues',{})
        need(isinstance(markcues,dict) and set(markcues)<=set(names),'markCues references unknown mark')
        for name,cid in markcues.items():
            need(cid in cues,f'Missing caption cue {cid}')
            at=s['start']+marks[name]; cue=cues[cid]
            need(cue['start']-0.12<=at<=cue['end']+0.12,f'{s["id"]}.{name} result does not land in linked spoken cue')
        c=s['content']; keys(c,['items'],['items','selectedId','body','code','prompt','url','result','avatar','metric','emphasis','ui','kicker','values','pack'],'content')
        if 'values' in c: need(isinstance(c['values'],list) and 1<=len(c['values'])<=12 and all(number(v) and 0<=v<=1e12 for v in c['values']),'values needs1..12 finite nonnegative numbers')
        if 'pack' in c:
            pack=c['pack'];keys(pack,[],['columns','density','angle','direction','depth','focusX','focusY','speed','showTitle','labels'],'content.pack')
            for k,low,high in [('columns',1,6),('density',1,160),('angle',-80,80),('depth',0,2000),('focusX',0,544),('focusY',0,2000),('speed',.1,4)]:
                if k in pack: need(number(pack[k]) and low<=pack[k]<=high,f'pack.{k} outside {low}..{high}')
            for k in ('columns','density'):
                if k in pack: need(isinstance(pack[k],int) and not isinstance(pack[k],bool),f'pack.{k} must be integer')
            if 'direction' in pack: need(pack['direction'] in ('left','right','up','down'),'pack.direction unsupported')
            if 'showTitle' in pack: need(isinstance(pack['showTitle'],bool),'pack.showTitle must be boolean')
            if 'labels' in pack: need(isinstance(pack['labels'],list) and 1<=len(pack['labels'])<=12 and all(text(v,24) for v in pack['labels']),'pack.labels needs1..12 short labels')
        if 'emphasis' in c: need(text(c['emphasis'],24) and c['emphasis'] in s['title'],'emphasis must be a nonempty substring of title')
        need(isinstance(c['items'],list) and (0 if s['mechanism']=='ui-stage' else 1)<=len(c['items'])<=12,'Need content items (UI stage may use an empty array)')
        if s['mechanism']=='ui-stage':
            need('ui' in c,'ui-stage requires content.ui')
            validate_ui(c['ui'],s['end']-s['start'])
        else: need('ui' not in c,'content.ui is only supported by ui-stage')
        if s['mechanism']=='poster-route': need(3<=len(c['items'])<=5,'poster-route needs3..5 items; more inputs need grouping or another shot')
        if s['mechanism']=='selection-build': need(4<=len(c['items'])<=9,'selection-build needs4..9 candidates; first4 become replacement tray')
        itemids=set()
        for item in c['items']:
            keys(item,['id','label'],['id','label','color','image','replacementImage','replacementLabel','value','video','trimStart','playbackRate','fit','shape'],'item')
            need(text(item['id'],64) and item['id'] not in itemids and text(item['label'],16),'Unique itemid and short label required')
            itemids.add(item['id'])
            if 'replacementLabel' in item: need(text(item['replacementLabel'],16),'replacementLabel too long')
            if 'color' in item: need(isinstance(item['color'],str) and len(item['color'])==7 and item['color'][0]=='#' and all(x in '0123456789abcdefABCDEF' for x in item['color'][1:]),'item.color must be #RRGGBB')
            if 'value' in item: need(number(item['value']) and 0<=item['value']<=1e12,'item.value must be finite nonnegative')
            if 'trimStart' in item: need(number(item['trimStart']) and item['trimStart']>=0,'trimStart must be nonnegative seconds')
            if 'playbackRate' in item: need(number(item['playbackRate']) and .1<=item['playbackRate']<=4,'playbackRate outside .1..4')
            if 'fit' in item: need(item['fit'] in ('contain','cover'),'fit must be contain or cover')
            if 'shape' in item: need(item['shape'] in ('circle','square','diamond','person','chip','cup','coin'),'Unsupported native shape')
            need(not (item.get('image') and item.get('video')),'An item uses image or video; split simultaneous layers into different items')
        if 'selectedId' in c: need(c['selectedId'] in itemids,'selectedId must reference an actual item')
        for field,limit in [('body',300),('code',1000),('prompt',100),('url',160),('result',40),('kicker',40)]:
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
    shutil.copy2(ROOT/'references/approved-editing-direction.md',dest/'STYLE_TARGET.md')
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
