import type {Beat, Scene} from './types';

export const W = 540, H = 960;
export const clamp = (x: number) => Math.max(0, Math.min(1, x));
export const mix = (a: number, b: number, q: number) => a + (b - a) * q;
export const smooth = (t: number, a: number, b: number) => {const q = clamp((t - a) / Math.max(.0001, b - a)); return q * q * (3 - 2 * q);};
export const out = (q: number) => 1 - Math.pow(1 - clamp(q), 3);
export const back = (q: number) => {const x = clamp(q) - 1; return 1 + 2.2 * x * x * x + 1.2 * x * x;};
export const safeId = (s: string) => Array.from(s).map(c => c.codePointAt(0)!.toString(16)).join('-');
export type Point = {x: number; y: number};
export type Pose = Point & {scale: number; rotation: number; opacity: number};
export type Camera = {x: number; y: number; z: number};
export const sortedBeats = (scene: Scene) => scene.beats.map((b, i) => ({...b, order: i})).sort((a, b) => a.at - b.at || a.order - b.order);

/** A beat is a landing, never the start of its movement. Close beats share the available preparation time. */
export const lead = (scene: Scene, beat: Beat, max = .6) => {
  const previous = sortedBeats(scene).filter(b => b.targetId === beat.targetId && b.at < beat.at).at(-1);
  return Math.max(.06, Math.min(max, beat.at - (previous?.at ?? scene.start) || .06));
};
export const beatProgress = (scene: Scene, beat: Beat, t: number, max = .6) => smooth(t, beat.at - lead(scene, beat, max), beat.at);
export const pulse = (scene: Scene, beat: Beat, t: number, hold = .18, tail = .42) => beatProgress(scene, beat, t, .35) * (1 - smooth(t, beat.at + hold, beat.at + hold + tail));

/** Layout is inferred from mechanism, object count, and semantic action roles. */
export const layout = (scene: Scene): Record<string, Pose> => {
  const ids = scene.objectIds, n = ids.length, poses: Record<string, Pose> = {};
  const put = (id: string, x: number, y: number, scale = 1, rotation = 0) => {poses[id] = {x, y, scale, rotation, opacity: 1};};
  if (!n) return poses;
  if (scene.mechanism === 'object-focus') {
    if (n === 1) put(ids[0], 270, 426, 1.85, -5);
    else if (n === 2) {put(ids[0], 175, 416, 1.32, -7); put(ids[1], 398, 507, .94, 7);}
    else {put(ids[0], 270, 390, n > 4 ? 1.12 : 1.4, -4); ids.slice(1).forEach((id, i) => {const angle = Math.PI * .17 + i / Math.max(1, n - 2) * Math.PI * .66; put(id, 270 + Math.cos(angle) * 199, 437 + Math.sin(angle) * 196, n > 4 ? .68 : .79, (i % 2 ? 1 : -1) * 6);});}
  } else if (scene.mechanism === 'route-transfer') {
    const transfers = sortedBeats(scene).filter(b => b.action === 'transfer' && b.withId);
    const moving = transfers[0]?.targetId ?? ids[0], end = transfers[0]?.withId ?? ids[n - 1];
    const movers = [...new Set(transfers.map(b => b.targetId))];
    const source = ids.find(id => id !== moving && id !== end) ?? ids[1];
    put(source, 112, 350, 1.05, -6); put(end, movers.length > 2 ? 342 : movers.length > 1 ? 365 : 421, 350, 1.05, 5);
    put(moving, 125, 550, .88, -5);
    if (movers.length > 1) movers.forEach((id, i) => put(id, 106 + (i % 2) * 102, 305 + Math.floor(i / 2) * 171, .66, i % 2 ? 5 : -6));
    ids.filter(id => ![source, end, moving, ...movers].includes(id)).forEach((id, i) => put(id, 125 + i * 149, 670, .64, i % 2 ? 3 : -3));
  } else if (scene.mechanism === 'group-sort') {
    const containers = [...new Set(scene.beats.filter(b => b.action === 'group' && b.withId).map(b => b.withId!))];
    if (!containers.length) containers.push(ids[n - 1]);
    containers.forEach((id, i) => put(id, containers.length > 2 ? 284 + (i % 2) * 156 : 361, containers.length > 2 ? 300 + Math.floor(i / 2) * 190 : containers.length === 2 ? 330 + i * 245 : 389, containers.length > 2 ? .73 : containers.length === 2 ? .94 : 1.4, 3));
    ids.filter(id => !containers.includes(id)).forEach((id, i, a) => put(id, 114 + (i % 2) * 65, 289 + i * (a.length > 3 ? 81 : 123), .72, (i % 2 ? 1 : -1) * 9));
  } else if (scene.mechanism === 'question-thread') {
    ids.forEach((id, i) => {if (n === 2) put(id, i ? 366 : 164, i ? 549 : 326, 1.18, i ? 7 : -9); else {const cols = n > 4 ? 3 : 2; put(id, cols === 3 ? 106 + (i % 3) * 164 : 151 + (i % 2) * 235, 313 + Math.floor(i / cols) * 257, cols === 3 ? .82 : 1.03, (i % 2 ? 1 : -1) * 7);}});
  } else if (scene.mechanism === 'metric-build') {
    ids.forEach((id, i) => put(id, n === 1 ? 270 : 80 + i * 380 / (n - 1), 611, n > 4 ? .46 : n > 2 ? .6 : .77, i % 2 ? 4 : -4));
  } else if (scene.mechanism === 'evidence-zoom') {
    const cols = n > 4 ? 2 : 1;
    ids.forEach((id, i) => put(id, cols === 1 ? 96 : 67 + (i % 2) * 253, n === 1 ? 427 : 311 + Math.floor(i / cols) * (n === 4 ? 98 : 133), n === 1 ? .92 : .41, 0));
  } else {
    const cols = n <= 2 ? n : n > 4 ? 3 : 2;
    const rows = Math.ceil(n / cols);
    ids.forEach((id, i) => put(id, cols === 1 ? 270 : cols === 2 ? 148 + (i % cols) * 243 : 98 + (i % cols) * 172, rows === 1 ? 440 : 334 + Math.floor(i / cols) * 243, n === 1 ? 1.6 : n === 2 ? 1.1 : n > 4 ? .74 : .94, (i % 2 ? 1 : -1) * 4));
  }
  return poses;
};

export const transferLanding = (scene: Scene, beat: Beat, destination: Pose): Point & {maxScale: number} => {
  const travelers = [...new Set(sortedBeats(scene).filter(b => b.action === 'transfer' && b.withId === beat.withId).map(b => b.targetId))];
  const slot = Math.max(0, travelers.indexOf(beat.targetId)), n = travelers.length;
  if (n < 2) return {x: destination.x - 8, y: destination.y + 171, maxScale: 1.4};
  if (n === 2) return {x: destination.x - 64 + slot * 128, y: destination.y + 181, maxScale: .68};
  return {x: destination.x - 107 + (slot % 3) * 107, y: destination.y + 176 + Math.floor(slot / 3) * 130, maxScale: .55};
};

/** Each applicable beat is folded in order. Repeated targets do not lose earlier movement. */
export const objectPoses = (scene: Scene, t: number): Record<string, Pose> => {
  const base = layout(scene), poses = Object.fromEntries(Object.entries(base).map(([id, p]) => [id, {...p}]));
  const beats = sortedBeats(scene);
  for (const id of scene.objectIds) {
    const reveal = beats.find(b => b.targetId === id && b.action === 'reveal');
    if (reveal) {
      const q = beatProgress(scene, reveal, t, .45);
      poses[id].opacity = q;
      poses[id].scale *= mix(.64, 1, back(q));
      poses[id].y += (1 - q) * 80;
      poses[id].rotation += (1 - q) * 16;
    }
  }
  const groups: Record<string, string[]> = {};
  for (const b of beats) {
    const pose = poses[b.targetId];
    if (!pose) continue;
    const q = beatProgress(scene, b, t);
    if ((b.action === 'transfer' || b.action === 'group') && b.withId && base[b.withId]) {
      // Use the actual destination's current position, allowing chained routes and nested collections.
      const destination = poses[b.withId];
      let to: Point;
      if (b.action === 'group') {
        const members = groups[b.withId] ?? (groups[b.withId] = []);
        if (!members.includes(b.targetId)) members.push(b.targetId);
        const slot = members.indexOf(b.targetId);
        to = {x: destination.x - 23 + slot * 15, y: destination.y - 65 - slot * 10};
      } else {
        const landing = transferLanding(scene, b, destination);
        to = landing;
        pose.scale = mix(pose.scale, Math.min(pose.scale, landing.maxScale), q);
      }
      pose.x = mix(pose.x, to.x, q);
      pose.y = mix(pose.y, to.y, q) - Math.sin(q * Math.PI) * (b.action === 'group' ? 62 : 122);
      pose.rotation = mix(pose.rotation, b.action === 'group' ? -5 : 0, q) + Math.sin(q * Math.PI) * 12;
      if (b.action === 'group') pose.scale = mix(pose.scale, destination.scale * .43, q);
    }
    if (b.action === 'select' || b.action === 'result') {
      const u = pulse(scene, b, t);
      pose.scale *= 1 + u * .085;
      pose.y -= u * 13;
      pose.rotation += u * -3;
    }
    if (b.action === 'count') pose.scale *= 1 + pulse(scene, b, t) * .065;
    if (b.action === 'reveal' && beats.find(v => v.targetId === b.targetId && v.action === 'reveal') !== b) pose.scale *= 1 + pulse(scene, b, t) * .08;
  }
  return poses;
};

export const cameraAt = (scene: Scene, t: number): Camera => {
  let cam: Camera = {x: 270, y: 447, z: 1};
  if (scene.mechanism === 'presenter') return cam;
  const poses = objectPoses(scene, t), duration = scene.end - scene.start;
  // A slow physical drift is bounded, not a moving background preset.
  const drift = smooth(t, scene.start, scene.end);
  cam = {x: 270, y: 447 - 9 * drift, z: 1 + .025 * drift};
  const cameraBeats = sortedBeats(scene).filter(b => ['focus', 'select', 'transfer', 'group', 'count', 'result'].includes(b.action));
  for (const [index, b] of cameraBeats.entries()) {
    if (!['focus', 'select', 'transfer', 'group', 'count', 'result'].includes(b.action)) continue;
    const p = poses[b.targetId];
    if (!p) continue;
    const window = Math.min(1.2, duration * .34);
    const enter = beatProgress(scene, b, t, .52);
    const releaseEnd = Math.min(scene.end, b.at + window, Math.max(b.at + .12, (cameraBeats[index + 1]?.at ?? scene.end + 1) - .4));
    const releaseStart = Math.min(b.at + window * .42, releaseEnd - .16);
    const release = 1 - smooth(t, releaseStart, releaseEnd);
    const strength = enter * release;
    const focus = b.action === 'focus' || b.action === 'select';
    const maxZoom = b.action === 'group' ? 1.03 : scene.mechanism === 'evidence-zoom' ? 1.16 : b.action === 'count' ? 1.075 : scene.mechanism === 'compare-pan' ? 2.18 : scene.mechanism === 'object-focus' ? (scene.objectIds.length === 1 ? 1.4 : 1.85) : focus ? 1.64 : 1.16;
    const focusX = scene.mechanism === 'evidence-zoom' || b.action === 'count' || b.action === 'group' ? 270 : p.x;
    cam.x = mix(cam.x, focusX, strength * (focus ? 1 : .55));
    cam.y = mix(cam.y, b.action === 'group' ? 447 : b.action === 'count' ? 422 : scene.mechanism === 'evidence-zoom' ? mix(447, p.y, .35) : p.y - 2, strength * (focus ? 1 : .65));
    cam.z = mix(cam.z, maxZoom, strength);
  }
  return cam;
};
export const toScreen = (p: Point, cam: Camera): Point => ({x: 270 + (p.x - cam.x) * cam.z, y: 447 + (p.y - cam.y) * cam.z});
export const cameraTransform = (cam: Camera) => `translate(270 447) scale(${cam.z}) translate(${-cam.x} ${-cam.y})`;
