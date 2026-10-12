import React from 'react';
import {AbsoluteFill, Audio, OffthreadVideo, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import type {Episode, Scene} from './types';
import {DEFAULT_THEME, SceneView} from './SceneView';
import {EditorialScene} from './EditorialScene';
import {editorialLayerScreenRect, expandQuad, roundedQuadPath} from './editorialMotion';
import {cameraAt, clamp, mix, objectPoses, smooth, sortedBeats, toScreen} from './timeline';
import './fonts';

const presenterBox = (scene: Scene) => {
  if (scene.presenter === 'full') return {x: 0, y: 0, w: 540, h: 960, radius: 0, rotation: 0, alpha: 1};
  const style = scene.presenterStyle, portrait = style?.shape === 'portrait' || (!style && Boolean(scene.editorial));
  const w = style?.w ?? 126, h = style?.h ?? (portrait ? 165 : 126);
  return {x: style?.x ?? (portrait ? 24 : 27), y: style?.y ?? (portrait ? 678 : 702), w, h, radius: style?.radius ?? (portrait ? 18 : Math.min(w, h) / 2), rotation: style?.rotation ?? (portrait ? -5 : 0), alpha: scene.presenter === 'pip' ? 1 : 0};
};
const usesEditorialPresenter = (scene: Scene) => Boolean(scene.editorial || scene.presenterStyle || scene.transitionAnchor);
const revealsNext = (scene: Scene) => scene.transition === 'circle' || scene.transition === 'window';

const PresenterPlaceholder: React.FC<{pip: boolean; paper: string; ink: string; accent: string}> = ({pip, paper, ink, accent}) => <div style={{position: 'absolute', inset: 0, background: ink, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: paper, textAlign: 'center', fontFamily: '"Noto Sans SC", sans-serif'}}>
  <svg viewBox="0 0 120 142" style={{width: pip ? '40%' : 116, maxHeight: '42%', marginBottom: pip ? 4 : 25}}><rect x="3" y="3" width="114" height="136" rx="16" fill="none" stroke={paper} strokeWidth="2" strokeDasharray="7 7" opacity=".35"/><circle cx="60" cy="51" r="20" fill="none" stroke={paper} strokeWidth="2" opacity=".6"/><path d="M24 116V105C24 69 96 69 96 105V116" fill="none" stroke={paper} strokeWidth="2" opacity=".6"/><path d="M94 18l7 7-7 7" fill="none" stroke={accent} strokeWidth="3"/></svg>
  <div style={{fontSize: pip ? 11 : 24, fontWeight: 700}}>人物素材占位</div>
  {!pip && <div style={{fontSize: 13, opacity: .63, marginTop: 12}}>草案 · 未接入人物视频</div>}
</div>;

export const Film: React.FC<{episode: Episode}> = ({episode}) => {
  const frame = useCurrentFrame(), {fps} = useVideoConfig(), t = frame / fps;
  const theme = {...DEFAULT_THEME, ...episode.theme};
  const foundScene = episode.scenes.findIndex(s => t >= s.start && t < s.end);
  const sceneIndex = foundScene >= 0 ? foundScene : t >= episode.duration ? episode.scenes.length - 1 : 0;
  const scene = episode.scenes[sceneIndex], previous = episode.scenes[sceneIndex - 1], next = episode.scenes[sceneIndex + 1];
  const caption = episode.captions.find(c => t >= c.start && t < c.end);
  const isDraft = episode.renderMode === 'draft' || episode.timing !== 'measured' || episode.source.type === 'demo' || !episode.media.voice || (['raw-presenter', 'roughcut-presenter', 'digital-human'].includes(episode.source.type) && !episode.media.presenter);
  const canReveal = Boolean(next && revealsNext(scene));
  const transitionDuration = scene.transitionAnchor?.duration ?? Math.min(.46, (scene.end - scene.start) * .28, next ? (next.end - next.start) * .3 : 1);
  const transitionStart = scene.transitionAnchor ? scene.start + scene.transitionAnchor.start : scene.end - transitionDuration;
  const reveal = canReveal ? smooth(t, transitionStart, transitionStart + transitionDuration) : 0;
  const revealStarted = canReveal && t >= transitionStart;
  // Editorial reveals shrink the presenter during the outgoing shot, not after the new world arrives.
  const carriedPresenter = previous && revealsNext(previous) && usesEditorialPresenter(previous);
  let fromBox = presenterBox(carriedPresenter ? scene : previous ?? scene), toBox = presenterBox(scene);
  let presenterProgress = previous && !carriedPresenter ? smooth(t, scene.start, scene.start + Math.min(.38, (scene.end - scene.start) * .3)) : 1;
  if (next && canReveal && usesEditorialPresenter(scene) && t >= transitionStart) {fromBox = presenterBox(scene); toBox = presenterBox(next); presenterProgress = reveal;}
  const box = {x: mix(fromBox.x, toBox.x, presenterProgress), y: mix(fromBox.y, toBox.y, presenterProgress), w: mix(fromBox.w, toBox.w, presenterProgress), h: mix(fromBox.h, toBox.h, presenterProgress), radius: mix(fromBox.radius, toBox.radius, presenterProgress), rotation: mix(fromBox.rotation, toBox.rotation, presenterProgress), alpha: mix(fromBox.alpha, toBox.alpha, presenterProgress)};
  const pipness = clamp((540 - box.w) / (540 - 126));
  const beats = sortedBeats(scene);
  const pivotId = beats[beats.length - 1]?.targetId ?? scene.objectIds[0];
  const pivotPose = objectPoses(scene, t)[pivotId];
  const rawPivot = pivotPose ? toScreen(pivotPose, cameraAt(scene, t)) : {x: 270, y: 470};
  const pivot = {x: Math.max(85, Math.min(455, rawPivot.x)), y: Math.max(190, Math.min(710, rawPivot.y))};
  const windowX = mix(pivot.x - 44, 0, reveal), windowY = mix(pivot.y - 32, 0, reveal), windowW = mix(88, 540, reveal), windowH = mix(64, 960, reveal);
  const quad = scene.transitionAnchor ? editorialLayerScreenRect(scene, t, scene.transitionAnchor) : undefined;
  const anchorCenter = quad ? {x: quad.reduce((sum, point) => sum + point.x, 0) / 4, y: quad.reduce((sum, point) => sum + point.y, 0) / 4} : pivot;
  const anchorRadius = quad ? Math.min(Math.hypot(quad[1].x - quad[0].x, quad[1].y - quad[0].y), Math.hypot(quad[3].x - quad[0].x, quad[3].y - quad[0].y)) / 2 : 0;
  const circleRadius = quad ? mix(anchorRadius, Math.max(...[{x: 0, y: 0}, {x: 540, y: 0}, {x: 540, y: 960}, {x: 0, y: 960}].map(p => Math.hypot(p.x - anchorCenter.x, p.y - anchorCenter.y))) + 5, reveal) : reveal * 1150;
  const mask = scene.transition === 'circle' ? `circle(${circleRadius}px at ${anchorCenter.x}px ${anchorCenter.y}px)` : quad ? `path('${roundedQuadPath(expandQuad(quad, reveal), (scene.transitionAnchor?.borderRadius ?? 6) * (1 - reveal))}')` : `inset(${windowY}px ${540 - windowX - windowW}px ${960 - windowY - windowH}px ${windowX}px round ${mix(8, 0, reveal)}px)`;
  const editorialCaption = Boolean(scene.editorial);
  const captionWorld = next && reveal > .08 ? next : scene;
  const captionPlate = !editorialCaption || captionWorld.editorial?.background === 'comic' || (revealStarted && reveal < 1);
  const captionLight = !captionPlate && (scene.presenter === 'full' || captionWorld.editorial?.background === 'ink');
  return <AbsoluteFill style={{background: theme.paper}}>
    {/* One absolute audio/video clock. These components never sit inside a scene Sequence. */}
    {episode.media.voice && <Audio src={staticFile(episode.media.voice)}/>}
    {episode.media.music && <Audio src={staticFile(episode.media.music)} volume={.14}/>}
    <div style={{position: 'absolute', width: 540, height: 960, transform: 'scale(2)', transformOrigin: 'top left', overflow: 'hidden', fontFamily: '"Noto Sans SC", sans-serif', color: theme.ink}}>
      <SceneView episode={episode} scene={scene} t={t} previous={previous}/>
      {next && revealStarted && <>
        <div style={{position: 'absolute', inset: 0, clipPath: mask}}><SceneView episode={episode} scene={next} t={t} previous={scene}/></div>
        {scene.transition === 'circle' && <svg width="540" height="960" style={{position: 'absolute', inset: 0, pointerEvents: 'none'}}><circle cx={anchorCenter.x} cy={anchorCenter.y} r={circleRadius} fill="none" stroke={theme.ink} strokeWidth="3"/></svg>}
      </>}
      {/* Stable presenter plane: no lens distortion, world camera, or scene-local time reset. */}
      <div style={{position: 'absolute', zIndex: 10, left: box.x, top: box.y, width: box.w, height: box.h, borderRadius: box.radius, transform: `rotate(${box.rotation}deg)`, overflow: 'hidden', opacity: box.alpha, boxShadow: pipness > .03 ? `0 0 0 ${3 * pipness}px ${theme.paper},${3 * pipness}px ${5 * pipness}px 0 ${theme.ink},0 ${11 * pipness}px ${18 * pipness}px #14181238` : undefined}}>
        {episode.media.presenter ? <OffthreadVideo src={staticFile(episode.media.presenter)} muted style={{width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center top'}}/> : <PresenterPlaceholder pip={pipness > .75} {...theme}/>}
      </div>
      {scene.editorial?.layers.some(layer => layer.foreground) && <div style={{position: 'absolute', inset: 0, zIndex: 11, pointerEvents: 'none'}}><EditorialScene episode={episode} scene={scene} t={t} foreground/></div>}
      {next?.editorial?.layers.some(layer => layer.foreground) && revealStarted && <div style={{position: 'absolute', inset: 0, zIndex: 12, clipPath: mask, pointerEvents: 'none'}}><EditorialScene episode={episode} scene={next} t={t} foreground/></div>}
      <svg width="540" height="960" style={{position: 'absolute', inset: 0, zIndex: 14, opacity: .019, pointerEvents: 'none'}}><filter id="adaptive-paper-grain"><feTurbulence type="fractalNoise" baseFrequency=".72" numOctaves="2" seed="31"/></filter><rect width="540" height="960" filter="url(#adaptive-paper-grain)"/></svg>
      {isDraft && <div style={{position: 'absolute', zIndex: 25, left: 24, top: 20, padding: '4px 9px', border: `1px solid ${theme.ink}33`, borderRadius: 3, background: `${theme.paper}E8`, fontSize: 11, fontWeight: 600, letterSpacing: .7}}>草案 / 示意{episode.timing === 'estimated' ? ' · 时间待实测' : ''}</div>}
      {caption && <div style={{position: 'absolute', zIndex: 30, left: 28, right: 28, top: editorialCaption ? 867 : 861, textAlign: 'center', fontSize: caption.text.length > 44 ? 21 : 23, fontWeight: 700, lineHeight: 1.5, textWrap: 'pretty', fontFamily: editorialCaption && !captionLight ? '"Noto Serif SC", serif' : '"Noto Sans SC", sans-serif', color: captionLight ? '#fffaf0' : theme.ink, textShadow: captionLight ? '0 2px 5px #000a' : undefined}}><span style={{background: captionPlate ? `${theme.paper}F2` : undefined, padding: captionPlate ? '3px 8px 5px' : 0, boxDecorationBreak: 'clone', WebkitBoxDecorationBreak: 'clone', borderRadius: 3, boxShadow: captionPlate ? `0 3px 0 ${theme.ink}25` : undefined}}>{caption.text}</span></div>}
    </div>
  </AbsoluteFill>;
};
