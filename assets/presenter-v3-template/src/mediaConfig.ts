/**
 * All strings are paths relative to public/. No absolute machine paths or URLs.
 * The default project is a silent mechanism example, not a finished new episode.
 * The presenter remains muted: use voiceTrack for the single authoritative audio.
 * Prepare the reference image on a 2992 x 1060 canvas, with one subject per half.
 */
export type MediaConfig = {
  presenterVideo: string | null;
  voiceTrack: string | null;
  referenceImage: string;
};

export const mediaConfig: MediaConfig = {
  presenterVideo: null,
  voiceTrack: null,
  referenceImage: 'media/interview-placeholder.svg',
};
