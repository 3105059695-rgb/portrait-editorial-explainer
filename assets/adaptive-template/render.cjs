const {bundle} = require('@remotion/bundler');
const {selectComposition, renderStill, renderMedia, openBrowser} = require('@remotion/renderer');
const path = require('node:path');
const fs = require('node:fs');

const projectDir = __dirname;
process.chdir(projectDir);

function checkMedia(episode) {
  const publicDir = path.join(projectDir, 'public');
  const references = [
    ...Object.entries(episode.media || {}).filter(([, value]) => value).map(([key, value]) => ({field: `media.${key}`, path: value})),
    ...(episode.assets || []).map((asset, i) => ({field: `assets[${i}].path`, path: asset.path, image: true})),
  ];
  for (const reference of references) {
    if (typeof reference.path !== 'string' || /(^[\/\\]|[\x00-\x1F:]|(^|[\/\\])\.\.([\/\\]|$)|[?#])/.test(reference.path)) {
      throw new Error(`${reference.field}: use a local path relative to public, without .., URL, query, or drive prefix.`);
    }
    const resolved = path.resolve(publicDir, reference.path);
    if (!resolved.startsWith(publicDir + path.sep) || !fs.existsSync(resolved) || !fs.statSync(resolved).isFile()) {
      throw new Error(`${reference.field}: missing file public/${reference.path}. Recompile with the correct media root.`);
    }
    if (reference.image && !/\.(svg|png|jpe?g|webp)$/i.test(reference.path)) {
      throw new Error(`${reference.field}: this renderer supports static SVG/PNG/JPEG/WebP assets. Convert other assets to a still or add an explicit renderer component.`);
    }
  }
}

(async () => {
  const args = process.argv.slice(2);
  if (args.includes('--help') || args.includes('-h')) {
    console.log('node render.cjs [seconds ...]\nWithout timestamps: out/adaptive-portrait.mp4. With timestamps: out/frame-<seconds>.png.\nOptional environment: REMOTION_BROWSER_EXECUTABLE, RENDER_CONCURRENCY (positive integer).');
    return;
  }
  if (args.some(a => a.trim() === '' || !Number.isFinite(Number(a)))) throw new Error('Every still argument must be numeric seconds. Example: node render.cjs 0 1.25 6');
  const episode = JSON.parse(fs.readFileSync(path.join(projectDir, 'src/episode.json'), 'utf8').replace(/^\uFEFF/, ''));
  checkMedia(episode);
  const times = args.map(Number);
  if (times.some(t => t < 0 || t >= episode.duration)) throw new Error(`Still timestamps must be within [0, ${episode.duration}) seconds.`);
  const concurrency = process.env.RENDER_CONCURRENCY === undefined ? 3 : Number(process.env.RENDER_CONCURRENCY);
  if (!Number.isInteger(concurrency) || concurrency < 1) throw new Error('RENDER_CONCURRENCY must be a positive integer.');
  const executable = process.env.REMOTION_BROWSER_EXECUTABLE || undefined;
  if (executable && !fs.existsSync(executable)) throw new Error('REMOTION_BROWSER_EXECUTABLE does not exist.');
  const serveUrl = await bundle({entryPoint: path.join(projectDir, 'src/index.ts')});
  let browser;
  try {
    browser = await openBrowser('chrome', {browserExecutable: executable});
    const composition = await selectComposition({serveUrl, id: 'AdaptivePortrait', puppeteerInstance: browser});
    fs.mkdirSync(path.join(projectDir, 'out'), {recursive: true});
    if (times.length) {
      for (const t of times) {
        const frame = Math.min(composition.durationInFrames - 1, Math.round(t * composition.fps));
        const file = path.join(projectDir, 'out', `frame-${t.toFixed(2)}.png`);
        await renderStill({composition, serveUrl, frame, output: file, imageFormat: 'png', puppeteerInstance: browser});
        console.log(`Rendered ${file} (frame ${frame}, ${composition.fps} fps)`);
      }
    } else {
      let last = -1;
      const output = path.join(projectDir, 'out/adaptive-portrait.mp4');
      await renderMedia({composition, serveUrl, codec: 'h264', crf: 18, outputLocation: output, puppeteerInstance: browser, concurrency, imageFormat: 'jpeg', jpegQuality: 95, onProgress: ({progress}) => {
        const step = Math.floor(progress * 10);
        if (step !== last) {last = step; console.log(`Render ${step * 10}%`);}
      }});
      console.log(`Created ${output}`);
    }
  } finally {
    if (browser) await browser.close({silent: true});
  }
})().catch(error => {console.error(`Render failed: ${error.stack || error.message || error}`); process.exitCode = 1;});
