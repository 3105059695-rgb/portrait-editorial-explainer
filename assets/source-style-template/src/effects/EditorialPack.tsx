import React from 'react';
import type {EffectProps, Item, Scene} from '../types';
import {clamp, mix, out, pop, progress, smooth, uid} from '../motion';
import {INK, SERIF, PALETTE, Text, Media, items, point} from '../pack-shared';

/**
 * Editorial portion of the full reference vocabulary. The old reference scene
 * clock and subject matter are deliberately absent: every event is driven by
 * the episode's local reveal / act / resolve marks and supplied content.
 * SVG geometry stays in 544 logical units; extra portrait height is reflowed.
 */
const MONO = 'ui-monospace, Consolas, monospace';
const PAPER = '#f5f4ec';
const ORANGE = '#b76a49';
const accent = (s: Scene) => s.accent ?? ORANGE;
const fit = (s: string, w: number, preferred = 30) => Math.min(preferred, Math.max(1,w) / Math.max(1, [...s].reduce((n,c)=>n+(/[^\x00-\xff]/.test(c)?1:.56),0)));
const phase = (s: Scene, t: number) => {
  const reveal = point(s,'reveal',.2), act = point(s,'act',.58), resolve = point(s,'resolve',.91);
  return {reveal, act, resolve, intro:out(t,0,reveal), action:smooth(t,reveal,act), finish:smooth(t,act,resolve)};
};
const lines = (text: string, limit = 15) => {
  const result:string[]=[];
  let row='', count=0;
  for(const c of text){const n=/[^\x00-\xff]/.test(c)?1:.56;if(c==='\n'||count+n>limit){result.push(row);row='';count=0;}if(c!=='\n'){row+=c;count+=n;}}
  if(row)result.push(row);return result;
};
const Frame:React.FC<EffectProps & {children:React.ReactNode;dark?:boolean}> = ({scene,t,width,height,children,dark}) => {
  const id=uid(scene.id,'editorial');
  const camera=scene.camera??[];
  let pose={x:width/2,y:height/2,scale:1,rotate:0};
  if(camera.length){let a=camera[0],b=a;for(const key of camera){if(key.at<=t)a=key;if(key.at>=t){b=key;break;}b=key;}const q=a===b?0:smooth(t,a.at,b.at);pose={x:mix(a.x,b.x,q),y:mix(a.y,b.y,q),scale:mix(a.scale,b.scale,q),rotate:mix(a.rotate??0,b.rotate??0,q)};}
  return <g>
    <defs>
      <filter id={`${id}-shadow`} x="-40%" y="-40%" width="180%" height="190%"><feDropShadow dx="1" dy="11" stdDeviation="9" floodColor="#39372d" floodOpacity=".19"/></filter>
      <filter id={`${id}-small`} x="-35%" y="-35%" width="170%" height="180%"><feDropShadow dx="1" dy="5" stdDeviation="3" floodColor="#39372d" floodOpacity=".17"/></filter>
      <radialGradient id={`${id}-light`}><stop stopColor={dark?'#333530':'#fffef9'}/><stop offset="1" stopColor={dark?'#080a08':PAPER}/></radialGradient>
      <pattern id={`${id}-grain`} width="13" height="17" patternUnits="userSpaceOnUse"><circle cx="3" cy="6" r=".45" fill={dark?'#fff':'#1b2118'} opacity=".035"/><circle cx="11" cy="15" r=".35" fill={dark?'#fff':'#1b2118'} opacity=".025"/></pattern>
    </defs>
    <rect width={width} height={height} fill={scene.background??`url(#${id}-light)`}/>
    <g transform={`translate(${width/2} ${height/2}) scale(${pose.scale}) rotate(${pose.rotate}) translate(${-pose.x} ${-pose.y})`}>{children}</g>
    <rect width={width} height={height} fill={`url(#${id}-grain)`} pointerEvents="none"/>
  </g>;
};
const shadow=(s:Scene,small=false)=>`url(#${uid(s.id,'editorial')}-${small?'small':'shadow'})`;
const Head:React.FC<{scene:Scene;y:number;opacity?:number;dark?:boolean}> = ({scene,y,opacity=1,dark}) => {
  if(scene.content.pack?.showTitle===false)return null;
  const title=lines(scene.title,13),size=Math.min(38,...title.map(l=>fit(l,486,38)));
  return <g opacity={opacity}>
    {scene.content.kicker&&<Text x={272} y={y-39} size={12} anchor="middle" color={dark?'#bdbdb2':'#77796c'} family={MONO}>{scene.content.kicker}</Text>}
    {title.map((l,i)=><Text key={i} x={272} y={y+i*(size+8)} anchor="middle" size={size} weight={700} family={SERIF} color={dark?'#fffbed':INK}>{l}</Text>)}
  </g>;
};
const Cursor:React.FC<{x:number;y:number;pressed?:number;scale?:number;color?:string}>=({x,y,pressed=0,scale=1,color='#fff'})=><g transform={`translate(${x} ${y}) scale(${scale*(1-pressed*.14)})`}>
  <circle r={20+24*pressed} fill="none" stroke={ORANGE} strokeWidth="2" opacity={pressed}/>
  <path d="M0 0V29L8 23L14 36L20 32L13 20L25 18Z" fill={color} stroke={INK} strokeWidth="1.6" strokeLinejoin="round"/>
</g>;
const Magnifier:React.FC<{x:number;y:number;scale?:number}>=({x,y,scale=1})=><g transform={`translate(${x} ${y}) rotate(-18) scale(${scale})`}>
  <path d="M28 30L68 71" stroke={INK} strokeWidth="15" strokeLinecap="round"/><path d="M28 30L68 71" stroke="#ccb99a" strokeWidth="9" strokeLinecap="round"/>
  <circle r="43" fill="#fff" fillOpacity=".12" stroke={INK} strokeWidth="5"/><circle r="36" fill="#c9e5e7" fillOpacity=".19" stroke="#acae97" strokeWidth="2"/>
  <path d="M-28-13Q-20-31 0-31" fill="none" stroke="#fff" strokeWidth="4" opacity=".9" strokeLinecap="round"/>
</g>;
const Pic:React.FC<{scene:Scene;item:Item;x:number;y:number;w:number;h:number;label?:boolean;selected?:boolean}>=({scene,item,x,y,w,h,label=false,selected=false})=><g transform={`translate(${x} ${y})`}>
  <rect x="-4" y="-4" width={w+8} height={h+(label?29:0)+8} rx="4" fill="#fffefa" stroke={selected?accent(scene):'#deded4'} strokeWidth={selected?3:1}/>
  <Media scene={scene} item={item} x={0} y={0} w={w} h={h}/>
  {label&&<Text x={w*.5} y={h+19} anchor="middle" size={fit(item.label,w-8,13)} family={SERIF}>{item.label}</Text>}
</g>;

/** A social-feed montage cuts actual user media and repeatedly punches toward
 * the next evidence tile. Details and title move as one camera world. */
const FeedMontage:React.FC<EffectProps>=p=>{
  const {scene,t,width,height}=p,{intro,act,resolve}=phase(scene,t),source=items(scene),count=Math.min(10,Math.max(4,source.length));
  const scan=progress(t,.05,act)*count,index=Math.min(count-1,Math.floor(scan));
  const age=(scan-index),hit=Math.exp(-age*16),final=smooth(t,act,resolve);
  const item=source[index%source.length],next=source[(index+1)%source.length];
  const z=1.025+age*.025+hit*.025-final*.12, center=height*.43;
  return <Frame {...p} dark>
    <g opacity={intro} transform={`translate(${mix(0,22,final)+hit*17} ${mix(0,32,final)}) translate(272 ${center}) scale(${z}) translate(-272 ${-center})`}>
      <g opacity=".8"><Text x={24} y={44} size={14} color="#bfc2b5" weight={700}>{scene.content.kicker??scene.title}</Text><path d="M25 59H519" stroke="#484a41"/><circle cx="504" cy="34" r="8" fill="none" stroke="#aeb0a3"/><path d="M509 41l9 9" stroke="#aeb0a3"/></g>
      <Media scene={scene} item={item} x={18} y={82} w={508} h={height*.36}/>
      <rect x={22} y={height*.36+99} width={Math.min(460,item.label.length*25+18)} height="45" fill={accent(scene)}/>
      <Text x={30} y={height*.36+132} size={fit(item.label,452,29)} color="#0f130d" weight={800}>{item.label}</Text>
      <Text x={26} y={height*.36+178} size={17} color="#a6a89d">{scene.content.body??scene.title}</Text>
      <g opacity=".55"><circle cx="42" cy={height*.36+219} r="15" fill={item.color??PALETTE[index%PALETTE.length]}/><Text x={69} y={height*.36+225} size={12} color="#c8c9bf">{scene.content.url??`${String(index+1).padStart(2,'0')} / ${count}`}</Text><path d={`M28 ${height*.36+251}H519`} stroke="#5a5d50"/></g>
      <g opacity=".65"><Media scene={scene} item={next} x={28} y={height*.36+274} w={487} h={height*.24}/></g>
    </g>
    <rect width={width} height={height} fill="#000" opacity={final*.24}/>
    <g opacity={final} transform={`translate(272 ${height*.48}) scale(${mix(.72,1,out(t,act,resolve))})`}><rect x="-238" y="-51" width="476" height="108" fill="#f7f2df" transform="rotate(-3)"/><Text x={0} y={15} anchor="middle" family={SERIF} weight={700} size={fit(scene.content.result??scene.title,448,43)}>{scene.content.result??scene.title}</Text></g>
  </Frame>;
};

/** Floating editorial paper, photographic/illustrated supplied media, rack
 * focus and thin converging routes. Source assets are never bundled. */
const MagazineCollage:React.FC<EffectProps>=p=>{
  const {scene,t,height}=p,{reveal,act,resolve,intro}=phase(scene,t),list=items(scene).slice(0,5),n=list.length;
  const cw=Math.min(168,458/Math.min(n,3)-12),ch=cw*1.5,cy=height*.46;
  const selected=Math.max(0,list.findIndex(v=>v.id===scene.content.selectedId));
  const focus=smooth(t,reveal,act*.76)*(1-smooth(t,act,resolve));
  const routes=smooth(t,act*.72,resolve),cardX=(i:number)=>n===1?272:(66+cw/2)+i*(412-cw)/Math.max(1,n-1);
  const zoom=1+focus*1.5,focusX=cardX(selected),focusY=cy+(selected%2? -25:18);
  return <Frame {...p}>
    <g transform={`translate(${272-mix(272,focusX,focus)*zoom} ${height*.5-mix(height*.5,focusY,focus)*zoom}) scale(${zoom})`}>
      <Head scene={scene} y={height*.17} opacity={intro*(1-focus*.82)}/>
      <path d={`M35 ${cy+130}L272 ${cy-172}L510 ${cy+125}`} stroke="#929286" fill="none" opacity={(1-routes)*.35}/>
      {list.map((item,i)=>{const enter=out(t,i*.075,Math.max(.2,reveal+i*.075)),x=cardX(i),y=cy+(i%2?-25:18),rot=(i-(n-1)/2)*3;
        return <g key={item.id} opacity={enter*(i===selected?1:1-focus*.65)} transform={`translate(${x} ${y+(1-enter)*85}) rotate(${rot})`} filter={shadow(scene)}>
          <rect x={-cw/2} y={-ch/2} width={cw} height={ch} fill="#fffef9"/>
          <Text x={-cw*.4} y={-ch*.40} size={7} color="#85877d" family={MONO}>{String(i+1).padStart(2,'0')} / {scene.content.kicker??'COLLECTION'}</Text>
          <Media scene={scene} item={item} x={-cw*.42} y={-ch*.31} w={cw*.84} h={ch*.62}/>
          <Text x={-cw*.4} y={ch*.42} size={fit(item.label,cw*.8,18)} family={SERIF} weight={700}>{item.label}</Text>
        </g>;
      })}
      {list.map((_,i)=>{const x=cardX(i),y=cy+(i%2?-25:18)+ch*.5,d=`M${x} ${y}C${x} ${y+58} ${272+(i-(n-1)/2)*13} ${height*.78-55} ${272+(i-(n-1)/2)*13} ${height*.78}`;return <path key={i} d={d} stroke="#88897b" fill="none" pathLength="1" strokeDasharray="1" strokeDashoffset={1-routes} strokeWidth="1.1"/>;})}
      <g opacity={routes} transform={`translate(272 ${height*.80}) scale(${mix(.8,1,routes)})`}><rect x="-54" y="-20" width="108" height="55" rx="5" fill="#fcfbf4" stroke="#b7b9a7"/><path d="M-39-7h46M-39 4h62M-39 15h32" stroke="#a4ad97" strokeWidth="3"/><Text x={0} y={65} anchor="middle" size={17} family={SERIF}>{scene.content.result??scene.content.body??''}</Text></g>
    </g>
  </Frame>;
};

// Analytic lens vector field authored here, not sampled from a video. Each
// channel carries one displacement axis; blur makes the sampled field smooth.
const LENS = 'data:image/svg+xml;charset=utf-8,'+encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="540" height="720" viewBox="0 0 540 720">${Array.from({length:972},(_,i)=>{const x=i%27,y=Math.floor(i/27),dx=(x-13)/13,dy=(y-17.5)/17.5,r=dx*dx*.58+dy*dy*.85;return `<rect x="${x*20}" y="${y*20}" width="21" height="21" fill="rgb(${Math.round(128+dx*r*51)},${Math.round(128+dy*r*51)},128)"/>`;}).join('')}</svg>`);

const CodeEditor:React.FC<EffectProps>=p=>{
  const {scene,t,height}=p,{reveal,act,resolve,intro,action,finish}=phase(scene,t),id=uid(scene.id,'lens');
  const body=scene.content.code??scene.content.body??'',code=body.split('\n'),selected=Math.max(1,Math.min(code.length-1,Math.floor(code.length*.32)));
  const fold=smooth(t,reveal,act),term=smooth(t,act,resolve),zoom=1+smooth(t,0,reveal)*.36-fold*.3;
  const total=Math.floor(body.length*progress(t,reveal*.35,act)),sidebar=mix(35,147,fold),top=height*.15;
  return <Frame {...p} dark>
    <defs>
      <filter id={id} x="-12%" y="-12%" width="124%" height="124%" colorInterpolationFilters="sRGB"><feImage href={LENS} x="-22" y="-30" width="588" height={height+60} preserveAspectRatio="none" result="field"/><feGaussianBlur in="field" stdDeviation="5" result="smoothed"/><feDisplacementMap in="SourceGraphic" in2="smoothed" scale="95" xChannelSelector="R" yChannelSelector="G"/></filter>
      <radialGradient id={`${id}-shade`}><stop offset=".2" stopColor="#000" stopOpacity="0"/><stop offset="1" stopColor="#000" stopOpacity=".48"/></radialGradient>
      <pattern id={`${id}-scan`} width="3" height="3" patternUnits="userSpaceOnUse"><rect width="3" height=".55" fill="#000" opacity=".14"/></pattern>
    </defs>
    <g filter={`url(#${id})`} opacity={intro}>
      <g transform={`translate(${272-272*zoom-fold*12} ${height*.43-height*.43*zoom}) scale(${zoom})`}>
        <rect x="-90" y={top-50} width="820" height={height*.85} fill="#1d2020"/>
        <rect x="-90" y={top-50} width="820" height="39" fill="#2f3434"/>
        {['#bd705e','#c9b361','#86a886'].map((c,i)=><circle key={c} cx={16+i*14} cy={top-30} r="4" fill={c}/>)}
        <Text x={82} y={top-26} size={12} color="#c8cecb" family={MONO}>{scene.content.kicker??scene.title}</Text>
        <rect x="0" y={top-11} width={sidebar} height={height*.78} fill="#252c2c"/>
        {['□','⌕','⑂','▷','▦'].map((a,i)=><Text key={i} x={9} y={top+25+i*48} size={23} color="#929e9a">{a}</Text>)}
        <g opacity={fold}>{items(scene).slice(0,8).map((item,i)=><g key={item.id}><rect x="41" y={top+8+i*30} width={Math.max(0,sidebar-45)} height="25" fill={i===1?'#3a4745':'transparent'}/><Text x={48} y={top+25+i*30} size={fit(item.label,Math.max(1,sidebar-58),12)} color={i===1?'#d7e3d9':'#a8b5ae'} family={MONO}>{item.label}</Text></g>)}</g>
        <g transform={`translate(${sidebar+12} ${top+28})`}>
          <Text x={7} y={-14} size={12} color="#a3b5ad" family={MONO}>{scene.content.url??items(scene)[0].label}</Text>
          <rect x="21" y={26+selected*25} width={mix(0,327,smooth(t,reveal*.35,reveal))} height="25" fill="#385c70" opacity={1-fold}/>
          {code.slice(0,Math.floor(height*.54/25)).map((line,i)=>{const before=code.slice(0,i).join('\n').length,shown=line.slice(0,Math.max(0,total-before));return <g key={i}><Text x={0} y={48+i*25} size={12} color="#64736c" family={MONO}>{i+1}</Text><Text x={29} y={48+i*25} size={13} color={i%4===0?'#c5b982':i%3===0?'#a2c4ce':'#c8d3cc'} family={MONO}>{shown}</Text></g>;})}
        </g>
      </g>
      <g transform={`translate(29 ${mix(height+120,height*.63,term)})`} filter={shadow(scene)}>
        <rect width="486" height={height*.25} rx="7" fill="#151918" stroke="#647269"/><rect width="486" height="33" rx="7" fill="#303934"/><Text x={17} y={22} size={12} color="#bdc9bd" family={MONO}>TERMINAL</Text>
        <Text x={19} y={65} size={14} color="#bdc9bd" family={MONO}>{`> ${(scene.content.prompt??'').slice(0,Math.floor((scene.content.prompt??'').length*term))}`}</Text>
        <Text x={19} y={104} size={fit(scene.content.result??'',447,19)} color="#b1c78f" family={MONO}>{finish>.5?scene.content.result??'':''}</Text>
        <path d={`M19 126h${436*finish}`} stroke={accent(scene)} strokeWidth="3"/>
      </g>
    </g>
    <rect width="544" height={height} fill={`url(#${id}-scan)`}/><rect width="544" height={height} fill={`url(#${id}-shade)`}/>
    <Cursor x={mix(454,233,action)} y={mix(height*.32,height*.5,action)} pressed={Math.sin(progress(t,reveal*.75,reveal)*Math.PI)*(1-action)} scale={.7}/>
  </Frame>;
};

const IdeaBurst:React.FC<EffectProps>=p=>{
  const {scene,t,height}=p,{reveal,act,resolve,intro,finish}=phase(scene,t),assembly=smooth(t,0,reveal),collapse=smooth(t,act,resolve),cy=height*.43;
  const material=items(scene)[0],hasMaterial=Boolean(material.image||material.video);
  return <Frame {...p}>
    <g opacity={1-collapse}>
      <Head scene={scene} y={height*.20} opacity={intro}/>
      <g transform={`translate(272 ${cy}) scale(${.88+.12*pop(t,0,reveal)})`}>
        {Array.from({length:9},(_,i)=>{const a=i*Math.PI*2/9,rad=mix(147,68,assembly),q=out(t,i*.025,reveal);return <g key={i} transform={`translate(${Math.cos(a)*rad} ${Math.sin(a)*rad}) rotate(${i*40+120*(1-assembly)})`} opacity={q*(1-assembly*.7)}><path d="M-10-9Q6-25 20 0" stroke={PALETTE[i%PALETTE.length]} strokeWidth="5" fill="none"/></g>;})}
        <circle r={90+assembly*15} fill="#edda94" opacity={assembly*.17}/>
        {hasMaterial?<g opacity={assembly}><Media scene={scene} item={material} x={-92} y={-92} w={184} h={184}/></g>:<g opacity={assembly} fill="none" stroke={INK} strokeLinecap="round" strokeWidth="3.8">
          <path d="M-30 27C-75-14-49-81 0-81S75-14 30 27L24 42H-24Z"/><path d="M-24 52H24M-20 63H20M-12 74H12" strokeWidth="5"/>
          <path d="M-8 39L-14-11Q-32-37-14-36Q0-40 0-21Q0-40 14-36Q32-37 14-11L8 39" stroke={accent(scene)} strokeWidth="3"/>
          {Array.from({length:8},(_,i)=><path key={i} d="M0-110v-17" stroke={i%2?accent(scene):'#b9b69b'} strokeWidth="3" transform={`rotate(${i*45})`} opacity={smooth(t,reveal,act)}/>) }
        </g>}
      </g>
      <Text x={272} y={cy+183} anchor="middle" size={fit(scene.content.emphasis??material.label,465,72)} family={SERIF}>{scene.content.emphasis??material.label}</Text>
    </g>
    <g opacity={finish} transform={`translate(272 ${height*.51}) scale(${mix(1.18,1,finish)})`} style={{filter:`blur(${(1-finish)*7}px)`}}><Text x={0} y={0} anchor="middle" size={fit(scene.content.result??'',485,72)} family={SERIF}>{scene.content.result??''}</Text></g>
  </Frame>;
};

const DocumentWrite:React.FC<EffectProps>=p=>{
  const {scene,t,height}=p,{reveal,act,resolve,intro,finish}=phase(scene,t),body=scene.content.body??'',rows=lines(body,13),shown=Math.floor(body.length*progress(t,reveal*.3,act));
  const h=Math.min(height*.64,Math.max(345,rows.length*33+114)),x=111,y=height*.28,emphasis=scene.content.emphasis??'';
  const visibleRows=Math.max(1,Math.floor((h-112)/33)),typedRows=lines(body.slice(0,shown),13).length;
  const scroll=Math.max(0,typedRows-visibleRows)*33,clip=uid(scene.id,'document-body');
  return <Frame {...p}>
    <defs><clipPath id={clip}><rect x={x+20} y={y+57} width="284" height={h-101}/></clipPath></defs>
    <Head scene={scene} y={height*.15} opacity={intro}/>
    <g transform={`translate(272 ${y+h*.5}) rotate(${-3+intro*1.3}) scale(${mix(.83,1,pop(t,0,reveal))}) translate(-272 ${-y-h*.5})`} opacity={intro} filter={shadow(scene)}>
      <rect x={x} y={y} width="322" height={h} rx="17" fill="#fffefa"/>
      {['#b8795c','#c6b574','#a7b59a'].map((c,i)=><circle key={c} cx={x+23+i*14} cy={y+25} r="4.6" fill={c}/>)}
      <Text x={x+73} y={y+29} size={12} color="#7b8172" family={MONO}>{scene.content.url??items(scene)[0].label}</Text>
      <path d={`M${x+20} ${y+44}h282`} stroke="#d3d5c5"/>
      <g clipPath={`url(#${clip})`}><g transform={`translate(0 ${-scroll})`}>{rows.map((row,i)=>{const before=rows.slice(0,i).join('').length,part=row.slice(0,Math.max(0,shown-before)),at=row.indexOf(emphasis),hi=emphasis&&at>=0;return <g key={i}>
        {hi&&<rect x={x+23+at*21} y={y+61+i*33} width={Math.min(271-at*21,emphasis.length*21)*smooth(t,reveal*.8,act*.75)} height="24" fill={accent(scene)} opacity=".25"/>}
        <Text x={x+23} y={y+81+i*33} size={21} weight={600}>{part}{shown>=before&&shown<before+row.length?'▏':''}</Text>
      </g>;})}</g></g>
      <path d={`M${x+22} ${y+h-29}h${278*finish}`} stroke={accent(scene)} strokeWidth="2"/>
      <Text x={x+300} y={y+h-10} anchor="end" size={10} color="#8c917f">{scene.content.result??''}</Text>
    </g>
    <g opacity={finish} transform={`translate(${433-25*finish} ${y+h-12}) rotate(-13) scale(${mix(1.4,1,out(t,act,resolve))})`}><circle r="27" fill="#fffdf5" stroke={accent(scene)} strokeWidth="2"/><path d="M-12 0l8 8 18-20" fill="none" stroke={accent(scene)} strokeWidth="4" strokeLinecap="round"/></g>
  </Frame>;
};

const ReferenceSearch:React.FC<EffectProps>=p=>{
  const {scene,t,height}=p,{reveal,act,resolve,intro}=phase(scene,t),raw=items(scene),n=Math.min(12,Math.max(6,raw.length)),cols=3,size=114,step=146,top=height*.29;
  const list=Array.from({length:n},(_,i)=>raw[i%raw.length]),selected=Math.max(0,list.findIndex(i=>i.id===scene.content.selectedId));
  const focus=smooth(t,reveal,act),lift=smooth(t,act,resolve),sx=69+(selected%cols)*step,sy=top+Math.floor(selected/cols)*133;
  const ex=mix(sx+size/2,272,lift),ey=mix(sy+size/2,height*.43,lift),z=mix(1,2.25,lift);
  return <Frame {...p}>
    <Head scene={scene} y={height*.15} opacity={intro}/>
    <g opacity={1-lift}>{list.map((item,i)=>{if(i===selected)return null;return <g key={i} opacity={out(t,i*.03,reveal+i*.03)*(1-focus*.6)} transform={`translate(0 ${(1-out(t,i*.03,reveal+i*.03))*32})`}><Pic scene={scene} item={item} x={69+(i%cols)*step} y={top+Math.floor(i/cols)*133} w={size} h={104}/></g>;})}</g>
    <g transform={`translate(${ex} ${ey}) scale(${z}) translate(${-size/2} ${-size/2})`} filter={shadow(scene,true)}>
      <Pic scene={scene} item={list[selected]} x={0} y={0} w={size} h={104} selected={focus>.5}/>
      <g opacity={focus}><rect x="28" y="-18" width="62" height="17" rx="8" fill={accent(scene)}/><Text x={59} y={-6} anchor="middle" size={7} color="#fff">{scene.content.result??'★'}</Text></g>
    </g>
    <g opacity={intro*(1-lift)}><Magnifier x={mix(470,sx+size*.61,focus)} y={mix(top-20,sy+size*.67,focus)} scale={1.01}/></g>
    <g opacity={lift}><Text x={272} y={height*.70} anchor="middle" family={SERIF} size={26}>{list[selected].label}</Text><path d={`M180 ${height*.73}h${184*lift}`} stroke={accent(scene)} strokeWidth="2"/></g>
  </Frame>;
};

const CodeBuild:React.FC<EffectProps>=p=>{
  const {scene,t,height}=p,{reveal,act,resolve,intro,finish}=phase(scene,t),build=progress(t,reveal,resolve),raw=scene.content.code??'',rows=raw.split('\n'),written=Math.floor(raw.length*progress(t,reveal,act));
  const top=height*.51,boxH=height*.38,artY=height*.25;
  return <Frame {...p}>
    <Head scene={scene} y={height*.13} opacity={intro}/>
    <g opacity={intro} transform={`translate(272 ${artY+58}) scale(${mix(.75,1,pop(t,0,reveal))}) translate(-272 ${-artY-58})`}><Pic scene={scene} item={items(scene)[0]} x={209} y={artY} w={126} h={113} selected/></g>
    <g opacity={smooth(t,reveal*.5,reveal)}><path d={`M272 ${artY+125}V${top-12}`} stroke={accent(scene)} strokeWidth="2" strokeDasharray="3 5"/><path d={`M265 ${top-22}l7 11 7-11`} fill="none" stroke={accent(scene)} strokeWidth="2"/>
      <circle cx={272} cy={mix(artY+125,top-12,(build*3)%1)} r="4" fill={accent(scene)} opacity={1-finish}/>
    </g>
    <g transform={`translate(57 ${top+(1-intro)*46})`} opacity={intro} filter={shadow(scene)}>
      <rect width="430" height={boxH} rx="13" fill="#211f1b"/>
      {['#b96e60','#c8b369','#97b084'].map((c,i)=><circle key={i} cx={19+i*14} cy="18" r="4" fill={c}/>)}
      <Text x={78} y={23} size={11} color="#b6b1a0" family={MONO}>{scene.content.url??items(scene)[0].label}</Text><path d="M15 33H415" stroke="#474238"/>
      {rows.slice(0,Math.floor((boxH-93)/20)).map((row,i)=>{const before=rows.slice(0,i).join('\n').length;return <g key={i}><Text x={20} y={60+i*20} size={12} color="#726859" family={MONO}>{i+1}</Text><Text x={40} y={60+i*20} size={12} color={i%3===0?'#d4c080':'#acc7c8'} family={MONO}>{row.slice(0,Math.max(0,written-before))}</Text></g>;})}
      <rect x="18" y={boxH-27} width="308" height="5" rx="2" fill="#443a2c"/><rect x="18" y={boxH-27} width={308*build} height="5" rx="2" fill={accent(scene)}/><Text x={410} y={boxH-21} anchor="end" size={14} color="#eee7d5" weight={700}>{Math.round(build*100)}%</Text>
    </g>
  </Frame>;
};

const PromptSubstitute:React.FC<EffectProps>=p=>{
  const {scene,t,height}=p,{reveal,act,resolve,intro}=phase(scene,t),raw=items(scene),n=Math.min(9,Math.max(4,raw.length)),cols=n>4?3:2,cell=n>4?84:125,gridW=cols*cell+20*(cols-1),rows=Math.ceil(n/cols),gridH=rows*cell+20*(rows-1),gx=(544-gridW)/2,gy=height*.30;
  const prompt=scene.content.prompt??'',typing=progress(t,0,reveal),execute=smooth(t,reveal,act),end=resolve-act;
  return <Frame {...p}>
    <Head scene={scene} y={height*.15} opacity={intro}/>
    <g opacity={intro} transform={`translate(272 ${gy+gridH/2}) scale(${mix(.9,1,intro)}) translate(-272 ${-gy-gridH/2})`}>
      <rect x={gx-20} y={gy-20} width={gridW+40} height={gridH+40} fill="#fffef9" rx="18" filter={shadow(scene)}/>
      <rect x={gx-10} y={gy-10} width={gridW+20} height={gridH+20} rx="10" fill="#e8e7df"/>
      {Array.from({length:n},(_,i)=>{const item=raw[i%raw.length],x=gx+(i%cols)*(cell+20),y=gy+Math.floor(i/cols)*(cell+20),flip=progress(t,act+i*end/(n+2),act+(i+2)*end/(n+2)),back=flip>=.5,other:Item={...item,id:`${item.id}-replacement`,image:item.replacementImage,video:undefined,label:item.replacementLabel??item.label,color:item.color??PALETTE[(i+3)%PALETTE.length],shape:['diamond','circle','chip','square'][i%4] as Item['shape']};return <g key={i} transform={`translate(${x+cell/2} ${y+cell/2}) scale(${Math.max(.035,Math.abs(Math.cos(flip*Math.PI)))} 1) translate(${-cell/2} ${-cell/2})`}><rect width={cell} height={cell} rx="5" fill={back?'#dccab3':'#baad94'}/><Media scene={scene} item={back?other:item} x={7} y={7} w={cell-14} h={cell-14}/></g>;})}
    </g>
    <g transform={`translate(55 ${Math.max(gy+gridH+58,height*.79)})`} opacity={intro} filter={shadow(scene,true)}>
      <rect width="434" height="61" rx="30" fill="#fffef9"/><Text x={23} y={38} size={fit(prompt,343,20)} weight={600}>{prompt.slice(0,Math.floor(prompt.length*typing))}{typing<1?'▏':''}</Text>
      <g transform={`translate(402 30) scale(${1-Math.sin(execute*Math.PI)*.16})`}><circle r="22" fill={accent(scene)}/><path d="M0 11V-10M-8-2L0-10 8-2" fill="none" stroke="#fff" strokeWidth="2.6" strokeLinecap="round"/></g>
    </g>
  </Frame>;
};

const KineticType:React.FC<EffectProps>=p=>{
  const {scene,t,height}=p,{reveal,act,resolve,finish}=phase(scene,t),list=items(scene).slice(0,4),contract=smooth(t,reveal,act),expansion=out(t,act,resolve),word=scene.content.emphasis??scene.title;
  const size=fit(word,497,107),baseline=height*.52;
  return <Frame {...p}>
    <g opacity={1-finish} transform={`translate(272 ${height*.47}) scale(${Math.max(.03,1-contract*.97)}) translate(-272 ${-height*.47})`}>
      <Text x={272} y={height*.29} anchor="middle" size={21} family={SERIF} color="#6f7467">{scene.content.body??''}</Text>
      {list.map((item,i)=>{const x=mix(74,470,i/Math.max(1,list.length-1)),appear=out(t,i*.07,reveal);return <g key={item.id} transform={`translate(${x} ${height*.48}) scale(${appear})`}>
        {i<list.length-1&&<path d={`M32 0h${Math.max(0,396/Math.max(1,list.length-1)-69)}`} stroke="#9b9e8e" strokeWidth="1.2"/>}
        <rect x="-44" y="-27" width="88" height="54" rx="5" fill={i===1?accent(scene):INK}/><Text x={0} y={7} anchor="middle" size={fit(item.label,76,20)} color="#fffbed">{item.label}</Text>
      </g>;})}
    </g>
    <circle cx={272} cy={height*.49} r={400*expansion} fill={accent(scene)} opacity={expansion*.1}/>
    <g opacity={smooth(t,act,act+(resolve-act)*.2)}>
      {[2,1,0].map(i=><Text key={i} x={272+(1-expansion)*i*25} y={baseline+mix(42,0,expansion)+i*9} anchor="middle" size={size} weight={800} family={SERIF} color={i===0?INK:accent(scene)}><tspan opacity={i===0?1:.14+i*.06}>{word}</tspan></Text>)}
      <path d={`M${272-224*expansion} ${baseline+31}h${448*expansion}`} stroke={accent(scene)} strokeWidth="3"/>
      <Text x={272} y={baseline+79} anchor="middle" size={fit(scene.content.result??'',470,23)} family={SERIF} color="#6d7465">{scene.content.result??''}</Text>
    </g>
    <g opacity={finish}>{[0,1,2,3].map(i=><path key={i} d="M-7 0H7M0-7V7" stroke={INK} strokeWidth="1" transform={`translate(${i%2?491:53} ${height*(i<2?.33:.69)}) rotate(${i*19+finish*12})`}/>)}</g>
  </Frame>;
};

const ChallengeSplit:React.FC<EffectProps>=p=>{
  const {scene,t,height}=p,{reveal,act,resolve,intro,finish}=phase(scene,t),raw=items(scene),list=[raw[0],raw[1]??raw[0]],cy=height*.49;
  return <Frame {...p}>
    <Head scene={scene} y={height*.16} opacity={intro}/>
    {list.map((item,i)=>{const appear=pop(t,i*.15,reveal+i*.15),focus=smooth(t,act,resolve),cx=169+i*206,rot=(i?4:-4)*(1-focus*.45);return <g key={i} transform={`translate(${cx} ${cy}) rotate(${rot}) scale(${.5+.5*appear})`} opacity={clamp(appear)} filter={shadow(scene)}>
      <rect x="-94" y="-134" width="188" height="268" rx="15" fill="#fffef9"/><path d="M-94-119Q-94-134-79-134H79Q94-134 94-119V-97H-94Z" fill={item.color??accent(scene)}/>
      <Text x={0} y={-109} anchor="middle" size={fit(scene.content.kicker??item.label,161,15)} color="#fff">{scene.content.kicker??item.label}</Text>
      {item.image||item.video?<Media scene={scene} item={item} x={-70} y={-76} w={140} h={106}/>:<Text x={0} y={16} anchor="middle" size={87} weight={750} family={SERIF}>{String(i+1).padStart(2,'0')}</Text>}
      <Text x={0} y={65} anchor="middle" size={fit(item.label,165,20)} weight={700}>{item.label}</Text>
      <g transform={`translate(0 103) scale(${mix(.7,1,smooth(t,reveal,act))})`}><path d="M0-23L-24 19H24Z" fill={i?accent(scene):'#c6b45c'}/><Text x={0} y={12} anchor="middle" size={29} color="#fff" weight={800}>!</Text></g>
    </g>;})}
    <g opacity={finish}><path d={`M87 ${cy+181}H457`} stroke="#afafa1"/><Text x={272} y={cy+218} anchor="middle" family={SERIF} size={fit(scene.content.result??scene.content.body??'',460,22)}>{scene.content.result??scene.content.body??''}</Text></g>
  </Frame>;
};

const RejectionGrid:React.FC<EffectProps>=p=>{
  const {scene,t,height}=p,{reveal,resolve,intro}=phase(scene,t),raw=items(scene),cols=Math.min(6,Math.max(3,scene.content.pack?.columns??5)),count=Math.min(36,Math.max(cols*3,scene.content.pack?.density??25)),rowCount=Math.ceil(count/cols),cell=Math.min(73,(448-(cols-1)*14)/cols,(height*.55-(rowCount-1)*14)/rowCount),step=cell+14,left=(544-(cols*cell+(cols-1)*14))/2,top=height*.29;
  const scanned=progress(t,reveal,resolve)*count,ix=Math.min(count-1,Math.floor(scanned)),part=scanned-ix,prev=Math.max(0,ix-1),lerp=smooth(part,0,1);
  const mx=mix(left+(prev%cols)*step+cell*.5,left+(ix%cols)*step+cell*.5,lerp),my=mix(top+Math.floor(prev/cols)*step+cell*.5,top+Math.floor(ix/cols)*step+cell*.5,lerp),selected=scene.content.selectedId;
  const selectedIndex=selected?Array.from({length:count},(_,i)=>raw[i%raw.length]).findIndex(v=>v.id===selected):-1;
  return <Frame {...p}>
    <Head scene={scene} y={height*.16} opacity={intro}/>
    {Array.from({length:count},(_,i)=>{const show=out(t,(i/count)*reveal*.32,reveal),x=left+(i%cols)*step,y=top+Math.floor(i/cols)*step,rejected=i<scanned&&i!==selectedIndex,item=raw[i%raw.length],q=smooth(scanned,i,i+.5);return <g key={i} transform={`translate(${Math.sin(i*9.3)*(1-show)*149} ${Math.cos(i*4.7)*(1-show)*127})`} opacity={show}>
      <Pic scene={scene} item={item} x={x} y={y} w={cell} h={cell}/>
      {rejected?<g opacity={q} stroke="#b45547" strokeWidth="4.4" strokeLinecap="round"><path d={`M${x+cell*.27} ${y+cell*.25}l${cell*.46} ${cell*.48}M${x+cell*.73} ${y+cell*.25}l${-cell*.46} ${cell*.48}`}/></g>:i===selectedIndex&&scanned>i?<path d={`M${x+cell*.22} ${y+cell*.50}l${cell*.17} ${cell*.19} ${cell*.40} ${-cell*.41}`} stroke="#608167" strokeWidth="4" fill="none"/>:null}
    </g>;})}
    <g opacity={smooth(t,reveal*.5,reveal)*(1-smooth(t,resolve,resolve+.25))}><Magnifier x={mx} y={my} scale={.76}/></g>
    <g transform={`translate(272 ${Math.min(height*.89,top+Math.ceil(count/cols)*step+33)})`}><Text x={0} y={0} size={19} anchor="middle" family={MONO} color="#6d7362">{Math.min(count,Math.floor(scanned))} / {count}</Text><Text x={0} y={33} size={fit(scene.content.result??'',450,21)} anchor="middle" color={accent(scene)} family={SERIF}>{scanned>=count-1?scene.content.result??'':''}</Text></g>
  </Frame>;
};

const WorkflowRoute:React.FC<EffectProps>=p=>{
  const {scene,t,height}=p,{reveal,act,resolve,intro}=phase(scene,t),list=items(scene).slice(0,6),n=list.length,cols=n<=3?n:2,rows=Math.ceil(n/cols),spacingX=n===2?216:n===3?158:236,left=272-(cols-1)*spacingX/2,top=height*(n<=3?.45:.32),spacingY=Math.min(194,height*.23);
  const positions=list.map((_,i)=>({x:left+(i%cols)*spacingX,y:top+Math.floor(i/cols)*spacingY}));
  return <Frame {...p}>
    <Head scene={scene} y={height*.15} opacity={intro}/>
    {positions.slice(0,-1).map((pos,i)=>{const next=positions[i+1],q=smooth(t,mix(reveal*.35,act,i/Math.max(1,n-1)),mix(reveal,resolve,(i+1)/n));const d=next.y===pos.y?`M${pos.x+55} ${pos.y}H${next.x-55}`:`M${pos.x} ${pos.y+62}C${pos.x} ${pos.y+116} ${next.x} ${next.y-108} ${next.x} ${next.y-62}`;const px=mix(pos.x,next.x,q),py=mix(pos.y,next.y,q);return <g key={i}><path d={d} fill="none" stroke={INK} strokeWidth="2.2" pathLength="1" strokeDasharray="1" strokeDashoffset={1-q}/><circle cx={px} cy={py} r="6" fill={accent(scene)} opacity={q>0&&q<1?1:0}/></g>;})}
    {list.map((item,i)=>{const begin=mix(0,act,i/Math.max(1,n)),enter=pop(t,begin,Math.min(resolve,begin+reveal)),q=clamp(enter),pos=positions[i],done=smooth(t,mix(reveal,act,i/Math.max(1,n)),mix(act,resolve,(i+1)/n));return <g key={item.id} transform={`translate(${pos.x} ${pos.y}) rotate(${i%2?2:-2}) scale(${Math.max(.01,enter)})`} opacity={q}>
      <rect x="-53" y="-55" width="106" height="111" rx="21" fill={item.color??PALETTE[i%PALETTE.length]} stroke={INK} strokeWidth="2.7"/>
      {item.image||item.video?<Media scene={scene} item={item} x={-42} y={-43} w={84} h={85}/>:i%3===0?<Magnifier x={-7} y={-8} scale={.44}/>:i%3===1?<g fill="#fff8e6" stroke={INK} strokeWidth="2"><rect x="-29" y="-27" width="57" height="53" rx="5"/><path d="M-17-12h32M-17 0H8M-17 12h24"/></g>:<g fill="none" stroke={INK} strokeWidth="2.4"><path d="M-27 4l17 17 36-43"/><path d="M-32-30v-9h13M32 28v11H19"/></g>}
      <circle cx="44" cy="-47" r="14" fill={done>.95?accent(scene):'#fff7e7'} stroke={INK} strokeWidth="1.5"/>
      <Text x={44} y={-42} anchor="middle" size={14} weight={700} color={done>.95?'#fff':INK}>{i+1}</Text>
      <Text x={0} y={88} anchor="middle" size={fit(item.label,143,21)} weight={600}>{item.label}</Text>
    </g>;})}
    <Text x={272} y={Math.min(height*.89,top+(rows-1)*spacingY+149)} anchor="middle" size={fit(scene.content.result??'',470,22)} family={SERIF} color={accent(scene)}>{t>act?scene.content.result??'':''}</Text>
  </Frame>;
};

export const editorialPack:Record<string,React.FC<EffectProps>>={
  'feed-montage':FeedMontage,
  'magazine-collage':MagazineCollage,
  'code-editor':CodeEditor,
  'idea-burst':IdeaBurst,
  'document-write':DocumentWrite,
  'reference-search':ReferenceSearch,
  'code-build':CodeBuild,
  'prompt-substitute':PromptSubstitute,
  'kinetic-type':KineticType,
  'challenge-split':ChallengeSplit,
  'rejection-grid':RejectionGrid,
  'workflow-route':WorkflowRoute,
};
