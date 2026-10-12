import React from 'react';
import {Composition} from 'remotion';
import {Film} from './Film';
import rawEpisode from './episode.json';
import type {Episode} from './types';

const episode = rawEpisode as Episode;
if (episode.version !== 2 || !Number.isFinite(episode.duration) || episode.duration <= 0 || ![25, 30, 50, 60].includes(episode.fps) || !episode.scenes?.length) {
  throw new Error('Invalid v2 episode. Compile a storyboard with scripts/compile_storyboard.py before rendering.');
}
export const Root: React.FC = () => <Composition
  id="AdaptivePortrait"
  component={Film}
  width={episode.width}
  height={episode.height}
  fps={episode.fps}
  durationInFrames={Math.ceil(episode.duration * episode.fps)}
  defaultProps={{episode}}
/>;
