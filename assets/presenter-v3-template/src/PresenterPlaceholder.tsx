import React from 'react';

/** Clearly marked stand-in; never mistaken for a generated or supplied presenter. */
export const PresenterPlaceholder: React.FC = () => <svg
  viewBox="0 0 540 960"
  width="100%"
  height="100%"
  preserveAspectRatio="xMidYMid slice"
  role="img"
  aria-label="待放入口播视频"
>
  <defs>
    <linearGradient id="presenter-placeholder-bg" x1="0" y1="0" x2="1" y2="1">
      <stop stopColor="#525f51"/><stop offset="1" stopColor="#17271f"/>
    </linearGradient>
  </defs>
  <rect width="540" height="960" fill="url(#presenter-placeholder-bg)"/>
  <rect x="42" y="40" width="456" height="868" rx="170" fill="#718372" opacity=".15"/>
  <circle cx="270" cy="310" r="98" fill="#d8ddcd" opacity=".4"/>
  <path d="M92 677V552C92 442 176 410 270 410S448 442 448 552V677Z" fill="#d8ddcd" opacity=".22"/>
  <rect x="70" y="123" width="400" height="64" rx="6" fill="#f8f7e9"/>
  <text x="270" y="166" textAnchor="middle" fontFamily="Noto Sans SC, sans-serif" fontWeight="700" fontSize="31" fill="#273b30">待放入口播视频</text>
  <text x="270" y="228" textAnchor="middle" fontFamily="Noto Sans SC, sans-serif" fontSize="20" fill="#f8f7e9">静音机制样例 · 非正式成片</text>
  <path d="M42 51H87M42 51V96M498 51H453M498 51V96" stroke="#eeeddf" strokeWidth="3" fill="none"/>
</svg>;
