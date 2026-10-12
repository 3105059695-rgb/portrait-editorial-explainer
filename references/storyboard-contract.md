# 可编译分镜契约 v2

制作已认可的数字人口播剪辑时，优先使用 [editorial 动效契约](editorial-motion-contract.md)：它让同一引擎按本期素材和局部时间编排物件、相机、曲屏、胶片和表面转场。`scene.editorial` 存在时，下文普通图标机制的最低对象/beat数量不适用；根字段、素材、字幕、连续时间轴与生产输入检查仍适用。

模型只需要根据新口播生成 JSON；通用工程负责镜头、材质、构图和动画。以下字段是实现契约，示例内容不固定主题或场景顺序。

## 根对象

- `version`: 必须为2。
- `title`: 1到80字。
- `width`, `height`: 1080,1920（首版通用引擎的9:16画布）。
- `fps`: 25/30/50/60之一；`duration`: 正秒数，取最终声音时长，最长1800秒。
- `timing`: measured / estimated / demo。只有实测时间才使用 measured。
- `renderMode`: 可选构建字段 draft / production，由编译器按调用模式写入。draft必须显示草案标记，不能仅通过改timing关闭。
- `source`: `{type, roughcut, tool?}`。type: raw-presenter / roughcut-presenter / digital-human / narration / demo。roughcut: pending / done / skipped-digital / not-needed。真人素材有粗剪需求时必须done且tool为ChatCut；数字人默认skipped-digital；旁白/demo为not-needed。
- `media`: `{presenter: string|null, voice: string|null, music?: string|null}`。路径相对于 public，只允许本地相对路径，不包含 `..` 或盘符。人物视频静音，只从voice输出主声音。
- `theme`: `{paper, ink, accent, comic}`，每个颜色为#RRGGBB。可省略，采用既定近白/墨黑/铁锈橙/浅紫。
- `assets`: `[{id,path,source?,role}]`。path与media同样规则；role是 illustration / evidence / brand。source记录可追溯来源或用户提供说明，不含凭证。当前资产显示支持静态 SVG/PNG/JPEG/WebP；视频仅使用 media.presenter 通道。动态图或额外视频需扩展组件，不可当作静态图片引用。
- `objects`: `[{id,kind,label,detail?,assetId?}]`。kind是 document / message / folder / device / product / person / coin / chart / image / symbol。label最长16字，detail最长60字；同一物体跨镜头保留同一个id。真实产品、截图和其他外观可使用assetId载入本期本地图片/SVG，不限制为这些抽象物体。
- `captions`: `[{id,start,end,text}]`，秒，按开始时间排列，同轨不重叠，在0到duration内，text最长54字，建议短句；原文改变须同步声音。
- `scenes`: 下述镜头数组，按start排列，覆盖完整0到duration，镜头之间首尾相接，不留空帧。

## 镜头

`{id,start,end,cueIds,intent,mechanism,title,objectIds,beats,transition,presenter,metric?,evidenceAssetId?}`

- 每镜至少0.8秒；`cueIds`关联本镜重叠的真实字幕；`intent`是1到100字的解释意图，仅供模型与审阅者理解；实际画面由 mechanism/objects/beats 等结构字段驱动。写下“手指操作”“精细变形”不会自动产生未实现的动作。
- `mechanism`从 object-focus / compare-pan / route-transfer / group-sort / evidence-zoom / metric-build / question-thread / presenter 中选。自由选择顺序与数量，不要求每期使用全部。
- `title`最多24字；`objectIds`从根objects引用，最多6个；同一物体可连续复用。
- `beats`: `[{at,cueId,action,targetId,withId?}]`，at是全片绝对秒，必须在本镜内且落在对应字幕范围（允许最多0.12秒边界量化误差）。action是 reveal / focus / transfer / group / select / result / count / connect。targetId/withId引用本镜的objectIds。运动预备可以提前，结果在at时落位。
- `transition`: circle / window / match / cut。circle和window在扩大过程中显示下一场真实内容，上一场短暂保留；不使用纯色遮罩后硬切。
- `presenter`: full / pip / hidden。人物始终沿同一主时钟播放，不因切场重启；人物与字幕不进入曲屏畸变。没有presenter素材时显示明确占位，不捏造真人。
- `metric`: 仅metric-build使用，`{value:number,total?:number,unit:string}`，有限非负数；有total时total>0且value<=total。数值从稿件取，不补造统计。
- `evidenceAssetId`: evidence-zoom可选真实图片/SVG资料。没有真实证据时渲染示意UI并明确标示，不能宣称是网站实录。

## 机制的最低结构

- object-focus: 至少1对象，至少1个focus/reveal/result动作；看清一个被介绍对象。
- compare-pan: 至少2对象，至少两个分别指向不同对象的focus/select动作；推近后回拉保留比较关系。
- route-transfer: 至少3对象（移动物、起点、终点），至少1个transfer且withId为终点；同一物体沿弧线移动并给出到达反馈。
- group-sort: 至少3对象，至少1个group且withId为集合容器；条目归入集合，不能只换标题。
- evidence-zoom: 至少1对象，至少1个focus/select/result；可用本期资料图或明确示意界面。
- metric-build: 至少1对象、metric，以及1个count；形成整体/子集或计数结果。
- question-thread: 至少2对象，至少1个connect且withId为另一对象；关系线随讲述连通。
- presenter: 可无对象/无beats，用于人物停顿、开场或结尾；不要把所有镜头都填成presenter。

## 生产与草案

生产模式必须有定稿voice、measured时间和已完成/豁免的粗剪状态；真人/数字人类型必须有presenter。草案允许声音、人物缺失及估算时间，但导出须明确标为草案/示意。所有媒体路径都经编译器验证并复制，缺失素材不静默忽略。每个生产资料asset必须有source说明。

校验应给出准确字段路径、错误原因和修改建议；不会替模型捏造台词、来源、素材或时间。复杂新创意可扩展组件/机制，8个机制是基础动作字典，不是固定视频类型。
