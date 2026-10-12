import React, {useLayoutEffect, useMemo} from 'react';
import {staticFile, useDelayRender} from 'remotion';
import type {EffectProps} from '../types';
import type {UICameraFrame, UIFrame, UINode, UIPlan} from '../ui-types';

const INK = '#242623';
const MUTED = '#898b83';
const BORDER = '#e6e7df';
const ACCENT = '#b96e4e';
const SANS = '"Noto Sans SC", sans-serif';
const MONO = 'ui-monospace, "Cascadia Code", Consolas, monospace';
const clamp = (value: number) => Math.max(0, Math.min(1, value));
const lerp = (a: number, b: number, p: number) => a + (b - a) * p;

const numericKeys = ['x', 'y', 'w', 'h', 'radius', 'fontSize', 'weight', 'opacity', 'rotation', 'value'] as const;
type NumericKey = typeof numericKeys[number];

const eased = (progress: number, ease: UIFrame['ease'] = 'smooth') => {
  const p = clamp(progress);
  if (ease === 'linear') return p;
  if (ease === 'out') return 1 - Math.pow(1 - p, 3);
  return p * p * (3 - 2 * p);
};

const defaultSize = (node: UINode) => node.type === 'badge' ? 11 : node.type === 'text' ? 15 : 12;
const defaultValue = (node: UINode) => node.type === 'chart' || node.type === 'line' ? 1 : 0;
const initialNumber = (node: UINode, key: NumericKey): number => {
  const current = node[key];
  if (typeof current === 'number') return current;
  if (key === 'opacity') return 1;
  if (key === 'weight') return node.type === 'button' || node.type === 'badge' ? 600 : 400;
  if (key === 'fontSize') return defaultSize(node);
  if (key === 'radius') return node.type === 'badge' ? 999 : node.type === 'panel' ? 15 : 8;
  if (key === 'value') return defaultValue(node);
  return 0;
};

/** Evaluate each property on its own track. A later x-only keyframe must not
 * reset y, text, colors, or an opacity state set by an earlier keyframe.
 * Easing belongs to the destination keyframe, and a node's id is immutable.
 */
export function resolveUINode(node: UINode, frames: readonly UIFrame[], t: number): UINode {
  const sorted = [...frames].sort((a, b) => a.at - b.at);
  const result: UINode = {...node};
  for (const frame of sorted) {
    if (frame.at > t) break;
    Object.assign(result, frame.set);
  }
  for (const key of numericKeys) {
    const keys = sorted.filter(frame => typeof frame.set[key] === 'number');
    if (!keys.length) continue;
    let previousAt = 0;
    let previousValue = initialNumber(node, key);
    let resolved = previousValue;
    for (const frame of keys) {
      const value = frame.set[key] as number;
      if (frame.at <= t) {
        previousAt = frame.at;
        previousValue = value;
        resolved = value;
        continue;
      }
      const p = (t - previousAt) / Math.max(0.0001, frame.at - previousAt);
      resolved = lerp(previousValue, value, eased(p, frame.ease));
      break;
    }
    result[key] = resolved;
  }
  result.id = node.id;
  return result;
}

export function resolveUICamera(frames: readonly UICameraFrame[], t: number, canvasHeight: number) {
  const sorted = [...frames].sort((a, b) => a.at - b.at);
  let previous: UICameraFrame = {at: 0, x: 272, y: canvasHeight / 2, scale: 1};
  for (const next of sorted) {
    if (next.at <= t) {
      previous = next;
      continue;
    }
    const p = eased((t - previous.at) / Math.max(0.0001, next.at - previous.at));
    return {
      x: lerp(previous.x, next.x, p),
      y: lerp(previous.y, next.y, p),
      scale: Math.max(0.01, lerp(previous.scale, next.scale, p)),
    };
  }
  return {...previous, scale: Math.max(0.01, previous.scale)};
}

// Encode every character, rather than stripping punctuation: different scene
// and node names must not silently share an SVG clip or filter id.
const svgId = (text: string) => `ui-${[...text].map(char => char.codePointAt(0)!.toString(16)).join('-')}`;
const modifiers = (node: UINode) => new Set((node.emphasis ?? '').split(/[\s,]+/).filter(Boolean));
const units = (char: string) => /[^\x00-\xff]/.test(char) ? 1 : /[MW@%]/.test(char) ? 0.8 : /[il.,:;'!| ]/.test(char) ? 0.3 : 0.55;

function linesFor(text: string, width: number, fontSize: number, maxLines = Infinity) {
  const lines: string[] = [];
  let line = '';
  let used = 0;
  for (const char of [...text]) {
    const next = units(char) * fontSize;
    if (char === '\n' || (line.length > 0 && used + next > width)) {
      lines.push(line);
      line = '';
      used = 0;
    }
    if (char !== '\n') {
      line += char;
      used += next;
    }
  }
  if (line || !lines.length) lines.push(line);
  if (lines.length <= maxLines) return lines;
  const visible = lines.slice(0, Math.max(1, maxLines));
  const last = visible.length - 1;
  visible[last] = [...visible[last]].slice(0, -1).join('') + '…';
  return visible;
}

const NodeText: React.FC<{
  node: UINode;
  color: string;
  padding?: number;
  centered?: boolean;
}> = ({node, color, padding = 0, centered = false}) => {
  if (!node.text) return null;
  const size = Math.max(1, node.fontSize ?? defaultSize(node));
  const lineHeight = size * 1.48;
  const availableWidth = Math.max(1, node.w - padding * 2);
  const availableHeight = Math.max(size, node.h - padding * 2);
  const lines = linesFor(node.text, availableWidth, size, Math.max(1, Math.floor((availableHeight + lineHeight - size) / lineHeight)));
  const blockHeight = size + (lines.length - 1) * lineHeight;
  const flags = modifiers(node);
  const baseline = centered ? (node.h - blockHeight) / 2 + size * 0.84 : padding + size * 0.84;
  const alignCenter = centered || flags.has('center');
  return <text
    x={alignCenter ? node.w / 2 : padding}
    y={baseline}
    fontSize={size}
    fontWeight={node.weight ?? (flags.has('heading') ? 700 : initialNumber(node, 'weight'))}
    fontFamily={flags.has('code') ? MONO : SANS}
    fill={color}
    textAnchor={alignCenter ? 'middle' : 'start'}
    xmlSpace="preserve"
  >
    {lines.map((line, index) => <tspan key={index} x={alignCenter ? node.w / 2 : padding} dy={index ? lineHeight : 0}>{line}</tspan>)}
  </text>;
};

const Definitions: React.FC<{id: string}> = ({id}) => <defs>
  <filter id={`${id}-panel-shadow`} x="-35%" y="-40%" width="170%" height="190%" colorInterpolationFilters="sRGB">
    <feDropShadow dx="0" dy="13" stdDeviation="12" floodColor="#393b32" floodOpacity="0.085"/>
    <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="#393b32" floodOpacity="0.045"/>
  </filter>
  <filter id={`${id}-button-shadow`} x="-35%" y="-70%" width="170%" height="250%" colorInterpolationFilters="sRGB">
    <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="#514334" floodOpacity="0.10"/>
  </filter>
  <filter id={`${id}-cursor-shadow`} x="-100%" y="-100%" width="300%" height="300%" colorInterpolationFilters="sRGB">
    <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="#252821" floodOpacity="0.20"/>
  </filter>
</defs>;

/** Native SVG image elements do not hold Remotion's screenshot clock. Load and
 * decode every supplied image state before the first frame of this UI scene,
 * including images introduced by later keyframes. A missing asset fails the
 * render instead of producing a successful movie with an empty rectangle.
 */
const PreloadImages: React.FC<{signature: string}> = ({signature}) => {
  const {delayRender, continueRender, cancelRender} = useDelayRender();
  useLayoutEffect(() => {
    const handle = delayRender('Loading composable UI image states');
    let mounted = true;
    let released = false;
    const images: HTMLImageElement[] = [];
    const release = () => {
      if (released) return;
      released = true;
      continueRender(handle);
    };
    const paths: string[] = JSON.parse(signature);
    const requests = paths.map(path => new Promise<void>((resolve, reject) => {
      const image = new Image();
      images.push(image);
      image.onload = () => {
        image.decode().then(() => resolve(), error => reject(new Error(`Unable to decode UI image: ${path}`, {cause: error})));
      };
      image.onerror = () => reject(new Error(`Unable to load UI image: ${path}`));
      image.src = staticFile(path);
    }));
    Promise.all(requests).then(() => {
      if (mounted) release();
    }, error => {
      if (mounted) cancelRender(error);
    });
    return () => {
      mounted = false;
      for (const image of images) {
        image.onload = null;
        image.onerror = null;
      }
      release();
    };
  }, [signature, delayRender, continueRender, cancelRender]);
  return null;
};

const Surface: React.FC<{node: UINode; id: string; accent: string}> = ({node, id, accent}) => {
  const flags = modifiers(node);
  const radius = Math.max(0, Math.min(node.w / 2, node.h / 2, initialNumber(node, 'radius')));
  const selected = flags.has('selected');
  const statusColor = flags.has('success') ? '#66846b' : flags.has('error') ? '#b86452' : accent;
  const color = node.color ?? (flags.has('muted') ? MUTED : INK);
  const stroke = node.stroke ?? (selected ? statusColor : BORDER);
  const value = clamp(node.value ?? defaultValue(node));
  const clipId = `${id}-${svgId(node.id)}-clip`;
  const rect = {width: Math.max(0, node.w), height: Math.max(0, node.h), rx: radius};

  if (node.type === 'panel') return <g>
    <rect {...rect} fill={node.fill ?? (flags.has('inset') ? '#f4f5ef' : '#fffefa')} stroke={stroke} strokeWidth={selected ? 1.4 : 0.85} filter={flags.has('flat') || flags.has('inset') ? undefined : `url(#${id}-panel-shadow)`}/>
    {!flags.has('flat') && !flags.has('inset') && <path d={`M${radius + 1} 1H${Math.max(radius + 1, node.w - radius - 1)}`} stroke="#ffffff" strokeOpacity="0.85"/>}
    <NodeText node={node} color={color} padding={16}/>
  </g>;

  if (node.type === 'text') return <NodeText node={node} color={color}/>;

  if (node.type === 'button') {
    const primary = flags.has('primary');
    const pressed = flags.has('pressed') ? 0.97 : 1 - Math.sin(value * Math.PI) * 0.025;
    return <g transform={`translate(${node.w / 2} ${node.h / 2}) scale(${pressed}) translate(${-node.w / 2} ${-node.h / 2})`}>
      <rect {...rect} fill={node.fill ?? (primary ? statusColor : flags.has('ghost') ? 'none' : '#fffefa')} stroke={node.stroke ?? (primary ? statusColor : BORDER)} strokeWidth="0.9" filter={flags.has('ghost') || flags.has('pressed') ? undefined : `url(#${id}-button-shadow)`}/>
      <NodeText node={node} color={node.color ?? (primary ? '#fffdf8' : color)} padding={8} centered/>
    </g>;
  }

  if (node.type === 'input') return <g>
    {selected && <rect x="-2.5" y="-2.5" width={node.w + 5} height={node.h + 5} rx={radius + 2} fill="none" stroke={statusColor} strokeOpacity="0.12" strokeWidth="3"/>}
    <rect {...rect} fill={node.fill ?? '#fbfcf8'} stroke={stroke} strokeWidth={selected ? 1.15 : 0.9}/>
    <NodeText node={node} color={node.color ?? (flags.has('placeholder') ? MUTED : color)} padding={12} centered={false}/>
    {selected && !node.text && <path d={`M12 11V${Math.min(node.h - 10, 27)}`} stroke={statusColor} strokeWidth="1.2"/>}
  </g>;

  if (node.type === 'badge') return <g>
    <rect {...rect} fill={node.fill ?? (selected ? '#f1dfd1' : '#eef1e7')} stroke={node.stroke ?? 'none'} strokeWidth="0.8"/>
    <NodeText node={node} color={node.color ?? (selected ? '#84563d' : '#64705c')} padding={7} centered/>
  </g>;

  if (node.type === 'image') return <g>
    <defs><clipPath id={clipId}><rect {...rect}/></clipPath></defs>
    <rect {...rect} fill={node.fill ?? '#eeeee6'}/>
    <g clipPath={`url(#${clipId})`}>
      {node.image && <image href={staticFile(node.image)} width={node.w} height={node.h} preserveAspectRatio={flags.has('contain') ? 'xMidYMid meet' : 'xMidYMid slice'}/>}
      {!node.image && <NodeText node={node} color={color} padding={12} centered/>}
    </g>
    <rect {...rect} fill="none" stroke={node.stroke ?? '#25261e0d'} strokeWidth={selected ? 1.5 : 0.75}/>
  </g>;

  if (node.type === 'progress') return <g>
    <defs><clipPath id={clipId}><rect {...rect}/></clipPath></defs>
    <rect {...rect} fill={node.fill ?? '#eceee5'}/>
    <g clipPath={`url(#${clipId})`}><rect width={Math.max(0, node.w * value)} height={node.h} rx={radius} fill={node.color ?? statusColor}/></g>
    {node.text && <NodeText node={node} color={node.stroke ?? INK} padding={2} centered/>}
  </g>;

  if (node.type === 'line') return <g>
    <path d={`M0 0L${node.w} ${node.h}`} fill="none" stroke={node.stroke ?? node.color ?? '#dfe2d7'} strokeWidth={flags.has('strong') ? 2 : 1} strokeLinecap="round" pathLength="1" strokeDasharray={flags.has('dashed') ? '0.025 0.018' : '1'} strokeDashoffset={flags.has('dashed') ? 0 : 1 - value}/>
    {node.text && <NodeText node={{...node, y: 0, h: Math.max(node.h, 18)}} color={color} padding={4}/>}
  </g>;

  if (node.type === 'chart') {
    const points = node.points ?? [];
    if (!points.length) return null;
    const padding = 5;
    const min = Math.min(...points);
    const max = Math.max(...points);
    const range = Math.max(0.000001, max - min);
    const positions = points.map((point, index) => ({
      x: padding + (node.w - padding * 2) * index / Math.max(1, points.length - 1),
      y: padding + (node.h - padding * 2) * (max === min ? 0.5 : 1 - (point - min) / range),
    }));
    const path = positions.map((point, index) => `${index ? 'L' : 'M'}${point.x} ${point.y}`).join(' ');
    const last = positions[positions.length - 1];
    const fillPath = `${path}L${last.x} ${node.h}L${positions[0].x} ${node.h}Z`;
    return <g>
      <defs><clipPath id={clipId}><rect width={node.w * value} height={node.h}/></clipPath></defs>
      {!flags.has('minimal') && [0.2, 0.6, 1].map(row => <path key={row} d={`M0 ${Math.min(node.h - 1, node.h * row)}H${node.w}`} stroke="#e6e9df" strokeWidth="0.7"/>)}
      <g clipPath={`url(#${clipId})`}>
        {!flags.has('line-only') && <path d={fillPath} fill={node.fill ?? '#e8eddc'} opacity="0.6"/>}
        <path d={path} fill="none" stroke={node.color ?? statusColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        {positions.length === 1 && <circle cx={positions[0].x} cy={positions[0].y} r="2.5" fill={node.color ?? statusColor}/>}
        {value >= 0.998 && <circle cx={last.x} cy={last.y} r="3" fill={node.color ?? statusColor} stroke="#fffefa" strokeWidth="1.5"/>}
      </g>
    </g>;
  }

  // A cursor is an authored object; it is never added to imply an interaction
  // which the episode did not supply. value animates its short click ring.
  return <g>
    {value > 0 && value < 1 && <circle r={4 + value * 17} fill="none" stroke={node.color ?? accent} strokeWidth={2 - value} opacity={(1 - value) * 0.65}/>}
    <g transform={`scale(${node.w / 22} ${node.h / 29})`} filter={`url(#${id}-cursor-shadow)`}>
      <path d="M1 1L20 18L12.1 19L16.4 27L12.2 29L8 21L2 27Z" fill={node.fill ?? '#272b25'} stroke={node.stroke ?? '#fffefa'} strokeWidth="1.4" strokeLinejoin="round"/>
    </g>
  </g>;
};

/** Composable interface material, with no baked topic, list, or editing order. */
export const UiStage: React.FC<EffectProps> = ({scene, t, width, height}) => {
  const plan: UIPlan | undefined = scene.content.ui;
  const imageSignature = useMemo(() => JSON.stringify([...new Set([
    ...(plan?.nodes.map(node => node.image) ?? []),
    ...(plan?.tracks.flatMap(track => track.frames.map(frame => frame.set.image)) ?? []),
  ].filter((image): image is string => typeof image === 'string' && image.length > 0))].sort()), [plan]);
  if (!plan) return null;
  const id = svgId(`${scene.id}:ui-stage`);
  const accent = scene.accent ?? ACCENT;
  const canvasHeight = Math.max(1, plan.canvasHeight ?? 720);
  const fit = Math.min(width / 544, height / canvasHeight);
  const camera = resolveUICamera(plan.camera ?? [], t, canvasHeight);
  const tracks = new Map<string, UIFrame[]>();
  for (const track of plan.tracks ?? []) {
    tracks.set(track.nodeId, [...(tracks.get(track.nodeId) ?? []), ...track.frames]);
  }
  const titleSize = Math.min(30, 470 / Math.max(1, [...scene.title].reduce((total, char) => total + units(char), 0)));
  const emphasis = scene.content.emphasis;
  const emphasisAt = emphasis ? scene.title.indexOf(emphasis) : -1;
  return <g>
    <PreloadImages key={imageSignature} signature={imageSignature}/>
    <Definitions id={id}/>
    <defs><clipPath id={`${id}-stage`}><rect width={width} height={height}/></clipPath></defs>
    <g clipPath={`url(#${id}-stage)`}>
      <g transform={`translate(${width / 2} ${height / 2}) scale(${fit * camera.scale}) translate(${-camera.x} ${-camera.y})`}>
        {plan.nodes.map(initial => {
          const node = resolveUINode(initial, tracks.get(initial.id) ?? [], t);
          return <g key={initial.id} opacity={clamp(node.opacity ?? 1)} transform={`translate(${node.x} ${node.y}) rotate(${node.rotation ?? 0} ${node.w / 2} ${node.h / 2})`}>
            <Surface node={node} id={id} accent={accent}/>
          </g>;
        })}
      </g>
      {plan.showTitle !== false && <text x={width / 2} y="88" textAnchor="middle" fontFamily={SANS} fontSize={titleSize} fontWeight="700" fill={INK}>
        {emphasis && emphasisAt >= 0 ? <>{scene.title.slice(0, emphasisAt)}<tspan fill={accent}>{emphasis}</tspan>{scene.title.slice(emphasisAt + emphasis.length)}</> : scene.title}
      </text>}
      <text x={width - 22} y="48" textAnchor="end" fontFamily={SANS} fontSize="9" fill={MUTED}>{plan.label ?? '示意界面'}</text>
    </g>
  </g>;
};
