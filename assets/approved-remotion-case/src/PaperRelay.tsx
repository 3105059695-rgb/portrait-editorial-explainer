import React from 'react';
import {AbsoluteFill} from 'remotion';

// Extracted without visual/timing changes from the approved case's shared opening module.
const clamp=(v:number)=>Math.max(0,Math.min(1,v));
const q=(t:number,a:number,b:number)=>{const p=clamp((t-a)/(b-a));return p*p*(3-2*p);};
const out=(t:number,a:number,b:number)=>1-Math.pow(1-clamp((t-a)/(b-a)),4);
const lerp=(a:number,b:number,p:number)=>a+(b-a)*p;
const ink='#272922',rust='#b34f2b',serif='"Noto Serif SC",serif',roman='"Tinos",serif';
const gray='radial-gradient(ellipse at 44% 39%,#e2e2df 0%,#d2d1ce 43%,#bfbdbb 83%,#aeacab 100%)';
const paperShadow='0 1px 1px #fff inset,2px 3px 2px #1414121a,8px 12px 16px -5px #16151240';
type Pose={at:number;x:number;y:number;z:number;r?:number};
const camera=(t:number,poses:Pose[])=>{
 let a=poses[0],b=poses[0];for(let i=1;i<poses.length;i++){if(t<poses[i].at){b=poses[i];break;}a=poses[i];b=a;}
 const p=a.at===b.at?1:q(t,a.at,b.at);return {x:lerp(a.x,b.x,p),y:lerp(a.y,b.y,p),z:lerp(a.z,b.z,p),r:lerp(a.r??0,b.r??0,p)};
};
const FineText:React.FC<{rows?:number}>=({rows=6})=><div style={{fontFamily:roman,fontSize:6.3,lineHeight:1.4,textAlign:'justify',color:'#53554e'}}>{Array.from({length:rows},(_,i)=><span key={i}>{['We study the structure of the underlying mathematical objects. ','A family groups related papers and supporting arguments. ','The construction gives a corresponding result in each case. '][i%3]}</span>)}</div>;

const MathArt:React.FC<{variant:number;progress?:number}>=({variant,progress=1})=><svg viewBox="0 0 160 180" style={{width:'100%',height:'100%',overflow:'visible'}}>
 <g fill="none" stroke={variant===2?'#496953':ink} strokeWidth=".75">
  {variant===0?<>
   {Array.from({length:17},(_,i)=>{const y=-55+i*7;return <ellipse key={i} cx="80" cy={91+y*.5} rx={Math.sqrt(Math.max(0,1-y*y/3600))*66} ry={12+Math.abs(y)*.11} transform={`rotate(-22 80 ${91+y*.5})`} opacity={.25+i*.035}/>;})}
   {Array.from({length:9},(_,i)=><ellipse key={i} cx="80" cy="91" rx={10+i*7} ry="58" transform={`rotate(-22 80 91)`} opacity={.45}/>) }
   <circle cx="113" cy="53" r="4" fill={rust} stroke="none"/><text x="18" y="163" fontFamily={roman} fontStyle="italic" fontSize="18" fill={ink} stroke="none">∂M ≠ ∅</text>
  </>:variant===1?<>
   <path d="M9 131 H155 M37 169 V11" stroke="#899084"/>
   {Array.from({length:12},(_,i)=><path key={i} d={`M${20+i*11} 130 Q${51+i*3} ${9+i*11} 150 ${31+i*7}`} opacity={.14+i*.06}/>) }
   <path d="M18 132 C51 131 44 49 93 61 S124 94 151 15" stroke={rust} strokeWidth="2" pathLength="1" strokeDasharray="1" strokeDashoffset={1-progress}/>
   {[0,1,2,3].map((i)=><circle key={i} cx={39+i*30} cy={[112,65,71,45][i]} r="3" fill={ink}/>) }
   <text x="54" y="155" fill={ink} stroke="none" fontSize="18" fontFamily={roman} fontStyle="italic">ζ(s)</text>
  </>:<>
   {Array.from({length:8},(_,i)=><g key={i}><path d={`M${15+i*18} 24 L${143-i*18} 150 M${15+i*18} 24 L${15+i*18} 150`} opacity=".4"/><circle cx={15+i*18} cy="24" r="4" fill={i%3===0?'#789c75':'#f0f1e5'}/><circle cx={15+i*18} cy="150" r="4" fill="#f0f1e5"/></g>)}
   <rect x="38" y="68" width="87" height="37" fill="#d5dfc8" stroke="none"/><text x="49" y="93" fontSize="22" fill="#324b34" stroke="none" fontFamily={roman} fontStyle="italic">O(log n)</text>
  </>}
 </g>
</svg>;

const ResultSheet:React.FC<{kind:number;style?:React.CSSProperties}>=({kind,style})=><div style={{position:'absolute',width:236,height:331,boxSizing:'border-box',padding:'19px 20px',background:'linear-gradient(125deg,#fffef8,#eae8df)',boxShadow:paperShadow,border:'1px solid #ffffff',color:ink,...style}}>
 <div style={{fontFamily:roman,fontSize:8,display:'flex',justifyContent:'space-between',borderBottom:'1px solid #696b6166',paddingBottom:7}}><span>OpenAI · Mathematics</span><span>{['A','B','C'][kind]}</span></div>
 <div style={{fontFamily:serif,fontSize:26,fontWeight:700,letterSpacing:-.9,marginTop:20}}>{['主结果','配套论证','另一种证明'][kind]}</div>
 <div style={{fontFamily:roman,fontSize:10,fontStyle:'italic',marginTop:5,color:'#7d8172'}}>{['Principal result','Companion arguments','Alternative proof'][kind]}</div>
 <div style={{marginTop:12,height:145}}><MathArt variant={kind}/></div>
 <FineText rows={3}/>
 <div style={{position:'absolute',left:20,bottom:14,fontSize:7,letterSpacing:1,color:'#7c7f72'}}>研究分组关系 · 结构示意</div>
 <div style={{position:'absolute',right:19,bottom:12,fontFamily:roman,fontStyle:'italic',fontSize:16}}>{kind+1}</div>
</div>;

export const PaperRelay:React.FC<{t:number;alwaysVisible?:boolean;groupedTitle?:string;focusAlternative?:boolean}>=({t,alwaysVisible=false,groupedTitle,focusAlternative=false})=>{
 // Selected paper leaves the repository and stays identifiable through each handoff.
 const reveal=alwaysVisible?1:out(t,14.62,15.03);const second=out(t,16.58,16.96),third=out(t,18.05,18.43);const archive=q(t,20.14,20.65);const seal=out(t,21.04,21.23);
 const cam=camera(t,[{at:14.62,x:-329,y:-249,z:1.82,r:-5},{at:15.07,x:-198,y:-133,z:1.48,r:-4},{at:15.65,x:-198,y:-133,z:1.48,r:-4},{at:16.08,x:-39,y:17,z:1,r:0},{at:16.59,x:-39,y:17,z:1,r:0},{at:17.06,x:-246,y:-125,z:1.4,r:3},{at:17.63,x:-246,y:-125,z:1.4,r:3},{at:18.17,x:-328,y:-109,z:1.36,r:1},{at:18.98,x:-61,y:22,z:.98,r:0},{at:20.1,x:-61,y:22,z:.98,r:0},{at:20.7,x:0,y:0,z:1,r:0},{at:21.72,x:0,y:0,z:1,r:0},{at:22.5,x:-70,y:-38,z:1.23,r:-2}]);
 const focusX=focusAlternative?-155*q(t,18.05,18.25)*(1-q(t,19.7,20.14)):0;
 return <AbsoluteFill style={{background:gray,overflow:'hidden',color:ink,opacity:reveal}}>
  <div style={{position:'absolute',inset:0,transform:`translate(${cam.x+focusX}px,${cam.y}px) scale(${cam.z}) rotate(${cam.r}deg)`,transformOrigin:'0 0'}}>
   <div style={{position:'absolute',left:50,top:139,fontFamily:serif,fontSize:23,lineHeight:1.5,opacity:q(t,15.88,16.12)*(1-archive)}}>一组研究<br/><span style={{fontSize:13,color:'#72756c'}}>可以包含</span></div>
   <svg width="740" height="720" style={{position:'absolute',inset:0,opacity:(1-archive)}}>
    <path d="M204 495 Q197 557 349 550 Q523 553 552 473" stroke="#787b72" fill="none" strokeWidth="1" pathLength="1" strokeDasharray="1" strokeDashoffset={1-q(t,18.53,19.1)}/><path d="M535 478 L553 472 L551 489" fill="none" stroke="#787b72" opacity={q(t,18.92,19.09)}/>
   </svg>
   <div style={{position:'absolute',left:88,top:357,width:362,height:207,borderRadius:'5px 6px 8px 8px',background:'#8e927e',border:'1px solid #777e68',opacity:archive,boxShadow:'12px 23px 35px #36382b38'}}><div style={{position:'absolute',top:-25,left:-1,width:136,height:32,borderRadius:'5px 12px 0 0',background:'#8e927e',border:'1px solid #777e68'}}/></div>
   {[2,1,0].map(kind=>{
    const enter=kind===0?1:kind===1?second:third;
    const x0=kind===0?128:kind===1?lerp(133,308,second):lerp(311,449,third);
    const y0=kind===0?229:kind===1?lerp(241,186,second):lerp(198,238,third);
    const scale=lerp(1,.72,archive),x=lerp(x0,134+kind*46,archive),y=lerp(y0,246+kind*5,archive);
    return <ResultSheet key={kind} kind={kind} style={{left:x,top:y,opacity:enter,zIndex:focusAlternative&&kind===2&&t>=18.05&&t<20.14?5:undefined,transform:`rotate(${lerp([-7,4,12][kind],[-7,0,7][kind],archive)}deg) scale(${scale})`,transformOrigin:'50% 75%',filter:`blur(${(1-enter)*5}px)`}}/>;
   })}
   <div style={{position:'absolute',left:203,top:346,width:127,height:47,background:'#ebe6c8',borderTop:'1px solid #9c865b',borderBottom:'1px solid #9c865b',transform:'rotate(-9deg)',display:'grid',placeItems:'center',fontFamily:serif,fontSize:23,fontWeight:700,color:rust,opacity:q(t,15.35,15.55)*(1-q(t,15.86,16.1))}}>一篇 ≠ 一题</div>
   <div style={{position:'absolute',left:88,top:421,width:362,height:143,background:'linear-gradient(130deg,#c4c9af,#aab39a)',border:'1px solid #808d74',borderRadius:'3px 5px 8px 8px',boxShadow:'0 1px #d9dfc8 inset,1px 4px 1px #798970',opacity:archive,transform:`perspective(900px) rotateX(${(1-archive)*55}deg)`,transformOrigin:'bottom'}}>
    <div style={{position:'absolute',left:25,top:27,fontFamily:serif,fontWeight:700,fontSize:28}}>同一组研究</div><div style={{position:'absolute',left:26,top:76,fontFamily:roman,fontSize:12,color:'#526247'}}>ONE RESULT FAMILY</div>
    <div style={{position:'absolute',right:23,top:24,fontFamily:roman,fontSize:62,fontStyle:'italic',color:'#637155'}}>01</div>
    <div style={{position:'absolute',right:86,top:79,border:`1.5px solid ${rust}`,padding:'5px 9px',fontSize:13,color:rust,transform:`rotate(-9deg) scale(${1.7-.7*seal})`,opacity:seal}}>相关结果</div>
   </div>
   <div style={{position:'absolute',left:119,top:164,fontFamily:serif,fontSize:24,opacity:q(t,20.58,20.8),fontWeight:700}}>{groupedTitle??<>稿件数量<span style={{fontFamily:roman,fontSize:37,color:rust,margin:'0 16px'}}>≠</span>难题数量</>}</div>
   <div style={{position:'absolute',left:138,top:199,fontFamily:roman,fontSize:12,fontStyle:'italic',color:'#707969',opacity:q(t,21.42,21.68)}}>principal result · arguments · alternative proofs</div>
  </div>
 </AbsoluteFill>;
};

