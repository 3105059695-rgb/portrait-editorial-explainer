import React from "react";

// A continuous chain of physical metaphors. Every cut inherits a paper, a mark,
// a lens, or the same AI chip; there are deliberately no slide/header layouts.
const ink = "#282338";
const cream = "#fff6da";
const clamp = (v: number) => Math.max(0, Math.min(1, v));
const ease = (v: number) => 1 - (1 - clamp(v)) ** 3;
const smooth = (v: number) => {
  const p = clamp(v);
  return p * p * (3 - 2 * p);
};
const pop = (v: number) =>
  v < 0 ? 0 : 1 - Math.exp(-9 * v) * Math.cos(15 * v);
const lerp = (a: number, b: number, p: number) => a + (b - a) * p;
const font = '"Noto Sans SC",sans-serif';

const Star: React.FC<{ x: number; y: number; s?: number; fill?: string }> = ({
  x,
  y,
  s = 1,
  fill = "#ffe066",
}) => (
  <path
    transform={`translate(${x} ${y}) scale(${s})`}
    d="M0 -12L4 -4L12 0L4 4L0 12L-4 4L-12 0L-4 -4Z"
    fill={fill}
    stroke={ink}
    strokeWidth="1.8"
  />
);

const Stage: React.FC<{
  color: string;
  t: number;
  dark?: boolean;
  cx?: number;
  cy?: number;
}> = ({ color, t, dark = false, cx = 272, cy = 370 }) => (
  <>
    <rect width="544" height="720" fill={color} />
    {Array.from({ length: 18 }, (_, i) => (
      <path
        key={i}
        d={`M${cx} ${cy}L${cx - 145} -600L${cx + 24} -600Z`}
        fill={dark ? "#e4c4ff" : "#fff"}
        opacity={dark ? 0.055 : 0.17}
        transform={`rotate(${i * 20 + t * 0.45} ${cx} ${cy})`}
      />
    ))}
    <rect
      width="544"
      height="720"
      fill="url(#kc-dots)"
      opacity={dark ? 0.32 : 0.52}
    />
    {[
      [49, 200, 0.55],
      [470, 288, 0.8],
      [64, 512, 0.7],
      [457, 568, 0.48],
      [414, 104, 0.42],
    ].map(([x, y, s], i) => (
      <Star
        key={i}
        x={x}
        y={y + Math.sin(t * 1.2 + i) * 2}
        s={s}
        fill={dark ? "#ffe78b" : "#ffdb69"}
      />
    ))}
  </>
);

const Burst: React.FC<{ x: number; y: number; p: number; color?: string }> = ({
  x,
  y,
  p,
  color = ink,
}) => (
  <g transform={`translate(${x} ${y})`} opacity={1 - clamp(p)}>
    {Array.from({ length: 9 }, (_, i) => (
      <path
        key={i}
        d={`M0 ${-24 - 50 * p}V${-38 - 65 * p}`}
        stroke={color}
        strokeWidth="3"
        strokeLinecap="round"
        transform={`rotate(${i * 40})`}
      />
    ))}
  </g>
);

const Paper: React.FC<{
  x?: number;
  y?: number;
  s?: number;
  r?: number;
  id?: number;
  mark?: boolean;
  lines?: boolean;
}> = ({ x = 0, y = 0, s = 1, r = 0, id = 1, mark = false, lines = true }) => (
  <g transform={`translate(${x} ${y}) rotate(${r}) scale(${s})`}>
    <path
      d="M-65 -88L47 -87L65 -68L64 88L-65 86Z"
      fill="#aba6bc"
      opacity=".3"
      transform="translate(5 7)"
    />
    <path
      d="M-65 -88L47 -87L65 -68L64 88L-65 86Z"
      fill="#fffdf2"
      stroke={ink}
      strokeWidth="3.5"
      strokeLinejoin="round"
    />
    <path
      d="M47 -87L46 -68L64 -68M-65 75L-65 -88M-50 86L27 87M36 87L47 87"
      fill="none"
      stroke={ink}
      strokeWidth="3.2"
      strokeLinecap="round"
    />
    <text
      x="-47"
      y="-57"
      fontFamily="Tinos,serif"
      fontSize="11"
      fontStyle="italic"
      fill={ink}
    >
      Research note / {String(id).padStart(2, "0")}
    </text>
    <path d="M-48 -43H43" stroke={ink} strokeWidth="1.4" />
    <text
      x="0"
      y="-10"
      textAnchor="middle"
      fontFamily="Tinos,serif"
      fontStyle="italic"
      fontSize="24"
      fill={ink}
    >
      a + b = c
    </text>
    {lines && (
      <path
        d="M-46 8H45M-46 18H37M-46 28H46M-46 38H21M-46 52H42M-46 62H34"
        stroke={ink}
        strokeWidth="1.7"
        opacity=".28"
      />
    )}
    {mark && (
      <g transform="translate(2 40) rotate(-12)">
        <rect
          x="-49"
          y="-19"
          width="98"
          height="38"
          rx="3"
          fill="#ffded7"
          fillOpacity=".6"
          stroke="#ee5060"
          strokeWidth="3"
        />
        <text
          x="0"
          y="8"
          textAnchor="middle"
          fontSize="23"
          fontWeight="900"
          fill="#df4353"
        >
          撤回
        </text>
      </g>
    )}
  </g>
);

const Pencil: React.FC<{ x: number; y: number; r?: number; s?: number }> = ({
  x,
  y,
  r = -36,
  s = 1,
}) => (
  <g transform={`translate(${x} ${y}) rotate(${r}) scale(${s})`}>
    <path
      d="M0 0L-14 -37L-14 -195Q0 -208 14 -195L14 -37Z"
      fill="#ffcd55"
      stroke={ink}
      strokeWidth="3.8"
      strokeLinejoin="round"
    />
    <path
      d="M-14 -37L0 0L14 -37Z"
      fill="#efc494"
      stroke={ink}
      strokeWidth="3.4"
    />
    <path d="M-5 -13L0 0L5 -13Z" fill={ink} />
    <path d="M-5 -40V-182M8 -40V-182" stroke="#ed8c3f" strokeWidth="3" />
    <path
      d="M-14 -181H14V-195Q0 -208 -14 -195Z"
      fill="#f698af"
      stroke={ink}
      strokeWidth="3"
    />
    <path d="M-12 -171H13M-12 -180H13" stroke={ink} strokeWidth="2" />
  </g>
);

const Chip: React.FC<{
  x: number;
  y: number;
  s?: number;
  r?: number;
  light?: boolean;
}> = ({ x, y, s = 1, r = 0, light = false }) => (
  <g transform={`translate(${x} ${y}) rotate(${r}) scale(${s})`}>
    {[-26, -10, 6, 22].map((p, i) => (
      <g key={i} stroke={ink} strokeWidth="4" strokeLinecap="round">
        <path d={`M${p} -43V-55M${p} 43V55M-43 ${p}H-55M43 ${p}H55`} />
      </g>
    ))}
    <rect
      x="-43"
      y="-43"
      width="86"
      height="86"
      rx="12"
      fill="#c78a37"
      stroke={ink}
      strokeWidth="3.5"
      transform="translate(3 5)"
    />
    <rect
      x="-43"
      y="-43"
      width="86"
      height="86"
      rx="12"
      fill={light ? "#fff08f" : "#ffdc67"}
      stroke={ink}
      strokeWidth="3.5"
    />
    <rect
      x="-27"
      y="-27"
      width="54"
      height="54"
      rx="6"
      fill="#393450"
      stroke={ink}
      strokeWidth="2.5"
    />
    <text
      x="0"
      y="9"
      textAnchor="middle"
      fontSize="28"
      fontFamily="Tinos,serif"
      fontStyle="italic"
      fill="#fff8dc"
    >
      AI
    </text>
    <path
      d="M-32 32H13M22 32H30M-32 -30V-20"
      stroke="#fff"
      strokeWidth="2.7"
      opacity=".8"
      strokeLinecap="round"
    />
  </g>
);

const Tag: React.FC<{
  x: number;
  y: number;
  text: string;
  fill?: string;
  w?: number;
  r?: number;
  size?: number;
}> = ({ x, y, text, fill = "#ffe26d", w = 205, r = -6, size = 25 }) => (
  <g transform={`translate(${x} ${y}) rotate(${r})`}>
    <rect x={-w / 2 + 1} y="-24" width={w} height="55" rx="13" fill={ink} />
    <path
      d={`M${-w / 2 + 13} -30H${w / 2 - 15}Q${w / 2} -30 ${w / 2} -13V14Q${w / 2} 25 ${w / 2 - 15} 25H${-w / 2 + 12}Q${-w / 2} 25 ${-w / 2} 12V-16Q${-w / 2} -30 ${-w / 2 + 13} -30Z`}
      fill={fill}
      stroke={ink}
      strokeWidth="3.4"
    />
    <text y="7" textAnchor="middle" fontSize={size} fontWeight="900" fill={ink}>
      {text}
    </text>
  </g>
);

const ErrorDetail: React.FC<{ u: number }> = ({ u }) => {
  const zoom = ease((u - 0.16) / 0.46),
    correction = ease((u - 0.467) / 0.23),
    paperScale = lerp(1.92, 4.8, zoom);
  return (
    <>
      <Stage color={lerp(0, 1, zoom) < 0.4 ? "#edece6" : cream} t={u} />
      <g
        transform={`translate(${272 - zoom * 14} ${330 - zoom * 24}) rotate(${-4 + zoom * 7})`}
      >
        <Paper s={paperScale} lines={false} />
        {u < 0.45 && (
          <text
            y="66"
            textAnchor="middle"
            fontSize="24"
            fontWeight="900"
            fill="#d47837"
            opacity={1 - ease(u / 0.45)}
          >
            待进一步核验
          </text>
        )}
        <g transform={`translate(0 ${-10 * paperScale}) scale(${paperScale})`}>
          <rect x="-55" y="-27" width="117" height="45" fill="#fffdf2" />
          <g
            fontFamily="Tinos,serif"
            fontStyle="italic"
            fontSize="24"
            fill={ink}
          >
            <text x="-48" y="0">
              a
            </text>
            <text x="7" y="0">
              b
            </text>
            <text x="28" y="0">
              =
            </text>
            <text x="49" y="0">
              c
            </text>
          </g>
          <path
            d="M-25 -9H-5"
            stroke="#ef5962"
            strokeWidth="3"
            strokeLinecap="round"
          />
          <path
            d="M-15 -19V1"
            stroke="#ef5962"
            strokeWidth="3"
            strokeLinecap="round"
            opacity={1 - correction}
          />
          <path
            d="M-36 10Q-14 17 9 7"
            stroke="#f26658"
            strokeWidth="1.5"
            fill="none"
            strokeDasharray="50"
            strokeDashoffset={50 * (1 - ease((u - 0.467) / 0.2))}
          />
        </g>
      </g>
      <Pencil
        x={lerp(650, 191, ease((u - 0.34) / 0.26)) + correction * 52}
        y={268 + Math.sin(u * 9) * 7}
        r={-38 + correction * 9}
        s={1.35}
      />
      {u > 0.467 && (
        <Burst x={191} y={261} p={clamp((u - 0.467) / 0.48)} color="#e75552" />
      )}
      <g
        opacity={ease((u - 0.85) / 0.12)}
        transform={`translate(74 ${492 + (1 - pop(u - 0.85)) * 40}) rotate(-8)`}
      >
        <path
          d="M0 0L362 -8L354 71L2 80Z"
          fill="#ed5d64"
          stroke={ink}
          strokeWidth="4"
        />
        <text
          x="180"
          y="45"
          textAnchor="middle"
          fill="#fff"
          fontWeight="900"
          fontSize="32"
        >
          一个符号，也要重查
        </text>
      </g>
    </>
  );
};

const Archive: React.FC<{ u: number }> = ({ u }) => {
  const settle = pop(u + 0.02);
  return (
    <>
      <Stage color="#fbdade" t={u} />
      <ellipse cx="281" cy="568" rx="170" ry="22" fill={ink} opacity=".13" />
      <g transform={`translate(274 ${448 + 30 * (1 - settle)})`}>
        <path
          d="M-151 -47L-100 -96H142L173 -39L144 100H-135Z"
          fill="#78687c"
          stroke={ink}
          strokeWidth="4"
        />
        <path
          d="M-133 -40H146L123 43H-108Z"
          fill="#373044"
          stroke={ink}
          strokeWidth="3"
        />
        {[0, 1, 2].map((i) => {
          const p = ease((u - [0.12, 0.84, 1.95][i]) / 0.55),
            x = (i - 1) * 120 * (1 - p),
            y = -203 + p * 232;
          return (
            <g key={i} opacity={1 - ease((p - 0.72) / 0.28)}>
              <Paper
                x={x}
                y={y}
                s={0.78}
                r={(i - 1) * 18 + p * 12}
                id={i + 1}
                mark={u > [0.12, 0.84, 1.95][i]}
              />
            </g>
          );
        })}
        <path
          d="M-154 -36L-127 111L145 110L174 -34L53 -34L39 -5H-22L-38 -36Z"
          fill="#ffc28e"
          stroke={ink}
          strokeWidth="4"
          strokeLinejoin="round"
        />
        <path
          d="M-128 109L141 111M-145 -27L-120 92"
          fill="none"
          stroke="#fff0cc"
          strokeWidth="3"
        />
        <rect
          x="-100"
          y="28"
          width="199"
          height="52"
          rx="5"
          fill="#fff9e9"
          stroke={ink}
          strokeWidth="2.5"
        />
        <text
          x="0"
          y="62"
          textAnchor="middle"
          fontWeight="900"
          fontSize="29"
          fill={ink}
        >
          撤回稿件 × {u < 0.67 ? 0 : u < 1.39 ? 1 : u < 2.5 ? 2 : 3}
        </text>
      </g>
      <g
        transform={`translate(${355 - 45 * ease(u / 0.55)} ${95 + 125 * Math.sin(clamp((u - 0.12) / 0.3) * Math.PI)}) rotate(-13)`}
        opacity={1 - ease((u - 0.95) / 0.23)}
      >
        <path
          d="M-21 -54Q-25 -79 0 -79Q26 -79 22 -54L16 -18H-16Z"
          fill="#9a435b"
          stroke={ink}
          strokeWidth="4"
        />
        <path
          d="M-64 -18H64V12H-64Z"
          fill="#ec6373"
          stroke={ink}
          strokeWidth="4"
        />
        <path d="M-67 12H67V23H-67Z" fill={ink} />
      </g>
      <g opacity={ease((u - 0.92) / 0.2)}>
        <Tag
          x={276}
          y={151}
          text="符号错误，连带复查"
          w={297}
          fill="#ffeb92"
          r={4}
        />
      </g>
    </>
  );
};

const RevisionBelt: React.FC<{ u: number }> = ({ u }) => {
  const revision = Math.max(0, u - 0.94),
    move = revision * 178,
    count = 14;
  return (
    <>
      <Stage color="#e2cef6" t={u} cy={357} />
      <g transform="translate(-41 465) rotate(-8)">
        <path
          d="M-70 -65H670Q714 -65 714 -10Q714 39 670 39H-70Z"
          fill="#797085"
          stroke={ink}
          strokeWidth="4"
        />
        <path
          d="M-70 -63H670Q705 -63 708 -17H-70Z"
          fill="#aaa2b8"
          stroke={ink}
          strokeWidth="3"
        />
        {Array.from({ length: 15 }, (_, i) => (
          <g key={i} transform={`translate(${i * 75 - (move % 75)} 9)`}>
            <circle r="18" fill="#cec6da" stroke={ink} strokeWidth="3" />
            <path
              d="M-11 -11L11 11M11 -11L-11 11"
              stroke={ink}
              strokeWidth="2"
              transform={`rotate(${revision * 145})`}
            />
          </g>
        ))}
        {Array.from({ length: 6 }, (_, i) => {
          const x = ((i * 147 + move) % 882) - 160,
            revised = revision > 0 && x > 278;
          return (
            <g
              key={i}
              transform={`translate(${x} -103) rotate(${Math.sin(i * 2) * 4})`}
            >
              <Paper
                s={0.63}
                id={Math.max(1, Math.min(14, i + 1 + Math.floor(move / 147)))}
                lines
              />
              {revised && (
                <g transform="rotate(-9)">
                  <path
                    d="M-25 -4L28 4M-25 15L11 20M3 -15L24 -25"
                    stroke="#eb655f"
                    strokeWidth="2.5"
                  />
                  <rect
                    x="-31"
                    y="28"
                    width="66"
                    height="26"
                    rx="3"
                    fill="#ffdaa6"
                    stroke={ink}
                    strokeWidth="2"
                  />
                  <text
                    x="2"
                    y="47"
                    textAnchor="middle"
                    fontSize="16"
                    fontWeight="900"
                    fill={ink}
                  >
                    已修订
                  </text>
                </g>
              )}
            </g>
          );
        })}
      </g>
      <g
        transform={`translate(313 ${235 + Math.sin(revision * 28) * 10}) rotate(${8 + Math.sin(revision * 18) * 4})`}
      >
        <Pencil x={0} y={69} r={27} s={1.15} />
      </g>
      <Burst x={318} y={331} p={revision > 0 ? (revision * 3) % 1 : 1} />
      <g transform={`translate(130 160) rotate(-7) scale(${pop(u + 0.1)})`}>
        <path
          d="M-90 -70H89L83 74H-94Z"
          fill="#ffe681"
          stroke={ink}
          strokeWidth="4"
        />
        <path
          d="M-79 -57H72V30H-81Z"
          fill="#fff7cd"
          stroke={ink}
          strokeWidth="2"
        />
        <text
          x="-3"
          y="18"
          textAnchor="middle"
          fontFamily="Tinos"
          fontSize="82"
          fontWeight="700"
          fill={ink}
        >
          {count}
        </text>
        <text
          x="-4"
          y="60"
          textAnchor="middle"
          fontSize="21"
          fontWeight="900"
          fill={ink}
        >
          份稿件
        </text>
      </g>
      <path
        d="M51 570Q270 597 497 557"
        fill="none"
        stroke={ink}
        strokeWidth="3"
        strokeDasharray="7 9"
      />
      <text
        x="272"
        y="597"
        textAnchor="middle"
        fontSize="17"
        fontWeight="700"
        fill={ink}
      >
        修改稿仍然需要继续检查
      </text>
    </>
  );
};

const Lens: React.FC<{ x: number; y: number; s?: number }> = ({
  x,
  y,
  s = 1,
}) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <path
      d="M58 69L125 145"
      stroke={ink}
      strokeWidth="32"
      strokeLinecap="round"
    />
    <path
      d="M63 76L121 140"
      stroke="#eb9270"
      strokeWidth="23"
      strokeLinecap="round"
    />
    <circle
      r="99"
      fill="#d6f9ff"
      fillOpacity=".32"
      stroke={ink}
      strokeWidth="10"
    />
    <circle r="87" fill="none" stroke="#fcffff" strokeWidth="5" opacity=".95" />
    <path
      d="M-72 -23Q-56 -62 -22 -73"
      stroke="#fff"
      strokeWidth="8"
      fill="none"
      strokeLinecap="round"
    />
  </g>
);

const Book: React.FC<{
  x: number;
  y: number;
  s?: number;
  open?: number;
  u?: number;
  glow?: boolean;
}> = ({ x, y, s = 1, open = 1, u = 0, glow = false }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    {glow && (
      <ellipse
        cx="0"
        cy="0"
        rx="194"
        ry="166"
        fill="url(#kc-glow)"
        opacity=".8"
      />
    )}
    <path
      d={`M0 119L${-184 * open} 66L${-172 * open} -87Q${-80 * open} -99 0 -49Q${80 * open} -99 ${172 * open} -87L${184 * open} 66Z`}
      fill="#c58aa6"
      stroke={ink}
      strokeWidth="4"
      strokeLinejoin="round"
    />
    <path
      d={`M0 104L${-170 * open} 53L${-158 * open} -102Q${-69 * open} -106 0 -58Q${69 * open} -106 ${158 * open} -102L${170 * open} 53Z`}
      fill="#fff6d5"
      stroke={ink}
      strokeWidth="3.5"
      strokeLinejoin="round"
    />
    <path
      d={`M0 -58V104M${-170 * open} 43L0 94L${170 * open} 43M${-169 * open} 49L0 100L${169 * open} 49`}
      fill="none"
      stroke={ink}
      strokeWidth="1.7"
    />
    {Array.from({ length: 7 }, (_, i) => (
      <g key={i} opacity=".36" stroke={ink} strokeWidth="1.5" fill="none">
        <path
          d={`M${-131 * open} ${-62 + i * 15}Q${-67 * open} ${-66 + i * 15} ${-21 * open} ${-36 + i * 15}`}
        />
        <path
          d={`M${21 * open} ${-36 + i * 15}Q${67 * open} ${-66 + i * 15} ${131 * open} ${-62 + i * 15}`}
        />
      </g>
    ))}
    <path
      d={`M0 -57Q${130 * Math.cos(u * 3) * open} -169 ${150 * Math.cos(u * 3) * open} -110L${162 * Math.cos(u * 3) * open} 39Q${97 * Math.cos(u * 3) * open} 38 0 101Z`}
      fill="#fffbe8"
      fillOpacity=".91"
      stroke={ink}
      strokeWidth="2.2"
    />
  </g>
);

const Solid: React.FC<{
  x: number;
  y: number;
  s?: number;
  r?: number;
  color?: string;
}> = ({ x, y, s = 1, r = 0, color = "#83cbb9" }) => (
  <g transform={`translate(${x} ${y}) rotate(${r}) scale(${s})`}>
    <path
      d="M0 -40L39 -18V26L0 48L-39 26V-18Z"
      fill={color}
      stroke={ink}
      strokeWidth="3.2"
      strokeLinejoin="round"
    />
    <path
      d="M0 -40L39 -18L0 5L-39 -18Z"
      fill="#fff6b5"
      stroke={ink}
      strokeWidth="3.2"
      strokeLinejoin="round"
    />
    <path
      d="M0 5L39 -18V26L0 48Z"
      fill="#d59cd3"
      stroke={ink}
      strokeWidth="3.2"
      strokeLinejoin="round"
    />
    <path d="M-31 -15L0 3M0 13V37" stroke="#fff" strokeWidth="2" opacity=".6" />
  </g>
);

// Absolute action landmarks follow the existing narration and captions.json.
// No voice synthesis, stretching, or sentence-duration averaging is involved.
export const SYNCHRONIZED_COMIC_EVENTS = [
  { time: 37.967, label: "错误符号被划掉", kind: "paper" },
  { time: 38.957, label: "日历翻到十月七日", kind: "paper" },
  { time: 39.847, label: "三篇关联稿进入撤回流程", kind: "swish" },
  { time: 40.517, label: "第一篇撤回落箱", kind: "stamp" },
  { time: 41.237, label: "第二篇撤回落箱", kind: "stamp" },
  { time: 42.347, label: "第三篇撤回落箱", kind: "stamp" },
  { time: 42.727, label: "十四份稿件出现", kind: "paper" },
  { time: 43.667, label: "十四份稿件开始修订", kind: "paper" },
  { time: 45.766, label: "答案页进入画面", kind: "paper" },
  { time: 46.4, label: "划去答案即终点", kind: "paper" },
  { time: 47.226, label: "同一答案页进入研究", kind: "swish" },
  { time: 48.186, label: "写下研究结果", kind: "paper" },
  { time: 48.906, label: "附上证明页", kind: "paper" },
  { time: 49.906, label: "放大镜检查证明", kind: "click" },
  { time: 50.726, label: "笔修正同一研究页", kind: "paper" },
  { time: 52.966, label: "未公开的模型锁定", kind: "click" },
  { time: 56.256, label: "模型连向可读证明", kind: "paper" },
  { time: 57.846, label: "证明拓展数学网络", kind: "confirm" },
] as const;

const NextDay: React.FC<{ u: number }> = ({ u }) => {
  const flip = ease(u / 0.42);
  return (
    <>
      <Stage color="#ffdfac" t={u} />
      <g
        transform={`translate(273 333) rotate(${-5 + flip * 3}) scale(${1.04 + 0.06 * Math.sin(flip * Math.PI)})`}
      >
        <path
          d="M-144 -181H145L151 177L-153 185Z"
          fill="#c89d70"
          stroke={ink}
          strokeWidth="5"
          transform="translate(9 11)"
        />
        <path
          d="M-144 -181H145L151 177L-153 185Z"
          fill="#fff8d8"
          stroke={ink}
          strokeWidth="5"
        />
        <path
          d="M-144 -181H145L147 -108H-147Z"
          fill="#ee7779"
          stroke={ink}
          strokeWidth="5"
        />
        <text
          y="-131"
          textAnchor="middle"
          fontSize="28"
          fontWeight="900"
          fill={ink}
        >
          2026 · 十月
        </text>
        {[-82, 82].map((x) => (
          <path
            key={x}
            d={`M${x} -197V-163`}
            stroke={ink}
            strokeWidth="12"
            strokeLinecap="round"
          />
        ))}
        <text
          y="94"
          textAnchor="middle"
          fontFamily="Tinos,serif"
          fontWeight="700"
          fontSize="204"
          fill={ink}
        >
          07
        </text>
        <g
          opacity={1 - ease((u - 0.3) / 0.15)}
          transform={`translate(${-flip * 69} ${flip * 122}) rotate(${-flip * 30}) scale(1 ${1 - flip * 0.94})`}
        >
          <path
            d="M-146 -106H147L151 177L-153 185Z"
            fill="#fff8d8"
            stroke={ink}
            strokeWidth="4"
          />
          <text
            y="94"
            textAnchor="middle"
            fontFamily="Tinos,serif"
            fontWeight="700"
            fontSize="204"
            fill={ink}
          >
            06
          </text>
        </g>
        <path d="M-115 147H108" stroke={ink} strokeWidth="3" />
      </g>
      <Tag x={278} y={567} text="发布后的第二天" w={275} r={-4} />
      {u < 0.65 && <Burst x={406} y={227} p={clamp(u / 0.65)} />}
    </>
  );
};

const ResearchRelay: React.FC<{ t: number }> = ({ t }) => {
  const u = t - 45.766;
  const enter = ease(u / 0.35);
  const research = ease((t - 47.226) / 0.55);
  const result = ease((t - 48.186) / 0.42);
  const proof = ease((t - 48.906) / 0.5);
  const check = ease((t - 49.906) / 0.26);
  const revise = ease((t - 50.726) / 0.42);
  const inspectExit = ease((t - 50.69) / 0.27);
  const angle = -8 + research * 5;
  const scale = 1.2 - research * 0.23;
  const x = 272 - research * 20;
  const y = 345 - research * 17;
  return (
    <>
      <Stage color={research > 0.5 ? "#bce9f6" : "#fff0bc"} t={u} />
      <ellipse cx="277" cy="579" rx="191" ry="22" fill={ink} opacity=".11" />
      <g
        transform={`translate(${x + (1 - enter) * 610} ${y}) rotate(${angle}) scale(${scale})`}
      >
        {/* A proof attachment is filed behind the original research page. */}
        <g
          opacity={proof}
          transform={`translate(${proof * 57 + (1 - proof) * 390} ${proof * 14}) rotate(${proof * 13})`}
        >
          <Paper s={2.03} id={2} />
          <text
            x="0"
            y="-146"
            textAnchor="middle"
            fontSize="21"
            fontWeight="900"
            fill={ink}
          >
            证明附件
          </text>
        </g>
        <path
          d="M-167 -217H134L167 -182V214L-165 216Z"
          fill="#cab894"
          opacity=".48"
          transform="translate(8 9)"
        />
        <path
          d="M-167 -217H134L167 -182V214L-165 216Z"
          fill="#fff9dc"
          stroke={ink}
          strokeWidth="4.5"
          strokeLinejoin="round"
        />
        <path
          d="M134 -215V-183H165M-164 196H132M-155 -202V173"
          fill="none"
          stroke={ink}
          strokeWidth="2.5"
        />
        <g opacity={1 - research}>
          <text
            x="0"
            y="-145"
            textAnchor="middle"
            fontSize="28"
            fontWeight="900"
            fill={ink}
          >
            答案
          </text>
          <text
            x="0"
            y="-27"
            textAnchor="middle"
            fontFamily="Tinos,serif"
            fontSize="62"
            fontStyle="italic"
            fill={ink}
          >
            a + b = c
          </text>
          <g transform="translate(0 118) rotate(-4)">
            <path
              d="M-86 -36H88L82 26H-91Z"
              fill="#aee3c8"
              stroke={ink}
              strokeWidth="3"
            />
            <text
              x="0"
              y="5"
              textAnchor="middle"
              fontSize="27"
              fontWeight="900"
              fill={ink}
            >
              终点？
            </text>
            <path
              d="M-105 -27L104 22M-92 33L89 -39"
              fill="none"
              stroke="#e45869"
              strokeWidth="8"
              strokeLinecap="round"
              pathLength="1"
              strokeDasharray="1"
              strokeDashoffset={1 - ease((t - 46.4) / 0.4)}
            />
          </g>
        </g>
        <g opacity={research}>
          <text
            x="0"
            y="-171"
            textAnchor="middle"
            fontSize="24"
            fontWeight="900"
            fill={ink}
          >
            研究记录 · 01
          </text>
          <path d="M-130 -150H128" stroke={ink} strokeWidth="2" />
          <path
            d="M-130 -128H74M-130 -117H117"
            stroke={ink}
            strokeWidth="2"
            opacity=".3"
          />
          <text x="-126" y="-81" fontSize="18" fontWeight="900" fill={ink}>
            结果
          </text>
          <g clipPath="url(#sync-result-reveal)">
            <text
              x="0"
              y="-21"
              textAnchor="middle"
              fontFamily="Tinos,serif"
              fontSize="38"
              fontStyle="italic"
              fill={ink}
            >
              ∀ n ≥ 1, aₙ = bₙ
            </text>
            <path d="M-128 -8H128" stroke="#67ac87" strokeWidth="4" />
          </g>
          <g opacity={proof}>
            <text x="-126" y="45" fontSize="18" fontWeight="900" fill={ink}>
              证明
            </text>
            <path
              d="M-129 66H119M-129 81H103M-129 96H124M-129 111H78M-129 126H111M-129 141H121"
              stroke={ink}
              strokeWidth="2"
              opacity=".38"
            />
            <text
              x="112"
              y="181"
              fontFamily="Tinos,serif"
              fontSize="26"
              fill={ink}
            >
              □
            </text>
            <path d="M-128 176H52" stroke={ink} strokeWidth="2" opacity=".3" />
          </g>
          <g
            opacity={revise}
            fill="none"
            stroke="#e45566"
            strokeWidth="3.2"
            strokeLinecap="round"
          >
            <path
              d="M-144 64Q-154 100 -142 139"
              pathLength="1"
              strokeDasharray="1"
              strokeDashoffset={1 - revise}
            />
            <path
              d="M-86 112Q-4 129 73 110"
              pathLength="1"
              strokeDasharray="1"
              strokeDashoffset={1 - revise}
            />
            <path
              d="M87 74L101 90L128 51"
              pathLength="1"
              strokeDasharray="1"
              strokeDashoffset={1 - revise}
            />
          </g>
        </g>
      </g>
      <g opacity={check * (1 - inspectExit)}>
        <g
          transform={`translate(${lerp(610, 300, check) + check * Math.sin(Math.max(0, t - 50) * 4) * 22} 344)`}
        >
          <circle r="74" fill="#fff6d5" />
          <text
            x="0"
            y="-7"
            textAnchor="middle"
            fontFamily="Tinos,serif"
            fontSize="34"
            fontStyle="italic"
            fill={ink}
          >
            ∀ n ≥ 1
          </text>
          <path
            d="M-49 13H50M-43 26H35"
            stroke={ink}
            strokeWidth="2"
            opacity=".4"
          />
          <Lens x={0} y={0} s={0.79} />
        </g>
      </g>
      {t >= 48.186 && t < 48.83 && (
        <Pencil x={160 + result * 220} y={294} r={33} s={0.79} />
      )}
      {t >= 50.726 && (
        <Pencil
          x={lerp(628, 353, revise) + Math.sin((t - 50.726) * 10) * 7}
          y={421 + Math.sin((t - 50.726) * 7) * 8}
          r={32}
          s={0.98}
        />
      )}
      {t >= 47.226 && (
        <path
          d={`M65 596Q251 ${572 - research * 18} 447 575`}
          fill="none"
          stroke={ink}
          strokeWidth="3"
          strokeDasharray="4 9"
        />
      )}
      <defs>
        <clipPath id="sync-result-reveal">
          <rect x="-134" y="-60" width={270 * result} height="72" />
        </clipPath>
      </defs>
    </>
  );
};

const LockedResearch: React.FC<{ t: number }> = ({ t }) => {
  const u = t - 52.966;
  const lock = ease(u / 0.2);
  const read = ease((t - 56.256) / 0.58);
  const expand = ease((t - 57.846) / 0.8);
  const chipX = lerp(272, 165, read),
    chipY = lerp(334, 258, read);
  const nodes = [
    [98, 432],
    [281, 160],
    [450, 250],
    [439, 432],
    [158, 552],
  ];
  return (
    <>
      <Stage color="#302847" t={u} dark />
      <g opacity={read}>
        <Stage color="#fff0a3" t={u} />
      </g>
      <g opacity={1 - read}>
        <ellipse
          cx="273"
          cy="576"
          rx="173"
          ry="24"
          fill="#140f23"
          opacity=".4"
        />
        <path
          d="M137 441H402L385 565H153Z"
          fill="#85395c"
          stroke={ink}
          strokeWidth="4"
        />
        <path
          d="M142 450H393L387 475H146Z"
          fill="#c9487e"
          stroke={ink}
          strokeWidth="4"
        />
        <path
          d="M160 500H370M160 528H370"
          stroke="#f8c784"
          strokeWidth="3"
          strokeDasharray="2 9"
          strokeLinecap="round"
        />
        <g transform={`translate(0 ${-120 * (1 - lock) - read * 300})`}>
          <path
            d="M146 438V307Q147 198 271 198Q395 198 397 309V438"
            fill="#c8e7fe"
            fillOpacity=".12"
            stroke="#fff"
            strokeWidth="4.5"
          />
          <path
            d="M170 316Q169 237 237 225M163 361V404"
            fill="none"
            stroke="#fff"
            strokeWidth="6"
            strokeLinecap="round"
            opacity=".8"
          />
        </g>
        <Tag x={272} y={115} text="内部模型 · 尚未公开" w={344} size={27} />
      </g>
      {/* The model remains locked after its released proofs become readable. */}
      <Chip
        x={chipX}
        y={chipY + Math.sin(u * 2) * 3}
        s={lerp(1.05, 0.8, read)}
        r={-3 + read * 7}
        light
      />
      <g
        transform={`translate(${lerp(270, 197, read)} ${lerp(453, 290, read)}) scale(${lerp(1, 0.5, read) * lock})`}
      >
        <path
          d="M-16 -11V-27Q-16 -50 1 -50Q18 -50 18 -29V-12"
          fill="none"
          stroke={ink}
          strokeWidth="7"
        />
        <path
          d="M-16 -11V-27Q-16 -50 1 -50Q18 -50 18 -29V-12"
          fill="none"
          stroke="#edd292"
          strokeWidth="4"
        />
        <rect
          x="-31"
          y="-16"
          width="63"
          height="52"
          rx="9"
          fill="#ffdb76"
          stroke={ink}
          strokeWidth="4"
        />
        <circle cy="4" r="7" fill={ink} />
        <path d="M0 6V19" stroke={ink} strokeWidth="5" />
      </g>
      <g opacity={read}>
        <path
          d="M194 285Q267 294 309 353"
          fill="none"
          stroke={ink}
          strokeWidth="4"
          pathLength="1"
          strokeDasharray="1"
          strokeDashoffset={1 - read}
        />
        <path
          d="M298 341L311 355L315 337"
          fill="none"
          stroke={ink}
          strokeWidth="4"
        />
        <g
          transform={`translate(${330 - expand * 27} ${438 - expand * 20 + (1 - read) * 190}) scale(${0.74 + expand * 0.07})`}
        >
          <Book
            x={0}
            y={0}
            open={0.05 + read * 0.95}
            u={Math.max(0, t - 56.256) * 0.4}
          />
          <text
            x="-69"
            y="-5"
            textAnchor="middle"
            fontFamily="Tinos,serif"
            fontSize="28"
            fontStyle="italic"
            fill={ink}
          >
            aₙ = bₙ
          </text>
          <text
            x="71"
            y="12"
            textAnchor="middle"
            fontSize="21"
            fontWeight="900"
            fill={ink}
          >
            证明可读
          </text>
        </g>
        <g opacity={1 - expand}>
          <Tag
            x={294}
            y={119}
            text="这些证明，能被读懂吗？"
            w={355}
            size={25}
            fill="#fffdf0"
            r={-3}
          />
        </g>
      </g>
      {nodes.map(([nx, ny], i) => {
        const p = ease((t - 57.846 - i * 0.1) / 0.45);
        return (
          <g key={i} opacity={p}>
            <path
              d={`M300 402L${lerp(300, nx, p)} ${lerp(402, ny, p)}`}
              stroke={ink}
              strokeWidth="3.5"
            />
            <path
              d={`M300 402L${lerp(300, nx, p)} ${lerp(402, ny, p)}`}
              stroke="#fff"
              strokeWidth="1.2"
            />
            <Solid
              x={nx}
              y={ny + Math.sin(u * 2 + i) * 3}
              s={0.61 * p}
              r={i * 8 - 12}
            />
          </g>
        );
      })}
      <g
        opacity={expand}
        transform={`translate(272 ${100 + (1 - expand) * -30}) rotate(-3)`}
      >
        <text
          x="0"
          y="0"
          textAnchor="middle"
          fontWeight="900"
          fontSize="36"
          fill={ink}
          stroke={cream}
          strokeWidth="7"
          paintOrder="stroke"
        >
          让证明，推进数学
        </text>
        <path
          d="M-179 20Q0 27 181 10"
          stroke={ink}
          strokeWidth="4"
          fill="none"
          strokeLinecap="round"
        />
      </g>
    </>
  );
};

const cuts = [37.5, 38.957, 39.847, 42.727, 45.766, 52.966, 60];
const scene = (index: number, t: number) => {
  const u = t - cuts[index];
  if (index === 0) return <ErrorDetail u={u} />;
  if (index === 1) return <NextDay u={u} />;
  if (index === 2) return <Archive u={u} />;
  if (index === 3) return <RevisionBelt u={u} />;
  if (index === 4) return <ResearchRelay t={t} />;
  return <LockedResearch t={t} />;
};

export const SyncedComic: React.FC<{ t: number }> = ({ t }) => {
  const index = Math.max(
    0,
    Math.min(
      5,
      cuts.findIndex((v, i) => i < 6 && t >= v && t < cuts[i + 1]),
    ),
  );
  const u = t - cuts[index];
  // Only major paragraph changes cut. Within research and conclusion, objects
  // stay on screen while their state changes at the spoken verb.
  const transition = index > 0 && u < 0.16;
  const wipe = index === 3 || index === 4;
  const radius = 20 + smooth(u / 0.16) * 990;
  return (
    <svg
      width="544"
      height="720"
      viewBox="0 0 544 720"
      style={{
        position: "absolute",
        inset: 0,
        fontFamily: font,
        overflow: "hidden",
      }}
    >
      <defs>
        <pattern
          id="kc-dots"
          width="24"
          height="24"
          patternUnits="userSpaceOnUse"
        >
          <circle cx="4" cy="7" r="1.05" fill="#4b3d55" opacity=".2" />
        </pattern>
        <radialGradient id="kc-glow">
          <stop offset="0" stopColor="#fffce1" stopOpacity=".95" />
          <stop offset="1" stopColor="#fffce1" stopOpacity="0" />
        </radialGradient>
        <clipPath id="sync-comic-next">
          {wipe ? (
            <path
              d={`M-200 -100H${-80 + smooth(u / 0.16) * 940}L${-250 + smooth(u / 0.16) * 940} 820H-200Z`}
            />
          ) : (
            <circle cx="272" cy="355" r={radius} />
          )}
        </clipPath>
      </defs>
      {transition && scene(index - 1, t)}
      <g clipPath={transition ? "url(#sync-comic-next)" : undefined}>
        {scene(index, t)}
      </g>
      {transition && !wipe && (
        <circle
          cx="272"
          cy="355"
          r={radius}
          fill="none"
          stroke={ink}
          strokeWidth="5"
        />
      )}
    </svg>
  );
};
