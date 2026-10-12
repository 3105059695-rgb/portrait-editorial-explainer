import React from 'react';

const ink = '#272925';
const sans = '"Noto Sans SC", sans-serif';

/** Mount once inside the scene's <defs>. All IDs are private to this version. */
export const PropsDefsV2: React.FC = () => <>
  <linearGradient id="v2-note-face" x1="0" y1="0" x2="0.8" y2="1">
    <stop stopColor="#f0eed8" /><stop offset="0.34" stopColor="#becdb5" />
    <stop offset="0.69" stopColor="#dce4ca" /><stop offset="1" stopColor="#9cb19b" />
  </linearGradient>
  <linearGradient id="v2-note-edge" x1="0" y1="0" x2="1" y2="0">
    <stop stopColor="#5e7660" /><stop offset="0.55" stopColor="#b0bda0" /><stop offset="1" stopColor="#6b806b" />
  </linearGradient>
  <linearGradient id="v2-note-curl" x1="0" y1="0" x2="1" y2="0">
    <stop stopColor="#8e9f86" /><stop offset="0.38" stopColor="#fbf7df" /><stop offset="0.8" stopColor="#d5dfbf" /><stop offset="1" stopColor="#91a18b" />
  </linearGradient>
  <linearGradient id="v2-coin-face" x1="0" y1="0" x2="1" y2="0.86">
    <stop stopColor="#faf0c5" /><stop offset="0.23" stopColor="#d5ab64" /><stop offset="0.42" stopColor="#ffedb2" />
    <stop offset="0.65" stopColor="#c29852" /><stop offset="0.82" stopColor="#edcc89" /><stop offset="1" stopColor="#b38648" />
  </linearGradient>
  <linearGradient id="v2-coin-edge" x1="0" y1="0" x2="1" y2="0">
    <stop stopColor="#746044" /><stop offset="0.28" stopColor="#a17b41" /><stop offset="0.55" stopColor="#ebcd85" />
    <stop offset="0.76" stopColor="#b58b4e" /><stop offset="1" stopColor="#5d5139" />
  </linearGradient>
  <linearGradient id="v2-wall" x1="0" y1="0" x2="0.9" y2="1">
    <stop stopColor="#fff8e9" /><stop offset="0.57" stopColor="#ece0c7" /><stop offset="1" stopColor="#c8b89b" />
  </linearGradient>
  <linearGradient id="v2-wall-side" x1="0" y1="0" x2="1" y2="0.8">
    <stop stopColor="#a49baf" /><stop offset="0.58" stopColor="#c4b5c1" /><stop offset="1" stopColor="#9d929f" />
  </linearGradient>
  <linearGradient id="v2-window" x1="0" y1="0" x2="1" y2="1">
    <stop stopColor="#526c67" /><stop offset="0.33" stopColor="#8ba299" /><stop offset="0.55" stopColor="#d3decc" /><stop offset="1" stopColor="#6a857a" />
  </linearGradient>
  <linearGradient id="v2-sign" x1="0" y1="0" x2="0" y2="1">
    <stop stopColor="#fcf5dc" /><stop offset="1" stopColor="#d6c5a5" />
  </linearGradient>
  <pattern id="v2-paper-fibers" width="17" height="13" patternUnits="userSpaceOnUse">
    <path d="M2 3h2M11 10l2-.5" stroke="#344d3c" strokeWidth="0.55" opacity="0.14" />
  </pattern>
  <filter id="v2-soft-contact" x="-30%" y="-150%" width="160%" height="400%">
    <feGaussianBlur stdDeviation="2.6" />
  </filter>
</>;

const CoinV2: React.FC<{x: number; y: number; size: number; angle: number; turn: number}> = ({x, y, size, angle, turn}) => (
  <g transform={`translate(${x} ${y}) rotate(${angle}) scale(${size})`}>
    <g transform={`scale(${0.89 + 0.065 * Math.sin(turn)} 1)`}>
      {/* The offset rear disk and milled lower rim give the coin actual thickness. */}
      <ellipse cx="4" cy="5" rx="43" ry="44" fill="url(#v2-coin-edge)" stroke={ink} strokeWidth="2.6" />
      {Array.from({length: 11}, (_, i) => {
        const a = (17 + i * 14) * Math.PI / 180;
        return <path key={i} d={`M ${Math.cos(a) * 42} ${Math.sin(a) * 43} l 4 5`} stroke="#58472f" strokeWidth="1.15" />;
      })}
      <ellipse rx="43" ry="44" fill="url(#v2-coin-face)" stroke={ink} strokeWidth="2.6" />
      <ellipse rx="36.5" ry="37.5" fill="none" stroke="#fff3c5" strokeWidth="2.5" />
      <ellipse rx="33.5" ry="34.5" fill="none" stroke="#9d7744" strokeWidth="1.15" />
      <path d="M -15 -17 L 0 -3 L 15 -17 M 0 -3 V 23 M -15 0 H 15 M -15 10 H 15" fill="none" stroke="#88683e" strokeWidth="4.1" strokeLinecap="round" transform="translate(1.3 1.1)" />
      <path d="M -15 -17 L 0 -3 L 15 -17 M 0 -3 V 23 M -15 0 H 15 M -15 10 H 15" fill="none" stroke="#fff0b5" strokeWidth="2.25" strokeLinecap="round" />
      <path d="M -33 -23 A 40 41 0 0 1 12 -39" fill="none" stroke="#fff9e5" strokeWidth="2.4" strokeLinecap="round" />
      <path d="M 31 22 A 40 41 0 0 1 17 35" fill="none" stroke="#725331" strokeWidth="1.5" strokeLinecap="round" opacity="0.7" />
      <path d="M -23 -28 L -4 -37 L 28 21 L 12 31 Z" fill="#fff9db" opacity={0.045 + 0.035 * (1 + Math.sin(turn))} />
    </g>
  </g>
);

/** Center-origin prop; visible bounds approximately x -120..119, y -104..120. */
export const MoneyV2: React.FC<{t: number}> = ({t}) => {
  const float = Math.sin(t * 1.65) * 1.35;
  return <g>
    <ellipse cx="0" cy="111" rx="97" ry="10" fill="#332f28" opacity="0.14" filter="url(#v2-soft-contact)" />
    <ellipse cx="8" cy="109" rx="69" ry="5" fill="#2d302a" opacity="0.12" />
    <g transform={`translate(0 ${float}) rotate(${-5 + Math.sin(t * 1.3) * 0.7})`}>
      <g transform="translate(-5 -25) rotate(-7)">
        {/* Three fanned notes share a consistent paper edge and cast overlap shadows. */}
        <path d="M -93 -24 L 67 -51 L 101 32 L -62 63 Z" fill="#a8bba4" stroke={ink} strokeWidth="2.7" transform="translate(-8 -17) rotate(-7)" />
        <path d="M -93 -24 L 67 -51 L 101 32 L -62 63 Z" fill="#cfdbbf" stroke={ink} strokeWidth="2.7" transform="translate(-4 -8) rotate(-3)" />
        <path d="M -94 -26 L 68 -53 L 102 30 L -61 61 L -60 69 L 104 39 L 70 -45 L -92 -18 Z" fill="url(#v2-note-edge)" stroke={ink} strokeWidth="2.5" />
        <path d="M -61 63 L 100 33 M -61 66 L 101 36" stroke="#f0f1d9" strokeWidth="0.75" opacity="0.8" />
        <path d="M -94 -26 L 68 -53 L 102 30 L -61 61 Z" fill="url(#v2-note-face)" stroke={ink} strokeWidth="2.8" />
        <path d="M -94 -26 L 68 -53 L 102 30 L -61 61 Z" fill="url(#v2-paper-fibers)" />
        <path d="M -79 -19 L 57 -42 L 86 22 L -53 49 Z" fill="none" stroke="#5c7962" strokeWidth="1.7" />
        <path d="M -74 -14 L 54 -36 L 79 18 L -49 43 Z" fill="none" stroke="#7f9576" strokeWidth="0.7" />
        <ellipse cx="2" cy="5" rx="28" ry="30" transform="rotate(-23 2 5)" fill="#e8ebce" stroke="#6c876b" strokeWidth="1.7" />
        <ellipse cx="2" cy="5" rx="22" ry="24" transform="rotate(-23 2 5)" fill="none" stroke="#a7b694" strokeWidth="1" />
        <path d="M -8 -11 L 3 0 L 13 -14 M 3 0 L 8 24 M -8 2 L 15 -2 M -6 10 L 17 6" fill="none" stroke="#71876b" strokeWidth="2.2" strokeLinecap="round" />
        <path d="M -66 0 L -39 -5 M -63 8 L -36 3 M -60 16 L -44 13 M 43 3 L 65 -2 M 46 11 L 68 6 M 49 19 L 62 16" stroke="#668165" strokeWidth="2.3" />
        <path d="M 58 -44 Q 51 -4 80 28 L 101 29 L 68 -53 Z" fill="#506c51" opacity="0.15" />
        <path d="M 68 -53 Q 44 -29 66 12 Q 83 15 93 8 Z" fill="url(#v2-note-curl)" stroke={ink} strokeWidth="2.1" />
        <path d="M 63 -46 Q 49 -24 66 7" fill="none" stroke="#fffae2" strokeWidth="2.3" />
        <path d="M -91 -27 L 65 -53" stroke="#f9f9e3" strokeWidth="1.4" />
      </g>
      <ellipse cx="30" cy="78" rx="65" ry="11" fill="#3a382c" opacity="0.15" transform="rotate(-4)" />
      <CoinV2 x={-38} y={63} size={0.89} angle={-14} turn={t * 1.05} />
      <CoinV2 x={50} y={50} size={1.18} angle={13 + Math.sin(t * 1.15) * 1.4} turn={t * 1.1 + 0.7} />
    </g>
  </g>;
};

/** Center-origin prop; visible bounds approximately x -112..117, y -124..125. */
export const CompanyV2: React.FC<{t: number}> = ({t}) => (
  <g>
    <ellipse cx="1" cy="119" rx="99" ry="9" fill="#302e2c" opacity="0.16" filter="url(#v2-soft-contact)" />
    <g transform={`translate(-7 ${-5 + Math.sin(t * 1.2) * 0.5}) rotate(${1.2 + Math.sin(t * 1.25) * 0.35}) scale(.95)`}>
      {/* A single consistent oblique volume: light front, muted lilac right side. */}
      <path d="M -89 105 L 39 83 L 112 120 L -16 143 Z" fill="#b5aa99" stroke={ink} strokeWidth="2.9" transform="translate(0 -6) scale(1 .91)" />
      <path d="M -80 -91 L 39 -111 L 39 87 L -80 107 Z" fill="url(#v2-wall)" stroke={ink} strokeWidth="3" />
      <path d="M 39 -111 L 102 -78 L 102 120 L 39 87 Z" fill="url(#v2-wall-side)" stroke={ink} strokeWidth="3" />
      <path d="M -80 -91 L 39 -111 L 102 -78 L -17 -58 Z" fill="#fff4dc" stroke={ink} strokeWidth="3" />
      <path d="M -66 -91 L 38 -108 L 87 -82 L -16 -65 Z" fill="#d2c6b1" stroke="#605b50" strokeWidth="1.3" />
      <path d="M -66 -91 L -66 -86 L -16 -61 L 87 -78 L 87 -82 L -16 -65 Z" fill="#b3a68f" />
      <path d="M -80 -91 L -80 -85 L 39 -105 L 102 -72 L 102 -78 L 39 -111 Z" fill="#f6ecd6" stroke={ink} strokeWidth="1.5" />
      <path d="M -74 -79 L -74 100" stroke="#fff9e9" strokeWidth="2" />
      <path d="M 44 -96 L 44 85" stroke="#6f6873" strokeWidth="1.3" opacity="0.65" />
      {[-23, 21, 65].map((y, i) => <g key={`ledge-${i}`}>
        <path d={`M -79 ${y} L 39 ${y - 20} L 101 ${y + 13}`} fill="none" stroke="#887b69" strokeWidth="1.2" opacity="0.65" />
        <path d={`M -79 ${y - 2} L 38 ${y - 22}`} fill="none" stroke="#fff8e4" strokeWidth="1.6" />
      </g>)}
      {[0, 1, 2].map(row => <g key={`front-${row}`}>
        {[0, 1, 2].map(col => <g key={col} transform={`translate(${-63 + col * 32} ${-47 + row * 44 - col * 5.4})`}>
          <path d="M 0 0 L 18 -3 L 18 25 L 0 28 Z" fill="#7d7464" stroke={ink} strokeWidth="1.65" />
          <path d="M 3 3 L 16 1 L 16 23 L 3 25 Z" fill="url(#v2-window)" />
          <path d="M 4 4 L 15 2 L 4 20 Z" fill="#fff8e1" opacity="0.37" />
          <path d="M 9 1 L 9 26 M 1 14 L 18 11" stroke="#444f46" strokeWidth="1.1" />
          <path d="M -2 29 L 20 25 L 20 28 L -2 32 Z" fill="#eadfc9" stroke={ink} strokeWidth="1" />
        </g>)}
      </g>)}
      {[0, 1, 2].map(row => <g key={`side-${row}`}>
        {[0, 1].map(col => <g key={col} transform={`translate(${53 + col * 25} ${-68 + row * 44 + col * 13})`}>
          <path d="M 0 0 L 14 7 L 14 34 L 0 27 Z" fill="#6d6877" stroke={ink} strokeWidth="1.6" />
          <path d="M 2 4 L 12 9 L 12 30 L 2 25 Z" fill="#a7aab1" />
          <path d="M 3 4 L 11 9 L 3 20 Z" fill="#eadcce" opacity="0.43" />
          <path d="M 0 14 L 14 21" stroke="#575264" strokeWidth="1.1" />
        </g>)}
      </g>)}
      {/* Recessed entrance, lintel, threshold, and steps hold the building to the ground. */}
      <path d="M -36 62 L 3 55 L 3 93 L -36 100 Z" fill="#554e48" stroke={ink} strokeWidth="2" />
      <path d="M -32 66 L -2 61 L -2 92 L -32 97 Z" fill="#6e8b7e" />
      <path d="M -17 64 L -17 94" stroke="#ded5bc" strokeWidth="2" />
      <path d="M -12 78 v 8 M -22 80 v 8" stroke="#efe2b7" strokeWidth="1.3" />
      <path d="M -40 63 L 7 55 L 7 59 L -40 67 Z" fill="#e4d6b9" stroke={ink} strokeWidth="1.2" />
      <path d="M -39 102 L 6 94 L 13 99 L -33 107 Z" fill="#f7edda" stroke={ink} strokeWidth="1.1" />
      <path d="M -33 107 L 13 99 L 13 103 L -33 111 Z" fill="#ac9e88" stroke={ink} strokeWidth="1.1" />
      {/* Raised sign has an extrusion rather than a floating flat label. */}
      <path d="M -86 -78 L 42 -100 L 48 -96 L 48 -60 L -80 -38 L -86 -42 Z" fill="#8b7e67" stroke={ink} strokeWidth="2.5" />
      <path d="M -86 -78 L 42 -100 L 42 -64 L -86 -42 Z" fill="url(#v2-sign)" stroke={ink} strokeWidth="2.5" />
      <path d="M -81 -74 L 36 -94" stroke="#fff9e7" strokeWidth="2" />
      <text x="-22" y="-60" transform="rotate(-9.75 -22 -60)" textAnchor="middle" fill={ink} fontFamily={sans} fontSize="18" fontWeight="800" letterSpacing="1">我的公司</text>
      <circle cx="-77" cy="-60" r="1.7" fill="#665d4d" />
      <circle cx="33" cy="-79" r="1.7" fill="#665d4d" />
    </g>
  </g>
);
