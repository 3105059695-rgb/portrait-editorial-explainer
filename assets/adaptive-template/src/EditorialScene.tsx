import React from 'react';
import {Img, staticFile} from 'remotion';
import {editorialCameraAt, layerTransform, resolveEditorialLayer} from './editorialMotion';
import {cameraTransform, clamp, mix, safeId, smooth} from './timeline';
import type {EditorialConfig, Episode, Scene, Theme} from './types';

const serif = '"Noto Serif SC", serif';
const sans = '"Noto Sans SC", sans-serif';
const dark = '#27223b';
const coral = '#ee4767';
const fallback: Theme = {paper: '#f7f7f3', ink: '#252722', accent: '#b65c3e', comic: '#d8caff'};
const elastic = (t: number, a: number, b: number) => {
  const p = clamp((t - a) / Math.max(.001, b - a));
  return p === 1 ? 1 : 1 - Math.pow(1 - p, 3) * Math.cos(p * Math.PI * 2.15);
};

const Spark: React.FC<{x: number; y: number; r: number; fill: string; rotation?: number}> = ({x, y, r, fill, rotation = 0}) =>
  <path d={`M0 ${-r}Q${r * .15} ${-r * .14} ${r} 0Q${r * .15} ${r * .14} 0 ${r}Q${-r * .15} ${r * .14} ${-r} 0Q${-r * .15} ${-r * .14} 0 ${-r}Z`} fill={fill} stroke={dark} strokeWidth="2" transform={`translate(${x} ${y}) rotate(${rotation})`}/>;

/** Background material is a scene choice. Objects and the camera supply the action. */
const Material: React.FC<{config: EditorialConfig; theme: Theme; uid: string; local: number}> = ({config, theme, uid, local}) => <>
  <defs>
    <radialGradient id={`${uid}-paper`} cx="50%" cy="38%" r="80%"><stop stopColor="#fffffa"/><stop offset=".72" stopColor={theme.paper}/><stop offset="1" stopColor="#d9d9d0"/></radialGradient>
    <filter id={`${uid}-grain`}><feTurbulence baseFrequency=".7" type="fractalNoise" numOctaves="2" seed="22"/></filter>
    <filter id={`${uid}-shadow`} x="-60%" y="-60%" width="220%" height="230%"><feDropShadow dx="2" dy="5" stdDeviation="1" floodColor="#77796e" floodOpacity=".16"/><feDropShadow dx="0" dy="12" stdDeviation="9" floodColor={theme.ink} floodOpacity=".18"/></filter>
    <linearGradient id={`${uid}-film`} x1="0" y1="0" x2="0" y2="1"><stop stopColor="#383047"/><stop offset=".5" stopColor="#211d31"/><stop offset="1" stopColor="#322941"/></linearGradient>
  </defs>
  <rect width="540" height="960" fill={config.background === 'ink' ? theme.ink : config.background === 'comic' ? theme.comic : `url(#${uid}-paper)`}/>
  {config.background === 'comic' && <>
    <g transform={`rotate(${local * .65} 282 332)`} opacity=".19">
      {Array.from({length: 18}, (_, i) => {const a = i * Math.PI / 9, b = a + Math.PI / 20; return <path key={i} d={`M282 332L${282 + 1250 * Math.cos(a)} ${332 + 1250 * Math.sin(a)}L${282 + 1250 * Math.cos(b)} ${332 + 1250 * Math.sin(b)}Z`} fill="#7555ad"/>;})}
    </g>
    <g opacity=".13" fill="#62518d">{Array.from({length: 90}, (_, i) => <circle key={i} cx={17 + (i * 109) % 519} cy={27 + (i * 173) % 877} r="1.4"/>)}</g>
    <Spark x={58} y={156} r={12} fill="#ffc4de" rotation={12}/><Spark x={466} y={213} r={14} fill="#fff0a3" rotation={17}/>
    <Spark x={445} y={447} r={10} fill="#89dda0" rotation={-16}/><Spark x={49} y={455} r={8} fill="#81caff" rotation={7}/>
    <circle cx="437" cy="137" r="4" fill="#fff7d0" stroke={dark} strokeWidth="2"/>
  </>}
</>;

const Heading: React.FC<{config: EditorialConfig; theme: Theme; local: number}> = ({config, theme, local}) => {
  let current = {title: config.title ?? '', eyebrow: config.eyebrow ?? ''};
  let previous = current, changedAt = -Infinity;
  for (const key of config.titleKeys ?? []) {
    if (key.at > local) break;
    previous = current;
    current = {title: key.title, eyebrow: key.eyebrow ?? current.eyebrow};
    changedAt = key.at;
  }
  if (!current.title && !current.eyebrow && !previous.title && !previous.eyebrow) return null;
  const change = Number.isFinite(changedAt) ? smooth(local, changedAt, changedAt + .16) : 1;
  const q = smooth(local, -.12, .22);
  const ink = config.background === 'ink' ? '#f7f5e9' : theme.ink;
  const renderText = (text: typeof current, opacity: number, dy: number) => {
    if (opacity <= 0) return null;
    if (config.background === 'comic' && text.title) return <g opacity={opacity} transform={`translate(270 ${105 - 10 * (1 - q) + dy}) rotate(-3)`}>
      <rect x="-112" y="-27" width="224" height="64" rx="14" fill={dark}/>
      <rect x="-115" y="-32" width="224" height="64" rx="14" fill="#fffcec" stroke={dark} strokeWidth="3"/>
      <text x="-3" y="10" textAnchor="middle" fontSize={Math.min(34, 201 / Math.max(1, text.title.length))} fontWeight="900" fontFamily={sans} fill={dark}>{text.title}</text>
    </g>;
    return <g opacity={opacity} transform={`translate(0 ${12 * (1 - q) + dy})`}>
      {text.eyebrow && <text x="36" y="93" fontFamily={serif} fontSize="15" letterSpacing="1.2" fill={ink}>{text.eyebrow}</text>}
      {text.title && <>
        <text x="35" y="151" fontFamily={serif} fontSize={Math.min(49, 468 / Math.max(1, text.title.length))} fontWeight="700" fill={ink}>{text.title}</text>
        <path d={`M37 170Q190 174 ${37 + Math.min(430, text.title.length * 43) * q} 168`} fill="none" stroke={theme.accent} strokeWidth="3.5" strokeLinecap="round"/>
      </>}
    </g>;
  };
  return <g opacity={q}>{change < 1 && renderText(previous, 1 - change, -8 * change)}{renderText(current, change, 8 * (1 - change))}</g>;
};

/** Catmull-Rom interpolation makes authored semantic routes smooth without a fixed grid. */
const routePath = (points: {x: number; y: number}[]) => {
  if (!points.length) return '';
  let path = `M${points[0].x} ${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const before = points[Math.max(0, i - 1)], a = points[i], b = points[i + 1], after = points[Math.min(points.length - 1, i + 2)];
    path += `C${a.x + (b.x - before.x) / 6} ${a.y + (b.y - before.y) / 6} ${b.x - (after.x - a.x) / 6} ${b.y - (after.y - a.y) / 6} ${b.x} ${b.y}`;
  }
  return path;
};

/** A physical strip with arbitrary source count. Thread knots follow each actual frame. */
const Filmstrip: React.FC<{episode: Episode; strip: NonNullable<EditorialConfig['filmstrip']>; uid: string; local: number}> = ({episode, strip, uid, local}) => {
  const n = strip.assetIds.length;
  if (!n) return null;
  const enter = elastic(local, strip.enterAt, strip.settleAt);
  const run = smooth(local, strip.threadAt, strip.threadEnd);
  const h = strip.h, w = strip.w, pad = Math.min(24, w * .045), cell = (w - 2 * pad) / n;
  const edge = Math.min(12, cell * .08), innerY = h * .162, innerH = h * .66;
  const drift = (540 + w * .35) * (1 - enter);
  const rotation = (strip.rotation ?? -5) + (1 - enter) * 7;
  const perforationStep = Math.max(13, h * .14), perforations = Math.ceil((w + 220) / perforationStep);
  const lower = h * .855, upper = h * .145;
  let thread = `M${pad - 7} ${lower}`;
  for (let i = 0; i < n; i++) {
    const left = pad + i * cell, right = left + cell;
    thread += `C${left + cell * .2} ${h * 1.02} ${left + cell * .39} ${lower} ${left + cell * .45} ${h * .48}`;
    thread += `C${left + cell * .54} ${upper - 12} ${left + cell * .78} ${upper - 9} ${left + cell * .79} ${h * .47}`;
    thread += `C${left + cell * .78} ${h * .94} ${right - cell * .13} ${lower} ${right} ${lower}`;
  }
  const fasten = elastic(local, strip.threadEnd - .08, strip.threadEnd + .16);
  return <g transform={`translate(${strip.x + drift} ${strip.y}) rotate(${rotation} ${w / 2} ${h / 2})`}>
    <defs>{strip.assetIds.map((_, i) => <clipPath key={i} id={`${uid}-film-frame-${i}`}><rect x={pad + i * cell + edge} y={innerY} width={Math.max(1, cell - 2 * edge)} height={innerH} rx="7"/></clipPath>)}</defs>
    <rect x="-110" y="8" width={w + 220} height={h + 7} rx="7" fill="#87709f" opacity=".28"/>
    <rect x="-110" width={w + 220} height={h} rx="5" fill={`url(#${uid}-film)`} stroke={dark} strokeWidth="3"/>
    {Array.from({length: perforations}, (_, i) => <g key={i} fill="#fff9ee"><rect x={-102 + i * perforationStep} y={h * .04} width={perforationStep * .57} height={h * .06} rx="2"/><rect x={-102 + i * perforationStep} y={h * .904} width={perforationStep * .57} height={h * .06} rx="2"/></g>)}
    {strip.assetIds.map((id, i) => {
      const asset = episode.assets.find(a => a.id === id), x = pad + i * cell + edge, iw = Math.max(1, cell - 2 * edge);
      return <g key={`${id}-${i}`}>
        <rect x={x - 6} y={innerY - 5} width={iw + 12} height={innerH + 10} rx="9" fill={['#ffda58', '#77caff', '#ff8bbc', '#9ad5ae'][i % 4]}/>
        <g clipPath={`url(#${uid}-film-frame-${i})`}>
          <rect x={x} y={innerY} width={iw} height={innerH} fill="#292631"/>
          {asset && <foreignObject x={x} y={innerY} width={iw} height={innerH}><Img src={staticFile(asset.path)} style={{width: '100%', height: '100%', objectFit: 'cover'}}/></foreignObject>}
        </g>
        <rect x={x} y={innerY} width={iw} height={innerH} rx="7" fill="none" stroke={dark} strokeWidth="2"/>
      </g>;
    })}
    <path d={thread} pathLength="1" stroke={dark} strokeWidth="7" fill="none" strokeLinecap="round" strokeDasharray="1" strokeDashoffset={1 - run}/>
    <path d={thread} pathLength="1" stroke={coral} strokeWidth="4" fill="none" strokeLinecap="round" strokeDasharray="1" strokeDashoffset={1 - run}/>
    <g transform={`translate(${w - pad} ${lower}) scale(${Math.max(.001, fasten)})`} opacity={smooth(local, strip.threadEnd - .1, strip.threadEnd + .03)}>
      <circle r="15" fill="#ffe05d" stroke={dark} strokeWidth="2.5"/><circle r="5" fill={dark}/>
      <path d="M-1 0C-21-26-36 3-12 9C13 15 25-23 3-6C-8 3 4 7 13 6" stroke={coral} strokeWidth="4" strokeLinecap="round" fill="none"/>
    </g>
  </g>;
};

/** The lens distorts the complete designed screen, never the source photograph alone. */
const EvidenceWorld: React.FC<{episode: Episode; evidence: NonNullable<EditorialConfig['evidence']>; scene: Scene; local: number; uid: string}> = ({episode, evidence, scene, local, uid}) => {
  const asset = episode.assets.find(a => a.id === evidence.assetId);
  if (!asset) return null;
  const camera = editorialCameraAt(scene, scene.start + local);
  const progress = smooth(local, .25, Math.max(.5, scene.end - scene.start - .25));
  const noteQ = elastic(local, evidence.noteAt ?? .8, (evidence.noteAt ?? .8) + .23);
  const noteText = evidence.note ?? '';
  return <>
    <defs>
      <filter id={`${uid}-lens`} x="0" y="0" width="540" height="960" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
        <feImage href={staticFile('media/lens-map-v3.png')} x="0" y="0" width="540" height="960" preserveAspectRatio="none" result="lens"/>
        <feGaussianBlur in="lens" stdDeviation="1.2" result="lens-smooth"/>
        <feDisplacementMap in="SourceGraphic" in2="lens-smooth" scale={evidence.lensStrength ?? 138} xChannelSelector="R" yChannelSelector="G"/>
      </filter>
      <pattern id={`${uid}-scan`} width="3" height="3" patternUnits="userSpaceOnUse"><rect width="3" height=".6" fill="#000000" opacity=".08"/></pattern>
      <radialGradient id={`${uid}-vignette`}><stop offset=".38" stopColor="#000000" stopOpacity="0"/><stop offset="1" stopColor="#000000" stopOpacity=".36"/></radialGradient>
      <clipPath id={`${uid}-source`}><rect x="-10" y="187" width="560" height="356"/></clipPath>
    </defs>
    <g filter={`url(#${uid}-lens)`}><g transform={cameraTransform(camera)}>
      <rect x="-25" y="67" width="590" height="663" rx="15" fill="#111412" stroke="#787b70" strokeWidth="1.2"/>
      <rect x="-24" y="68" width="588" height="42" rx="15" fill="#292c28"/>
      {['#d76f58', '#dfc37a', '#8dac8a'].map((color, i) => <circle key={color} cx={17 + i * 16} cy="88" r="4" fill={color}/>)}
      {evidence.subtitle && <text x="279" y="92" fill="#d2d3ca" fontFamily={sans} fontSize="10" textAnchor="middle">{evidence.subtitle}</text>}
      {evidence.title && <text x="25" y="151" fill="#f1f1e9" fontFamily={serif} fontSize={Math.min(29, 489 / Math.max(1, evidence.title.length))} fontWeight="700">{evidence.title}</text>}
      <rect x="-15" y="181" width="570" height="373" fill="#111111"/>
      <g clipPath={`url(#${uid}-source)`}><foreignObject x="-10" y="187" width="560" height="356"><Img src={staticFile(asset.path)} style={{width: '100%', height: '100%', objectFit: 'cover'}}/></foreignObject></g>
      <path d="M22 578H519" stroke="#4d5148" strokeWidth="2"/>
      <rect x="22" y="577" width={mix(34, 497, progress)} height="3" fill="#b7c8a4"/>
      {evidence.subtitle && <text x="25" y="617" fontFamily={sans} fontSize="14" fill="#dddcd2">{evidence.subtitle}</text>}
      <path d="M25 652H489M25 669H309" stroke="#aaaFA3" strokeOpacity=".23" strokeWidth="1.2"/>
    </g></g>
    <rect width="540" height="960" fill={`url(#${uid}-scan)`} opacity=".7"/>
    <rect width="540" height="960" fill={`url(#${uid}-vignette)`}/>
    {noteText && <g transform={cameraTransform(camera)}><g transform={`translate(338.5 ${702.5 + (1 - noteQ) * 92}) rotate(-6) scale(${mix(.72, 1, noteQ)}) translate(-167.5 -90.5)`} opacity={clamp(noteQ)}>
      <rect x="5" y="7" width="335" height="181" fill="#a18f4f" stroke="#191d16" strokeWidth="2"/>
      <rect width="335" height="181" fill="#f1e4a5" stroke="#191d16" strokeWidth="3"/>
      <text x="167.5" y="121" textAnchor="middle" fontFamily={/^[\d\s+h.%]+$/i.test(noteText) ? 'Tinos, serif' : serif} fontSize={Math.min(128, 296 / Math.max(1, noteText.length * (/^[\d\s+h.%]+$/i.test(noteText) ? .56 : 1)))} fontWeight="700" fill="#22261c">{noteText}</text>
      <path d="M30 148Q164 156 301 148" stroke="#837849" strokeWidth="2" fill="none"/>
    </g></g>}
  </>;
};

/** Portable V3 mechanisms: authored assets and local keys, not a fixed episode or UI grid. */
export const EditorialScene: React.FC<{episode: Episode; scene: Scene; t: number; foreground?: boolean}> = ({episode, scene, t, foreground = false}) => {
  const config = scene.editorial;
  if (!config) return null;
  const theme = {...fallback, ...episode.theme}, uid = `editorial-${safeId(scene.id)}-${foreground ? 'fg' : 'bg'}`, local = t - scene.start;
  const camera = editorialCameraAt(scene, t);
  const layers = config.layers.filter(layer => Boolean(layer.foreground) === foreground).map(layer => {
    const asset = episode.assets.find(a => a.id === layer.assetId), pose = resolveEditorialLayer(layer, local);
    if (!asset || pose.opacity <= 0) return null;
    return <g key={layer.id} transform={layerTransform(pose)} opacity={pose.opacity} filter={layer.shadow ? `url(#${uid}-shadow)` : undefined}>
      <foreignObject width={pose.w} height={pose.h}><Img src={staticFile(asset.path)} style={{width: '100%', height: '100%', objectFit: 'contain'}}/></foreignObject>
    </g>;
  });
  if (foreground) return <svg width="540" height="960" viewBox="0 0 540 960" style={{position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none'}}>
    <defs><filter id={`${uid}-shadow`} x="-60%" y="-60%" width="220%" height="230%"><feDropShadow dx="2" dy="5" stdDeviation="1" floodColor="#77796e" floodOpacity=".16"/><feDropShadow dx="0" dy="12" stdDeviation="9" floodColor={theme.ink} floodOpacity=".18"/></filter></defs>
    <g transform={cameraTransform(camera)}>{layers}</g>
  </svg>;
  return <svg width="540" height="960" viewBox="0 0 540 960" style={{position: 'absolute', inset: 0, overflow: 'hidden'}}>
    <Material config={config} theme={theme} uid={uid} local={local}/>
    {config.evidence && <EvidenceWorld episode={episode} evidence={config.evidence} scene={scene} local={local} uid={uid}/>}
    <g transform={cameraTransform(camera)}>
      {(config.connections ?? []).map(connection => {
        const q = smooth(local, connection.start, connection.end), path = routePath(connection.points);
        return <g key={connection.id} opacity={clamp(q * 8)}>
          {config.background === 'comic' && <path d={path} fill="none" stroke={dark} strokeWidth={(connection.width ?? 4) + 3} strokeLinecap="round" strokeLinejoin="round" pathLength="1" strokeDasharray="1" strokeDashoffset={1 - q}/>}
          <path d={path} fill="none" stroke={connection.color ?? (config.background === 'comic' ? coral : theme.ink)} strokeWidth={connection.width ?? 2} strokeLinecap="round" strokeLinejoin="round" pathLength="1" strokeDasharray="1" strokeDashoffset={1 - q}/>
        </g>;
      })}
      {layers}
      {config.filmstrip && <Filmstrip episode={episode} strip={config.filmstrip} uid={uid} local={local}/>}
    </g>
    <Heading config={config} theme={theme} local={local}/>
    <rect width="540" height="960" filter={`url(#${uid}-grain)`} opacity=".021" pointerEvents="none"/>
  </svg>;
};
