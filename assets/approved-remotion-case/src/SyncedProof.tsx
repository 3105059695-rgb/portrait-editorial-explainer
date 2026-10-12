import React from 'react';
import captions from './captions.json';

// The voice does not move: these semantic triggers derive from its subtitle cues.
const cue = (text: string) => {
  const match = captions.find(item => item.text === text);
  if (!match) throw new Error(`Missing proof cue: ${text}`);
  return match;
};
const CHECK = cue('是证明怎么被检查。').start;
const WRITE = cue('模型写出推导，').start;
const SELECT = cue('再把其中一部分，').start;
const FORMAL = cue('转成可以由计算机检查的形式化证明。').start;
const RESULT = cue('转成可以由计算机检查的形式化证明。').end - .32;
const DATE = cue('按十月七日的更新，').start;
const TOTAL = cue('七百一十九项主要结果中，').start;
const VERIFIED = cue('已有三百项完成形式化，').start;
const RATIO = cue('大约百分之四十二。').start;
export const SYNCHRONIZED_PROOF_EVENTS = [
  {time: CHECK, label: '镜头锁定纸上的证明'},
  {time: WRITE, label: '模型逐行写出推导'},
  {time: SELECT, label: '选中同一段公式'},
  {time: FORMAL, label: '公式从纸页拖入 Lean'},
  {time: RESULT, label: '检查器返回 no goals'},
  {time: DATE, label: '十月七日更新日期落印'},
  {time: TOTAL, label: '719 项白色稿件展开'},
  {time: VERIFIED, label: '300 项开始逐一变绿'},
  {time: RATIO, label: '42% 比例落位'},
];

/** Continuous paper → selection → editor → proof corpus. All geometry follows t. */
const INK = '#22241f';
const RUST = '#b65c3e';
const GREEN = '#347767';
const SANS = '"Noto Sans SC", sans-serif';
const SERIF = '"Noto Serif SC", serif';
const MONO = '"Cascadia Code", "Consolas", monospace';
const clamp = (v: number) => Math.max(0, Math.min(1, v));
const lerp = (a: number, b: number, p: number) => a + (b - a) * p;
const p = (t: number, a: number, b: number) => clamp((t - a) / (b - a));
const e = (t: number, a: number, b: number) => 1 - (1 - p(t, a, b)) ** 3;
const sm = (t: number, a: number, b: number) => { const x = p(t, a, b); return x * x * (3 - 2 * x); };
const pt = (xy: number[]) => xy.map(v => v.toFixed(2)).join(',');
const cur = (value: string, t: number, a: number, b: number) => value.slice(0, Math.floor(value.length * p(t, a, b)));

const Pointer: React.FC<{x: number; y: number; scale?: number; click?: number}> = ({x, y, scale = 1, click = 0}) => <g transform={`translate(${x} ${y}) scale(${scale})`}>
  {click > 0 && <circle r={8 + 25 * click} fill="none" stroke={RUST} strokeWidth="2" opacity={1 - click}/>} 
  <path d="M0 0L3 24L10 17L16 27L21 24L15 14L26 12Z" fill="#191b18" stroke="#fffefa" strokeWidth="1.8" strokeLinejoin="round"/>
</g>;

const Paper: React.FC<{t: number}> = ({t}) => {
  const focus = sm(t, CHECK, WRITE - .12);
  const exit = e(t, FORMAL - .2, FORMAL + .72);
  const scale = lerp(1.05, 1.49, focus);
  const x = lerp(22, -56, focus);
  const y = lerp(47, -5, focus) - exit * 780;
  const selection = p(t, SELECT, SELECT + .52);
  const written = cur('∀ n ∈ ℕ, n + 0 = n', t, WRITE + .05, SELECT - .1);
  const detached = sm(t, FORMAL - .32, FORMAL - .18);
  return <g opacity={1 - p(t, FORMAL + .13, FORMAL + .75)} transform={`translate(${x} ${y}) rotate(${lerp(-5, -1, focus)} 248 315) scale(${scale})`}>
    <rect x="8" y="8" width="470" height="650" rx="3" fill="#c7c5bd" opacity=".2"/>
    <rect width="470" height="650" rx="3" fill="url(#kp-page)" stroke="#d8d7cf" filter="url(#kp-paper-shadow)"/>
    <g fill={INK}>
      <text x="32" y="38" fontSize="8" letterSpacing="2">MATHEMATICAL RESEARCH · 工作手稿示意</text>
      <path d="M32 50H438" stroke="#45483f" strokeWidth=".7"/>
      <text x="32" y="92" fontFamily={SERIF} fontSize="25" fontWeight="700">证明，不止看答案。</text>
      <text x="33" y="120" fontSize="9" fill="#74766b">从自然语言的论证，到可逐步检查的形式表达。</text>
      <text x="32" y="158" fontSize="10" fontWeight="700">01 明确对象与假设</text>
      {[0,1,2,3].map(i => <g key={i} fill="#686d61" opacity=".42">
        <rect x="32" y={173 + i * 10} width={386 - i % 3 * 22} height="2"/><rect x="32" y={177 + i * 10} width={351 - i % 2 * 18} height="1"/>
      </g>)}
      <text x="32" y="242" fontSize="10" fontWeight="700">02 将每一步变得可核验</text>
      <g opacity={1 - detached}>
        <rect x="45" y="264" width={345 * selection} height="52" fill="#e4b497" opacity=".78"/>
        <text x="49" y="298" fontFamily="Tinos, serif" fontSize="28" fontStyle="italic">{written}</text>
        {t >= WRITE && t < SELECT - .1 && <path d={`M${49 + written.length * 13.1} 277v27`} stroke={RUST} strokeWidth="1.6"/>}
        <path d={`M51 308H${51 + 322 * selection}`} stroke={RUST} strokeWidth="1.4"/>
      </g>
      <text x="32" y="346" fontSize="9" fill="#6e7465">小例子：自然数加零，结果仍是它本身。</text>
      {[0,1,2,3,4,5,6,7,8].map(i => <g key={i} fill="#6c7165" opacity={.37 * e(t, WRITE + i * .09, WRITE + .18 + i * .09)}>
        <rect x="32" y={366 + i * 11} width={i === 8 ? 164 : 395 - i % 3 * 17} height="1.8"/>
        <rect x="32" y={370 + i * 11} width={i === 8 ? 109 : 352 - i % 4 * 10} height="1"/>
      </g>)}
      <text x="32" y="504" fontSize="10" fontWeight="700">03 由检查器确认逻辑步骤</text>
      <text x="33" y="540" fontFamily="Tinos, serif" fontStyle="italic" fontSize="18">assumptions → proof steps → conclusion</text>
      <path d="M32 601H438" stroke="#dddcd3"/>
      <text x="32" y="622" fill="#81867b" fontSize="8">用于解释形式化机制；不代表前沿研究的真实运行记录。</text>
      <text x="438" y="622" fill="#81867b" fontSize="8" textAnchor="end">1 / 719</text>
    </g>
    {t >= SELECT && t < FORMAL - .18 && <Pointer x={lerp(58, 382, selection)} y={305} scale={.7}/>} 
  </g>;
};

const Editor: React.FC<{t: number}> = ({t}) => {
  const enter = e(t, FORMAL - .56, FORMAL + .42);
  const focus = sm(t, FORMAL + .08, FORMAL + .85);
  const inspect = sm(t, RESULT - .53, RESULT + .03);
  const leave = sm(t, 29.25, 30.2);
  const scale = lerp(1, 1.19, focus) - leave * .38;
  const x = lerp(-68, -154, focus) + inspect * 16 + leave * 265;
  const y = lerp(790, 131, enter) - focus * 20 - inspect * 61 - leave * 4;
  const run = e(t, RESULT - .32, RESULT - .13);
  const done = p(t, RESULT, RESULT + .13);
  const isTyping = t > FORMAL + .2 && t < RESULT - .35;
  const proofText = cur('example (n : Nat) : n + 0 = n := by', t, FORMAL + .28, FORMAL + .98);
  const simpText = cur('  simp', t, FORMAL + 1.03, RESULT - .38);
  return <g opacity={1 - p(t, 29.75, 30.35)} transform={`translate(${x} ${y}) rotate(${lerp(-3, 1.3, inspect) - leave * 12} 356 236) skewY(${lerp(-2, 0, focus)}) scale(${scale})`}>
    <rect x="0" y="0" width="714" height="494" rx="12" fill="#141815" filter="url(#kp-editor-shadow)"/>
    <rect x="1" y="1" width="712" height="492" rx="11" fill="none" stroke="#586158" strokeWidth="1"/>
    <path d="M1 40H713" stroke="#394039"/>
    <g>{['#df8172','#d0b774','#85b9a0'].map((color,i)=><circle key={i} cx={20+i*14} cy="21" r="3.6" fill={color}/>)}</g>
    <text x="91" y="25" fill="#bec9be" fontSize="11" fontFamily={MONO}>proof-workspace</text>
    <rect x="430" y="11" width="141" height="22" rx="5" fill="#3c443b"/>
    <text x="500" y="26" textAnchor="middle" fill="#e5e8db" fontSize="10">Lean 界面示意</text>
    <rect x="1" y="41" width="151" height="422" fill="#191e1a"/>
    <text x="18" y="67" fill="#8a968a" fontFamily={MONO} fontSize="9" letterSpacing="1">EXPLORER</text>
    <text x="16" y="96" fill="#c2c9be" fontSize="10">⌄ MATH-RESEARCH</text>
    {['proofs','check.lean','notes.md','sources.json','results','verified','pending'].map((f,i)=><g key={f} opacity={1 - leave * .75}>
      {i===1 && <rect x="5" y={107+i*29} width="144" height="28" fill="#313a30"/>}
      <text x={i===1?32:22} y={125+i*29} fill={i===1?'#dce9d6':'#849182'} fontFamily={MONO} fontSize="11">{i===0||i===4?'⌄ ':'· '}{f}</text>
    </g>)}
    <path d="M152 40V463" stroke="#3a4238"/>
    <rect x="153" y="41" width="154" height="35" fill="#282f27"/>
    <path d="M153 42H307" stroke={RUST} strokeWidth="2"/>
    <text x="169" y="64" fill="#e0e5db" fontFamily={MONO} fontSize="12">check.lean ×</text>
    <text x="175" y="95" fill="#657263" fontFamily={MONO} fontSize="9">proofs / check.lean / example</text>
    <g fontFamily={MONO} fontSize="15">
      {Array.from({length:9},(_,i)=><text key={i} x="191" y={129+i*29} textAnchor="end" fill={i===4?'#d3ddc8':'#65715e'} fontSize="12">{i+1}</text>)}
      <text x="212" y="129" fill="#71816d">-- 用一个小例子解释检查机制</text>
      <text x="212" y="158" fill="#a9b699">import <tspan fill="#d8cc9b">Mathlib</tspan></text>
      <rect x="205" y="218" width="503" height="30" fill="#344432" opacity={.55 + run * .15}/>
      <text x="212" y="245" fill="#ebdec4">{proofText}</text>
      <text x="212" y="274" fill="#c3cb92">{simpText}</text>
      {isTyping && <rect x={t<FORMAL+1.03?212+proofText.length*9.03:212+simpText.length*9.03} y={t<FORMAL+1.03?227:256} width="1.8" height="20" fill="#ebecdc"/>}
      <text x="212" y="332" fill="#6b7963" fontSize="11">-- 小例子通过 ≠ 前沿研究已被证明</text>
    </g>
    <g transform={`translate(512 356) scale(${1 - .065 * Math.sin(run * Math.PI)})`}>
      <rect width="150" height="34" rx="6" fill={done > 0?'#49715a':'#d3dbc6'}/>
      <text x="75" y="23" textAnchor="middle" fontSize="12" fontWeight="700" fill={done>0?'#ebf2e4':'#243420'}>{done>0?'✓ 检查通过':'▶ 检查这一步'}</text>
    </g>
    {t>RESULT-.4 && t<RESULT+.1 && <Pointer x={583} y={374} scale={.8} click={p(t,RESULT-.32,RESULT+.06)}/>} 
    <g opacity={e(t,RESULT,RESULT+.2)} transform={`translate(153 ${lerp(491, 400, e(t,RESULT,RESULT+.2))})`}>
      <rect width="560" height="64" fill="#101510"/>
      <path d="M0 0H560" stroke="#53684b"/>
      <text x="21" y="21" fontFamily={MONO} fontSize="10" fill="#899a7e">OUTPUT PROBLEMS LEAN INFO</text>
      <text x="22" y="48" fontFamily={MONO} fontSize="13" fill="#b8d1a8">✓ no goals <tspan fill="#798c70" fontSize="10">· 该示例的证明义务已完成</tspan></text>
    </g>
    <rect x="1" y="464" width="712" height="28" rx="0" fill="#283c2c"/>
    <text x="18" y="483" fill="#b1c6a8" fontFamily={MONO} fontSize="10">main ✓ 0 errors ◉ Lean</text>
    <text x="693" y="483" textAnchor="end" fill="#b1c6a8" fontFamily={MONO} fontSize="9">UTF-8 Ln 5, Col 7</text>
  </g>;
};

const Selection: React.FC<{t:number}> = ({t}) => {
  const start = FORMAL - .32;
  const end = FORMAL + .47;
  const v = sm(t,start,end);
  if (t < start || t > end + .13) return null;
  // This is the selected paper equation, lifted from precisely its focused pose.
  return <g opacity={1-p(t,end-.03,end+.13)} transform={`translate(${lerp(17,111,v)} ${lerp(437,400,v)-72*Math.sin(v*Math.PI)}) rotate(${lerp(-1,-2,v)}) scale(${lerp(1.18,.59,v)})`} filter="url(#kp-paper-shadow)">
    <rect x="-5" y="-30" width="320" height="57" rx="5" fill="#f6dfc6" stroke={RUST} strokeWidth="1.3"/>
    <text x="9" y="9" fontFamily="Tinos, serif" fontSize="33" fontStyle="italic" fill={INK}>∀ n ∈ ℕ, n + 0 = n</text>
    <Pointer x={300} y={18} scale={.72}/>
  </g>;
};

type Sheet = {id:number; x:number; z:number};
const sheets:Sheet[] = Array.from({length:719},(_,id)=>({id,x:(id%32-15.5)*36,z:Math.floor(id/32)*47}));

const Corpus: React.FC<{t:number}> = ({t}) => {
  const born = e(t,29.55,30.5);
  const fly = sm(t,TOTAL,TOTAL+2.3);
  const pull = sm(t,VERIFIED + .15,RATIO+.35);
  const flat = sm(t,34.6,35.35);
  const dive = sm(t,35.9,37.5);
  const total = Math.floor(300 * sm(t,VERIFIED, RATIO - .18));
  const pitch = lerp(.41,1.29,pull);
  const cameraZ = lerp(-145,175,fly) - pull*260;
  const height = lerp(156,870,pull);
  const cameraX = -95 + fly*190 - pull*55;
  const project = (x:number,z:number) => {
    const dz=z-cameraZ;
    const depth=Math.max(28,dz*Math.cos(pitch)+height*Math.sin(pitch));
    // Screen y grows down: the near floor must project below the horizon.
    return [272+(x-cameraX)*340/depth, 330-(dz*Math.sin(pitch)-height*Math.cos(pitch))*340/depth];
  };
  const positions = (sheet:Sheet,dx:number,dz:number) => {
    const world=project(sheet.x+dx,sheet.z+dz);
    const verified=sheet.id<300;
    const idx=verified?sheet.id:sheet.id-300;
    const columns=verified?15:20;
    const target=[(verified?36:269)+(idx%columns)*11.8+dx/36*9.3, 266+Math.floor(idx/columns)*13.3+dz/47*10.8];
    const source=[272+(sheet.id%11-5)*.45,340+Math.floor(sheet.id/11)*.15];
    const sprung=[lerp(source[0],world[0],born),lerp(source[1],world[1],born)];
    return [lerp(sprung[0],target[0],flat),lerp(sprung[1],target[1],flat)];
  };
  const selected = sheets[474];
  const selA = positions(selected,-13,-18);
  const selB = positions(selected,13,18);
  const targetCx=(selA[0]+selB[0])/2, targetCy=(selA[1]+selB[1])/2;
  const stageScale=lerp(1,3.6,dive);
  const stageX=lerp(0,272-targetCx*3.6,dive);
  const stageY=lerp(0,340-targetCy*3.6,dive);
  return <>
    <g opacity={born}>
      <g transform={`translate(${stageX} ${stageY}) scale(${stageScale})`} opacity={1-p(t,36.35,37.18)}>
        <ellipse cx="272" cy="492" rx="361" ry="55" fill="#898b81" opacity={.10*(1-flat)}/>
        {sheets.slice().reverse().map(sheet=>{
          const depth=(sheet.z-cameraZ)*Math.cos(pitch)+height*Math.sin(pitch);
          if(depth<42&&flat<.01)return null;
          const corners=[positions(sheet,-13,-18),positions(sheet,13,-18),positions(sheet,13,18),positions(sheet,-13,18)];
          const poly=corners.map(pt).join(' ');
          const active=sheet.id<total;
          const nw=corners[0],ne=corners[1],sw=corners[3],se=corners[2];
          const yoff=(sw[1]-nw[1])*.27;
          const front=1-clamp((sheet.z-180)/1250);
          return <g key={sheet.id} opacity={.62+.38*front}>
            <polygon points={corners.map(x=>pt([x[0]+.7,x[1]+1.4])).join(' ')} fill="#798274" opacity=".18"/>
            <polygon points={poly} fill={active?'#d2e7d9':'#fffefa'} stroke={active?'#5c937e':'#b9bcb0'} strokeWidth={lerp(.8,.35,flat)}/>
            <path d={`M${pt([lerp(nw[0],ne[0],.18),nw[1]+yoff])}L${pt([lerp(nw[0],ne[0],.78),ne[1]+yoff])}`} stroke={active?'#397967':'#a5aa9c'} strokeWidth={lerp(1.8,.55,flat)}/>
            <path d={`M${pt([lerp(sw[0],se[0],.16),sw[1]-(sw[1]-nw[1])*.3])}L${pt([lerp(sw[0],se[0],.64),se[1]-(se[1]-ne[1])*.3])}`} stroke={active?'#75aa94':'#c6c9bf'} strokeWidth={lerp(1.1,.5,flat)}/>
            {active && <path d={`M${pt([lerp(sw[0],se[0],.68),lerp(nw[1],sw[1],.55)])}l${lerp(1.1,.9,flat)} ${lerp(1.1,.8,flat)}l${lerp(3.1,2.1,flat)} ${lerp(-3.5,-2.0,flat)}`} fill="none" stroke={GREEN} strokeWidth=".7"/>}
          </g>;
        })}
        {t>=VERIFIED&&t<RATIO&&<g>
          {[-25,-12,0,12,25].map((dz,i)=>{
            const z=Math.floor(total/32)*47+dz;
            const a=project(-610,z),b=project(610,z);
            return <path key={dz} d={`M${pt(a)}L${pt(b)}`} stroke="#64a58a" strokeWidth={i===2?2.5:8} opacity={i===2?.8:.055}/>;
          })}
        </g>}
        <g opacity={flat * e(t,RATIO-.18,RATIO+.12)}>
          <path d="M34 565H210M268 565H505" stroke="#949b8e" strokeWidth="1"/>
          <text x="122" y="585" textAnchor="middle" fontSize="12" fontWeight="700" fill={GREEN}>300 项已形式化核验</text>
          <text x="386" y="585" textAnchor="middle" fontSize="12" fill="#6f786a">其余 419 项</text>
        </g>
      </g>
      <g opacity={e(t,DATE,DATE+.18)*(1-p(t,35.8,36.2))}>
        <g transform={`translate(34 ${lerp(117,74,sm(t,TOTAL-.1,TOTAL+.3))}) scale(${lerp(1,.49,sm(t,TOTAL-.1,TOTAL+.3))})`}>
          <text fill={INK} fontFamily="Tinos, serif" fontWeight="700" fontSize="53">10 / 07</text>
          <text y="27" fill={RUST} fontSize="15" fontWeight="700" letterSpacing="2">十月七日 · 研究更新</text>
          <path d={`M0 39H${210*e(t,DATE+.08,DATE+.34)}`} stroke={RUST} strokeWidth="2"/>
        </g>
      </g>
      <g opacity={e(t,TOTAL,TOTAL+.22)*(1-p(t,VERIFIED,VERIFIED+.3))} transform={`translate(272 ${lerp(231,187,e(t,TOTAL,TOTAL+.35))})`}>
        <text textAnchor="middle" fontFamily="Tinos, serif" fontSize="99" fontWeight="700" fill={INK}>719</text>
        <text y="34" textAnchor="middle" fontSize="21" fill="#535d4b" fontWeight="700">项主要结果</text>
      </g>
      {t>=VERIFIED&&t<RATIO+.03&&<g transform={`translate(${lerp(360,309,fly)} ${lerp(451,418,fly)})`}>
        <rect x="-16" y="-27" width="182" height="66" rx="7" fill="#22392d" filter="url(#kp-small-shadow)"/>
        <text x="0" y="0" fontFamily={MONO} fontSize="22" fontWeight="700" fill="#e4eddb">{String(total).padStart(3,'0')}<tspan fontSize="12" fill="#9caf98"> / 719</tspan></text>
        <text x="0" y="23" fontSize="10" fill="#b4c7ab">形式化核验项数</text>
      </g>}
      <g opacity={e(t,VERIFIED+.1,VERIFIED+.4)*(1-p(t,35.65,36.25))} transform={`translate(272 ${lerp(213,124,e(t,VERIFIED+.1,RATIO-.18))-55*e(t,35.65,36.25)})`}>
        <text y="0" textAnchor="middle" fontFamily="Tinos, serif" fontSize="65" fontWeight="700" fill={INK}>{total} <tspan fill="#9ea495" fontSize="39">/</tspan> 719</text>
        <g opacity={e(t,RATIO,RATIO+.2)} transform={`translate(0 ${lerp(16,0,e(t,RATIO,RATIO+.25))})`}>
          <text y="58" textAnchor="middle" fontFamily="Tinos, serif" fontSize="47" fontWeight="700" fill={GREEN}>≈ 42<tspan fontSize="29">%</tspan></text>
          <path d={`M${-62*e(t,RATIO+.05,RATIO+.32)} 70H${62*e(t,RATIO+.05,RATIO+.32)}`} stroke={RUST} strokeWidth="3"/>
          <text y="101" textAnchor="middle" fontSize="11" fill="#777e71">绿色纸页与 300 项一一对应</text>
        </g>
      </g>
      <g opacity={e(t,36.05,36.62)} transform={`translate(${lerp(targetCx,153,e(t,36.05,37.4))} ${lerp(targetCy,169,e(t,36.05,37.4))}) rotate(${lerp(0,-4,e(t,36.1,37.4))} 125 160) scale(${lerp(.048,1,e(t,36.05,37.4))})`}>
        <rect width="250" height="321" fill="url(#kp-page)" stroke="#cecec4" filter="url(#kp-paper-shadow)"/>
        <text x="22" y="31" fontSize="8" letterSpacing="1.3" fill="#7b8274">ITEM 475 / 719</text>
        <path d="M22 43H228" stroke="#d6d8ce"/>
        <text x="125" y="184" textAnchor="middle" fontFamily="Tinos, serif" fontSize="137" fontStyle="italic" fill={RUST}>?</text>
        <text x="125" y="221" textAnchor="middle" fontSize="16" fontWeight="700" fill={INK}>待进一步核验</text>
        {[0,1,2,3,4].map(i=><path key={i} d={`M23 ${250+i*7}H${220-i%2*28}`} stroke="#b9bfb0" strokeWidth="1"/>)}
        <circle cx="216" cy="30" r="5" fill="none" stroke={RUST} strokeWidth="1.5"/>
      </g>
    </g>
  </>;
};

export const SyncedProof:React.FC<{t:number}> = ({t}) => <svg width="544" height="720" viewBox="0 0 544 720" style={{display:'block',overflow:'hidden',fontFamily:SANS}}>
  <defs>
    <linearGradient id="kp-bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#e6e8e0"/><stop offset=".55" stopColor="#f7f8f0"/><stop offset="1" stopColor="#e7e9df"/></linearGradient>
    <linearGradient id="kp-page" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#fffefa"/><stop offset=".8" stopColor="#fafbf2"/><stop offset="1" stopColor="#e9ebdf"/></linearGradient>
    <radialGradient id="kp-vignette"><stop offset=".45" stopColor="#323c2a" stopOpacity="0"/><stop offset="1" stopColor="#323c2a" stopOpacity=".11"/></radialGradient>
    <filter id="kp-paper-shadow" x="-45%" y="-40%" width="200%" height="200%"><feDropShadow dx="2" dy="13" stdDeviation="12" floodColor="#29301e" floodOpacity=".2"/><feDropShadow dx="1" dy="2" stdDeviation="2" floodColor="#29301e" floodOpacity=".12"/></filter>
    <filter id="kp-editor-shadow" x="-30%" y="-30%" width="170%" height="190%"><feDropShadow dx="10" dy="24" stdDeviation="20" floodColor="#26331c" floodOpacity=".36"/></filter>
    <filter id="kp-small-shadow" x="-40%" y="-40%" width="190%" height="190%"><feDropShadow dx="0" dy="5" stdDeviation="5" floodColor="#26331c" floodOpacity=".24"/></filter>
    <pattern id="kp-grain" width="17" height="23" patternUnits="userSpaceOnUse"><circle cx="3" cy="9" r=".4" fill="#5d6255" opacity=".11"/><circle cx="11" cy="19" r=".3" fill="#ffffff" opacity=".36"/></pattern>
  </defs>
  <rect width="544" height="720" fill="url(#kp-bg)"/>
  <rect width="544" height="720" fill="url(#kp-grain)"/>
  {t<FORMAL+.8&&<Paper t={t}/>}
  {t>=FORMAL-.56&&t<30.35&&<Editor t={t}/>}
  {t>=FORMAL-.32&&t<FORMAL+.62&&<Selection t={t}/>}
  {t>=29.55&&<Corpus t={t}/>}
  <rect width="544" height="720" fill="url(#kp-vignette)" pointerEvents="none"/>
</svg>;
