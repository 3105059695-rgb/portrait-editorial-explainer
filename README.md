# portrait-editorial-explainer

把已有数字人、真人口播或配音剪成与最初完整参考同类的竖屏讲解：排版、真实素材、软件UI、信息图、空间镜头和漫画按内容变化。使用 Remotion；物件、数量、时长、镜头和顺序都能重组。

**当前版本3.4：一段指令自动安装。** 把下方指令发给这台电脑上的Codex，由Agent下载安装、检查环境、补齐依赖并渲染一个12秒示例。沿用已确认的3.2完整机制库与3.3字幕入口：40段效果演示、46个调用入口。镜头与动作仍按本期内容重新设计，保持原有丰富视觉表达。

[自动安装说明](INSTALL_AGENT.md) · [Skill入口](SKILL.md) · [直接使用](references/direct-use.md) · [完整效果与参数](references/full-effects-guide.md) · [安装教程](docs/INSTALL.md)

本版实际检查见 [自动安装验证记录](docs/AUTO-INSTALL-3.4.md)。

## 先看画面

[播放40段机制总览](docs/full-effects-preview.mp4) · [画面索引](docs/full-effects-contact.jpg)

总览用于查看实现，包含公开来源摄影、照片动画、原创图形与原创动作音效。它没有私人配音或数字人。演示顺序按原片段落整理，**新视频不需要按这个顺序**。

参考原片仍是风格基准。早期数字人V3、职业、净水器样段只代表局部用法，不能把整个Skill重新定义成它们的一种画法。

## 把这一段发给Codex即可安装

当前自动安装支持Windows 10及以上的x64电脑。把下面整段发给能在这台电脑读取文件、执行命令的Codex：

```text
请阅读 https://raw.githubusercontent.com/3105059695-rgb/portrait-editorial-explainer/main/INSTALL_AGENT.md ，按说明在这台电脑安装 portrait-editorial-explainer，自动检查补齐依赖并试跑，完成后告诉我如何调用。
```

不需要使用者下载解压、先装Python或手敲终端命令。Agent读取仓库安装说明后，负责下载校验完整包、运行无窗口交互的安装入口并检查结果。缺少的Python、Node.js/npm、FFmpeg/ffprobe会下载到当前用户的独立目录，并校验锁定的SHA256；已有本Skill升级前会备份被替换文件，保留额外文件。不改全局PATH、不申请管理员权限。

安装流程还会准备Remotion工程依赖与渲染浏览器，并实际渲染和完整解码示例。Agent确认这些步骤成功后，再告诉使用者安装位置、示例位置和调用方法。它不会安装或登录Codex、ChatCut，也不附带私人数字人或声音。真人原始口播需要另有ChatCut连接；数字人和已粗剪素材可以直接进入后续制作。

默认Skill位置是 `$CODEX_HOME/skills` 或 `~/.codex/skills`；运行环境在 `%LOCALAPPDATA%\PortraitEditorialExplainer`。macOS／Linux仍走[手动安装](docs/INSTALL.md#手动安装与其他系统)。[图形安装器](docs/INSTALL.md#备用图形安装器)保留为可选备用入口。

调用：

```text
使用 $portrait-editorial-explainer。
这是本期已有数字人/口播/最终配音：<素材路径>。
沿用完整参考的剪辑语言，按这期内容重新选素材、物件、镜头和转场。
真人原片先ChatCut粗剪，数字人跳过。先给我实际开头10–15秒。
```

用户给材料和意图即可，Agent负责选效果、填brief与运行命令，不需要使用者手写JSON。包内预览与规范可直接读取，不依赖私人原片或历史会话。

装好后继续让Agent按本期素材制作即可。Agent会使用准备好的本地运行环境，不要求系统终端能找到全局Python或Node。新建工程也附有 `Open-Preview.cmd`、`Render-Opening.cmd`、`Render-Full.cmd`，供需要自行双击预览或导出的人使用。

## 给Agent与手动使用者的入口

Windows自动安装后，Agent使用Skill根目录的 `Use-Skill.cmd`。例如查询效果：

```bat
Use-Skill.cmd effect_library.py -- describe reference-search --json
```

以下 `python` / `npm` 示例供已自行准备工具的环境使用；自动安装对应命令见[直接使用指南](references/direct-use.md#自动安装后的运行入口)。

首次试跑，不用准备媒体：

```shell
python scripts/start_episode.py --brief examples/quickstart/brief.json --srt examples/quickstart/captions.srt --out ../my-first-opening --draft
cd ../my-first-opening
npm ci
npm run render
```

这是“整理旅行照片”的无声演示。正式素材先让Agent查看所选效果，例如 `python scripts/effect_library.py describe reference-search --json`，按本期字幕填写简化分镜，再从Skill根目录运行：

```shell
python scripts/start_episode.py --brief brief.json --srt captions.srt --media-dir media --voice final.wav --source-type narration --out ../this-episode
```

数字人自带声音时，使用 `--presenter presenter.mp4 --source-type digital-human`。动作直接引用SRT字幕序号和时点，脚本计算镜头本地时间。入口只生成工程；进入工程后 `npm ci`、`npm run render`。参数、示例和真人粗剪衔接见[直接使用指南](references/direct-use.md)。

## 不准备素材也能跑完整示例

```shell
python scripts/new_project.py --input examples/full-effects/catalog.json --media-dir examples/full-effects/media --out ../effect-catalog --draft
cd ../effect-catalog
npm ci
npm run check
npm run render:full
```

输出 `out/full.mp4`。`npm run render`只导出开头，`npm run still -- 1.2 5`导出指定秒数静帧。正式输出可把JSON尺寸改成1080×1920再生成。

另有不同顺序、物件和数据的[桌面整理示例](examples/full-effects/desk-opening.json)：

```shell
python scripts/new_project.py --input examples/full-effects/desk-opening.json --out ../desk-opening --draft
```

进入新工程后同样 `npm ci` 和 `npm run render`。这个示例用原生图形，不包含真实桌面素材。它用于展示重组能力，不作为其他题材的固定模板。

## 新一期怎么做

较轻模型只需读Skill入口、效果用途表和相应参数，选择机制并填写素材与语义时间点；运动代码不用重写。先按真实口播写 `brief.json` 或完整 `episode.json`：

已有SRT优先用上方字幕入口。下面保留完整v3/v2编排兼容方式：

```shell
python scripts/effect_library.py list
python scripts/effect_library.py compose brief.json --media-dir media-root --out episode.json
python scripts/new_project.py --input episode.json --media-dir media-root --out ../this-episode
```

真实音轨必须用实测字幕和动作落点。未有声音的草案加 `--draft`，不能冒充正式成片。新效果库采用v3契约；旧v2自由图层分镜仍兼容，但v2的render输出整个传入分镜，使用时只传要交付的开头。

## 效果范围

| 表达方式 | 具体实现 |
|---|---|
| 排版与材料 | 快切推进、照片/视频窗口、杂志海报连线、文稿逐行、大字叠层、结果纸张 |
| 软件与网页 | 曲屏代码编辑器、检索放大镜、代码进度、输入替换、列表到详情、解锁、复制、发送、筛选盖章 |
| 空间和图表 | 阵列飞入翻面聚拢、透视图库穿行、整页曲面、手机着色和附件、对比柱、成本柱、额度环、票据入箱计数 |
| 漫画场景 | 徽章胶片、上传云、六面立方体、摆动麦克风、机器人仪表、厚金币图表、厚问号、入桶遮挡、玻璃罩、关系交换、人群与字粒结尾 |
| 自由组合 | 独立镜头关键帧、真实媒体、自由UI、原创音效；v2另提供任意图层和跟随物件的精确开窗 |

每个机制支持的具体参数见[完整指南](references/full-effects-guide.md)、[空间/网页角色](references/spatial-web-pack-usage.md)、[漫画角色](references/illustrated-pack-usage.md)。先选表达方式，再选组件；不要为了使用某个特效篡改本期内容。

## 如实说明边界

复现的是可辨识的外层剪辑机制。原作者内层实拍、复杂3D作品、私有声音和素材不会随包公开；本期通过图片/视频接口接入。阵列/逐项翻面为2.5D，方块为CSS3D，玻璃罩为矢量分层高光，不是原始3D工程恢复。

技术验证、正常渲染与用户审美认可不同。当前没有跨模型盲测，不能承诺所有模型独立达到相同效果；通过直接复用代码，减少模型临场写动效的负担。公开默认图形是演示材料，正式片仍需合适的摄影、产品、页面和人像。

3.2效果库已完成全目录渲染与独立安装，见[记录](docs/FULL-EFFECTS-3.2.md)。3.3的具体新增和实际验证见[本次交付](docs/DIRECT-USE-3.3.md)。

日常直接剪辑并做必要成片检查，不强制对比报告、独立审查或审批JSON。既有口播保留声音主线，先交本期10–15秒；需要全片时直接 `npm run render:full`。

## 来源与许可

独立代码、原创图形和程序生成音效采用MIT。NASA摄影及其照片动画有独立署名与使用依据，见[素材来源](references/full-effects-media.md)，不重新声明为MIT原创。[第三方说明](THIRD_PARTY_NOTICES.md)列出依赖、字体和历史素材。私人原片、声音、人物、凭证和签名地址不公开。
