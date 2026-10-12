import React from 'react';
import {AbsoluteFill, Img, staticFile} from 'remotion';
import {CalibratedPoster} from './CalibratedPosters';
import {SyncedResearchEditor} from './SyncedResearchEditor';
import '@fontsource/noto-serif-sc/600.css';

const clamp=(v:number)=>Math.max(0,Math.min(1,v));
const ease=(t:number,a:number,b:number)=>{const p=clamp((t-a)/(b-a));return p*p*(3-2*p);};
const mix=(a:number,b:number,p:number)=>a+(b-a)*p;
const serif='"Noto Serif SC", serif';
export const CALIBRATED_CUTS={posters:56/30,editor:202/30,end:15.2};

// Parametric shaded geometry: authored subject imagery, not reference-video frames.
const MathSculpture:React.FC<{t:number;variant:number}>=({t,variant})=>{
 const polygons:{z:number;points:string;light:number}[]=[];
 const angle=.52+variant*.57+t*.12,ca=Math.cos(angle),sa=Math.sin(angle);
 const rotate=(x:number,y:number,z:number)=>{const xx=x*ca+z*sa,zz=-x*sa+z*ca;return {x:xx,y:y*.74-zz*.673,z:y*.673+zz*.74};};
 const point=(u:number,v:number)=>{
   const R=92,r=variant%2===0?35:26;
   return rotate((R+r*Math.cos(v))*Math.cos(u),(R+r*Math.cos(v))*Math.sin(u),r*Math.sin(v));
 };
 for(let i=0;i<128;i++)for(let j=0;j<64;j++){
  const du=Math.PI/64,dv=Math.PI/32,u=i*du,v=j*dv;
  const pts=[point(u,v),point(u+du,v),point(u+du,v+dv),point(u,v+dv)];
  const n=rotate(Math.cos(v)*Math.cos(u),Math.cos(v)*Math.sin(u),Math.sin(v));
  const light=Math.max(0,n.x*-.35+n.y*-.55+n.z*.76);
  polygons.push({z:pts.reduce((a,b)=>a+b.z,0)/4,points:pts.map(p=>`${p.x+282},${p.y+147}`).join(' '),light});
 }
 polygons.sort((a,b)=>a.z-b.z);
 const base=variant%3===0?[39,47,39]:variant%3===1?[100,28,42]:[119,131,117];
 return <svg viewBox="0 0 550 310" width="100%" height="100%">
  <defs><radialGradient id={`room${variant}`}><stop stopColor="#f6f4ed"/><stop offset="1" stopColor="#aaa9a4"/></radialGradient><filter id={`shadow${variant}`}><feGaussianBlur stdDeviation="9"/></filter></defs>
  <rect width="550" height="310" fill={`url(#room${variant})`}/>
  <ellipse cx="283" cy="277" rx="131" ry="14" fill="#191b17" opacity=".21" filter={`url(#shadow${variant})`}/>
  {polygons.map((p,i)=>{const spec=Math.pow(p.light,14)*95;const color=base.map(c=>Math.round(c*(.62+p.light*.85)+spec));return <polygon key={i} points={p.points} fill={`rgb(${color.join(',')})`} stroke={`rgb(${color.join(',')})`} strokeWidth=".35"/>;})}
  <text x="29" y="39" fontFamily="Noto Serif SC" fontStyle="italic" fontSize="22" fill="#383a34">{['推理的形状','新的数学结构','从问题，到证明'][variant%3]}</text>
  <text x="435" y="284" fontFamily="Tinos" fontSize="24" fill="#54564f">∂M ≠ ∅</text>
 </svg>;
};

const MontageImage:React.FC<{variant:number;t:number}>=({variant,t})=>{
 if(variant%4===2)return <div style={{position:'absolute',inset:0,background:'#e3e2dc',overflow:'hidden'}}><Img src={staticFile('assets/catalog-page.png')} style={{position:'absolute',left:12,top:-142,width:563,transform:`rotate(-8deg) scale(${1.02+t*.035})`,filter:'contrast(.94)',boxShadow:'0 8px 15px #0003'}}/><div style={{position:'absolute',right:24,bottom:29,fontFamily:'Tinos',fontSize:67,fontStyle:'italic',color:'#e6e4d9',background:'#343a31',padding:'2px 16px'}}>719</div></div>;
 if(variant%4===3)return <div style={{position:'absolute',inset:0,background:'radial-gradient(ellipse at 62% 32%,#4c5950,#172823 80%)',overflow:'hidden',fontFamily:'Tinos',color:'#e7e7d2'}}><div style={{position:'absolute',left:56,top:26,fontSize:79,fontStyle:'italic',transform:`rotate(-7deg) translateX(${t*13}px)`}}>∫ f(x) dx</div><div style={{position:'absolute',left:204,top:125,fontSize:50,transform:'rotate(4deg)',opacity:.8}}>∀ ε &gt; 0, ∃ δ &gt; 0</div><svg width="550" height="310" style={{position:'absolute',inset:0}}><path d="M12 248C135 258 136 67 253 163S406 293 548 113" fill="none" stroke="#d8d7ad" strokeWidth="2"/><path d="M104 0V310M0 250H550" fill="none" stroke="#becac03b"/><circle cx="254" cy="164" r="5" fill="#e9d8a4"/></svg></div>;
 return <MathSculpture variant={variant} t={t}/>;
};

const ResearchFeed:React.FC<{t:number}>=({t})=>{
 const cuts=[0,.28,.55,.78,1.02,1.3,1.62];
 const n=Math.max(0,cuts.filter(v=>t>=v).length-1),age=t-cuts[n],x=n===0?0:103;
 const impact=(1-ease(age,0,.065))*15;
 const titles=['开始研究数学','公开内部模型成果','数学研究新进展','整理研究稿件','给出配套证明','检验数学论证','开放研究材料'];
 return <AbsoluteFill style={{background:'#030403',overflow:'hidden'}}>
  <div style={{position:'absolute',inset:-4,transform:`translateX(${impact}px) scale(${1+age*.025})`,transformOrigin:'45% 48%',filter:`blur(${impact*.065+.38}px)`}}>
   <div style={{position:'absolute',left:x-578,top:-4,width:555,height:314,borderRadius:25,overflow:'hidden',filter:'blur(3px)',opacity:.8}}><MontageImage variant={n+1} t={t}/></div>
   <div style={{position:'absolute',left:x,top:-4,width:555,height:314,borderRadius:'0 0 25px 25px',overflow:'hidden'}}><MontageImage variant={n} t={t}/></div>
   <div style={{position:'absolute',left:x+24,top:332,fontSize:33,fontFamily:'Noto Sans SC',color:'#eee',whiteSpace:'nowrap',letterSpacing:-1.3}}>用<span style={{background:'#f7df22',color:'#10100c',fontWeight:700,padding:'0 2px'}}>OpenAI</span> {titles[n]}</div>
   <div style={{position:'absolute',left:x+26,top:402,fontSize:27,color:'#8a8d85',filter:'blur(2.3px)'}}>研究进展 · 公开材料与论证</div>
   <div style={{position:'absolute',left:x+120,top:471,fontSize:28,color:'#787d73',filter:'blur(.6px)'}}>10-06</div>
   <div style={{position:'absolute',left:x,top:528,width:555,height:315,borderRadius:'26px 26px 0 0',overflow:'hidden',filter:'blur(3px)',opacity:.87}}><MontageImage variant={n+1} t={t+.3}/></div>
   <div style={{position:'absolute',inset:0,background:'linear-gradient(90deg,#0007,transparent 25%,transparent 68%,#0009)'}}/>
  </div>
  <div style={{position:'absolute',left:118,top:419,width:357,height:64,background:'#e9e9e4',color:'#363632',display:'grid',placeItems:'center',fontFamily:serif,fontStyle:'italic',fontSize:32,letterSpacing:-1.6}}>AI 开始做数学研究</div>
 </AbsoluteFill>;
};

const ResearchPosters:React.FC<{t:number}>=({t})=>{
 const close=ease(t,4.16,4.32)*(1-ease(t,4.76,5.0)),drift=ease(t,4.32,4.70);
 const branch=ease(t,4.83,5.31),line=ease(t,3.77,4.1);
 const title={fontFamily:serif,fontStyle:'italic',color:'#30312d'} as const;
 return <AbsoluteFill style={{overflow:'hidden',background:'radial-gradient(ellipse at 48% 57%,#e4e4e1 0%,#d9d9d5 40%,#c6c4c2 84%,#bbb9b8 100%)'}}>
  <div style={{position:'absolute',inset:0,transform:`translate(${close*(-91-drift*70)}px,${close*(-1026-drift*15)}px) scale(${1+close*1.92})`,transformOrigin:'0 0'}}>
   <div style={{position:'absolute',left:129,top:81,display:'flex',alignItems:'center',gap:21,...title,opacity:ease(t,1.93,2.14)*(1-ease(t,3.23,3.38))}}>
    <span style={{fontSize:21,lineHeight:1.12}}>不止<br/>于</span><span style={{fontSize:52,letterSpacing:-3.5,fontWeight:600,opacity:ease(t,2.14,2.52),filter:`blur(${(1-ease(t,2.16,2.53))*9}px)`}}>竞赛刷题</span>
   </div>
   <div style={{position:'absolute',left:120,top:75,display:'flex',alignItems:'center',gap:16,...title,opacity:ease(t,3.307,3.4)*(1-ease(t,4.08,4.17))}}>
    <span style={{fontSize:20,fontFamily:'Tinos'}}>2026</span><span style={{fontFamily:serif,fontSize:48,lineHeight:1.05,opacity:ease(t,3.307,3.5),filter:`blur(${(1-ease(t,3.307,3.52))*9}px)`}}>十月六日</span>
   </div>
   <div style={{position:'absolute',left:90,top:78,display:'flex',alignItems:'center',gap:12,...title,opacity:ease(t,4.76,4.96)}}>
    <span style={{fontSize:20,lineHeight:1.2,textAlign:'center',width:111}}>内部模型<br/><span style={{opacity:ease(t,4.91,5.11)}}>生成的</span></span>
    <span style={{fontSize:48,letterSpacing:-2,fontWeight:600,transform:'scaleX(1.08)',transformOrigin:'left',opacity:ease(t,5.52,5.83),filter:`blur(${(1-ease(t,5.52,5.86))*9}px)`}}>研究成果</span>
   </div>
   <svg width="544" height="720" style={{position:'absolute',inset:0}}>
    <path d="M22 470L264 147L522 436Z" fill="none" stroke="#71736e" strokeWidth=".75" opacity={ease(t,1.93,2.13)*(1-ease(t,3.18,3.45))}/>
    <path d={`M116 449C${mix(94,72,branch)} ${mix(480,504,branch)} ${mix(120,220,branch)} ${mix(490,497,branch)} ${mix(150,227,branch)} ${mix(504,556,branch)}`} fill="none" stroke="#70716b" strokeWidth=".8" pathLength="1" strokeDasharray="1" strokeDashoffset={1-line}/>
    <path d="M272 430L272 556" fill="none" stroke="#70716b" strokeWidth=".8" pathLength="1" strokeDasharray="1" strokeDashoffset={1-ease(t,4.82,5.26)}/>
    <path d="M429 411C473 489 322 476 318 556" fill="none" stroke="#70716b" strokeWidth=".8" pathLength="1" strokeDasharray="1" strokeDashoffset={1-ease(t,4.95,5.38)}/>
    <path d="M207 555H337V665H207Z" fill="none" stroke="#777973" strokeWidth=".9" pathLength="1" strokeDasharray="1" strokeDashoffset={1-ease(t,5.15,5.58)}/>
    {[{x:116,y:449},{x:272,y:430},{x:429,y:411}].map((p,i)=><circle key={i} cx={p.x} cy={p.y} r="1.1" fill="#65655f" opacity={i===0?line:branch}/>)}
   </svg>
   {[0,1,2].map(i=>{const enter=ease(t,1.86+i*.11,2.17+i*.13);return <div key={i} style={{position:'absolute',left:49+i*159,top:231-i*23+(1-enter)*(i===1?43:31),opacity:enter*(i===0?1:1-close),transform:`perspective(1200px) rotateY(${-3+i*2}deg) rotateZ(${[-2.8,-.4,2.8][i]}deg)`}}>
    <div style={{width:126,height:224,overflow:'hidden',borderRadius:3,border:'1px solid #ffffffe6',boxShadow:'1px 3px 3px #00000019,0 12px 13px -8px #00000037'}}><div style={{width:128,height:226,transform:'scale(.984375)',transformOrigin:'top left'}}><CalibratedPoster index={i as 0|1|2} t={t}/></div></div>
    <span style={{fontFamily:serif,fontStyle:'italic',fontSize:16,marginLeft:4,color:'#3c3e36'}}>{i+1}</span>
   </div>;})}
   <div style={{position:'absolute',left:62,top:515,...title,fontWeight:600,fontSize:19,letterSpacing:-1,opacity:ease(t,4.267,4.36)*(1-ease(t,4.70,4.96)),filter:`blur(${(1-ease(t,4.267,4.40))*1.1}px)`}}>公开</div>
   <div style={{position:'absolute',left:207,top:553,width:130,height:112,display:'grid',placeItems:'center',fontFamily:'Tinos',fontSize:65,fontStyle:'italic',color:'#3a3b35',opacity:ease(t,5.43,5.9),filter:`blur(${(1-ease(t,5.45,5.89))*8}px)`}}>math</div>
  </div>
 </AbsoluteFill>;
};

export const SyncedOpening:React.FC<{t:number}>=({t})=>t<CALIBRATED_CUTS.posters?<ResearchFeed t={t}/>:t<CALIBRATED_CUTS.editor?<ResearchPosters t={t}/>:<SyncedResearchEditor t={t}/>;
