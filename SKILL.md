---
name: portrait-editorial-explainer
description: 将已有口播或配音制作成有编辑感的竖屏 UI 讲解视频。按新题材重新设计界面、信息层级、操作状态与镜头，复用参考的视觉语言和动效部件；真人原片先经 ChatCut 粗剪，数字人跳过。先交本期开头 10–15 秒确认风格，适用于持续生产不同主题的讲解视频。
---

# 用同一类 UI 设计语言讲不同内容

目标是让用户看到相近的 **界面设计、排版、层次、操作感与运动气质**。每期的信息结构、布局、操作和剪法由内容决定，不要求沿用参考片的镜头顺序。相同配色或几个熟悉的转场不能单独证明风格达标。

默认工程是 `assets/source-style-template`。其中 `ui-stage` 用小部件和状态轨迹组合本期界面；六套较早的完整场景仅供合适语义下复用。旧 V2 与职业/数学案例保留兼容，均不定义所有新视频的长相。

## 已确定的工作方式

使用已有口播视频或配音；优先复用可靠部件，表达不了时再扩展；先做本期开头 10–15 秒，用户认可后做全片。不要重复询问这些偏好。缺少本期输入时只询问文件位置；可以先校准机制，但示例不能冒充本期成片。本 Skill 不另外授权生成声音、数字人、付费素材或发布。

## 执行顺序

1. **理解这类界面。** 先读 [UI 设计系统](references/ui-style-system.md)。有参考视频时观看与本期相关的连续片段，检查画面的真实信息层级与状态变化。运动细节需要时再读 [风格语法](references/source-style-grammar.md)，不要先挑完整场景再把内容塞进去。
2. **定下声音母带。** 真人原片先经已授权的 ChatCut 粗剪；已粗剪素材检查后沿用；数字人跳过；最终配音直接采用。保留实际剪切映射。工具未连接时不能声称已经剪过。详见 [素材与开头流程](references/source-style-workflow.md)。
3. **先设计本期 UI。** 从开头话意确定“观众要理解什么 → 界面里有哪些内容 → 操作改变什么 → 镜头关注哪里”。写出主要区域、真实或示意内容、对象 ID 及前后状态。示意界面清楚标识；本期素材允许使用时优先纳入实际画面。
4. **再组合动作。** 大多数新布局用 `ui-stage` 的节点、`tracks` 和 `camera` 表达，见 [UI 组合契约](references/ui-composition-contract.md)。同一部件可以用于完全不同的布局和操作。已有完整场景恰好适合本句时才查 [效果索引](references/source-style-effects.md)。需要新增部件时读 [扩展约定](references/source-style-extension.md)。
5. **对齐声音并做开头。** 按 [episode 契约](references/source-style-contract.md) 写 JSON，字幕与关键词使用最终音轨的实测时点。先校验、编译、渲染从第 0 秒开始的 10–15 秒完整话语，连续看听并修复可读性、遮挡、同步及动作逻辑，再交用户看，保持 `styleApproval: pending`。
6. **按视觉反馈继续。** 用户说“UI 感少”时检查信息组织、内容密度、界面层级和可见操作；说“不像”时对照具体差异，迭代这段开头。不能只加纹理、粒子或转场。得到这期明确的风格认可后，记录真实反馈再扩展全片。

## 轻量模型的最短路径

读取本入口、[UI 设计系统](references/ui-style-system.md)、[UI 组合契约](references/ui-composition-contract.md)；按 episode 契约填写外层字段。不要先研究所有历史源码。

先写一份很短的本期设计表：

| 必填项 | 要写清楚的内容 |
|---|---|
| 本段信息 | 观众看完能理解的一句话 |
| 界面结构 | 主操作区、上下文区、反馈区，以及各自的实际内容 |
| 状态链 | 初始状态 → 具体操作 → 读得懂的结果 |
| 镜头 | 先建立什么、贴近哪里、何时保留或恢复上下文 |
| 字幕落点 | 哪个实测词句触发状态变化 |

随后把设计写成 `ui-stage`：`content.items: []`，在 `content.ui` 中布置 `panel/text/button/input/badge/image/progress/line/chart/cursor`，用轨迹改变同一对象，用相机指向当前阅读区域。字段与范围以契约为准；校验通过后仍要看实际画面。不要机械地每期安排搜索、复制、上传，也不要为了“像 UI”添加没有意义的按钮。

## 编译与交付

在 Skill 根目录运行，`media-root` 中只放本期允许使用的素材，JSON 使用相对路径：

```shell
python scripts/source_episode.py validate episode.json --production --media-dir media-root
python scripts/source_episode.py build episode.json --production --media-dir media-root --out ../episode-project
cd ../episode-project
npm ci
npm run check
npm run render
```

输出 `out/opening.mp4`、`out/render-report.json` 和 `out/review.pending.json`。预览用 `npm run dev`；关键词帧用 `npm run still -- 2.4 7.8`。无声校准示例省略 `--production`，不能冒充最终音画同步。默认初始化：`python scripts/new_project.py --out ../demo`。

用户看过本期开头并明确认可后，复制待反馈文件到 `review.json`，据实填写 `status: approved`、`reviewer: user` 与 `evidence` 中的原话或记录位置，保留当前 `episodeSha256`：

```shell
npm run render:full -- --approval review.json
```

审核文件用于记录反馈和防误触，不验证用户身份。Agent 不得代填“用户已认可”。分镜变化后重新核对；更改 JSON 会使旧审核文件失效。

## 必须保留的约束

- UI 有具体内容、阅读顺序和操作结果。大标题下面只有空卡片或图标，不能据此称为 UI 风格讲解。
- 同一个对象在移动、选择和变形后保持身份；数据与进度对应画面上可解释的状态变化。
- 白底界面保留导航、层级与留白；漫画强调只在有解释作用时使用，不强制每期加入。曲屏、暗角、扫描纹也不是通用风格开关。
- 9:16 重排布局与留白，图片和人物保持比例。字幕、人物与当前操作区不互相遮挡；字号以实际手机尺寸预览检查。
- 字幕、人声、人物和动作共享剪后时钟，保持原语言、原速与语义。转场中的两侧画面继续运行。

## 验证边界

组件帮助较轻模型少写动画代码，但不能保证任意模型都得到相同的审美结果。旧六场景的测试不等于新 UI 组合经过同样测试；以当前实际记录为准。整体风格相近和每期内容讲清楚，是开头验收的目标；不追求同一套剪辑顺序。

至少检查契约与类型、真实渲染和解码、开头连续看听、关键词落点、转场前中后及手机阅读尺度。没有完整看听时明确说明。交付 MP4、可编辑工程、JSON、字幕、素材来源和检查记录；公共包排除私人声音、原片素材、凭证和作者本机路径。
