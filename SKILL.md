---
name: portrait-editorial-explainer
description: 将已有口播、数字人或配音剪成参考片同类的多媒介竖屏讲解。内置排版、真实视频、代码/网页状态、空间阵列/曲屏、数据图表和漫画动效，按新话题重组。真人原片先ChatCut粗剪，数字人跳过，先交实际开头10–15秒。
---

# 按原片完整剪辑语言，为新内容重新设计

最高视觉基准是[最初完整参考](references/approved-editing-direction.md)。数字人、职业、净水器等后来案例只是局部应用，不会升级为固定风格。保留排版、真实素材、UI、信息图、空间镜头和漫画之间丰富且连贯的变化；不能把所有内容变成同一种插画或同一软件界面。

当前3.4支持把一段安装指令发给Codex，由Agent自动下载、补齐Windows环境并验证。沿用已确认的3.2完整机制库与3.3字幕入口。新调用者可直接看包内 `docs/full-effects-preview.mp4`，不用私人原片；[直接使用指南](references/direct-use.md)给出首次调用和本期素材入口。

## 先选择本机运行入口

Windows自动安装后，优先使用本Skill根目录的 `Use-Skill.cmd`，不要假定全局 `python`、`node` 或 `npm` 可用。它读取本机runtime配置，通过已安装的工具运行白名单脚本。下文示例 `python scripts/脚本.py 参数` 在这种安装下对应 `Use-Skill.cmd 脚本.py -- 参数`；PowerShell中用 `& "<实际Skill路径>\Use-Skill.cmd" ...`。

例如 `Use-Skill.cmd effect_library.py -- describe reference-search --json`；创建工程用 `Use-Skill.cmd start_episode.py -- --brief ...`。生成后用 `Use-Skill.cmd run_project.py -- --project "<本期工程>" --action render`，或双击工程中的 `Render-Opening.cmd`。预览／全片分别用 `--action preview`／`full`；缺少npm依赖时由该入口准备。详细配置、命令与手动环境的区别见[运行入口](references/direct-use.md#自动安装后的运行入口)。

没有本地runtime桥时，用户可直接发送：“请阅读 https://raw.githubusercontent.com/3105059695-rgb/portrait-editorial-explainer/main/INSTALL_AGENT.md ，按说明在这台电脑安装 portrait-editorial-explainer，自动检查补齐依赖并试跑，完成后告诉我如何调用。” Agent负责实际下载、校验、执行headless安装并核对结果，不要求使用者自己下载解压或敲命令。详见[安装指南](docs/INSTALL.md)；macOS／Linux仍用手动环境。不把全局命令找不到当作安装失败，也不重复要求用户手装已经存在的portable工具。

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
