import React from 'react';
import {staticFile} from 'remotion';
import type {EffectProps, Item, Scene} from '../types';
import {mix, out, progress, smooth, uid} from '../motion';

// Geometry follows the three paper/UI mechanisms studied in the source. All
// pictures below are native neutral illustrations, never source-video crops.
const INK = '#25251f';
const SERIF = '"Noto Serif SC", serif';
const SANS = '"Noto Sans SC", sans-serif';
const MONO = 'ui-monospace, Consolas, monospace';
const ACCENT = '#b66a4d';
const PALETTE = ['#b8c5af', '#d8c9ad', '#cbc2d8', '#adcbd0', '#d6b499', '#bdd1bd', '#dcc2bb', '#b7bfd0', '#d3cbab'];
const duration = (scene: Scene) => scene.end - scene.start;
const mark = (scene: Scene, name: string, fraction: number) => scene.marks[name] ?? duration(scene) * fraction;
const fit = (text: string, maxWidth: number, preferred: number, min = 10) => {
  const units = [...text].reduce((n, c) => n + (/[^\x00-\xff]/.test(c) ? 1 : 0.56), 0);
  return Math.max(min, Math.min(preferred, maxWidth / Math.max(1, units)));
};
const wrap = (text: string, width = 14) => {
  const result: string[] = [];
  let current = '', units = 0;
  for (const c of [...text]) {
    const u = /[^\x00-\xff]/.test(c) ? 1 : 0.56;
    if (c === '\n' || units + u > width) {result.push(current); current = ''; units = 0;}
    if (c !== '\n') {current += c; units += u;}
  }
  if (current) result.push(current);
  return result;
};
const prepared = (scene: Scene): Item[] => scene.content.items.length ? scene.content.items : [{id: 'item', label: scene.title}];
const Text: React.FC<{x: number; y: number; children: React.ReactNode; size?: number; color?: string; weight?: number; anchor?: 'start' | 'middle' | 'end'; family?: string; italic?: boolean}> = ({x, y, children, size = 16, color = INK, weight = 400, anchor = 'start', family = SANS, italic = false}) => <text x={x} y={y} fontSize={size} fill={color} fontWeight={weight} textAnchor={anchor} fontFamily={family} fontStyle={italic ? 'italic' : undefined}>{children}</text>;

const Definitions: React.FC<{id: string; accent: string}> = ({id, accent}) => <defs>
  <filter id={`${id}-paper`} x="-40%" y="-40%" width="180%" height="190%"><feDropShadow dx="1" dy="13" stdDeviation="10" floodColor="#454236" floodOpacity=".15"/><feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="#454236" floodOpacity=".07"/></filter>
  <filter id={`${id}-small`} x="-35%" y="-35%" width="170%" height="190%"><feDropShadow dx="0" dy="5" stdDeviation="4" floodColor="#454236" floodOpacity=".16"/></filter>
  <linearGradient id={`${id}-tile`} x1="0" y1="0" x2="1" y2="1"><stop stopColor="#fffefa"/><stop offset="1" stopColor="#eeede7"/></linearGradient>
  <linearGradient id={`${id}-warm`} x1="0" y1="0" x2="1" y2="1"><stop stopColor="#eadbc8"/><stop offset="1" stopColor={accent}/></linearGradient>
  <radialGradient id={`${id}-glow`}><stop stopColor="#ffffff" stopOpacity=".8"/><stop offset="1" stopColor="#e7e5de" stopOpacity="0"/></radialGradient>
</defs>;

/** One native art surface. Stable item ids keep the same object through a handoff. */
const Art: React.FC<{item: Item; index: number; id: string; w: number; h: number; t: number; replaced?: boolean; poster?: boolean}> = ({item, index, id, w, h, t, replaced = false, poster = false}) => {
  const image = replaced ? item.replacementImage : item.image;
  const label = replaced ? item.replacementLabel ?? item.label : item.label;
  const c = item.color ?? PALETTE[index % PALETTE.length];
  const clip = `${id}-${item.id.replace(/[^a-zA-Z0-9_-]/g, '')}-${index}-${replaced ? 'b' : 'a'}`;
  return <g>
    <defs><clipPath id={clip}><rect width={w} height={h} rx={poster ? 2 : 7}/></clipPath></defs>
    <g clipPath={`url(#${clip})`}>
      <rect width={w} height={h} fill={poster ? '#fffefa' : c}/>
      {image ? <image href={staticFile(image)} width={w} height={h} preserveAspectRatio="xMidYMid slice"/> : <g>
        {poster ? <g>
          <Text x={w * .10} y={h * .12} size={w * .048} family={MONO} color="#77756c">COLLECTION / {String(index + 1).padStart(2, '0')}</Text>
          <g transform={`translate(${w * .5} ${h * .45}) rotate(${index === 1 ? -18 : 9 + Math.sin(t * .7) * 3})`}>
            {index % 3 === 0 ? <g><ellipse rx={w * .37} ry={w * .19} fill="none" stroke={INK} strokeWidth={w * .13} transform="rotate(-34)"/><rect x={-w * .2} y={-w * .44} width={w * .19} height={w * .9} fill={c} transform="rotate(-34)"/></g> : index % 3 === 1 ? <g><circle r={w * .39} fill="none" stroke="#bfc4bd" strokeWidth="1"/>{Array.from({length: 12}, (_, k) => <path key={k} d={`M0 ${-w * .36}v${k % 3 ? 4 : 8}`} stroke={INK} transform={`rotate(${k * 30})`}/>) }<path d={`M0 ${w * .2}V${-w * .27}M0 0L${w * .25} ${w * .08}`} stroke={INK} strokeWidth="3"/><circle r="5" fill={c}/></g> : <g>{[0, 1, 2].map(k => <g key={k} transform={`translate(${(k - 1) * 17} ${(1 - k) * 27}) rotate(-24)`}><rect x={-w * .32} y={-w * .18} width={w * .64} height={w * .36} rx="2" fill={k === 1 ? c : '#e7e9df'} stroke="#969b8d"/><rect x={-w * .27} y={-w * .13} width={w * .54} height={w * .26} fill="none" stroke="#b0b5a8"/><circle r={w * .10} fill="none" stroke="#7c8474"/></g>)}</g>}
          </g>
          <Text x={w * .11} y={h * .74} size={fit(label, w * .8, 18, 9)} weight={700} family={SERIF}>{label}</Text>
          <rect x={w * .11} y={h * .78} width={w * .56} height={3} fill={c}/>
          {[0, 1, 2].map(k => <path key={k} d={`M${w * .11} ${h * .84 + k * 5}h${w * (.72 - k * .12)}`} stroke="#d0cfc7" strokeWidth="1"/>)}
        </g> : replaced ? <g>
          <rect x={w * .15} y={h * .14} width={w * .7} height={h * .66} rx={w * .07} fill={index % 2 ? '#232822' : '#fff4df'} transform={`rotate(${index % 2 ? 5 : -4} ${w / 2} ${h / 2})`}/>
          {index % 3 === 0 ? <g transform={`translate(${w / 2} ${h * .45})`}>{Array.from({length: 12}, (_, k) => <ellipse key={k} cy={-w * .1} rx={w * .038} ry={w * .16} fill={index % 2 ? c : '#b86b4d'} transform={`rotate(${k * 30})`}/>)}</g> : index % 3 === 1 ? <path d={`M${w * .5} ${h * .22}L${w * .75} ${h * .63}H${w * .25}Z`} fill="none" stroke={c} strokeWidth={w * .055}/> : <g><circle cx={w * .5} cy={h * .45} r={w * .20} stroke={c} strokeWidth={w * .075} fill="none"/><circle cx={w * .5} cy={h * .45} r={w * .07} fill={c}/></g>}
          <Text x={w / 2} y={h * .92} anchor="middle" size={fit(label, w * .9, 11, 7)} weight={600}>{label}</Text>
        </g> : <g>
          <rect width={w} height={h} fill="#fbfaf5" opacity=".72"/>
          {index % 3 === 0 ? <g>{[0, 1, 2, 3].map(k => <circle key={k} cx={w * (.31 + (k % 2) * .31)} cy={h * (.28 + Math.floor(k / 2) * .3)} r={w * (.06 + (k === 2 ? .025 : 0))} fill={k === 2 ? INK : c} transform={`rotate(${t * 7} ${w / 2} ${h * .45})`}/>)}</g> : index % 3 === 1 ? <g transform={`translate(${w / 2} ${h * .45}) rotate(${12 + Math.sin(t * .8) * 5})`}><rect x={-w * .23} y={-w * .23} width={w * .46} height={w * .46} rx={w * .08} fill={c}/><circle r={w * .045} fill="#fff9e9"/></g> : <g>{[.22, .34, .27, .44].map((v, k) => <rect key={k} x={w * (.22 + k * .15)} y={h * (.69 - v)} width={w * .10} height={h * v} fill={c} rx="1"/>)}</g>}
          <path d={`M${w * .18} ${h * .81}H${w * .8}`} stroke="#aba89d" strokeWidth="1" opacity=".55"/>
          <Text x={w / 2} y={h * .94} anchor="middle" size={fit(label, w * .85, 9, 6)} color="#827c70">{label}</Text>
        </g>}
      </g>}
    </g>
  </g>;
};
const TitleWords: React.FC<{scene: Scene}> = ({scene}) => {
  const emphasis = scene.content.emphasis;
  const at = emphasis ? scene.title.indexOf(emphasis) : -1;
  return <>{at >= 0 && emphasis ? <>{scene.title.slice(0, at)}<tspan fill={scene.accent ?? ACCENT}>{emphasis}</tspan>{scene.title.slice(at + emphasis.length)}</> : scene.title}</>;
};
const Headline: React.FC<{scene: Scene; y: number; opacity?: number}> = ({scene, y, opacity = 1}) => <g opacity={opacity}><Text x={272} y={y} size={fit(scene.title, 490, 39, 20)} anchor="middle" weight={700}><TitleWords scene={scene}/></Text>{!scene.content.emphasis && <path d={`M${272 - Math.min(80, scene.title.length * 6)} ${y + 12}h${Math.min(160, scene.title.length * 12)}`} stroke={scene.accent ?? ACCENT} strokeWidth="2.1" opacity=".7"/>}</g>;

export const PosterRoute: React.FC<EffectProps> = ({scene, t, height}) => {
  const id = uid(scene.id, 'poster'), accent = scene.accent ?? ACCENT;
  const items = prepared(scene), cards = items.slice(0, 5);
  const cw = cards.length === 3 ? 126 : Math.min(145, (456 - (cards.length - 1) * 22) / cards.length), ch = cw * (224 / 126);
  const step = cards.length === 3 ? 159 : cw + 22, left = (544 - (cw + step * (cards.length - 1))) / 2;
  const selectedIndex = Math.max(0, cards.findIndex(item => item.id === scene.content.selectedId));
  const focus = mark(scene, 'focus', .34), connect = mark(scene, 'connect', .67), resolve = mark(scene, 'resolve', .92);
  const top = 231 + (height - 720) * .28;
  const artifactY = 555 + (height - 720) * .49;
  const closeIn = smooth(t, focus - Math.min(.45, focus * .35), focus);
  const closeOut = smooth(t, mix(focus, connect, .46), mix(focus, connect, .70));
  const close = closeIn * (1 - closeOut), z = 1 + close * 1.60;
  const cameraX = 272 - mix(272, left + selectedIndex * step + cw * .64, close) * z;
  const cameraY = height * .53 - mix(height * .53, top - selectedIndex * 23 + ch * .87, close) * z;
  const draw = smooth(t, mix(focus, connect, .46), connect);
  return <g>
    <Definitions id={id} accent={accent}/>
    <ellipse cx="260" cy={height * .43} rx="360" ry={height * .62} fill={`url(#${id}-glow)`}/>
    <g transform={`translate(${cameraX} ${cameraY}) scale(${z})`}>
      <g opacity={smooth(t, 0, Math.min(.32, focus * .25)) * (1 - close * .9)}>
        <Text x={272} y={91 + (height - 720) * .18} size={fit(scene.title, 470, 42)} anchor="middle" weight={700} family={SERIF} italic><TitleWords scene={scene}/></Text>
        <Text x={272} y={123 + (height - 720) * .18} size={15} anchor="middle" color="#77776e" family={SERIF}>{scene.content.body?.slice(0, 26) ?? '把分散的灵感，变成可复用的方法'}</Text>
        <path d={`M22 ${top + 239}L264 ${top - 84}L522 ${top + 205}Z`} fill="none" stroke="#7f817a" strokeWidth=".7" opacity={1 - draw}/>
      </g>
      {cards.map((item, i) => {
        const enter = out(t, i * .13, Math.min(focus * .55, .5) + i * .13);
        const x = left + i * step, y = top - i * 23;
        return <g key={`${item.id}-${i}`} opacity={enter * (i !== selectedIndex ? 1 - close * .8 : 1)} transform={`translate(${x} ${y + (1 - enter) * 46}) rotate(${mix(-2.8, 2.8, i / Math.max(1, cards.length - 1))} ${cw / 2} ${ch / 2})`}>
          <g filter={`url(#${id}-paper)`}><rect width={cw} height={ch} rx="2.5" fill="#fffefa"/><Art item={item} index={i} id={`${id}-art`} w={cw} h={ch} t={t} poster/><rect width={cw} height={ch} rx="2.5" fill="none" stroke="#ffffff" strokeOpacity=".85"/></g>
          <Text x={4} y={ch + 19} size={15} family={SERIF} italic color="#686960">{i + 1}</Text>
        </g>;
      })}
      {cards.map((_, i) => {
        const sx = left + i * step + cw / 2, sy = top + ch - i * 23;
        const ex = mix(227, 318, i / Math.max(1, cards.length - 1));
        const middle = Math.abs(sx - 272) < 8;
        const d = middle ? `M${sx} ${sy}V${artifactY}` : `M${sx} ${sy}C${sx + (sx > 272 ? 44 : -44)} ${sy + 74} ${ex} ${artifactY - 72} ${ex} ${artifactY}`;
        const p = smooth(t, mix(focus, connect, .3) + i * .08, connect + i * .06);
        return <g key={i}><path d={d} fill="none" stroke="#76766e" strokeWidth=".85" pathLength="1" strokeDasharray="1" strokeDashoffset={1 - p}/><circle cx={sx} cy={sy} r="1.8" fill={accent} opacity={p}/></g>;
      })}
      <Text x={70} y={top + 282} size={20} weight={700} family={SERIF} italic color={accent}>{close > .2 ? '提取' : ''}</Text>
      <path d={`M207 ${artifactY}h130v101H207Z`} stroke="#81837a" fill="none" strokeWidth=".9" pathLength="1" strokeDasharray="1" strokeDashoffset={1 - smooth(t, connect - .05, mix(connect, resolve, .55))}/>
      <g opacity={smooth(t, connect + .05, resolve)} transform={`translate(272 ${artifactY + 56}) scale(${mix(.94, 1, smooth(t, connect, resolve))})`}>
        <Text x={0} y={12} anchor="middle" family={SERIF} italic size={fit(scene.content.result ?? '方法', 113, 46)}>{scene.content.result ?? '方法'}</Text>
      </g>
    </g>
  </g>;
};

export const SelectionBuild: React.FC<EffectProps> = ({scene, t, height}) => {
  const id = uid(scene.id, 'selection'), accent = scene.accent ?? ACCENT;
  const list = prepared(scene), selected = list.find(x => x.id === scene.content.selectedId) ?? list[Math.min(4, list.length - 1)];
  const items = Array.from({length: 9}, (_, i) => i === 4 ? selected : list[i % list.length]);
  const doc = mark(scene, 'document', .12), search = mark(scene, 'search', .30), choose = mark(scene, 'select', .44), code = mark(scene, 'code', .67), replace = mark(scene, 'replace', .89), resolve = mark(scene, 'resolve', .98);
  const gridIn = smooth(t, doc + (search - doc) * .20, search);
  const selectedP = smooth(t, search, choose);
  const lift = smooth(t, choose, mix(choose, code, .40));
  const editor = smooth(t, mix(choose, code, .10), mix(choose, code, .40));
  const codeP = progress(t, mix(choose, code, .27), code);
  const trayStart = code + (replace - code) * .12;
  const trayIn = smooth(t, code, trayStart);
  const pad = (height - 720) * .35, gy = 205 + pad, documentY = 210 + pad;
  const selectedY = mix(gy + 198.5, 236 + pad * .62, lift);
  const body = scene.content.body ?? '先把要表达的内容拆清楚。挑出一个合适的画面，再让同一个对象接着往下走。';
  const bodyLines = wrap(body, 11.5), typed = Math.floor(progress(t, Math.min(.12, doc * .15), doc) * body.length);
  const codeText = scene.content.code ?? "const input = selected;\nconst result = compose({\n  content: input,\n  motion: 'continuous',\n  state: 'ready'\n});\nrender(result);";
  const codeLines = codeText.split('\n').slice(0, 9);
  const codeCount = Math.floor(codeP * codeText.length);
  const replacements = Array.from({length: 4}, (_, i) => list[i % list.length]);
  const prompt = scene.content.prompt ?? '把选中的内容，换成这一期的表达';
  const promptP = progress(t, code, mix(code, replace, .48));
  const panelY = 385 + pad * .88, trayY = 196 + pad;
  return <g>
    <Definitions id={id} accent={accent}/>
    <Headline scene={scene} y={117 + (height - 720) * .12} opacity={smooth(t, 0, Math.min(.25, doc))}/>
    <g opacity={(1 - gridIn) * smooth(t, 0, Math.min(.22, doc))} transform={`rotate(${-1.8 - (1 - smooth(t, 0, doc)) * 1.5} 272 ${documentY + 200}) translate(${-gridIn * 45} 0)`}>
      <g filter={`url(#${id}-paper)`}><rect x="122" y={documentY} width="302" height="400" rx="15" fill="#fffefd"/></g>
      {[accent, '#d3ba76', '#b8bdb3'].map((c, i) => <circle key={i} cx={146 + i * 14} cy={documentY + 25} r="4.3" fill={c}/>)}
      <Text x={188} y={documentY + 30} size={12} family={MONO} color="#868379">notes.md</Text>
      <path d={`M145 ${documentY + 40}H399`} stroke="#e0dfd8"/>
      <rect x="146" y={documentY + 62} width={Math.min(205, bodyLines[0].length * 21) * progress(t, 0, doc)} height="22" fill="#edd8b5" opacity=".52"/>
      {bodyLines.slice(0, 8).map((line, i) => {const before = bodyLines.slice(0, i).join('').length; return <Text key={i} x={145} y={documentY + 83 + i * 37} size={21.5} weight={600}>{line.slice(0, Math.max(0, typed - before))}{typed >= before && typed < before + line.length ? <tspan fill={accent}>▏</tspan> : ''}</Text>;})}
    </g>
    <g opacity={gridIn * (1 - lift) * (1 - trayIn)}>
      {items.map((item, i) => i === 4 ? null : <g key={i} opacity={1 - selectedP * .68} transform={`translate(${70 + (i % 3) * 141} ${gy + Math.floor(i / 3) * 140 + (1 - gridIn) * (20 + i * 2)})`}>
        <g filter={`url(#${id}-small)`}><rect x="-3" y="-3" width="123" height="123" rx="10" fill="#fffefa"/><Art item={item} index={i} id={`${id}-art-grid`} w={117} h={117} t={t}/></g>
      </g>)}
    </g>
    <g opacity={gridIn * (1 - trayIn)} transform={`translate(272 ${selectedY}) scale(${mix(1, 1.44, selectedP) - lift * .30}) translate(-58.5 -58.5)`}>
      <g filter={`url(#${id}-small)`}><rect x="-5" y="-5" width="127" height="127" rx="14" fill="#fffefa" stroke={accent} strokeWidth={selectedP * 2.2}/><Art item={selected} index={4} id={`${id}-art-selected`} w={117} h={117} t={t}/></g>
      <g opacity={selectedP * (1 - lift)}><rect x="29" y="-22" width="59" height="17" rx="8" fill={accent}/><Text x={58.5} y={-10} size={8} weight={700} color="#fff" anchor="middle">选中这一项</Text></g>
    </g>
    <g opacity={gridIn * (1 - lift) * (1 - trayIn)} transform={`translate(${mix(431, 290, selectedP)} ${mix(gy + 70, gy + 218, selectedP)}) rotate(-13)`}>
      <ellipse cx="0" cy="0" rx="36" ry="37" fill="#faf8ef" fillOpacity=".18" stroke={INK} strokeWidth="7"/><path d="M26 26L59 61" stroke={INK} strokeWidth="9" strokeLinecap="round"/><path d="M-22-16Q-12-28 0-29" stroke="#fff" strokeWidth="4" fill="none" opacity=".8"/>
    </g>
    <g opacity={editor * (1 - trayIn)}>
      <path d={`M272 ${298 + pad * .62}V${panelY - 15}`} fill="none" stroke={accent} strokeWidth="2" strokeDasharray="3 6"/>
      <path d={`M263 ${panelY - 22}L272 ${panelY - 10}L281 ${panelY - 22}Z`} fill={accent}/>
      <g transform={`translate(0 ${(1 - editor) * 26})`}>
        <g filter={`url(#${id}-paper)`}><rect x="71" y={panelY} width="403" height="268" rx="14" fill="#211d18"/></g>
        {['#dc7972', '#d7bc6b', '#8cba79'].map((c, i) => <circle key={i} cx={91 + i * 14} cy={panelY + 18} r="4" fill={c}/>)}
        <Text x={140} y={panelY + 23} size={11} family={MONO} color="#958c80">composition.tsx · 示意</Text>
        <path d={`M85 ${panelY + 33}H460`} stroke="#393029"/>
        {codeLines.map((line, i) => {const before = codeLines.slice(0, i).join('\n').length + (i ? 1 : 0); return <g key={i}><Text x={91} y={panelY + 58 + i * 20} size={12} family={MONO} color="#72665a">{i + 1}</Text><Text x={112} y={panelY + 58 + i * 20} size={Math.min(12.6, 330 / Math.max(1, line.length * .59))} family={MONO} color={i % 3 === 0 ? '#e1c293' : i % 3 === 1 ? '#b7d0ca' : '#ece3d7'}>{line.slice(0, Math.max(0, codeCount - before))}{codeCount >= before && codeCount < before + line.length ? <tspan fill={accent}>▌</tspan> : ''}</Text></g>;})}
        <rect x="86" y={panelY + 247} width="276" height="5" rx="2.5" fill="#3b3026"/><rect x="86" y={panelY + 247} width={276 * codeP} height="5" rx="2.5" fill={accent}/><Text x={456} y={panelY + 253} size={11.5} weight={600} anchor="end" color="#f4ece1">{Math.round(codeP * 100)}%</Text>
      </g>
    </g>
    <g opacity={trayIn} transform={`translate(272 ${trayY + 150}) scale(${mix(.95, 1, trayIn)}) translate(-272 ${-trayY - 150})`}>
      <g filter={`url(#${id}-paper)`}><rect x="120" y={trayY} width="304" height="302" rx="19" fill="#fffefb"/><rect x="131" y={trayY + 11} width="282" height="280" rx="11" fill="#eeeae3"/></g>
      {Array.from({length: 7}, (_, i) => <g key={i} stroke="#d7d0c6" strokeWidth=".8"><path d={`M${132 + i * 47} ${trayY + 11}v280`}/><path d={`M131 ${trayY + 11 + i * 46.7}h282`}/></g>)}
      {replacements.map((item, i) => {
        const a = mix(trayStart, replace, .22 + i * .17), b = Math.min(replace, a + (replace - trayStart) * .22);
        const flip = progress(t, a, b), sx = Math.max(.035, Math.abs(Math.cos(flip * Math.PI))), x = 156 + (i % 2) * 131, y = trayY + 35 + Math.floor(i / 2) * 131;
        return <g key={i} transform={`translate(${x + 50.5} ${y + 50.5}) scale(${sx} 1) translate(-50.5 -50.5)`}><rect x="2" y="5" width="101" height="101" rx="6" fill="#847866" opacity=".16"/><Art item={item} index={i} id={`${id}-art-replacement`} w={101} h={101} t={t} replaced={flip > .5}/></g>;
      })}
      <g filter={`url(#${id}-small)`}><rect x="64" y={trayY + 345} width="415" height="60" rx="30" fill="#fffefd"/></g>
      <Text x={90} y={trayY + 382} size={fit(prompt, 327, 20, 12)} weight={600}>{prompt.slice(0, Math.floor(promptP * prompt.length))}{promptP < 1 ? <tspan fill={accent}>▏</tspan> : ''}</Text>
      <circle cx="447" cy={trayY + 375} r="21" fill={accent}/><path d={`M447 ${trayY + 386}V${trayY + 364}M439 ${trayY + 373}L447 ${trayY + 364}L455 ${trayY + 373}`} stroke="white" strokeWidth="3" strokeLinecap="round" fill="none"/>
      <Text x={272} y={trayY + 452} anchor="middle" size={16} family={SERIF} color="#79776e">{t >= replace ? scene.content.result ?? '' : ''}</Text>
      <path d={`M${272 - 42 * smooth(t, replace, resolve)} ${trayY + 462}h${84 * smooth(t, replace, resolve)}`} stroke={accent} strokeWidth="1.5"/>
    </g>
  </g>;
};

const Cursor: React.FC<{x: number; y: number; click: number}> = ({x, y, click}) => <g transform={`translate(${x} ${y})`}>
  <circle r={6 + 23 * click} fill="none" stroke={ACCENT} strokeWidth="2" opacity={Math.sin(click * Math.PI) * .8}/>
  <path d="M0 0L3 27L10 20L17 32L23 28L16 17L27 15Z" fill="#24261f" stroke="#fffefa" strokeWidth="1.7" strokeLinejoin="round"/>
</g>;

export const UiHandoff: React.FC<EffectProps> = ({scene, t, height}) => {
  const id = uid(scene.id, 'ui'), accent = scene.accent ?? ACCENT;
  const list = prepared(scene), selected = list.find(i => i.id === scene.content.selectedId) ?? list[0];
  const browse = mark(scene, 'browse', .11), select = mark(scene, 'select', .25), open = mark(scene, 'open', .39), copy = mark(scene, 'copy', .55), paste = mark(scene, 'paste', .68), send = mark(scene, 'send', .83), resolve = mark(scene, 'resolve', .96);
  const center = height * .49, pageY = center - 267, modalY = center - 149;
  const pageReveal = out(t, 0, browse), modal = smooth(t, select, open), chatting = smooth(t, copy, paste), resulting = smooth(t, send, resolve);
  const copying = smooth(t, mix(open, copy, .54), copy);
  const scroll = smooth(t, browse, select) * 85;
  const prompt = scene.content.prompt ?? '沿着这条线索，把内容整理成清楚的表达。';
  const typedP = progress(t, paste, send), chars = Math.floor(typedP * prompt.length);
  const urlLabel = (scene.content.url ?? 'example.org/collection/item').replace(/^https?:\/\//, '');
  const items = Array.from({length: 12}, (_, i) => list[i % list.length]);
  const galleryClip = `${id}-gallery`, previewClip = `${id}-preview`;
  const resultText = scene.content.result ?? selected.label;
  return <g>
    <Definitions id={id} accent={accent}/>
    <defs><clipPath id={galleryClip}><rect x="29" y={pageY + 36} width="486" height="502" rx="3"/></clipPath><clipPath id={previewClip}><rect x="66" y={modalY + 43} width="212" height="225" rx="4"/></clipPath></defs>
    <g opacity={1 - chatting}>
      <g opacity={pageReveal} transform={`translate(272 ${center}) scale(${mix(.94, 1, pageReveal)}) translate(-272 ${-center})`}>
        <g filter={`url(#${id}-paper)`}><rect x="28" y={pageY} width="488" height="538" rx="8" fill="#fffefb" stroke="#e2e5de"/></g>
        <rect x="29" y={pageY + 1} width="486" height="35" rx="7" fill="#fafbf7"/>
        {['#dba794', '#d8cc90', '#abc5ad'].map((c, i) => <circle key={i} cx={42 + i * 10} cy={pageY + 11} r="2.5" fill={c}/>)}
        <Text x={45} y={pageY + 28} size={8.8} weight={700}>素材收藏</Text><Text x={487} y={pageY + 26} anchor="end" size={7} color="#878c82">作品 / 收藏 / 示意</Text>
        <g clipPath={`url(#${galleryClip})`}>
          <g transform={`translate(0 ${-scroll})`}>
            <Text x={52} y={pageY + 88} size={fit(scene.title, 270, 28)} weight={700} family={SERIF}><TitleWords scene={scene}/></Text>
            <rect x="53" y={pageY + 101} width="135" height="2.5" fill={accent}/>
            <Text x={53} y={pageY + 124} size={8.7} color="#848b7d">{scene.content.body?.slice(0, 35) ?? '寻找灵感，把线索变成下一步行动。'}</Text>
            <rect x="54" y={pageY + 145} width="436" height="24" rx="12" fill="#f2f4ed"/><circle cx="70" cy={pageY + 157} r="4" fill="none" stroke="#9eaa98"/><path d={`M73 ${pageY + 160}l4 4`} stroke="#9eaa98"/><Text x={89} y={pageY + 160} size={8} color="#94a08d">按内容、风格与用途寻找</Text>
            <Text x={53} y={pageY + 193} size={9.5} weight={600}>精选内容</Text><Text x={487} y={pageY + 193} size={7.5} anchor="end" color="#9ca193">全部 · 最新 · 收藏</Text>
            {items.map((item, i) => {const x = 53 + (i % 4) * 113, y = pageY + 209 + Math.floor(i / 4) * 126 + (i % 2) * 6; return <g key={i} transform={`translate(${x} ${y})`}><rect x="-1" y="-1" width="102" height="118" rx="5" fill="#fff" stroke="#eceee7"/><Art item={item} index={i} id={`${id}-art-gallery`} w={100} h={92} t={t}/><Text x={4} y={105} size={fit(item.label, 90, 8.5, 6)} weight={600}>{item.label}</Text><Text x={4} y={115} size={5.3} color="#a5aa9b">COLLECTION · {String(i + 1).padStart(2, '0')}</Text></g>;})}
          </g>
        </g>
        <g opacity={1 - modal}><Cursor x={mix(469, 108, smooth(t, browse, select))} y={mix(pageY + 421, pageY + 241 - scroll, smooth(t, browse, select))} click={progress(t, select - .14, select + .14)}/></g>
      </g>
      <rect width="544" height={height} fill="#23332d" opacity={modal * .42}/>
      <g opacity={modal} transform={`translate(272 ${center}) scale(${mix(.88, 1, modal)}) translate(-272 ${-center})`}>
        <g filter={`url(#${id}-paper)`}><rect x="48" y={modalY} width="450" height="305" rx="13" fill="#fff"/></g>
        <Text x={66} y={modalY + 25} size={9} weight={600} color="#7e897b">内容详情</Text><Text x={478} y={modalY + 24} size={17} anchor="middle" color="#899283">×</Text>
        <path d={`M49 ${modalY + 34}h448`} stroke="#edf0e8"/>
        <g clipPath={`url(#${previewClip})`}><g transform={`translate(66 ${modalY + 43})`}><Art item={selected} index={2} id={`${id}-art-preview`} w={212} h={225} t={t} poster/></g></g>
        <Text x={293} y={modalY + 68} size={fit(selected.label, 182, 17, 10)} weight={700}>{selected.label}</Text>
        <Text x={293} y={modalY + 92} size={8} color="#8b9587">已选中的内容 · 原始线索</Text>
        {wrap(scene.content.body ?? '保留有价值的结构，把它带到下一步。', 16).slice(0, 4).map((line, i) => <Text key={i} x={293} y={modalY + 120 + i * 16} size={9.5} color="#677361">{line}</Text>)}
        <rect x="292" y={modalY + 181} width="187" height="56" rx="8" fill="#f1f5ec" stroke="#e4ebdf"/>
        <Text x={305} y={modalY + 202} size={9.5} color="#587450">{copying > .7 ? '✓ 链接已复制' : '继续使用这份内容'}</Text>
        <Text x={305} y={modalY + 219} size={8} color="#98a18e">保持来源与对象的连续</Text>
        <Text x={291} y={modalY + 281} size={7.8} color="#95a28c">界面为可编辑示意</Text>
        <g opacity={1 - copying}><Cursor x={mix(451, 447, smooth(t, open, copy))} y={mix(modalY + 178, modalY + 256, smooth(t, open, copy))} click={progress(t, copy - .15, copy + .16)}/></g>
      </g>
    </g>
    <g opacity={chatting * (1 - resulting)}>
      <rect width="544" height={height} fill="#eaf4ec" opacity={chatting}/>
      {[[-172, -247], [214, -196], [-206, 199], [199, 218]].map(([x, y], i) => <g key={i} transform={`translate(${272 + x} ${center + y}) rotate(${i * 29 + t * 2})`} opacity={chatting}><path d="M-7-7Q0-3 7-7Q3 0 7 7Q0 3-7 7Q-3 0-7-7Z" fill={PALETTE[i + 1]} stroke="#577062" strokeWidth="1.5"/></g>)}
      <g transform={`translate(272 ${center - 51}) scale(${mix(.84, 1, chatting)}) translate(-272 ${-center + 51})`}>
        <rect x="44" y={center - 154} width="459" height="318" rx="21" fill="#364338" opacity=".12"/>
        <rect x="41" y={center - 158} width="462" height="318" rx="21" fill="#fff" stroke="#2d3a30" strokeWidth="2.8"/>
        <path d={`M42 ${center - 110}H502`} stroke="#2d3a30" strokeWidth="2.5"/>
        {['#efd58b', '#e6b5a7', '#aed9ca'].map((c, i) => <circle key={i} cx={69 + i * 22} cy={center - 135} r="5.5" fill={c} stroke="#2d3a30" strokeWidth="2"/>)}
        <Text x={284} y={center - 128} size={19} weight={700} anchor="middle">继续创作</Text><Text x={473} y={center - 128} size={8} anchor="end" color="#84937c">示意</Text>
      </g>
      <g opacity={smooth(t, paste, mix(paste, send, .27))}>
        <rect x="66" y={center - 17} width="308" height="59" rx="10" fill="#283b2d"/>
        <rect x="62" y={center - 21} width="308" height="59" rx="10" fill="#fae4a9" stroke="#2d3a30" strokeWidth="2"/>
        <g transform={`translate(70 ${center - 13})`}><Art item={selected} index={2} id={`${id}-art-attached`} w={58} h={43} t={t}/></g>
        <Text x={143} y={center + 13} size={fit(selected.label, 205, 14, 8)} weight={600}>{selected.label}</Text>
      </g>
      {wrap(prompt.slice(0, chars), 17.5).slice(0, 3).map((line, i) => <Text key={i} x={65} y={center + 79 + i * 28} size={20} weight={600}>{line}{i === wrap(prompt.slice(0, chars), 17.5).length - 1 && typedP < 1 ? <tspan fill={accent}>▏</tspan> : ''}</Text>)}
      <g transform={`translate(454 ${center + 121}) scale(${1 + .13 * Math.sin(progress(t, send - .16, send + .12) * Math.PI)})`}><circle r="24" fill="#aedbcc" stroke="#2d3a30" strokeWidth="2.6"/><path d="M0 12V-12M-10-1L0-12L10-1" stroke="#2d3a30" strokeWidth="3.4" fill="none"/></g>
    </g>
    {/* The URL is deliberately one element through modal, lift, and chat. */}
    <g opacity={modal * (1 - resulting)} transform={`translate(${mix(293, 64, chatting)} ${mix(modalY + 244, center - 90, chatting)}) rotate(${-1.5 * chatting})`}>
      <rect x={chatting * 4} y={chatting * 4} width={mix(186, 369, chatting)} height={mix(30, 40, chatting)} rx={mix(8, 20, chatting)} fill="#2d3a30" opacity={chatting}/>
      <rect width={mix(186, 369, chatting)} height={mix(30, 40, chatting)} rx={mix(8, 20, chatting)} fill={chatting > .1 ? '#b9e4d4' : copying > .7 ? '#e8f1e1' : '#fff'} stroke={chatting > .1 ? '#2d3a30' : '#dbe2d3'} strokeWidth={mix(1, 2.2, chatting)}/>
      <g transform={`translate(17 ${mix(15, 20, chatting)})`}><path d="M-2-3L1-6A4 4 0 0 1 7 0L4 3M2 3L-1 6A4 4 0 0 1-7 0L-4-3M-3 3L3-3" stroke="#456843" fill="none" strokeWidth="1.5"/></g>
      <Text x={30} y={mix(20, 26, chatting)} size={fit(urlLabel, mix(144, 325, chatting), mix(10, 14, chatting), 6.5)} weight={600} color="#395b40">{urlLabel}</Text>
    </g>
    <g opacity={resulting} transform={`translate(${(1 - resulting) * 56} ${(1 - resulting) * 23}) rotate(${-2 * resulting} 272 ${center})`}>
      <g filter={`url(#${id}-paper)`}><rect x="71" y={center - 153} width="405" height="309" rx="10" fill="#fffffa"/></g>
      <path d={`M105 ${center - 109}H442`} stroke="#92998a" strokeWidth=".8"/>
      <Text x={106} y={center - 89} size={8} family={MONO} color="#9a9e91">A NEW EXPRESSION / 新的表达</Text>
      {wrap(resultText, 13).slice(0, 3).map((line, i) => <g key={i}>{i === 1 ? <rect x="105" y={center - 61 + i * 34} width={Math.min(325, line.length * 24) * smooth(t, mix(send, resolve, .75), resolve)} height="26" fill="#f0dab7"/> : null}<Text x={106} y={center - 40 + i * 34} size={25} family={SERIF} weight={700}>{line}</Text></g>)}
      {wrap(scene.content.body ?? prompt, 27).slice(0, 3).map((line, i) => <Text key={i} x={106} y={center + 67 + i * 16} size={10} family={SERIF} color="#7d8174">{line}</Text>)}
      <rect x="365" y={center + 121} width="86" height="21" rx="3" fill="#b9dfcb"/><Text x={407} y={center + 135} size={9} anchor="middle" weight={600} color="#385948">内容已接上</Text>
    </g>
  </g>;
};
