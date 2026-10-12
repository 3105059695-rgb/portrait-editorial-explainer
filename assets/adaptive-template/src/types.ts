export type Mechanism = 'object-focus' | 'compare-pan' | 'route-transfer' | 'group-sort' | 'evidence-zoom' | 'metric-build' | 'question-thread' | 'presenter';
export type Action = 'reveal' | 'focus' | 'transfer' | 'group' | 'select' | 'result' | 'count' | 'connect';
export type Kind = 'document' | 'message' | 'folder' | 'device' | 'product' | 'person' | 'coin' | 'chart' | 'image' | 'symbol';
export type Theme = {paper: string; ink: string; accent: string; comic: string};
export type Asset = {id: string; path: string; source?: string; role: 'illustration' | 'evidence' | 'brand'};
export type StoryObject = {id: string; kind: Kind; label: string; detail?: string; assetId?: string};
export type Caption = {id: string; start: number; end: number; text: string};
export type Beat = {at: number; cueId: string; action: Action; targetId: string; withId?: string};
export type Scene = {
  id: string; start: number; end: number; cueIds: string[]; intent: string;
  mechanism: Mechanism; title: string; objectIds: string[]; beats: Beat[];
  transition: 'circle' | 'window' | 'match' | 'cut';
  presenter: 'full' | 'pip' | 'hidden';
  metric?: {value: number; total?: number; unit: string}; evidenceAssetId?: string;
};
export type Episode = {
  version: 2; title: string; width: 1080; height: 1920; fps: 25 | 30 | 50 | 60;
  duration: number; timing: 'measured' | 'estimated' | 'demo';
  renderMode?: 'draft' | 'production';
  source: {type: 'raw-presenter' | 'roughcut-presenter' | 'digital-human' | 'narration' | 'demo'; roughcut: 'pending' | 'done' | 'skipped-digital' | 'not-needed'; tool?: string};
  media: {presenter: string | null; voice: string | null; music?: string | null};
  theme?: Theme; assets: Asset[]; objects: StoryObject[]; captions: Caption[]; scenes: Scene[];
};
