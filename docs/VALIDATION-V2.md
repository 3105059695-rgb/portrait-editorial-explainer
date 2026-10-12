# V2 实际验证记录

日期：2026-10-12。对应 V2 语义分镜与通用渲染引擎。V1 历史固定案例的记录另存于 [VALIDATION.md](VALIDATION.md)。

## 本次改变与测试范围

默认入口从复制固定案例改为新口播生成 `episode.json`，校验、复制本期素材并编译独立工程。没有要求固定题材、场景数量、机制顺序或 10.74 秒时长。

运行环境：Windows、Python 3.11.15、Node.js 24.18.0、npm 11.16.0、FFmpeg/ffprobe 8.1.1、Remotion 4.0.534。测试使用本机已有兼容 Chrome Headless Shell。macOS/Linux 教程按命令接口编写，未在本次实际运行。

独立新目录执行一次 `npm ci`，安装359个包。随后多个隔离生成工程共享同一锁文件对应的本地 node_modules，以避免重复下载；没有将 node_modules 或本机路径发布。每份工程分别运行 TypeScript 检查与完整视频渲染。

## 四个跨主题完整渲染

全分辨率输出均为1080×1920、30fps、H.264；均完整解码成功。仓库附540×960轻量 MP4 预览，仍保留完整时长。下列四个例子都是静音草案，没有宣称完成真实口播同步。

| 输入 | 场景数 | 时长 / 帧数 | 实际抽查秒数 |
| --- | --- | --- | --- |
| [净水器](../examples/storyboards/water-filter.json) / [视频](adaptive/water-filter.mp4) | 5 | 20.8s / 624 | 3.3、10.5、14.1、18.8 |
| [客户问题](../examples/storyboards/customer-questions.json) / [视频](adaptive/customer-questions.mp4) | 4 | 18.6s / 558 | 4.1、6.85、10.0、15.6 |
| [文物记录](../examples/storyboards/artifact-recording.json) / [视频](adaptive/artifact-recording.mp4) | 6 | 22.4s / 672 | 1.1、5.8、12.15、17.5 |
| [旅行照片](../examples/model-evaluation/travel-photo.json) / [视频](adaptive/travel-photo.mp4) | 6 | 19.2s / 576 | 4.65、8.1、14.1、18.7 |

另抽查净水器成片的7.0/7.2/7.4秒和11.0/11.2/11.4秒，确认窗口与圆形转场揭示下一镜的实际内容。对多个对象进入同一终点、双容器归组、曲屏文字、计数与字幕层做了关键帧检查；修复了归组标签重叠、转交对象重叠、数字镜头靠近字幕、曲屏位移图宽高比引起的接缝。

![跨主题实际画面](adaptive/overview.jpg)

逐片关键帧：[净水器](adaptive/water-filter.jpg)、[客户问题](adaptive/customer-questions.jpg)、[文物记录](adaptive/artifact-recording.jpg)、[旅行照片](adaptive/travel-photo.jpg)。媒体参数与预览 SHA-256 见 [render-evidence.json](adaptive/render-evidence.json)。这些是抽帧检查，不是逐帧艺术指导或完整人工播放验收。

## 轻量模型实际试用

使用 `gpt-6-luna`、推理等级 `low`，在独立上下文中给它 Skill 入口和六句旅行照片口播及演示时点，禁止查看已有成品分镜或修改渲染器/校验器。

它独立生成19.2秒、6镜头的 [travel-photo.json](../examples/model-evaluation/travel-photo.json)。首次 draft 校验0错误、3条预期草案警告，结构修复次数0。主任务随后使用同一通用源码编译、类型检查、全片渲染和解码成功，没有为这个主题重写 TSX。

测试只证明这个模型在这一小段已给出时间的输入上可以使用流程。没有测量本地小参数模型成功率，也没有证明任意题材自动达到参考片的审美。模型的 `intent` 含有未结构化的“停住手指”描述，引擎不会凭这句文字生成手指；这是明确保留的能力边界。完整输入和复现命令见[试用说明](../examples/model-evaluation/README.md)。

## 校验器、编译器与安装器

实际运行：

```shell
python -X utf8 -m unittest discover -s tests -v
python -X utf8 scripts/doctor.py --profile skill
```

45项测试中41项通过、4项因Windows没有创建真实symlink的权限跳过；Windows reparse 属性检测测试通过。覆盖非空目标保护、路径逃逸、文件/时间/引用错误、原始数据与素材哈希、草案标识、来源状态、动态场景数量、安装目录选择及依赖锁一致性。doctor 的技能资源与运行工具检查通过。

默认编译使用生产约束；没有真实声音、仍为估算时间或来源状态不合要求会报错。草案模式不允许 JSON 已引用的文件凭空缺失。生产状态是否真实、真实音画时点是否正确仍需对照媒体，不能由勾选字段证明。

## 合成音画通道测试

另渲染3秒、90帧技术样段：人物通道放带440Hz测试音的合成色彩时钟视频，独立声音通道放660Hz测试音；1.5秒时由全屏切换为小窗。

实际输出主峰660Hz，660Hz相对440Hz高107.41dB。2.5秒小窗与同一时刻源图的ROI平均像素误差4.481，若错误重启到1.0秒则为28.814，支持人物画面连续沿全片时间播放。完整解码成功，数据见 [audio-routing-evidence.json](adaptive/audio-routing-evidence.json)。

这是合成管线检查，不是数字人生成、真人粗剪或中文口播同步验收；未调用付费服务。

## 尚未证明的事项

- 本次没有执行新的 ChatCut 真人粗剪；真实工具连接与素材交接仍需使用者环境验证。
- 没有为公开样例加入原用户的真人/数字人视频、声音、真实照片或私人材料。
- 没有进行本期真实人声、BGM与全部字幕的完整主观播放复核。
- 八机制不自动覆盖精细三维、地图轨迹、网页像素操作或任意自由意图；需要素材或扩展组件。
- 技术可运行、语义合理、审美满意是不同结论，本记录没有将用户对历史案例的认可转写成对V2所有题材的认可。

公共发行包下载、安装和远端版本核验结果会在对应 [Release](https://github.com/3105059695-rgb/portrait-editorial-explainer/releases) 的发行说明中记录；这份文件本身描述上述本地实际测试。
