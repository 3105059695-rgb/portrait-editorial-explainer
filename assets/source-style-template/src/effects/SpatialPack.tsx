import React from 'react';
import type {EffectProps, Item, Scene} from '../types';
import {mix, out, pop, progress, smooth, uid} from '../motion';
import {INK, SERIF, Text, Media, Surface, point, items} from '../pack-shared';

// Source family: the split isometric object demonstration, editorial charts,
// sculpted premium card, quota dial, gallery fly-through and curved web world.
// Every clock is scene-local; labels, media and numerical geometry are inputs.
const fitted = (s: string, w: number, preferred: number) => Math.min(preferred, w / Math.max(1, [...s].reduce((n,c)=>n+(/[^\x00-\xff]/.test(c)?1:.56),0)));
// Balance two complete lines before fitting; copy is never sliced or ellipsized.
const premiumCopy = (text: string) => {
  const chars=[...text], units=(value:string)=>[...value].reduce((n,c)=>n+(/[^\x00-\xff]/.test(c)?1:.56),0);
  if(units(text)*13<=260) return {lines:[text],size:13};
  let best=1,bestScore=Infinity;
  for(let i=1;i<chars.length;i++){
    const left=units(chars.slice(0,i).join('')),right=units(chars.slice(i).join(''));
    const score=Math.max(left,right)+Math.abs(left-right)*.1-(/[，。；、：！？\s]/.test(chars[i-1])?.65:0);
    if(score<bestScore){best=i;bestScore=score;}
  }
  const lines=[chars.slice(0,best).join(''),chars.slice(best).join('')];
  return {lines,size:Math.min(...lines.map(line=>fitted(line,260,13)))};
};
const Heading: React.FC<{scene: Scene; y: number; opacity?: number}> = ({scene,y,opacity=1}) => scene.content.pack?.showTitle === false ? null : <g opacity={opacity}><Text x={272} y={y} size={fitted(scene.title,470,38)} family={SERIF} anchor="middle" weight={700}>{scene.title}</Text>{scene.content.kicker && <Text x={272} y={y-39} size={12} anchor="middle" color="#807d71">{scene.content.kicker}</Text>}</g>;
const valueOf = (scene: Scene,item: Item,index: number) => Math.max(0, item.value ?? scene.content.values?.[index] ?? (index+1)*25);
const defs = (scene: Scene) => <defs><filter id={uid(scene.id,'sp-shadow')} x="-70%" y="-80%" width="240%" height="280%"><feDropShadow dx="0" dy="11" stdDeviation="9" floodColor="#29281c" floodOpacity=".16"/></filter><linearGradient id={uid(scene.id,'gold')} x1="0" y1="0" x2="1" y2="1"><stop stopColor="#f6e6b0"/><stop offset=".4" stopColor="#c4a466"/><stop offset=".68" stopColor="#f3dfab"/><stop offset="1" stopColor="#a58243"/></linearGradient><linearGradient id={uid(scene.id,'black')} x1="0" y1="0" x2="1" y2="1"><stop stopColor="#35332d"/><stop offset=".5" stopColor="#141813"/><stop offset="1" stopColor="#464337"/></linearGradient></defs>;
const Coin: React.FC<{scene: Scene; x: number; y: number; r?: number; angle?: number; label?: string}> = ({scene,x,y,r=18,angle=0,label='+'}) => <g transform={`translate(${x} ${y}) rotate(${angle*18}) scale(${Math.max(.09,Math.abs(Math.cos(angle)))} 1)`}><ellipse cx={4} cy={2} rx={r} ry={r} fill="#a38440" stroke="#887035"/><circle r={r} fill={`url(#${uid(scene.id,'gold')})`} stroke="#8c753d" strokeWidth={1.2}/><circle r={r*.78} fill="none" stroke="#fff1c3"/><Text x={0} y={r*.3} size={r*.9} anchor="middle" color="#84692d" weight={700}>{label}</Text></g>;

const ObjectArrayFlip: React.FC<EffectProps> = ({scene,t,width,height}) => {
  const list=items(scene), columns=Math.max(2,Math.min(5,scene.content.pack?.columns ?? Math.ceil(Math.sqrt(list.length))));
  const rows=Math.ceil(list.length/columns), cy=height*.47, reveal=point(scene,'reveal',.2), act=point(scene,'act',.55), resolve=point(scene,'resolve',.9);
  const form=out(t,0,reveal), collect=smooth(t,act,resolve), selected=Math.max(0,list.findIndex(i=>i.id===scene.content.selectedId));
  const step=Math.min(107,360/columns), size=step*.78, rowstep=step*.74;
  return <Surface scene={scene} t={t} width={width} height={height}>{defs(scene)}<Heading scene={scene} y={height*.13}/>
    <path d={`M55 ${cy+rows*rowstep*.4+96}Q272 ${cy+rows*rowstep*.4+124} 489 ${cy+rows*rowstep*.4+96}`} fill="none" stroke="#cecabd"/>
    <g transform={`translate(272 ${cy}) rotate(${mix(-7,0,collect)})`}>
      {list.map((item,i)=>{
        const col=i%columns-(columns-1)/2,row=Math.floor(i/columns)-(rows-1)/2;
        const tx=col*step+row*step*.42,ty=row*rowstep+col*step*.16;
        const revealItem=out(t,Math.min(reveal*.65,i*.055),reveal+i*.04);
        const flip=progress(t,mix(reveal,act,(i+.2)/(list.length+1)),mix(reveal,act,(i+.9)/(list.length+1)));
        const theta=flip*Math.PI, turn=Math.cos(theta), back=turn<0;
        const x=mix(Math.sin(i*2.7)*340,tx,revealItem)*(1-collect),y=mix(-height*.6-i*18,ty,revealItem)*(1-collect);
        const landing= i===selected?1:1-smooth(t,mix(act,resolve,.5),resolve);
        const material:Item=back?{...item,video:item.replacementImage?undefined:item.video,image:item.replacementImage ?? item.image,label:item.replacementLabel ?? item.label}:item;
        return <g key={item.id} opacity={revealItem*landing} transform={`translate(${x} ${y}) rotate(${mix((i%3-1)*24,0,form)}) scale(${mix(.6,1,revealItem)*(i===selected?mix(1,2.9,collect):1)})`}>
          <g transform={`matrix(${Math.max(.055,Math.abs(turn))} ${.16*(1-collect)} ${-.34*(1-collect)} ${mix(.75,1,collect)} 0 0)`}>
            <rect x={-size/2+5} y={-size/2+7} width={size} height={size} rx={size*.13} fill={back?'#5b624f':'#463d30'}/>
            <rect x={-size/2} y={-size/2} width={size} height={size} rx={size*.13} fill={back?'#e6ebe0':'#dfd2b9'} stroke="#716d5d" strokeWidth={1.1}/>
            <Media item={material} scene={scene} x={-size*.41} y={-size*.41} w={size*.82} h={size*.82}/>
            <path d={`M${-size*.4} ${-size*.35}Q0 ${-size*.43} ${size*.4} ${-size*.35}`} stroke="white" strokeOpacity=".55" fill="none"/>
          </g>
        </g>;
      })}
    </g>
    <g opacity={smooth(t,act,resolve)}><Text x={272} y={height*.8} size={22} anchor="middle" family={SERIF} weight={700}>{list[selected].replacementLabel ?? list[selected].label}</Text><Text x={272} y={height*.85} size={14} anchor="middle" color="#817c6e">{scene.content.result ?? scene.content.body ?? ''}</Text></g>
  </Surface>;
};

const ComparisonBars: React.FC<EffectProps> = ({scene,t,width,height}) => {
  const list=items(scene), vals=list.map((it,i)=>valueOf(scene,it,i)), max=Math.max(1,...vals), act=point(scene,'act',.58), resolve=point(scene,'resolve',.9), selected=Math.max(0,list.findIndex(i=>i.id===scene.content.selectedId));
  const gap=Math.min(142,(height*.56)/list.length), top=height*.28, barH=Math.min(58,gap*.42), accent=scene.accent??'#b7684c';
  return <Surface scene={scene} t={t} width={width} height={height}><Heading scene={scene} y={height*.16}/>{list.map((item,i)=>{
    const p=out(t,i*act/(list.length+1),act+(i/(list.length+1))*.3), y=top+i*gap, val=vals[i];
    return <g key={item.id} opacity={p}><Text x={60} y={y-14} size={21} weight={600}>{item.label}</Text><rect x={60} y={y} width={424} height={barH} rx={Math.min(12,barH/3)} fill="#e3e1d9"/><rect x={60} y={y} width={Math.max(0,424*val/max*p)} height={barH} rx={Math.min(12,barH/3)} fill={item.color??(i===selected?accent:INK)}/><Text x={484} y={y-15} size={19} anchor="end" color={item.color??accent} weight={700}>{(val*p).toLocaleString('en-US',{maximumFractionDigits:1})}{scene.content.metric?.unit??''}</Text></g>;
  })}<g opacity={smooth(t,act,resolve)}><circle cx={60+424*vals[selected]/max} cy={top+selected*gap+barH/2} r={barH*.8} stroke={accent} strokeWidth={2} fill="none"/><path d={`M${60+424*vals[selected]/max} ${top+selected*gap+barH*1.35}Q300 ${height*.83} 430 ${height*.84}`} stroke={accent} fill="none" strokeWidth={1.5}/><Text x={272} y={height*.9} size={17} anchor="middle" color={accent}>{scene.content.result??scene.content.body??''}</Text></g></Surface>;
};

const PremiumCoins: React.FC<EffectProps> = ({scene,t,width,height}) => {
  const list=items(scene), card=list[0], y=height*.47, act=point(scene,'act',.52), resolve=point(scene,'resolve',.9), p=pop(t,0,point(scene,'reveal',.2)), count=Math.max(3,Math.min(36,scene.content.pack?.density??16)),copy=premiumCopy(scene.content.body??'');
  return <Surface scene={scene} t={t} width={width} height={height}>{defs(scene)}<Heading scene={scene} y={height*.14}/>
    {Array.from({length:count},(_,i)=>{const start=mix(act*.8,resolve*.85,i/count),fall=progress(t,start,Math.min(resolve,start+.8)),x=30+((i*137)%490);return <g key={i} opacity={fall>0&&fall<1?.75:0}><Coin scene={scene} x={x} y={mix(-50,height+50,fall*fall)} r={12+(i%4)*4} angle={fall*7+i}/></g>;})}
    <g transform={`translate(272 ${y}) rotate(${mix(-7,2,smooth(t,0,resolve))}) scale(${p})`} filter={`url(#${uid(scene.id,'sp-shadow')})`}>
      <rect x={-174} y={-150} width={348} height={310} rx={25} fill={`url(#${uid(scene.id,'black')})`}/><rect x={-168} y={-144} width={336} height={298} rx={21} fill="none" stroke="#bba16a"/><rect x={-158} y={-134} width={316} height={278} rx={17} fill="none" stroke="#6e6144" strokeWidth={.8}/>
      <path d="M-145-70L145-120M-125 100L150 20" stroke="#faf0d0" opacity=".055" strokeWidth={30}/>
      <g transform="translate(0 -74)"><path d="M-34 14L-42-18L-15-4L0-31L15-4L42-18L34 14Z" fill={`url(#${uid(scene.id,'gold')})`}/><path d="M-34 22H34" stroke="#d8c38c" strokeWidth={5}/></g>
      <Text x={0} y={8} size={fitted(card.label,276,30)} anchor="middle" color="#e8d7a5" family={SERIF} weight={700}>{card.label}</Text>
      <Text x={0} y={62} size={49} color="#f4e3b8" anchor="middle" weight={700}>{scene.content.metric?`${Math.round(scene.content.metric.value*smooth(t,act*.4,act))}${scene.content.metric.unit}`:scene.content.emphasis??''}</Text>
      <path d="M-125 88H125" stroke="#70634a"/>{copy.lines.map((line,i)=><Text key={i} x={0} y={(copy.lines.length===1?119:111)+i*19} size={copy.size} anchor="middle" color="#c8bb9b">{line}</Text>)}
    </g>
    <g opacity={smooth(t,act,resolve)}><Text x={272} y={height*.83} size={21} anchor="middle" family={SERIF} color={scene.accent??'#a86e45'}>{scene.content.result??''}</Text></g>
  </Surface>;
};

const CostColumns: React.FC<EffectProps> = ({scene,t,width,height}) => {
  const list=items(scene), vals=list.map((it,i)=>valueOf(scene,it,i)), max=Math.max(1,...vals), baseline=height*.81, maxH=height*.5, step=424/list.length,bw=Math.min(118,step*.67),act=point(scene,'act',.64),resolve=point(scene,'resolve',.9);
  return <Surface scene={scene} t={t} width={width} height={height}><Heading scene={scene} y={height*.14}/><path d={`M53 ${baseline}H491`} stroke="#bab5a8" strokeWidth={1.3}/>{list.map((item,i)=>{
    const p=out(t,act*i/(list.length+1)*.7,act+(i/(list.length+1))*.2),h=maxH*vals[i]/max*p,x=60+step*(i+.5),color=item.color??(i===list.length-1?scene.accent??'#b05d4b':INK),left=x-bw/2,right=x+bw/2,top=baseline-h,r=Math.min(13,h/4),dx=Math.min(12,bw*.12)*Math.min(1,h/12),dy=dx*.65;
    const topFace=`M${left+r} ${top}H${right-r}Q${right} ${top} ${right} ${top+r}L${right+dx} ${top+r-dy}Q${right+dx} ${top-dy} ${right+dx-r} ${top-dy}H${left+dx+r}Q${left+dx} ${top-dy} ${left+dx} ${top+r-dy}L${left} ${top+r}Q${left} ${top} ${left+r} ${top}Z`;
    const sideFace=`M${right} ${top+r}L${right+dx} ${top+r-dy}V${baseline-dy}L${right} ${baseline}Z`;
    return <g key={item.id}><path d={topFace} fill={color}/><path d={topFace} fill="white" opacity=".23"/><path d={sideFace} fill={color}/><path d={sideFace} fill="black" opacity=".2"/><rect x={left} y={top} width={bw} height={h} rx={r} fill={color}/><rect x={left} y={baseline-Math.min(12,h)} width={bw} height={Math.min(12,h)} fill={color}/><Text x={x} y={top-dy-17} size={Math.min(39,step*.28)} color={color} anchor="middle" weight={700}>{(vals[i]*p).toLocaleString('en-US',{maximumFractionDigits:1})}{scene.content.metric?.unit??''}</Text><Text x={x} y={baseline+31} size={fitted(item.label,step*.9,19)} anchor="middle" weight={600}>{item.label}</Text></g>;
  })}<g opacity={smooth(t,act,resolve)}><path d={`M60 ${baseline-maxH*vals[0]/max}H484`} stroke="#817a6a" strokeDasharray="4 5"/><Text x={272} y={height*.93} size={18} color={scene.accent??'#af6548'} anchor="middle">{scene.content.result??''}</Text></g></Surface>;
};

const QuotaRing: React.FC<EffectProps> = ({scene,t,width,height}) => {
  const reveal=point(scene,'reveal',.2),act=point(scene,'act',.6),resolve=point(scene,'resolve',.9),percent=Math.max(0,Math.min(100,scene.content.metric?.value??0)),remaining=mix(100,percent,smooth(t,reveal,act)),r=128,circ=2*Math.PI*r,accent=scene.accent??'#b65c44',cy=height*.48,stamp=pop(t,act,resolve);
  return <Surface scene={scene} t={t} width={width} height={height}>{defs(scene)}<Heading scene={scene} y={height*.14}/><g transform={`translate(272 ${cy}) scale(${mix(.8,1,out(t,0,reveal))})`}><circle r={152} fill="#fffefa" filter={`url(#${uid(scene.id,'sp-shadow')})`}/><circle r={r} stroke="#e3e0d6" strokeWidth={23} fill="none"/><circle r={r} stroke={remaining<35?accent:INK} strokeWidth={23} fill="none" strokeLinecap="round" strokeDasharray={`${circ*remaining/100} ${circ}`} transform="rotate(-90)"/>{Array.from({length:30},(_,i)=><path key={i} d="M0-105V-99" stroke="#a29c8f" transform={`rotate(${i*12})`}/>)}<Text x={0} y={17} size={63} color={remaining<35?accent:INK} anchor="middle" weight={700}>{Math.round(remaining)}%</Text><Text x={0} y={51} size={14} anchor="middle" color="#878072">{scene.content.metric?.label??scene.content.items[0]?.label??''}</Text></g><g transform={`translate(272 ${cy+184}) rotate(-8) scale(${stamp})`}><rect x={-128} y={-26} width={256} height={52} rx={4} fill="#fffaf1" stroke={accent} strokeWidth={3}/><rect x={-121} y={-19} width={242} height={38} rx={2} fill="none" stroke={accent}/><Text x={0} y={8} size={fitted(scene.content.result??'额度变化',227,25)} anchor="middle" color={accent} weight={700}>{scene.content.result??'额度变化'}</Text></g></Surface>;
};

const GalleryCamera: React.FC<EffectProps> = ({scene,t,width,height}) => {
  const list=items(scene),cols=Math.max(3,Math.min(7,scene.content.pack?.columns??5)),rows=Math.max(4,Math.ceil(list.length/cols)),reveal=point(scene,'reveal',.25),act=point(scene,'act',.64),resolve=point(scene,'resolve',.94),rise=smooth(t,reveal,act),focus=smooth(t,act,resolve),selected=Math.max(0,list.findIndex(i=>i.id===scene.content.selectedId)),density=Math.min(84,Math.max(list.length,rows*cols)),speed=scene.content.pack?.speed??1;
  const selectedRow=Math.floor(selected/cols),selectedCol=selected%cols,cell=488/cols;
  const selectedX=28+(selectedCol+.5)*cell,selectedY=height*.21+selectedRow*cell*1.12;
  const z=mix(1,2.1,focus),cx=mix(272,selectedX,focus),cy=mix(height*.5,selectedY,focus);
  return <Surface scene={scene} t={t} width={width} height={height}>{defs(scene)}<g transform={`translate(${272-cx*z} ${height*.5-cy*z}) scale(${z})`}>
    {Array.from({length:density},(_,i)=>{const row=Math.floor(i/cols),col=i%cols,near=(row+1)/(Math.ceil(density/cols)+.6),depth=.15+Math.pow(near,1.75)*1.1,xx=mix(272+(col-(cols-1)/2)*132*depth,28+(col+.5)*cell,rise),yy=mix(height*.23+Math.pow(near,2)*height*.72-t*10*speed,height*.21+row*cell*1.12,rise),w=mix(122*depth,cell*.89,rise),h=mix(103*depth*(.68+near*.25),cell,rise),item=list[i%list.length];
      return <g key={i} opacity={mix(.45+near*.55,1,rise)*(1-focus*(i===selected?0:.65))} transform={`translate(${xx} ${yy}) rotate(${mix((col-(cols-1)/2)*-4,0,rise)})`}><rect x={-w/2+2} y={-h/2+4} width={w} height={h} rx={3} fill="#433e2d" opacity=".13"/><Media item={item} scene={scene} x={-w/2} y={-h/2} w={w} h={h} /><rect x={-w/2} y={-h/2} width={w} height={h} rx={3} fill="none" stroke="#fffdf8" strokeWidth={2}/><Text x={0} y={h/2-8} size={Math.max(5,w*.06)} anchor="middle" color={INK}>{item.label}</Text></g>;
    })}
  </g><rect width={544} height={height*.11} fill={scene.background??'#f6f5ef'}/><Heading scene={scene} y={height*.085}/><g opacity={focus}><rect x={36} y={height*.83} width={472} height={height*.12} fill={scene.background??'#f6f5ef'}/><Text x={272} y={height*.885} size={23} anchor="middle" family={SERIF} weight={700}>{scene.content.result??list[selected].label}</Text></g></Surface>;
};

// A deterministic lens map bends the complete page (media + typography + cursor),
// rather than decorating a flat screenshot with an unconnected curved border.
function lensMap() {
  const n=32,size=512,cell=size/n;
  let svg='<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512">';
  for(let y=0;y<n;y++)for(let x=0;x<n;x++){const dx=(x+.5)/n*2-1,dy=(y+.5)/n*2-1,rr=dx*dx+dy*dy;const r=Math.round(128+dx*rr*41),g=Math.round(128+dy*rr*35);svg+=`<rect x="${x*cell}" y="${y*cell}" width="${cell+1}" height="${cell+1}" fill="rgb(${r},${g},128)"/>`;}
  return `data:image/svg+xml,${encodeURIComponent(svg+'</svg>')}`;
}
const LENS=lensMap();
const CurvedScreen: React.FC<EffectProps> = ({scene,t,width,height}) => {
  const list=items(scene),reveal=point(scene,'reveal',.2),act=point(scene,'act',.63),resolve=point(scene,'resolve',.91),z=mix(.88,1.17,smooth(t,0,resolve)),angle=scene.content.pack?.angle??-4,focusX=scene.content.pack?.focusX??272,focusY=scene.content.pack?.focusY??height*.44,selected=Math.max(0,list.findIndex(i=>i.id===scene.content.selectedId)),id=uid(scene.id,'lens');
  return <Surface scene={scene} t={t} width={width} height={height} dark><defs><filter id={id} x="-20%" y="-20%" width="140%" height="140%"><feImage href={LENS} x="-50" y="-50" width="644" height={height+100} preserveAspectRatio="none" result="lens"/><feDisplacementMap in="SourceGraphic" in2="lens" scale={scene.content.pack?.depth??72} xChannelSelector="R" yChannelSelector="G"/></filter><pattern id={`${id}-lines`} width="3" height="3" patternUnits="userSpaceOnUse"><path d="M0 .5H3" stroke="black" strokeOpacity=".1" strokeWidth=".45"/></pattern><radialGradient id={`${id}-vignette`}><stop offset=".48" stopColor="#000" stopOpacity="0"/><stop offset="1" stopColor="#000" stopOpacity=".53"/></radialGradient></defs>
    <g filter={`url(#${id})`} transform={`translate(${272-focusX*z} ${height*.48-focusY*z}) scale(${z}) rotate(${angle} ${272} ${height*.5})`}>
      <rect x={-70} y={-50} width={684} height={height+140} fill={scene.background??'#fafbf6'}/>
      <rect x={-70} y={-50} width={684} height={61} fill="#20291f"/><Text x={28} y={-12} size={14} color="#fbfbee">{scene.content.url??scene.content.kicker??'演示界面'}</Text>
      <Text x={44} y={82} size={19} weight={700}>{scene.content.kicker??list[0].label}</Text><path d="M430 70h46M430 81h46" stroke={INK}/>
      <rect x={48} y={147} width={438*out(t,reveal*.4,reveal)} height={60} fill={scene.accent??'#eee143'} opacity=".82"/><Text x={56} y={194} size={fitted(scene.title,415,49)} weight={800}>{scene.title}</Text>
      <Text x={272} y={253} size={16} anchor="middle" color="#797e71">{scene.content.body??''}</Text>
      {list.map((item,i)=>{const cols=Math.max(2,Math.min(4,scene.content.pack?.columns??3)),cw=440/cols,xx=50+(i%cols)*cw,yy=height*.4+Math.floor(i/cols)*cw*1.14;return <g key={item.id} opacity={out(t,reveal*.5+i*.05,act)}><Media item={item} scene={scene} x={xx} y={yy} w={cw-12} h={cw*.9}/><Text x={xx} y={yy+cw+4} size={12}>{item.label}</Text>{i===selected&&<rect x={xx-4} y={yy-4} width={cw-4} height={cw*.9+8} fill="none" stroke={scene.accent??'#456b46'} strokeWidth={3} opacity={smooth(t,act*.8,act)}/>}</g>;})}
      <g transform={`translate(${mix(490,86,smooth(t,reveal,act))} ${mix(height*.78,height*.42,smooth(t,reveal,act))})`}><circle r={20*progress(t,act,act+.4)} fill="none" stroke="#63785b" opacity={1-progress(t,act,act+.4)}/><path d="M0 0L2 22L8 16L15 28L20 25L13 14L23 11Z" fill={INK} stroke="white" strokeWidth={2}/></g>
    </g><rect width={544} height={height} fill={`url(#${id}-lines)`} pointerEvents="none"/><rect width={544} height={height} fill={`url(#${id}-vignette)`} pointerEvents="none"/>
  </Surface>;
};

export const spatialPack: Record<string, React.FC<EffectProps>> = {
  'object-array-flip':ObjectArrayFlip,
  'comparison-bars':ComparisonBars,
  'premium-coins':PremiumCoins,
  'cost-columns':CostColumns,
  'quota-ring':QuotaRing,
  'gallery-camera':GalleryCamera,
  'curved-screen':CurvedScreen,
};
