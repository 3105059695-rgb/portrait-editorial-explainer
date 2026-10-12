# portrait-editorial-explainer

用已有数字人、真人口播或配音，制作有主题物件、明显景别变化、资料场景和漫画转场的竖屏讲解。**视觉基准是用户已认可的数字人口播 V3；具体内容、物体、顺序和时长按本期口播重新编排。**

本次修正了一个实际方向错误：RC2 把视频剪辑过度简化为应用界面演示。资料工作台和行程例子保留为辅助 UI 能力，不再是默认生成入口或正向风格样板。

[下载当前修订](https://github.com/3105059695-rgb/portrait-editorial-explainer/archive/refs/heads/main.zip) · [Skill入口](SKILL.md) · [已确认剪辑方向](references/approved-editing-direction.md) · [V3动作与源码定位](references/approved-presenter-v3.md) · [制作流程](references/presenter-workflow.md)

旧 release 安装包保留历史实现；使用上方当前修订。当前的入口纠正不等于已完成所有新题材的风格验证。

## 要继承的效果

- 主题物件先特写、再回拉建立关系，镜头随讲述对象换焦点。
- 口播动词变成物体的实际行动，带出能读懂的结果。
- 从具体物体表面或关联位置，展开真实的下一场。
- 资料界面可以整屏曲面聚焦，解释段可以进入完整漫画场景。
- 数字人、人声和字幕保持连续主线，素材和镜头围绕内容组织。

[公开V3机制校准片](docs/public-preview.mp4) 使用占位人物、占位访谈且无声音，只用于看原生镜头和转场。原委托者的实际数字人、声音、参考视频不随包公开。

![V3公开校准画面](docs/preview.jpg)

这里的旧主题不是固定脚本。新视频不必出现公司、公文包、访谈或紫色漫画，也不必使用全部效果；保留设计做法，按新话意重组。

## 安装与调用

需要完整仓库。安装器需要Python3.10+；渲染还需Node/npm、Remotion兼容浏览器、FFmpeg/ffprobe。ChatCut仅在真人原片粗剪分支需要，使用者提供本期工具与账号。

```powershell
git clone https://github.com/3105059695-rgb/portrait-editorial-explainer.git
cd portrait-editorial-explainer
python -X utf8 scripts/install_skill.py --dry-run
python -X utf8 scripts/install_skill.py
python -X utf8 scripts/doctor.py --profile production
```

默认安装到 `$CODEX_HOME/skills` 或 `~/.codex/skills`，其他宿主可用 `--skills-dir`。已有非空同名目录不会被覆盖，升级先备份；无需作者电脑上的盘符、声音或账号。

调用示例：

```text
使用 $portrait-editorial-explainer。
本期素材：<已有数字人/真人口播/最终配音文件>。
按已认可V3的剪辑方向，结合本期内容重新设计物件、素材、景别和转场。
真人原片先ChatCut粗剪；数字人跳过。
先制作实际开头10–15秒，我看过整体风格后再继续全片。
```

## 本期生成入口

Agent先根据真实口播写 [v2分镜](references/storyboard-contract.md)，所有素材使用相对路径。新入口不自动替你虚构一个主题：

```powershell
python -X utf8 scripts/new_project.py --input episode.json --media-dir media-root --out ../this-episode
cd ../this-episode
npm ci
npm run check
npm run render
```

**先把本期分镜范围设为第0秒开始的10–15秒完整话语。** 底座render命令会渲染传入分镜的整个时长；当前没有自动截取开头或用户认可门禁。用户认可后再扩展全片分镜，不能提交全片后声称只做样段。无最终声音时可用 `--draft` 做明确草案，不当成正式交付。

生成工程附 `STYLE_TARGET.md`，记录相同视觉基准、反例和实现边界。缺少输入时命令返回提示，不创建资料工作台，也不自动复制固定10.74秒旧片。缺素材/非法路径沿用编译器校验，不能跳过。

## 只看风格校准

```powershell
python -X utf8 scripts/new_project.py --case presenter-v3 --out ../v3-calibration
cd ../v3-calibration
npm ci
npm run dev
```

`presenter-v3` 仅供研究已认可镜头实现，不能仅替换人像或字幕当作完成新一期。`--case adaptive` 是基础动作草案；`--case source-style` 是辅助UI示例。所有示例都需显式选择，不是默认成片。

## 能力与验证边界

通用底座已有数据驱动的人物、物件、相机、移动、曲面资料和窗口转场，但并未完整参数化获认可V3的所有做法。精确物体表面窗口、成熟胶片红线、人物小窗造型等需要按相关镜头迁移已有源码；现有底座转场预览冻结问题也必须在使用时修正、检查。具体定位见 [剪辑方向](references/approved-editing-direction.md#工程能力边界)。不能因字段名相似就声称已经复用完整效果。

本次只纠正技能入口和默认项目路由，没有生成新成片，也没有把新题风格标成已通过。入口的7项回归检查覆盖：无输入不写目录、本期分镜真实编译、目标说明随工程携带、草案/正式校验、显式校准案例和参数冲突。技术历史记录仍保留，不能当作当前审美认证。

较轻模型可借助成熟实现减少从零写动画的负担，但不能保证所有模型都独立达到同样审美。先交真实开头，由实际视觉反馈校准；样段不合格时修复画面，不以组件数或测试数替代结果。

## 来源与许可

独立编写代码和原创素材采用MIT。第三方依赖、字体与历史图片见 [THIRD_PARTY_NOTICES](THIRD_PARTY_NOTICES.md)。参考原片、私人声音、人物和凭证不公开。Skill不另外授权收费服务、生成声音或发布。
