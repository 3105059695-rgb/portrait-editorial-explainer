import type {EditorialLayer, EditorialLayerKey, Scene, TransitionAnchor} from './types';
import type {Camera, Point} from './timeline';

export type ResolvedEditorialLayer = {x: number; y: number; w: number; h: number; rotation: number; scale: number; opacity: number};
export type ScreenQuad = [Point, Point, Point, Point];
const lerp = (a: number, b: number, p: number) => a + (b - a) * p;
const ease = (t: number, a: number, b: number) => {const q = Math.max(0, Math.min(1, (t - a) / Math.max(.000001, b - a))); return q * q * (3 - 2 * q);};
const poseFields = ['x', 'y', 'w', 'h', 'rotation', 'scale', 'opacity'] as const;

/** Top-left placement, center rotation/scale. Partial keys retain each property's last value. */
export const resolveEditorialLayer = (layer: EditorialLayer, localTime: number): ResolvedEditorialLayer => {
  const base: ResolvedEditorialLayer = {x: layer.x, y: layer.y, w: layer.w, h: layer.h, rotation: layer.rotation ?? 0, scale: layer.scale ?? 1, opacity: layer.opacity ?? 1};
  const rawKeys: EditorialLayerKey[] = [...(layer.keys ?? [])].sort((a, b) => a.at - b.at);
  if (!rawKeys.length) return base;
  // Positive first keys animate from the base at zero. Negative keys author incoming preroll.
  if (rawKeys[0].at > 0) rawKeys.unshift({at: 0});
  let state = {...base};
  const keys = rawKeys.map(key => {for (const field of poseFields) {const value = key[field]; if (value !== undefined) state[field] = value;} return {at: key.at, pose: {...state}};});
  if (localTime <= keys[0].at) return keys[0].pose;
  for (let i = 1; i < keys.length; i++) {
    const a = keys[i - 1], b = keys[i];
    if (localTime <= b.at) {const q = ease(localTime, a.at, b.at); return Object.fromEntries(poseFields.map(field => [field, lerp(a.pose[field], b.pose[field], q)])) as ResolvedEditorialLayer;}
  }
  return keys[keys.length - 1].pose;
};

/** Alias retained for tools describing the resolved pose as a noun. */
export const resolvedEditorialLayer = resolveEditorialLayer;

export const editorialCameraAt = (scene: Scene, globalTime: number): Camera => {
  const keys = [...(scene.editorial?.camera ?? [])].sort((a, b) => a.at - b.at);
  if (!keys.length) return {x: 270, y: 447, z: 1};
  if (keys[0].at > 0) keys.unshift({at: 0, x: 270, y: 447, z: 1});
  const t = globalTime - scene.start;
  if (t <= keys[0].at) return keys[0];
  for (let i = 1; i < keys.length; i++) {const a = keys[i - 1], b = keys[i]; if (t <= b.at) {const q = ease(t, a.at, b.at); return {x: lerp(a.x, b.x, q), y: lerp(a.y, b.y, q), z: lerp(a.z, b.z, q)};}}
  return keys[keys.length - 1];
};

export const layerTransform = (p: ResolvedEditorialLayer) => `translate(${p.x + p.w / 2} ${p.y + p.h / 2}) rotate(${p.rotation}) scale(${p.scale}) translate(${-p.w / 2} ${-p.h / 2})`;

/** The same center-based transform used to draw a layer also locates its transition surface. */
export const editorialLayerScreenRect = (scene: Scene, globalTime: number, anchor: TransitionAnchor): ScreenQuad => {
  const r = anchor.rect;
  const quad: ScreenQuad = [{x: r.x, y: r.y}, {x: r.x + r.w, y: r.y}, {x: r.x + r.w, y: r.y + r.h}, {x: r.x, y: r.y + r.h}];
  if (anchor.space === 'screen') return quad;
  const layer = scene.editorial?.layers.find(item => item.id === anchor.layerId);
  if (!layer) throw new Error(`Transition anchor layer "${anchor.layerId}" is missing in scene "${scene.id}".`);
  const pose = resolveEditorialLayer(layer, globalTime - scene.start), camera = editorialCameraAt(scene, globalTime);
  const radians = pose.rotation * Math.PI / 180, cos = Math.cos(radians), sin = Math.sin(radians);
  return quad.map(point => {
    // Rect coordinates use the layer's authored base dimensions, even when a key resizes it.
    const dx = (point.x / layer.w * pose.w - pose.w / 2) * pose.scale;
    const dy = (point.y / layer.h * pose.h - pose.h / 2) * pose.scale;
    const x = pose.x + pose.w / 2 + dx * cos - dy * sin;
    const y = pose.y + pose.h / 2 + dx * sin + dy * cos;
    return {x: 270 + (x - camera.x) * camera.z, y: 447 + (y - camera.y) * camera.z};
  }) as ScreenQuad;
};

export const expandQuad = (quad: ScreenQuad, progress: number): ScreenQuad => {
  const full: ScreenQuad = [{x: 0, y: 0}, {x: 540, y: 0}, {x: 540, y: 960}, {x: 0, y: 960}];
  return quad.map((p, i) => ({x: lerp(p.x, full[i].x, progress), y: lerp(p.y, full[i].y, progress)})) as ScreenQuad;
};

/** Rounded CSS path for a rotated surface; reaches the exact full-stage rectangle at p=1. */
export const roundedQuadPath = (quad: ScreenQuad, radius: number): string => {
  const towards = (a: Point, b: Point) => {const q = Math.min(.5, radius / Math.max(.0001, Math.hypot(b.x - a.x, b.y - a.y))); return {x: lerp(a.x, b.x, q), y: lerp(a.y, b.y, q)};};
  const starts = quad.map((p, i) => towards(p, quad[(i + 3) % 4]));
  const ends = quad.map((p, i) => towards(p, quad[(i + 1) % 4]));
  return `M ${starts[0].x} ${starts[0].y} ` + quad.map((p, i) => `Q ${p.x} ${p.y} ${ends[i].x} ${ends[i].y} L ${starts[(i + 1) % 4].x} ${starts[(i + 1) % 4].y}`).join(' ') + ' Z';
};
