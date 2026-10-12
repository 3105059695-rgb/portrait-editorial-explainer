import React from "react";
import { AbsoluteFill, staticFile } from "remotion";
import calibrationCaptions from "./captions.json";

const unit = (x: number) => Math.min(1, Math.max(0, x));
const ease = (t: number, a: number, b: number) => {
  const p = unit((t - a) / (b - a));
  return p * p * (3 - 2 * p);
};
const mix = (a: number, b: number, p: number) => a + (b - a) * p;
const serif = '"Noto Serif SC", serif';

// Time is absolute within the film: 6.733–15.2 seconds on a 544×720 stage.
// The image used by feDisplacementMap is a generated radial vector field,
// not reference-video imagery. All UI text, chrome and windows are native.
// Authored research notes. The screen reproduces the reference's editorial
// geometry, but every word remains editable and belongs to this math story.
const codeLines = [
  "---",
  "name: openai-math-research",
  "description: 整理 OpenAI 公开的数学研究稿件，记录论文主题、相关结果、证明过程与",
  "核验状态。研究内容涉及数论、几何和理论计算机科学，按关联关系整理为不同组。",
  "稿件数量不等于独立难题的数量，公开记录仍然需要持续核验。",
  "---",
  "",
  "# 数学研究归档",
  "",
  "目前公开七百一十九篇稿件，整理为三百七十二组。相关结果、配套论证和不同证明，可以归入同一组。",
  "“稿件”与“问题”不是同一单位。先看研究对象，再看论证过程，最后检查结果能否通过验证。",
  "",
  "十月六日，OpenAI 开始公开内部模型生成的研究成果。研究目录按主题组织，包含问题背景、",
  "证明正文和参考资料；读者可以追踪每份稿件的修订记录，以及核验结果的变化。",
  "",
  "## 研究目录与核验状态",
  "",
  "- 公开目录收录 **719 篇稿件**，按相关研究整理为 **372 组**，不能直接视为 719 个独立难题。",
  "同一组中可能包含配套引理、不同证明或者后续推广，应结合上下文理解每篇稿件的作用。",
  "- 数论、几何、理论计算机科学等主题都在目录中。每个结论都需要核对假设、推导和适用边界。",
  "论文数量只是研究规模的描述，不能单独用来判断一个模型的数学能力或成果的重要性。",
  "- 形式化验证可以把证明步骤交给证明检查器核验，但首先要保证形式化命题准确对应原问题。",
  "研究者仍然需要审阅定义、假设和推理链条，检查是否存在遗漏，或结论超出假设范围。",
  "",
  "## 1. 从研究稿件到可信结论",
  "",
  "- 提出问题、构造证明、检查关键步骤，再根据外部反馈修订。整个过程应保留版本和更正记录。",
  "用公开资料追踪结果的变化，不把一次生成当作研究的终点。",
  "- 目录中的稿件继续接受审阅。对被修订或撤回的结果，以最新公开记录为准。",
  "",
  "## 2. 持续核验与公开更正",
  "",
  "- 阅读研究稿件时，先确认问题与已知结果的关系，再检查论证是否覆盖所有必要情况。",
  "同一个结论可能有多种证明；辅助引理的变化，也可能影响后续依赖它的论证。",
  "- 让证明过程可检查、可追踪，才能把生成的文本逐步转化为可信的数学结果。",
  "研究目录与更正记录应当一起阅读。",
];
const srtTime = (seconds: number) => {
  const ms = Math.round(seconds * 1000);
  return `00:00:${Math.floor(ms / 1000)
    .toString()
    .padStart(2, "0")},${(ms % 1000).toString().padStart(3, "0")}`;
};
const srtLines = [[4], [5], [6], [7, 8]].flatMap((indices, i) => {
  const cues = indices.map((index) => calibrationCaptions[index]);
  return [
    String(i + 1),
    `${srtTime(cues[0].start)} --> ${srtTime(cues[cues.length - 1].end)}`,
    cues.map((cue) => cue.text).join(""),
    "",
  ];
});

const EditorToolbar: React.FC<{ script: boolean }> = ({ script }) => (
  <>
    <rect x="-250" y="39" width="1300" height="22" fill="#080909" />
    <text x="13" y="53" fill="#b8bab5" fontSize="8" fontFamily="Noto Sans SC">
      ⌘ Code 文件 编辑 选择 查看 转到 运行 终端 窗口 帮助
    </text>
    <rect x="357" y="41" width="27" height="14" rx="3" fill="#7764b9" />
    <text x="365" y="51" fill="#dfd9ff" fontSize="9">
      ▣
    </text>
    <text x="395" y="51" fill="#d8d8d5" fontSize="8">
      ◎ ◉ M 300k/s ⌁ ⌕ ▧ ♥
    </text>
    <rect x="-250" y="61" width="1300" height="29" fill="#242525" />
    <text x="14" y="80" fill="#aaaea7" fontSize="12" fontFamily="Noto Sans SC">
      ‹ › {script ? "研究目录.srt" : "RESEARCH.md"} — openai-math-research — ▦
      Modified: 10月6日, 00:20 ▰ Size: 9
    </text>
    <rect x="0" y="90" width="123" height="29" fill="#202120" />
    <path d="M0 90H123" stroke="#3a899b" />
    <text
      x="15"
      y="110"
      fill="#d9dddc"
      fontFamily="Consolas, Noto Sans SC"
      fontStyle="italic"
      fontSize="13"
    >
      ⬇ RESEARCH.md ×
    </text>
  </>
);

export const SyncedResearchEditor: React.FC<{ t: number }> = ({ t }) => {
  const folder = t >= 10.737;
  const script = t >= 12.30;
  const terminal = ease(t, 12.626, 13.056);
  const terminalOpacity = ease(t, 12.626, 12.726);
  const terminalExposure = ease(t, 12.796, 13.276);
  const close = folder ? 0 : ease(t, 7.1, 7.82);
  const zoom = 1 + close * 0.78;
  const pan = folder ? (script ? -8 : 0) : -8 + ease(t, 7.1, 8.2) * -90;
  const rise = folder ? -12 : -12 - ease(t, 7.1, 7.82) * 18;
  const selection = ease(t, 7.966, 8.16) * (1 - ease(t, 10.6, 10.737));
  const grouped = ease(t, 9.166, 9.34);
  const sidebarWidth = script
    ? 0
    : folder
      ? mix(162, 302, ease(t, 10.737, 11.08))
      : 0;
  const codeOffset = folder && !script ? sidebarWidth + 5 : 0;
  const contentScroll = folder && !script ? -89 : 0;
  const blur = ease(t, 12.496, 13.146) * 3.2;
  const dragX = mix(322, 172, ease(t, 10.737, 11.08));
  const dragY = mix(358, 381, ease(t, 10.737, 11.08));
  return (
    <AbsoluteFill style={{ background: "#000", overflow: "hidden" }}>
      <svg
        width="544"
        height="720"
        style={{
          filter: `blur(${blur}px) contrast(${1 + close * 0.15}) brightness(${1 - terminal * 0.2 - close * 0.16})`,
        }}
      >
        <defs>
          <filter
            id="synced-editor-lens"
            x="0"
            y="0"
            width="544"
            height="720"
            filterUnits="userSpaceOnUse"
            colorInterpolationFilters="sRGB"
          >
            <feImage
              href={staticFile("assets/kinetic-opening/lens-map.png")}
              x="0"
              y="0"
              width="544"
              height="720"
              result="lens"
            />
            <feGaussianBlur in="lens" stdDeviation="1.4" result="smooth-lens" />
            <feDisplacementMap
              in="SourceGraphic"
              in2="smooth-lens"
              scale="256"
              xChannelSelector="R"
              yChannelSelector="G"
            />
            <feGaussianBlur stdDeviation=".35" />
          </filter>
          <radialGradient id="synced-editor-light">
            <stop offset="0" stopColor="#000" stopOpacity="0" />
            <stop offset=".7" stopColor="#000" stopOpacity=".06" />
            <stop offset="1" stopColor="#000" stopOpacity=".22" />
          </radialGradient>
          <pattern
            id="synced-editor-scan"
            width="2"
            height="2"
            patternUnits="userSpaceOnUse"
          >
            <rect width="2" height=".5" fill="#000" opacity=".055" />
          </pattern>
          <clipPath id="synced-editor-clip">
            <rect x="-200" y="38" width="1200" height="691" rx="4" />
          </clipPath>
          <clipPath id="synced-editor-body-clip">
            <rect x="0" y="144" width="1200" height="553" />
          </clipPath>
        </defs>
        <g filter="url(#synced-editor-lens)">
          <g
            transform={`translate(${pan} ${rise}) translate(272 307) scale(${zoom}) translate(-272 -307)`}
            clipPath="url(#synced-editor-clip)"
          >
            <rect x="-240" y="37" width="1400" height="700" fill="#1e1e1e" />
            <EditorToolbar script={script} />
            {folder && !script && (
              <g>
                <rect
                  x="-80"
                  y="92"
                  width={sidebarWidth + 80}
                  height="620"
                  fill="#303134"
                />
                <rect x="-25" y="92" width="70" height="620" fill="#202123" />
                <rect
                  x="46"
                  y="92"
                  width={sidebarWidth - 46}
                  height="34"
                  fill="#242526"
                />
                <text
                  x="69"
                  y="114"
                  fill="#c1c2bf"
                  fontSize="10"
                  fontFamily="Noto Sans SC"
                >
                  OPENAI-MATH... ♧ ⊕ ⟳ □ ···
                </text>
                {[
                  "› manuscripts",
                  "› references",
                  "◉ 数论.pdf",
                  "◉ 几何.pdf",
                  "◉ 理论计算机科学.pdf",
                  "⬇ RESEARCH.md",
                ].map((text, i) => (
                  <text
                    key={text}
                    x="67"
                    y={144 + i * 22}
                    fill={(i === 2 && t < 11.15) || (i === 3 && t >= 11.15 && t < 11.746) || (i === 4 && t >= 11.746) ? "#f9e8b8" : i >= 2 && i <= 4 ? "#c06a87" : "#c2c3c1"}
                    fontSize="14.5"
                    fontFamily="Noto Sans SC"
                  >
                    {text}
                  </text>
                ))}
                {["▱", "⌕", "♧", "▷", "▧"].map((x, i) => (
                  <text
                    key={i}
                    x="12"
                    y={132 + i * 50}
                    fontSize="25"
                    fill="#aaada9"
                  >
                    {x}
                  </text>
                ))}
                <text x="12" y="652" fill="#999c98" fontSize="24">
                  ◎
                </text>
                <text x="12" y="692" fill="#999c98" fontSize="24">
                  ⚙
                </text>
              </g>
            )}
            <g transform={`translate(${codeOffset} 0)`}>
              {folder && !script && (
                <>
                  <rect x="0" y="92" width="520" height="32" fill="#1e1e1e" />
                  <path d="M0 92H128" stroke="#4393a8" />
                  <text
                    x="14"
                    y="113"
                    fill="#d5d8d3"
                    fontSize="13"
                    fontFamily="Consolas, Noto Sans SC"
                    fontStyle="italic"
                  >
                    ⬇ RESEARCH.md ×
                  </text>
                </>
              )}
              {script && (
                <>
                  <rect x="178" y="92" width="410" height="33" fill="#1e1e1e" />
                  <text
                    x="190"
                    y="114"
                    fill="#d9d9d5"
                    fontSize="14"
                    fontFamily="Noto Sans SC"
                  >
                    ☰ 研究目录.srt ×
                  </text>
                </>
              )}
              <text
                x="16"
                y="136"
                fill="#b3b5b1"
                fontSize="11.5"
                fontFamily="Consolas, Noto Sans SC"
              >
                {script
                  ? "☰ 研究目录.srt"
                  : "⬇ RESEARCH.md › ab: # 数学研究归档"}
              </text>
              {!script && (
                <g clipPath="url(#synced-editor-body-clip)">
                  <rect
                    x="52"
                    y={284 + grouped * 44}
                    width="1100"
                    height="38"
                    fill="#315f84"
                    opacity={selection * .82}
                  />
                  <rect
                    x="52"
                    y="325.2"
                    width="0"
                    height="18"
                    fill="#315f84"
                    opacity={selection}
                  />
                  <g opacity={folder ? 0 : 1} fontFamily="Consolas, Noto Sans SC">
                    <text x="211" y="312" fontSize="27" fill="#f0eee0" opacity={ease(t,7.966,8.09)}>719<tspan fontSize="16"> 篇稿件</tspan></text>
                    <text x="211" y="356" fontSize="27" fill="#f0eee0" opacity={ease(t,9.166,9.30)}>372<tspan fontSize="16"> 组研究</tspan></text>
                  </g>
                  {codeLines.map((text, i) => (
                    <g key={i}>
                      <text
                        x="26"
                        y={156 + i * 18.2 + contentScroll + (i >= 11 ? 33 : 0)}
                        fill="#969996"
                        fontFamily="Consolas,monospace"
                        fontSize="11.8"
                      >
                        {
                          [
                            1, 2, 3, 3, 3, 4, 5, 6, 7, 8, 8, 9, 10, 10, 11, 12,
                            13, 14, 14, 15, 15, 16, 16, 17, 18, 19, 20, 20, 21,
                            22, 23, 24, 25, 25, 26, 26,
                          ][i]
                        }
                      </text>
                      <text
                        x="52"
                        y={156 + i * 18.2 + contentScroll + (i >= 11 ? 33 : 0)}
                        fill={
                          i === 2 || i === 3 || i === 4
                            ? "#b39682"
                            : text.startsWith("#")
                              ? "#6b9eb7"
                              : "#c6c6c3"
                        }
                        fontFamily="Consolas, Noto Sans SC, monospace"
                        fontSize="13"
                        fontWeight="400"
                      >
                        {i === 9 || i === 10 ? "" : text}
                      </text>
                    </g>
                  ))}
                </g>
              )}
              {script &&
                srtLines.map((text, i) => (
                  <g key={i}>
                    <text
                      x="26"
                      y={161 + i * 25}
                      fill="#7c807b"
                      fontFamily="Consolas"
                      fontSize="14"
                    >
                      {i + 1}
                    </text>
                    <text
                      x="85"
                      y={161 + i * 25}
                      fill="#d2d4cd"
                      fontFamily="Consolas, Noto Sans SC"
                      fontSize="17.2"
                    >
                      {text}
                    </text>
                  </g>
                ))}
            </g>
            {folder && !script && (
              <g transform={`translate(${dragX} ${dragY})`}>
                <path
                  d="M-18 -27H9L23 -11V25H-18Z"
                  fill="#e6e9e5"
                  stroke="#afb4b4"
                  strokeWidth=".5"
                />
                <path d="M9 -27V-11H23" fill="#ccd3d5" />
                <text
                  x="-10"
                  y="12"
                  fontSize="29"
                  fontFamily="Noto Sans SC"
                  fontWeight="700"
                  fill="#66a1b0"
                >
                  C
                </text>
                <rect x="-32" y="27" width="68" height="24" fill="#276da6" />
                <text x="-30" y="36" fill="#d9e3ee" fontSize="8">
                  数学研究归档
                </text>
                <text x="-8" y="47" fill="#d9e3ee" fontSize="8">
                  目录.srt
                </text>
                <circle cx="18" cy="31" r="12" fill="#50ce0d" />
                <path d="M12 31H24M18 25V37" stroke="white" strokeWidth="2" />
                <path
                  d="M10 8L10 22L14 18L18 26L21 24L17 17L24 17Z"
                  fill="white"
                  stroke="#243a41"
                />
              </g>
            )}
            {!folder && (
              <g
                transform={`translate(${mix(68, 340, selection)} ${selection > 0 ? 310 + grouped * 44 : 276})`}
                opacity={t < 10.6 ? 1 : 0}
              >
                <path
                  d="M-3 -8H3M0 -8V8M-3 8H3"
                  fill="none"
                  stroke="#0b0b0b"
                  strokeWidth="3.5"
                />
                <path
                  d="M-3 -8H3M0 -8V8M-3 8H3"
                  fill="none"
                  stroke="#e8e8db"
                  strokeWidth="1.2"
                />
              </g>
            )}
            <rect x="-250" y="700" width="1400" height="22" fill="#30332f" />
            <text
              x="260"
              y="713"
              fontSize="10"
              fill="#bbbfba"
              fontFamily="Noto Sans SC"
            >
              已为屏幕阅读器优化 行1，列1 空格:2 UTF-8 LF Markdown
            </text>
          </g>
        </g>
        <rect width="544" height="720" fill="url(#synced-editor-light)" />
        <rect width="544" height="720" fill="url(#synced-editor-scan)" />
      </svg>
      {terminal > 0 && (
        <div
          style={{
            position: "absolute",
            left: 38,
            top: 294 + (1 - terminal) * 16,
            width: 468,
            height: 132,
            background: `rgb(${mix(166, 241, terminalExposure)}, ${mix(166, 240, terminalExposure)}, ${mix(163, 236, terminalExposure)})`,
            borderRadius: 11,
            boxShadow: "0 22px 40px #0008",
            opacity: terminalOpacity,
            transform: `scale(${0.97 + 0.03 * terminal})`,
          }}
        >
          <div
            style={{
              height: 30,
              borderBottom: "1px solid #dfdfda",
              textAlign: "center",
              fontSize: 10,
              color: "#777974",
              fontFamily: "Consolas",
              paddingTop: 8,
            }}
          >
            Terminal · 示意
          </div>
          <div
            style={{
              position: "absolute",
              left: 12,
              top: 11,
              display: "flex",
              gap: 4,
            }}
          >
            {["#f67543", "#edc934", "#38bc46"].map((c) => (
              <span
                key={c}
                style={{
                  width: 8,
                  height: 8,
                  background: c,
                  borderRadius: "50%",
                }}
              />
            ))}
          </div>
          <div
            style={{
              padding: "28px 22px",
              fontFamily: serif,
              fontSize: 25,
              fontStyle: "italic",
              fontWeight: 400,
              color: "#30312a",
              letterSpacing: -1.2,
            }}
          >
            <span style={{ color: "#a6a180", paddingRight: 12 }}>›</span>
            {"719 篇稿件，372 组研究".slice(
              0,
              Math.round(unit((t - 12.646) / 0.5) * "719 篇稿件，372 组研究".length),
            )}
            <span
              style={{
                fontFamily: "Consolas",
                fontWeight: 400,
                opacity: Math.floor(t * 2.5) % 2 === 0 ? 1 : 0.7,
              }}
            >
              │
            </span>
          </div>
        </div>
      )}
    </AbsoluteFill>
  );
};
