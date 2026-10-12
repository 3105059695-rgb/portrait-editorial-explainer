> 当前入口是 `new_project.py --input PLAN`，经 V2 分镜编译器创建本期 adaptive 工程；数字人 V3 是视觉基准，source-style 仅为辅助 UI 组件。先读[当前方向](../references/approved-editing-direction.md)，不要把任何校准案例当成默认成片。

# 安装与首次运行

本教程分为两件事：**把 Skill 放进 Agent 能发现的位置**，以及**准备 Remotion 工程的运行环境**。只安装 Skill 可以先阅读、调用流程；要导出样例或正式视频，还需要后面的制作工具。

返回 [README](../README.md) · 下一步 [完整工作流](WORKFLOW.md) · 遇到问题 [故障排查](TROUBLESHOOTING.md)

## 准备运行环境

| 工具或条件 | 何时需要 | 说明 |
| --- | --- | --- |
| 能读取 Skill 与本地文件的 Agent | 使用本 Skill | 支持程度取决于宿主；不是所有聊天界面都能访问本地工程 |
| Python 3.10+ | 安装器、诊断、分镜校验和编译 | Python 脚本使用标准库，无需 `pip install` |
| Git | 用 `git clone` 下载 | 使用 ZIP 时可不安装 Git |
| Node.js 与 npm | 安装与运行 Remotion | 建议 Node.js 22+；使用锁定的 `package-lock.json` 配合 `npm ci` |
| FFmpeg 与 ffprobe | 音轨提取、成片探测、完整解码 | 需要命令能在当前终端找到 |
| 兼容浏览器 | Remotion 渲染 | 可由 Remotion 下载，或设置已有浏览器路径；不随本仓库分发 |
| ChatCut 连接与授权 | 真人原始口播的默认粗剪 | 要在 Agent 端单独检查；安装 Skill 不会安装或登录 ChatCut |
| 足够的本地空间 | npm 依赖、素材、输出 | 容量取决于视频长度、素材和缓存，仓库下载大小不代表制作所需空间 |

当前通用引擎的实际验证见 [VALIDATION-V2.md](VALIDATION-V2.md)，历史 V1 发布记录见 [VALIDATION.md](VALIDATION.md)。工具在某台机器通过检查，不等于所有操作系统和所有版本已实际测试；本页提供 Windows 与 macOS／Linux 命令，不将命令说明当作跨平台测试结果。

不要把账号密码、API Key 或私人授权配置写进 Skill 文件。这里的安装与样例运行不要求提交任何此类信息。

## 下载仓库

### 方式 A：Git

选择一个普通工作目录，在终端运行：

```shell
git clone https://github.com/3105059695-rgb/portrait-editorial-explainer.git
cd portrait-editorial-explainer
```

当前目录中应直接出现 `SKILL.md`、`scripts/`、`references/`、`assets/`。后文的相对命令都以这个目录为起点，除非明确写了进入新工程。

### 方式 B：ZIP

下载[当前 main 分支 ZIP](https://github.com/3105059695-rgb/portrait-editorial-explainer/archive/refs/heads/main.zip)，或使用 [v3.1.0-rc.1 完整 Skill 包](https://github.com/3105059695-rgb/portrait-editorial-explainer/releases/tag/v3.1.0-rc.1)。解压后进入包含 `SKILL.md` 的那一级目录。旧版 Release 不包含本次可复用剪辑动效。不要只下载 `SKILL.md`：它引用的脚本、规范、字体依赖声明和模板都在其他目录中。

不要直接在压缩包浏览窗口里运行脚本。若解压结果多套了一层目录，以能看到 `SKILL.md` 和 `scripts` 的那一层作为仓库根目录。

## 安装到 Codex

### Windows PowerShell

在仓库根目录运行：

```powershell
python --version
python -X utf8 scripts/install_skill.py --dry-run
python -X utf8 scripts/install_skill.py
python -X utf8 scripts/doctor.py --profile skill
```

如果 `python` 不可用而 `py` 可用：

```powershell
py -3 --version
py -3 -X utf8 scripts/install_skill.py --dry-run
py -3 -X utf8 scripts/install_skill.py
py -3 -X utf8 scripts/doctor.py --profile skill
```

`--dry-run` 先检查来源与目标并显示计划；不复制文件。确认输出路径符合当前使用者环境后，运行不带 `--dry-run` 的安装命令。

### macOS／Linux

```bash
python3 --version
python3 scripts/install_skill.py --dry-run
python3 scripts/install_skill.py
python3 scripts/doctor.py --profile skill
```

安装器采用当前运行进程的 `CODEX_HOME`。未设置时使用当前用户的 `~/.codex`；然后添加 `skills/portrait-editorial-explainer`。

例如默认位置可以表示为：

```text
~/.codex/skills/portrait-editorial-explainer/
├── SKILL.md
├── agents/
├── scripts/
├── references/
└── assets/
```

以安装器打印的实际路径为准。如果终端和 Agent 使用不同账号、不同主机或不同 `CODEX_HOME`，请先对齐环境；安装在本机不会自动出现在远程 Agent 中。

## 安装到自定义目录或其他 Agent

`--skills-dir` 接收的是**技能父目录**，安装器会自动在其中创建 `portrait-editorial-explainer` 子目录。

Windows 示例：

```powershell
python -X utf8 scripts/install_skill.py --skills-dir "D:\MyAgent\skills" --dry-run
python -X utf8 scripts/install_skill.py --skills-dir "D:\MyAgent\skills"
```

macOS／Linux 示例：

```bash
python3 scripts/install_skill.py --skills-dir "$HOME/my-agent/skills" --dry-run
python3 scripts/install_skill.py --skills-dir "$HOME/my-agent/skills"
```

这两个路径只是示例；必须改为目标 Agent 实际支持的目录。不要把参数设成 `.../skills/portrait-editorial-explainer`，否则会多嵌套一层。

安装器只负责复制文件，不会替其他 Agent 修改配置，也不保证其发现规则、插件接口或系统权限兼容。若该宿主不能自动发现 Skill，可以让它显式读取已安装的 `SKILL.md`，再检查是否有本地文件、命令执行与所需插件能力。

## 验证 Agent 已经读到 Skill

安装后重新打开会话，必要时重启宿主应用。发送：

```text
请使用 $portrait-editorial-explainer。
先读取 SKILL.md、references/approved-editing-direction.md 和 references/director-playbook.md，并告诉我：真人原始素材、数字人素材、已经粗剪素材分别走什么流程，以及如何把本期口播的开头 10–15 秒编成 episode.json。
这一步先不创建视频或调用外部生成服务。
```

正确的流程应包含：真人先 ChatCut 粗剪；数字人默认跳过；已经粗剪的素材先检查并沿用；模型根据本期内容选择物体、机制和动作，生成 `episode.json`，再校验、编译、渲染。动效以最终口播时间轴为准，不能默认复制旧求职案例。

如果自动发现失败，改用明确路径：

```text
请读取 <Skill 安装目录>/SKILL.md 和它引用的 presenter-workflow.md，按里面的流程处理。
```

不要仅以“Agent 知道这个名字”判断安装成功。应确认它读到了当前文件，而不是凭记忆描述了一个同名工作流。

## 检查制作环境

在仓库根目录运行：

```powershell
python -X utf8 scripts/doctor.py
```

默认等价于 `--profile production`；只想验证 Skill 本身时用 `--profile skill`。保存机器可读报告可以运行：

```powershell
python -X utf8 scripts/doctor.py --profile production --json
```

| 检查模式 | 检查范围 |
| --- | --- |
| `skill` | Python 版本、必要文件、样例包与锁文件的根依赖一致性 |
| `production` | 上述内容，加 Node.js／npm／FFmpeg／ffprobe 的命令与版本 |

返回码 `0` 表示所选模式的必要检查通过；`1` 表示有必需项缺失或版本不支持；命令行参数错误通常返回 `2`。诊断脚本不会安装依赖、渲染成片，也不能证明浏览器可启动、字幕已同步或 ChatCut 已授权。

ChatCut 是否可用应由当前 Agent 通过其连接状态与实际工具能力检查。不要把终端诊断成功当作 ChatCut 登录成功。

## 第一次运行：编译一个跨主题草案

仍在仓库根目录运行。先用随包的客户问题整理分镜验证工具链；它是明确标注的静音示意，不需要账号、配音或私人媒体：

```powershell
python -X utf8 scripts/validate_storyboard.py examples/storyboards/customer-questions.json --mode draft --json
python -X utf8 scripts/new_project.py --input examples/storyboards/customer-questions.json --out "../my-first-portrait" --draft
cd "../my-first-portrait"
npm ci
npm run check
npm run dev
```

macOS／Linux 将前两条的 `python -X utf8` 换成 `python3`，其他命令相同。校验无结构错误时仍会提示草案、缺少定稿声音等警告，这是示例的真实边界；不要修改状态来消除这些警告。

新工程目录必须不存在或为空，不能位于 Skill 目录内，也不能是 Skill 或输入资料的祖先目录；推荐使用仓库的同级新目录。入口调用编译器复制通用引擎、分镜和明确引用的本地媒体，生成 `src/episode.json`、方向约束 `STYLE_TARGET.md` 与记录来源哈希的 `BUILD_REPORT.json`，不会安装依赖、调用模型或开始渲染。这样更新 Skill 不会覆盖正在编辑的视频工程。

`npm ci` 会根据工程内锁文件安装依赖；它不会生成新的台词、人物或声音。首次联网安装需要耐心等待，查看终端的真实结果。`npm run check` 是 TypeScript 检查，不是画面或声音验收。

预览服务的实际地址由终端输出给出。选择 `AdaptivePortrait` Composition。画面由这份分镜的对象、动作与镜头顺序生成；字幕与草案标记来自数据。示例没有定稿声音，静音是预期行为。浏览器预览应由使用者实际打开检查，本教程不预先宣称该环境已成功。

若只想查看通用引擎校准案例，显式使用 `python scripts/new_project.py --case adaptive --out "../my-adaptive-study"`；内置 `src/episode.json` 是示意，不是空白工程或本期成片。正式工作使用 `new_project.py --input PLAN`；不传 `--input` 或显式 `--case` 会报错，不会替你选择案例。`--case` 不能与 `--input`、`--media-dir`、`--draft` 混用。

## 用自己的内容创建工程

让 Agent 先读取[当前方向](../references/approved-editing-direction.md)，再读[导演手册](../references/director-playbook.md)与 [v2 分镜契约](../references/storyboard-contract.md)，根据本期最终口播生成 `episode.json`。第一份分镜只写真实开头：从 0 秒起，连续覆盖 10–15 秒，并在完整语义处结束；字幕和素材保持同一起点。主题、对象、场景数量与顺序、配色、时长和动作时点由这份 JSON 决定。先复用已有代码；当前底座表达不了 V3 的关键镜头或转场时，须在本期工程补实现，不能降低视觉目标迁就模板。

把本期输入放在独立工作目录，例如：

```text
episode-work/
├── episode.json
└── media-root/
    └── media/
        ├── presenter-final.mp4
        ├── voice-final.wav
        └── evidence.png
```

JSON 路径相对于媒体根目录，不加 `public/`，例如 `media.voice` 为 `media/voice-final.wav`。静态资料通过 `assets` 和对象的 `assetId` 引用；当前引擎支持 SVG、PNG、JPEG、WebP。一般视频不能作为静态图像素材直接接入，人物视频使用 `media.presenter`。

从 Skill／仓库根目录执行，以下路径按自己的目录调整：

```powershell
python -X utf8 scripts/validate_storyboard.py "../episode-work/episode.json" --mode production --json
python -X utf8 scripts/new_project.py --input "../episode-work/episode.json" --media-dir "../episode-work/media-root" --out "../my-opening-portrait"
cd "../my-opening-portrait"
npm ci
npm run check
npm run render
```

macOS／Linux 使用 `python3`。校验器默认生产模式，编译器未传 `--draft` 也默认生产模式：必须有实测 `timing: "measured"`、定稿声音及符合输入类型的粗剪状态；真人／数字人还必须有对应人物文件。具体文件存在与安全路径在编译阶段检查。只有稿件或未完成素材时，用 `--mode draft` 与编译的 `--draft`，输出会显示草案标记；不能捏造实测时间、粗剪完成状态或来源来通过校验。

`BUILD_REPORT.json` 只记录结构、声明与文件字节检查，不证明实际声音对齐、ChatCut 已剪完、素材权利或画面好看。最终仍按 [工作流](WORKFLOW.md) 检查真实结果。

## 导出视频和静帧

在新工程目录执行：

```powershell
npm run render
```

默认输出 `out/adaptive-portrait.mp4`。渲染脚本使用 `AdaptivePortrait` Composition，由 `src/episode.json` 的 `duration`、`fps`、尺寸与场景数据决定成片，不再固定为 537 帧或 10.74 秒。**`npm run render` 会渲染整个传入计划，不会自动截成 10–15 秒。** 因此先传入本期开头分镜，等使用者实际确认风格后，再扩展完整时间轴。

选择数个秒数导出静帧：

```powershell
npm run render -- 0.6 2.8 5.6 7.6 9.8
```

对应输出 `out/frame-0.60.png` 等文件。参数单位是秒，必须满足 `0 <= 时间 < episode.duration`；短片应相应减少或修改采样时点。不要把帧号作为秒数传入。

首次渲染时，Remotion 可能需要准备兼容浏览器。若你已安装兼容浏览器，`render.cjs` 也支持进程环境变量 `REMOTION_BROWSER_EXECUTABLE`。该变量只供此自定义脚本读取，不要假设所有其他命令都自动使用它。示例见[浏览器问题](TROUBLESHOOTING.md#浏览器下载失败或找不到浏览器)。

修改分镜后重新校验，并编译到新目录保留前一版；若直接编辑已生成的 `src/episode.json`，也须运行校验与实际渲染。总时长变化不会替你重测字幕，必须同步更新最后一镜、字幕与动作落点。

## 历史案例只用于风格研究

`python scripts/new_project.py --case presenter-v3 --out "../v3-style-study"` 显式复制固定 10.74 秒的 V3 历史机制样例；`--case approved-reference` 复制旧 816×1080 数学案例。这两个选项保留以便阅读过去的相机、材质和转场代码，均不是新主题默认入口，脚本与输出名也不同。仅替换它们的媒体路径不会自动变成新一期。具体边界见 [V3 风格基准](../references/approved-presenter-v3.md)。

## 更新已有安装

安装器有意拒绝覆盖非空目录，没有 `--force` 开关。更新时：

1. 保存现有视频工程；这些工程应独立放在 Skill 目录之外。
2. 下载新版仓库到一个新的目录，先运行 `--dry-run` 与 `doctor.py --profile skill`。
3. 检查旧 Skill 是否有自己的改动，备份旧安装目录；如果由 Agent 移动或替换重要目录，先明确确认目标与范围。
4. 将旧版本备份移到技能扫描目录之外，确保正式目标不存在或为空，再运行新版安装器。
5. 重新打开 Agent 会话，确认它读取新版 `SKILL.md`。需要保留的自定义规则可人工合并，不要直接覆盖新版文件。

不要通过在旧目录里直接解压来混合版本，也不要删除整个 `.codex/skills`。备份放在扫描目录内可能形成两个被发现的同名 Skill。

## 卸载

先确认安装器当时打印的确切目录，并备份其中自己的改动。只移走／删除 `portrait-editorial-explainer` 这个 Skill 目录，随后重新打开 Agent 会话。不要影响旁边其他 Skill。

卸载 Skill 不会自动卸载 Python、Node.js、FFmpeg、ChatCut，也不应删除独立的视频工程和素材。本仓库没有自动卸载或清理脚本。

## 第一次使用前的自查

- 能打开安装目录中的 `SKILL.md`，且引用的目录都在。
- `doctor.py` 的所选检查模式没有必需项失败。
- Agent 确实读到了当前 Skill。
- 样例在独立目录完成依赖安装、预览和导出；真实结果按自己的运行记录填写。
- 真人原始素材任务已确认 ChatCut 的当前可用连接；没有连接时不把该步骤记为完成。
- 准备了本期输入，并明确它属于真人原片、数字人、已粗剪、旁白或稿件。
