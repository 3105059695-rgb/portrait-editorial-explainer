import {UiStage} from './effects/UiStage';
import React from 'react';
import {AbsoluteFill, Audio, OffthreadVideo, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {PosterRoute, SelectionBuild, UiHandoff} from './effects/WhiteEffects';
import {TokenIntake, CreatorStrip, UploadProgress} from './effects/ComicEffects';
import {smooth} from './motion';
import type {Episode, Scene, EffectProps} from './types';
import './fonts';

const registry: Record<Scene['mechanism'], React.FC<EffectProps>> = {
  'ui-stage': UiStage, 'poster-route': PosterRoute, 'selection-build': SelectionBuild, 'ui-handoff': UiHandoff,
  'token-intake': TokenIntake, 'creator-strip': CreatorStrip, 'upload-progress': UploadProgress,
};

export const Film: React.FC<{episode: Episode}> = ({episode}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = frame / fps, h = 544 * episode.height / episode.width;
  const scenes = episode.scenes.filter(s=>t>=s.start && t<s.end);
  const active = scenes.at(-1) || episode.scenes.at(-1)!;
  const caption = episode.captions.find(c=>t>=c.start && t<c.end);
  const music = episode.media.music;
  return <AbsoluteFill style={{background: active.background || '#f8f9f4'}}>
    {scenes.map(scene => {
      const p = smooth(t, scene.start, scene.start + scene.enter.duration);
      const x = scene.enter.x ?? 50, y = scene.enter.y ?? 50;
      const clipPath = scene.enter.type === 'circle' ? `circle(${p*155}% at ${x}% ${y}%)`
        : scene.enter.type === 'window' ? `inset(${(1-p)*43}% ${(1-p)*43}% round ${(1-p)*36}px)` : undefined;
      const Effect = registry[scene.mechanism];
      return <AbsoluteFill key={scene.id} style={{clipPath,background:scene.background || '#f8f9f4',opacity:scene.presenter==='full' && episode.media.presenter ? 0 : 1}}>
        <svg width="100%" height="100%" viewBox={`0 0 544 ${h}`} style={{overflow:'hidden'}}>
          <Effect scene={scene} t={t-scene.start} width={544} height={h}/>
        </svg>
      </AbsoluteFill>;
    })}
    {episode.media.presenter && active.presenter !== 'hidden' && <OffthreadVideo
      src={staticFile(episode.media.presenter)} muted
      style={active.presenter==='full' ? {width:'100%',height:'100%',objectFit:'cover'} : {
        position:'absolute',width:'23%',height:`${episode.width/episode.height*23}%`,left:'4%',bottom:'12%',
        borderRadius:'50%',objectFit:'cover',boxShadow:'0 8px 24px #20202033',border:'3px solid #fff',
      }}/>}
    {(episode.media.voice || episode.media.presenter) && <Audio src={staticFile((episode.media.voice || episode.media.presenter)!)}/>}
    {music && <Audio src={staticFile(music)} loop volume={f=>0.12*smooth(f/fps,0,0.4)*(1-smooth(f/fps,episode.duration-0.6,episode.duration))}/>}
    {caption && <div style={{position:'absolute',bottom:'5.7%',left:'9%',width:'82%',display:'flex',justifyContent:'center'}}>
      <div style={{fontFamily:'Noto Sans SC',fontSize:episode.width*0.031,fontWeight:600,lineHeight:1.5,textAlign:'center',color:'#28282a',background:'#fffff0ed',borderRadius:3,padding:'3px 10px',boxShadow:'0 2px 5px #2221',whiteSpace:'pre-wrap'}}>{caption.text}</div>
    </div>}
    {episode.source.type==='demo' && <div style={{position:'absolute',top:'1.4%',right:'3%',fontFamily:'Noto Sans SC',fontSize:episode.width*0.016,color:'#65655d'}}>机制校准 · 无声演示</div>}
  </AbsoluteFill>;
};
