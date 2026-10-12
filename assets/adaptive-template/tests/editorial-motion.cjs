// No browser, network, user media, or machine-specific path is needed.
// Run from a freshly generated project after npm ci: npm run test:motion.
const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');

const filename = path.resolve(__dirname, '../src/editorialMotion.ts');
const source = fs.readFileSync(filename, 'utf8');
const {outputText, diagnostics} = ts.transpileModule(source, {
  fileName: filename,
  reportDiagnostics: true,
  compilerOptions: {module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022},
});
assert.equal(diagnostics.length, 0, 'Motion helper must transpile without errors.');
// Runtime imports are intentionally unavailable: this helper only imports types.
const context = {exports: {}};
vm.runInNewContext(outputText, context, {filename});
const motion = context.exports;
const near = (actual, expected, message, tolerance = 1e-8) => assert.ok(Math.abs(actual - expected) <= tolerance, `${message}: expected ${expected}, got ${actual}`);
const pointNear = (actual, expected, message) => {near(actual.x, expected.x, `${message}.x`); near(actual.y, expected.y, `${message}.y`);};
const quadNear = (actual, expected, message) => {assert.equal(actual.length, 4); actual.forEach((point, i) => pointNear(point, expected[i], `${message}[${i}]`));};

const makeLayer = (override = {}) => ({id: 'traveling-prop', assetId: 'portable-image', x: 100, y: 200, w: 80, h: 60, ...override});
const makeScene = (layer = makeLayer(), override = {}) => ({id: 'incoming-world', start: 5, end: 7, editorial: {background: 'paper', layers: [layer], ...override}});
const fullAnchor = {space: 'layer', layerId: 'traveling-prop', rect: {x: 0, y: 0, w: 80, h: 60}, start: .8, duration: .2};
const fullStage = [{x: 0, y: 0}, {x: 540, y: 0}, {x: 540, y: 960}, {x: 0, y: 960}];

test('a layer keeps its authored placement and material defaults without keyframes', () => {
  const pose = motion.resolveEditorialLayer(makeLayer(), -10);
  assert.equal(pose.x, 100); assert.equal(pose.y, 200);
  assert.equal(pose.w, 80); assert.equal(pose.h, 60);
  assert.equal(pose.scale, 1); assert.equal(pose.opacity, 1); assert.equal(pose.rotation, 0);
  assert.equal(motion.resolvedEditorialLayer, motion.resolveEditorialLayer);
});

test('partial keyframes preserve already-authored values while interpolating the next property', () => {
  const layer = makeLayer({keys: [{at: 0, x: 100}, {at: .4, x: 200, rotation: 90}, {at: .8, y: 300}]});
  const midway = motion.resolveEditorialLayer(layer, .2);
  near(midway.x, 150, 'travel midpoint'); near(midway.rotation, 45, 'rotation midpoint');
  const later = motion.resolveEditorialLayer(layer, .6);
  near(later.x, 200, 'completed x is retained'); near(later.rotation, 90, 'completed rotation is retained');
  near(later.y, 250, 'next y is interpolating');
});

test('a positive first key interpolates from the base instead of jumping immediately', () => {
  const layer = makeLayer({keys: [{at: .4, x: 200}]});
  near(motion.resolveEditorialLayer(layer, 0).x, 100, 'base at zero');
  near(motion.resolveEditorialLayer(layer, .2).x, 150, 'base-to-key midpoint');
  near(motion.resolveEditorialLayer(layer, .4).x, 200, 'first key endpoint');
});

test('incoming negative-time preroll visibly advances and stays continuous across scene start', () => {
  const layer = makeLayer({keys: [{at: -.4, x: 40, opacity: 0}, {at: 0, x: 100, opacity: 1}, {at: .4, x: 200}]});
  const scene = makeScene(layer);
  const atGlobalTime = t => motion.resolveEditorialLayer(layer, t - scene.start);
  near(atGlobalTime(4.6).x, 40, 'preroll start');
  near(atGlobalTime(4.8).x, 70, 'moving preroll midpoint');
  near(atGlobalTime(4.8).opacity, .5, 'preroll opacity midpoint');
  assert.ok(atGlobalTime(4.7).x < atGlobalTime(4.9).x, 'incoming world must not freeze during the opening window');
  near(atGlobalTime(5).x, 100, 'exact boundary');
  near(atGlobalTime(5 - 1e-6).x, atGlobalTime(5 + 1e-6).x, 'no restart or discontinuity', 1e-6);
  assert.ok(atGlobalTime(5.2).x > atGlobalTime(5).x, 'motion continues after the new world fills the screen');
});

test('authored camera advances before the boundary and projects the prop surface correctly', () => {
  const scene = makeScene(makeLayer(), {camera: [{at: -.4, x: 270, y: 447, z: 1}, {at: 0, x: 270, y: 447, z: 2}]});
  near(motion.editorialCameraAt(scene, 4.8).z, 1.5, 'camera midpoint');
  assert.ok(motion.editorialCameraAt(scene, 4.7).z < motion.editorialCameraAt(scene, 4.9).z);
  quadNear(motion.editorialLayerScreenRect(scene, 5, fullAnchor), [{x: -70, y: -47}, {x: 90, y: -47}, {x: 90, y: 73}, {x: -70, y: 73}], 'camera-projected surface');
});

test('surface corners follow translation, center rotation, scale, and the world camera together', () => {
  const layer = makeLayer({keys: [{at: 0}, {at: 1, x: 200, y: 300, rotation: 90, scale: 2}]});
  const scene = makeScene(layer, {camera: [{at: 0, x: 270, y: 447, z: 1}, {at: 1, x: 240, y: 330, z: 1.5}]});
  const original = motion.editorialLayerScreenRect(scene, 5, fullAnchor);
  quadNear(original, [{x: 100, y: 200}, {x: 180, y: 200}, {x: 180, y: 260}, {x: 100, y: 260}], 'initial surface');
  // At t=6, the prop center is (240,330): camera maps it to (270,447).
  // 90-degree rotation and combined 2*1.5 scaling turn half-width40/half-height30 into90/120.
  quadNear(motion.editorialLayerScreenRect(scene, 6, fullAnchor), [{x: 360, y: 327}, {x: 360, y: 567}, {x: 180, y: 567}, {x: 180, y: 327}], 'transformed surface');
  const midpoint = motion.editorialLayerScreenRect(scene, 5.5, fullAnchor);
  assert.ok(Math.abs(midpoint[0].x - original[0].x) > 1, 'surface moves with its prop');
  near((midpoint[0].x + midpoint[2].x) / 2, 188.75, 'intermediate projected center x');
  near((midpoint[0].y + midpoint[2].y) / 2, 311.375, 'intermediate projected center y');
});

test('a surface subrectangle scales with resized layer dimensions', () => {
  const layer = makeLayer({keys: [{at: 0}, {at: 1, w: 160, h: 120}]});
  const anchor = {...fullAnchor, rect: {x: 20, y: 15, w: 40, h: 30}};
  quadNear(motion.editorialLayerScreenRect(makeScene(layer), 6, anchor), [{x: 140, y: 230}, {x: 220, y: 230}, {x: 220, y: 290}, {x: 140, y: 290}], 'resized prop face');
});

test('screen-space anchors ignore world transforms and a missing layer fails clearly', () => {
  const scene = makeScene(makeLayer({rotation: 80, scale: 3}), {camera: [{at: 0, x: 80, y: 120, z: 3}]});
  quadNear(motion.editorialLayerScreenRect(scene, 5, {...fullAnchor, space: 'screen'}), [{x: 0, y: 0}, {x: 80, y: 0}, {x: 80, y: 60}, {x: 0, y: 60}], 'screen-space surface');
  assert.throws(() => motion.editorialLayerScreenRect(scene, 5, {...fullAnchor, layerId: 'missing-prop'}), /missing-prop.*missing.*incoming-world/);
});

test('a rotated opening window interpolates to the exact full-stage endpoint', () => {
  const quad = motion.editorialLayerScreenRect(makeScene(makeLayer({rotation: -23, scale: 1.2})), 5, fullAnchor);
  quadNear(motion.expandQuad(quad, 0), quad, 'window start');
  const half = motion.expandQuad(quad, .5);
  half.forEach((point, i) => pointNear(point, {x: (quad[i].x + fullStage[i].x) / 2, y: (quad[i].y + fullStage[i].y) / 2}, `window midpoint ${i}`));
  quadNear(motion.expandQuad(quad, 1), fullStage, 'window end');
  for (const progress of [0, .2, .5, .8, 1]) {
    const clip = motion.roundedQuadPath(motion.expandQuad(quad, progress), 8 * (1 - progress));
    assert.ok(clip.startsWith('M ') && clip.endsWith(' Z'));
    assert.ok(!/NaN|Infinity|undefined/.test(clip), 'rounded mask must have finite coordinates at every stage');
  }
});
