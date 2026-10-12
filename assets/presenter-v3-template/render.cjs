const {bundle} = require('@remotion/bundler');
const {selectComposition, renderStill, renderMedia, openBrowser} = require('@remotion/renderer');
const path = require('path');
const fs = require('fs');

(async () => {
  const serveUrl = await bundle({entryPoint: path.resolve('src/index.ts')});
  // Optional caller-provided browser; no machine-specific path is embedded here.
  const browser = await openBrowser('chrome', {browserExecutable: process.env.REMOTION_BROWSER_EXECUTABLE});
  try {
    const composition = await selectComposition({serveUrl, id: 'PresenterEditorialV3', puppeteerInstance: browser});
    const times = process.argv.slice(2).map(Number);
    if (times.some(t => !Number.isFinite(t) || t < 0 || Math.round(t * composition.fps) >= composition.durationInFrames)) {
      throw new Error('Still timestamps must be valid seconds within the composition.');
    }
    fs.mkdirSync('out', {recursive: true});
    if (times.length) {
      for (const t of times) {
        await renderStill({composition, serveUrl, frame: Math.round(t * composition.fps), output: path.resolve('out', `frame-${t.toFixed(2)}.png`), imageFormat: 'png', puppeteerInstance: browser});
        console.log(`Rendered still at ${t}s`);
      }
    } else {
      let last = -1;
      await renderMedia({composition, serveUrl, codec: 'h264', crf: 18, outputLocation: path.resolve('out/presenter-v3-example.mp4'), puppeteerInstance: browser, concurrency: 3, imageFormat: 'jpeg', jpegQuality: 95, onProgress: ({progress}) => {
        const step = Math.floor(progress * 10);
        if (step !== last) {last = step; console.log(`Render ${step * 10}%`);}
      }});
      console.log('Created out/presenter-v3-example.mp4');
    }
  } finally {
    await browser.close({silent: true});
  }
})().catch(error => {console.error(error); process.exitCode = 1;});
