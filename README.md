# portrait-editorial-explainer

面向中文竖屏口播的 AI Agent Skill：把最终口播时间轴转成连续的镜头、真实资料、物体动作和同步字幕，并交付可编辑的 Remotion 工程。

默认流程：**真人原始视频 → ChatCut 粗剪 → 锁定剪后人声 → V3 风格动效与字幕 → 检查、导出。** 数字人视频默认跳过语音粗剪；已经粗剪的素材沿用现有版本。

[下载最新版](https://github.com/3105059695-rgb/portrait-editorial-explainer/releases/latest) · [安装教程](docs/INSTALL.md) · [完整工作流](docs/WORKFLOW.md) · [常见问题](docs/TROUBLESHOOTING.md) · [实际验证记录](docs/VALIDATION.md)

## 先看效果与范围

[![V3 占位工程预览](docs/preview.jpg)](docs/public-preview.mp4)

[下载／查看静音预览 MP4](docs/public-preview.mp4)。这是仓库公开占位工程的机制预览，用来理解相机推拉、曲屏、窗口接力和漫画段的运动。它没有真实口播声音，也没有附带原案例的人物素材。

| 项目 | 本仓库提供什么 |
| --- | --- |
| Skill | 工作流程、风格规则、时间轴规范和 Agent 调用入口 |
| 默认 V3 工程 | 1080 × 1920、50 fps、537 帧／10.74 秒，可编辑源码与锁定依赖 |
| 默认媒体 | 明确的人物占位和访谈占位；声音为空 |
| 历史内容 | 保留历史案例台词和专用镜头时点，用于说明机制；新稿必须重新设计 |
| 辅助脚本 | 安装 Skill、环境诊断、复制新工程、检查时间轴并导出 CSV |
| 旧参考工程 | 816 × 1080 的数学解释案例，可选，用于纸页、研究编辑器等机制参考 |
| 不包含 | 私人人像、用户原视频、克隆声音、账号、密钥、ChatCut 授权、已安装的 Node 依赖或浏览器 |

**这不是“输入任意稿件，直接生成成片”的独立软件。** Skill 给支持它的 Agent 提供制作方法；新一期仍要准备素材、校准真实声音、重新导演动作，并实际渲染。完整视频质量取决于这些步骤，安装成功不能替代剪辑与验收。

## 适合什么任务

- 真人原始口播：剪除口误、试录重复和冗余停顿，保留意思、自然呼吸与原声，再制作动效。
- 数字人口播：保留已有定稿声音与口型，以当前视频时间轴制作字幕、证据画面和语义动画。
- 已粗剪视频：直接沿用有效剪辑，避免再清理一遍造成吞字或语义跳跃。
- 只有声音：围绕最终旁白制作说明画面。
- 只有稿件：先做分镜与可编辑视觉草案，取得最终录音后再校准同步。
- 已有工程修复：只修字幕、画面遮挡、动作落点或指定风格差距，保留已认可部分。

核心方法是“**说了什么 → 哪个物体 → 它如何变化 → 镜头看哪里**”。例如同一张纸被写入、选中、检查、原处修正，让动作传递因果，而不是每句字幕换一张卡。

## 快速开始：下载、安装、调用

下面命令在仓库根目录执行。Windows 使用 PowerShell；macOS／Linux 的对应步骤见[安装教程](docs/INSTALL.md)。首次下载与依赖安装需要网络，实际耗时取决于环境。

```powershell
git clone https://github.com/3105059695-rgb/portrait-editorial-explainer.git
cd portrait-editorial-explainer
python -X utf8 scripts/install_skill.py --dry-run
python -X utf8 scripts/install_skill.py
python -X utf8 scripts/doctor.py --profile skill
```

没有 Git 也可以从[仓库页面](https://github.com/3105059695-rgb/portrait-editorial-explainer)下载 ZIP、完整解压，再进入含 `SKILL.md` 的目录执行后面三条命令。Windows 若只有 `py` 命令，将 `python -X utf8` 换成 `py -3 -X utf8`。

安装器默认安装到：

- 已设置 `CODEX_HOME`：`$CODEX_HOME/skills/portrait-editorial-explainer`。
- 未设置：当前用户的 `~/.codex/skills/portrait-editorial-explainer`。

安装器不覆盖非空目录。已有同名 Skill 时按[更新说明](docs/INSTALL.md#更新已有安装)备份处理。它不会安装 ChatCut、登录账号或替你配置其他 Agent。

安装后重新打开支持 Skill 的 Agent 会话，或重启相应应用，再发送：

```text
请使用 $portrait-editorial-explainer。
先读取这个 Skill，检查当前可用工具和我的输入，按其中的流程处理。
```

若技能选择器未显示，给 Agent 明确路径：

```text
请读取我刚安装的 portrait-editorial-explainer/SKILL.md，按该文件和其引用文档执行。
Skill 的完整路径是：<安装器输出的路径>/SKILL.md
```

把尖括号部分换成真实路径。不同 Agent 的 Skill 发现方式不同；能够读取文件不等于该 Agent 已具备 ChatCut、终端或渲染能力。

## 跑通一个可编辑样例

这是独立的“模板运行”步骤，不需要真人素材，也不要求先连接 ChatCut。需要 Python 3.10+、Node.js、npm；建议 Node.js 22+，制作与技术检查还需要 FFmpeg／ffprobe。具体环境与验证范围见[安装教程](docs/INSTALL.md#准备运行环境)和[验证记录](docs/VALIDATION.md)。

在下载的仓库根目录执行：

```powershell
python -X utf8 scripts/doctor.py
python -X utf8 scripts/new_project.py --case presenter-v3 --out "../my-portrait-demo"
cd "../my-portrait-demo"
npm ci
npm run check
npm run dev
```

`npm run dev` 启动预览服务，按终端给出的地址打开 Remotion Studio；使用 `Ctrl+C` 停止。目标工程必须在 Skill／仓库目录之外，且不存在或为空。复制脚本不会安装 npm 依赖。

另开终端进入新工程，导出视频或静帧：

```powershell
npm run render
npm run render -- 0.6 2.8 5.6 7.6 9.8
```

- 视频：`out/presenter-v3-example.mp4`。
- 静帧：例如 `out/frame-0.60.png`。参数是**秒**，不是帧号。
- 默认输出静音，这是预期状态。人物视频与旁白通过 `src/mediaConfig.ts` 分开接入。
- 首次渲染可能需要下载兼容浏览器；也可给 `render.cjs` 设置 `REMOTION_BROWSER_EXECUTABLE`，详见[故障排查](docs/TROUBLESHOOTING.md#浏览器下载失败或找不到浏览器)。

正式制作请复制另一份新工程，不要把演示用的 537 帧、旧台词和固定镜头直接套到新稿上。

## 直接复制的调用提示词

将示例路径换成你的真实文件路径，并说明素材是否已经剪过。可提供本地路径或当前 Agent 能访问的附件；仅写“桌面上那个视频”可能不足以定位文件。

### 真人原始口播

```text
请使用 $portrait-editorial-explainer 制作这期中文竖屏口播。
输入：<真人原始视频完整路径>；这是未经粗剪的真人素材。
先通过我当前可用且已授权的 ChatCut 做粗剪：删除明确口误、重复试录、废片和冗余停顿，
保留完整意思、原人声、自然呼吸和保留片段原速。请保存原片到剪后时间的映射。
再以剪后人声为主时钟，按 V3 的连续物体动作和镜头语法设计本期画面、素材与字幕。
成片为 9:16，输出视频、可编辑 Remotion 工程、字幕、时间轴、素材来源和实际检查记录。
如果 ChatCut 当前不可用，请明确说明，先完成素材检查和可独立开展的分镜工作，
不要把未经处理的原片记为已粗剪。
```

### 数字人／已定稿口播

```text
请使用 $portrait-editorial-explainer。
输入：<数字人口播完整路径>；这是已定稿的数字人视频，请默认跳过语音粗剪。
保留现有人声与口型节奏，以最终视频时间轴制作竖屏动效和同步字幕。
根据这期内容重新设计物体、证据和镜头，不能沿用旧案例主题或固定 10.74 秒长度。
人物画面、字幕与证据特效分别分层，交付视频与可编辑工程。
```

### 只有稿件

```text
请使用 $portrait-editorial-explainer，把下面稿件做成竖屏口播分镜和可编辑视觉草案。
当前还没有最终录音，所有时点先标为估算，不宣称已经完成音画同步。
先做“台词—物体—动作—镜头”的语义表，并列出需要我提供的真实资料。
不要擅自生成数字人、克隆声音或调用收费服务。
稿件：<粘贴稿件>
```

### 修复现有工程

```text
请使用 $portrait-editorial-explainer 修复已有工程：<工程完整路径>。
问题：<例如 12.4 秒字幕先于声音；转场中白字看不清；镜头未跟随被介绍对象>。
保留已认可的人声、材质和构图，仅调整解决该问题所需的内容。
请检查相关片段的前、中、后三个状态，说明实际修改与检查范围。
```

## 目录与进一步阅读

```text
portrait-editorial-explainer/
├── SKILL.md                         # Agent 工作入口
├── agents/openai.yaml               # Skill 展示信息
├── scripts/                         # 安装、诊断、复制、时间轴检查
├── references/                      # 风格、时间轴与流程规范
├── examples/                        # 本期输入与粗剪映射示例
├── assets/presenter-v3-template/     # 默认竖屏机制工程
├── assets/approved-remotion-case/    # 可选历史数学工程
├── assets/timing-example/            # 中性时间轴测试数据
└── docs/                            # 公共教程与占位预览
```

建议按[安装](docs/INSTALL.md) → [完整制作](docs/WORKFLOW.md) → [时间轴格式](references/timing-format.md)阅读。可直接填写[本期输入表](examples/episode-brief.md)；ChatCut 与 Remotion 的交接见[粗剪衔接](references/chatcut-handoff.md)。代码和资产说明见 [V3 CASE-NOTES](assets/presenter-v3-template/CASE-NOTES.md)；风格方法见[镜头与材质语法](references/visual-grammar.md)、[V3 机制说明](references/approved-presenter-v3.md)。

## 使用边界

ChatCut 粗剪需要使用者当前可用、已经授权的插件和账号环境；Skill 本身不提供该服务。没有 ChatCut 时仍能安装 Skill、运行占位样例、设计分镜或处理已粗剪素材，但不能据此声称完成了 ChatCut 粗剪。

公开包不提供原案例私人人像或声音使用权。代码、品牌字标、字体和第三方依赖的许可与来源见 [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md)。新一期应使用具有相应使用权限的素材，模拟 UI 明确标注“示意”。本仓库不代表第三方品牌背书，也不承诺平台审核结果。

Skill 不会自动对外发布，不默认授权收费生成。技术检查、视觉抽查、完整音画复核和使用者风格认可应分别记录；本仓库实际做过的检查以[验证记录](docs/VALIDATION.md)为准。
