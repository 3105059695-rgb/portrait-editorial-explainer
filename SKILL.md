---
name: portrait-editorial-explainer
description: 将已有口播、数字人或配音剪成参考片同类的多媒介竖屏讲解。内置排版、真实视频、代码/网页状态、空间阵列/曲屏、数据图表和漫画动效，按新话题重组。真人原片先ChatCut粗剪，数字人跳过，先交实际开头10–15秒。
---

# 按原片完整剪辑语言，为新内容重新设计

最高视觉基准是[最初完整参考](references/approved-editing-direction.md)。数字人、职业、净水器等后来案例只是局部应用，不会升级为固定风格。保留排版、真实素材、UI、信息图、空间镜头和漫画之间丰富且连贯的变化；不能把所有内容变成同一种插画或同一软件界面。

当前沿用已确认的3.2完整机制库。新调用者可直接看包内 `docs/full-effects-preview.mp4`，不用私人原片。3.3增加选效果与接入字幕的工具，保留原有动效；[直接使用指南](references/direct-use.md)给出首次调用和本期素材入口。

## 直接执行

1. 采用使用者已有最终声音。真人原始口播先用ChatCut粗剪并保留源时间映射；已粗剪直接沿用；数字人跳过。见[口播流程](references/presenter-workflow.md)。没有最终声音时只交明确草案。
2. 先决定“哪个对象发生什么变化”，再从[完整效果库](references/full-effects-guide.md)选实现；用 `python scripts/effect_library.py describe EFFECT --json` 读取该效果的最小输入、动作名和参数。顺序、时长、数量、物件与构图由本期内容决定，不沿用目录演示的顺序。
3. 成熟动作复用，表达不了时设计新动作。组件负责曲面、翻面、遮挡、厚度、弹性及UI状态。自由界面用 `ui-stage`；任意图层、精确物体开窗和连续下一镜头用兼容的[v2图层契约](references/editorial-motion-contract.md)。缺动作不能偷偷换成静态卡片。
4. 字幕、动作、人物与资料共用最终声音时钟。已有SRT时优先用 `start_episode.py`：brief用字幕序号指定镜头起点和动作锚点，脚本转换为本地marks及markCues。SRT只有句级时刻，词级重音仍按声音核对。图片/视频填 `items`；独立镜头填 `camera`。模拟产品界面保留“示意”。
5. 先导出第0秒开始10–15秒，在完整话语处结束。做必要成片检查后直接交付；日常不额外生成对比片、评分、逐帧审查或审批文件。用户要求继续或已明确要求全片时，直接导出全片。

## 使用入口

用户只需提供本期材料和意图。Agent负责查效果、填写brief和运行命令；不要要求普通使用者手写JSON，或在输入已够用时重复询问已定风格。

有最终配音和对应SRT时，从Skill根目录执行（参数换成当前使用者的文件）：

```shell
python scripts/start_episode.py --brief brief.json --srt captions.srt --media-dir media --voice final.wav --source-type narration --out ../this-episode
```

数字人换为 `--presenter presenter.mp4 --source-type digital-human`；有单独配音可同时传 `--voice`。真人粗剪沿用真实状态与映射，不能靠命令标记跳过。随后进入新工程 `npm ci`、`npm run render`。输入结构、无素材试跑与动作锚点见[直接使用指南](references/direct-use.md)。

已具备完整v3分镜或需要v2自由图层时，保留以下入口：

所有素材路径相对于本期素材目录，没有作者电脑盘符。从Skill根目录执行：

```shell
python scripts/effect_library.py list
python scripts/new_project.py --input episode.json --media-dir media-root --out ../this-episode
cd ../this-episode
npm ci
npm run check
npm run dev
npm run render
```

v3默认导出 `out/opening.mp4`；`npm run render:full` 导出 `out/full.mp4`。无最终声音的机制草案生成时加 `--draft`。v2兼容，但其render渲染整个传入分镜，因此v2只传入要交付的开头。

较轻模型可先写简化brief：每镜填effect、title、duration、content，由脚本补时间轴。正式配音仍需实测字幕和落点，不自动猜声音。

```shell
python scripts/effect_library.py compose brief.json --media-dir media-root --out episode.json
```

下载后能直接跑[40段机制演示](examples/full-effects/catalog.json)。完整命令、素材角色与换题例子见[效果库](references/full-effects-guide.md)。默认原创图形仅让示例独立运行；真实作品、产品、人物、录屏必须用本期对应材料。

## 设计边界

- 真实素材、屏幕、衬线排版、图表和鲜明漫画按话意选择，不强制每10秒凑齐所有类别。
- 转场说明对象或视角关系，也可以直接剪切；不要统一三秒一页或每镜套圆窗。
- 浅底、深色屏幕、材料本色和漫画彩色可以交替，不能给整片套同一种纸感。
- 新主题重新安排对象、视点、数量、路径和停顿，不能仅换字换色。
- 人物全屏、画中画或暂时让位由本期决定；字幕保持独立屏幕层，不跟着资料畸变。

提供40段原片可辨识外层剪辑机制演示、46个可调用入口（含早期组合链与自由UI）、原创音效、相对素材路径、安装器与锁定依赖。阵列翻面为2.5D，六面方块为CSS3D；内层实拍/复杂3D作品用使用者素材接入，不宣称恢复原作者工程。没有跨模型一致性实测，不承诺所有模型审美相同；轻模型复用已写好的动作代码。

不公开私人原片、声音、人物、签名地址或凭证。交付视频、可编辑工程和素材来源；用户说不像时修具体画面，不以补说明文档或组件数量代替风格结果。
