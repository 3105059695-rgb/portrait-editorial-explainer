import React from 'react';
import {AbsoluteFill,useCurrentFrame} from 'remotion';
import {SyncedOpening} from './SyncedOpening';
import {PaperRelay} from './PaperRelay';
import {SyncedProof} from './SyncedProof';
import {SyncedComic} from './SyncedComic';
import captions from './captions.json';
import './fonts';

const cue=(text:string)=>{const c=captions.find(item=>item.text===text);if(!c)throw new Error(`Missing cue: ${text}`);return c;};
const difference=cue('不等于攻克难题的数量。').start;
const supporting=cue('相关结果、配套论证，').start;
const alternative=cue('还有不同证明，').start;
const grouping=cue('会归在同一组。').start;
const paperTiming=[
 [15.2,14.62],[15.466,15.0],[difference,15.35],[difference+.20,15.55],
 [supporting-.25,15.86],[supporting,16.58],[supporting+.50,16.96],
 [alternative,18.05],[alternative+.46,18.43],
 [grouping,20.14],[grouping+.68,20.70],[21.1,21.23],[22.5,22.5],
];
const paperClock=(t:number)=>{
 for(let i=1;i<paperTiming.length;i++){
  const a=paperTiming[i-1],b=paperTiming[i];
  if(t<=b[0])return a[1]+(b[1]-a[1])*Math.max(0,Math.min(1,(t-a[0])/(b[0]-a[0])));
 }
 return 22.5;
};

/** Silent approved case: original caption timings are retained as visual timing evidence. */
export const SyncedFilm:React.FC=()=>{
 const t=useCurrentFrame()/30;
 const caption=captions.find(c=>t>=c.start&&t<c.end);
 const comic=t>=37.5;
 const dark=t<56/30||(t>=202/30&&t<15.2)||(t>=26.106&&t<29.206)||comic;
 return <AbsoluteFill style={{background:'#c6c4c2'}}>
  <div style={{position:'absolute',width:544,height:720,transform:'scale(1.5)',transformOrigin:'top left',overflow:'hidden',fontFamily:'Noto Sans SC'}}>
   {t<15.2?<SyncedOpening t={t}/>:t<22.5?<PaperRelay t={paperClock(t)} alwaysVisible focusAlternative groupedTitle="多份稿件 · 同一组研究"/>:t<37.5?<SyncedProof t={t}/>:<SyncedComic t={t}/>}
   {caption&&<div style={{position:'absolute',left:18,right:18,bottom:t>=6.733&&t<15.2?65:32,display:'flex',justifyContent:'center',zIndex:30,pointerEvents:'none'}}>
    <span style={{maxWidth:505,fontFamily:comic?'Noto Sans SC':'Noto Serif SC',fontStyle:comic?'normal':'italic',fontWeight:comic?700:dark?400:600,fontSize:caption.text.length>21?18:caption.text.length>17?20:22,lineHeight:1.45,color:dark?'#f5f2e9':'#272920',background:dark&&!comic?'#101211b3':'transparent',padding:'2px 7px 4px',textAlign:'center',textShadow:comic?'0 2px 3px #000,0 -1px 3px #000,2px 0 3px #000,-2px 0 3px #000':dark?'0 1px 4px #000':'0 1px 2px #ffffff9c'}}>{caption.text.replace(/[，。]$/,'')}</span>
   </div>}
  </div>
 </AbsoluteFill>;
};
