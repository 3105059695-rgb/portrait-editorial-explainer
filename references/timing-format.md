# 旁白、字幕与动作的共同时间轴

用稳定的 `cueId` 连接口播段落、字幕和动作。字幕文本可以润色，但不能把全文字符串当作唯一键。

**v2 新工程使用 [可编译分镜契约](storyboard-contract.md) 的 `episode.json`。** 它包含本期 `objects`、`assets`、`captions` 和 `scenes[].beats`，默认经 `validate_storyboard.py` 与 `compile_storyboard.py` 驱动通用引擎。本文下面保留的 `timeline.json` 是可选的旧对齐记录格式，使用 `events/offset/phase`；它不是 `episode.json`，不能直接交给新编译器，也不会自动改写任何工程。

## 时间轴基准

- 真人竖屏口播原始素材：先用 ChatCut 粗剪并锁定剪后口播时间轴，再生成字幕和动作表。
- 数字人视频：默认跳过粗剪，保留生成语音的既有时间轴。
- 粗剪时记录每个保留片段的原素材起止时间、剪后起止时间及对应 `cueId`，用于追溯和重新对齐；可另存剪辑映射表，不新增本格式的必填字段。
- 所有字幕、动作事件、音乐落点与项目总时长均以最终剪后时间轴为准。后续若改变剪口，须按片段映射重新生成或校准受影响的时间数据，不能统一平移一个常数。
- 剪辑时保持原素材画面与声音关联，保留口播的语速不变；剪后画面必须使用对应剪后人声，不能搭配未剪的原始整段音频。

## v2 分镜如何使用共同时间轴

1. 从最终声音取得字幕 `captions[].start/end` 与稳定 `id`。正式片根字段 `timing` 必须是 `measured`；估算或演示分别用 `estimated/demo`，只能输出明确草案。
2. 按语义把字幕分成连续镜头，`scenes` 覆盖完整 `0..duration`。每镜 `cueIds` 引用该区间内的字幕；镜头数量、顺序和时长由新内容决定。
3. 在 `scenes[].beats` 写动作绝对秒数 `at`、字幕 `cueId`、动作 `action`、目标 `targetId`；移交、归组、连线还指定 `withId`。对象必须在本镜 `objectIds` 中。预备运动由引擎安排，关键结果在 `at` 落位。
4. v2 支持 25/30/50/60 fps，画布 1080×1920。转帧由引擎统一处理，不将旧格式可接受的任意帧率直接移植过来。

在 Skill 根目录运行，输入与输出路径按自己的工作目录调整：

```shell
python scripts/validate_storyboard.py ../episode-work/episode.json --mode production --json
python scripts/compile_storyboard.py --input ../episode-work/episode.json --media-dir ../episode-work/media-root --out ../new-episode
```

草案使用 `--mode draft` 与编译的 `--draft`。在 Windows 可用 `python -X utf8`，macOS／Linux 常用 `python3`。默认生产模式要求真实定稿声音和素材状态；校验与编译只检查数据结构、声明和引用文件，不会替你听辨关键词或执行 ChatCut。

如需迁移旧 `timeline.json`：字幕 ID 可沿用；事件时点可先计算为 `caption.start + offset`，再按真实语义选择受支持的动作和场景、补对象/素材/来源/镜头边界。旧 `action` 是自由文本，不能直接作为 v2 枚举；`prepare/exit` 记录可保留作导演备注，不能机械转换成全部落点。重新检查最终声音后再标为 measured。

## 可选旧格式的文件约定

- `fps`：正数，例如 `30`；允许 `29.97` 等帧率。
- `duration`：成片总秒数。
- `timingSource`：建议记录 `ASR + 人工校对`、强制对齐来源，或者明确写 `DEMO / 手写示例`。示例不等于真实语音对齐。
- `captions`：非空数组。每项包含稳定字符串 `id`、秒数 `start/end`、非空 `text`；可选 `track`，默认 `main`。同轨字幕不重叠，首尾可以相接。
- `events`：非空数组。每项包含稳定字符串 `id`、已有字幕的 `cueId`、可读的 `action`、保持物体身份的 `objectId`、`phase`、秒数 `offset`。
- `phase` 只取 `prepare`（预备）、`land`（语义落点）、`exit`（退场/收束）。可选 `duration` 默认 `0`，表示落点标记；可选字符串 `camera`、`sfx` 记录执行意图。

动作绝对时间为 `caption.start + event.offset`，结束时间再加 `duration`；两者都必须在项目时长内。事件可以跨过字幕结束点，不强行把一切动作切成字幕卡片。CSV 中 `start_frame` 为绝对时间乘以帧率后四舍五入；实际渲染统一使用同样的转换规则。

只有 `prepare` 可用负 `offset`，并且必须写非空 `anticipationReason`：可以提前把光标或纸页放到位，不能在解说前提前泄露最终结论。数字、选中状态、错误标记、验证结果等关键变化放在对应说话落点。一次长句包含多次动作时，给事件不同 `offset`；若需要词级定位，先从音频测量，不凭字数均分后称为“精准对齐”。

建议在上述口播时间轴锁定后生成字幕和动作表，留存原始旁白母带，并以最终时间轴对应的人声作为合成基准。只改视觉节奏时优先调整镜头或动作时序；不能为了配现有画面把旁白随意加速、裁字或重新生成。主题事实、字幕准确性和读清时间必须人工核查。

## 可选旧格式的连续语义示例

`assets/timing-example/timeline.json` 是 16 秒中文中性测试数据：同一张 `working-page` 经历写入 → 选中 → 检查 → 原处修正。时间是人为示例，不来自 ASR，也不意味着已有对应成片或音频。多次使用同一 `objectId` 是要求视觉延续，并非把四张不同卡片起相同名字。

在任意目录运行（将 `SKILL_DIR` 换成技能真实目录）：

```powershell
python -X utf8 "SKILL_DIR/scripts/check_timeline.py" "SKILL_DIR/assets/timing-example/timeline.json" --csv "./alignment.csv"
```

返回码：`0` 为结构通过；`1` 为时间轴数据错误；`2` 为读写错误。验证失败不写 CSV；CSV 使用 UTF-8 BOM，便于 Windows Excel 读取中文，且拒绝覆盖已有文件。通过只证明时间结构有效，不能证明动作语义正确、字幕与音频已对齐、成片可读或风格已获认可。

## 创建通用可编辑项目

```powershell
python -X utf8 "SKILL_DIR/scripts/new_project.py" --out "./my-adaptive-project"
cd "./my-adaptive-project"
npm ci
npm run dev
```

目标必须在 Skill 外、不存在或为空；脚本不覆盖已有工程，不自动安装依赖。默认 `--case adaptive`，Composition 为 `AdaptivePortrait`，内置 `src/episode.json` 是无声示意。改用本期 JSON 后，时长、物体、场景顺序与动作由数据决定。实际制作优先使用上面的编译器，将本期引用的媒体一并带入工程。

只有显式 `--case presenter-v3` 才复制固定 `1080×1920 / 50fps / 10.74秒` 的人物 V3 历史样例；`--case approved-reference` 复制旧 `816×1080` 数学案例。这些选项用于风格研究，改变比例时需要重新排版。所有路径均不意味着任意稿件已经自动得到完成或获认可的成片。
