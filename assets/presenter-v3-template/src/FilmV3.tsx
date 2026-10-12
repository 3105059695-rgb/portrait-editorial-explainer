import React from 'react';
import {AbsoluteFill, Audio, OffthreadVideo, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {CompanyV2, MoneyV2, PropsDefsV2} from './PropsV2';
import {CareerActionV3} from './CareerActionV3';
import {ComicThreadV3} from './ComicThreadV3';
import captions from './captions.json';
import './fonts';
import {mediaConfig} from './mediaConfig';
import {PresenterPlaceholder} from './PresenterPlaceholder';

const clamp=(n:number)=>Math.max(0,Math.min(1,n));
const p=(t:number,a:number,b:number)=>clamp((t-a)/(b-a));
const e=(t:number,a:number,b:number)=>{const q=p(t,a,b);return q*q*(3-2*q);};
const m=(a:number,b:number,q:number)=>a+(b-a)*q;
const ink='#252722',rust='#b65c3e',serif='"Noto Serif SC",serif',sans='"Noto Sans SC",sans-serif';
const logo=<image href={staticFile('media/openai-wordmark.svg')} width="1604" height="718"/>;

/** Camera targets are in world coordinates; the whole stage follows one camera. */
const Conditions:React.FC<{t:number}>=({t})=>{
 const first=1-e(t,2.66,2.98),second=e(t,3.14,3.36)*(1-e(t,3.68,4.06));
 const z=1+first*1.55+second*1.4;
 const fx=270+(157-270)*first+(389-270)*second;
 const fy=460+(437-460)*first+(397-460)*second;
 const transition=e(t,2.04,2.23),title2=e(t,3.18,3.35);
 const shadow='2px 5px 1px #99999335,0 16px 21px #20221e24';
 return <div style={{position:'absolute',inset:0,background:'radial-gradient(ellipse at 50% 38%,#f8f8f4 0%,#e5e5df 75%,#d0d0c9 100%)'}}>
  <svg width="540" height="960" style={{position:'absolute',inset:0,opacity:.22}}><path d="M16 627 L266 210 L538 624 Z M35 642 L521 642" fill="none" stroke="#8c8c83" strokeWidth=".8"/></svg>
  <div style={{position:'absolute',inset:0,transform:`translate(270px,460px) scale(${z}) translate(${-fx}px,${-fy}px)`,transformOrigin:'0 0',opacity:transition}}>
   <div style={{position:'absolute',left:42,top:244,width:225,height:389,background:'#fffffa',boxShadow:shadow,transform:'rotate(-6deg)',border:'1px solid #d9d9d1'}}>
    <div style={{position:'absolute',left:18,top:17,fontFamily:serif,fontSize:12,color:'#6b6c63'}}>已经拥有</div>
    <svg width="225" height="330" viewBox="0 0 225 330" style={{position:'absolute',top:38,left:0}}>
     <defs><PropsDefsV2/></defs>
     <g transform="translate(113 150) scale(.84)"><MoneyV2 t={0}/></g>
     <path d="M35 278 H189" fill="none" stroke="#c5c4ba"/>
     <text x="112" y="308" textAnchor="middle" fontFamily={serif} fontSize="28" fontWeight="700" fill={ink}>不缺钱</text>
    </svg>
   </div>
   <div style={{position:'absolute',left:290,top:203,width:225,height:389,background:'#faf9ed',boxShadow:shadow,transform:'rotate(5deg)',border:'1px solid #d9d9d1'}}>
    <div style={{position:'absolute',left:18,top:17,fontFamily:serif,fontSize:12,color:'#6b6c63'}}>自己创办</div>
    <svg width="225" height="330" viewBox="0 0 225 330" style={{position:'absolute',top:38,left:0}}>
     <g transform="translate(113 156) scale(.86)"><CompanyV2 t={0}/></g>
     <path d="M35 279 H189" fill="none" stroke="#c5c4ba"/>
     <text x="112" y="309" textAnchor="middle" fontFamily={serif} fontSize="27" fontWeight="700" fill={ink}>自己的公司</text>
    </svg>
   </div>
   <svg width="540" height="960" style={{position:'absolute',inset:0}}>
    <path d="M143 631 C132 675 317 664 298 710 M398 596 C446 670 317 656 322 710" stroke="#555d4b" strokeWidth="1.3" fill="none" pathLength="1" strokeDasharray="1" strokeDashoffset={1-e(t,3.78,4.12)}/>
    <g opacity={e(t,3.94,4.12)}><rect x="245" y="709" width="135" height="45" fill="#f7f7f0" stroke="#a4a695"/><text x="312" y="740" textAnchor="middle" fontSize="24" fontFamily={serif} fill={ink}>为什么？</text></g>
   </svg>
  </div>
  <div style={{position:'absolute',left:36,top:103,width:476,fontSize:46,fontFamily:serif,fontWeight:700,letterSpacing:-1,color:ink,opacity:transition}}>
   <span style={{display:'block',fontSize:17,fontWeight:400,letterSpacing:2,marginBottom:8}}>一个不缺钱的人</span>
   <span style={{opacity:1-title2,position:'absolute'}}>不缺<span style={{color:rust}}>钱</span></span>
   <span style={{opacity:title2,filter:`blur(${(1-title2)*6}px)`}}>还自己<span style={{color:rust}}>开公司</span></span>
  </div>
 </div>;
};

/** Designed screen shell, not a screenshot of a fabricated source website. */
const InterviewScreen:React.FC<{t:number}>=({t})=>{
 const push=e(t,6.50,7.12),pull=e(t,7.26,7.63),stamp=e(t,7.30,7.43);
 const z=1+push*.22-pull*.17;
 return <div style={{position:'absolute',inset:0,background:'#20211f'}}>
  <svg width="540" height="960" style={{position:'absolute',inset:0}}>
   <defs>
    <filter id="v3-screen-lens" x="0" y="0" width="540" height="960" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
     <feImage href={staticFile('media/lens-map-v3.png')} x="0" y="0" width="540" height="960" result="lens"/>
     <feGaussianBlur in="lens" stdDeviation="1.2" result="lens-smooth"/>
     <feDisplacementMap in="SourceGraphic" in2="lens-smooth" scale="138" xChannelSelector="R" yChannelSelector="G"/>
    </filter>
    <pattern id="v3-screen-scan" width="3" height="3" patternUnits="userSpaceOnUse"><rect width="3" height=".6" fill="#000" opacity=".08"/></pattern>
    <radialGradient id="v3-screen-vignette"><stop offset=".38" stopColor="#000" stopOpacity="0"/><stop offset="1" stopColor="#000" stopOpacity=".36"/></radialGradient>
   </defs>
   <g filter="url(#v3-screen-lens)">
    <g transform={`translate(270 374) scale(${z}) translate(-270 -374) translate(${push*-6} ${-push*19})`}>
     <rect x="-25" y="67" width="590" height="663" rx="15" fill="#111412" stroke="#787b70" strokeWidth="1.2"/>
     <rect x="-24" y="68" width="588" height="42" rx="15" fill="#292c28"/>
     <circle cx="17" cy="88" r="4" fill="#d76f58"/><circle cx="33" cy="88" r="4" fill="#dfc37a"/><circle cx="49" cy="88" r="4" fill="#8dac8a"/>
     <text x="279" y="92" fill="#d2d3ca" fontFamily={sans} fontSize="10" textAnchor="middle">历史案例构图 · 素材示意</text>
     <text x="25" y="151" fill="#f1f1e9" fontFamily={serif} fontSize="29" fontWeight="700">邵艾伦 × 孙宇晨</text>
     <rect x="-15" y="181" width="570" height="373" fill="#111"/>
     <svg x="-10" y="187" width="277" height="356" viewBox="0 0 1370 1060" preserveAspectRatio="xMidYMid slice"><image href={staticFile(mediaConfig.referenceImage)} width="2992" height="1060"/></svg>
     <svg x="273" y="187" width="277" height="356" viewBox="1740 0 1252 1060" preserveAspectRatio="xMidYMid slice"><image href={staticFile(mediaConfig.referenceImage)} width="2992" height="1060"/></svg>
     <rect x="-10" y="498" width="560" height="48" fill="#080d0a" opacity=".68"/>
     <text x="25" y="530" fontFamily={sans} fontSize="19" fontWeight="700" fill="white">邵艾伦</text>
     <text x="311" y="530" fontFamily={sans} fontSize="19" fontWeight="700" fill="white">孙宇晨</text>
     <path d="M22 578 H519" stroke="#4d5148" strokeWidth="2"/>
     <rect x="22" y="577" width={m(34,497,e(t,7.10,7.42))} height="3" fill="#b7c8a4"/>
     <text x="25" y="611" fontFamily={sans} fontSize="12" fill="#aaaFA3">长访谈</text>
     <text x="25" y="638" fontFamily={serif} fontSize="15" fill="#dddcd2">访谈材料占位 · 请替换真实材料</text>
    </g>
   </g>
   <rect width="540" height="960" fill="url(#v3-screen-scan)" opacity=".7"/>
   <rect width="540" height="960" fill="url(#v3-screen-vignette)"/>
  </svg>
  <div style={{position:'absolute',left:171,top:612,width:335,height:181,transform:`translateY(${(1-stamp)*92}px) rotate(-6deg) scale(${m(.72,1,stamp)})`,opacity:stamp,background:'#f1e4a5',border:'3px solid #191d16',boxShadow:'5px 7px 0 #a18f4f,8px 19px 20px #0005',color:'#22261c'}}>
   <div style={{fontFamily:'Tinos',fontSize:128,lineHeight:1,fontWeight:700,textAlign:'center'}}>4h<span style={{fontSize:70}}>+</span></div>
   <div style={{textAlign:'center',fontFamily:sans,fontSize:24,fontWeight:800}}>四个多小时</div>
  </div>
 </div>;
};

export const FilmV3:React.FC=()=>{
 const frame=useCurrentFrame(),{fps}=useVideoConfig(),t=frame/fps;
 const shift=e(t,1.99,2.36),headline=e(t,.84,1.08),logoIn=e(t,1.13,1.28);
 const launch=e(t,1.92,2.18),introGone=e(t,2.15,2.27);
 const sceneC=e(t,4.15,4.34),comic=e(t,8.08,8.38),screenReveal=e(t,6.14,6.32);
 const caption=captions.find(c=>t>=c.start&&t<c.end)||(t>=10.72?captions[captions.length-1]:undefined);
 const dark=t<2.29||(t>=6.28&&t<8.08);
 return <AbsoluteFill style={{background:'#f6f6f2'}}>
  {mediaConfig.voiceTrack && <Audio src={staticFile(mediaConfig.voiceTrack)}/>}
  <div style={{position:'absolute',inset:0,width:540,height:960,transform:'scale(2)',transformOrigin:'top left',overflow:'hidden',fontFamily:sans,color:ink}}>
   {t<4.35&&<Conditions t={t}/>}
   {t>=4.15&&t<6.32&&<div style={{position:'absolute',inset:0,clipPath:`circle(${sceneC*1100}px at 312px 729px)`}}><CareerActionV3 t={t}/></div>}
   {t>=6.14&&t<8.39&&<div style={{position:'absolute',inset:0,clipPath:screenReveal<1?`inset(${m(486,0,screenReveal)}px ${m(75,0,screenReveal)}px ${m(388,0,screenReveal)}px ${m(312,0,screenReveal)}px round ${m(4,0,screenReveal)}px)`:'none'}}><InterviewScreen t={t}/></div>}
   {t>=8.08&&<div style={{position:'absolute',inset:0,clipPath:comic<1?`circle(${comic*1100}px at 333px 698px)`:'none'}}><ComicThreadV3 t={t}/></div>}
   {t>=8.08&&comic<1&&<svg width="540" height="960" style={{position:'absolute',inset:0}}><circle cx="333" cy="698" r={comic*1100} fill="none" stroke="#232124" strokeWidth="5"/></svg>}
   <div style={{position:'absolute',left:m(0,24,shift),top:m(0,678,shift),width:m(540,126,shift),height:m(960,165,shift),borderRadius:shift*18,overflow:'hidden',zIndex:10,boxShadow:shift>.2?'0 0 0 3px #fffdef,1px 5px 0 #242820,0 12px 20px #15191240':'none',transform:`rotate(${-3*shift}deg)`}}>
    {mediaConfig.presenterVideo ? <OffthreadVideo src={staticFile(mediaConfig.presenterVideo)} muted style={{width:'100%',height:'100%',objectFit:'cover',objectPosition:'center top'}}/> : <PresenterPlaceholder/>}
    <div style={{position:'absolute',inset:0,opacity:1-shift,background:'linear-gradient(transparent 58%,#06110b20 69%,#06110bba 100%)'}}/>
   </div>
   {t<2.28&&<div style={{position:'absolute',inset:0,zIndex:11,opacity:1-introGone,pointerEvents:'none'}}>
    <div style={{position:'absolute',left:47,top:606,fontFamily:serif,fontSize:24,fontWeight:700,background:'#fbfbf1',padding:'5px 12px 8px',transform:`translateY(${(1-headline)*22}px) rotate(-2deg)`,opacity:headline*(1-launch)}}>他想去——</div>
    <div style={{position:'absolute',left:36,top:666,width:465,height:143,background:'#fafaf1',border:'1px solid #dadad0',boxShadow:'2px 5px 1px #d0d0c1,2px 17px 28px #1117',opacity:logoIn,transform:`translate(${m(0,-88,launch)}px,${m(35*(1-logoIn),-292,launch)}px) rotate(${m(-4,0,launch)}deg) scale(${m(.98,3.5,launch)})`,transformOrigin:'45% 50%'}}>
     <svg viewBox="200 200 1204 380" width="337" height="108" style={{position:'absolute',left:7,top:17}}>{logo}</svg>
     <div style={{position:'absolute',right:12,bottom:20,fontFamily:serif,fontSize:35,fontWeight:700,color:rust,opacity:e(t,1.72,1.90),transform:'rotate(-8deg)'}}>上班</div>
     <div style={{position:'absolute',right:13,top:9,fontSize:10,color:'#666b60'}}>想去，不是已入职</div>
    </div>
   </div>}
   <svg width="540" height="960" style={{position:'absolute',inset:0,opacity:.021,zIndex:15,pointerEvents:'none'}}><filter id="v3-grain"><feTurbulence baseFrequency=".7" type="fractalNoise" numOctaves="2" seed="22"/></filter><rect width="540" height="960" filter="url(#v3-grain)"/></svg>
   {caption&&<div style={{position:'absolute',left:27,top:867,width:486,zIndex:30,textAlign:'center',fontFamily:dark?sans:serif,fontSize:23,fontWeight:700,lineHeight:1.45,color:dark?'#fffaf0':'#242722',textShadow:dark?'0 2px 5px #000a':'none'}}><span style={{boxDecorationBreak:'clone',padding:t>=8.08?'4px 8px 6px':'0',background:t>=8.08?'#fffef2e8':'transparent',boxShadow:t>=8.08?'0 3px 0 #27242a':'none',borderRadius:4}}>{caption.text}</span></div>}
  </div>
 </AbsoluteFill>;
};
