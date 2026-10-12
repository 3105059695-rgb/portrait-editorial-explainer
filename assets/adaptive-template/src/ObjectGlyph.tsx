import React from 'react';

export type ObjectGlyphKind =
  | 'document' | 'message' | 'folder' | 'device' | 'product'
  | 'person' | 'coin' | 'chart' | 'image' | 'symbol';

export interface ObjectGlyphProps {
  kind: ObjectGlyphKind;
  ink: string;
  paper: string;
  accent: string;
  comic: string;
  uid: string;
}

/** A self-contained editorial object. The caller owns placement and captions. */
export const ObjectGlyph: React.FC<ObjectGlyphProps> = ({
  kind, ink, paper, accent, comic, uid,
}) => {
  // Encoding every code point preserves uniqueness even when IDs contain spaces.
  const id = `glyph-${Array.from(uid, (c) => c.codePointAt(0)!.toString(16)).join('-')}`;
  const face = `url(#${id}-face)`;
  const color = `url(#${id}-color)`;
  const outline = {stroke: ink, strokeWidth: 2.8, strokeLinejoin: 'round' as const};
  const line = {...outline, fill: 'none', strokeLinecap: 'round' as const};
  const fine = {...line, strokeWidth: 1.5};
  let object: React.ReactNode;

  switch (kind) {
    case 'document':
      object = <>
        <path d="M-48-66H24L53-36V63H-48Z" fill={ink} />
        <path d="M-57-70H13L44-39V56H-57Z" fill={comic} {...outline} />
        <path d="M-45-80H20L52-48V49H-45Z" fill={face} {...outline} />
        <path d="M20-80V-48H52Z" fill={accent} {...outline} />
        <path d="M25-47H51L25-22Z" fill={ink} opacity=".08" />
        <path d="M-36-70V40" stroke={paper} strokeWidth="3" opacity=".85" />
        <rect x="-29" y="-59" width="29" height="10" rx="2" fill={accent} />
        <path d="M-29-29H33M-29-17H33M-29-5H21" {...fine} />
        <path d="M-29 21H-7M-29 29H-14" {...fine} opacity=".55" />
        <circle cx="25" cy="26" r="15" fill={comic} {...outline} />
        <path d="m18 26 5 5 9-11" {...line} strokeWidth="2.4" />
        <path d="M-57 56H44M-52 61H48" {...fine} opacity=".6" />
      </>;
      break;
    case 'message':
      object = <>
        <path d="M-35-71H43Q54-71 54-60V-28Q54-17 43-17H31L20-5V-17H-35Q-46-17-46-28V-60Q-46-71-35-71Z" fill={comic} {...outline} />
        <path d="M-56-41H57Q73-41 73-25V28Q73 44 57 44H-8L-34 67-30 44H-56Q-72 44-72 28V-25Q-72-41-56-41Z" fill={ink} />
        <path d="M-61-49H49Q65-49 65-33V20Q65 36 49 36H-16L-42 59-38 36H-61Q-75 36-75 20V-33Q-75-49-61-49Z" fill={face} {...outline} />
        <path d="M-61-41H49" stroke={paper} strokeWidth="3" strokeLinecap="round" />
        <path d="M-54-27H13" {...line} strokeWidth="3.2" />
        <path d="M-54-15H39" {...fine} opacity=".5" />
        <circle cx="-31" cy="9" r="6" fill={accent} {...outline} />
        <circle cx="-6" cy="9" r="6" fill={accent} {...outline} />
        <circle cx="19" cy="9" r="6" fill={accent} {...outline} />
        <path d="M-30-59H37" {...fine} opacity=".55" />
      </>;
      break;
    case 'folder':
      object = <>
        <path d="M-59-48H-16L-3-33H63L75-18 59 65H-50Z" fill={ink} />
        <path d="M-68-50Q-68-57-61-57H-20L-7-42H59Q65-42 66-35L56 51H-58Z" fill={accent} {...outline} />
        <path d="M-43-66 38-72 45 20-36 26Z" fill={comic} {...outline} />
        <path d="M-36-60 45-61 48 31-33 32Z" fill={face} {...outline} />
        <path d="M-23-47H32M-23-35H32M-23-23H18" {...fine} opacity=".65" />
        <path d="M-68-20H67L52 56H-57Z" fill={color} {...outline} />
        <path d="M-63-12H60" stroke={paper} strokeWidth="3" strokeLinecap="round" opacity=".65" />
        <path d="M-57 56H52L60 63H-49Z" fill={ink} {...outline} />
        <rect x="-34" y="5" width="50" height="20" rx="3" fill={paper} {...outline} />
        <path d="M-24 15H6" {...fine} />
        <path d="M47 3 40 40" {...fine} opacity=".35" />
      </>;
      break;
    case 'device':
      object = <>
        <path d="M-27-74 44-62Q51-61 51-53V58Q51 72 37 68L-27 56Z" fill={ink} />
        <path d="M-35-80 40-67 48-57V59L36 64-35 51Z" fill={accent} {...outline} />
        <path d="M-35-80 32-69Q40-67 40-58V54Q40 63 32 61L-35 49Q-42 48-42 39V-73Q-42-82-35-80Z" fill={face} {...outline} />
        <path d="M-32-61 30-50V35L-32 24Z" fill={comic} {...outline} />
        <path d="M-32-61 30-50V-6L-32 10Z" fill={accent} opacity=".25" />
        <path d="m-26 13 17-24L3 5 11-7 13 1 23 12V23Z" fill={paper} {...outline} strokeWidth="1.7" />
        <circle cx="15" cy="-29" r="7" fill={paper} {...outline} strokeWidth="1.7" />
        <path d="m-12-67 24 4" {...line} strokeWidth="2.4" />
        <path d="M-37-67V36" stroke={paper} strokeWidth="2" strokeLinecap="round" />
        <ellipse cx="-2" cy="43" rx="6" ry="5" fill={accent} {...outline} strokeWidth="1.7" />
        <path d="M45-29V-11M45-2V8" {...line} strokeWidth="1.7" />
      </>;
      break;
    case 'product':
      object = <>
        <path d="m-65 37 69-27 74 30-70 34Z" fill={ink} opacity=".15" />
        <path d="M-64-34 2-69 68-34 68 30 2 66-64 30Z" fill={ink} {...outline} />
        <path d="M-64-34 2-69 68-34 2 2Z" fill={face} {...outline} />
        <path d="M-64-34 2 2V66L-64 30Z" fill={color} {...outline} />
        <path d="M2 2 68-34V30L2 66Z" fill={comic} {...outline} />
        <path d="M2 2 68-34V30L2 66Z" fill={ink} opacity=".1" />
        <path d="m-26-54 64 35-17 9-65-35Z" fill={accent} {...outline} strokeWidth="1.5" />
        <path d="M21-10 38-19V4L21 13Z" fill={accent} {...outline} strokeWidth="1.5" />
        <path d="M-56-26-5 7V54" stroke={paper} strokeWidth="2.5" fill="none" opacity=".7" />
        <path d="m18 26 30-16V31L18 47Z" fill={paper} {...outline} strokeWidth="1.7" />
        <path d="m24 30 18-9m-18 16 13-7" {...fine} />
        <path d="m-51 11 17 9m-17-2 12 6" {...fine} opacity=".6" />
      </>;
      break;
    case 'person':
      object = <>
        <ellipse cx="4" cy="65" rx="56" ry="8" fill={ink} opacity=".14" />
        <path d="M-8-64C-43-63-40-14-15-7V11C-48 13-48 42-48 62H59C59 35 49 15 22 11V-7C46-18 46-66 11-66Z" fill={ink} />
        <path d="M-13-12H14V15L1 30-15 15Z" fill={paper} {...outline} />
        <path d="M-12-10H14V2Q1 10-12-1Z" fill={ink} opacity=".1" />
        <path d="M-13 10-31 15Q-52 24-52 58L0 65 51 58Q51 25 30 16L14 10 0 25Z" fill={color} {...outline} />
        <path d="m-13 10-11 7 11 22L0 25 13 39 24 18 14 10 0 25Z" fill={comic} {...outline} strokeWidth="2" />
        <path d="M0 27V61M-33 36-35 58M33 36 35 59" {...fine} />
        <path d="M-25-48Q-30-57-29-40V-24Q-27-17-22-20M25-48Q31-55 29-40V-25Q27-18 22-20" fill={paper} {...outline} strokeWidth="2" />
        <path d="M-25-47Q-25-72 0-72T25-47L22-24Q18-8 0-6-18-8-22-24Z" fill={face} {...outline} />
        <path d="M-25-40Q-39-68-11-77 5-82 16-71 34-66 25-39L18-56Q0-45-17-58Z" fill={ink} {...outline} />
        <path d="M-20-66Q-7-75 6-69" stroke={paper} strokeWidth="2" fill="none" opacity=".35" strokeLinecap="round" />
        <path d="M-11-39H-8M9-39H12M1-35-2-24H3M-6-16Q0-12 7-17" {...fine} />
        <path d="M-42 32Q-47 40-46 49" stroke={paper} strokeWidth="2.5" fill="none" strokeLinecap="round" opacity=".65" />
      </>;
      break;
    case 'coin':
      object = <>
        <ellipse cx="6" cy="63" rx="56" ry="9" fill={ink} opacity=".14" />
        <ellipse cx="9" cy="-6" rx="46" ry="60" fill={ink} {...outline} />
        <path d="M-4-70C24-70 57-54 57-10S28 55-4 52Z" fill={accent} {...outline} />
        <path d="M40-49 48-45M45-35 54-31M48-20 57-17M49-5 57-3M47 10 55 13M43 25 49 28M35 40 42 43" {...fine} />
        <ellipse cx="-5" cy="-10" rx="45" ry="60" fill={color} {...outline} />
        <ellipse cx="-5" cy="-10" rx="34" ry="47" fill={paper} {...outline} strokeWidth="1.7" />
        <ellipse cx="-3" cy="-8" rx="28" ry="40" fill={comic} opacity=".5" />
        <path d="m-5-38 7 18 17 3-13 13 3 21-14-10-15 10 4-21-13-13 17-3Z" fill={accent} {...outline} strokeWidth="2" />
        <path d="M-38-35Q-33-55-17-61" stroke={paper} strokeWidth="3" fill="none" strokeLinecap="round" opacity=".8" />
        <path d="M-36 22Q-29 41-15 46" {...fine} opacity=".45" />
      </>;
      break;
    case 'chart':
      object = <>
        <path d="m-70 49 24 22 118-25-27-18Z" fill={ink} opacity=".15" />
        <path d="m-69 45 22 17 114-22-22-17Z" fill={paper} {...outline} />
        <path d="M-58 14-46 6-23 13-35 21Z" fill={paper} {...outline} />
        <path d="M-58 14-35 21V52L-58 45Z" fill={comic} {...outline} />
        <path d="M-35 21-23 13V44L-35 52Z" fill={accent} {...outline} />
        <path d="M-16-23-4-31 19-24 7-16Z" fill={paper} {...outline} />
        <path d="M-16-23 7-16V44L-16 37Z" fill={color} {...outline} />
        <path d="M7-16 19-24V36L7 44Z" fill={ink} {...outline} />
        <path d="M26-66 38-74 61-67 49-59Z" fill={paper} {...outline} />
        <path d="M26-66 49-59V35L26 28Z" fill={comic} {...outline} />
        <path d="M49-59 61-67V27L49 35Z" fill={accent} {...outline} />
        <path d="M-52 23V39M-10-13V30M32-55V19" stroke={paper} strokeWidth="2.5" fill="none" strokeLinecap="round" opacity=".8" />
        <path d="M-64-7-34-31-20-29 5-58" {...line} strokeWidth="3.2" />
        <path d="m-9-57 14-1-1 14" {...line} strokeWidth="3.2" />
      </>;
      break;
    case 'image':
      object = <>
        <path d="M-60-46 59-58 75 55-44 67Z" fill={ink} />
        <path d="M-67-54 51-66 67 47-52 59Z" fill={face} {...outline} />
        <path d="M-54-41 40-51 52 33-42 43Z" fill={comic} {...outline} strokeWidth="2" />
        <g clipPath={`url(#${id}-landscape)`}>
          <path d="M-57-44H56V48H-57Z" fill={comic} />
          <circle cx="20" cy="-27" r="13" fill={paper} />
          <path d="m-64 42 35-64 37 47 17-33 43 60Z" fill={accent} {...outline} strokeWidth="2" />
          <path d="m-41 0 12-22L-11 1-24-3-29 3-33-4Z" fill={paper} />
          <path d="m-67 35 27-10 20 9L8 22 60 38V59H-67Z" fill={ink} opacity=".85" />
          <path d="m-16 34 14-4 12 20H-3Z" fill={paper} opacity=".85" />
        </g>
        <path d="M-54-41 40-51 52 33-42 43Z" {...line} strokeWidth="2" />
        <path d="M-59-49 44-59" stroke={paper} strokeWidth="3" strokeLinecap="round" />
        <path d="m-19 49 24-3" {...fine} opacity=".5" />
        <path d="m51-66 7 7 17 114-8-8Z" fill={accent} {...outline} strokeWidth="2" />
      </>;
      break;
    case 'symbol':
      object = <>
        <ellipse cx="5" cy="66" rx="39" ry="7" fill={ink} opacity=".14" />
        <path d="M-30-43C-29-76 34-78 37-43 39-20 5-17 5 8" fill="none" stroke={ink} strokeWidth="24" strokeLinecap="round" transform="translate(7 7)" />
        <path d="M-30-43C-29-76 34-78 37-43 39-20 5-17 5 8" fill="none" stroke={ink} strokeWidth="24" strokeLinecap="round" />
        <path d="M-30-43C-29-76 34-78 37-43 39-20 5-17 5 8" fill="none" stroke={color} strokeWidth="18" strokeLinecap="round" />
        <path d="M-33-49Q-27-68-8-65" fill="none" stroke={paper} strokeWidth="3" strokeLinecap="round" opacity=".85" />
        <circle cx="12" cy="46" r="13" fill={ink} />
        <circle cx="5" cy="39" r="13" fill={comic} {...outline} />
        <path d="M-1 34Q3 30 7 32" stroke={paper} strokeWidth="2.5" fill="none" strokeLinecap="round" />
        <path d="M-59-18V-2M-67-10H-51M59 15V27M53 21H65" {...line} strokeWidth="2.2" />
      </>;
      break;
    default:
      object = null;
  }

  return <g data-object-kind={kind}>
    <defs>
      <linearGradient id={`${id}-face`} x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor={paper} />
        <stop offset=".65" stopColor={paper} />
        <stop offset="1" stopColor={comic} />
      </linearGradient>
      <linearGradient id={`${id}-color`} x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor={paper} />
        <stop offset=".22" stopColor={accent} />
        <stop offset="1" stopColor={accent} />
      </linearGradient>
      <clipPath id={`${id}-landscape`}>
        <path d="M-54-41 40-51 52 33-42 43Z" />
      </clipPath>
    </defs>
    {object}
  </g>;
};

export default ObjectGlyph;
