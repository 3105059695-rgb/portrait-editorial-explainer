import React, {useId} from 'react';

/**
 * Original mathematics artwork on the measured 128 × 226 reference posters.
 * The parent owns the card, camera and cast shadow. These objects deliberately
 * run out of the print area: their scale and material carry the composition.
 */
export const CalibratedPoster: React.FC<{index: 0 | 1 | 2; t: number}> = ({index, t}) => {
  const uid = `math-print-${index}-${useId().replace(/:/g, '')}`;
  const id = (name: string) => `${uid}-${name}`;
  const url = (name: string) => `url(#${id(name)})`;
  const slow = Math.sin((t - 2) * .53);
  const bottomArrow = 'M104 177 C106 173 111 173 115 177 C120 185 126 201 131 213 C135 220 137 226 134 231 C130 236 122 235 116 231 C104 226 93 227 77 228 C69 229 64 226 65 220 C66 214 74 212 82 212 C94 211 106 213 113 215 C108 205 100 187 104 177 Z';
  const topArrow = 'M-12 7 C1 1 17 -3 33 -7 C39 -9 45 -6 45 0 C44 6 36 7 25 10 C16 12 10 14 6 17 C18 19 35 29 43 37 C47 41 47 46 43 49 C38 52 32 51 25 47 C13 40 4 31 -2 27 C-4 37 -5 46 -6 54 C-7 60 -11 64 -15 61 C-20 57 -19 49 -18 42 L-16 17 C-17 12 -16 9 -12 7 Z';

  return <svg viewBox="0 0 128 226" width="100%" height="100%" preserveAspectRatio="none" style={{display: 'block', overflow: 'hidden'}}>
    <defs>
      <linearGradient id={id('paper')} x1="0" y1="0" x2=".9" y2="1">
        <stop stopColor={index === 2 ? '#e9eadf' : '#f8f8f5'}/>
        <stop offset=".47" stopColor={index === 2 ? '#e3e5d8' : '#ededeb'}/>
        <stop offset="1" stopColor={index === 2 ? '#d7dacd' : '#e8e8e6'}/>
      </linearGradient>
      <radialGradient id={id('rubber')} cx=".24" cy=".21" r=".86">
        <stop stopColor="#343535"/>
        <stop offset=".20" stopColor="#242626"/>
        <stop offset=".58" stopColor="#171919"/>
        <stop offset="1" stopColor="#101212"/>
      </radialGradient>
      <linearGradient id={id('metal')} x1="0" y1="0" x2="1" y2="0">
        <stop stopColor="#333731"/>
        <stop offset=".19" stopColor="#6c7268"/>
        <stop offset=".35" stopColor="#f0f2e8"/>
        <stop offset=".47" stopColor="#c6c9bf"/>
        <stop offset=".54" stopColor="#444941"/>
        <stop offset=".76" stopColor="#141c16"/>
        <stop offset=".92" stopColor="#818777"/>
        <stop offset="1" stopColor="#e7e7dc"/>
      </linearGradient>
      <linearGradient id={id('gold')} x1="0" y1="0" x2="1" y2="1">
        <stop stopColor="#ede5b6"/>
        <stop offset=".32" stopColor="#b7a767"/>
        <stop offset=".54" stopColor="#6c5523"/>
        <stop offset=".8" stopColor="#ded09a"/>
        <stop offset="1" stopColor="#312d1c"/>
      </linearGradient>
      <linearGradient id={id('sheet')} x1="0" y1="0" x2="0" y2="1">
        <stop stopColor="#fdfdf3"/>
        <stop offset=".38" stopColor="#e9eade"/>
        <stop offset=".76" stopColor="#d6d7cb"/>
        <stop offset="1" stopColor="#a5aa9b"/>
      </linearGradient>
      <linearGradient id={id('curl')} x1="0" y1="0" x2="1" y2="0">
        <stop stopColor="#f9faed"/>
        <stop offset=".30" stopColor="#e8ebd8"/>
        <stop offset=".63" stopColor="#b9bfac"/>
        <stop offset=".86" stopColor="#72796a"/>
        <stop offset="1" stopColor="#d2d7c5"/>
      </linearGradient>
      <linearGradient id={id('fold')} x1="0" y1="0" x2="0" y2="1">
        <stop stopColor="#b8bcac"/>
        <stop offset=".22" stopColor="#f8faec"/>
        <stop offset=".67" stopColor="#e9ecdf"/>
        <stop offset="1" stopColor="#a9b1a0"/>
      </linearGradient>
      <filter id={id('grain')} x="0" y="0" width="100%" height="100%">
        <feTurbulence type="fractalNoise" baseFrequency=".64" numOctaves="3" seed="26" stitchTiles="stitch"/>
        <feColorMatrix type="saturate" values="0"/>
      </filter>
      <filter id={id('contact')} x="-40%" y="-30%" width="190%" height="200%">
        <feDropShadow dx=".65" dy="1.7" stdDeviation="1.25" floodColor="#191c17" floodOpacity=".31"/>
      </filter>
      <filter id={id('raised')} x="-40%" y="-40%" width="190%" height="200%">
        <feDropShadow dx="1.1" dy="3.3" stdDeviation="2.3" floodColor="#1e2817" floodOpacity=".29"/>
        <feDropShadow dx=".3" dy=".8" stdDeviation=".45" floodColor="#1d211a" floodOpacity=".4"/>
      </filter>
      <filter id={id('soft-edge')} x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation=".35"/></filter>
      <pattern id={id('hatch')} width="1.8" height="1.8" patternUnits="userSpaceOnUse"><path d="M0 1.8L1.8 0" stroke="#56634a" strokeWidth=".14" opacity=".22"/></pattern>
      <clipPath id={id('print-area')}><rect width="128" height="226"/></clipPath>
    </defs>
    <g clipPath={url('print-area')}>
      <rect width="128" height="226" fill={url('paper')}/>
      {index === 0 ? <>
        <g transform={`translate(${slow * .14} ${slow * .28})`} filter={url('contact')}>
          <path d={topArrow} fill={url('rubber')} stroke="#353736" strokeWidth=".55"/>
          <path d="M-12 8 C3 1 20 -3 32 -6 M4 18 C17 24 31 31 40 39" fill="none" stroke="#686b68" strokeWidth=".65" opacity=".28" filter={url('soft-edge')}/>
          <path d="M-7 27 C-10 36 -11 50 -12 57" fill="none" stroke="#030606" strokeWidth="1.5" opacity=".32"/>
        </g>
        <g transform={`translate(${slow * -.18} ${slow * .2})`} filter={url('contact')}>
          <path d={bottomArrow} fill={url('rubber')} stroke="#363937" strokeWidth=".62"/>
          <path d="M105 181 C105 173 111 173 115 181 C121 192 122 199 127 210 M70 218 C79 213 98 214 111 218" fill="none" stroke="#6e726e" strokeWidth=".85" opacity=".31" filter={url('soft-edge')}/>
          <path d="M68 224 C85 219 102 222 115 225" fill="none" stroke="#020505" strokeWidth="1.1" opacity=".48"/>
        </g>
        <g transform="translate(23 105) rotate(-.5 40 9)">
          <rect width="81" height="19" fill="none" stroke="#353835" strokeWidth=".45" strokeDasharray="1.5 1.3"/>
          {[[0,0],[81,0],[0,19],[81,19]].map(([x,y], i) => <rect key={i} x={x-1} y={y-1} width="2" height="2" fill="#424640"/>)}
          <text x="40.5" y="7.3" fontFamily="Arial, sans-serif" fontSize="4.8" letterSpacing=".4" textAnchor="middle" fill="#454843">RESEARCH</text>
          <text x="40.5" y="13.9" fontFamily="Arial, sans-serif" fontSize="5.4" fontWeight="700" letterSpacing="-.08" textAnchor="middle" fill="#272b26">BEYOND BENCHMARKS</text>
        </g>
      </> : index === 1 ? <>
        <rect width="128" height="226" fill="#fff" opacity=".46"/>
        <g transform="translate(70 -9) rotate(17)" filter={url('contact')}>
          <rect x="-17" y="-9" width="33" height="21" rx="3" fill={url('gold')}/>
          <path d="M-19 5 Q0 11 19 5 L17 9 Q0 15 -17 9Z" fill="#494237"/>
          <rect x="-5" y="6" width="10" height="16" rx="1" fill={url('metal')}/>
          {Array.from({length: 9}, (_,i) => <path key={i} d={`M${-14+i*3.5} -7 v15`} stroke="#342d20" strokeWidth=".45" opacity=".44"/>)}
        </g>
        <g>
          <path d="M-18 76 C38 74 94 89 146 135" fill="none" stroke="#d4dce0" strokeWidth="3.5"/>
          <path d="M-18 75.7 C38 73.7 94 88.7 146 134.7" fill="none" stroke="#526775" strokeWidth=".9" opacity=".76"/>
          <path d="M-18 78 C38 76 94 91 146 137" fill="none" stroke="#fdfffc" strokeWidth=".75"/>
          {Array.from({length: 24}, (_,i) => {
            const x = -2 + i * 6;
            const y = 78 + .00235 * Math.pow(x + 11, 2);
            return <path key={i} d={`M${x} ${y} l${-1-i*.05} ${i%5===0?10:5}`} stroke="#74828a" strokeWidth={i%5===0?.6:.3} opacity={i%5===0?.7:.43}/>;
          })}
          {[0,1,2,3].map((n) => <circle key={n} cx={12+n*24} cy={78+.00235*Math.pow(23+n*24,2)} r="1.1" fill="#79909b"/>)}
        </g>
        <g transform={`rotate(${-1.2 + slow * 1.2} 13 205)`} filter={url('contact')}>
          <path d="M8 226 L10 204 L42 158 L53 145 L66 120 L88 94 L73 124 L65 144 L53 151 L17 207 L13 227 Z" fill="#1c211b"/>
          <path d="M11 222 L14 205 L48 153 L57 145 L67 122 L86 97 L69 127 L64 146 L53 153 L17 207 L14 223 Z" fill={url('metal')}/>
          <path d="M15 205 L49 153 L57 145 L64 127" fill="none" stroke="#ffffe5" strokeWidth=".7"/>
          <path d="M16 201 L49 151 L54 148" fill="none" stroke="#bda46c" strokeWidth="1.2"/>
          <path d="M70 123 L88 94" stroke="#20281e" strokeWidth="1.9"/>
          <circle cx="13" cy="205" r="6.1" fill="#262820"/>
          <circle cx="13" cy="205" r="4.6" fill={url('gold')}/>
          <circle cx="12.4" cy="203.8" r="2.6" fill="#c8b668"/>
          <path d="M10.9 202.7 Q12.6 201 14.2 203" fill="none" stroke="#fff5bf" strokeWidth=".55"/>
        </g>
        <g fontFamily="'Tinos', 'Times New Roman', serif" letterSpacing="-.55">
          <text x="41" y="190" fontSize="16" fill="#30362c">Proof</text>
          <text x="43" y="201" fontSize="15" fill="#c5aa6c">is structure</text>
          <text x="42" y="210" fontSize="3.5" fill="#95968b" letterSpacing=".03">GEOMETRY · REASONING · VERIFICATION</text>
        </g>
      </> : <>
        <path d="M92 -9 L78 53 L-11 84 M78 53 L148 19" fill="none" stroke="#9da48f" strokeWidth=".7" opacity=".56"/>
        <path d="M-12 190 L141 131" fill="none" stroke="#a0a78f" strokeWidth=".65" opacity=".28"/>
        <g transform={`translate(${97+slow*.6} ${40+slow*.8}) rotate(-24)`} filter={url('raised')}>
          <path d="M-4 -32 L53 -32 L53 27 C31 26 21 37 0 32 Z" fill={url('sheet')} stroke="#f7faeb" strokeWidth=".6"/>
          <path d="M1 -27 H49 V25 C29 25 20 31 3 29Z" fill={url('hatch')}/>
          <g fill="#35432e" fontFamily="'Tinos', 'Times New Roman', serif">
            <text x="5" y="-17" fontSize="4.2" fontWeight="700">MATHEMATICS</text>
            <path d="M4 -12 H47" stroke="#546048" strokeWidth=".7"/>
            <text x="5" y="1" fontSize="13" fontStyle="italic">Σ aₙ</text>
            <text x="5" y="10" fontSize="3">A family of related constructions</text>
            {[0,1,2,3].map(i => <path key={i} d={`M5 ${15+i*2.4} H${44-i*2}`} stroke="#55604c" strokeWidth=".65" opacity=".54"/>)}
          </g>
          <path d="M-4 -32 C-13 -22 -7 -1 -1 10 C3 16 5 25 0 32 L9 30 C16 23 9 12 5 5 C-2 -8 -4 -19 4 -32Z" fill={url('curl')} stroke="#d7ddc9" strokeWidth=".45"/>
          <path d="M0 -28 C-5 -15 1 -3 5 5" fill="none" stroke="#ffffef" strokeWidth="1.2" opacity=".7"/>
        </g>
        <g fontFamily="Arial, sans-serif" fill="#4a5141">
          <text x="64" y="103" fontSize="7.2" textAnchor="middle">372 families</text>
          <text x="64" y="115" fontSize="9.2" textAnchor="middle" fontWeight="700" letterSpacing="-.12">719 MANUSCRIPTS</text>
        </g>
        <g transform={`translate(${21-slow*.8} ${188+slow*.48}) rotate(-28)`} filter={url('raised')}>
          <path d="M-48 -26 L53 -26 L55 18 Q11 21 -33 19 L-48 11Z" fill={url('sheet')} stroke="#faffed" strokeWidth=".7"/>
          <rect x="-41" y="-21" width="87" height="34" fill={url('hatch')} stroke="#7f8872" strokeWidth=".5"/>
          <g fill="#3e4c32" fontFamily="'Tinos', 'Times New Roman', serif">
            <text x="-34" y="-13" fontSize="4.4" fontWeight="700" letterSpacing=".9">RESEARCH MANUSCRIPT</text>
            <text x="-34" y="4" fontSize="17" fontStyle="italic">∫ f(x) dx</text>
            <path d="M-35 8 H44" stroke="#637153" strokeWidth=".55"/>
            <text x="-34" y="12" fontSize="2.7">A construction and its supporting arguments.</text>
          </g>
          <path d="M-48 -26 C-53 -17 -36 -8 -29 1 C-20 11 -28 16 -33 19 L-12 20 C0 15 0 7 -13 -4 C-22 -13 -26 -18 -22 -26Z" fill={url('fold')}/>
          <path d="M-46 -24 C-44 -16 -32 -9 -28 -2" fill="none" stroke="#fffef0" strokeWidth="1.3"/>
          <path d="M-11 -2 C-1 8 -1 15 -12 20" fill="none" stroke="#79836b" strokeWidth=".5" opacity=".56"/>
          <path d="M-45 22 Q-2 25 54 20" fill="none" stroke="#303d27" strokeWidth=".65" opacity=".45"/>
        </g>
      </>}
      <rect width="128" height="226" filter={url('grain')} opacity=".042" style={{mixBlendMode: 'multiply'}} pointerEvents="none"/>
      <path d="M.5 225.5 V.5 H127.5" fill="none" stroke="#fff" strokeWidth=".55" opacity=".35"/>
    </g>
  </svg>;
};
