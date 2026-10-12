# 自由 UI 编排契约

> 适用范围：这是辅助 UI/机制资料，不能替代 [已确认的数字人口播剪辑方向](approved-editing-direction.md)。RC2 界面演示不再作为目标风格基准；新一期从真实口播与镜头分镜进入制作。

先读 [UI 设计规则](ui-style-system.md)。`ui-stage` 提供可组合的界面元素和状态时间线；它不决定内容、布局、操作顺序。六个早期场景仍可选用，但不是风格定义，也不必每期都用。

## 放进 episode.json

沿用 [v3 总契约](source-style-contract.md) 的声音、字幕、场景和开头审看字段。一个自由界面场景写 `mechanism: "ui-stage"`、`content.items: []`，界面放在 `content.ui`。`marks` 自拟语义事件名，必须有最后的 `resolve`，落点是场景内秒数。正式项目仍要用 `markCues` 把每个落点绑定到实测口播字幕。

```json
{
  "canvasHeight": 967.111,
  "showTitle": false,
  "label": "示意界面",
  "nodes": [
    {"id":"surface","type":"panel","x":30,"y":250,"w":484,"h":340},
    {"id":"action","type":"button","x":332,"y":510,"w":154,"h":42,"text":"保存笔记","fontSize":16,"emphasis":"primary"},
    {"id":"status","type":"badge","x":55,"y":523,"w":98,"h":26,"text":"尚未保存","fontSize":12}
  ],
  "tracks": [
    {"nodeId":"action","frames":[{"at":5.2,"set":{"text":"保存中…","emphasis":"pressed"}},{"at":5.8,"set":{"text":"已保存","emphasis":"primary success"}}]},
    {"nodeId":"status","frames":[{"at":5.8,"set":{"text":"已同步","fill":"#e5eddc"}}]}
  ],
  "camera": [{"at":0,"x":272,"y":483.555,"scale":1},{"at":4.8,"x":320,"y":510,"scale":1.3},{"at":6.4,"x":320,"y":510,"scale":1.3},{"at":7.4,"x":272,"y":483.555,"scale":1}]
}
```

这只是字段示意。真实样段还需要有意义的内容区域、交互触发、前后状态，不能把上面的两行控件当成完整设计。

## 画布和节点

逻辑宽度固定 544。3:4 画布高 720；9:16 高 967.111。布局按该坐标设计，渲染等比缩放。节点绘制顺序就是前后层级，光标一般最后画。节点无隐含父子关系；需要共同移动的对象，分别写轨迹。顶部来源标签和可选场景标题不跟随相机。

必填字段：`id,type,x,y,w,h`。可选：`text,image,fill,color,stroke,radius,fontSize,weight,opacity,rotation,value,points,emphasis`。

| type | 用途和数据 |
|---|---|
| panel | 应用外壳、区域底板；`flat` 取消阴影，`inset` 内嵌，`selected` 选中 |
| text | 标题/内容/元信息；自动换行，按高度限制行数；`heading muted center code` 可组合 |
| button | 操作；`primary ghost pressed success error`；改变文字/状态必须对应实际叙事 |
| input | 搜索/输入；`selected placeholder`；输入过程由文本关键帧明确提供 |
| badge | 标签、计数、状态；不能只有装饰作用 |
| image | 相对媒体路径；默认等比裁切，`contain` 完整显示 |
| progress | `value` 为 0–1；应对应完成步骤或真实进度 |
| line | 从 x,y 到 x+w,y+h；`strong dashed`；value 控制线段显露 |
| chart | `points` 为实际数组，value 控制显露；`minimal line-only`；图表应补说明，勿伪装真实数据 |
| cursor | 作者编排的指针；value 从0到1产生一次点击环；不会自动执行外部操作 |

颜色只接受 `#RRGGBB` / `#RRGGBBAA` / `none`。value/opacity 在0–1。fontSize 为6–160，weight100–900，坐标可在画布外（±4000）用于入场。图片路径必须相对媒体根，禁止外部URL/盘符/`..`；初始图片和所有状态切换图片都会校验、复制和预载。chart必须有1–300个有限数值。

## 状态时间线

- `tracks` 每个 nodeId 一条，引用已有节点；每条1–200个关键帧，at严格递增且不超出当前场景。
- `set` 只写本次改变的属性，不允许修改id/type。数值属性各自独立补间；文字/图片/颜色/emphasis到关键帧才切换。
- `ease` 在目标帧设置：`smooth`（默认）、`out`、`linear`。没有新增关键帧的属性继续保持原值。
- **要先停住再动，写起点保持帧。** 例如3秒前静止、3–3.4秒入场：at3写原坐标，at3.4写目标坐标。只写at3.4会从0秒开始补间。
- `camera` 的x/y是焦点坐标，scale为0.25–4，使用同一局部时钟。先保持、再推近、留时间读、再回到上下文；不要持续无目的漂移。
- `marks` 记录语义落点，不能只写形式上的镜头切换。正式样段必须和已粗剪的人声同一时间轴。

UI是画出来的讲解界面，不是真正可点击的网页。数据应来自本期材料，未接真实应用时保留“示意界面”标注。若新的表达需要视频在界面内播放、复杂3D或尚不支持的控件，按 [扩展约定](source-style-extension.md) 实现，不把它伪称已经支持。

## 可运行例子

- [资料工作台](../examples/source-style/ui-research-opening.json)：搜索、选中、摘录迁移、保存反馈。
- [周末行程](../examples/source-style/ui-itinerary-opening.json)：不同的信息结构与操作路径。

```powershell
python -X utf8 scripts/source_episode.py build examples/source-style/ui-research-opening.json --media-dir examples/source-style/media --out ../my-ui-opening
cd ../my-ui-opening
npm ci
npm run check
npm run render
```

无需修改React即可改变界面布局和节点时间线。参数可运行不等于审美合格；首段仍需按设计规则和参考逐项看图、看动效，再交用户判断。
