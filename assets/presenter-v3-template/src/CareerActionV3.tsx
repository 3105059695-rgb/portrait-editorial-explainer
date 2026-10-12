import React from 'react';
import {staticFile} from 'remotion';
import {CompanyV2, PropsDefsV2} from './PropsV2';

const ink = '#20211f';
const rust = '#b65c3e';
const sans = '"Noto Sans SC", sans-serif';
const serif = '"Noto Serif SC", serif';
const clamp = (v: number) => Math.min(1, Math.max(0, v));
const smooth = (t: number, a: number, b: number) => {
  const p = clamp((t - a) / (b - a));
  return p * p * (3 - 2 * p);
};
const mix = (a: number, b: number, p: number) => a + (b - a) * p;
const backOut = (p: number) => {
  const x = clamp(p) - 1;
  return 1 + 2.15 * x * x * x + 1.15 * x * x;
};

/** Absolute seconds, 540 × 960 logical stage. The portrait and captions live above this layer. */
export const CareerActionV3: React.FC<{t: number}> = ({t}) => {
  const title = smooth(t, 4.22, 4.47);
  const question = backOut((t - 4.63) / 0.27);
  const destination = smooth(t, 4.47, 4.82);
  const route = smooth(t, 4.91, 5.38);
  const travel = smooth(t, 5.28, 5.88);
  const bagX = mix(142, 391, travel);
  const bagY = 504 - Math.sin(travel * Math.PI) * 82;
  const bagRotation = -6 + 17 * Math.sin(travel * Math.PI) - 2 * travel;
  const settle = smooth(t, 5.88, 6.04);
  const arrival = backOut((t - 5.86) / 0.19);
  const window = smooth(t, 6.14, 6.32);
  // The black suitcase face becomes the next scene's black interview viewport.
  // It finishes at x0/y0/w540/h960 at 6.32; no independent circle wipe.
  const windowX = mix(bagX - 79, 0, window);
  const windowY = mix(bagY - 18, 0, window);
  const windowW = mix(153, 540, window);
  const windowH = mix(86, 960, window);

  return <svg width="540" height="960" viewBox="0 0 540 960" style={{position: 'absolute', inset: 0, overflow: 'hidden'}}>
    <defs>
      <PropsDefsV2 />
      <linearGradient id="v3-action-bag-front" x1="0" y1="0" x2="0.8" y2="1">
        <stop stopColor="#fff5d7" /><stop offset="0.65" stopColor="#e9d5a5" /><stop offset="1" stopColor="#c8b080" />
      </linearGradient>
      <linearGradient id="v3-action-bag-side" x1="0" y1="0" x2="1" y2="0">
        <stop stopColor="#728d82" /><stop offset="1" stopColor="#c3d5c4" />
      </linearGradient>
      <linearGradient id="v3-action-metal" x1="0" y1="0" x2="1" y2="1">
        <stop stopColor="#fff9e9" /><stop offset="0.38" stopColor="#c7b582" /><stop offset="0.61" stopColor="#fff8db" /><stop offset="1" stopColor="#9b8758" />
      </linearGradient>
      <marker id="v3-action-arrow" viewBox="0 0 14 14" refX="11" refY="7" markerWidth="4.8" markerHeight="4.8" orient="auto">
        <path d="M1 1 12 7 1 13" fill="none" stroke={ink} strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" />
      </marker>
      <clipPath id="v3-action-title-reveal"><rect x="25" y="84" width={490 * title} height="78" /></clipPath>
    </defs>
    <rect width="540" height="960" fill="#f7f7f3" />

    <g opacity={1 - window}>
      <text x="35" y="148" fontFamily={serif} fontSize="49" fontWeight="700" fill={ink} clipPath="url(#v3-action-title-reveal)">为什么还想</text>
      <path d={`M37 169 Q190 ${181 - title * 8} ${37 + 269 * title} 168`} fill="none" stroke={rust} strokeWidth="4" strokeLinecap="round" opacity={title} />
      <g transform={`translate(455 154) rotate(${mix(-19, 10, question)}) scale(${question})`}>
        <text x="0" y="8" textAnchor="middle" fill={rust} fontFamily={serif} fontSize="103" fontWeight="700">?</text>
      </g>

      {/* Two persistent destinations make the change of intention spatially legible. */}
      <g transform="translate(108 369) scale(.86)"><CompanyV2 t={0} /></g>
      <text x="32" y="237" fontFamily={sans} fontSize="17" fontWeight="700" fill={ink}>自己的公司</text>
      <path d="M36 249 H129" stroke={ink} strokeWidth="1.5" opacity=".32" />

      <g transform={`translate(${mix(592, 346, destination)} 248)`}>
        <path d="M0 14 154 0 181 20 28 34Z" fill="#f3eddc" stroke={ink} strokeWidth="2.5" />
        <path d="M154 0 181 20 181 207 154 187Z" fill="#adc4b7" stroke={ink} strokeWidth="2.5" />
        <path d="M0 14 154 0 154 187 0 201Z" fill="#e9eee5" stroke={ink} strokeWidth="2.7" />
        <path d="M11 24 142 12 142 174 11 186Z" fill="#fcfcf7" stroke="#6f7e73" strokeWidth="1.2" />
        <path d="M40 111 107 105 107 178 40 184Z" fill="#20211f" stroke={ink} strokeWidth="2" />
        <path d="M44 116 73 113 73 180 44 182Z" fill="#bbcbbf" />
        <path d="M78 113 102 111 102 177 78 179Z" fill="#e1e8dc" />
        <path d="M68 143v14 M83 142v14" stroke={ink} strokeWidth="2" />
        <path d="M0 201 154 187 169 195 14 209Z" fill="#dad9ca" stroke={ink} strokeWidth="2" />
        <g transform="translate(7 27) rotate(-5)">
          <rect x="-6" y="-4" width="153" height="61" rx="2" fill="#fffef8" stroke={ink} strokeWidth="2.5" />
          <svg x="2" y="1" width="133" height="46" viewBox="200 200 1204 380">
            <image href={staticFile('media/openai-wordmark.svg')} width="1604" height="718" />
          </svg>
        </g>
        <text x="71" y="-18" textAnchor="middle" fontFamily={sans} fontSize="14" fill="#555b53">意向 · 示意</text>
      </g>

      {/* One bent route; a slight curve is allowed to overshoot the front of the scene. */}
      <path d="M156 379 C190 270 315 273 368 364" fill="none" stroke={ink} strokeWidth="4.6" strokeLinecap="round" pathLength="1" strokeDasharray="1" strokeDashoffset={1 - route} markerEnd={route > .985 ? 'url(#v3-action-arrow)' : undefined} />
      <text x="264" y="268" textAnchor="middle" fontFamily={sans} fontSize="14" fill={ink} opacity={smooth(t, 5.02, 5.20)}>还惦记着</text>

      <ellipse cx={bagX + 4} cy="583" rx={mix(61, 79, settle)} ry={mix(6, 10, settle)} fill={ink} opacity={.08 + .07 * settle} />
      {/* The briefcase has visible side, rim, handle and latch; it is the transition object. */}
      <g transform={`translate(${bagX} ${bagY}) rotate(${bagRotation * (1 - settle)})`}>
        <path d="M-39 -40 V-63 Q-39 -79 -21 -79 H24 Q40 -79 40 -63 V-40" fill="none" stroke={ink} strokeWidth="11" strokeLinejoin="round" />
        <path d="M-39 -40 V-63 Q-39 -79 -21 -79 H24 Q40 -79 40 -63 V-40" fill="none" stroke="#bfa26e" strokeWidth="5" strokeLinejoin="round" />
        <path d="M-87 -35 77 -49 97 -30 97 67 77 79-87 67Z" fill="url(#v3-action-bag-side)" stroke={ink} strokeWidth="3.1" strokeLinejoin="round" />
        <path d="M-87 -35 77 -49 97 -30 -67 -16Z" fill="#eee2bd" stroke={ink} strokeWidth="2.5" />
        <rect x="-87" y="-35" width="164" height="114" rx="10" fill="url(#v3-action-bag-front)" stroke={ink} strokeWidth="3.5" />
        <rect x="-79" y="-18" width="153" height="86" rx="6" fill="#20211f" />
        <path d="M-80 -27 H65" stroke="#fff9e6" strokeWidth="2" />
        <path d="M-83 10H73" stroke="#8a7d5c" strokeWidth="1" />
        <path d="M80 -28 90 -23 90 63 81 69Z" fill="#e2e8cb" opacity=".7" />
        <rect x="-59" y="-24" width="18" height="24" rx="2" fill="url(#v3-action-metal)" stroke={ink} strokeWidth="1.7" />
        <rect x="32" y="-24" width="18" height="24" rx="2" fill="url(#v3-action-metal)" stroke={ink} strokeWidth="1.7" />
        <path d="M-50 -20v13 M41 -20v13" stroke="#5d593f" strokeWidth="1" />
        <text x="-3" y="33" textAnchor="middle" fontFamily={sans} fontWeight="700" fontSize="19" fill="#f7f5e8">换个身份</text>
        <path d="M-36 45 H30" stroke="#ecdfb8" strokeWidth="1" opacity=".7" />
      </g>

      <g transform={`translate(172 600) rotate(-5) scale(${arrival})`}>
        <rect x="-133" y="-37" width="265" height="66" fill="#c7aa52" stroke={ink} strokeWidth="2" transform="translate(4 5)" />
        <rect x="-133" y="-37" width="265" height="66" fill="#f3df8e" stroke={ink} strokeWidth="2.5" />
        <text x="0" y="11" textAnchor="middle" fontFamily={serif} fontSize="36" fontWeight="700" fill={ink}>去上班？</text>
      </g>
      <g stroke={rust} strokeWidth="3.5" strokeLinecap="round" opacity={1 - smooth(t, 6.05, 6.14)} transform={`translate(460 533) scale(${arrival})`}>
        <path d="M21 -23 37 -32 M26 0H46 M18 21 34 34" />
      </g>
    </g>

    {t >= 6.14 && <rect x={windowX} y={windowY} width={windowW} height={windowH} rx={mix(6, 0, window)} fill="#20211f" />}
  </svg>;
};
