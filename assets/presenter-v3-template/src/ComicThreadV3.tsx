import React from 'react';
import {staticFile} from 'remotion';
import {mediaConfig} from './mediaConfig';

const limit=(x:number)=>Math.max(0,Math.min(1,x));
const smooth=(t:number,a:number,b:number)=>{const p=limit((t-a)/(b-a));return p*p*(3-2*p);};
const out=(t:number,a:number,b:number)=>1-Math.pow(1-limit((t-a)/(b-a)),3);
const mix=(a:number,b:number,p:number)=>a+(b-a)*p;
const bounce=(t:number,a:number,b:number)=>{
  const p=limit((t-a)/(b-a));
  return p===1?1:1-Math.pow(1-p,3)*Math.cos(p*Math.PI*2.15);
};
const dark='#27223b';
const coral='#ee4767';

const Spark:React.FC<{x:number;y:number;r:number;fill:string;rotation?:number}>=({x,y,r,fill,rotation=0})=>
  <path d={`M0 ${-r} Q${r*.15} ${-r*.14} ${r} 0 Q${r*.15} ${r*.14} 0 ${r} Q${-r*.15} ${r*.14} ${-r} 0 Q${-r*.15} ${-r*.14} 0 ${-r}Z`}
    fill={fill} stroke={dark} strokeWidth="2" transform={`translate(${x} ${y}) rotate(${rotation})`}/>;

/** One absolute-time comic scene. The parent supplies its circular reveal and captions. */
export const ComicThreadV3:React.FC<{t:number}>=({t})=>{
  const fall=bounce(t,8.14,8.60);
  const gather=smooth(t,8.58,9.08);
  const disc=out(t,8.63,9.04);
  const filmEnter=out(t,8.91,9.42);
  const filmDrift=650*(1-filmEnter)-12*smooth(t,9.42,10.73);
  const tether=smooth(t,8.58,9.24);
  const run=smooth(t,9.35,10.13);
  const fasten=bounce(t,10.04,10.31);
  const finish=out(t,10.04,10.31);
  const qx=mix(270,383,gather),qy=mix(310,290,gather)-350*(1-fall);
  const qs=mix(1,.76,gather);
  const qRot=mix(-13,7,gather)+8*(1-fall);
  const qr=qRot*Math.PI/180;
  const dotX=qx+(-7*Math.cos(qr)-89*Math.sin(qr))*qs;
  const dotY=qy+(-7*Math.sin(qr)+89*Math.cos(qr))*qs;
  const questionShape='M-89-93C-85-145-45-168 11-168C71-168 102-129 102-84C102-48 82-29 50-8C24 7 20 13 20 38H-36V18C-36-18-18-39 12-57C35-71 46-82 46-99C46-119 29-130 8-130C-17-130-31-119-35-92Z';
  const discX=mix(-120,140,disc);
  const discY=306+14*(1-disc);
  const angle=-5*Math.PI/180;
  const filmPoint=(x:number,y:number)=>({
    x:270+(x-270)*Math.cos(angle)-(y-84)*Math.sin(angle)+filmDrift,
    y:573+(x-270)*Math.sin(angle)+(y-84)*Math.cos(angle),
  });
  const start=filmPoint(29,142);
  const tetherPath=`M${dotX} ${dotY} C${dotX+3} ${dotY+50} 230 443 ${discX+25} ${discY+102} C${discX-53} ${discY+85} 58 461 ${start.x} ${start.y}`;
  const filmPath='M29 142 C60 168 93 155 117 141 C143 124 132 19 185 24 C211 24 198 144 247 143 C272 143 299 164 321 142 C343 120 341 25 377 25 C412 25 401 119 453 143 L491 142';
  return <div style={{position:'absolute',inset:0,width:540,height:960,overflow:'hidden',background:'#d8caff'}}>
    <svg width="540" height="960" viewBox="0 0 540 960" style={{position:'absolute',inset:0}}>
      <defs>
        <linearGradient id="ctv3-yellow" x1="0" y1="0" x2=".8" y2="1"><stop stopColor="#ffe779"/><stop offset=".62" stopColor="#ffd64b"/><stop offset="1" stopColor="#ffbd36"/></linearGradient>
        <linearGradient id="ctv3-film" x1="0" y1="0" x2="0" y2="1"><stop stopColor="#383047"/><stop offset=".5" stopColor="#211d31"/><stop offset="1" stopColor="#322941"/></linearGradient>
        <clipPath id="ctv3-interview-disc"><circle cx="0" cy="0" r="99"/></clipPath>
        {[0,1,2].map(i=><clipPath key={i} id={`ctv3-frame-${i}`}><rect x={30+i*171} y="27" width="144" height="110" rx="7"/></clipPath>)}
      </defs>

      {/* Large rays, not a high-frequency texture; they remain readable under motion. */}
      <g transform={`rotate(${(t-8.14)*.65} 282 332)`} opacity=".63">
        {Array.from({length:18},(_,i)=>{
          const a=i*Math.PI/9,b=a+Math.PI/20;
          return <path key={i} d={`M282 332 L${282+1250*Math.cos(a)} ${332+1250*Math.sin(a)} L${282+1250*Math.cos(b)} ${332+1250*Math.sin(b)} Z`} fill="#c3b0f2"/>;
        })}
      </g>
      <g opacity=".13" fill="#62518d">
        {Array.from({length:90},(_,i)=><circle key={i} cx={17+(i*109)%519} cy={27+(i*173)%877} r="1.4"/>)}
      </g>
      <Spark x={58} y={156} r={12} fill="#ffc4de" rotation={12}/>
      <Spark x={466} y={213} r={14} fill="#fff0a3" rotation={17}/>
      <Spark x={445} y={447} r={10} fill="#89dda0" rotation={-16}/>
      <Spark x={49} y={455} r={8} fill="#81caff" rotation={7}/>
      <circle cx="437" cy="137" r="4" fill="#fff7d0" stroke={dark} strokeWidth="2"/>
      <circle cx="86" cy="89" r="3" fill={dark}/>

      <g transform={`translate(270 ${105-10*(1-fall)}) rotate(-3)`}>
        <rect x="-101" y="-27" width="202" height="64" rx="14" fill={dark}/>
        <rect x="-104" y="-32" width="202" height="64" rx="14" fill="#fffcec" stroke={dark} strokeWidth="3"/>
        <text x="-3" y="11" textAnchor="middle" fontSize="34" fontWeight="900" fontFamily="Noto Sans SC" fill={dark}>一个问题</text>
      </g>

      {/* The same question occupies the centre, then makes room for the dialogue. */}
      <ellipse cx={qx+5} cy="447" rx={82*qs*limit(fall)} ry={10*limit(fall)} fill="#8d6daa" opacity=".23"/>
      <g transform={`translate(${qx} ${qy}) rotate(${qRot}) scale(${qs})`}>
        {[12,9,6,3].map(d=><g key={d} transform={`translate(${d} ${d})`} stroke={dark} strokeWidth="3" fill="#da9635"><path d={questionShape}/><circle cx="-7" cy="89" r="28"/></g>)}
        <g stroke={dark} strokeWidth="3" fill="url(#ctv3-yellow)"><path d={questionShape}/><circle cx="-7" cy="89" r="28"/></g>
        <path d="M-64-111Q-51-149-2-148" fill="none" stroke="#fff2af" strokeWidth="6" strokeLinecap="round" opacity=".86"/>
      </g>

      {/* A single physical circular frame, with both source regions in the configurable reference image. */}
      <g transform={`translate(${discX} ${discY}) rotate(${-9+7*disc})`}>
        <circle cx="5" cy="7" r="105" fill="#ffe46b" stroke={dark} strokeWidth="3"/>
        <circle r="104" fill="#f99fc9" stroke={dark} strokeWidth="3"/>
        <g clipPath="url(#ctv3-interview-disc)">
          <rect x="-101" y="-101" width="202" height="202" fill="#29232e"/>
          <svg x="-100" y="-100" width="99" height="200" viewBox="220 0 1080 1060" preserveAspectRatio="xMidYMid slice"><image href={staticFile(mediaConfig.referenceImage)} width="2992" height="1060"/></svg>
          <svg x="1" y="-100" width="100" height="200" viewBox="1620 0 1190 1060" preserveAspectRatio="xMidYMid slice"><image href={staticFile(mediaConfig.referenceImage)} width="2992" height="1060"/></svg>
          <path d="M0-100V100" stroke={dark} strokeWidth="3"/>
        </g>
        <circle r="101" fill="none" stroke={dark} strokeWidth="3"/>
        <path d="M-89-49 Q-83-68-66-79" fill="none" stroke="#fff" strokeWidth="5" strokeLinecap="round" opacity=".72"/>
      </g>

      {/* The loose thread reaches the reel; the entire strip retains its inertia. */}
      <path d={tetherPath} pathLength="1" stroke={dark} strokeWidth="7" fill="none" strokeLinecap="round" strokeDasharray="1" strokeDashoffset={1-tether}/>
      <path d={tetherPath} pathLength="1" stroke={coral} strokeWidth="4" fill="none" strokeLinecap="round" strokeDasharray="1" strokeDashoffset={1-tether}/>
      <g transform={`translate(${filmDrift} 489) rotate(-5 270 84)`}>
        <rect x="-130" y="8" width="800" height="173" rx="7" fill="#87709f" opacity=".28"/>
        <rect x="-130" width="800" height="166" rx="5" fill="url(#ctv3-film)" stroke={dark} strokeWidth="3"/>
        {Array.from({length:36},(_,i)=><g key={i} fill="#fff9ee">
          <rect x={-120+i*23} y="7" width="13" height="10" rx="2"/>
          <rect x={-120+i*23} y="150" width="13" height="10" rx="2"/>
        </g>)}
        {[0,1,2].map(i=><g key={i}>
          <rect x={23+i*171} y="22" width="158" height="120" rx="9" fill={['#ffda58','#77caff','#ff8bbc'][i]}/>
          <g clipPath={`url(#ctv3-frame-${i})`}>
            <svg x={30+i*171} y="27" width="144" height="110" viewBox={i===0?'130 0 1300 1060':i===1?'0 0 2992 1060':'1620 0 1250 1060'} preserveAspectRatio={i===1?'xMidYMid meet':'xMidYMid slice'}>
              <rect width="2992" height="1060" fill="#282631"/>
              <image href={staticFile(mediaConfig.referenceImage)} width="2992" height="1060"/>
            </svg>
          </g>
          <rect x={30+i*171} y="27" width="144" height="110" rx="7" fill="none" stroke={dark} strokeWidth="2"/>
        </g>)}
        <path d={filmPath} pathLength="1" stroke={dark} strokeWidth="7" fill="none" strokeLinecap="round" strokeDasharray="1" strokeDashoffset={1-run}/>
        <path d={filmPath} pathLength="1" stroke={coral} strokeWidth="4" fill="none" strokeLinecap="round" strokeDasharray="1" strokeDashoffset={1-run}/>
        <g transform={`translate(491 142) scale(${Math.max(.001,fasten)})`}>
          <circle r="15" fill="#ffe05d" stroke={dark} strokeWidth="2.5"/>
          <circle r="5" fill={dark}/>
          <path d="M-1 0 C-21-26-36 3-12 9 C13 15 25-23 3-6 C-8 3 4 7 13 6" stroke={coral} strokeWidth="4" strokeLinecap="round" fill="none"/>
        </g>
      </g>

      <g transform={`translate(${177+54*(1-finish)} ${724+24*(1-finish)}) rotate(-3)`} opacity={finish}>
        <path d="M-10-19H320V81H-10L3 31Z" fill={dark}/>
        <path d="M-15-25H315V75H-15L-2 25Z" fill="#ff99c0" stroke={dark} strokeWidth="3"/>
        <text x="152" y="17" textAnchor="middle" fontFamily="Noto Sans SC" fontSize="37" fontWeight="900" fill="#fffbed" stroke={dark} strokeWidth="4" paintOrder="stroke">串起整场对谈</text>
        <path d="M28 43Q150 50 276 42" stroke={dark} strokeWidth="3" fill="none" strokeLinecap="round"/>
      </g>
    </svg>
  </div>;
};
