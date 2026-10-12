import React from 'react';
import {Composition} from 'remotion';
import {SyncedFilm} from './SyncedFilm';
export const Root:React.FC=()=><Composition id="ApprovedReference" component={SyncedFilm} durationInFrames={1800} fps={30} width={816} height={1080}/>;
