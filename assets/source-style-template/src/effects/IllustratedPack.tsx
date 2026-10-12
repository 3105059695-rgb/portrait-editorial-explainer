import React from 'react';
import {Img, OffthreadVideo, Sequence, staticFile, useVideoConfig} from 'remotion';
import type {EffectProps, Item, Scene} from '../types';
import {clamp, mix, out, pop, progress, smooth, uid} from '../motion';
import {SANS, Media, Surface, Text as SharedText, items, point} from '../pack-shared';

/** The reference's final illustrated worlds, separated from its script and clock.
 * All coordinates are isotropic. Only vertical anchors reflow with the viewport.
 * Original procedural artwork is used whenever the caller supplies no media. */
const COLORS = ['#ffda48', '#69cef0', '#78da8c', '#f391be', '#a88ae7', '#ffa96c'];
const INK = '#29253f';
const Text: React.FC<React.ComponentProps<typeof SharedText>> = props => <SharedText anchor='middle' weight={800} color={INK} {...props}/>;
const fit = (text: string, max: number, width: number) => Math.min(max, width / Math.max(1, [...text].reduce((n,c)=>n+(/[\u2e80-\uffff]/.test(c)?1:.6),0)));
const hasMedia = (it: Item) => Boolean(it.image || it.video);
const stages = (scene: Scene) => ({r: point(scene, 'reveal', .22), a: point(scene, 'act', .52), z: point(scene, 'resolve', .90)});
const speed = (scene: Scene) => scene.content.pack?.speed ?? 1;

const Spark: React.FC<{x:number;y:number;r?:number;color?:string;turn?:number}> = ({x,y,r=10,color='#ffda48',turn=0}) => <g transform={`translate(${x} ${y}) rotate(${turn})`}><path d={`M0 ${-r}Q${r*.2} ${-r*.2} ${r} 0Q${r*.2} ${r*.2} 0 ${r}Q${-r*.2} ${r*.2} ${-r} 0Q${-r*.2} ${-r*.2} 0 ${-r}Z`} fill={color} stroke={INK} strokeWidth={1.6}/></g>;

const World: React.FC<EffectProps & {fill:string;rays?:boolean;dark?:boolean;children:React.ReactNode}> = ({scene,t,width,height,fill,rays=false,dark=false,children}) => {
  const dot=uid(scene.id,'illustrated-dots'),density=Math.max(8,Math.min(32,scene.content.pack?.density??22));
  const cx=scene.content.pack?.focusX??width*.5,cy=scene.content.pack?.focusY??height*.44;
  return <Surface scene={{...scene,background:scene.background||fill}} t={t} width={width} height={height} dark={dark}>
    <rect width={width} height={height} fill={scene.background||fill}/>
    {rays&&<g transform={`translate(${cx} ${cy}) rotate(${Math.sin(t*.3)*.8})`} opacity={dark?.11:.26}>{Array.from({length:density},(_,i)=>{const a=i*Math.PI*2/density,b=a+Math.PI/density*.75;return <path key={i} d={`M0 0L${Math.cos(a)*1600} ${Math.sin(a)*1600}L${Math.cos(b)*1600} ${Math.sin(b)*1600}Z`} fill={dark?'#f7e9bf':'#fff8df'}/>;})}</g>}
    <defs><pattern id={dot} width={27.2} height={27.2} patternUnits='userSpaceOnUse'><circle cx={13.6} cy={13.6} r={1.15} fill={dark?'#fff4d6':INK} opacity={dark?.09:.075}/></pattern></defs>
    <rect width={width} height={height} fill={`url(#${dot})`}/>
    {[[.095,.14,8],[.87,.22,11],[.065,.46,6],[.935,.60,9],[.20,.77,7],[.73,.86,6]].map(([x,y,r],i)=><Spark key={i} x={x*width} y={y*height} r={r} color={dark?'#ffda48':COLORS[(i+1)%6]} turn={Math.sin(t+i)*8}/>)}
    {[[.20,.20],[.84,.41],[.14,.68],[.79,.76]].map(([x,y],i)=><path key={i} d={`M${x*width-4} ${y*height-4}l8 8m0 -8l-8 8`} stroke={dark?'#fff4d6':INK} strokeWidth={1.5}/>)}
    {children}
  </Surface>;
};

const Label: React.FC<{x:number;y:number;text:string;fill?:string;color?:string;angle?:number;maxWidth?:number;size?:number}> = ({x,y,text,fill='#fffdf3',color=INK,angle=-4,maxWidth=450,size=24}) => {
  const fs=fit(text,size,maxWidth-34),w=Math.min(maxWidth,Math.max(84,[...text].reduce((n,c)=>n+(/[\u2e80-\uffff]/.test(c)?1:.6),0)*fs+34));
  return <g transform={`translate(${x} ${y}) rotate(${angle})`}><rect x={-w/2+4} y={-26+5} width={w} height={52} rx={12} fill={INK} opacity={.17}/><rect x={-w/2} y={-26} width={w} height={52} rx={12} fill={fill} stroke={INK} strokeWidth={3.2}/><Text x={0} y={8} size={fs} color={color} weight={850}>{text}</Text><path d={`M${-w/2+12} -20h19`} stroke='white' strokeWidth={2.2}/></g>;
};
const Heading: React.FC<EffectProps & {dark?:boolean}> = ({scene,t,width,height,dark=false}) => <g opacity={out(t,0,Math.min(.25,stages(scene).r))}>
  {scene.content.pack?.showTitle!==false&&<Label x={width/2} y={height*.12} text={scene.title} fill={dark?'#ffda48':'#fffdf3'} maxWidth={width-70}/>}
  {scene.content.kicker&&<Text x={width/2} y={height*.12-44} size={12} color={dark?'#fff2d4':INK}>{scene.content.kicker}</Text>}
</g>;
const Footer: React.FC<EffectProps & {dark?:boolean}> = ({scene,t,width,height,dark=false}) => <g opacity={smooth(t,stages(scene).a,stages(scene).z)}>{scene.content.result&&<Label x={width/2} y={height*.80} text={scene.content.result} fill={scene.accent||'#ffda48'} maxWidth={width-70} angle={3} size={23}/>} {scene.content.body&&<Text x={width/2} y={height*.88} size={fit(scene.content.body,17,width-76)} color={dark?'#fff2d4':INK} weight={550}>{scene.content.body}</Text>}</g>;

const Person: React.FC<{x?:number;y?:number;scale?:number;color?:string;hair?:string;wave?:number;worried?:boolean}> = ({x=0,y=0,scale=1,color='#f391be',hair='#493258',wave=0,worried=false}) => <g transform={`translate(${x} ${y}) scale(${scale})`}>
  {wave!==0&&<path d={`M-19 22Q-42 -9 ${-37+wave*5} -48`} stroke={INK} strokeWidth={4} fill='none' strokeLinecap='round'/>}
  <path d='M-30 40Q-29 10 0 10Q29 10 30 40Z' fill={color} stroke={INK} strokeWidth={2.8}/>
  <path d='M-22 -5Q-26 -33 0 -33Q26 -33 23 -5Z' fill={hair} stroke={INK} strokeWidth={2.7}/>
  <path d='M-22 -9Q0 -23 22 -9V1Q19 22 0 21Q-21 19 -22 -9Z' fill='#ffe4c1' stroke={INK} strokeWidth={2.6}/>
  <ellipse cx={-8} cy={0} rx={2.4} ry={2.8} fill={INK}/><ellipse cx={8} cy={0} rx={2.4} ry={2.8} fill={INK}/>
  <circle cx={-15} cy={9} r={3.5} fill='#f69bae'/><circle cx={15} cy={9} r={3.5} fill='#f69bae'/>
  {worried?<ellipse cy={11} rx={4} ry={5} fill={INK}/>:<path d='M-6 9Q0 16 7 9' fill='none' stroke={INK} strokeWidth={2}/>}
</g>;

const Coin: React.FC<{x?:number;y?:number;r?:number;turn?:number;flip?:number;label?:string;color?:string}> = ({x=0,y=0,r=25,turn=0,flip=1,label='',color='#ffda48'}) => <g transform={`translate(${x} ${y}) rotate(${turn}) scale(${Math.max(.15,Math.abs(flip))} 1)`}>
  <ellipse cx={r*.15} rx={r*.74} ry={r} fill='#c89725' stroke={INK} strokeWidth={Math.max(1.6,r*.055)}/><ellipse rx={r*.74} ry={r} fill={color} stroke={INK} strokeWidth={Math.max(1.6,r*.055)}/>
  <ellipse rx={r*.56} ry={r*.79} fill='none' stroke={INK} strokeWidth={r*.032} strokeDasharray={`${r*.14} ${r*.095}`}/>
  {label?<Text x={0} y={r*.16} size={fit(label,r*.43,r)} weight={850}>{label}</Text>:<><ellipse cx={-r*.2} cy={-r*.11} rx={r*.06} ry={r*.085} fill={INK}/><ellipse cx={r*.2} cy={-r*.11} rx={r*.06} ry={r*.085} fill={INK}/><path d={`M${-r*.24} ${r*.19}Q0 ${r*.45} ${r*.27} ${r*.18}`} fill='none' stroke={INK} strokeWidth={r*.05}/></>}
  <path d={`M${-r*.46} ${-r*.38}L${-r*.25} ${-r*.60}`} stroke='#fff8d8' strokeWidth={r*.07} strokeLinecap='round'/>
</g>;
const Chip: React.FC<{scale?:number;fill?:string;label?:string}> = ({scale=1,fill='#9c8ee9',label=''}) => <g transform={`scale(${scale})`}>
  {[-48,-24,0,24,48].map(v=><g key={v} stroke={INK} strokeWidth={5}><path d={`M${v} -64V-80M${v} 64V80M-64 ${v}H-80M64 ${v}H80`}/></g>)}
  <rect x={-65} y={-65} width={130} height={130} rx={14} fill='#ffdc61' stroke={INK} strokeWidth={4}/><rect x={-48} y={-48} width={96} height={96} rx={8} fill={fill} stroke={INK} strokeWidth={3}/>
  <path d='M-36 -22V-35H-19M-24 35H34V16' fill='none' stroke='#fff0d3' strokeWidth={3}/>
  <Text x={0} y={9} size={fit(label,24,80)} weight={850}>{label}</Text>
</g>;
const Cup: React.FC<{label?:string;color?:string}> = ({label='',color='#69cef0'}) => <g>
  <path d='M-71 -68H71L55 90H-54Z' fill='#fffdf3' stroke={INK} strokeWidth={4}/><path d='M-65 -26H65L61 21H-61Z' fill={color}/><rect x={-80} y={-80} width={160} height={19} rx={7} fill='#bcb8ce' stroke={INK} strokeWidth={3.5}/>
  <path d='M-50 -45L-30 -20L-48 4M30 -47L9 -17L35 24' fill='none' stroke={INK} strokeWidth={1.5}/><g transform='translate(0 0)'><Chip scale={.33} label=''/></g><Text x={0} y={67} size={fit(label,21,90)}>{label}</Text>
</g>;
const NativeOrMedia: React.FC<{item:Item;scene:Scene;x:number;y:number;w:number;h:number;children:React.ReactNode}> = ({item,scene,x,y,w,h,children}) => hasMedia(item)?<Media item={item} scene={scene} x={x} y={y} w={w} h={h} fit={item.fit||'contain'}/>:<>{children}</>;
const Ban: React.FC<{r:number;p:number}> = ({r,p}) => <g transform={`scale(${p})`}><circle r={r} fill='none' stroke={INK} strokeWidth={29}/><circle r={r} fill='none' stroke='#ff6872' strokeWidth={23}/><path d={`M${-r*.73} ${-r*.73}L${r*.73} ${r*.73}`} stroke={INK} strokeWidth={29}/><path d={`M${-r*.73} ${-r*.73}L${r*.73} ${r*.73}`} stroke='#ff6872' strokeWidth={23}/></g>;

const CreatorFilmstrip: React.FC<EffectProps> = props => {
  const {scene,t,width,height}=props,{r,a,z}=stages(scene),list=items(scene),cy=height*.39;
  const scale=pop(t,0,r),move=out(t,r*.6,a),travel=Math.max(0,t-r)*54*speed(scene),n=Math.max(7,list.length),period=n*126;
  const portrait:Item=scene.content.avatar?{...list[0],image:scene.content.avatar,video:undefined}:list[0],clip=uid(scene.id,'creator-avatar');
  return <World {...props} fill='#ccb9ff' rays><Heading {...props}/>
    <g transform={`translate(${width/2} ${cy}) scale(${scale})`}>
      <circle cx={-5} cy={10} r={117} fill='#ffda48'/><circle r={115} fill='#a88adf' stroke={INK} strokeWidth={4}/>
      <defs><clipPath id={clip}><circle r={109}/></clipPath></defs>
      <g clipPath={`url(#${clip})`}><NativeOrMedia item={portrait} scene={scene} x={-109} y={-109} w={218} h={218}><rect x={-115} y={-115} width={230} height={230} fill='#a587d9'/><path d='M-114 66Q0 38 114 68V115H-114Z' fill='#8460b7'/><Person x={25} y={-2} scale={2.2} color='#fff2d1' hair='#533751'/><rect x={-103} y={-45} width={67} height={90} rx={9} fill='#423051' stroke={INK} strokeWidth={4}/><path d='M-68 45V76M-91 77H113' stroke={INK} strokeWidth={7}/><path d='M-94 -34V28' stroke='#efdcfb' strokeWidth={3}/></NativeOrMedia></g>
      <path d='M-104 -12Q-108 -43 -92 -65' fill='none' stroke='white' strokeWidth={4}/>
      <g transform={`translate(88 -119) rotate(14) scale(${pop(t,r*.4,r+Math.min(.2,r))})`}><path d='M-44 -16L-22 5L-5 -29L19 3L43 -15L35 26L-40 24Z' fill={scene.accent||'#ffda48'} stroke={INK} strokeWidth={3.5}/><circle cx={-5} cy={-29} r={5} fill='#f391be' stroke={INK} strokeWidth={2}/></g>
      <g transform='translate(0 114)'><path d='M-147 -16L-181 3L-164 17L-179 31L-141 40M147 -16L181 3L164 17L179 31L141 40' fill='#c9548b' stroke={INK} strokeWidth={3}/><path d='M-150 -23Q0 -33 150 -23V34Q0 10 -150 34Z' fill='#f886bb' stroke={INK} strokeWidth={3.5}/><Text x={0} y={11} size={fit(portrait.label,27,264)} color='white'>{portrait.label}</Text></g>
    </g>
    <g transform={`translate(-55 ${mix(height+120,height*.65,move)}) rotate(${scene.content.pack?.angle??-5})`}>
      <rect x={-180} y={0} width={1000} height={126} fill={INK}/>
      {Array.from({length:52},(_,i)=><g key={i}><rect x={i*21-180-travel%21} y={6} width={11} height={8} rx={2} fill='#fff8df'/><rect x={i*21-180-travel%21} y={111} width={11} height={8} rx={2} fill='#fff8df'/></g>)}
      {Array.from({length:n},(_,i)=>{const it=list[i%list.length],x=((i*126-travel+period*100)%period)-126;return <g key={i} transform={`translate(${x} 22)`}><rect width={111} height={82} rx={8} fill={it.color||COLORS[i%6]}/>{hasMedia(it)?<Media item={it} scene={scene} x={0} y={0} w={111} h={82}/>:<g transform='translate(56 32)'><Chip scale={.29} fill={COLORS[(i+2)%6]} label=''/></g>}<rect y={58} width={111} height={24} fill='#fff7e6' opacity={.93}/><Text x={55.5} y={75} size={fit(it.label,13,102)}>{it.label}</Text></g>;})}
    </g>
    {scene.content.result&&<g opacity={smooth(t,a,z)}><Label x={width*.66} y={height*.88} text={scene.content.result} fill='#ffda48' maxWidth={270} angle={6}/></g>}
  </World>;
};

const UploadBeam: React.FC<EffectProps> = props => {
  const {scene,t,width,height}=props,{r,a,z}=stages(scene),list=items(scene),count=Math.max(list.length,Math.min(30,scene.content.metric?.events??9));
  const states=Array.from({length:count},(_,i)=>{const end=mix(a,z,(i+1)/count);return {end,p:progress(t,Math.max(r*.35,end-(z-r)*.5),end)};}),landed=states.filter(v=>v.p>=1).length,p=landed/count,cy=height*.28;
  return <World {...props} fill='#d3f5ff'><Heading {...props}/>
    <g transform={`translate(${width/2} ${cy}) scale(${pop(t,0,r)})`}><path d='M-156 47Q-194 43 -173 5Q-163 -15 -137 -11Q-142 -61 -92 -66Q-67 -108 -22 -70Q25 -101 62 -63Q111 -77 119 -30Q170 -35 183 9Q204 47 157 48Z' fill='#fffdf6' stroke={INK} strokeWidth={4}/><Text x={0} y={11} size={fit(scene.content.result||scene.title,27,260)}>{scene.content.result||scene.title}</Text></g>
    <g transform={`translate(${width/2} ${height*.53+Math.sin(t*5)*5}) scale(${out(t,r*.25,r)})`}><path d='M-25 44V-15H-60L0 -80L60 -15H25V44Z' fill={scene.accent||'#ffda48'} stroke={INK} strokeWidth={3.5}/><path d='M-13 23V-20H-32' stroke='white' strokeWidth={4} fill='none'/></g>
    {states.map((state,i)=>{if(state.p===0||state.p>=1)return null;const it=list[i%list.length],sx=55+(i*79)%435,q=state.p,x=mix(sx,width/2,q)+Math.sin(q*Math.PI)*(i%2?48:-48),y=mix(height*.78,cy+17,q);return <g key={i} transform={`translate(${x} ${y}) rotate(${mix(i*31-70,0,q)}) scale(${mix(1,.26,q)})`} opacity={1-smooth(q,.85,1)}><rect x={-29} y={-35} width={58} height={69} rx={6} fill={it.color||COLORS[i%6]} stroke={INK} strokeWidth={2.8}/>{hasMedia(it)?<Media item={it} scene={scene} x={-25} y={-31} w={50} h={60}/>:<Text x={0} y={5} size={fit(it.label,13,47)}>{it.label}</Text>}</g>;})}
    <g transform={`translate(0 ${height*.76})`}><Text x={width/2} y={-18} size={23}>{Math.round(p*100)}%</Text><rect x={72} width={400} height={32} rx={16} fill='#fffdf3' stroke={INK} strokeWidth={3}/><rect x={79} y={7} width={386*p} height={18} rx={9} fill='#77da8b'/>{Array.from({length:22},(_,i)=><path key={i} d={`M${90+i*18} 7l-8 18`} stroke='white' strokeWidth={3} opacity={clamp((386*p-i*18)/18)*.4}/>)}{p===1&&<g transform={`translate(460 -24) scale(${pop(t,z,z+.18)})`}><circle r={25} fill='#77da8b' stroke={INK} strokeWidth={3}/><path d='M-12 0l9 10L15 -12' fill='none' stroke={INK} strokeWidth={4}/></g>}</g>
    {scene.content.body&&<Text x={width/2} y={height*.86} size={fit(scene.content.body,17,width-76)}>{scene.content.body}</Text>}
  </World>;
};

const RemixCube: React.FC<EffectProps> = props => {
  const {scene,t,width,height}=props,{r,a,z}=stages(scene),list=items(scene),p=out(t,0,r),cy=height*.45,depth=Math.max(.6,Math.min(1.7,scene.content.pack?.depth??1));
  const turn=mix(-28,332*speed(scene),smooth(t,r*.3,z)),size=202,face=size/2,{fps}=useVideoConfig();
  return <World {...props} fill='#fbd1e3' rays><Heading {...props}/>
    <ellipse cx={width/2} cy={cy+190} rx={mix(60,145,p)} ry={18} fill={INK} opacity={.16}/>
    <foreignObject x={width/2-242} y={cy-238} width={484} height={476}>
      <div style={{width:484,height:476,display:'flex',alignItems:'center',justifyContent:'center',perspective:850/depth}}>
        <div style={{position:'relative',width:size,height:size,transformStyle:'preserve-3d',transform:`translateY(${Math.sin(t*2)*5}px) scale(${p}) rotateX(${-16+Math.sin(t)*4}deg) rotateY(${turn}deg) rotateZ(${scene.content.pack?.angle??-4}deg)`}}>
          {Array.from({length:6},(_,i)=>{const it=list[i%list.length];return <div key={i} style={{position:'absolute',width:size,height:size,boxSizing:'border-box',border:`5px solid ${INK}`,borderRadius:13,overflow:'hidden',background:it.color||COLORS[i],display:'flex',alignItems:'center',justifyContent:'center',backfaceVisibility:'hidden',transform:i<4?`rotateY(${i*90}deg) translateZ(${face}px)`:`rotateX(${i===4?90:-90}deg) translateZ(${face}px)`}}>
            {it.video?<Sequence from={Math.round(scene.start*fps)} layout='none'><OffthreadVideo src={staticFile(it.video)} muted trimBefore={Math.round((it.trimStart??0)*fps)} playbackRate={it.playbackRate??1} style={{position:'absolute',inset:0,width:'100%',height:'100%',objectFit:it.fit||'cover'}}/></Sequence>:it.image?<Img src={staticFile(it.image)} style={{position:'absolute',inset:0,width:'100%',height:'100%',objectFit:it.fit||'cover'}}/>:null}
            <span style={{position:'relative',maxWidth:'90%',padding:'4px 8px',background:hasMedia(it)?'#fff8dfdc':undefined,fontFamily:SANS,fontSize:fit(it.label,44,164),fontWeight:900,color:INK,textAlign:'center'}}>{it.label}</span>
          </div>;})}
        </div>
      </div>
    </foreignObject>
    <g opacity={smooth(t,r,a)}>{list.slice(0,2).map((it,i)=><g key={it.id} transform={`translate(${i?width*.77:width*.23} ${height*.75}) rotate(${i?7:-8})`}><text textAnchor='middle' fontFamily={SANS} fontSize={fit(it.label,35,220)} fontWeight={900} fill={it.color||COLORS[i]} stroke={INK} strokeWidth={3.6} paintOrder='stroke'>{it.label}</text></g>)}</g>
    {scene.content.result&&<Text x={width/2} y={height*.85} size={fit(scene.content.result,23,width-60)}>{scene.content.result}</Text>}
  </World>;
};

const MicrophoneSwing: React.FC<EffectProps> = props => {
  const {scene,t,width,height}=props,{r,a,z}=stages(scene),list=items(scene),cy=height*.51,sway=Math.sin(t*5*speed(scene))*mix(8,1.1,smooth(t,r,z));
  return <World {...props} fill='#ffd693'><Heading {...props}/>
    <g transform={`translate(${width/2} ${cy}) rotate(${sway} 0 95) scale(${pop(t,0,r)})`}>
      <path d='M-67 3Q-68 81 0 81Q68 81 68 3' fill='none' stroke={INK} strokeWidth={6}/><path d='M0 81V182' stroke={INK} strokeWidth={7}/><path d='M-78 198Q-74 180 0 180Q70 180 78 198Z' fill='#9290a9' stroke={INK} strokeWidth={3.5}/><path d='M-62 190Q0 180 60 190' stroke='#dad7eb' strokeWidth={3} fill='none'/>
      <NativeOrMedia item={list[0]} scene={scene} x={-70} y={-121} w={140} h={176}><path d='M-49 -66C-48 -130 49 -130 49 -66V0Q49 44 0 44Q-50 44 -50 0Z' fill='#b8b4c9' stroke={INK} strokeWidth={4.5}/><path d='M-32 -76Q-28 -88 -18 -88' fill='none' stroke='white' strokeWidth={4}/>{[-72,-50,-28,-6].map(y=><path key={y} d={`M-29 ${y}H29`} stroke='#686178' strokeWidth={3}/>)}<path d='M-50 -3H50V13H-50Z' fill={scene.accent||'#ff6473'} stroke={INK} strokeWidth={3}/></NativeOrMedia>
      {[-1,1].map(s=><g key={s} transform={`scale(${s} 1)`}>{[0,1,2].map(i=><path key={i} d={`M${92+i*21} ${-82-i*13}Q${116+i*21} -14 ${92+i*21} ${51+i*13}`} stroke={INK} strokeWidth={4} fill='none' opacity={(.9-i*.23)*(.6+.4*Math.abs(Math.sin(t*7-i)))}/>)}</g>)}
    </g>
    <g transform={`translate(${width*.74} ${height*.28}) rotate(5) scale(${pop(t,r*.3,a)})`}><path d='M-81 -51Q-91 -51 -91 -35V27Q-91 44 -74 44H-35L-62 69L-57 44H76Q92 44 92 28V-36Q92 -52 77 -52Z' fill='#fffdf8' stroke={INK} strokeWidth={3.5}/>{scene.content.emphasis?<Text x={0} y={5} size={fit(scene.content.emphasis,24,151)}>{scene.content.emphasis}</Text>:[-37,0,37].map((x,i)=><circle key={i} cx={x} cy={-5+Math.sin(t*6-i)*5} r={11} fill={COLORS[i]} stroke={INK} strokeWidth={2.5}/>)}</g>
    {scene.content.result&&<Label x={width/2} y={height*.85} text={scene.content.result} maxWidth={width-70}/>}
  </World>;
};

const RobotMeter: React.FC<EffectProps> = props => {
  const {scene,t,width,height}=props,{r,a,z}=stages(scene),list=items(scene),cy=height*.47,p=smooth(t,r*.4,z),metric=scene.content.metric??{value:100,unit:'%',label:list[0].label};
  const target=Math.max(0,Math.min(1,metric.unit==='%'?metric.value/100:1)),fill=p*target,gaugeY=height*.23,gaugeH=height*.49;
  return <World {...props} fill='#c9f1d1' rays><Heading {...props}/>
    <g transform={`translate(${width*.415} ${cy+Math.sin(t*3)*4}) scale(${pop(t,0,r)})`}><NativeOrMedia item={list[0]} scene={scene} x={-132} y={-150} w={264} h={297}><rect x={-120} y={-56} width={36} height={74} rx={18} fill='#ffda48' stroke={INK} strokeWidth={3}/><rect x={91} y={-56} width={36} height={74} rx={18} fill='#ffda48' stroke={INK} strokeWidth={3}/><path d='M0 -112V-147' stroke={INK} strokeWidth={5}/><circle cy={-153} r={12} fill='#ff6b83' stroke={INK} strokeWidth={3}/><rect x={-104} y={-113} width={210} height={205} rx={39} fill='#57bdd8' stroke={INK} strokeWidth={4}/><path d='M-88 -72Q-91 -94 -67 -99' stroke='white' strokeWidth={4} fill='none'/><rect x={-77} y={-78} width={154} height={135} rx={28} fill={INK}/><ellipse cx={-31} cy={-32} rx={12} ry={mix(10,22,p)} fill='#68e4b1'/><ellipse cx={31} cy={-32} rx={12} ry={mix(10,22,p)} fill='#68e4b1'/><path d={`M-32 14Q0 ${mix(12,48,p)} 34 13`} fill='none' stroke='#68e4b1' strokeWidth={7} strokeLinecap='round'/></NativeOrMedia>
      <g transform={`translate(0 -117) scale(${pop(t,a,z)})`}><path d='M-105 -18L18 -75L112 -45L-7 9Z' fill={INK} stroke={INK} strokeWidth={3}/><path d='M-57 5V31Q0 48 51 12V-16' fill='#4c3c64' stroke={INK} strokeWidth={3}/><path d='M95 -40V27' stroke='#ffda48' strokeWidth={3}/><circle cx={95} cy={31} r={6} fill='#ffda48' stroke={INK} strokeWidth={2}/></g>
    </g>
    <rect x={width*.82} y={gaugeY} width={46} height={gaugeH} rx={23} fill='#fffdf8' stroke={INK} strokeWidth={3}/><rect x={width*.82+7} y={gaugeY+gaugeH-7-(gaugeH-14)*fill} width={32} height={Math.max(0,(gaugeH-14)*fill)} rx={16} fill={scene.accent||'#70db87'}/>
    {[.2,.4,.6,.8].map(p=><path key={p} d={`M${width*.82} ${gaugeY+gaugeH*p}h12`} stroke={INK} strokeWidth={2}/>)}<path d={`M${width*.82+23} ${gaugeY-16}V${gaugeY-47}m-15 15l15 -15l15 15`} fill='none' stroke={INK} strokeWidth={4}/><Text x={width*.82+23} y={gaugeY+gaugeH+32} size={18}>{Math.round(metric.value*p)}{metric.unit}</Text>
    {list.slice(1,4).map((it,i)=><g key={it.id} transform={`translate(${75+i*124} ${height*.72}) scale(${pop(t,r+(a-r)*i/4,a+(z-a)*i/4)})`}><Spark x={0} y={-20} r={18} color={it.color||COLORS[i]}/><Text x={0} y={15} size={fit(it.label,15,110)}>{it.label}</Text></g>)}
    <Footer {...props}/>
  </World>;
};

const CoinGrowth: React.FC<EffectProps> = props => {
  const {scene,t,width,height}=props,{r,a,z}=stages(scene),list=items(scene).slice(0,8),n=list.length,p=smooth(t,r*.45,z),base=height*.75,metric=scene.content.metric??{value:100,unit:'',label:''};
  const vals=list.map((it,i)=>Math.max(0,scene.content.values?.[i]??it.value??(i+1)*(i+2))),max=Math.max(1,...vals),spacing=(width-124)/Math.max(1,n-1),radius=Math.min(36,145/n),xs=list.map((_,i)=>n===1?width/2:62+i*spacing);
  const line=xs.map((x,i)=>`${i?'L':'M'}${x} ${base-45-(vals[i]/max)*height*.32}`).join(' '),signY=height*.24;
  return <World {...props} fill='#ffdfdf'><Heading {...props}/>
    <g transform={`translate(${width/2} ${signY}) rotate(${-Math.sin(t*8)*7*Math.exp(-t*.7)})`}><path d='M0 -68V-42' stroke={INK} strokeWidth={2.5}/><rect x={-144} y={-43} width={288} height={89} rx={9} fill='#fffdf8' stroke={INK} strokeWidth={4}/><circle cy={-28} r={5} fill='none' stroke={INK} strokeWidth={2.5}/><text y={22} textAnchor='middle' fontFamily={SANS} fontSize={fit(`${Math.round(metric.value*p).toLocaleString('en-US')}${metric.unit}`,39,265)} fontWeight={900} fill={p>.72?'#ff6975':'#ffda48'} stroke={INK} strokeWidth={2.5} paintOrder='stroke'>{Math.round(metric.value*p).toLocaleString('en-US')}{metric.unit}</text></g>
    <path d={`M37 ${base+15}H507`} stroke={INK} strokeWidth={3.5}/>
    {list.map((it,i)=>{const target=Math.max(1,Math.round(vals[i]/max*15)),step=(z-r*.4)/Math.max(1,target);return <g key={it.id}>{Array.from({length:target},(_,k)=>{const enter=out(t,r*.4+k*step,r*.4+(k+1)*step),y=base-k*11-mix(34,0,enter);return <g key={k} transform={`translate(${xs[i]} ${y})`} opacity={enter}><path d={`M${-radius} -4v10C${-radius} 21 ${radius} 21 ${radius} 6v-10Z`} fill='#dfa927' stroke={INK} strokeWidth={2.2}/><ellipse cy={-3} rx={radius} ry={radius*.32} fill={it.color||'#ffdf55'} stroke={INK} strokeWidth={2.2}/></g>;})}{hasMedia(it)&&<Media item={it} scene={scene} x={xs[i]-radius*.6} y={base-target*11-38} w={radius*1.2} h={radius*1.2}/>}<Text x={xs[i]} y={base+43} size={fit(it.label,15,Math.min(100,spacing-10))}>{it.label}</Text></g>;})}
    <path d={line} fill='none' stroke={INK} strokeWidth={12} pathLength={1} strokeDasharray={1} strokeDashoffset={1-smooth(t,a*.7,z)}/><path d={line} fill='none' stroke={scene.accent||'#ff767d'} strokeWidth={6} pathLength={1} strokeDasharray={1} strokeDashoffset={1-smooth(t,a*.7,z)}/>
    {scene.content.result&&<g opacity={smooth(t,a,z)}><Label x={width*.76} y={height*.39} text={scene.content.result} fill='#ff6975' color='white' maxWidth={214} angle={7} size={19}/></g>}
    {metric.label&&<Text x={width/2} y={height*.90} size={20}>{metric.label}</Text>}
  </World>;
};

const QuestionBounce: React.FC<EffectProps> = props => {
  const {scene,t,width,height}=props,{r,a}=stages(scene),list=items(scene),p=pop(t,0,r),cy=height*.44,mark=scene.content.emphasis||'?';
  return <World {...props} fill='#cbb5fa' rays><Heading {...props}/>
    <ellipse cx={width*.53} cy={height*.65} rx={mix(125,95,.5+.5*Math.sin(t*3))} ry={17} fill={INK} opacity={.15}/>
    <g transform={`translate(${width*.53} ${cy+Math.sin(t*3)*9}) rotate(${scene.content.pack?.angle??-7}) scale(${p})`}>{hasMedia(list[0])?<Media item={list[0]} scene={scene} x={-125} y={-155} w={250} h={260}/>:<><text x={10} y={65} textAnchor='middle' fontFamily={SANS} fontWeight={900} fontSize={fit(mark,245,340)} fill='#b89329' stroke={INK} strokeWidth={5}>{mark}</text><text y={56} textAnchor='middle' fontFamily={SANS} fontWeight={900} fontSize={fit(mark,245,340)} fill={scene.accent||'#ffda48'} stroke={INK} strokeWidth={4}>{mark}</text></>}</g>
    <g transform={`translate(88 ${height*.72}) scale(${pop(t,r*.3,a)})`}><Person scale={1.35} color='#aa8bdd' hair='#564077'/></g>
    {[0,1,2].map(i=><circle key={i} cx={114+i*21} cy={height*.66-i*29} r={7+i*4} fill='#fffdf3' stroke={INK} strokeWidth={2.3} opacity={smooth(t,r*.3+i*(a-r*.3)/4,r*.4+(i+1)*(a-r*.3)/4)}/>)}
    <Footer {...props}/>
  </World>;
};

const ConsumableBan: React.FC<EffectProps> = props => {
  const {scene,t,width,height}=props,{r,a,z}=stages(scene),it=items(scene)[0],drop=smooth(t,r,a),cx=width/2,cy=height*.42,bx=width*.80,by=height*.71;
  return <World {...props} fill='#d3f5ff'><Heading {...props}/>
    <g transform={`translate(${bx} ${by})`}><path d='M-67 -45L-52 64H49L64 -45Z' fill='#655f7d' stroke={INK} strokeWidth={3.5}/><ellipse cy={-43} rx={66} ry={15} fill='#2e293e'/></g>
    {drop<1&&<g transform={`translate(${mix(cx,bx,drop)+Math.sin(drop*Math.PI)*18} ${mix(cy,by+12,drop)-Math.sin(drop*Math.PI)*48}) rotate(${mix(Math.sin(t*5)*5,95,drop)}) scale(${mix(pop(t,0,r*.6),.18,drop)})`}><NativeOrMedia item={it} scene={scene} x={-80} y={-86} w={160} h={181}><Cup label={it.label} color={it.color||'#69cef0'}/></NativeOrMedia></g>}
    <g transform={`translate(${bx} ${by})`}><path d='M-67 -42L-52 62Q-51 72 -39 72H37Q49 72 50 61L64 -42Z' fill='#928ba6' stroke={INK} strokeWidth={3.5}/><rect x={-72} y={-49} width={143} height={19} rx={7} fill='#b9b1cd' stroke={INK} strokeWidth={3.5}/><path d='M-38 -22l6 66M-3 -22v66M32 -22l-4 66' stroke='#655f7d' strokeWidth={3}/><path d='M-61 -42H12' stroke='#f1e8fb' strokeWidth={3}/></g>
    <g opacity={1-smooth(t,a,a+(z-a)*.4)}>{drop===1&&[0,1,2,3,4].map(i=><path key={i} transform={`translate(${bx} ${by-67}) rotate(${-70+i*35})`} d='M0 -10V-32' stroke={INK} strokeWidth={3.3}/>)}</g>
    <g transform={`translate(${cx} ${cy}) scale(${pop(t,a,z)})`}><NativeOrMedia item={it} scene={scene} x={-57} y={-65} w={114} h={126}><g transform='scale(.6)'><Cup label={it.label} color={it.color}/></g></NativeOrMedia><Ban r={103} p={1}/></g>
    <Footer {...props}/>
  </World>;
};

const LuxuryDome: React.FC<EffectProps> = props => {
  const {scene,t,width,height}=props,{r,a,z}=stages(scene),list=items(scene),cy=height*.51,p=pop(t,0,r),close=smooth(t,r*.3,a),metric=scene.content.metric;
  const reject=scene.content.pack?.labels?.[0]==='ban';
  return <World {...props} fill='#30274e' rays dark><Heading {...props} dark/>
    <g transform={`translate(${width/2} ${cy}) scale(${p})`}>
      <ellipse cy={183} rx={145} ry={19} fill='#171227' opacity={.45}/><rect x={-112} y={77} width={224} height={111} rx={12} fill='#823864' stroke={INK} strokeWidth={4}/><path d='M-99 124H97M-99 155H97' stroke='#ffda48' strokeWidth={3} strokeDasharray='1 9'/><path d='M-104 89V175H-5' fill='none' stroke='#b05286' strokeWidth={3}/>
      <g transform={`translate(0 ${Math.sin(t*2)*4})`}><NativeOrMedia item={list[0]} scene={scene} x={-85} y={-93} w={170} h={166}><Chip scale={.96} fill={list[0].color||'#a18de4'} label={list[0].label}/></NativeOrMedia></g>
      <g transform={`translate(0 ${mix(-240,0,close)})`} opacity={out(t,r*.15,a)}><path d='M-123 75V-53Q-123 -163 0 -163Q123 -163 123 -53V75Z' fill='#e2e3ff' fillOpacity={.12} stroke='#fff7e9' strokeWidth={4}/><path d='M-113 -45Q-112 -126 -62 -139' stroke='#eee3ff' strokeWidth={4} fill='none'/><path d='M89 -52V39' stroke='#eee3ff' strokeWidth={8} opacity={.24}/><circle cy={-174} r={10} fill='#ffda48' stroke='#fff7e9' strokeWidth={2.4}/></g>
      <rect x={-128} y={73} width={256} height={28} rx={10} fill='#b9407f' stroke={INK} strokeWidth={3.5}/><path d='M-118 81H109' stroke='#ef87b8' strokeWidth={2}/>
      {reject&&<Ban r={137} p={pop(t,a,z)}/>}
    </g>
    {metric&&<Label x={width/2} y={height*.23} text={`${metric.value.toLocaleString('en-US')}${metric.unit}`} fill='#ffda48' maxWidth={310} size={30}/>}
    <g transform={`translate(${width*.81} ${height*.68}) rotate(12)`}><path d='M-31 -18L-12 -26L24 -22L33 -7L0 33Z' fill='#a8e6f6' stroke={INK} strokeWidth={2.6}/><path d='M-31 -18L33 -7M-12 -26L0 33L24 -22' fill='none' stroke={INK} strokeWidth={2}/></g>
    <Footer {...props} dark/>
  </World>;
};

const SharingNetwork: React.FC<EffectProps> = props => {
  const {scene,t,width,height}=props,{r,a,z}=stages(scene),list=items(scene),n=Math.max(3,Math.min(12,list.length)),cy=height*.49,rx=width*.355,ry=height*.115;
  const people=Array.from({length:n},(_,i)=>{const angle=i*Math.PI*2/n-Math.PI/2;return {it:list[i%list.length],x:width/2+Math.cos(angle)*rx,y:cy+Math.sin(angle)*ry,angle,i};}).sort((a,b)=>a.y-b.y),metric=scene.content.metric;
  return <World {...props} fill='#fff0ae' rays><Heading {...props}/>
    <ellipse cx={width/2} cy={cy+22} rx={rx+11} ry={ry} fill='none' stroke={INK} strokeWidth={3.7} strokeDasharray='1 12'/>
    {people.filter(p=>p.y<=cy).map(p=><g key={p.i} transform={`translate(${p.x} ${p.y}) scale(${pop(t,r*p.i/n,r+(a-r)*p.i/n)})`}><NativeOrMedia item={p.it} scene={scene} x={-33} y={-39} w={66} h={80}><Person color={p.it.color||COLORS[p.i%6]} hair={['#493258','#885537','#332441'][p.i%3]}/></NativeOrMedia><Text x={0} y={57} size={fit(p.it.label,12,90)}>{p.it.label}</Text></g>)}
    <ellipse cx={width/2} cy={cy+34} rx={59} ry={13} fill={INK} opacity={.16}/><g transform={`translate(${width/2} ${cy-16}) scale(${pop(t,0,r)})`}><Coin r={66} flip={.94+Math.sin(t*3)*.06} label={scene.content.emphasis||''} color={scene.accent||'#ffda48'}/></g>
    {Array.from({length:n},(_,i)=>{const angle=t*1.7*speed(scene)+i*Math.PI*2/n,p=smooth(t,r,a);return <Coin key={i} x={width/2+Math.cos(angle)*122*p} y={cy-29+Math.sin(angle)*60*p} r={14} flip={.3+.7*Math.abs(Math.cos(angle))} turn={Math.sin(angle)*12}/>;})}
    {people.filter(p=>p.y>cy).map(p=><g key={p.i} transform={`translate(${p.x} ${p.y}) scale(${pop(t,r*p.i/n,r+(a-r)*p.i/n)})`}><NativeOrMedia item={p.it} scene={scene} x={-33} y={-39} w={66} h={80}><Person color={p.it.color||COLORS[p.i%6]} hair={['#493258','#885537','#332441'][p.i%3]}/></NativeOrMedia><Text x={0} y={57} size={fit(p.it.label,12,90)}>{p.it.label}</Text></g>)}
    {metric&&<Text x={width/2} y={height*.72} size={27}>{Math.round(metric.value*smooth(t,r,z))}{metric.unit} {metric.label}</Text>}
    <Footer {...props}/>
  </World>;
};

const CelebrationType: React.FC<EffectProps> = props => {
  const {scene,t,width,height}=props,{r,a,z}=stages(scene),list=items(scene),count=Math.max(20,Math.min(100,scene.content.pack?.density??58)),headline=scene.content.emphasis||scene.title,letters=[...headline],size=fit(headline,52,width-70),cy=height*.37;
  const widths=letters.map(c=>size*(/[\u2e80-\uffff]/.test(c)?1:.6)),total=widths.reduce((a,b)=>a+b,0),n=Math.max(3,Math.min(8,list.length));
  return <World {...props} fill='#ff626c' rays>
    {Array.from({length:count},(_,i)=>{const x=8+((i*137+Math.sin(i*17)*43)%526+526)%526,y=((i*79+t*(32+i%5*13)*speed(scene))%(height+70))-30;return <rect key={i} x={x} y={y} width={6+i%3*2} height={12} rx={1.5} fill={[...COLORS,'#fffdf3'][i%7]} stroke={INK} strokeWidth={1.1} transform={`rotate(${i*31+t*28} ${x} ${y})`}/>;})}
    <g transform={`translate(${width/2} ${cy+Math.sin(t*5)*5}) rotate(${mix(25,0,out(t,0,a))+Math.sin(t*3)*1.5}) scale(${pop(t,0,r)})`}>
      <NativeOrMedia item={list[0]} scene={scene} x={-125} y={-129} w={250} h={245}><polygon points='0,-126 35,-48 123,-43 59,16 77,100 0,56 -72,109 -53,27 -119,-34 -31,-43' fill={scene.accent||'#ffda48'} stroke={INK} strokeWidth={5} strokeLinejoin='round'/><ellipse cx={-20} cy={2} rx={7} ry={8} fill={INK}/><ellipse cx={20} cy={2} rx={7} ry={8} fill={INK}/><circle cx={-36} cy={20} r={7} fill='#f28d98'/><circle cx={36} cy={20} r={7} fill='#f28d98'/><path d='M-14 21Q0 38 16 21' fill='none' stroke={INK} strokeWidth={4}/><path d='M-29 -33Q-26 -55 -12 -62' stroke='white' strokeWidth={6} fill='none'/></NativeOrMedia>
    </g>
    {scene.content.kicker&&<g opacity={out(t,r*.3,a)}><Text x={width/2} y={height*.57} size={29} color='#fffdf3'>{scene.content.kicker}</Text></g>}
    {letters.map((c,i)=>{const start=r*.2+(a-r*.2)*i/Math.max(1,letters.length)*.7,p=out(t,start,z),target=width/2-total/2+widths.slice(0,i).reduce((a,b)=>a+b,0)+widths[i]/2,x=mix(44+(i*83)%456,target,p),y=mix(height+90+i%3*65,height*.65,p);return <text key={i} x={x} y={y} transform={`rotate(${mix([-75,36,83,-24,54,-39][i%6],[-5,3,-3,4][i%4],p)} ${x} ${y})`} textAnchor='middle' fontFamily={SANS} fontSize={size} fontWeight={900} fill='#ffda48' stroke={INK} strokeWidth={3.7} paintOrder='stroke'>{c}</text>;})}
    {Array.from({length:n},(_,i)=>{const it=list[i%list.length],p=out(t,r*.4+i*(a-r*.4)/n,z),x=55+i*(width-110)/(n-1),y=mix(height+100+i%2*70,height*.80,p);return <g key={i}><g transform={`translate(${x} ${y})`}><NativeOrMedia item={it} scene={scene} x={-31} y={-38} w={62} h={81}><Person color={it.color||COLORS[i%6]} hair={['#332241','#976037','#e89942'][i%3]} wave={Math.sin(t*4+i)+1.2}/></NativeOrMedia></g><Coin x={x-27} y={y-72} r={14} flip={.35+.65*Math.abs(Math.sin(t*2+i))}/></g>;})}
    {scene.content.result&&<g opacity={smooth(t,a,z)}><Text x={width/2} y={height*.92} size={fit(scene.content.result,18,width-75)} color='#fffdf3'>{scene.content.result}</Text></g>}
  </World>;
};

export const illustratedPack: Record<string, React.FC<EffectProps>> = {
  'creator-filmstrip': CreatorFilmstrip,
  'upload-beam': UploadBeam,
  'remix-cube': RemixCube,
  'microphone-swing': MicrophoneSwing,
  'robot-meter': RobotMeter,
  'coin-growth': CoinGrowth,
  'question-bounce': QuestionBounce,
  'consumable-ban': ConsumableBan,
  'luxury-dome': LuxuryDome,
  'sharing-network': SharingNetwork,
  'celebration-type': CelebrationType,
};
