import React from 'react';
import {Composition} from 'remotion';
import {Film} from './Film';
import data from './episode.json';
import type {Episode} from './types';
// Python validates the JSON contract before every render. Heterogeneous mark maps
// inferred by TypeScript contain optional keys, which need this boundary cast.
const episode = data as unknown as Episode;
export const Root: React.FC = () => <Composition id="SourceStyle" component={Film}
  width={episode.width} height={episode.height} fps={episode.fps}
  durationInFrames={Math.ceil(episode.duration*episode.fps)} defaultProps={{episode}}/>;
