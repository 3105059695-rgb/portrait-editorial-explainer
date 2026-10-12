import React from 'react';
import {Composition} from 'remotion';
import {FilmV3} from './FilmV3';

export const Root: React.FC = () => <Composition
  id="PresenterEditorialV3"
  component={FilmV3}
  width={1080}
  height={1920}
  fps={50}
  durationInFrames={537}
/>;
