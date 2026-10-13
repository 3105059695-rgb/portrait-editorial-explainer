# 常见问题与故障排查

先区分问题发生在安装、Agent 发现、分镜校验、编译、ChatCut、npm／浏览器、媒体接入还是实际剪辑。保存完整错误末尾和正在运行的命令，通常比重复安装全部工具更有帮助。当前入口自动识别v3效果库（SourceStyle）与v2图层（AdaptivePortrait）；先确认输入version和对应render命令。视觉依据是最初完整参考，数字人V3只是历史局部案例。

返回 [README](../README.md) · [安装教程](INSTALL.md) · [完整工作流](WORKFLOW.md)

## 把安装指令发给Codex后，没有开始安装

先确认这次会话能在目标电脑读取文件和执行命令。安装指令是：

```text
请阅读 https://raw.githubusercontent.com/3105059695-rgb/portrait-editorial-explainer/main/INSTALL_AGENT.md ，按说明在这台电脑安装 portrait-editorial-explainer，自动检查补齐依赖并试跑，完成后告诉我如何调用。
```

Agent应读取说明、下载校验发布包并运行headless安装，不应只返回一份让使用者手动执行的命令清单。网页聊天或只读环境不能代替目标电脑执行安装；需要在有本机工具能力的Codex中运行。当前自动路径支持Windows 10及以上x64，其他系统见[手动安装](INSTALL.md#手动安装与其他系统)。

如果GitHub页面或安装说明无法访问，Agent应报告真实网络错误并在连接恢复后重试，不能把“已给出步骤”当作安装完成。

## 备用图形安装窗口打不开或找不到exe

先全部解压v3.4.0完整安装ZIP，在能看到 `SKILL.md` 的目录双击 `OneClick-Install.exe`。GitHub的源码ZIP和clone不包含预编译exe时，双击同目录 `Install-Windows.cmd`，它会使用Windows自带.NET Framework编译器构建并打开安装器。

这一入口面向Windows 10及以上x64。若启动脚本提示.NET编译器不可用，保留具体提示，使用完整release ZIP中的exe，或让Agent按该电脑的实际系统组件排查。macOS／Linux使用[手动安装](INSTALL.md#手动安装与其他系统)。如果系统要求确认文件来源，核对仓库下载来源后正常确认；不要关闭系统防护或把执行策略改成无限制。

## 自动安装下载、校验或渲染失败

让Agent查看最后失败的阶段。默认日志在 `%LOCALAPPDATA%\PortraitEditorialExplainer\logs`；本次结果在同目录上一级的 `setup-result.json`。成功必须为 `status: "ready"`，失败不能仅凭已有MP4文件报告完成。使用备用图形入口时，也可以点 **打开日志**查看。

- 下载失败：确认当前网络能访问日志中的下载站点；恢复连接后重试安装。不要为了绕过下载换成来源不明的exe。
- SHA256不匹配：该包不会执行。让Agent重新获取官方发布包并保留报错；不要修改期望哈希来强行通过。
- npm或浏览器失败：按日志确认网络、空间和权限，修复后重新安装。安装器会复用可用环境，仍以本次示例实际渲染结果为准。
- 示例渲染或解码失败：把错误末尾交给Agent排查；没有准备完成时，不把依赖下载成功当作可用。

默认是联网安装；代理、防火墙、离线机器或组织管理限制不会由安装器自动改动。分享日志前查看其中的本地路径与个人信息。

## 装好了，却提示找不到Python／Node／npm

自动安装不会写全局PATH，系统终端找不到这些命令可以是正常情况。让Agent用已安装Skill根目录的 `Use-Skill.cmd`，或在生成的工程中双击 `Open-Preview.cmd`、`Render-Opening.cmd`、`Render-Full.cmd`。

```powershell
& "<实际Skill目录>\Use-Skill.cmd" doctor.py -- --profile production
& "<实际Skill目录>\Use-Skill.cmd" run_project.py -- --project "<实际工程目录>" --action render
```

双击 `Use-Skill.cmd`本身显示帮助，不会凭空知道本期素材。Agent需要传脚本名和参数。若报runtime配置缺失，检查 `%LOCALAPPDATA%\PortraitEditorialExplainer\runtime.json`或安装时选择的目录；迁移到另一台电脑要先在对方电脑安装，不能复用作者的工具路径。自定义环境可以给运行脚本显式传 `--runtime-file`，或在当前进程设置 `PORTRAIT_RUNTIME_FILE`。

## 双击工程入口后没有立刻打开视频

首次运行该工程可能还需要npm依赖；预览入口会保持一个服务窗口。查看窗口真实进度与错误，不要反复连点多个渲染。导出完成后按窗口显示的输出位置打开视频。v3开头通常是 `out/opening.mp4`，全片是 `out/full.mp4`。

新工程入口通过本机runtime查找工具；从别人处收到工程时，也先在自己的电脑完成自动安装。若工程原本是手动环境生成、没有这些入口，可以让Agent通过本机 `Use-Skill.cmd run_project.py -- --project ... --action render`运行。

## 3.3字幕入口报错

`start_episode.py`默认生成正式工程，需要对应最终声音的SRT，以及声音或有声人物视频。无声试跑使用随包quickstart并显式加 `--draft`；正式输入失败不会自动降级。

- 字幕重复编号、重叠、非法时码或超42字：按报错序号修复原SRT；不要按字数平均分配时间冒充实测。
- 动作不在关联字幕内或顺序不对：核对actions的cue、edge与offset；`describe EFFECT --json`可查该机制全部动作名。
- 10–15秒之间没有字幕句末：核对真实说话边界，合理调整分句或说明这期素材的限制，不能捏造句末。
- 音轨短于分镜：确认用了相同的最终音轨与字幕，或修正分镜duration；不要循环配音补足。
- 人物视频与独立配音不同步：确保它们来自同一最终版本；命令不会自动做口型同步。

详细字段和可运行命令见[直接使用指南](../references/direct-use.md)。

## 下载了文件，为什么 Agent 还找不到 Skill？

下载仓库并不等于安装到当前Agent的扫描目录。自动安装后先让Agent查看 `setup-result.json`里的 `skillRoot`，确认当前Agent使用同一个账号、主机和 `CODEX_HOME`，然后开新会话。手动安装用户在含 `SKILL.md` 的目录运行：

```powershell
python -X utf8 scripts/install_skill.py --dry-run
```

核对打印的目标路径。确认终端与 Agent 在同一机器、同一用户环境中，并检查是否使用不同的 `CODEX_HOME`。安装完成后重新打开会话；必要时重启宿主。

如果自动发现仍不生效，直接告诉 Agent 当前 `SKILL.md` 的完整路径，请它读取文件。若宿主不支持本地文件读取，单纯搬动目录不会补齐该能力。

## “Destination already exists / not empty” 怎么办？

这是覆盖保护。旧手动安装脚本 `install_skill.py`不会覆盖非空Skill目录；v3.4自动安装器可识别本Skill并先备份再更新，但拒绝无关非空目录。`compile_storyboard.py`和 `new_project.py`仍不会覆盖已有工程。编译输出不能与Skill、输入JSON或素材所在目录冲突。

- 首次试用：换一个尚不存在的新工程目录。
- 更新Skill：优先按[更新说明](INSTALL.md#更新已有安装)让Agent执行新版自动安装流程；仍用旧手动脚本时，先备份旧版本并为新版腾出正式目录。
- 复制中断：检查该次创建的目录，确认没有自己的重要文件，再选择新目录重试；不要为了方便删除上级目录。

不要给手动脚本添加不存在的 `--force`，也不要为了通过检查删除整个技能父目录。

## `--skills-dir` 安装出两层同名目录

该参数是技能**父目录**。例如传 `D:\MyAgent\skills`，实际结果是 `D:\MyAgent\skills\portrait-editorial-explainer`。传入已经带技能名称的路径会再追加一次名称。

确认正确的父目录，重新进行 `--dry-run`。旧误装目录先检查并备份，避免在不清楚内容时直接删除。

## Python 命令不可用或中文乱码

自动安装用户先用上面的runtime入口，不需要修全局Python。以下针对手动环境：

Windows 可能提供 `py` 而非 `python`：

```powershell
py -3 --version
py -3 -X utf8 scripts/doctor.py --profile skill
```

macOS／Linux 通常使用 `python3`。所用解释器需要 Python 3.10+。安装或修改 PATH 后，重新打开终端以读取新的环境；不要把系统命令缺失误判为 Skill 代码坏了。

Windows 中文路径或终端输出异常时，优先使用 `-X utf8`，并为含空格或中文的完整路径加引号。路径本身必须真实存在；`<Skill目录>` 只是文档占位，不能原样运行。

## `doctor.py` 通过了，为什么还是不能出片？

`--profile skill` 只检查 Skill 资源与 Python；默认 `production` 另外检查 Node.js、npm、FFmpeg、ffprobe 的命令与版本。它们都没有安装 npm 依赖、启动浏览器、渲染项目或验证 ChatCut 授权。

继续在独立工程中实际渲染并按具体报错处理。自动安装环境用工程双击入口或 `run_project.py`；手动环境执行 `npm ci`、`npm run check` 和渲染。与doctor不同，自动安装完成状态包含示例实际渲染和完整解码；本期素材仍需自身的剪辑检查。

## ChatCut 不可用，还能使用这个 Skill 吗？

能安装、读取流程、运行占位工程、制作分镜，也能以使用者提供的数字人或已粗剪素材继续制作。

真人原始口播的默认粗剪需要当前 Agent 有实际可用且已授权的 ChatCut 连接。让 Agent 检查连接与工具能力，不要把终端里的 `doctor.py` 当作登录检查。Skill 没有附带账号、连接凭证或 ChatCut 安装包。

连接未就绪时，准确标记粗剪尚未完成，先做可独立开展的工作；不得以“生成了删减建议”或“原片已导入”替代粗剪完成。使用者提供已粗剪结果后，可以从最终时间轴继续。

## 数字人为什么跳过粗剪？已经剪好的真人还要再剪吗？

数字人口播默认使用已定稿声音与口型，避免无必要的再切割。跳过语音粗剪不代表免除口型、时长、字幕、黑帧或音轨检查；明确缺陷仍按使用者要求修复。

已经粗剪的真人素材先检查并沿用。不要不看现有工程就再清理一次口癖和停顿。输入类型以使用者说明与工程来源为准，不凭外貌推断。

## `npm ci` 失败

先确认终端在**复制出的工程目录**，那里应有 `package.json` 与 `package-lock.json`。Skill 仓库根目录不是 Remotion 项目目录。

查看错误属于网络、包下载、版本不支持、权限、磁盘空间还是锁文件不一致。建议使用 Node.js 22+，查看当前 `node --version` 与 `npm --version`；具体受测版本见 [v2 验证记录](VALIDATION-V2.md)。

保留锁文件；不要为了消除错误先删除它或盲目升级全部依赖。新复制的未修改工程若仍失败，记录命令、版本和错误末尾。若你主动修改了依赖声明，应在该独立工程中有意识地同步锁文件，再重新检查。

## Windows 提示 `npm.ps1` 不能运行

自动安装的制作入口直接通过Node调用npm CLI，不依赖PowerShell执行 `.ps1`。优先使用工程双击入口。手动环境可采用下面的方法：

某些 PowerShell 环境不允许执行 `.ps1` 启动脚本。可以尝试调用同一 npm 安装提供的 `.cmd` 启动器：

```powershell
npm.cmd ci
npm.cmd run check
npm.cmd run dev
npm.cmd run render
```

无需为了本样例直接修改全局执行策略。若设备有组织管理要求，按现有允许方式运行工具。

## 浏览器下载失败或找不到浏览器

首次渲染可能需要 Remotion 准备兼容浏览器。确认网络与终端错误；若已有兼容浏览器，可在当前终端为模板的 `render.cjs` 指定实际可执行文件。

Windows PowerShell：

```powershell
$env:REMOTION_BROWSER_EXECUTABLE = 'C:\Path\To\CompatibleBrowser\chrome.exe'
npm run render
```

macOS／Linux：

```bash
export REMOTION_BROWSER_EXECUTABLE="/path/to/compatible/browser"
npm run render
```

上面的路径是占位，必须换成这台机器上真实存在的浏览器可执行文件；macOS 的应用目录本身不是可执行文件。不同浏览器版本兼容性需以实际渲染结果确认。

该变量由通用引擎的 `render.cjs` 读取；直接调用 Remotion CLI、旧数学工程和其他程序不会因这段自定义代码自动获得相同逻辑。不要把个人机器路径写进公共源码。变量仅为当前进程环境设置，不会自动带到其他终端或 Agent。

## `npm run dev` 一直不退出，是卡住了吗？

通常不是。它启动本地预览服务，会持续运行。打开终端输出的实际地址预览，另开终端进入同一工程导出，或使用 `Ctrl+C` 停止服务。

若页面打不开，检查进程是否仍在、终端实际地址和报错；不要假设固定端口总能使用。开发预览能打开，也不意味着完整导出一定成功。

## 渲染输出为什么没有声音？

公开草案的 `media.voice` 为 `null`，故意静音。即使给 `media.presenter` 填了视频，人物视频也被静音，以避免和独立母带重复播放。

把匹配最终时间轴的声音放入素材目录，在输入 `episode.json` 中设置例如：

```json
"media": {
  "presenter": "media/presenter-final.mp4",
  "voice": "media/voice-final.wav",
  "music": null
}
```

以正确的 `--media-dir` 重新编译，文件会复制到工程的 `public/media/`。纯旁白视频的 `presenter` 可为 `null`。确认声音文件确实可解码且长度足够。若声音来自真人原片，必须与当前剪后画面同步；不能把未剪整段原声直接加到剪后视频上。生产模式拒绝没有 `voice` 的输入，但单纯存在一个文件不证明它有有效声音。

模板默认也没有背景音乐和音效。历史案例的音效描述不代表公开包附带同样的声音资源。

## 为什么仍显示“待放入口播视频”或媒体找不到？

检查 `src/episode.json` 中 `media.presenter` 是否仍为 `null`。草案允许占位，但人物来源的正式片必须接入实际文件。输入 JSON 的路径相对于 `--media-dir`，编译后相对于工程 `public/`：

```text
真实文件：public/media/presenter-final.mp4
配置路径：media/presenter-final.mp4
```

不要重复写 `public/`，不要放 Windows 绝对路径、URL、签名参数或 `..`。检查拼写、扩展名、大小写以及 `--media-dir`：如果配置写 `media/presenter-final.mp4`，根目录下必须真的有 `media` 子目录。缺少文件时编译器会报具体字段；不要创建空文件骗过检查。符号链接和 Windows junction 不作为媒体接入方式，复制真实文件后再编译。

## 人脸被裁、访谈图只出现一半、换素材后布局不对

通用引擎根据机制与对象布局，但不能保证任意人物的头部、手势和任意长截图都能直接适配。先检查原图比例、实际焦点、镜头中的对象数量与 `presenter` 的 `full/pip/hidden` 选择。必要时把资料整理成保持原意的局部图片，或扩展该工程的媒体布局组件。

按本期内容调整图像填充、裁切范围、相机焦点和文字避让。完整画布、人物层、字幕层、曲屏滤镜分别检查，不要只调一个缩放系数后结束。历史 `presenter-v3` 的访谈图布局按 2992×1060 双人画布设计，那是研究案例参数，不是 v2 通用媒体要求。

## 新口播为什么仍是 10.74 秒或旧求职场景？

这通常说明使用的是历史 `--case presenter-v3` 校准工程，或 Agent 没有读取新版 Skill。当前入口必须显式提供本期分镜：`new_project.py --input PLAN --media-dir MEDIA_ROOT --out NEW`，Composition 是 `AdaptivePortrait`，输出 `out/adaptive-portrait.mp4`。数字人 V3 保留为视觉基准，固定时长案例只供研究，不应套为新主题默认成片。

不传 `--input` 或显式 `--case` 会返回 2，且不创建目录。只研究通用底座时可用 `--case adaptive`；只研究 V3 时用 `--case presenter-v3`。这些校准选项不能与 `--input`、`--media-dir`、`--draft` 混用。

在 v2 中，总时长来自 `duration`，字幕来自 `captions`，场景和动作来自 `scenes[].beats`。`npm run render` 渲染整个传入计划，不会自动截成样段；第一份计划必须写成本期真实 0 秒起的 10–15 秒开头，确认风格后再延展。仅改字幕文本而不修改动作数据，动作当然不会换；让模型按本期“主体、动词、关系、证据”重编分镜，不能只改旧标签。延长声音也不会自动推算这些字段，须测量并更新关联时间。

旧 `timeline.json`／`check_timeline.py` 是额外的对齐记录工具，不能直接当作 v2 `episode.json` 编译。数据格式与迁移说明见 [时间轴规范](../references/timing-format.md)。

## 校验器报 `$.scenes[...].beats[...]` 等字段错误

这是具体错误路径，不要求重写整片代码。先修该字段及其引用，再运行：

```powershell
python -X utf8 scripts/validate_storyboard.py episode.json --mode draft --json
```

| 报错位置／原因 | 修改方向 |
| --- | --- |
| `cueId` 不存在或不在本镜 `cueIds` | 使用真实字幕的稳定 ID，并在场景中引用 |
| `targetId`／`withId` 不在本镜对象中 | 在根 `objects` 定义对象，并加入本镜 `objectIds`；移交、归组、连线需要不同的目标对象 |
| `beats.at` 不在字幕范围 | 从声音确定动作落点，或修正镜头归属；不要移动无关字幕来凑校验 |
| 场景间有空隙、重叠或未覆盖总时长 | 使相邻 `end/start` 相接，首镜从 0 开始、末镜结束于 `duration` |
| `compare-pan` 缺少两对象焦点 | 分别在对应说话时点关注两个对象，或选择更合适的机制 |
| 生产模式缺少声音或 `measured` | 补真实定稿素材及实测时间；尚未具备则明确做草案 |
| production 提示 source／roughcut 不就绪 | 回到实际素材流程完成粗剪或确认数字人豁免，不伪造状态 |

详见 [契约](../references/storyboard-contract.md) 和 [修复配方](../references/repair-recipes.md)。结构通过不证明台词事实正确或语义选择合理。

## 为什么 `--draft` 仍要求我提供某些文件？如何去掉草案标记？

草案允许 `media.voice/presenter` 为 `null`，但已经填写的路径表示要使用真实文件，缺失不能被静默忽略。把真正未提供的媒体设为 `null`，或提供对应文件；对象不引用实际图片时可使用原生绘制形式。

编译器用 `--draft` 写入 `renderMode: "draft"`，所以即使时间声明为 measured 也显示草案标记。正式输出应补齐定稿声音、实测时间、来源和粗剪状态，重新通过生产校验，再不带 `--draft` 编译。不要手工改字段只为隐藏标记；真实输入未就绪就不能宣称是正式片。

## 编译成功了，却提示图片格式不支持？

编译器检查引用、路径、文件存在与字节，不猜测解码结果。当前通用引擎的 `assets` 只接入 SVG、PNG、JPEG、WebP 静态图片；人物视频走 `media.presenter`，音轨走 `media.voice/music`。PDF、网页、GIF 或视频资料先转换为合适的静态图片，或显式扩展渲染组件。不要单纯更改扩展名。

## 内容能换，但还是像套模板或 PPT

先看分镜是否只替换文字和配色，仍沿用同一场景顺序、数量与等长节奏。回到 [导演手册](../references/director-playbook.md)，逐句检查“哪个物体发生了什么变化”。整理应实际归组、交付应实际移动、比较应分别看清两者、资料应使用本期资料。保留跨镜头对象 ID，但不要求每期使用全部机制。

八个基础机制不是八种固定选题，也不是任意专业图或新创意的完整覆盖。轻量模型优先调整 JSON；需要地图、精确科学图或特殊视觉时提供对应图示或扩展组件。自动检查能减小结构错误面，不能替代语义与审美判断。

## 字幕整体或局部不同步

先确认字幕、画面与音轨是否都来自同一个最终剪后版本。

- 全程同量偏移：检查导出起点、音轨前导静音与字幕基准。
- 从某个剪口之后开始错位：核对该片段删除或停顿调整后，时间映射是否更新。
- 句子大致正确但关键词落点不准：从真实音频测量关键词边界，不能只按字数均分。
- 越往后越明显：核对时基、片段速度、音画来源和所有长度换算。

根据原因修正后，再检查所有受影响区间。不要为迎合旧动画随意加速原声、裁掉音节或重生成说话者声音。

## 旧 `check_timeline.py` 报错或不生成 CSV

此工具只处理可选的旧对齐格式，不处理 v2 的 `scenes/beats`。若在用 `episode.json`，改用 `validate_storyboard.py`。对旧 `timeline.json`，检查脚本输出指出的具体字段：

| 常见问题 | 修改方向 |
| --- | --- |
| 重复字幕或事件 ID | 使用唯一、稳定的字符串 ID |
| `cueId` 找不到 | 对应字幕必须已存在；改字不用改 ID |
| 字幕重叠 | 同轨需要错开；独立语义轨道可显式设置 `track` |
| 时间越界 | 检查字幕时间、`offset`、事件持续时间与总时长 |
| 负 offset 不合法 | 只有 `prepare` 可负，并补充非空 `anticipationReason` |
| CSV 已存在 | 选择新的输出文件名；脚本拒绝覆盖已有 CSV |

结构错误返回 `1`，文件读写错误返回 `2`；验证失败不会输出 CSV。通过也只说明结构有效，不证明已听过真实音频。

## 静帧命令报参数不是秒数或超出范围

通用引擎自定义渲染脚本的参数是秒，例如：

```powershell
npm run render -- 0.6 2.8 5.6
```

不是帧号。每个参数需为有限的非负数，且严格小于 `episode.duration`；精确结束点不是可采样时刻。脚本会按该工程 fps 转换为帧，输出 `out/frame-0.60.png` 等文件。先查看 `node render.cjs --help`，不要把另一工程的参数约定带过来。

历史 V3 的自定义脚本也接收秒数，但旧数学工程使用 Remotion CLI，参数形式不同，不应直接照搬。

## 导出慢、内存不足或浏览器超时

先看失败时的阶段和实际错误，确认磁盘空间，关闭不需要的预览或重任务。先渲染少量关键静帧，判断是单个场景、特定媒体还是整体资源压力。

通用引擎的 `render.cjs` 默认并发数为 `3`，可以在当前终端降低，无需修改模板：

```powershell
$env:RENDER_CONCURRENCY = '1'
npm run render
```

macOS／Linux 使用 `RENDER_CONCURRENCY=1 npm run render`。参数必须为正整数；不要在内存不足时盲目调高并发。仍失败时保留工程与日志，再针对具体媒体、滤镜或场景排查。

静帧成功不代表完整视频已成功。任何分段导出与后续合成，都需重新确认总长度、声音、接缝和最终解码结果。

## 如何判断“完成”而不是只有一个文件？

检查视频能完整解码，核对尺寸、帧率、时长和音轨，检查关键画面与修改切口，再按实际情况记录是否完整听看。`npm run check` 只做类型检查；MP4 存在也不等于字幕、语义或风格通过。

交付时说明实际检查范围，不把历史风格认可或占位样例通过检查转移到新成片。平台审核还取决于具体内容和发布环境，这个 Skill 不提供审核保证。

## 可以只下载模板、不安装 Skill 吗？

可以完整下载仓库后，用 `new_project.py --input PLAN --media-dir MEDIA_ROOT --out NEW` 将本期分镜编译到独立目录；仅查看校准底座则显式用 `new_project.py --case adaptive --out NEW`，再执行 `npm ci` 和预览／导出。入口不再无输入复制任何默认案例。Skill 安装主要方便 Agent 发现和调用工作流程；模板运行仍需自己的制作环境。

如果完全不使用 Agent，也可以按照契约自己编写 JSON、准备素材，再校验和编译；只有基础机制不能表达时才需要改 React／Remotion 组件。只下载一个预览 MP4 无法获得可编辑工程。

## 可以发布、商用或把自己的工程开源吗？

先查看仓库许可与 [THIRD_PARTY_NOTICES.md](../THIRD_PARTY_NOTICES.md)，并逐项确认本期媒体、字体、品牌、依赖及所用服务的适用条款。公开源码不自动授予真人肖像、克隆声音或第三方品牌素材的任意使用权。

发布自己的工程前去掉不应公开的账号配置、私人媒体和本地绝对路径。Skill 本身不会替你上传成片或调用收费服务，也不代表这些操作已经获得授权。

## 提交问题时提供什么？

可在[仓库 Issues](https://github.com/3105059695-rgb/portrait-editorial-explainer/issues)描述问题。建议包含：操作系统、Python／Node／npm 版本、仓库版本或提交、执行目录、完整命令、报错末尾、预期结果与实际结果，以及最小可复现的非敏感输入。

不要上传凭证、私人账号配置或没有公开权限的原始人物／客户素材。能用占位媒体复现的问题优先用占位媒体；诊断报告分享前先查看其中的本地路径与环境信息。
