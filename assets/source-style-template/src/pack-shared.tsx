import React, {useId} from 'react';
import {OffthreadVideo, Sequence, staticFile, useVideoConfig} from 'remotion';
import {mix, progress, smooth} from './motion';
import type {Item, Scene, EffectProps} from './types';

export const INK='#282620', SANS='"Noto Sans SC", sans-serif', SERIF='"Noto Serif SC", serif';
export const PALETTE=['#b8c8b4','#d1bedf','#e8c997','#adcbd0','#e2ae94','#c0cfa1','#c6bfeb','#e5b8c9'];
export const items=(scene:Scene):Item[] => scene.content.items.length ? scene.content.items : [{id:'subject',label:scene.title}];
export const point=(scene:Scene,name:string,fraction:number)=>scene.marks[name]??(scene.end-scene.start)*fraction;
export const timing=(scene:Scene,t:number)=>progress(t,0,point(scene,'resolve',.85));
export const Text:React.FC<{x:number;y:number;children:React.ReactNode;size?:number;color?:string;weight?:number;anchor?:'start'|'middle'|'end';family?:string}> = ({x,y,children,size=18,color=INK,weight=400,anchor='start',family=SANS})=><text x={x} y={y} fontSize={size} fill={color} fontFamily={family} fontWeight={weight} textAnchor={anchor}>{children}</text>;

/** User media stay real media. The native fallback is only for runnable public examples. */
export const Media:React.FC<{item:Item;x:number;y:number;w:number;h:number;scene:Scene;fit?:'cover'|'contain'}>=({item,x,y,w,h,scene,fit})=>{
  const id=useId().replace(/:/g,''); const {fps}=useVideoConfig();
  const color=item.color??PALETTE[Math.abs([...item.id].reduce((n,c)=>n+c.charCodeAt(0),0))%PALETTE.length];
  const contain=(fit??item.fit)==='contain';
  if(item.video) return <foreignObject x={x} y={y} width={w} height={h}><Sequence from={Math.round(scene.start*fps)} layout="none"><OffthreadVideo src={staticFile(item.video)} trimBefore={Math.round((item.trimStart??0)*fps)} playbackRate={item.playbackRate??1} muted style={{width:w,height:h,objectFit:contain?'contain':'cover'}}/></Sequence></foreignObject>;
  if(item.image) return <image href={staticFile(item.image)} x={x} y={y} width={w} height={h} preserveAspectRatio={contain?'xMidYMid meet':'xMidYMid slice'}/>;
  const s=Math.min(w,h),cx=x+w/2,cy=y+h/2;
  return <g><defs><linearGradient id={id} x2="1" y2="1"><stop stopColor={color}/><stop offset="1" stopColor="#f8f5e8"/></linearGradient></defs>
    <rect x={x} y={y} width={w} height={h} rx={Math.min(8,s*.04)} fill={`url(#${id})`}/>
    <g transform={`translate(${cx} ${cy})`} stroke={INK} strokeWidth={Math.max(1,s*.014)}>
      {item.shape==='person'?<><ellipse cy={s*.25} rx={s*.30} ry={s*.21} fill="#303d38"/><circle cy={-s*.10} r={s*.16} fill="#efd5b9"/><path d={`M${-s*.17} ${-s*.12}q${s*.06} ${-s*.32} ${s*.34} 0`} fill="#363331"/></>
      :item.shape==='cup'?<><path d={`M${-s*.25} ${-s*.25}h${s*.5}l${-s*.05} ${s*.5}h${-s*.4}z`} fill="#fbf2cf"/><path d={`M${s*.23} ${-s*.15}q${s*.3} 0 ${s*.16} ${s*.25}h${-s*.16}`} fill="none"/></>
      :item.shape==='chip'?<><rect x={-s*.22} y={-s*.22} width={s*.44} height={s*.44} rx={s*.03} fill="#465c52"/>{[-.15,-.05,.05,.15].map(k=><path key={k} d={`M${k*s} ${-s*.34}v${s*.12}M${k*s} ${s*.22}v${s*.12}M${-s*.34} ${k*s}h${s*.12}M${s*.22} ${k*s}h${s*.12}`} strokeWidth={s*.027}/>)}</>
      :item.shape==='coin'?<><ellipse cy={s*.035} rx={s*.29} ry={s*.30} fill="#bd8a39"/><circle r={s*.29} fill="#f4d77e"/><circle r={s*.23} fill="none" stroke="#fff1ba" strokeWidth={s*.025}/><text y={s*.11} fontSize={s*.33} fill={INK} stroke="none" textAnchor="middle">¥</text></>
      :item.shape==='diamond'?<path d={`M0 ${-s*.35}L${s*.30} 0L0 ${s*.35}L${-s*.30} 0Z`} fill="#faf7ec"/>
      :item.shape==='square'?<g transform="rotate(-13)"><rect x={-s*.27} y={-s*.23} width={s*.54} height={s*.46} rx={s*.035} fill="#fffdf1"/><path d={`M${-s*.17} ${-s*.05}h${s*.34}M${-s*.17} ${s*.06}h${s*.22}`} /></g>
      :<><ellipse rx={s*.32} ry={s*.19} transform="rotate(-30)" fill="none" strokeWidth={s*.10}/><circle cx={s*.16} cy={-s*.12} r={s*.075} fill="#fffbe9"/></>}
    </g>
  </g>;
};

/** Reflows around the actual aspect ratio and permits independently authored camera paths. */
export const Surface:React.FC<EffectProps&{children:React.ReactNode;dark?:boolean;comic?:boolean}>=({scene,t,width,height,children,dark=false,comic=false})=>{
  const id=useId().replace(/:/g,''); const camera=scene.camera??[];
  let pose={x:width/2,y:height/2,scale:1,rotate:0};
  if(camera.length){let a=camera[0],b=a; for(const k of camera){if(k.at<=t)a=k;if(k.at>=t){b=k;break;}b=k;}
    const p=a===b?0:smooth(t,a.at,b.at);pose={x:mix(a.x,b.x,p),y:mix(a.y,b.y,p),scale:mix(a.scale,b.scale,p),rotate:mix(a.rotate??0,b.rotate??0,p)};}
  const bg=scene.background??(dark?'#171c1a':comic?'#d9caf3':'#f6f5ee');
  return <g><defs><pattern id={`${id}grain`} width="7" height="9" patternUnits="userSpaceOnUse"><circle cx="1" cy="2" r=".45" fill={dark?'#ffffff':'#282620'} opacity=".045"/><circle cx="5" cy="7" r=".32" fill={dark?'#ffffff':'#282620'} opacity=".08"/></pattern></defs>
    <rect width={width} height={height} fill={bg}/>
    {comic&&<g opacity=".2">{Array.from({length:16},(_,i)=><path key={i} d={`M${width/2} ${height*.46}L${width/2-160} ${-height}L${width/2+60} ${-height}Z`} fill={i%2?'#ffffff':'#9876d4'} transform={`rotate(${i*22.5} ${width/2} ${height*.46})`}/>)}</g>}
    <g transform={`translate(${width/2} ${height/2}) scale(${pose.scale}) rotate(${pose.rotate}) translate(${-pose.x} ${-pose.y})`}>{children}</g>
    <rect width={width} height={height} fill={`url(#${id}grain)`} pointerEvents="none"/>
  </g>;
};
