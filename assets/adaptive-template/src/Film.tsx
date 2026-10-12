import React from 'react';
import {AbsoluteFill, Audio, OffthreadVideo, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import type {Episode, Scene} from './types';
import {DEFAULT_THEME, SceneView} from './SceneView';
import {cameraAt, clamp, mix, objectPoses, smooth, sortedBeats, toScreen} from './timeline';
import './fonts';

const presenterBox = (mode: Scene['presenter']) => mode === 'full' ? {x: 0, y: 0, w: 540, h: 960, radius: 0, alpha: 1} : {x: 27, y: 702, w: 126, h: 126, radius: 63, alpha: mode === 'pip' ? 1 : 0};

const PresenterPlaceholder: React.FC<{pip: boolean; paper: string; ink: string; accent: string}> = ({pip, paper, ink, accent}) => <div style={{position: 'absolute', inset: 0, background: ink, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: paper, textAlign: 'center', fontFamily: '"Noto Sans SC", sans-serif'}}>
  <svg viewBox="0 0 120 142" style={{width: pip ? '40%' : 116, maxHeight: '42%', marginBottom: pip ? 4 : 25}}><rect x="3" y="3" width="114" height="136" rx="16" fill="none" stroke={paper} strokeWidth="2" strokeDasharray="7 7" opacity=".35"/><circle cx="60" cy="51" r="20" fill="none" stroke={paper} strokeWidth="2" opacity=".6"/><path d="M24 116V105C24 69 96 69 96 105V116" fill="none" stroke={paper} strokeWidth="2" opacity=".6"/><path d="M94 18l7 7-7 7" fill="none" stroke={accent} strokeWidth="3"/></svg>
  <div style={{fontSize: pip ? 11 : 24, fontWeight: 700}}>人物素材占位</div>
  {!pip && <div style={{fontSize: 13, opacity: .63, marginTop: 12}}>草案 · 未接入人物视频</div>}
</div>;

export const Film: React.FC<{episode: Episode}> = ({episode}) => {
  const frame = useCurrentFrame(), {fps} = useVideoConfig(), t = frame / fps;
  const theme = {...DEFAULT_THEME, ...episode.theme};
  const sceneIndex = Math.max(0, episode.scenes.findIndex(s => t >= s.start && t < s.end));
  const scene = episode.scenes[sceneIndex], previous = episode.scenes[sceneIndex - 1], next = episode.scenes[sceneIndex + 1];
  const caption = episode.captions.find(c => t >= c.start && t < c.end);
  const presenterProgress = previous ? smooth(t, scene.start, scene.start + Math.min(.38, (scene.end - scene.start) * .3)) : 1;
  const fromBox = presenterBox(previous?.presenter ?? scene.presenter), toBox = presenterBox(scene.presenter);
  const box = {x: mix(fromBox.x, toBox.x, presenterProgress), y: mix(fromBox.y, toBox.y, presenterProgress), w: mix(fromBox.w, toBox.w, presenterProgress), h: mix(fromBox.h, toBox.h, presenterProgress), radius: mix(fromBox.radius, toBox.radius, presenterProgress), alpha: mix(fromBox.alpha, toBox.alpha, presenterProgress)};
  const pipness = clamp((540 - box.w) / (540 - 126));
  const isDraft = episode.renderMode === 'draft' || episode.timing !== 'measured' || episode.source.type === 'demo' || !episode.media.voice || (['raw-presenter', 'roughcut-presenter', 'digital-human'].includes(episode.source.type) && !episode.media.presenter);
  const canReveal = next && (scene.transition === 'circle' || scene.transition === 'window');
  const transitionDuration = Math.min(.46, (scene.end - scene.start) * .28, next ? (next.end - next.start) * .3 : 1);
  const reveal = canReveal ? smooth(t, scene.end - transitionDuration, scene.end) : 0;
  const beats = sortedBeats(scene);
  const pivotId = beats[beats.length - 1]?.targetId ?? scene.objectIds[0];
  const pivotPose = objectPoses(scene, t)[pivotId];
  const rawPivot = pivotPose ? toScreen(pivotPose, cameraAt(scene, t)) : {x: 270, y: 470};
  const pivot = {x: Math.max(85, Math.min(455, rawPivot.x)), y: Math.max(190, Math.min(710, rawPivot.y))};
  const windowX = mix(pivot.x - 44, 0, reveal), windowY = mix(pivot.y - 32, 0, reveal), windowW = mix(88, 540, reveal), windowH = mix(64, 960, reveal);
  const mask = scene.transition === 'circle' ? `circle(${reveal * 1150}px at ${pivot.x}px ${pivot.y}px)` : `inset(${windowY}px ${540 - windowX - windowW}px ${960 - windowY - windowH}px ${windowX}px round ${mix(8, 0, reveal)}px)`;
  return <AbsoluteFill style={{background: theme.paper}}>
    {/* One absolute audio/video clock. These components never sit inside a scene Sequence. */}
    {episode.media.voice && <Audio src={staticFile(episode.media.voice)}/>}
    {episode.media.music && <Audio src={staticFile(episode.media.music)} volume={.14}/>}
    <div style={{position: 'absolute', width: 540, height: 960, transform: 'scale(2)', transformOrigin: 'top left', overflow: 'hidden', fontFamily: '"Noto Sans SC", sans-serif', color: theme.ink}}>
      <SceneView episode={episode} scene={scene} t={t} previous={previous}/>
      {canReveal && reveal > 0 && <>
        <div style={{position: 'absolute', inset: 0, clipPath: mask}}><SceneView episode={episode} scene={next} t={next.start} previous={scene}/></div>
        {scene.transition === 'circle' && <svg width="540" height="960" style={{position: 'absolute', inset: 0, pointerEvents: 'none'}}><circle cx={pivot.x} cy={pivot.y} r={reveal * 1150} fill="none" stroke={theme.ink} strokeWidth="3"/></svg>}
      </>}
      {/* Stable presenter plane: no lens distortion, world camera, or scene-local time reset. */}
      <div style={{position: 'absolute', zIndex: 10, left: box.x, top: box.y, width: box.w, height: box.h, borderRadius: box.radius, overflow: 'hidden', opacity: box.alpha, boxShadow: pipness > .03 ? `0 0 0 ${3 * pipness}px ${theme.paper},${3 * pipness}px ${5 * pipness}px 0 ${theme.ink},0 ${11 * pipness}px ${18 * pipness}px #14181238` : undefined}}>
        {episode.media.presenter ? <OffthreadVideo src={staticFile(episode.media.presenter)} muted style={{width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center top'}}/> : <PresenterPlaceholder pip={pipness > .75} {...theme}/>}
      </div>
      <svg width="540" height="960" style={{position: 'absolute', inset: 0, zIndex: 14, opacity: .019, pointerEvents: 'none'}}><filter id="adaptive-paper-grain"><feTurbulence type="fractalNoise" baseFrequency=".72" numOctaves="2" seed="31"/></filter><rect width="540" height="960" filter="url(#adaptive-paper-grain)"/></svg>
      {isDraft && <div style={{position: 'absolute', zIndex: 25, left: 24, top: 20, padding: '4px 9px', border: `1px solid ${theme.ink}33`, borderRadius: 3, background: `${theme.paper}E8`, fontSize: 11, fontWeight: 600, letterSpacing: .7}}>草案 / 示意{episode.timing === 'estimated' ? ' · 时间待实测' : ''}</div>}
      {caption && <div style={{position: 'absolute', zIndex: 30, left: 28, right: 28, top: 861, textAlign: 'center', fontSize: caption.text.length > 44 ? 21 : 23, fontWeight: 700, lineHeight: 1.5, textWrap: 'pretty', color: theme.ink}}><span style={{background: `${theme.paper}F2`, padding: '3px 8px 5px', boxDecorationBreak: 'clone', WebkitBoxDecorationBreak: 'clone', borderRadius: 3, boxShadow: `0 3px 0 ${theme.ink}25`}}>{caption.text}</span></div>}
    </div>
  </AbsoluteFill>;
};
