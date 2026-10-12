# 安装与首次运行

本教程分为两件事：**把 Skill 放进 Agent 能发现的位置**，以及**准备 Remotion 工程的运行环境**。只安装 Skill 可以先阅读、调用流程；要导出样例或正式视频，还需要后面的制作工具。

返回 [README](../README.md) · 下一步 [完整工作流](WORKFLOW.md) · 遇到问题 [故障排查](TROUBLESHOOTING.md)

## 准备运行环境

| 工具或条件 | 何时需要 | 说明 |
| --- | --- | --- |
| 能读取 Skill 与本地文件的 Agent | 使用本 Skill | 支持程度取决于宿主；不是所有聊天界面都能访问本地工程 |
| Python 3.10+ | 安装器、诊断、复制、时间轴检查 | Python 脚本使用标准库，无需 `pip install` |
| Git | 用 `git clone` 下载 | 使用 ZIP 时可不安装 Git |
| Node.js 与 npm | 安装与运行 Remotion | 建议 Node.js 22+；使用锁定的 `package-lock.json` 配合 `npm ci` |
| FFmpeg 与 ffprobe | 音轨提取、成片探测、完整解码 | 需要命令能在当前终端找到 |
| 兼容浏览器 | Remotion 渲染 | 可由 Remotion 下载，或设置已有浏览器路径；不随本仓库分发 |
| ChatCut 连接与授权 | 真人原始口播的默认粗剪 | 要在 Agent 端单独检查；安装 Skill 不会安装或登录 ChatCut |
| 足够的本地空间 | npm 依赖、素材、输出 | 容量取决于视频长度、素材和缓存，仓库下载大小不代表制作所需空间 |

公开验证环境的具体版本与结果见 [VALIDATION.md](VALIDATION.md)。工具在某台机器通过检查，不等于所有操作系统和所有版本已实际测试。

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

从[最新 Release](https://github.com/3105059695-rgb/portrait-editorial-explainer/releases/latest)获取公开安装包，或从[GitHub 仓库页面](https://github.com/3105059695-rgb/portrait-editorial-explainer)下载完整 ZIP，解压后进入包含 `SKILL.md` 的那一级目录。不要只下载 `SKILL.md`：它引用的脚本、规范、字体依赖声明和模板都在其他目录中。

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
先读取 SKILL.md，并告诉我：真人原始素材、数字人素材、已经粗剪素材分别走什么流程。
这一步先不创建视频或调用外部生成服务。
```

正确的流程应包含：真人先 ChatCut 粗剪；数字人默认跳过；已经粗剪的素材先检查并沿用；动效以最终口播时间轴为准。

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

## 创建独立的 V3 工程

仍在仓库根目录运行：

```powershell
python -X utf8 scripts/new_project.py --case presenter-v3 --out "../my-first-portrait"
cd "../my-first-portrait"
npm ci
npm run check
npm run dev
```

macOS／Linux 将第一条的 `python -X utf8` 换成 `python3`，其他命令相同。

创建目录必须在 Skill／仓库目录及其祖先目录之外，且不存在或为空；推荐使用仓库的同级新目录。这样更新 Skill 不会覆盖正在编辑的视频工程。复制时会忽略依赖、输出、版本控制与环境文件，不会沿用另一台机器的已安装包。

`npm ci` 会根据工程内锁文件安装依赖；它不会生成新的台词、人物或声音。首次联网安装需要耐心等待，查看终端的真实结果。`npm run check` 是 TypeScript 检查，不是画面或声音验收。

预览服务的实际地址由终端输出给出。成功打开后，应该看到占位人物、历史案例画面和字幕；没有声音是预期行为。

## 导出视频和静帧

在新工程目录执行：

```powershell
npm run render
```

默认输出 `out/presenter-v3-example.mp4`。渲染脚本使用 `PresenterEditorialV3` Composition，读取当前工程的帧率、尺寸与总帧数。

选择数个秒数导出静帧：

```powershell
npm run render -- 0.6 2.8 5.6 7.6 9.8
```

对应输出 `out/frame-0.60.png` 等文件。时间参数必须落在 Composition 内；10.74 秒默认样例的精确结束点不是一个可采样帧。

首次渲染时，Remotion 可能需要准备兼容浏览器。若你已安装兼容浏览器，`render.cjs` 也支持进程环境变量 `REMOTION_BROWSER_EXECUTABLE`。该变量只供此自定义脚本读取，不要假设所有其他命令都自动使用它。示例见[浏览器问题](TROUBLESHOOTING.md#浏览器下载失败或找不到浏览器)。

样例跑通后，按[工作流](WORKFLOW.md)制作新一期。仅换 `mediaConfig.ts` 不会自动重排镜头、更新字幕或延长工程。

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
