export type Mechanism = 'object-focus' | 'compare-pan' | 'route-transfer' | 'group-sort' | 'evidence-zoom' | 'metric-build' | 'question-thread' | 'presenter';
export type Action = 'reveal' | 'focus' | 'transfer' | 'group' | 'select' | 'result' | 'count' | 'connect';
export type Kind = 'document' | 'message' | 'folder' | 'device' | 'product' | 'person' | 'coin' | 'chart' | 'image' | 'symbol';
export type Theme = {paper: string; ink: string; accent: string; comic: string};
export type Asset = {id: string; path: string; source?: string; role: 'illustration' | 'evidence' | 'brand'};
export type StoryObject = {id: string; kind: Kind; label: string; detail?: string; assetId?: string};
export type Caption = {id: string; start: number; end: number; text: string};
export type Beat = {at: number; cueId: string; action: Action; targetId: string; withId?: string};
/** Editorial coordinates are on a 540 x 960 stage. Keyframe times are scene-local seconds. */
export type EditorialLayerKey = {at: number; x?: number; y?: number; w?: number; h?: number; rotation?: number; scale?: number; opacity?: number};
export type EditorialLayer = {
  id: string; assetId: string; x: number; y: number; w: number; h: number;
  rotation?: number; scale?: number; opacity?: number; keys?: EditorialLayerKey[]; shadow?: boolean; foreground?: boolean;
};
export type EditorialCameraKey = {at: number; x: number; y: number; z: number};
export type EditorialConfig = {
  background: 'paper' | 'ink' | 'comic'; title?: string; eyebrow?: string;
  titleKeys?: {at: number; title: string; eyebrow?: string}[];
  layers: EditorialLayer[]; camera?: EditorialCameraKey[];
  connections?: {id: string; points: {x: number; y: number}[]; start: number; end: number; color?: string; width?: number}[];
  filmstrip?: {assetIds: string[]; x: number; y: number; w: number; h: number; rotation?: number; enterAt: number; settleAt: number; threadAt: number; threadEnd: number};
  evidence?: {assetId: string; title?: string; subtitle?: string; note?: string; noteAt?: number; lensStrength?: number};
};
export type TransitionAnchor = {
  layerId?: string; rect: {x: number; y: number; w: number; h: number};
  space: 'layer' | 'screen'; start: number; duration: number; borderRadius?: number;
};
export type PresenterStyle = {shape: 'portrait' | 'circle'; x?: number; y?: number; w?: number; h?: number; rotation?: number; radius?: number};
export type Scene = {
  id: string; start: number; end: number; cueIds: string[]; intent: string;
  mechanism: Mechanism; title: string; objectIds: string[]; beats: Beat[];
  transition: 'circle' | 'window' | 'match' | 'cut';
  presenter: 'full' | 'pip' | 'hidden';
  metric?: {value: number; total?: number; unit: string}; evidenceAssetId?: string;
  editorial?: EditorialConfig; transitionAnchor?: TransitionAnchor; presenterStyle?: PresenterStyle;
};
export type Episode = {
  version: 2; title: string; width: 1080; height: 1920; fps: 25 | 30 | 50 | 60;
  duration: number; timing: 'measured' | 'estimated' | 'demo';
  renderMode?: 'draft' | 'production';
  source: {type: 'raw-presenter' | 'roughcut-presenter' | 'digital-human' | 'narration' | 'demo'; roughcut: 'pending' | 'done' | 'skipped-digital' | 'not-needed'; tool?: string};
  media: {presenter: string | null; voice: string | null; music?: string | null};
  theme?: Theme; assets: Asset[]; objects: StoryObject[]; captions: Caption[]; scenes: Scene[];
};
