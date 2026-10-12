# portrait-editorial-explainer

用已有数字人、真人口播或配音，制作有主题物件、明显景别变化、资料场景和漫画转场的竖屏讲解。**视觉基准是用户已认可的数字人口播 V3；具体内容、物体、顺序和时长按本期口播重新编排。**

用 Remotion 复用物件运动、镜头、曲屏资料和漫画段的实现，根据本期声音和素材自由组合。提供完整代码、相对路径素材、分镜参数和两个可运行示例。

[下载当前修订](https://github.com/3105059695-rgb/portrait-editorial-explainer/archive/refs/heads/main.zip) · [Skill入口](SKILL.md) · [已确认剪辑方向](references/approved-editing-direction.md) · [V3动作与源码定位](references/approved-presenter-v3.md) · [制作流程](references/presenter-workflow.md)

[下载 v3.1.0-rc.1 完整 Skill 包](https://github.com/3105059695-rgb/portrait-editorial-explainer/releases/tag/v3.1.0-rc.1)。本版已把物体表面开窗、连续进入下一场、胶片红线和竖向人物小窗接入同一套参数化引擎，并完成实际视频渲染；新一期先交自己的开头供观看。

## 要继承的效果

- 主题物件先特写、再回拉建立关系，镜头随讲述对象换焦点。
- 口播动词变成物体的实际行动，带出能读懂的结果。
- 从具体物体表面或关联位置，展开真实的下一场。
- 资料界面可以整屏曲面聚焦，解释段可以进入完整漫画场景。
- 数字人、人声和字幕保持连续主线，素材和镜头围绕内容组织。

[新版职业主题校准片](docs/editorial-career-preview.mp4) 使用占位人物和示意访谈；[净水器安装示范](docs/editorial-water-preview.mp4) 使用另一组原创物件、镜头和四格过程胶片。两者均为明确标注的静音草案。原委托者的实际数字人、声音、参考视频不随包公开。

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
按已认可V3的剪辑方向，结合本期内容重新设计物件、素材、景别和转场。
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

这两份数据用于学习如何编排。默认入口不会自动选择其中一份；自己的主题需要自己的台词、素材、动作和时点。

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

| 已补齐的机制 | 每期可以改变什么 |
| --- | --- |
| 精确物体表面开窗 | `transitionAnchor` 指向任意本期图层内的矩形，跟随图层移动、旋转、缩放及镜头，再展开为下一场 |
| 下一场连续进入 | 图层和镜头支持场景开始前的负时间关键帧；窗口内使用正在推进的同一时间轴，到切场边界不冻结或重播 |
| 胶片与贯穿红线 | `filmstrip` 支持不同画面数量、尺寸、位置、转角、入场与连线时间；可用本期资料重新排列 |
| 竖向人物小窗 | `presenterStyle` 配置圆角、倾斜和位置；人物从全屏连续缩小，声音与人物始终沿同一主时钟 |

同时提供直接编排的镜头关键帧、独立图层动作、前景纸片、整屏曲面资料和按语句变化的标题。无需为了换题材再复制一份固定剧情组件；现有配置确实表达不了的新动作，才扩展实现。

本轮已实际渲染原委托者提供的数字人开头 **10.74秒**，以及另一题材的净水器示范 **13.4秒**。私人样段仅交付给素材提供者；公开预览使用占位或自绘素材。参数校验、源码检查、可运行动效测试和成功渲染说明实现可执行，不能代替对本期字幕、音画和审美的检查，也不代表用户已认可这次新版效果。

较轻模型的工作应集中在读懂口播、选素材和填写经过校验的分镜，镜头、转场和材质由成熟组件执行。仓库没有跨模型盲测结果，不能保证每个模型独立达到同样审美。先交真实开头，由实际视觉反馈校准；样段不合格时修复画面，不以组件数或测试数替代结果。

## 来源与许可

独立编写代码和原创素材采用MIT。第三方依赖、字体与历史图片见 [THIRD_PARTY_NOTICES](THIRD_PARTY_NOTICES.md)。参考原片、私人声音、人物和凭证不公开。Skill不另外授权收费服务、生成声音或发布。
