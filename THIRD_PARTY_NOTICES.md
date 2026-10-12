# 代码、素材与依赖来源

本仓库原创 Skill 文档、Python 工具、React/SVG 动画组件及原创占位图按根目录 [MIT License](LICENSE) 分发。第三方素材、商标和依赖保留各自权利与许可，不因本仓库 MIT 许可而被重新授权。

| 内容 | 来源与范围 |
| --- | --- |
| V2 示例 SVG 与通用对象 | `examples/media/media/` 中的净水器、水杯、水龙头、陶器与画笔，以及通用引擎的几何道具均为本仓库原创示意图，按 MIT 分发，不是产品照片或真实文物证据。 |
| 新版职业主题示意素材 | `examples/media/editorial/` 中的道具、纸片、建筑及访谈占位插画为本仓库自绘示意；人物与访谈均为占位，不是真实采访照片。品牌名称仅用于校准案例的语义。部分 SVG 中文文字已转成字体轮廓，来源与许可见下一项。 |
| SVG 中的 Noto 字体轮廓 | `examples/media/editorial/` 的中文标题和标签使用 Noto Sans SC／Noto Serif SC 字体轮廓，避免依赖使用者系统字体。对应的 SIL Open Font License 文本随资产提供：[Noto Sans SC OFL](examples/media/editorial/noto-sans-sc-OFL.txt)、[Noto Serif SC OFL](examples/media/editorial/noto-serif-sc-OFL.txt)。字体及其轮廓来源不因仓库 MIT 许可而被重新授权。 |
| 新版净水器安装素材 | `examples/media/editorial-water/` 的五金接头、橱柜、滤芯、机身、玻璃杯、流程示意及四格过程画面均为本仓库原创 SVG，按 MIT 分发；不含私人媒体，不是厂商安装说明书、产品照片或产品性能证据。 |
| OpenAI 黑色字标 | 历史示例所用[官方品牌资源](https://openai.com/brand/)与[官方标识下载](https://cdn.openai.com/brand/OpenAI-Logos-2025.zip)。商标归权利人，示例不表示合作或背书；新主题应换成对应来源素材。 |
| 数学目录页 | 旧案例的 `catalog-page.png` 来自 [openai/math 的 overview.pdf](https://github.com/openai/math/blob/main/overview.pdf)，转换为图片以用于历史机制示范。随包保留 [上游 Apache 2.0 文本](assets/approved-remotion-case/public/assets/math-license.txt)，文件摘要见 [asset-manifest.json](assets/approved-remotion-case/asset-manifest.json)。历史字幕与数字不是当前新闻事实来源。 |
| 中文与拉丁字体 | Noto Sans SC、Noto Serif SC、Tinos 通过锁定的 Fontsource npm 包加载，字体许可文件随对应依赖安装；字体未被重新改为 MIT。 |
| Remotion | 依赖版本锁定为4.0.534；Remotion 有自身使用许可与适用条件，请查阅[官方许可说明](https://www.remotion.dev/license)。本仓库的开源许可不替代该依赖许可。 |
| React、TypeScript 与其他 npm 依赖 | 各自许可随依赖包提供；锁文件记录精确版本。`private: true` 防止误发 npm，与本仓库代码采用 MIT 不冲突。 |
| ChatCut | 独立第三方工具/服务；本仓库包含工作流说明，不包含其源码、账号、授权或付费额度。使用者按自己的可用连接与服务条件使用。 |

公开预览从本仓库占位或自绘样例渲染：`docs/editorial-career-preview.mp4` 使用示意人物和访谈，`docs/editorial-water-preview.mp4` 使用原创安装示意；历史 `docs/public-preview.mp4` 同样使用几何占位人物。原委托者的真实数字人样段只向其交付。仓库不包含原用户真人/数字人视频、原风格参考视频、私人声音/克隆模型、访谈人物照片、账号凭证或签名素材下载地址。

工作流说明参考了当前 ChatCut 口播编辑能力；没有复制分发 ChatCut 的私有插件包。工具参数和授权情况由使用者环境实际返回为准。

## 3.2新增资源

examples/full-effects/media的三张摄影来自NASA官方，media-sample.mp4是这些照片的镜头动画，不是原始拍摄视频。来源、署名与独立使用依据见[素材说明](references/full-effects-media.md)。docs/full-effects-preview.mp4使用上述素材及原创动效，不将NASA照片改授MIT。

public/sfx五个WAV由scripts/make_sounds.py以确定性数学波形生成，为本仓库原创，按MIT分发；未提取参考原片音轨。
