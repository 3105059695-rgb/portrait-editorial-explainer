# portrait-editorial-explainer

把已有数字人、真人口播或配音剪成与最初完整参考同类的竖屏讲解：排版、真实素材、软件UI、信息图、空间镜头和漫画按内容变化。使用 Remotion；物件、数量、时长、镜头和顺序都能重组。

**当前版本3.2：原片机制库。** 新增39个独立场景实现，连同已有票据计数组成40段全程机制演示；保留5条组合链与自由UI，共46个调用入口。素材阵列、透视图库、整页曲屏、多窗操作、手机、审核奖励和后段漫画都有具体组件代码。

[下载3.2.0完整包](https://github.com/3105059695-rgb/portrait-editorial-explainer/releases/download/v3.2.0/portrait-editorial-explainer-v3.2.0.zip) · [Skill入口](SKILL.md) · [完整效果与参数](references/full-effects-guide.md) · [安装教程](docs/INSTALL.md) · [本轮实际验证](docs/FULL-EFFECTS-3.2.md)

## 先看画面

[播放40段机制总览](docs/full-effects-preview.mp4) · [画面索引](docs/full-effects-contact.jpg)

总览用于查看实现，包含公开来源摄影、照片动画、原创图形与原创动作音效。它没有私人配音或数字人。演示顺序按原片段落整理，**新视频不需要按这个顺序**。

参考原片仍是风格基准。早期数字人V3、职业、净水器样段只代表局部用法，不能把整个Skill重新定义成它们的一种画法。

## 下载、安装、直接调用

需要Python3.10+、Node.js/npm；渲染使用Remotion浏览器；音视频处理需要FFmpeg/ffprobe。ChatCut只在真人原片粗剪分支需要。源码和锁文件随包提供，不需要作者的账号、文件路径或私人素材。

```shell
git clone https://github.com/3105059695-rgb/portrait-editorial-explainer.git
cd portrait-editorial-explainer
python scripts/install_skill.py
```

默认安装到 `$CODEX_HOME/skills` 或 `~/.codex/skills`，其他宿主用 `--skills-dir`。已有同名非空目录不会覆盖，升级前保留旧目录备份。

调用：

```text
使用 $portrait-editorial-explainer。
这是本期已有数字人/口播/最终配音：<素材路径>。
沿用完整参考的剪辑语言，按这期内容重新选素材、物件、镜头和转场。
真人原片先ChatCut粗剪，数字人跳过。先给我实际开头10–15秒。
```

## 不准备素材也能跑完整示例

```shell
python scripts/new_project.py --input examples/full-effects/catalog.json --media-dir examples/full-effects/media --out ../effect-catalog --draft
cd ../effect-catalog
npm ci
npm run check
npm run dev
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

日常直接剪辑并做必要成片检查，不强制对比报告、独立审查或审批JSON。既有口播保留声音主线，先交本期10–15秒；需要全片时直接 `npm run render:full`。

## 来源与许可

独立代码、原创图形和程序生成音效采用MIT。NASA摄影及其照片动画有独立署名与使用依据，见[素材来源](references/full-effects-media.md)，不重新声明为MIT原创。[第三方说明](THIRD_PARTY_NOTICES.md)列出依赖、字体和历史素材。私人原片、声音、人物、凭证和签名地址不公开。
