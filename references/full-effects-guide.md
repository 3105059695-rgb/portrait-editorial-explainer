# 原片完整剪辑机制库

对应最初140.5秒参考的可辨识外层剪辑段落。按新内容重组，不按目录顺序强制套片。源码在 `assets/source-style-template/src/effects/`，机器索引在 `assets/effects-catalog.json`。

3.3增加 `python scripts/effect_library.py describe EFFECT --json`：只读取当前选中效果的字段、动作名、数量边界和最小shot。已有声音与SRT时，优先使用[一条命令生成工程](direct-use.md)；下方完整JSON入口仍兼容。

## 下载后直接运行

从完整Skill目录执行。输出目录必须为新的或空目录：

```shell
python scripts/new_project.py --input examples/full-effects/catalog.json --media-dir examples/full-effects/media --out ../effect-catalog --draft
cd ../effect-catalog
npm ci
npm run check
npm run render:full
```

打开 `out/full.mp4`；`npm run dev` 可逐段修改。无私人素材/账号依赖，字体随npm安装。演示540×960，正式可改1080×1920。`npm run render`只导出配置中的10–15秒开头。

## 轻模型的填写方法

先读当前话语，再选择动作关系：比较用图表/资料对照，查找用检索，舍弃用筛选/入桶。不要把任何题材都变成生成代码，也不要机械轮播全部效果。

`python scripts/effect_library.py list`列出用途。简化brief每镜填写：

```json
{
  "effect":"reference-search",
  "title":"找到真正需要的资料",
  "duration":4.4,
  "content":{
    "items":[
      {"id":"a","label":"原始笔记","image":"notes.jpg"},
      {"id":"b","label":"现场记录","video":"recording.mp4","trimStart":2},
      {"id":"c","label":"结果图表","image":"chart.png"},
      {"id":"d","label":"产品实拍","image":"product.jpg"},
      {"id":"e","label":"操作截图","image":"screen.png"},
      {"id":"f","label":"补充资料","image":"detail.jpg"}
    ],
    "selectedId":"b","result":"保留现场证据"
  }
}
```

这是**一镜片段**。将多镜放进 `{"title":"本期主题","shots":[...]}`，总长至少10秒，再运行：

```shell
python scripts/effect_library.py compose brief.json --media-dir media-root --out episode.json
python scripts/new_project.py --input episode.json --media-dir media-root --out ../this-episode --draft
```

可运行换题例子：`examples/full-effects/desk-opening.json`。正式配音brief带 `timing:"measured"、source、media、captions`，每镜填 `marks、markCues`，生成时去掉 `--draft`。参见[v3契约](source-style-contract.md)与[口播流程](presenter-workflow.md)。

## 原片全程对应

| 原片位置 | 机制 | 动作 |
|---|---|---|
| 0–7秒 | feed-montage / magazine-collage | 素材快切、冲击推进、海报分层、连线汇聚 |
| 7–20秒 | code-editor / media-stage | 代码侧栏终端联动、曲屏扫描线、真实视频空间窗口 |
| 20–33秒 | idea-burst / document-write / reference-search / code-build / prompt-substitute / kinetic-type | 概念组装、文稿逐字、放大镜选中、进度生成、逐项替换、层叠大字 |
| 33–50秒 | object-array-flip / challenge-split / rejection-grid / token-intake | 弧线入阵列、逐项翻面聚拢、问题分栏、否决、票据入箱计数 |
| 50–65秒 | comparison-bars / premium-coins / cost-columns / quota-ring | 比较数值、金属卡落币、成本柱、额度环与印章 |
| 65–87秒 | gallery-camera / curved-screen / workflow-route / window-detail / unlock-reveal / repository-copy | 透视图库、整页弯曲、步骤接力、列表升详情、解锁、复制链接 |
| 87–114秒 | prompt-send / result-compare / curation-stamp / phone-focus / reward-transfer | 输入发送、结果纸张比较、取舍盖章、手机着色和附件、奖励归属 |
| 114–140.5秒 | creator-filmstrip / upload-beam / remix-cube / microphone-swing / robot-meter / coin-growth / question-bounce / consumable-ban / luxury-dome / sharing-network / celebration-type | 徽章胶片、云上传、三维方块、弧摆、状态仪表、厚金币增长、厚问号、入桶遮挡、玻璃罩、关系交换、字粒人群结尾 |

保留的五条早期组合链为 `poster-route / selection-build / ui-handoff / creator-strip / upload-progress`；另有自由界面 `ui-stage`。因此40段目录展示对应46个可调用入口，计数含义不同。

## 参数实际作用

| 字段 | 用途 |
|---|---|
| start/end | 总时间轴的位置；compose自动计算转场重叠 |
| marks.reveal/act/resolve | 新机制场景内动作阶段结果秒数；严格递增，末尾保留阅读时间 |
| items[].id / selectedId | 对象身份与本镜焦点；保留对象连续性 |
| image / video | 二选一的相对素材路径；真实材料保留本身质感 |
| trimStart / playbackRate / fit | 视频起点秒数、速率、contain/cover；视频使用场景内时钟 |
| replacementImage / replacementLabel | 翻面后的本期内容 |
| item.value / content.values | 图表实际数据；各组优先级见下方说明，避免填写矛盾值 |
| content.pack | 该机制支持的布局选项；并非所有选项对每个机制都有效 |
| scene.camera | `{at,x,y,scale,rotate}`独立相机，坐标为544宽逻辑舞台，纵向随比例增加 |
| presenter | hidden/pip/full，人物和声音来自episode.media |
| enter | cut/circle/window；省略时默认 `{"type":"cut","duration":0}`，不自动套圆窗。按镜头表达显式选择 circle/window 时，可指定百分比锚点；重叠等于入场时长 |
| sounds | `{at,name,volume}`本地秒数音效；whoosh/tick/pop/chime/drop，可省略 |

视频素材应覆盖所需时段。模拟界面保留“示意”。字幕、声音和人物共用最终音轨时钟，资料内部的视频另按scene.start计时。

逐项角色与选项：[空间和网页](spatial-web-pack-usage.md) · [漫画和三维](illustrated-pack-usage.md) · [早期组合链](source-style-effects.md) · [自由UI](ui-composition-contract.md)。

## 边界

复现的是可辨识的剪辑机制，不包含原作者私有字体工程、照片、声音、人物或3D场景。阵列和逐项替换为2.5D，六面方块为CSS3D，玻璃罩为分层矢量高光；不是物理光线追踪。内层拍摄与复杂3D作品接入本期素材，不能把演示替代素材称为原项目恢复。

原创图形让示例独立运行。正式内容需要适合的摄影、录屏、网页、产品抠图；空的占位形状不能替代材料质感。目录只是选用表，不是新片顺序。没有跨模型盲测，不宣称所有模型审美一致。
