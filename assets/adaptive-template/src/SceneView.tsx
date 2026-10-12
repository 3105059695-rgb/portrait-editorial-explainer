import React from 'react';
import {Img, staticFile} from 'remotion';
import {ObjectGlyph} from './ObjectGlyph';
import type {Asset, Episode, Scene, StoryObject, Theme} from './types';
import {back, beatProgress, cameraAt, cameraTransform, clamp, layout, mix, objectPoses, pulse, safeId, smooth, sortedBeats, transferLanding, type Camera, type Pose} from './timeline';

export const DEFAULT_THEME: Theme = {paper: '#F7F7F2', ink: '#252722', accent: '#B65C3E', comic: '#D8CAFF'};
const serif = '"Noto Serif SC", serif', sans = '"Noto Sans SC", sans-serif';
const lines = (value: string, limit: number) => {
  const result: string[] = []; let row = '';
  for (const character of Array.from(value)) {
    if (character === '\n' || row.length >= limit) {result.push(row); row = '';}
    if (character !== '\n') row += character;
  }
  if (row) result.push(row);
  return result;
};
const TextRows: React.FC<{text: string; x?: number; y: number; size: number; width: number; color: string; weight?: number; family?: string; anchor?: 'start' | 'middle'; leading?: number}> = ({text, x = 0, y, size, width, color, weight = 600, family = sans, anchor = 'middle', leading = 1.32}) => <text x={x} y={y} textAnchor={anchor} fontSize={size} fontFamily={family} fontWeight={weight} fill={color}>{lines(text, Math.max(1, Math.floor(width / size))).map((line, i) => <tspan key={i} x={x} dy={i ? size * leading : 0}>{line}</tspan>)}</text>;

const Spark: React.FC<{x: number; y: number; scale?: number; color: string; ink: string}> = ({x, y, scale = 1, color, ink}) => <path d="M0-18Q3-3 18 0Q3 3 0 18Q-3 3-18 0Q-3-3 0-18Z" fill={color} stroke={ink} strokeWidth="1.8" transform={`translate(${x} ${y}) scale(${scale})`}/>;

const SceneDefs: React.FC<{uid: string; theme: Theme}> = ({uid, theme}) => <defs>
  <linearGradient id={`${uid}-paper`} x1="0" y1="0" x2=".8" y2="1"><stop stopColor="#FFFFFF"/><stop offset="1" stopColor={theme.paper}/></linearGradient>
  <linearGradient id={`${uid}-mount`} x1="0" y1="0" x2=".75" y2="1"><stop stopColor="#FFFFFF"/><stop offset="1" stopColor="#E5E3D6"/></linearGradient>
  <radialGradient id={`${uid}-light`}><stop offset="0" stopColor="#FFFFFF" stopOpacity=".85"/><stop offset="1" stopColor={theme.ink} stopOpacity=".06"/></radialGradient>
  <filter id={`${uid}-contact`} x="-80%" y="-100%" width="260%" height="300%"><feGaussianBlur stdDeviation="5"/></filter>
  <marker id={`${uid}-arrow`} viewBox="0 0 14 14" refX="11" refY="7" markerWidth="5" markerHeight="5" orient="auto"><path d="M1 1L12 7L1 13" fill="none" stroke={theme.ink} strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round"/></marker>
</defs>;

const Backdrop: React.FC<{scene: Scene; theme: Theme; t: number; uid: string}> = ({scene, theme, t, uid}) => {
  const comic = scene.mechanism === 'question-thread';
  return <>
    <rect width="540" height="960" fill={comic ? theme.comic : theme.paper}/>
    {comic ? <>
      <g opacity=".095" transform={`rotate(${(t - scene.start) * .45} 274 390)`}>{Array.from({length: 16}, (_, i) => {const a = i * Math.PI / 8, b = a + Math.PI / 25; return <path key={i} d={`M274 390L${274 + 1200 * Math.cos(a)} ${390 + 1200 * Math.sin(a)}L${274 + 1200 * Math.cos(b)} ${390 + 1200 * Math.sin(b)}Z`} fill={theme.ink}/>;})}</g>
      <Spark x={48} y={175} color="#FFDB80" ink={theme.ink} scale={.6}/><Spark x={482} y={725} color="#FFAFCF" ink={theme.ink} scale={.8}/>
    </> : <>
      <rect width="540" height="960" fill={`url(#${uid}-light)`}/>
      <path d="M-30 695Q225 510 586 714M-45 710Q240 530 590 731" stroke={theme.ink} strokeWidth=".6" opacity=".09" fill="none"/>
      <path d="M40 776H500" stroke={theme.ink} strokeWidth=".5" opacity=".13"/>
    </>}
  </>;
};

const ObjectVisual: React.FC<{object: StoryObject; asset?: Asset; pose: Pose; theme: Theme; uid: string; scene: Scene; t: number; labels?: boolean}> = ({object, asset, pose, theme, uid, scene, t, labels = true}) => {
  const relevant = scene.beats.filter(b => b.targetId === object.id);
  const result = relevant.filter(b => b.action === 'result' || b.action === 'select').reduce((q, b) => Math.max(q, pulse(scene, b, t, .08, .4)), 0);
  const arrival = relevant.filter(b => b.action === 'transfer' || b.action === 'group').reduce((q, b) => Math.max(q, smooth(t, b.at - .05, b.at + .04) * (1 - smooth(t, b.at + .12, b.at + .5))), 0);
  const grouped = relevant.filter(b => b.action === 'group').reduce((q, b) => Math.max(q, beatProgress(scene, b, t)), 0);
  const rotation = pose.rotation;
  return <g opacity={pose.opacity} transform={`translate(${pose.x} ${pose.y}) rotate(${rotation}) scale(${pose.scale})`}>
    <ellipse cx="7" cy="80" rx="70" ry="9" fill={theme.ink} opacity=".11" filter={`url(#${uid}-contact)`}/>
    {(result > 0 || arrival > 0) && <g fill="none" stroke={theme.accent} strokeWidth="3.3" strokeLinecap="round" opacity={Math.max(result, arrival)}><path d="M-99-41l-21-9M-102-7h-26M-96 28l-21 11M99-42l21-10M101-8h28M97 26l22 11"/></g>}
    {asset ? <>
      {asset.role === 'evidence' && <><path d="M-76-80H76V70H-76Z" transform="translate(6 8)" fill={theme.ink} opacity=".27"/><rect x="-79" y="-84" width="158" height="153" rx="4" fill="#FFFEF8" stroke={theme.ink} strokeWidth="2.3"/></>}
      <foreignObject x={asset.role === 'evidence' ? -72 : -91} y="-91" width={asset.role === 'evidence' ? 144 : 182} height="166"><Img src={staticFile(asset.path)} style={{width: '100%', height: '100%', objectFit: 'contain', filter: asset.role === 'evidence' ? undefined : `drop-shadow(3px 5px 1px ${theme.ink}22)`}}/></foreignObject>
    </> : <ObjectGlyph kind={object.kind} {...theme} uid={`${uid}-${safeId(object.id)}`}/>}
    {labels && <g opacity={1 - grouped}>
      <TextRows text={object.label} y={104} size={18} width={178} color={theme.ink} weight={700} family={serif}/>
      {object.detail && <TextRows text={object.detail} y={112 + lines(object.label, 9).length * 23} size={10} width={180} color={theme.ink} weight={400}/>}
    </g>}
    {arrival > 0 && <circle cx="68" cy="-68" r={mix(8, 14, back(arrival))} fill={theme.comic} stroke={theme.ink} strokeWidth="2"/>}
  </g>;
};

const Header: React.FC<{scene: Scene; theme: Theme; t: number}> = ({scene, theme, t}) => {
  if (!scene.title) return null;
  const q = smooth(t, scene.start - .12, scene.start + Math.min(.35, (scene.end - scene.start) * .2));
  return <g transform={`translate(0 ${12 * (1 - q)})`} opacity={mix(.55, 1, q)}>
    <rect x="35" y="69" width="24" height="4" fill={theme.accent}/>
    <TextRows text={scene.title} x={35} y={124} size={scene.title.length > 15 ? 35 : 43} width={475} color={theme.ink} family={serif} weight={700} anchor="start" leading={1.22}/>
  </g>;
};

const relationPath = (from: Pose, to: Pose, i: number) => {
  const dx = to.x - from.x, dy = to.y - from.y;
  const length = Math.max(1, Math.hypot(dx, dy));
  const sx = from.x + dx / length * 61 * from.scale, sy = from.y + dy / length * 58 * from.scale;
  const ex = to.x - dx / length * 69 * to.scale, ey = to.y - dy / length * 69 * to.scale;
  return `M${sx} ${sy}C${sx + dx * .18 - dy * .22} ${sy + dy * .18 + dx * .18 + i % 2 * 15} ${ex - dx * .2 - dy * .16} ${ey - dy * .2 + dx * .16} ${ex} ${ey}`;
};

const Relations: React.FC<{scene: Scene; t: number; poses: Record<string, Pose>; theme: Theme; uid: string}> = ({scene, t, poses, theme, uid}) => <>
  {sortedBeats(scene).filter(b => ['connect', 'transfer', 'group'].includes(b.action) && b.withId).map((beat, i) => {
    const source = poses[beat.targetId], end = poses[beat.withId!];
    if (!source || !end) return null;
    const q = beatProgress(scene, beat, t, .7);
    if (beat.action === 'connect') {
      const path = relationPath(source, end, i);
      return <g key={`${i}-${beat.at}`} opacity={clamp(q * 5)}>
        <path d={path} fill="none" stroke={theme.ink} strokeWidth="7" strokeLinecap="round" pathLength="1" strokeDasharray="1" strokeDashoffset={1 - q}/>
        <path d={path} fill="none" stroke={scene.mechanism === 'question-thread' ? '#EC638B' : theme.accent} strokeWidth="3.6" strokeLinecap="round" pathLength="1" strokeDasharray="1" strokeDashoffset={1 - q}/>
        <circle cx={end.x - (end.x - source.x) * .18} cy={end.y - (end.y - source.y) * .18} r={6 * smooth(t, beat.at - .04, beat.at + .09)} fill={theme.comic} stroke={theme.ink} strokeWidth="1.8"/>
      </g>;
    }
    if (beat.action === 'transfer') {
      const bases = layout(scene);
      // Recover the moving object's settled position before this exact event, including prior transfers.
      const prior = objectPoses({...scene, beats: sortedBeats(scene).filter(b => b.at < beat.at)}, beat.at)[beat.targetId] ?? bases[beat.targetId];
      const final = transferLanding(scene, beat, end);
      const path = `M${prior.x} ${prior.y}Q${(prior.x + final.x) / 2} ${Math.min(prior.y, final.y) - 205} ${final.x} ${final.y}`;
      return <g key={`${i}-${beat.at}`} opacity={.7}>
        <path d={path} fill="none" stroke={theme.ink} strokeWidth="2.3" strokeLinecap="round" pathLength="1" strokeDasharray="1" strokeDashoffset={1 - q} markerEnd={q > .98 ? `url(#${uid}-arrow)` : undefined}/>
        <path d={path} fill="none" stroke={theme.paper} strokeWidth=".8" strokeLinecap="round" pathLength="1" strokeDasharray=".025 .015" opacity=".6"/>
      </g>;
    }
    // The collection visibly receives each item; its envelope closes at the beat landing.
    return <g key={`${i}-${beat.at}`} transform={`translate(${end.x} ${end.y})`} opacity={pulse(scene, beat, t, .05, .35)}><ellipse cx="0" cy="38" rx={98 * end.scale} ry="18" fill="none" stroke={theme.accent} strokeWidth="2.4"/><path d="M-98 38v-22M98 38v-22" stroke={theme.accent} strokeWidth="2.4"/></g>;
  })}
</>;

const CompareMounts: React.FC<{scene: Scene; theme: Theme; uid: string}> = ({scene, theme, uid}) => <>
  {Object.values(layout(scene)).map((p, i) => <g key={i} transform={`translate(${p.x} ${p.y}) rotate(${p.rotation}) scale(${p.scale})`}>
    <path d="M-100-131H104V181H-100Z" transform="translate(4 7)" fill={theme.ink} opacity=".12"/>
    <path d="M-100-131H104V181H-100Z" fill={`url(#${uid}-mount)`} stroke={theme.ink} strokeOpacity=".15" strokeWidth="1"/>
    <path d="M-83 78H85" stroke={theme.ink} strokeOpacity=".2"/>
    <rect x="-15" y="-139" width="33" height="13" transform="rotate(3)" fill={theme.comic} opacity=".75"/>
  </g>)}
</>;

const ComicMounts: React.FC<{scene: Scene; t: number; poses: Record<string, Pose>; theme: Theme}> = ({scene, t, poses, theme}) => <>
  {scene.objectIds.map((id, i) => {
    const p = poses[id];
    const selected = scene.beats.filter(b => b.targetId === id && ['focus', 'select', 'result'].includes(b.action)).reduce((q, b) => Math.max(q, pulse(scene, b, t)), 0);
    return <g key={id} transform={`translate(${p.x} ${p.y}) rotate(${p.rotation}) scale(${p.scale})`} opacity={p.opacity}>
      <circle cx="6" cy="7" r={101 + selected * 4} fill={theme.ink}/>
      <circle r={101 + selected * 4} fill={i % 3 === 0 ? '#FFE393' : i % 3 === 1 ? '#FFC3DB' : '#A8D9EE'} stroke={theme.ink} strokeWidth="2.8"/>
      <path d="M-85-48Q-74-72-51-83" fill="none" stroke="#FFFFFF" strokeWidth="4" strokeLinecap="round" opacity=".7"/>
    </g>;
  })}
</>;

const GroupLabels: React.FC<{episode: Episode; scene: Scene; t: number; theme: Theme}> = ({episode, scene, t, theme}) => {
  const groupBeats = sortedBeats(scene).filter(b => b.action === 'group');
  const ids = [...new Set(groupBeats.map(b => b.targetId))];
  return <>{ids.map((id, i) => {
    const object = episode.objects.find(o => o.id === id)!;
    const q = groupBeats.filter(b => b.targetId === id).reduce((v, b) => Math.max(v, smooth(t, b.at - .1, b.at + .14)), 0);
    return <g key={id} opacity={q} transform={`translate(${47 - (1 - q) * 13} ${285 + i * Math.min(90, 330 / ids.length)})`}>
      <circle cx="5" cy="-5" r="4" fill={theme.accent}/><TextRows text={object.label} x={20} y={0} size={17} width={143} color={theme.ink} anchor="start" weight={700}/>
      {object.detail && <TextRows text={object.detail.length > 24 ? `${object.detail.slice(0, 23)}…` : object.detail} x={20} y={lines(object.label, 8).length * 23} size={10} width={136} color={theme.ink} anchor="start" weight={400}/>}
      <path d="M20 44H145" fill="none" stroke={theme.ink} strokeWidth=".7" opacity=".3"/>
    </g>;
  })}</>;
};

const Metric: React.FC<{scene: Scene; t: number; theme: Theme}> = ({scene, t, theme}) => {
  const metric = scene.metric;
  if (!metric) return null;
  const counts = sortedBeats(scene).filter(b => b.action === 'count');
  const q = counts.reduce((value, b) => Math.max(value, beatProgress(scene, b, t, .8)), 0);
  const digits = (String(metric.value).split('.')[1] ?? '').length;
  const value = Number((metric.value * q).toFixed(Math.min(6, digits)));
  const fraction = metric.total ? metric.value / metric.total * q : q;
  const active = counts.reduce((value, b) => Math.max(value, pulse(scene, b, t)), 0);
  const number = new Intl.NumberFormat('en-US', {maximumFractionDigits: Math.min(6, digits)}).format(value);
  const fontSize = Math.min(132, 405 / Math.max(2.5, number.length * .56));
  return <g>
    <ellipse cx="270" cy="493" rx="175" ry="9" fill={theme.ink} opacity=".08"/>
    <g transform={`translate(270 365) rotate(${-4 + active * 2}) scale(${1 + active * .025})`}>
      <path d="M-225-104H215L225 85H-225Z" transform="translate(5 7)" fill={theme.ink}/>
      <path d="M-225-104H215L225 85H-225Z" fill="#F5E3AC" stroke={theme.ink} strokeWidth="2.5"/>
      <text x="0" y="6" textAnchor="middle" fontFamily="Tinos, serif" fontSize={fontSize} fontWeight="700" fill={theme.ink}>{number}</text>
      <TextRows text={metric.unit} y={53} size={23} width={402} color={theme.ink} weight={700}/>
    </g>
    {metric.total !== undefined ? <>
      <rect x="67" y="500" width="406" height="23" rx="11.5" fill="none" stroke={theme.ink} strokeWidth="2"/>
      <rect x="72" y="505" width={396 * fraction} height="13" rx="6.5" fill={theme.accent}/>
      <text x="468" y="546" textAnchor="end" fontFamily={sans} fontSize="15" fill={theme.ink}>{`${metric.value} / ${metric.total} ${metric.unit}`}</text>
    </> : <path d={`M93 501Q270 516 ${93 + q * 354} 498`} fill="none" stroke={theme.accent} strokeWidth="3" strokeLinecap="round"/>}
  </g>;
};

/** The filter wraps the complete evidence screen: bezel, chrome, source image, and annotations. */
const Evidence: React.FC<{episode: Episode; scene: Scene; t: number; theme: Theme; uid: string; camera: Camera}> = ({episode, scene, t, theme, uid, camera}) => {
  const asset = episode.assets.find(a => a.id === scene.evidenceAssetId);
  const beats = sortedBeats(scene);
  const emphasis = beats.filter(b => ['focus', 'select', 'result'].includes(b.action)).reduce((q, b) => Math.max(q, pulse(scene, b, t, .1, .6)), 0);
  const poses = objectPoses(scene, t);
  return <>
    <defs>
      <filter id={`${uid}-lens`} x="0" y="0" width="540" height="960" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
        <feImage href={staticFile('media/lens-map-v3.png')} x="0" y="0" width="540" height="960" preserveAspectRatio="none" result="lens"/>
        <feGaussianBlur in="lens" stdDeviation="1.2" result="lens-smooth"/>
        <feDisplacementMap in="SourceGraphic" in2="lens-smooth" scale={115 + emphasis * 23} xChannelSelector="R" yChannelSelector="G"/>
      </filter>
      <pattern id={`${uid}-scan`} width="3" height="3" patternUnits="userSpaceOnUse"><rect width="3" height=".5" fill="#000000" opacity=".12"/></pattern>
      <radialGradient id={`${uid}-vignette`}><stop offset=".35" stopColor={theme.ink} stopOpacity="0"/><stop offset="1" stopColor={theme.ink} stopOpacity=".24"/></radialGradient>
      <clipPath id={`${uid}-evidence-clip`}><rect x="20" y="216" width="500" height="447" rx="4"/></clipPath>
    </defs>
    <rect width="540" height="960" fill={theme.ink}/>
    <g filter={`url(#${uid}-lens)`}>
      <g transform={cameraTransform(camera)}>
        <rect x="-19" y="91" width="578" height="671" rx="19" fill="#141714" stroke="#808477" strokeWidth="1.5"/>
        <rect x="-18" y="92" width="576" height="39" rx="17" fill="#33372F"/>
        {['#D97762', '#D8C080', '#91B188'].map((color, i) => <circle key={color} cx={20 + i * 16} cy="111" r="4" fill={color}/>)}
        <text x="496" y="115" textAnchor="end" fill="#DADFD2" fontSize="10" fontFamily={sans}>{asset ? '本期资料' : '示意界面 · 非网站实录'}</text>
        <TextRows text={scene.title} x={27} y={179} size={27} width={486} color="#F8F7EF" family={serif} weight={700} anchor="start"/>
        <rect x="17" y="213" width="506" height="453" rx="5" fill={asset ? '#E9E9E1' : theme.paper} stroke="#7C8572" strokeWidth="1"/>
        {asset ? <>
          <foreignObject x="20" y="216" width="500" height="447"><Img src={staticFile(asset.path)} style={{width: '100%', height: '100%', objectFit: 'contain'}}/></foreignObject>
          {beats.filter(b => ['focus', 'select', 'result'].includes(b.action)).map((b, i) => {
            const p = layout(scene)[b.targetId], q = pulse(scene, b, t, .1, .7);
            return p && <g key={i} opacity={q}><path d={`M${p.x - 65} ${p.y - 46}v-14h24M${p.x + 65} ${p.y - 46}v-14h-24M${p.x - 65} ${p.y + 46}v14h24M${p.x + 65} ${p.y + 46}v14h-24`} fill="none" stroke={theme.accent} strokeWidth="4"/><rect x={p.x - 73} y={p.y + 69} width="146" height="29" fill={theme.paper}/><TextRows text={episode.objects.find(o => o.id === b.targetId)?.label ?? ''} x={p.x} y={p.y + 89} size={13} width={142} color={theme.ink}/></g>;
          })}
        </> : <g clipPath={`url(#${uid}-evidence-clip)`}>
          <path d="M29 252H504M29 272H327" stroke={theme.ink} strokeWidth="2" opacity=".15"/>
          {scene.objectIds.map(id => {
            const object = episode.objects.find(o => o.id === id)!;
            const p = poses[id];
            const selected = beats.filter(b => b.targetId === id && ['select', 'focus', 'result'].includes(b.action)).reduce((q, b) => Math.max(q, pulse(scene, b, t, .12, .6)), 0);
            const columnWidth = scene.objectIds.length > 4 ? 245 : 480;
            const rowX = scene.objectIds.length > 4 ? p.x - 42 : 31;
            return <g key={id}>
              <rect x={rowX} y={p.y - 48} width={columnWidth} height="97" rx="5" fill={theme.comic} opacity={selected * .56}/>
              <rect x={rowX} y={p.y - 42} width="3" height="79" rx="1.5" fill={theme.accent} opacity={selected}/>
              <ObjectVisual object={object} asset={episode.assets.find(a => a.id === object.assetId)} pose={p} theme={theme} uid={uid} scene={scene} t={t} labels={false}/>
              <TextRows text={object.label} x={p.x + (scene.objectIds.length === 1 ? 94 : 51)} y={p.y - 5} size={scene.objectIds.length > 4 ? 15 : 20} width={scene.objectIds.length > 4 ? 147 : 320} color={theme.ink} anchor="start"/>
              {object.detail && <TextRows text={object.detail} x={p.x + (scene.objectIds.length === 1 ? 94 : 51)} y={p.y + 24} size={11} width={scene.objectIds.length > 4 ? 147 : 310} color={theme.ink} anchor="start" weight={400}/>}
              <path d={`M${rowX + 10} ${p.y + 51}H${rowX + columnWidth - 12}`} stroke={theme.ink} strokeWidth=".65" opacity=".17"/>
            </g>;
          })}
          <Relations scene={scene} t={t} poses={poses} theme={theme} uid={uid}/>
          <text x="501" y="649" textAnchor="end" fontFamily={sans} fontSize="12" fontWeight="700" fill={theme.accent}>示意</text>
        </g>}
        <path d="M27 693H513" stroke="#77806D" strokeWidth="1.5"/>
        <rect x="27" y="691" width={486 * smooth(t, scene.start, scene.end)} height="4" fill={theme.comic}/>
        <text x="27" y="724" fontFamily={sans} fontSize="11" fill="#D0D5C6">{asset ? (asset.role === 'brand' ? '品牌材料' : '资料画面') : '示意内容来自本期分镜'}</text>
      </g>
    </g>
    <rect width="540" height="960" fill={`url(#${uid}-scan)`} opacity=".42"/>
    <rect width="540" height="960" fill={`url(#${uid}-vignette)`}/>
  </>;
};

export const SceneView: React.FC<{episode: Episode; scene: Scene; t: number; previous?: Scene}> = ({episode, scene, t, previous}) => {
  const theme = {...DEFAULT_THEME, ...episode.theme}, uid = `s-${safeId(scene.id)}`;
  const poses = objectPoses(scene, t), ownCamera = cameraAt(scene, t);
  let camera = ownCamera;
  // A shared object's position and scale survive a match cut, then the new camera settles.
  if (previous?.transition === 'match') {
    const common = scene.objectIds.find(id => previous.objectIds.includes(id));
    if (common) {
      const oldPose = objectPoses(previous, previous.end)[common], oldCam = cameraAt(previous, previous.end), newPose = poses[common];
      const oldX = 270 + (oldPose.x - oldCam.x) * oldCam.z, oldY = 447 + (oldPose.y - oldCam.y) * oldCam.z;
      const z = oldCam.z * oldPose.scale / Math.max(.01, newPose.scale);
      const match = {x: newPose.x - (oldX - 270) / z, y: newPose.y - (oldY - 447) / z, z};
      const q = smooth(t, scene.start, Math.min(scene.end, scene.start + .48));
      camera = {x: mix(match.x, ownCamera.x, q), y: mix(match.y, ownCamera.y, q), z: mix(match.z, ownCamera.z, q)};
    }
  }
  const objects = scene.objectIds.map(id => episode.objects.find(o => o.id === id)!).filter(Boolean);
  // Collection containers render first so arriving items remain visible on the opening.
  const containers = new Set(scene.beats.filter(b => b.action === 'group').map(b => b.withId));
  const drawingOrder = [...objects].sort((a, b) => Number(containers.has(b.id)) - Number(containers.has(a.id)));
  return <svg width="540" height="960" viewBox="0 0 540 960" style={{position: 'absolute', inset: 0, overflow: 'hidden'}}>
    <SceneDefs uid={uid} theme={theme}/>
    {scene.mechanism === 'evidence-zoom' ? <Evidence episode={episode} scene={scene} t={t} theme={theme} uid={uid} camera={camera}/> : <>
      <Backdrop scene={scene} theme={theme} t={t} uid={uid}/>
      <g transform={cameraTransform(camera)}>
        {scene.mechanism === 'compare-pan' && <CompareMounts scene={scene} theme={theme} uid={uid}/>}
        {scene.mechanism === 'question-thread' && <ComicMounts scene={scene} t={t} poses={poses} theme={theme}/>}
        {scene.mechanism === 'metric-build' && <Metric scene={scene} t={t} theme={theme}/>}
        <Relations scene={scene} t={t} poses={poses} theme={theme} uid={uid}/>
        {drawingOrder.map(object => <ObjectVisual key={object.id} object={object} asset={episode.assets.find(a => a.id === object.assetId)} pose={poses[object.id]} theme={theme} uid={uid} scene={scene} t={t}/>)}
      </g>
      {scene.mechanism === 'group-sort' && <GroupLabels episode={episode} scene={scene} t={t} theme={theme}/>}
      <Header scene={scene} theme={theme} t={t}/>
    </>}
  </svg>;
};
