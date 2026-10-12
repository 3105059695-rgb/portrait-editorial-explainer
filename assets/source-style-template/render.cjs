// Default delivery is the actual opening. Full export requires the user's recorded review.
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const {bundle}=require('@remotion/bundler');
const {openBrowser,selectComposition,renderMedia,renderStill}=require('@remotion/renderer');
const {execFileSync}=require('node:child_process');
const root=__dirname;
process.chdir(root);
const args=process.argv.slice(2);
const raw=fs.readFileSync(path.join(root,'src/episode.json'));
const episode=JSON.parse(raw.toString('utf8').replace(/^\uFEFF/,''));
const sha=crypto.createHash('sha256').update(raw).digest('hex');
async function main(){
  if(args.includes('--help')) {console.log('npm run render: opening only\nnpm run still -- 1.2 5: stills\nnpm run render:full -- --approval review.json: user-approved full export');return;}
  // Validate even after manual JSON edits. Python is also used by the portable build tool.
  execFileSync(process.env.PYTHON || 'python',['-X','utf8',path.join(root,'validate_episode.py'),'validate',path.join(root,'src/episode.json'),'--media-dir',path.join(root,'public'),...(episode.timing==='measured' ? ['--production'] : [])],{stdio:'inherit'});
  const full=args.includes('--full'), still=args.includes('--still');
  if(full && still) throw new Error('Choose either still or full.');
  if(full){
    const at=args.indexOf('--approval');
    if(at<0 || !args[at+1]) throw new Error('Full export needs --approval review.json after the user reviews this episode opening.');
    const review=JSON.parse(fs.readFileSync(args[at+1],'utf8').replace(/^\uFEFF/,''));
    if(review.status!=='approved' || review.reviewer!=='user' || review.episodeSha256!==sha || typeof review.evidence!=='string' || !review.evidence.trim()) throw new Error('Approval must record actual user evidence and match the current episode SHA256. Do not fabricate approval.');
  }
  const numeric=still ? args.filter(a=>a!=='--still').map(Number) : [];
  if(still && (!numeric.length || numeric.some(x=>!Number.isFinite(x)||x<0||x>=episode.duration))) throw new Error('Stills need valid seconds inside the episode.');
  const allowed=full ? ['--full','--approval',args[args.indexOf('--approval')+1]] : [];
  if(!still && args.some(a=>!allowed.includes(a))) throw new Error('Unknown argument. Use --help.');
  const concurrency=Number(process.env.RENDER_CONCURRENCY || 2);
  if(!Number.isInteger(concurrency)||concurrency<1) throw new Error('RENDER_CONCURRENCY must be a positive integer.');
  const serveUrl=await bundle({entryPoint:path.join(root,'src/index.ts')});
  const browser=await openBrowser('chrome',{browserExecutable:process.env.REMOTION_BROWSER_EXECUTABLE || undefined});
  try{
    const composition=await selectComposition({serveUrl,id:'SourceStyle',puppeteerInstance:browser});
    fs.mkdirSync(path.join(root,'out'),{recursive:true});
    if(still){for(const time of numeric) await renderStill({composition,serveUrl,puppeteerInstance:browser,frame:Math.min(composition.durationInFrames-1,Math.round(time*episode.fps)),output:path.join(root,`out/frame-${time.toFixed(2)}.png`)});}
    else {
      const duration=full ? episode.duration : episode.sample.duration;
      let last=-1;
      await renderMedia({composition,serveUrl,puppeteerInstance:browser,codec:'h264',crf:18,concurrency,
        outputLocation:path.join(root,full?'out/full.mp4':'out/opening.mp4'),
        frameRange:[0,Math.min(composition.durationInFrames-1,Math.ceil(duration*episode.fps)-1)],
        onProgress:({progress})=>{const step=Math.floor(progress*10);if(step!==last){last=step;console.log(`Render ${step*10}%`);}}});
      fs.writeFileSync(path.join(root,'out/render-report.json'),JSON.stringify({kind:full?'full':'opening',start:0,duration,episodeSha256:sha,styleApproval:full?'user-recorded':'pending',audio:episode.media.voice||episode.media.presenter||'none',note:'Rendering and decoding do not establish reference-style fidelity.'},null,2));
      if(!full) fs.writeFileSync(path.join(root,'out/review.pending.json'),JSON.stringify({status:'pending',reviewer:'user',episodeSha256:sha,evidence:''},null,2));
    }
  } finally {await browser.close({silent:true});}
}
main().catch(e=>{console.error(e.message);process.exitCode=1;});
