# 直接用在本期素材上

这份Skill的使用者只需给出材料和任务，Agent负责准备配置与运行。效果实现来自已确认的完整机制库；简化的是操作，不把风格变成固定分镜。

## 给Agent的一句话

```text
使用 $portrait-editorial-explainer。
这是本期数字人/口播视频/最终配音：<文件>，字幕：<若已有则给出>。
按Skill的完整剪辑风格，根据本期内容选择真实素材、UI、空间镜头、图表或漫画。
帮我选效果、安排字幕动作并生成可编辑工程，先交本期10–15秒开头。
```

没有SRT时，Agent从最终音轨转写并核对；不能伪造时间。如果当前环境缺少转写能力，明确所缺能力，仍可先准备视觉草案。真人原始素材先按[口播流程](presenter-workflow.md)完成ChatCut粗剪，数字人跳过。不要把风格参考视频误作本期声音。

## 不熟悉组件时如何选择

先写“本句对象发生什么变化”，再查看效果；选中后仅查对应参数，不必读全部源码。

```shell
python scripts/effect_library.py list
python scripts/effect_library.py find "放大镜"
python scripts/effect_library.py describe reference-search --json
```

`find`按用途文字与标签查找；`describe`提供该效果的最小shot示例、动作名与参数说明，包括实际显示数量和循环规则。把其中的演示对象、数据和结果替换成本期真实内容。所有46个入口都可查询；返回的演示时长不等于语音实测时长。

| 本句需要表达 | 可选表达与效果 | 本期需提供什么 |
|---|---|---|
| 先建立真实印象 | media-stage、feed-montage、magazine-collage | 产品/场景/人物的真实图片或视频 |
| 从候选中找到重点 | reference-search、window-detail、curation-stamp | 候选、选中项、选择结果 |
| 展示实际操作 | prompt-send、code-editor、ui-stage | 本期输入、操作过程、最终状态 |
| 看清差异或规模 | result-compare、comparison-bars、quota-ring | 对比对象、单位、真实数值 |
| 改变组合或视角 | object-array-flip、gallery-camera、curved-screen | 对象关系、聚焦对象、镜头目的 |
| 强调情绪和隐喻 | question-bounce、consumable-ban、sharing-network | 能解释这句话的具体物件和关系 |

这张表不是固定节目顺序。实际操作不必假造代码，普通数值不必包装成金币，产品与人物可以保留真实材料。适用动作直接复用；现有组件表达不了的部分，可用自由图层或新组件继续设计。

## 先独立试跑一次

在Skill根目录运行：

```shell
python scripts/start_episode.py --brief examples/quickstart/brief.json --srt examples/quickstart/captions.srt --out ../my-first-opening --draft
cd ../my-first-opening
npm ci
npm run check
npm run render
```

输出 `out/opening.mp4`。示例以“整理旅行照片”为题，字幕时间是演示数据，无人物、声音或私人素材；`--draft`明确保留此状态。不要删掉draft标记后把它冒充已对齐真实口播。

## 接入最终声音和人物

素材根目录可包含 `final.wav`、`presenter.mp4`、图片和实际粗剪映射。材料散落在不同位置时，Agent将本期所需文件复制到工作目录，保留原文件。命令里所有媒体引用最终会转成相对此根的路径，不依赖作者电脑。

只有配音：

```shell
python scripts/start_episode.py --brief brief.json --srt captions.srt --media-dir media --voice final.wav --source-type narration --out ../my-opening
```

数字人自带声音：

```shell
python scripts/start_episode.py --brief brief.json --srt captions.srt --media-dir media --presenter presenter.mp4 --source-type digital-human --out ../my-opening
```

数字人与单独声音同时存在时加 `--voice final.wav`，人像视频静音而沿用同一声音母带。真人的source和mapping沿用已完成的实际粗剪记录，详见[生产契约](source-style-contract.md)。缺少媒体、主音轨长度不足、路径越界、动作不在关联字幕区间或输出目录非空会报错，不会覆盖旧工程或暗中切换成草案。

生成后运行 `npm ci` 和 `npm run render`；需要全片时 `npm run render:full`。入口负责生成工程，不会自行调用付费服务、安装npm依赖或启动渲染。

## Agent填写的简化分镜

根对象包含 `title`、`shots`，可设置width/height/fps、source/media、duration和sampleDuration。每个shot提供effect/title/content、cueStart、actions，可保留enter/presenter/camera/sounds等实际需要的字段。完整可运行格式看[示例brief](../examples/quickstart/brief.json)。

`cueStart` 是SRT里的数字序号。第一镜从0秒开始；后续镜头围绕对应字幕开始，遮罩转场按显式enter提前。未指定enter就直接剪切。最后一镜默认结束于最后字幕末尾，有合理尾停时可显式指定duration。

动作写成下面的锚点，避免手工换算镜头本地时间：

```json
"actions": {
  "reveal": {"cue": 2, "edge": "start", "offset": 0.1},
  "act": {"cue": 3, "edge": "start", "offset": 0.2},
  "resolve": {"cue": 3, "edge": "end", "offset": -0.3}
}
```

动作名以describe返回为准；旧组合链可能需要不同动作名。offset单位为秒，必须仍落在关联字幕区间附近；动作时间严格递增，结果后至少留0.15秒。这里的数字仅演示语法，真正值来自本期听看。

sampleDuration省略时，从10–15秒内字幕结束点选择最接近12秒的一处；显式指定也必须落在句末。该区间无合适句末时，脚本说明原因；Agent应根据真实说话边界调整，不伪造一个时间。

SRT接受UTF-8/BOM、常见换行、多行文本与逗号或点毫秒。重叠、重复编号、非法时码、空文本和超过42字的字幕需先修复。脚本不会将一句话等分后声称得到了精准词级时间。

## 每期实际交付

交本期可播放MP4、可编辑工程和素材来源，简短说明有无未接入的素材。检查声音、字幕和动作落点、裁切与输出是否正常即可；不用每次附带对照片、评分或审批文档。40段目录是选用工具，不是每期都要重渲染的验收项目。
