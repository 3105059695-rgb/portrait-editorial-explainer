# portrait-editorial-explainer

**把剪辑方法交给小模型，把动画执行交给确定性的引擎。** 这是面向中文竖屏讲解的 Agent Skill：模型根据新口播选择对象、关系、镜头和动作，生成分镜 JSON；通用 Remotion 引擎读取它，生成可编辑视频。

V2 的默认入口已经改为 **新内容 → 语义分镜 → JSON 校验 → 自动编译 → 渲染**。片长、场景数量与顺序、道具、图片、字幕和动作时点都由本期数据决定。求职、公文包、OpenAI 和 10.74 秒旧案例仅保留为历史研究案例。

[下载最新版](https://github.com/3105059695-rgb/portrait-editorial-explainer/releases/latest) · [安装教程](docs/INSTALL.md) · [制作流程](docs/WORKFLOW.md) · [导演手册](references/director-playbook.md) · [故障排查](docs/TROUBLESHOOTING.md) · [V2 验证记录](docs/VALIDATION-V2.md)

## 复用什么，改变什么

| 引擎与 Skill 负责 | 每期由模型根据内容重新编排 |
| --- | --- |
| 纸张材质、景深层次、相机运动、遮罩转场、字幕层和人物层 | 主题、台词、镜头数量、时长、顺序、节奏与配色 |
| 物体聚焦、比较、转移、归类、证据放大、数字变化、关系连接、人物讲述等可组合动作 | 用什么物体解释哪句话、动作何时发生、证据来自哪里 |
| 数据约束、字段级错误提示、素材复制、依赖锁定与工程生成 | 最终声音、真实截图、品牌素材、照片和使用权 |
| 连续物体身份和动作进度、按字幕关联镜头关注点 | 哪些段落需要留白、回到人物、或扩展新的专用动作 |

八种机制是可组合的动作词汇，**没有限定视频只能讲八种题材**。没有真实配图时可先使用原生 SVG 示意；拿到合适图片后通过资产引用替换。精细三维、特定地图路径、复杂产品操作等内容需要提供素材或扩展组件，现有引擎不声称覆盖所有视觉任务。

这份 Skill 仍需支持读写文件和运行命令的 Agent。更弱的模型不必先学会写 React 动画，但仍要理解口播、选择合适的视觉关系并执行校验与修改。模型越弱，越应把复杂长稿分成小段设计；不能把一次结构通过当成任意模型的成片质量保证。

## 跨主题示例与小模型试用

![四个主题使用同一引擎的实际渲染](docs/adaptive/overview.jpg)

同一套源码可读取下面不同的分镜，不需要为每个主题另写 TSX：

| 示例 / 静音 MP4 | 时长 / 镜头数 | 编排重点 |
| --- | --- | --- |
| [净水器选购](docs/adaptive/water-filter.mp4) | 20.8 秒 / 5 | 比较、提问、对象聚焦和记录证据 |
| [客户问题整理](docs/adaptive/customer-questions.mp4) | 18.6 秒 / 4 | 问题归组、转交、核对和进度变化 |
| [文物记录](docs/adaptive/artifact-recording.mp4) | 22.4 秒 / 6 | 观察证据、前后比较、归档和信息关联 |
| [旅行照片整理](docs/adaptive/travel-photo.mp4) | 19.2 秒 / 6 | 由 gpt-6-luna（low）独立生成分镜；[原始输入与条件](examples/model-evaluation/README.md) |

这些是公开的**静音视觉草案**，不是配好真实人声的正式口播。示例时间是演示/估算数据，示意道具不充当事实证据。实际渲染、抽帧及轻量模型试用记录集中在 [VALIDATION-V2](docs/VALIDATION-V2.md)。

## 快速安装

需要 Python 3.10+。渲染另需 Node.js、npm、兼容浏览器；媒体检查使用 FFmpeg/ffprobe。下面在 Windows PowerShell 中运行，macOS/Linux 对照见[安装教程](docs/INSTALL.md)。

```powershell
git clone https://github.com/3105059695-rgb/portrait-editorial-explainer.git
cd portrait-editorial-explainer
python -X utf8 scripts/install_skill.py --dry-run
python -X utf8 scripts/install_skill.py
python -X utf8 scripts/doctor.py --profile skill
```

无 Git 可下载仓库或 Release ZIP，完整解压后进入含 `SKILL.md` 的目录执行后三条命令。默认安装到 `$CODEX_HOME/skills/portrait-editorial-explainer`，没有设置 `CODEX_HOME` 时安装到 `~/.codex/skills/portrait-editorial-explainer`。安装器不会覆盖非空同名目录；已有版本请先按安装教程备份。

安装后重新打开 Agent 会话，发送下面提示词。若宿主不自动发现 Skill，把第一行换成 `请读取 <实际安装路径>/SKILL.md 并执行`。

```text
请使用 $portrait-editorial-explainer。
输入：<本期口播视频、最终声音或稿件的真实位置>。
主题：<本期主题>；素材状态：<真人原片 / 已粗剪 / 数字人 / 只有声音 / 只有稿件>。
请先读导演手册和分镜契约，围绕本期语义重新选择对象与动作。
优先输出 episode.json，通过校验后编译到新的工程目录；不要复制历史案例的镜头顺序。
真人原片先用已授权的 ChatCut 粗剪；数字人跳过语音粗剪。
以最终人声校准字幕和动作；只有稿件时标为草案，不宣称已完成音画同步。
交付视频、可编辑工程、本期 JSON、素材来源和实际检查记录。
```

不需要告诉模型必须选择哪个道具、几秒换场或只能用几种场景。更细的决策方法已经写入[导演手册](references/director-playbook.md)和[修复表](references/repair-recipes.md)。

## 无账号、无私有素材跑通一个示例

在仓库根目录运行：

```powershell
python -X utf8 scripts/validate_storyboard.py examples/storyboards/water-filter.json --mode draft
python -X utf8 scripts/compile_storyboard.py --input examples/storyboards/water-filter.json --media-dir examples/media --draft --out ../water-filter-demo
cd ../water-filter-demo
npm ci
npm run check
npm run dev
```

按终端地址打开 Remotion Studio。另开终端进入生成的工程，可以输出完整视频或指定秒数静帧：

```powershell
npm run render
npm run render -- 1.2 5.2 10.8 15.4 19.8
```

视频写入 `out/adaptive-portrait.mp4`，静帧写入 `out/frame-1.20.png` 等文件。首次渲染可能下载浏览器；可选 `REMOTION_BROWSER_EXECUTABLE` 的配置见故障排查。输出目录必须不存在或为空；编译器不覆盖已有工程。

切换示例只需更换 `--input` 并使用一个新 `--out`。`customer-questions.json` 不需要外部图片，其他两个示例的原创新素材随 `examples/media` 提供。也可用 `python scripts/new_project.py --out ../my-project` 复制默认通用工程，然后编辑其 `src/episode.json`；正式交付推荐先走校验/编译入口。

## 正式制作：同一入口，更严格的输入

1. 真人原片先经 ChatCut 完成实际粗剪，保留剪前到剪后的映射；数字人、已经粗剪的素材使用各自有效的最终版本。
2. 实测字幕时点，建立“台词 → 对象 → 动作 → 关注点”。按本期内容生成 [V2 分镜 JSON](references/storyboard-contract.md)。
3. 将声音、人物和真实图像放在本期素材根目录，JSON 使用相对于该目录的安全路径。
4. 使用下面默认生产模式校验和编译；最后试听、预览和渲染。字段错误按[修复表](references/repair-recipes.md)处理。

```powershell
python -X utf8 scripts/validate_storyboard.py episode.json --mode production --json
python -X utf8 scripts/compile_storyboard.py --input episode.json --media-dir ./media-root --out ../episode-final
```

生产模式要求实测时间和声音文件；真人/数字人还要求相应人物媒体与剪辑状态。`source.roughcut=done` 是对已完成粗剪的记录，不能用修改标记代替实际操作。编译器检查结构、文件和引用，无法判断一句话是不是在真实录音中恰好这个时点说出。

草案才使用 `--mode draft` 和编译的 `--draft`；生成画面始终显示草案标识。编译器自动写入 `renderMode`，不会把估算数据默认为正式同步视频。

## 文件结构

```text
SKILL.md                         Agent 入口：识别输入、导演、生成、检查、交付
agents/openai.yaml               Skill 调用信息
scripts/                        安装、诊断、JSON 校验与编译
references/director-playbook.md  让小模型按语义选择镜头的方法
references/storyboard-contract.md 字段、机制与时间规范
references/repair-recipes.md     字段错误和常见视觉问题的修改方法
assets/adaptive-template/       默认通用 Remotion 引擎及 package-lock.json
examples/storyboards/           不同主题的完整输入 JSON
examples/media/                 公开原创 SVG 素材
assets/presenter-v3-template/   显式选择的历史风格案例
assets/approved-remotion-case/  显式选择的历史数学案例
docs/                           安装、制作、排错及实际验证记录
```

历史案例仅用 `--case presenter-v3` 或 `--case approved-reference` 显式复制。V1 原始预览和验证仍保留在 [V1 验证记录](docs/VALIDATION.md)，不要把旧预览当作 V2 唯一输出。

## 能力与交付边界

ChatCut 需要使用者自己的已授权连接；Skill 不提供账号或额度。没有 ChatCut 仍能处理已粗剪素材、声音、分镜和通用引擎，但不可声称已完成 ChatCut 粗剪。

公开包不包含原用户视频、人像、私人声音、密钥或签名下载地址。示例均为示意；新一期的事实、素材使用权和完整音画质量需要实际核对。许可与资产来源见 [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md)。不默认调用收费生成、克隆声音或对外发布。
