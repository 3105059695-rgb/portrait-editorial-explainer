# 自动安装说明：由用户的 Agent 执行

用户把本页链接交给你并要求安装时，请直接完成下载、依赖检查、安装与试跑，不把操作步骤转交给用户。目标 Skill 为 `portrait-editorial-explainer`，公开仓库为 `3105059695-rgb/portrait-editorial-explainer`。

这份 Skill 的视觉方向仍是完整参考的多媒介竖屏剪辑语言。安装不要求用户重述风格，也不使用作者电脑路径、账号或私人素材。

## Windows 10/11 x64：自动完成

1. 检查当前操作系统与本地命令执行能力。创建当前用户的临时工作目录。
2. 下载并阅读公开脚本：
   `https://raw.githubusercontent.com/3105059695-rgb/portrait-editorial-explainer/main/scripts/install_release.ps1`
3. 用宿主允许的 PowerShell 执行方式运行该脚本。脚本默认安装本页配套的 `v3.4.0`。不要修改系统执行策略或使用远程内容管道到 `iex`；若宿主拦截，明确说明限制并遵循其批准流程。
4. 等待程序完成，读取其打印的 `setup-result.json`。下载和首次渲染可能需要几分钟；命令工具返回运行中的会话ID时继续等待该会话，不要仅凭启动命令就报告成功。只有退出码为0、`status`为`ready`、Skill文件与`sampleVideo`存在，才告知安装成功。
5. 返回已安装 Skill 路径、示例视频位置和下面的日常调用语句。提示开一个新会话以发现新 Skill。

安装脚本会从本仓库 GitHub Release 获取完整 ZIP 和 SHA256SUMS，验证后解压，并用 `--headless` 调用已编译安装器。无需用户打开窗口或点击按钮。它检查和补齐 Python、Node/npm、FFmpeg、Remotion依赖与浏览器，最后实际渲染并完整解码12秒公开示例。

每次自动安装都获取上面链接的当前入口脚本；制作运行时使用固定版本 ZIP 和散列。入口脚本可以独立修复网络兼容问题，不要求重新分发整套素材。

默认 Skill 目录为当前进程的 `$CODEX_HOME/skills`，未设置时用当前用户的 `~/.codex/skills`。运行环境在当前用户 LocalAppData 的 `PortraitEditorialExplainer` 下。已有本 Skill 会先备份被替换文件，额外文件保留。其他非空目录拒绝覆盖。该安装不需要管理员权限，不修改全局 PATH，不安装／登录 Codex 或 ChatCut。

如需指定其他支持 Skill 的本地 Agent，先按宿主实际配置确定其技能父目录，再传 `-SkillsDir`；不得猜路径。只支持云端聊天、不能执行本地命令的宿主不能完成本机安装，应明确说明这个限制。

## 安装之后

普通用户只需提供本期材料并说：

```text
使用 $portrait-editorial-explainer，按这套完整风格剪辑我的数字人／口播视频。
按这期内容重新设计素材、物件、镜头和转场，先生成10–15秒开头。
```

制作 Agent 要读取已安装 SKILL.md，优先使用 Skill 根目录的 `Use-Skill.cmd` 和工程里的双击入口。不要因为全局 `python`、`node` 不存在就让用户重新手动安装。

## 其他系统或失败

- macOS／Linux：此版本尚无自动补齐依赖实现。按 [安装说明](https://github.com/3105059695-rgb/portrait-editorial-explainer/blob/main/docs/INSTALL.md)检查工具、用Python手动安装，不声称已验证一键安装。
- 下载失败：保留日志，修复网络后重试。哈希错误停止使用该包，不跳过校验。
- 运行失败：读取安装日志和失败结果，处理实际问题再重试，不以文件复制成功代替可运行。
- 若当前宿主要求用户批准运行命令，遵循该宿主的权限流程。本页不覆盖用户约束。
