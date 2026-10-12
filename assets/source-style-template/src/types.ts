import type {UIPlan} from './ui-types';
export type Mechanism = 'poster-route' | 'selection-build' | 'ui-handoff' | 'token-intake' | 'creator-strip' | 'upload-progress' | 'ui-stage'
 | 'feed-montage' | 'magazine-collage' | 'code-editor' | 'idea-burst' | 'document-write' | 'reference-search' | 'code-build' | 'prompt-substitute' | 'kinetic-type' | 'challenge-split' | 'rejection-grid' | 'workflow-route'
 | 'object-array-flip' | 'comparison-bars' | 'premium-coins' | 'cost-columns' | 'quota-ring' | 'gallery-camera' | 'curved-screen'
 | 'window-detail' | 'unlock-reveal' | 'repository-copy' | 'prompt-send' | 'result-compare' | 'phone-focus' | 'curation-stamp' | 'reward-transfer' | 'media-stage'
 | 'creator-filmstrip' | 'upload-beam' | 'remix-cube' | 'microphone-swing' | 'robot-meter' | 'coin-growth' | 'question-bounce' | 'consumable-ban' | 'luxury-dome' | 'sharing-network' | 'celebration-type';
export interface Item {
  id: string; label: string; color?: string; image?: string;
  replacementImage?: string; replacementLabel?: string;
  value?: number; video?: string; trimStart?: number; playbackRate?: number; fit?: 'cover' | 'contain';
  shape?: 'circle' | 'square' | 'diamond' | 'person' | 'chip' | 'cup' | 'coin';
}
export interface Scene {
  id: string; start: number; end: number; mechanism: Mechanism;
  intent: string; title: string; accent?: string; background?: string;
  presenter: 'hidden' | 'pip' | 'full';
  // All marks are local seconds at which an action reaches its semantic result.
  marks: Record<string, number>;
  markCues?: Record<string, string>;
  camera?: {at:number;x:number;y:number;scale:number;rotate?:number}[];
  sounds?: {at:number;name:'whoosh'|'tick'|'pop'|'chime'|'drop';volume?:number}[];
  content: {
    ui?: UIPlan; items: Item[]; selectedId?: string; body?: string; code?: string; emphasis?: string;
    prompt?: string; url?: string; result?: string; avatar?: string;
    metric?: {value: number; unit: string; label: string; events?: number};
    kicker?: string; values?: number[];
    pack?: {columns?:number;density?:number;angle?:number;direction?:'left'|'right'|'up'|'down';depth?:number;focusX?:number;focusY?:number;speed?:number;showTitle?:boolean;labels?:string[]};
  };
  enter: {type: 'cut' | 'circle' | 'window'; duration: number; x?: number; y?: number};
}
export interface Caption {id: string; start: number; end: number; text: string}
export interface Episode {
  version: 3; title: string; width: number; height: number; fps: number; duration: number;
  timing: 'measured' | 'demo';
  source: {type: 'raw-presenter' | 'roughcut-presenter' | 'digital-human' | 'narration' | 'demo'; roughcut: 'pending' | 'done' | 'skipped-digital' | 'not-needed'; tool?: string; mapping?: string};
  media: {voice?: string; presenter?: string; music?: string};
  sample: {duration: number; reason: string};
  captions: Caption[]; scenes: Scene[];
}
/** Effects draw in an SVG coordinate system of width 544. Height is 720 or 967.11.
 * Keep object proportions; reflow using height, never stretch a 3:4 screenshot to 9:16.
 * t is local time and remains advancing while the incoming world is revealed. */
export interface EffectProps {scene: Scene; t: number; width: number; height: number}
