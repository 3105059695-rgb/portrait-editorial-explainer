# v3 分镜契约

权威定义：模板 `src/types.ts` 与 `scripts/source_episode.py`。v3 和 v2 不混用。自由UI优先看 [ui-research-opening.json](../examples/source-style/ui-research-opening.json) 和 [UI专用契约](ui-composition-contract.md)。旧场景可看 [travel-opening.json](../examples/source-style/travel-opening.json)。示例的时长、主题、顺序不是默认导演指令。

## 顶层

- `version:3`, `title`；`width/height` 为偶数，支持源比例544×720及1080×1920等1.25–1.8高宽比。`fps` 支持24/25/30/50/60，`duration` 10–1800秒。
- `timing` 仅 `measured` 或 `demo`。`measured` 必须来自最终人声/剪后音轨实测，不是模型估计。
- `source.type` 为 raw-presenter / roughcut-presenter / digital-human / narration / demo；`roughcut` 分别记录真实处理状态。原始真人正式制作必须是 `done`、`tool:"ChatCut"`、`mapping` 指向真实剪切映射文件。已有粗剪用 done；数字人 skipped-digital。
- `media` 可含 voice、presenter、music，未提供的键省略。路径相对 `--media-dir`，如 `audio/final.wav`。无URL、盘符、上级跳转或符号链接。不要把私人配置或原始录音拷进公开Skill。
- `sample:{duration,reason}` 必须为开头0秒起的10–15秒。正式制作终点匹配字幕句末，若10–15秒内无合适边界，先调整自然分句或说明素材冲突，不截断词语凑数。
- `captions:[{id,start,end,text}]` 为全片绝对秒；不重叠，每条最多42字，优先更短。句子级ASR无法精确给出关键词落点时要听音细化，不能称逐词同步。

## scene

每个场景有 id、start、end、mechanism、intent、title、presenter、marks、content、enter，可加 accent/background 色值及 markCues。

`intent` 用完整动作句写清为什么选这个机制。`title` 最多24字；长句留给字幕。`presenter` 选 hidden/pip/full。示意场景没有人像时不要补一个假的口播人物。

`marks` 是**本地秒**，不是全片绝对秒；早期六条链按各自动作名递增；新版39个独立场景使用reveal/act/resolve递增；ui-stage自行命名语义事件，resolve必须是最晚事件，不固定剪辑步骤。动作在该时刻达到其结果，部分动作提前预备。最后 resolve 至少留0.15秒读数。

正式制作 `markCues` 必须覆盖所有mark，值是字幕id。`scene.start + marks[key]` 必须位于对应字幕时段±0.12秒；机器只能检查区间，关键词本身仍需听音核对。案例：场景start=4.18，select=3.3，则选择落点在全片7.48秒。

`ui-stage` 使用 `content.ui` 存储节点、轨迹和相机，`content.items` 可为空数组。其余机制的 `content.items` 是1–12个稳定id的物体，字段 id、label，可加 image、color、replacementImage、replacementLabel。机制可能有更小的排版上限，详见效果文档。`selectedId` 指向真实item。其余可选字段 body、code、prompt、url、result、avatar、metric（value/unit/label，可加events）。有素材时用自己的图，无素材的原生图示只能作示意。

### 转场重叠

第一镜 start=0，enter 为 `{type:"cut",duration:0}`。其他镜头：cut duration0；circle/window duration0.12–0.65，默认建议0.24–0.36。x/y为百分比锚点。

后一镜 `start = 前一镜.end - 后一镜.enter.duration`。例如前镜0–6.5，后一镜6.18–12，圆窗0.32秒。两边在6.18–6.5同时运动；0–12全程覆盖，不增加一次重复停顿。不允许三镜重叠。

## 常见错误

- 把 `marks.select` 填成全片秒 → 减去scene.start。
- 新镜头从前镜end开始但又要求遮罩重叠 → 按上述公式提前start。
- 修改scene时点后仍用旧字幕cue → 回到音轨重新核对，别只改cueid骗过区间检查。
- 计数标签很长 → 保留短对象名，解释写subtitle；票据/微型卡应≤6字。
- 正式生成缺voice/说是已粗剪却无映射 → 完成真实前序操作再编译，不能改成demo后当正式交付。

`build` 只写新或空目录，生成自带校验器的独立Remotion项目；源JSON与所用媒体SHA256记录在BUILD_REPORT中。安装位置、工程位置、媒体根目录由调用者指定，Skill不依赖作者电脑。

## 精确计数与比例示意

`token-intake` 的 metric.events 可指定2–160个可见输入。表达“一条对应一条”时，events应等于整数value；大数字采用少量票据代表多个单位时明确为比例示意，省略events默认为84张。不能把通过JSON校验视为语义已经正确。

## 3.2扩展字段

完整机制索引、素材角色和配置例子见[完整效果库](full-effects-guide.md)。Item新增video、trimStart、playbackRate、fit、value、shape；image与video二选一。Scene新增camera相机关键帧、sounds音效事件。Content新增kicker、values、pack布局选项。具体边界由当前types.ts和source_episode.py校验。

新入口自动识别v2/v3；v3默认导出开头，render:full可直接导出用户要求的全片，无审批JSON门禁。
