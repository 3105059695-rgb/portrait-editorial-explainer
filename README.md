# portrait-editorial-explainer

用已有数字人、真人口播或配音，制作按内容切换素材、构图和表达方式的竖屏讲解。**本项目的风格依据是最初提供的完整参考视频；V3和净水器只是局部机制示例，不能替代原片的整体视觉语言。**

用 Remotion 组合排版拼贴、真人与视频素材、真实屏幕和网站、概念图形、信息图表、多窗口、透视画廊及漫画段，根据本期声音选择表达。现有代码只覆盖其中一部分；提供的分镜与可运行示例不代表已经完整覆盖原片。

[下载当前修订](https://github.com/3105059695-rgb/portrait-editorial-explainer/archive/refs/heads/main.zip) · [Skill入口](SKILL.md) · [已确认剪辑方向](references/approved-editing-direction.md) · [V3局部机制与源码](references/approved-presenter-v3.md) · [制作流程](references/presenter-workflow.md)

[历史 v3.1.0-rc.1 Skill 包](https://github.com/3105059695-rgb/portrait-editorial-explainer/releases/tag/v3.1.0-rc.1)保留已实现的物体开窗、连续入场、胶片红线和人物小窗。优先下载上方当前修订；这些局部能力不是原片全套风格已完成的证明。

## 要继承的效果

- 用排版、真实素材、UI、概念图标和图表表达当前这句话，镜头随重点变化。
- 使用筛选、输入替换、进度、粒子、对比、窗口接力等实际动作推动信息变化。
- 需要时进入多窗口、透视画廊、手绘浏览器壳与真实内容，或完整漫画场景。
- 按段落组织视觉变化，不让同一软件界面或同一种纸感插画统治全片，也不在每10秒硬塞所有风格。
- 人物是否出现、占多大、用什么形状由内容和使用者要求决定；出现时保持声音与字幕的连续时钟。

[职业主题局部机制片](docs/editorial-career-preview.mp4) 使用占位人物和示意访谈；[净水器局部机制片](docs/editorial-water-preview.mp4) 使用原创物件和四格过程胶片。两者都是静音草案，展示代码能力，不是整体风格基准。原委托者的实际数字人、声音、参考视频不随包公开。

历史版本仍可查看：[V3机制预览](docs/public-preview.mp4) · [V3校准画面](docs/preview.jpg)。

这里的旧主题不是固定脚本。新视频不必出现公司、公文包、访谈或紫色漫画，也不必使用全部效果；保留设计做法，按新话意重组。

日常调用直接按口播语义设计并用 Remotion 剪辑，完成必要成片检查后交付10–15秒开头。只有首次学习参考、使用者明确指出不像，或要求复刻对照时，才做针对性比较；不默认反复制作对照图、分析报告或另开审查流程。

## 安装与调用

需要完整仓库。安装器需要Python3.10+；渲染还需Node/npm、Remotion兼容浏览器、FFmpeg/ffprobe。ChatCut仅在真人原片粗剪分支需要，使用者提供本期工具与账号。

```powershell
git clone https://github.com/3105059695-rgb/portrait-editorial-explainer.git
cd portrait-editorial-explainer
python -X utf8 scripts/install_skill.py --dry-run
python -X utf8 scripts/install_skill.py
python -X utf8 scripts/doctor.py --profile production
```

默认安装到 `$CODEX_HOME/skills` 或 `~/.codex/skills`，其他宿主可用 `--skills-dir`。已有非空同名目录不会被覆盖，升级先备份；无需作者电脑上的盘符、声音或账号。

调用示例：

```text
使用 $portrait-editorial-explainer。
本期素材：<已有数字人/真人口播/最终配音文件>。
按最初完整参考的视觉语言，结合本期内容组合真实素材、UI、图形、镜头和转场；不固定为V3或净水器的画法。
真人原片先ChatCut粗剪；数字人跳过。
先制作实际开头10–15秒，我看过整体风格后再继续全片。
```

## 本期生成入口

Agent先根据真实口播写 [v2分镜](references/storyboard-contract.md)，所有素材使用相对路径。新入口不自动替你虚构一个主题：

```powershell
python -X utf8 scripts/new_project.py --input episode.json --media-dir media-root --out ../this-episode
cd ../this-episode
npm ci
npm run check
npm run test:motion
npm run render
```

**先把本期分镜范围设为第0秒开始的10–15秒完整话语。** 底座render命令会渲染传入分镜的整个时长；当前没有自动截取开头或用户认可门禁。用户认可后再扩展全片分镜，不能提交全片后声称只做样段。无最终声音时可用 `--draft` 做明确草案，不当成正式交付。

生成工程附 `STYLE_TARGET.md`，记录相同视觉基准、反例和实现边界。缺少输入时命令返回提示，不创建资料工作台，也不自动复制固定10.74秒旧片。缺素材/非法路径沿用编译器校验，不能跳过。

## 下载后先跑一个完整例子

在仓库根目录执行，无需作者的素材目录或账号：

```powershell
python -X utf8 scripts/new_project.py --input examples/storyboards/editorial-water-opening.json --media-dir examples/media --out ../water-opening --draft
cd ../water-opening
npm ci
npm run check
npm run test:motion
npm run render
```

输出为 `out/adaptive-portrait.mp4`。把输入换成 `examples/storyboards/editorial-career-opening.json`，并另设一个空输出目录，即可运行另一份校准案例。

| 可运行分镜 | 展示内容 | 素材边界 |
| --- | --- | --- |
| [职业主题开头](examples/storyboards/editorial-career-opening.json) | 特写回拉、物件移动、表面开窗、曲屏资料、漫画胶片、竖向人物窗口 | 公开占位人物、原创道具与示意访谈，不含原委托者声音 |
| [净水器安装开头](examples/storyboards/editorial-water-opening.json) | 接口与空间换焦点、滤芯进入机身、水窗展开资料、四格过程连线 | 原创自绘插画和安装示意，不是厂商说明书或实际产品操作指导 |

这两份数据仅用于学习已有局部机制。默认入口不会自动选择其中一份；自己的主题需要自己的台词、素材、动作和时点，不能把示例画法升为全片默认风格。

## 研究历史风格校准

```powershell
python -X utf8 scripts/new_project.py --case presenter-v3 --out ../v3-calibration
cd ../v3-calibration
npm ci
npm run dev
```

`presenter-v3` 仅供研究已认可镜头实现，不能仅替换人像或字幕当作完成新一期。`--case adaptive` 是基础动作草案；`--case source-style` 是辅助UI示例。所有示例都需显式选择，不是默认成片。

## 能力与验证边界

`scene.editorial` 让模型填写本期构图和动作数据，复用已写好的动画。结构以 [JSON Schema](references/storyboard.schema.json) 和 [分镜契约](references/storyboard-contract.md) 为准：

| 已实现的局部机制 | 每期可以改变什么 |
| --- | --- |
| 精确物体表面开窗 | `transitionAnchor` 指向任意本期图层内的矩形，跟随图层移动、旋转、缩放及镜头，再展开为下一场 |
| 下一场连续进入 | 图层和镜头支持场景开始前的负时间关键帧；窗口内使用正在推进的同一时间轴，到切场边界不冻结或重播 |
| 胶片与贯穿红线 | `filmstrip` 支持不同画面数量、尺寸、位置、转角、入场与连线时间；可用本期资料重新排列 |
| 竖向人物小窗 | `presenterStyle` 配置圆角、倾斜和位置；人物从全屏连续缩小，声音与人物始终沿同一主时钟 |

同时提供直接编排的镜头关键帧、独立图层动作、前景纸片、整屏曲面资料和按语句变化的标题。无需为了换题材再复制一份固定剧情组件；现有配置确实表达不了的新动作，才扩展实现。

原片中的完整素材视频编排、筛选与输入状态、多种图表和粒子、透视画廊、多窗口及丰富漫画表达尚未由这套底座全面覆盖。UI本身是重要表达手段；问题是整段套用一种固定软件界面，或用一种插画替代所有内容。

本轮已实际渲染原委托者提供的数字人开头 **10.74秒**，以及另一题材的净水器示范 **13.4秒**。私人样段仅交付给素材提供者；公开预览使用占位或自绘素材。参数校验、源码检查、可运行动效测试和成功渲染说明实现可执行，不能代替对本期字幕、音画和审美的检查，也不代表用户已认可这次新版效果。

较轻模型的工作应集中在读懂口播、选素材和填写经过校验的分镜，镜头、转场和材质由成熟组件执行。仓库没有跨模型盲测结果，不能保证每个模型独立达到同样审美。先交真实开头，由实际视觉反馈校准；样段不合格时修复画面，不以组件数或测试数替代结果。

## 来源与许可

独立编写代码和原创素材采用MIT。第三方依赖、字体与历史图片见 [THIRD_PARTY_NOTICES](THIRD_PARTY_NOTICES.md)。参考原片、私人声音、人物和凭证不公开。Skill不另外授权收费服务、生成声音或发布。
