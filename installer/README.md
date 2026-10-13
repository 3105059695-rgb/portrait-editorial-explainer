# Windows 安装器维护说明

用户入口是发行 ZIP 中的 `OneClick-Install.exe`。源码下载可双击根目录的 `Install-Windows.cmd`，使用 Windows 自带的 .NET Framework C# 编译器生成相同入口。源码在 `OneClickInstaller.cs`；不要求预装 Python、Node 或 Git。

## 下载来源

`runtime-manifest.json` 固定版本、HTTPS 地址、SHA-256 与包内可执行文件路径。安装器下载完成后验证散列才解压。发布新版本时要更新散列与实际安装测试，不要仅把 URL 改成 `latest`。

| 工具 | 来源及校验依据 | 许可证 |
| --- | --- | --- |
| Python 3.13.16 embeddable x64 | [Python 发布清单](https://www.python.org/ftp/python/3.13.16/windows-3.13.16.json)，`pythonembed-3.13-64` | PSF；包内保留许可文件 |
| Node.js 24.21.0 x64 | [Node 官方 SHA256 清单](https://nodejs.org/dist/v24.21.0/SHASUMS256.txt) | Node MIT 与所附第三方许可 |
| FFmpeg/ffprobe（Remotion 4.0.534 媒体工具包） | [官方 npm 固定版本与 SRI](https://registry.npmjs.org/@remotion/compositor-win32-x64-msvc/4.0.534)、[二进制目录说明](https://www.remotion.dev/docs/options/binaries-directory)；下载包额外固定 SHA256 | [Remotion 第三方许可与构建来源](https://www.remotion.dev/docs/acknowledgements) |

这些运行时由安装器从上述来源下载，不嵌入本仓库的发行 ZIP。Remotion/npm 依赖使用工程锁文件，浏览器由 Remotion 获取。制作工具与服务各自的许可仍适用，见根目录 `THIRD_PARTY_NOTICES.md`。

## 开发验证

双击 `build.cmd` 编译。隔离验证（开发者命令，不是普通用户的安装步骤）：

```text
OneClick-Install.exe --headless --source <仓库目录> --app-home <隔离运行时目录> --skills-dir <隔离skills父目录> --force-portable
```

`--force-portable` 忽略 PATH 中已有工具，覆盖下载补齐分支。CLI 进程退出后检查指定 app-home 下的 `setup-result.json`，必须为 `status: ready`，并且有实际输出视频。WinExe 的终端等待方式取决于启动宿主，自动测试请使用等待进程退出的调用方式。

发布包必须包含完整 Skill 资源和编译出的根目录 `OneClick-Install.exe`。源码仓库忽略编译产物；GitHub 的自动 Source code ZIP 可通过 `Install-Windows.cmd` 编译，推荐普通用户使用带版本号的完整 ZIP。
