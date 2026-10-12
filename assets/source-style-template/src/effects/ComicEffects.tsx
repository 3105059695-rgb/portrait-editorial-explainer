import React from 'react';
import {Img, staticFile} from 'remotion';
import type {EffectProps, Item} from '../types';
import {arrivals, mix, out, pop, progress, smooth, uid} from '../motion';

// Native, editable reconstruction of the reference's 45.8–50, 114.3–118,
// and 118–120 second mechanisms. No pixels or portraits from the reference.
const INK = '#29253f';
const FONT = 'Noto Sans SC, sans-serif';
const COLORS = ['#ffdb49', '#66c9ee', '#79df89', '#ffae68', '#bc95f5', '#f88bb7'];
const mark = (s: EffectProps['scene'], name: string, fallback: number) => s.marks[name] ?? fallback;
const itemsOrFallback = (items: Item[]): Item[] => items.length ? items : [{id: 'item', label: '内容'}];
const fmt = (n: number) => Math.round(n).toLocaleString('en-US');

const Text: React.FC<{x: number; y: number; children: React.ReactNode; size?: number; fill?: string; weight?: number; anchor?: 'start' | 'middle' | 'end'}> = ({x, y, children, size=20, fill=INK, weight=750, anchor='middle'}) => <text x={x} y={y} fill={fill} fontFamily={FONT} fontWeight={weight} fontSize={size} textAnchor={anchor}>{children}</text>;
const fittedSize = (text: string, base: number, space: number) => Math.min(base, space / Math.max(1, [...text].reduce((a,c)=>a+(/[\u2e80-\uffff]/.test(c)?1:0.57),0)));

const Spark: React.FC<{x:number;y:number;r?:number;color?:string;turn?:number}> = ({x,y,r=8,color='#ffdb49',turn=0}) => <g transform={`translate(${x} ${y}) rotate(${turn})`}><path d={`M0 ${-r}Q${r*.2} ${-r*.2} ${r} 0Q${r*.2} ${r*.2} 0 ${r}Q${-r*.2} ${r*.2} ${-r} 0Q${-r*.2} ${-r*.2} 0 ${-r}Z`} fill={color} stroke={INK} strokeWidth={1.5}/></g>;

const ComicGround: React.FC<{sceneId:string;height:number;fill:string;centerY:number;t:number;rays?:boolean}> = ({sceneId,height,fill,centerY,t,rays=false}) => {
  const dotId=uid(sceneId,'comic-dots');
  return <g>
    <rect width={544} height={height} fill={fill}/>
    {rays && <g transform={`translate(272 ${centerY})`} opacity={.29}>{Array.from({length:22},(_,i)=>{const a=i*Math.PI/11,b=a+.125;return <path key={i} d={`M0 0L${Math.sin(a)*1600} ${Math.cos(a)*1600}L${Math.sin(b)*1600} ${Math.cos(b)*1600}Z`} fill='#fff9e6'/>;})}</g>}
    <defs><pattern id={dotId} width={27.2} height={27.2} patternUnits='userSpaceOnUse'><circle cx={13.6} cy={13.6} r={1.1} fill={INK} opacity={.09}/></pattern></defs>
    <rect width={544} height={height} fill={`url(#${dotId})`}/>
    {[[52,.14,8],[475,.19,7],[80,.43,7],[456,.45,12],[37,.69,6],[500,.75,6],[173,.84,5]].map(([x,y,r],i)=><Spark key={i} x={x} y={height*y} r={r} color={COLORS[(i+2)%6]} turn={Math.sin(t*.8+i)*9}/>)}
    {[[127,.11],[420,.34],[107,.63],[398,.83]].map(([x,y],i)=><g key={i} transform={`translate(${x} ${height*y}) rotate(${i*13})`} stroke={INK} strokeWidth={1.6}><path d='M-3 -3L3 3M3 -3L-3 3'/></g>)}
    {[[89,.25],[465,.58],[354,.9]].map(([x,y],i)=><circle key={i} cx={x} cy={height*y} r={2.6} fill='none' stroke={INK} strokeWidth={1.5}/>)}
  </g>;
};

const Plaque: React.FC<{x:number;y:number;label:string;fill?:string;angle?:number;maxWidth?:number}> = ({x,y,label,fill='#fffdf8',angle=-5,maxWidth=340}) => {
  const size=fittedSize(label,21,maxWidth-28),w=Math.min(maxWidth,Math.max(95,[...label].length*size+30));
  return <g transform={`translate(${x} ${y}) rotate(${angle})`}><rect x={-w/2+3} y={-23+4} width={w} height={44} rx={12} fill={INK} opacity={.12}/><rect x={-w/2} y={-23} width={w} height={44} rx={11} fill={fill} stroke={INK} strokeWidth={3}/><Text x={0} y={7} size={size}>{label}</Text><path d={`M${-w/2+13} -17h17`} stroke='white' strokeWidth={2.4} opacity={.8}/></g>;
};

const MiniSymbol: React.FC<{index:number;size?:number;fill?:string}> = ({index,size=1,fill=INK}) => <g transform={`scale(${size})`} fill={fill} stroke={fill} strokeWidth={2.3} strokeLinecap='round' strokeLinejoin='round'>
  {index%5===0 ? <path d='M-10 -15L15 0L-10 15Z' stroke='none'/> : index%5===1 ? <g fill='none'><path d='M-12 -8L-20 0L-12 8M12 -8L20 0L12 8M5 -14L-5 14'/></g> : index%5===2 ? <path d='M0 -17L17 14H-17Z' stroke='none'/> : index%5===3 ? <path d='M0 14C-30 -3 -13 -23 0 -10C13 -23 30 -3 0 14Z' stroke='none'/> : <path d='M0 -18L5 -6L18 -5L8 4L11 18L0 10L-12 18L-8 4L-18 -5L-5 -6Z' stroke='none'/>}
</g>;

const ImageContent: React.FC<{path:string;x:number;y:number;width:number;height:number}> = ({path,x,y,width,height}) => <foreignObject x={x} y={y} width={width} height={height}><Img src={staticFile(path)} style={{width,height,objectFit:'cover',display:'block'}}/></foreignObject>;

/** Orange/gold tickets are swallowed by a real foreground occluder. Counter
 * and fill share exactly the same landed-ticket state, including the last one. */
export const TokenIntake: React.FC<EffectProps> = ({scene,t,height}) => {
  const span=scene.end-scene.start,extra=height-720;
  const collect=mark(scene,'collect',Math.min(.8,span*.23)),resolve=mark(scene,'resolve',Math.max(collect+.5,span-.25));
  const count=scene.content.metric?.events??84,states=arrivals(t,collect,resolve,count).map((_,i)=>{
    const arrival=mix(collect,resolve,Math.pow(i/(count-1),1/2.2));
    return {arrival,p:progress(t,arrival-.62,arrival),landed:t>=arrival};
  }),landed=states.filter(s=>s.landed).length;
  const fraction=landed/count,metric=scene.content.metric??{value:100,unit:'%',label:'累计处理'};
  const value=Math.round(metric.value*fraction),boxY=358+extra*.40,metricY=570+extra*.63;
  const boxLabel=scene.content.result||'处理中',items=itemsOrFallback(scene.content.items);
  const shadow=uid(scene.id,'intake-shadow'),clip=uid(scene.id,'intake-sky'),accent=scene.accent||'#b66d4d';
  const entry=out(t,0,.25),counterColor=fraction>.42?'#bd3943':'#211f1c';
  return <g>
    <rect width={544} height={height} fill={scene.background||'#f6f6f1'}/>
    <defs>
      <filter id={shadow} x='-30%' y='-30%' width='160%' height='170%'><feDropShadow dx='0' dy='7' stdDeviation='7' floodColor='#484039' floodOpacity='.2'/></filter>
      <clipPath id={clip}><rect x={20} y={123} width={504} height={boxY-121}/></clipPath>
    </defs>
    <g opacity={entry} transform={`translate(0 ${mix(9,0,entry)})`}>
      <rect x={239} y={32} width={66} height={25} rx={12.5} fill={accent}/>
      <Text x={272} y={49} size={12} fill='#fffaf5'>实时变化</Text>
      <Text x={272} y={103} size={fittedSize(scene.title,34,486)} fill='#23221e' weight={800}>{scene.title}</Text>
    </g>
    <g clipPath={`url(#${clip})`}>
      {states.map((state,i)=>{
        if(t<state.arrival-.62||state.landed)return null;
        const p=state.p,it=items[i%items.length],sx=56+((i*137)%432),bend=((i%7)-3)*13;
        const x=mix(sx,272+((i%5)-2)*5,Math.pow(p,1.26))+Math.sin(p*Math.PI)*bend;
        const y=mix(135,boxY+10,.32*p+.68*p*p),rotation=mix((i*43)%90-45,((i%5)-2)*7,p);
        const scale=mix(.75+(i%3)*.1,.74,p);
        return <g key={i} transform={`translate(${x} ${y}) rotate(${rotation}) scale(${scale})`} opacity={smooth(p,0,.12)}>
          <rect x={-17} y={-10} width={34} height={20} rx={4} fill={it.color||(i%4===0?accent:'#c6a461')}/>
          <path d='M-11 -6H-5' stroke='#fff8db' strokeWidth={1.4} opacity={.7}/>
          <Text x={0} y={4} size={fittedSize(it.label,9,27)} fill='#fffaf0' weight={800}>{it.label}</Text>
        </g>;
      })}
    </g>
    <g opacity={entry} filter={`url(#${shadow})`}>
      <rect x={165} y={boxY} width={223} height={147} rx={24} fill='#211e19'/>
      <path d={`M183 ${boxY+2}H370`} stroke='#3e392f' strokeWidth={2} opacity={.6}/>
      <ellipse cx={277} cy={boxY+1} rx={37} ry={4} fill='#12110f'/>
      <g transform={`translate(217 ${boxY+72}) rotate(${t<resolve?t*178:resolve*178})`}>
        <circle r={30} fill='none' stroke='#534538' strokeWidth={5}/>
        <circle r={30} fill='none' stroke={accent} strokeWidth={5} strokeDasharray='129 60' strokeLinecap='round'/>
        <circle r={20} fill='none' stroke='#d6b775' strokeWidth={3} strokeDasharray='80 45' strokeLinecap='round'/>
      </g>
      <Text x={310} y={boxY+75} size={fittedSize(boxLabel,29,112)} fill='#fcfaf1'>{boxLabel}</Text>
      <Text x={311} y={boxY+99} size={fittedSize(scene.content.body||'持续处理',11,112)} fill='#9c9384' weight={450}>{scene.content.body||'持续处理'}</Text>
    </g>
    <g opacity={entry}>
      <text x={272} y={metricY} textAnchor='middle' fontFamily='monospace' fontSize={fittedSize(fmt(value),47,465)} fontWeight={800} fill={counterColor}>{fmt(value)}</text>
      <Text x={272} y={metricY+27} size={16} fill='#827d73' weight={500}>{metric.label}{metric.unit&&metric.unit!=='%'?` · ${metric.unit}`:metric.unit==='%'?' · %':''}</Text>
      <rect x={77} y={metricY+54} width={390} height={14} rx={7} fill='#e1ddd3'/>
      <rect x={77} y={metricY+54} width={Math.max(0,390*fraction)} height={14} rx={7} fill={fraction>.42?'#bd3943':'#c6a461'}/>
    </g>
  </g>;
};

/** Original neutral avatar: an illustrated little creative robot at its desk.
 * Supply content.avatar for an actual permitted portrait or brand character. */
const DeskAvatar: React.FC = () => <g>
  <rect x={-120} y={-120} width={240} height={240} fill='#aa8bea'/>
  <path d='M-115 64Q-20 42 119 68V120H-120Z' fill='#8060bb'/>
  <path d='M33 -60V-79' stroke={INK} strokeWidth={5}/><circle cx={33} cy={-85} r={9} fill='#f58faf' stroke={INK} strokeWidth={3}/>
  <rect x={-11} y={-56} width={110} height={89} rx={27} fill='#e0be85' stroke={INK} strokeWidth={4}/>
  <rect x={-1} y={-43} width={90} height={61} rx={18} fill='#352d4d'/>
  <ellipse cx={21} cy={-17} rx={7} ry={10} fill='#8becb2'/><ellipse cx={65} cy={-17} rx={7} ry={10} fill='#8becb2'/>
  <path d='M31 1Q44 12 57 1' fill='none' stroke='#8becb2' strokeWidth={4} strokeLinecap='round'/>
  <path d='M7 32Q44 19 77 33L84 81H-3Z' fill='#fff6e6' stroke={INK} strokeWidth={3}/>
  <path d='M14 40Q-6 43 -9 68M73 40Q93 44 95 63' fill='none' stroke='#dfbc83' strokeWidth={12} strokeLinecap='round'/>
  <path d='M-114 76H118L103 90H-98Z' fill='#211c35' stroke={INK} strokeWidth={3}/>
  <rect x={-105} y={-43} width={70} height={91} rx={9} fill='#322844' stroke={INK} strokeWidth={3}/>
  <path d='M-96 -32V26' stroke='#ede6f9' strokeWidth={3} strokeLinecap='round'/>
  <path d='M-68 49V75H-98' fill='none' stroke={INK} strokeWidth={7}/>
  <rect x={24} y={70} width={47} height={9} rx={3} fill='#dbb5f3' stroke={INK} strokeWidth={2}/>
  <path d='M-4 -43Q0 -48 6 -49' fill='none' stroke='white' strokeWidth={3} strokeLinecap='round'/>
</g>;

export const CreatorStrip: React.FC<EffectProps> = ({scene,t,height}) => {
  const extra=height-720,span=scene.end-scene.start;
  const badge=mark(scene,'badge',.38),strip=mark(scene,'strip',Math.min(1.2,span*.45)),resolve=mark(scene,'resolve',Math.max(strip+.5,span-.2));
  const cy=285+extra*.36,stripY=487+extra*.61;
  const badgeP=pop(t,badge-.38,badge),crownP=pop(t,badge-.11,badge+.17),stripP=out(t,strip-.65,strip);
  const avatarClip=uid(scene.id,'avatar'),items=itemsOrFallback(scene.content.items);
  const ribbon=scene.content.result||'每一份创作',ribbonSize=fittedSize(ribbon,32,280);
  const tileCount=Math.max(items.length,Math.ceil(7/items.length)*items.length);
  const period=tileCount*116,travel=Math.max(0,t-strip+.65)*46;
  return <g>
    <ComicGround sceneId={scene.id} height={height} fill={scene.background||'#ccb9ff'} centerY={cy+35} t={t} rays/>
    <g opacity={out(t,0,.22)}><Plaque x={272} y={76} label={scene.title} maxWidth={422} angle={-4}/></g>
    <g transform={`translate(272 ${cy}) scale(${badgeP})`}>
      <circle cx={-5} cy={10} r={123} fill={scene.accent||'#ffdb49'}/>
      <circle r={121} fill='#aa8bea'/>
      <defs><clipPath id={avatarClip}><circle r={114}/></clipPath></defs>
      <g clipPath={`url(#${avatarClip})`}>{scene.content.avatar?<ImageContent path={scene.content.avatar} x={-114} y={-114} width={228} height={228}/>:<DeskAvatar/>}</g>
      <path d='M-52 -111A121 121 0 1 1-122 25' fill='none' stroke={INK} strokeWidth={4.5}/>
      <path d='M-81 -93L-71 -101' stroke={INK} strokeWidth={5} strokeLinecap='round'/>
      <path d='M-109 -24Q-111 -48 -98 -64' fill='none' stroke='white' strokeWidth={3.5} strokeLinecap='round'/>
    </g>
    <g transform={`translate(370 ${cy-124}) rotate(15) scale(${crownP})`}>
      <path d='M-50 -18L-24 4L-6 -29L20 2L46 -15L37 24L-45 23Z' fill={scene.accent||'#ffdc4a'} stroke={INK} strokeWidth={3.5}/>
      <circle cx={-6} cy={-29} r={5.5} fill='#fa83b1' stroke={INK} strokeWidth={2}/>
      <path d='M-39 15H23M42 -10l3 -7' fill='none' stroke='#fff6c7' strokeWidth={2.5}/>
    </g>
    <g transform={`translate(272 ${cy+122}) scale(${pop(t,badge-.25,badge+.07)})`}>
      <path d='M-153 -19L-190 1L-176 12L-191 26L-145 37M153 -19L190 1L176 12L191 27L145 37' fill='#c9548b' stroke={INK} strokeWidth={3}/>
      <path d='M-157 -25Q0 -33 157 -22L157 34Q0 12 -157 33Z' fill='#fa7eb4' stroke={INK} strokeWidth={3.5}/>
      <text y={12} textAnchor='middle' fontSize={ribbonSize} fontWeight={900} fontFamily={FONT} fill='white' stroke={INK} strokeWidth={4} paintOrder='stroke'>{ribbon}</text>
      <path d='M84 23h9m11 1h16M-148 -19Q-112 -22 -99 -22' fill='none' stroke={INK} strokeWidth={2.5}/>
    </g>
    {scene.content.body&&<g opacity={out(t,badge, badge+.3)} transform={`translate(${mix(-12,0,out(t,badge,badge+.3))} 0)`}><Plaque x={149} y={cy-145} label={scene.content.body} maxWidth={180} angle={-7}/></g>}
    <g opacity={badgeP}><Spark x={116} y={cy-53} r={17} color='#ff86bb' turn={Math.sin(t)*5}/><Spark x={431} y={cy-51} r={18} color='#69d6ef' turn={Math.sin(t+1)*6}/></g>
    <g transform={`translate(-65 ${mix(height+65,stripY,stripP)}) rotate(-4)`}>
      <rect x={-150} width={950} height={119} fill={INK}/>
      {Array.from({length:49},(_,i)=>{const x=i*22-150-(travel%22);return <g key={i}><rect x={x} y={6} width={11} height={8} rx={2} fill='#fffdf4'/><rect x={x} y={104} width={11} height={8} rx={2} fill='#fffdf4'/></g>;})}
      {Array.from({length:tileCount},(_,i)=>{
        const it=items[i%items.length],x=((i*116-travel+period*100)%period)-116,clip=uid(scene.id,`strip-${i}`);
        return <g key={i} transform={`translate(${x} 22)`}>
          <defs><clipPath id={clip}><rect width={102} height={75} rx={7}/></clipPath></defs>
          <g clipPath={`url(#${clip})`}>
            <rect width={102} height={75} rx={7} fill={it.color||COLORS[i%COLORS.length]}/>
            {it.image?<ImageContent path={it.image} x={0} y={0} width={102} height={75}/>:<g transform='translate(51 27)'><MiniSymbol index={i} size={.7}/></g>}
            <rect x={0} y={52} width={102} height={23} fill={it.image?'#fffdf3':'#ffffff'} opacity={it.image ? .91 : .2}/>
            <Text x={51} y={68} size={fittedSize(it.label,12,91)} weight={750}>{it.label}</Text>
          </g>
        </g>;
      })}
    </g>
    <g opacity={out(t,resolve-.4,resolve)} transform={`translate(0 ${mix(13,0,out(t,resolve-.4,resolve))})`}><Plaque x={429} y={stripY+109} label={scene.content.metric?.label||'持续更新'} fill={scene.accent||'#ffda45'} maxWidth={159} angle={7}/></g>
  </g>;
};

/** Every card has one landing timestamp. Progress derives from those timestamps,
 * so a completed number can never precede its final visible upload. */
export const UploadProgress: React.FC<EffectProps> = ({scene,t,height}) => {
  const span=scene.end-scene.start,extra=height-720;
  const launch=mark(scene,'launch',Math.min(.42,span*.22)),resolve=mark(scene,'resolve',Math.max(launch+.6,span-.18));
  const items=itemsOrFallback(scene.content.items),count=Math.max(6,items.length);
  const flight=Math.min(.62,Math.max(.12,resolve-launch));
  const firstArrival=launch+flight,arrivalStart=firstArrival-(resolve-firstArrival)/(count-1);
  const states=arrivals(t,arrivalStart,resolve,count).map(state=>({...state,p:progress(t,state.arrival-flight,state.arrival)}));
  const landed=states.filter(s=>s.landed).length,fraction=landed/count,cloudShift=37+extra*.21,progressY=584+extra*.63;
  const cloudLabel=scene.content.result||'内容云',clip=uid(scene.id,'upload-bar'),skyClip=uid(scene.id,'upload-air');
  const grow=pop(t,0,.35),lastLanding=states.filter(s=>s.landed).at(-1)?.arrival??-100;
  const impact=Math.max(0,1-(t-lastLanding)/.18),cloudScale=1+impact*.016;
  return <g>
    <ComicGround sceneId={scene.id} height={height} fill={scene.background||'#b2eaf7'} centerY={height*.45} t={t}/>
    <g opacity={out(t,0,.18)}><Plaque x={272} y={76} label={scene.title} maxWidth={425} angle={-3}/></g>
    <defs><clipPath id={clip}><rect x={79} y={progressY+6} width={386*fraction} height={19} rx={10}/></clipPath><clipPath id={skyClip}><rect x={0} y={230+cloudShift} width={544} height={height}/></clipPath></defs>
    <g clipPath={`url(#${skyClip})`}>
      {states.map((state,i)=>{
        // Tiles are already on stage; launch is a cue, not a random fade-in.
        if(state.landed)return null;
        const q=state.p,it=items[i%items.length];
        const sx=59+((i*79)%420),sy=progressY-49+(i%3)*10;
        const x=mix(sx,273,q)+Math.sin(q*Math.PI)*(i%2?42:-42),y=mix(sy,211+cloudShift,q);
        const rotation=mix((i%5-2)*10,((i%3)-1)*42,q),scale=mix(1,.52,q);
        const itemClip=uid(scene.id,`upload-tile-${i}`);
        return <g key={i} transform={`translate(${x} ${y}) rotate(${rotation}) scale(${scale*grow})`}>
          {q>0&&q<.87&&<path d='M0 35v19M-8 39v9' stroke={INK} strokeWidth={2} opacity={.22} strokeLinecap='round'/>}
          <rect x={-27+3} y={-31+4} width={54} height={62} rx={4} fill={INK} opacity={.13}/>
          <rect x={-27} y={-31} width={54} height={62} rx={4} fill={it.color||COLORS[(i+5)%6]} stroke={INK} strokeWidth={2.6}/>
          <defs><clipPath id={itemClip}><rect x={-24} y={-28} width={48} height={44} rx={2}/></clipPath></defs>
          {it.image?<g clipPath={`url(#${itemClip})`}><ImageContent path={it.image} x={-24} y={-28} width={48} height={44}/></g>:<g transform='translate(0 -6)'><MiniSymbol index={i} size={.59}/></g>}
          <Text x={0} y={23} size={fittedSize(it.label,8.5,47)}>{it.label}</Text>
          <path d='M-21 -23v11' stroke='white' strokeWidth={2} opacity={.64} strokeLinecap='round'/>
        </g>;
      })}
    </g>
    <g transform={`translate(272 ${179+cloudShift}) scale(${grow*cloudScale}) translate(-272 -179)`}>
      <path d='M127 228Q79 225 99 183Q108 162 138 167Q130 120 179 113Q207 73 249 109Q297 80 329 115Q378 103 390 142Q448 135 457 183Q475 228 425 230Z' fill='#fffefa' stroke={INK} strokeWidth={4} strokeLinejoin='round'/>
      <path d='M106 193Q101 216 127 219H413' fill='none' stroke='#eee9f2' strokeWidth={5} strokeLinecap='round'/>
      <rect x={160} y={153} width={51} height={50} rx={12} fill={scene.accent||'#af84ef'} stroke={INK} strokeWidth={2}/>
      <path d='M169 171Q168 161 178 159' fill='none' stroke='white' strokeWidth={2.5} strokeLinecap='round'/>
      <ellipse cx={178} cy={176} rx={2.6} ry={4} fill={INK}/><ellipse cx={195} cy={176} rx={2.6} ry={4} fill={INK}/><path d='M177 186Q186 197 197 185' fill='none' stroke={INK} strokeWidth={2.4} strokeLinecap='round'/>
      <Text x={323} y={186} size={fittedSize(cloudLabel,28,207)}>{cloudLabel}</Text>
    </g>
    <g transform={`translate(274 ${mix(355,371,grow)+extra*.38+Math.sin(t*5)*4}) scale(${grow})`}>
      <path d='M-24 41V-15H-57L0 -73L56 -15H24V41Z' fill={scene.accent||'#ffdb49'} stroke={INK} strokeWidth={3.4} strokeLinejoin='round'/>
      <path d='M-4 -49Q-15 -43 -17 -32M-16 -25v6' fill='none' stroke='#fffbe0' strokeWidth={3} strokeLinecap='round'/>
      <path d='M-22 39h19m9 0h6' stroke={INK} strokeWidth={3}/>
    </g>
    <g opacity={grow}>
      <Text x={272} y={progressY-16} size={19} weight={700}>{fraction===1?'已完成':'上传中'} {Math.round(fraction*100)}%</Text>
      <rect x={73+3} y={progressY+4} width={398} height={31} rx={16} fill={INK} opacity={.13}/>
      <rect x={73} y={progressY} width={398} height={31} rx={16} fill='#fffefa' stroke={INK} strokeWidth={3}/>
      <g clipPath={`url(#${clip})`}><rect x={79} y={progressY+6} width={386} height={19} fill='#82dc85'/>{Array.from({length:28},(_,i)=><path key={i} d={`M${70+i*18+(t*15)%18} ${progressY+4}l-12 26`} stroke='#d7ffd1' strokeWidth={5} opacity={.55}/>)}</g>
      <circle cx={87} cy={progressY+13} r={4} fill='white' opacity={.5}/>
    </g>
    {fraction===1&&<g transform={`translate(465 ${progressY-29}) rotate(8) scale(${pop(t,resolve,resolve+.22)})`}><circle r={24} fill='#80df88' stroke={INK} strokeWidth={3}/><path d='M-12 0l9 10L15 -13' fill='none' stroke={INK} strokeWidth={4} strokeLinecap='round' strokeLinejoin='round'/><path d='M-15 -11l2 -3' stroke='white' strokeWidth={3} strokeLinecap='round'/></g>}
  </g>;
};
