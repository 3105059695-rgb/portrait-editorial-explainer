// Built with the Windows .NET Framework C# compiler; no global environment changes.
using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Drawing;
using System.Globalization;
using System.IO;
using System.IO.Compression;
using System.Linq;
using System.Net;
using System.Runtime.InteropServices;
using System.Security.Cryptography;
using System.Text;
using System.Text.RegularExpressions;
using System.Threading.Tasks;
using System.Web.Script.Serialization;
using System.Windows.Forms;

namespace PortraitEditorialInstaller
{
    public sealed class Options
    {
        public string Source;
        public string AppHome;
        public string SkillsDir;
        public string RuntimeFile;
        public string RunScript;
        public bool Headless;
        public bool ForcePortable;
        public bool SelfTest;
        public List<string> ScriptArguments = new List<string>();

        public static Options Parse(string[] args)
        {
            string baseDir = AppDomain.CurrentDomain.BaseDirectory;
            string codexHome = Environment.GetEnvironmentVariable("CODEX_HOME");
            var value = new Options {
                Source = File.Exists(Path.Combine(baseDir, "SKILL.md")) ? baseDir : Path.GetFullPath(Path.Combine(baseDir, "..")),
                AppHome = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), "PortraitEditorialExplainer"),
                SkillsDir = Path.Combine(String.IsNullOrWhiteSpace(codexHome) ? Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.UserProfile), ".codex") : codexHome, "skills")
            };
            for (int i = 0; i < args.Length; i++)
            {
                string arg = args[i];
                if (arg == "--") { value.ScriptArguments.AddRange(args.Skip(i + 1)); break; }
                if (arg == "--headless") { value.Headless = true; continue; }
                if (arg == "--force-portable") { value.ForcePortable = true; continue; }
                if (arg == "--self-test") { value.SelfTest = true; value.Headless = true; continue; }
                if (i + 1 >= args.Length) throw new ArgumentException("参数缺少值：" + arg);
                string next = args[++i];
                switch (arg)
                {
                    case "--source": value.Source = next; break;
                    case "--app-home": value.AppHome = next; break;
                    case "--skills-dir": value.SkillsDir = next; break;
                    case "--runtime-file": value.RuntimeFile = next; break;
                    case "--run-script": value.RunScript = next; value.Headless = true; break;
                    default: throw new ArgumentException("不支持的参数：" + arg);
                }
            }
            value.Source = Path.GetFullPath(value.Source);
            value.AppHome = Path.GetFullPath(value.AppHome);
            value.SkillsDir = Path.GetFullPath(value.SkillsDir);
            if (value.RuntimeFile != null) value.RuntimeFile = Path.GetFullPath(value.RuntimeFile);
            return value;
        }
    }

    public sealed class RuntimeManifest
    {
        public string version { get; set; }
        public string platform { get; set; }
        public List<RuntimePackage> packages { get; set; }
    }
    public sealed class RuntimePackage
    {
        public string id { get; set; }
        public string version { get; set; }
        public string url { get; set; }
        public string sha256 { get; set; }
        public string archiveFormat { get; set; }
        public Dictionary<string, string> executables { get; set; }
    }
    public sealed class RuntimeConfig
    {
        public int schemaVersion { get; set; }
        public string appHome { get; set; }
        public string python { get; set; }
        public string node { get; set; }
        public string npmCli { get; set; }
        public string ffmpeg { get; set; }
        public string ffprobe { get; set; }
        public string skillRoot { get; set; }
        public string installerExecutable { get; set; }
        public string version { get; set; }
    }
    public sealed class SetupResult
    {
        public string status { get; set; }
        public string sampleVideo { get; set; }
        public string skillRoot { get; set; }
        public string version { get; set; }
    }
    internal sealed class ProcessResult
    {
        public int ExitCode;
        public string Output;
    }

    public static class Program
    {
        [DllImport("kernel32.dll", SetLastError = true)] private static extern bool AttachConsole(uint processId);
        [DllImport("kernel32.dll", SetLastError = true)] private static extern IntPtr GetStdHandle(int standardHandle);
        [DllImport("kernel32.dll", SetLastError = true)] private static extern uint GetFileType(IntPtr handle);
        [DllImport("kernel32.dll", SetLastError = true)] private static extern bool SetConsoleOutputCP(uint codePage);
        private static bool IsRedirectedHandle(int standardHandle)
        {
            IntPtr handle = GetStdHandle(standardHandle);
            if (handle == IntPtr.Zero || handle == new IntPtr(-1)) return false;
            uint kind = GetFileType(handle) & 0x7FFF;
            return kind == 1 || kind == 3; // FILE_TYPE_DISK or FILE_TYPE_PIPE
        }
        private static void PrepareConsole()
        {
            // A GUI executable launched by a batch bridge may already own inherited pipes.
            // AttachConsole resets those handles and silently loses the Agent's JSON output.
            if (!IsRedirectedHandle(-11) && !IsRedirectedHandle(-12))
            {
                AttachConsole(0xFFFFFFFF);
                SetConsoleOutputCP(65001);
            }
            // Console.OutputEncoding calls SetConsoleOutputCP on .NET Framework and can
            // throw for a GUI process with pipes but no console. Bind UTF-8 writers directly.
            Console.SetOut(new StreamWriter(Console.OpenStandardOutput(), new UTF8Encoding(false)) { AutoFlush = true });
            Console.SetError(new StreamWriter(Console.OpenStandardError(), new UTF8Encoding(false)) { AutoFlush = true });
        }
        [STAThread]
        public static int Main(string[] args)
        {
            Options options = null;
            try
            {
                options = Options.Parse(args);
                if (options.Headless)
                {
                    PrepareConsole();
                    if (options.SelfTest) { Installer.SelfTest(); Console.WriteLine("Installer self-test passed."); return 0; }
                    if (options.RunScript != null) return Installer.RunInstalledScript(options);
                    using (var installer = new Installer(options)) { installer.Progress += delegate(int progress, string text) { Console.WriteLine(text); }; installer.Install(); }
                    return 0;
                }
                Application.EnableVisualStyles();
                Application.SetCompatibleTextRenderingDefault(false);
                Application.Run(new InstallerForm(options));
                return 0;
            }
            catch (Exception error)
            {
                string message = "未完成安装：" + error.Message;
                if ((options != null && options.Headless) || args.Contains("--headless") || args.Contains("--run-script") || args.Contains("--self-test"))
                { PrepareConsole(); Console.Error.WriteLine(message); }
                else MessageBox.Show(message, "竖屏动效 Skill", MessageBoxButtons.OK, MessageBoxIcon.Error);
                return 1;
            }
        }
    }

    public sealed class Installer : IDisposable
    {
        public const string Version = "3.4.0";
        private const string SkillName = "portrait-editorial-explainer";
        private const string RunpyShim = "import os,runpy,sys; p=sys.argv.pop(1); sys.path.insert(0,os.path.dirname(p)); sys.argv[0]=p; runpy.run_path(p,run_name='__main__')";
        private const string TarExtractShim = @"import os, pathlib, re, shutil, stat, sys, tarfile
root = pathlib.Path(sys.argv[2]).absolute()
def reject_links(path):
    for item in (path, *path.parents):
        try:
            details = item.lstat()
        except FileNotFoundError:
            continue
        if stat.S_ISLNK(details.st_mode) or getattr(details, 'st_file_attributes', 0) & 0x400:
            raise ValueError('Archive destination contains a link or junction')
reject_links(root)
root_real = root.resolve(strict=True)
count = total = 0
with tarfile.open(sys.argv[1], 'r:gz') as archive:
    for member in archive:
        count += 1
        total += member.size
        if count > 100000 or member.size < 0 or total > 12 * 1024**3:
            raise ValueError('Archive count or size exceeds limits')
        name = member.name.replace(chr(92), '/')
        if name.startswith('/') or ':' in name:
            raise ValueError('Archive contains an absolute path or alternate stream')
        parts = name.rstrip('/').split('/')
        for part in parts:
            if not part or part in ('.', '..') or part.endswith(('.', ' ')) or any(ord(c) < 32 or ord(c) == 34 or c in '<>|?*' for c in part):
                raise ValueError('Archive contains an unsafe path component')
            if re.match(r'^(CON|PRN|AUX|NUL|COM[1-9]|LPT[1-9])(?:\.|$)', part, re.I):
                raise ValueError('Archive contains a Windows device name')
        if member.issym() or member.islnk() or not (member.isdir() or member.isreg()):
            raise ValueError('Archive contains a link or non-regular device entry')
        target = root.joinpath(*parts)
        reject_links(target)
        if not target.resolve(strict=False).is_relative_to(root_real):
            raise ValueError('Archive path escapes destination')
        if member.isdir():
            target.mkdir(parents=True, exist_ok=True)
        else:
            target.parent.mkdir(parents=True, exist_ok=True)
            reject_links(target)
            source = archive.extractfile(member)
            if source is None:
                raise ValueError('Archive member has no data stream')
            with source, target.open('xb') as output:
                shutil.copyfileobj(source, output, 1024 * 128)
print('tar.gz extraction verified: %s entries' % count)
";
        private readonly Options options;
        private readonly StreamWriter log;
        private readonly object logLock = new object();
        public event Action<int, string> Progress;
        public string LogPath { get; private set; }
        public SetupResult Result { get; private set; }
        private static readonly JavaScriptSerializer Json = new JavaScriptSerializer { MaxJsonLength = 1024 * 1024 * 8 };

        public Installer(Options value)
        {
            options = value;
            RejectReparseAncestors(options.AppHome);
            string logs = Path.Combine(options.AppHome, "logs");
            RejectReparseAncestors(logs);
            Directory.CreateDirectory(logs);
            LogPath = Path.Combine(logs, "install-" + DateTime.UtcNow.ToString("yyyyMMdd-HHmmss", CultureInfo.InvariantCulture) + "-" + Guid.NewGuid().ToString("N").Substring(0, 8) + ".log");
            log = new StreamWriter(LogPath, false, new UTF8Encoding(false)) { AutoFlush = true };
        }
        public void Dispose() { log.Dispose(); }
        private void Report(int percent, string text)
        {
            lock (logLock) log.WriteLine(DateTime.Now.ToString("HH:mm:ss", CultureInfo.InvariantCulture) + " " + text);
            var handler = Progress;
            if (handler != null) handler(Math.Max(0, Math.Min(100, percent)), text);
        }
        public void Install()
        {
            try { InstallCore(); }
            catch (Exception error)
            {
                Report(0, "安装未完成：" + error.Message);
                lock (logLock) log.WriteLine(error.ToString());
                throw;
            }
        }
        private void InstallCore()
        {
            if (Environment.OSVersion.Platform != PlatformID.Win32NT || !Environment.Is64BitOperatingSystem)
                throw new InvalidOperationException("此安装包需要 Windows 10/11 64 位系统。");
            RejectReparseAncestors(options.Source);
            RejectReparseAncestors(options.SkillsDir);
            if (!File.Exists(Path.Combine(options.Source, "SKILL.md")) || !File.Exists(Path.Combine(options.Source, "scripts", "setup_runtime.py")))
                throw new InvalidOperationException("请先把完整 ZIP 解压到文件夹，再双击安装；不能只复制安装程序。");
            string manifestPath = Path.Combine(options.Source, "installer", "runtime-manifest.json");
            RejectReparseAncestors(manifestPath);
            RuntimeManifest manifest = Json.Deserialize<RuntimeManifest>(File.ReadAllText(manifestPath, Encoding.UTF8));
            ValidateManifest(manifest);
            Report(2, "正在检查 Python、Node.js/npm、FFmpeg。缺少的依赖将安装到本用户的独立目录，不修改全局 PATH。");
            var runtime = new RuntimeConfig { schemaVersion = 1, appHome = options.AppHome, skillRoot = Path.Combine(options.SkillsDir, SkillName), version = Version };
            if (!options.ForcePortable) Discover(runtime);
            else Report(4, "隔离验证模式：忽略系统工具，准备独立运行环境。");
            int index = 0;
            foreach (RuntimePackage package in manifest.packages)
            {
                index++;
                bool present = package.id == "python" ? runtime.python != null : package.id == "node" ? runtime.node != null : runtime.ffmpeg != null;
                if (present) { Report(5 + index * 10, package.id + "：复用已验证的本机工具。"); continue; }
                string root = EnsurePackage(package, 5 + (index - 1) * 12, runtime.python);
                if (package.id == "python") runtime.python = SafeChild(root, package.executables["python"]);
                if (package.id == "node") { runtime.node = SafeChild(root, package.executables["node"]); runtime.npmCli = SafeChild(root, package.executables["npmCli"]); }
                if (package.id == "ffmpeg") { runtime.ffmpeg = SafeChild(root, package.executables["ffmpeg"]); runtime.ffprobe = SafeChild(root, package.executables["ffprobe"]); }
            }
            if (!ProbePython(runtime.python) || !ProbeNode(runtime.node, runtime.npmCli) || !ProbeMedia(runtime.ffmpeg, runtime.ffprobe))
                throw new InvalidOperationException("依赖检查失败，未继续安装。请查看日志中的最后一个依赖。");
            runtime.installerExecutable = CopyLauncher();
            string runtimeFile = Path.Combine(options.AppHome, "runtime.json");
            AtomicWrite(runtimeFile, Json.Serialize(runtime));
            string setupResult = Path.Combine(options.AppHome, "setup-result.json");
            BackupExisting(setupResult);
            Report(45, "基础工具已就绪，开始安装 Skill、准备渲染依赖和示例。首次下载可能需要几分钟。");
            var arguments = PythonArguments(Path.Combine(options.Source, "scripts", "setup_runtime.py"), new[] { "--source", options.Source, "--skills-dir", options.SkillsDir, "--app-home", options.AppHome, "--runtime-file", runtimeFile });
            ProcessResult setup = RunProcess(runtime.python, arguments, options.Source, runtime, 90 * 60 * 1000, delegate(string line) { Report(60, line); }, runtimeFile);
            if (setup.ExitCode != 0) throw new InvalidOperationException("环境准备程序退出码 " + setup.ExitCode + "。可再次打开安装器重试；日志：" + LogPath);
            RejectReparseAncestors(setupResult);
            if (!File.Exists(setupResult)) throw new InvalidOperationException("准备程序未返回安装结果，不能标记为完成。");
            Result = Json.Deserialize<SetupResult>(File.ReadAllText(setupResult, Encoding.UTF8));
            if (Result == null || Result.status != "ready" || Result.version != Version ||
                String.IsNullOrWhiteSpace(Result.skillRoot) || !SamePath(Result.skillRoot, runtime.skillRoot) ||
                !File.Exists(Path.Combine(Result.skillRoot, "SKILL.md")) || String.IsNullOrWhiteSpace(Result.sampleVideo) || !File.Exists(Result.sampleVideo))
                throw new InvalidOperationException("安装结果不完整，示例或 Skill 尚未就绪。日志：" + LogPath);
            RejectReparseAncestors(Result.sampleVideo);
            RejectReparseAncestors(Result.skillRoot);
            Report(100, "安装完成：Skill 已安装，示例已成功渲染。重新打开 Codex 会话即可调用。");
        }
        private void Discover(RuntimeConfig runtime)
        {
            foreach (string python in FindOnPath("python.exe", "python3.exe"))
                if (ProbePython(python)) { runtime.python = python; break; }
            foreach (string node in FindOnPath("node.exe"))
            {
                string npm = Path.Combine(Path.GetDirectoryName(node), "node_modules", "npm", "bin", "npm-cli.js");
                if (ProbeNode(node, npm)) { runtime.node = node; runtime.npmCli = npm; break; }
            }
            foreach (string ffmpeg in FindOnPath("ffmpeg.exe"))
            {
                string sameFolder = Path.Combine(Path.GetDirectoryName(ffmpeg), "ffprobe.exe");
                foreach (string ffprobe in (File.Exists(sameFolder) ? new[] { sameFolder } : new string[0]).Concat(FindOnPath("ffprobe.exe")))
                    if (ProbeMedia(ffmpeg, ffprobe)) { runtime.ffmpeg = ffmpeg; runtime.ffprobe = ffprobe; return; }
            }
        }
        private static IEnumerable<string> FindOnPath(params string[] names)
        {
            var found = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
            foreach (string path in (Environment.GetEnvironmentVariable("PATH") ?? "").Split(Path.PathSeparator))
            {
                string directory = path.Trim().Trim('"');
                if (String.IsNullOrWhiteSpace(directory) || directory.IndexOf("WindowsApps", StringComparison.OrdinalIgnoreCase) >= 0) continue;
                foreach (string name in names)
                {
                    string candidate;
                    try { candidate = Path.GetFullPath(Path.Combine(directory, name)); } catch { continue; }
                    if (File.Exists(candidate) && found.Add(candidate)) yield return candidate;
                }
            }
        }
        private static bool ProbePython(string path)
        {
            try { var r = RunProcess(path, new[] { "-I", "-c", "import sys; print(sys.version.split()[0]); sys.exit(0 if (3,10) <= sys.version_info < (4,0) else 1)" }, null, null, 15000, null); return r.ExitCode == 0; }
            catch { return false; }
        }
        private static bool ProbeNode(string node, string npm)
        {
            if (String.IsNullOrEmpty(npm) || !File.Exists(npm)) return false;
            try
            {
                var n = RunProcess(node, new[] { "-p", "Number(process.versions.node.split('.')[0]) >= 22 ? 'ready' : 'old'" }, null, null, 15000, null);
                var p = RunProcess(node, new[] { npm, "--version" }, null, null, 30000, null);
                return n.ExitCode == 0 && n.Output.Trim() == "ready" && p.ExitCode == 0 && Regex.IsMatch(p.Output.Trim(), @"^\d+\.\d+\.\d+");
            }
            catch { return false; }
        }
        private static bool ProbeMedia(string ffmpeg, string ffprobe)
        {
            try
            {
                var f = RunProcess(ffmpeg, new[] { "-version" }, null, null, 15000, null);
                var p = RunProcess(ffprobe, new[] { "-version" }, null, null, 15000, null);
                return f.ExitCode == 0 && p.ExitCode == 0 && f.Output.Contains("ffmpeg version") && p.Output.Contains("ffprobe version");
            }
            catch { return false; }
        }
        private string EnsurePackage(RuntimePackage package, int percent, string python)
        {
            string runtimeDir = Path.Combine(options.AppHome, "runtime");
            RejectReparseAncestors(runtimeDir);
            Directory.CreateDirectory(runtimeDir);
            string nominal = Path.Combine(runtimeDir, package.id + "-" + package.version);
            string target = nominal;
            if (Directory.Exists(nominal))
            {
                if (ValidInstalledPackage(nominal, package)) { Report(percent + 10, package.id + "：独立环境校验通过，复用已有版本。"); return nominal; }
                // A previous/unknown folder is preserved; never replace arbitrary existing files.
                target = nominal + "-" + Guid.NewGuid().ToString("N").Substring(0, 8);
                Report(percent, package.id + "：旧目录未通过验证，将在新目录准备，保留旧文件。");
            }
            string downloads = Path.Combine(options.AppHome, "downloads");
            RejectReparseAncestors(downloads);
            Directory.CreateDirectory(downloads);
            bool tarGzip = package.archiveFormat == "tar.gz";
            string archive = Path.Combine(downloads, package.id + "-" + package.version + "-" + package.sha256.Substring(0, 12) + (tarGzip ? ".tar.gz" : ".zip"));
            RejectReparseAncestors(archive);
            if (File.Exists(archive) && !HashMatches(archive, package.sha256))
            {
                string invalid = archive + ".invalid-" + Guid.NewGuid().ToString("N").Substring(0, 8);
                File.Move(archive, invalid);
                Report(percent, package.id + "：缓存校验失败，已保留诊断副本，重新下载。");
            }
            if (!File.Exists(archive)) Download(package, archive, percent);
            Report(percent + 7, package.id + "：校验 SHA-256。");
            if (!HashMatches(archive, package.sha256)) throw new InvalidOperationException(package.id + " 下载校验失败；未解压或执行，已保留下载文件。");
            string staging = Path.Combine(runtimeDir, ".stage-" + package.id + "-" + Guid.NewGuid().ToString("N"));
            if (tarGzip) SafeExtractTarGzip(archive, staging, python);
            else SafeExtract(archive, staging);
            foreach (string relative in package.executables.Values)
                if (!File.Exists(SafeChild(staging, relative))) throw new InvalidOperationException(package.id + " 压缩包缺少所需工具：" + relative);
            RejectReparseAncestors(target);
            if (Directory.Exists(target) || File.Exists(target)) throw new InvalidOperationException("依赖目标目录已被其他操作占用，请重试。");
            // Publish verified bytes before launching an executable. Windows may briefly retain
            // image/antivirus handles after a Node process exits, preventing its parent rename.
            Directory.Move(staging, target);
            if (!ProbePackage(target, package)) throw new InvalidOperationException(package.id + " 下载通过校验，但工具无法运行。已保留新目录供排查，未写就绪标记。");
            File.WriteAllText(Path.Combine(target, ".portrait-runtime.json"), Json.Serialize(new { id = package.id, version = package.version, sha256 = package.sha256 }), new UTF8Encoding(false));
            Report(percent + 11, package.id + "：独立环境已就绪。");
            return target;
        }
        private static bool ValidInstalledPackage(string root, RuntimePackage package)
        {
            try
            {
                RejectReparseAncestors(root);
                string marker = SafeChild(root, ".portrait-runtime.json");
                if (!File.Exists(marker)) return false;
                var fields = Json.Deserialize<Dictionary<string, string>>(File.ReadAllText(marker, Encoding.UTF8));
                if (fields["id"] != package.id || fields["version"] != package.version || !String.Equals(fields["sha256"], package.sha256, StringComparison.OrdinalIgnoreCase)) return false;
                return ProbePackage(root, package);
            }
            catch { return false; }
        }
        private static bool ProbePackage(string root, RuntimePackage package)
        {
            if (package.id == "python") return ProbePython(SafeChild(root, package.executables["python"]));
            if (package.id == "node") return ProbeNode(SafeChild(root, package.executables["node"]), SafeChild(root, package.executables["npmCli"]));
            return ProbeMedia(SafeChild(root, package.executables["ffmpeg"]), SafeChild(root, package.executables["ffprobe"]));
        }
        private void Download(RuntimePackage package, string destination, int percent)
        {
            ServicePointManager.SecurityProtocol = SecurityProtocolType.Tls12;
            Exception last = null;
            for (int attempt = 1; attempt <= 3; attempt++)
            {
                string partial = destination + ".part-" + Guid.NewGuid().ToString("N").Substring(0, 8);
                try
                {
                    Report(percent, "正在下载 " + package.id + " " + package.version + "（尝试 " + attempt + "/3）。");
                    using (HttpWebResponse response = OpenHttps(new Uri(package.url)))
                    using (Stream input = response.GetResponseStream())
                    using (var output = new FileStream(partial, FileMode.CreateNew, FileAccess.Write, FileShare.None))
                    {
                        byte[] buffer = new byte[1024 * 128];
                        long copied = 0; int lastPercent = -20; int read;
                        while ((read = input.Read(buffer, 0, buffer.Length)) > 0)
                        {
                            output.Write(buffer, 0, read); copied += read;
                            if (copied > 4L * 1024 * 1024 * 1024) throw new InvalidDataException("下载文件超过安全大小限制。");
                            int progress = response.ContentLength > 0 ? (int)(copied * 100 / response.ContentLength) : 0;
                            if (progress >= lastPercent + 20) { lastPercent = progress; Report(percent + progress * 6 / 100, package.id + " 下载 " + progress + "%（" + (copied / 1024 / 1024) + " MB）。"); }
                        }
                        if (response.ContentLength > 0 && copied != response.ContentLength) throw new EndOfStreamException("下载未完成。");
                    }
                    if (!HashMatches(partial, package.sha256)) throw new InvalidDataException(package.id + " SHA-256 不匹配。文件已保留，未解压或执行。");
                    File.Move(partial, destination);
                    return;
                }
                catch (InvalidDataException) { throw; }
                catch (Exception error) { last = error; Report(percent, package.id + " 下载失败：" + error.Message); }
            }
            throw new IOException(package.id + " 下载失败，请检查网络后重试。", last);
        }
        private static HttpWebResponse OpenHttps(Uri uri)
        {
            for (int redirect = 0; redirect < 6; redirect++)
            {
                if (uri.Scheme != Uri.UriSchemeHttps) throw new InvalidDataException("运行环境下载必须使用 HTTPS。");
                var request = (HttpWebRequest)WebRequest.Create(uri);
                request.AllowAutoRedirect = false;
                request.Timeout = 60000;
                request.ReadWriteTimeout = 120000;
                request.UserAgent = "PortraitEditorialExplainer-Installer/" + Version;
                var response = (HttpWebResponse)request.GetResponse();
                int status = (int)response.StatusCode;
                if (status >= 300 && status <= 399)
                {
                    string location = response.Headers["Location"]; response.Close();
                    if (String.IsNullOrEmpty(location)) throw new InvalidDataException("下载重定向缺少地址。");
                    uri = new Uri(uri, location); continue;
                }
                if (status != 200) { response.Close(); throw new IOException("下载服务器返回 HTTP " + status); }
                return response;
            }
            throw new InvalidDataException("下载重定向次数过多。");
        }
        private static void ValidateManifest(RuntimeManifest manifest)
        {
            if (manifest == null || manifest.version != Version || manifest.platform != "windows-x64" || manifest.packages == null || manifest.packages.Count != 3)
                throw new InvalidDataException("运行环境清单缺失或版本不匹配，请重新下载完整安装包。");
            var ids = new HashSet<string>();
            foreach (RuntimePackage package in manifest.packages)
            {
                Uri uri;
                if (package == null || !new[] { "python", "node", "ffmpeg" }.Contains(package.id) || !ids.Add(package.id) ||
                    String.IsNullOrWhiteSpace(package.version) || !Regex.IsMatch(package.version, @"^[0-9A-Za-z._-]+$") ||
                    !Uri.TryCreate(package.url, UriKind.Absolute, out uri) || uri.Scheme != Uri.UriSchemeHttps ||
                    package.sha256 == null || !Regex.IsMatch(package.sha256, @"^[a-fA-F0-9]{64}$") || package.executables == null ||
                    !(String.IsNullOrEmpty(package.archiveFormat) || package.archiveFormat == "zip" || package.archiveFormat == "tar.gz"))
                    throw new InvalidDataException("运行环境清单包含无效包信息。");
                string[] required = package.id == "python" ? new[] { "python" } : package.id == "node" ? new[] { "node", "npmCli" } : new[] { "ffmpeg", "ffprobe" };
                foreach (string key in required)
                    if (!package.executables.ContainsKey(key) || String.IsNullOrWhiteSpace(package.executables[key])) throw new InvalidDataException("清单缺少 " + key);
                foreach (string path in package.executables.Values) ValidateRelative(path);
            }
        }
        public static void RejectReparseAncestors(string path)
        {
            string current = Path.GetFullPath(path);
            while (!String.IsNullOrEmpty(current))
            {
                try
                {
                    if ((File.GetAttributes(current) & FileAttributes.ReparsePoint) != 0)
                        throw new IOException("不支持符号链接或目录联接：" + current);
                }
                catch (FileNotFoundException) { }
                catch (DirectoryNotFoundException) { }
                string parent = Path.GetDirectoryName(current);
                if (parent == current) break;
                current = parent;
            }
        }
        private static void ValidateRelative(string relative)
        {
            if (String.IsNullOrWhiteSpace(relative) || Path.IsPathRooted(relative) || relative.Contains(":")) throw new InvalidDataException("压缩包路径无效。");
            foreach (string segment in relative.Replace('\\', '/').TrimEnd('/').Split('/'))
                if (String.IsNullOrEmpty(segment) || segment == "." || segment == ".." || segment.EndsWith(".") || segment.EndsWith(" ") || segment.IndexOfAny(Path.GetInvalidFileNameChars()) >= 0)
                    throw new InvalidDataException("压缩包路径包含不安全片段。");
        }
        public static string SafeChild(string root, string relative)
        {
            ValidateRelative(relative);
            string prefix = Path.GetFullPath(root).TrimEnd(Path.DirectorySeparatorChar, Path.AltDirectorySeparatorChar) + Path.DirectorySeparatorChar;
            string child = Path.GetFullPath(Path.Combine(root, relative.Replace('/', Path.DirectorySeparatorChar)));
            if (!child.StartsWith(prefix, StringComparison.OrdinalIgnoreCase)) throw new InvalidDataException("压缩包路径越界。");
            RejectReparseAncestors(child);
            return child;
        }
        public static void SafeExtract(string archive, string target)
        {
            RejectReparseAncestors(target);
            if (Directory.Exists(target) || File.Exists(target)) throw new IOException("临时解压目录已存在。");
            Directory.CreateDirectory(target);
            long total = 0;
            using (ZipArchive zip = ZipFile.OpenRead(archive))
            {
                if (zip.Entries.Count > 100000) throw new InvalidDataException("压缩包条目过多。");
                foreach (ZipArchiveEntry entry in zip.Entries)
                {
                    total += entry.Length;
                    if (total > 12L * 1024 * 1024 * 1024) throw new InvalidDataException("解压大小超过限制。");
                    // Reject Unix symlinks and Windows reparse attributes before creating paths.
                    if (((entry.ExternalAttributes >> 16) & 0xF000) == 0xA000 || (entry.ExternalAttributes & (int)FileAttributes.ReparsePoint) != 0)
                        throw new InvalidDataException("压缩包包含链接，不允许解压。");
                    string destination = SafeChild(target, entry.FullName);
                    if (entry.FullName.EndsWith("/") || entry.FullName.EndsWith("\\")) { Directory.CreateDirectory(destination); continue; }
                    Directory.CreateDirectory(Path.GetDirectoryName(destination));
                    RejectReparseAncestors(destination);
                    using (Stream input = entry.Open())
                    using (var output = new FileStream(destination, FileMode.CreateNew, FileAccess.Write, FileShare.None)) input.CopyTo(output);
                }
            }
        }
        public static void SafeExtractTarGzip(string archive, string target, string python)
        {
            if (String.IsNullOrEmpty(python) || !File.Exists(python))
                throw new InvalidOperationException("tar.gz 依赖需要先准备 Python，请检查运行环境清单顺序。");
            RejectReparseAncestors(archive);
            RejectReparseAncestors(target);
            if (Directory.Exists(target) || File.Exists(target)) throw new IOException("临时解压目录已存在。");
            Directory.CreateDirectory(target);
            ProcessResult extraction = RunProcess(python, new[] { "-I", "-X", "utf8", "-c", TarExtractShim, archive, target }, null, null, 10 * 60 * 1000, null);
            if (extraction.ExitCode != 0)
                throw new InvalidDataException("tar.gz 安全解压失败；临时目录已保留。" + Environment.NewLine + extraction.Output.Trim());
        }
        private static bool HashMatches(string path, string expected)
        {
            using (var sha = SHA256.Create())
            using (var stream = File.OpenRead(path)) return String.Equals(BitConverter.ToString(sha.ComputeHash(stream)).Replace("-", ""), expected, StringComparison.OrdinalIgnoreCase);
        }
        private static bool SamePath(string left, string right) { return String.Equals(Path.GetFullPath(left).TrimEnd('\\', '/'), Path.GetFullPath(right).TrimEnd('\\', '/'), StringComparison.OrdinalIgnoreCase); }
        private string CopyLauncher()
        {
            string current = Process.GetCurrentProcess().MainModule.FileName;
            string bin = Path.Combine(options.AppHome, "bin", Version);
            RejectReparseAncestors(bin); Directory.CreateDirectory(bin);
            string destination = Path.Combine(bin, "PortraitInstaller.exe");
            if (SamePath(current, destination)) return destination;
            if (File.Exists(destination))
            {
                string currentHash;
                using (var sha = SHA256.Create()) using (var stream = File.OpenRead(current)) currentHash = BitConverter.ToString(sha.ComputeHash(stream)).Replace("-", "");
                if (HashMatches(destination, currentHash)) return destination;
                destination = Path.Combine(bin, "PortraitInstaller-" + Guid.NewGuid().ToString("N").Substring(0, 8) + ".exe");
            }
            RejectReparseAncestors(destination);
            File.Copy(current, destination, false);
            return destination;
        }
        private static void BackupExisting(string path)
        {
            RejectReparseAncestors(path);
            if (File.Exists(path)) File.Move(path, path + ".previous-" + DateTime.UtcNow.ToString("yyyyMMdd-HHmmss", CultureInfo.InvariantCulture) + "-" + Guid.NewGuid().ToString("N").Substring(0, 8));
        }
        private static void AtomicWrite(string path, string content)
        {
            RejectReparseAncestors(path);
            Directory.CreateDirectory(Path.GetDirectoryName(path));
            string temporary = path + ".new-" + Guid.NewGuid().ToString("N");
            File.WriteAllText(temporary, content, new UTF8Encoding(false));
            if (File.Exists(path)) File.Replace(temporary, path, path + ".backup-" + Guid.NewGuid().ToString("N").Substring(0, 8));
            else File.Move(temporary, path);
        }
        private static List<string> PythonArguments(string script, IEnumerable<string> remaining)
        {
            var args = new List<string> { "-X", "utf8", "-c", RunpyShim, script };
            args.AddRange(remaining); return args;
        }
        public static int RunInstalledScript(Options options)
        {
            if (!new[] { "start_episode.py", "new_project.py", "effect_library.py", "doctor.py", "run_project.py", "source_episode.py", "compile_storyboard.py", "check_timeline.py" }.Contains(options.RunScript))
                throw new ArgumentException("此入口不允许运行该脚本。");
            string runtimePath = options.RuntimeFile ?? Path.Combine(options.AppHome, "runtime.json");
            RejectReparseAncestors(runtimePath);
            var runtime = Json.Deserialize<RuntimeConfig>(File.ReadAllText(runtimePath, Encoding.UTF8));
            if (runtime == null || runtime.schemaVersion != 1 || String.IsNullOrWhiteSpace(runtime.skillRoot) || !File.Exists(runtime.python))
                throw new InvalidDataException("运行环境配置无效，请重新运行安装器。");
            string script = SafeChild(runtime.skillRoot, "scripts/" + options.RunScript);
            if (!File.Exists(script)) throw new FileNotFoundException("已安装的 Skill 缺少脚本。", script);
            return RunProcess(runtime.python, PythonArguments(script, options.ScriptArguments), Environment.CurrentDirectory, runtime, 24 * 60 * 60 * 1000, delegate(string line) { Console.WriteLine(line); }, runtimePath).ExitCode;
        }
        public static string QuoteArgument(string value)
        {
            if (value == null) value = "";
            var result = new StringBuilder("\""); int slashes = 0;
            foreach (char character in value)
            {
                if (character == '\\') { slashes++; continue; }
                if (character == '"') { result.Append('\\', slashes * 2 + 1); result.Append('"'); slashes = 0; continue; }
                result.Append('\\', slashes); slashes = 0; result.Append(character);
            }
            result.Append('\\', slashes * 2); result.Append('"'); return result.ToString();
        }
        private static ProcessResult RunProcess(string file, IEnumerable<string> arguments, string directory, RuntimeConfig runtime, int timeout, Action<string> onLine, string runtimeFile = null)
        {
            if (String.IsNullOrEmpty(file) || !File.Exists(file)) throw new FileNotFoundException("工具不存在。", file);
            var info = new ProcessStartInfo(file, String.Join(" ", arguments.Select(QuoteArgument))) {
                UseShellExecute = false, CreateNoWindow = true, RedirectStandardOutput = true, RedirectStandardError = true,
                StandardOutputEncoding = Encoding.UTF8, StandardErrorEncoding = Encoding.UTF8
            };
            if (!String.IsNullOrWhiteSpace(directory)) info.WorkingDirectory = directory;
            if (runtime != null)
            {
                var directories = new[] { runtime.python, runtime.node, runtime.ffmpeg, runtime.ffprobe }.Where(p => !String.IsNullOrEmpty(p)).Select(Path.GetDirectoryName).Distinct(StringComparer.OrdinalIgnoreCase);
                info.EnvironmentVariables["PATH"] = String.Join(Path.PathSeparator.ToString(), directories) + Path.PathSeparator + (info.EnvironmentVariables["PATH"] ?? "");
                info.EnvironmentVariables["PYTHON"] = runtime.python;
                info.EnvironmentVariables["PYTHONIOENCODING"] = "utf-8";
                info.EnvironmentVariables["PYTHONUTF8"] = "1";
                info.EnvironmentVariables["PORTRAIT_RUNTIME_FILE"] = runtimeFile ?? Path.Combine(runtime.appHome, "runtime.json");
                if (!String.IsNullOrEmpty(runtime.installerExecutable)) info.EnvironmentVariables["PORTRAIT_INSTALLER_EXE"] = runtime.installerExecutable;
            }
            var output = new StringBuilder(); object outputLock = new object();
            using (var process = new Process { StartInfo = info })
            {
                DataReceivedEventHandler received = delegate(object sender, DataReceivedEventArgs data) {
                    if (data.Data == null) return;
                    lock (outputLock) { if (output.Length < 1024 * 1024 * 8) output.AppendLine(data.Data); }
                    if (onLine != null) onLine(data.Data);
                };
                process.OutputDataReceived += received; process.ErrorDataReceived += received;
                process.Start(); process.BeginOutputReadLine(); process.BeginErrorReadLine();
                if (!process.WaitForExit(timeout))
                {
                    try { process.Kill(); } catch { }
                    throw new TimeoutException("工具执行超时：" + Path.GetFileName(file));
                }
                process.WaitForExit();
                return new ProcessResult { ExitCode = process.ExitCode, Output = output.ToString() };
            }
        }
        public static void SelfTest()
        {
            if (QuoteArgument("a b") != "\"a b\"" || QuoteArgument("C:\\space \\") != "\"C:\\space \\\\\"" || QuoteArgument("a\"b") != "\"a\\\"b\"")
                throw new Exception("Argument quoting test failed.");
            string temporary = Path.Combine(Path.GetTempPath(), "portrait-installer-test-" + Guid.NewGuid().ToString("N"));
            Directory.CreateDirectory(temporary);
            foreach (string bad in new[] { "../escape.exe", "folder/../../escape", "C:/escape", "/escape", "folder/file:stream", "folder/../escape", "folder/name." })
            {
                bool rejected = false; try { SafeChild(temporary, bad); } catch (InvalidDataException) { rejected = true; }
                if (!rejected) throw new Exception("Unsafe path accepted: " + bad);
            }
            string archive = Path.Combine(temporary, "unsafe.zip");
            using (ZipArchive zip = ZipFile.Open(archive, ZipArchiveMode.Create)) { using (var writer = new StreamWriter(zip.CreateEntry("../escape.txt").Open())) writer.Write("no"); }
            bool zipRejected = false; try { SafeExtract(archive, Path.Combine(temporary, "unpacked")); } catch (InvalidDataException) { zipRejected = true; }
            if (!zipRejected || File.Exists(Path.Combine(temporary, "escape.txt"))) throw new Exception("Zip traversal test failed.");
            string testPython = FindOnPath("python.exe", "python3.exe").FirstOrDefault(ProbePython);
            if (testPython == null) Console.WriteLine("tar.gz self-test skipped: no system Python 3.10+ found.");
            else
            {
                const string fixtures = @"import io, pathlib, sys, tarfile
root = pathlib.Path(sys.argv[1])
cases = [('valid', 'package/bin/data.txt', tarfile.REGTYPE), ('parent', '../escape.txt', tarfile.REGTYPE), ('nested', 'package/../../escape.txt', tarfile.REGTYPE), ('absolute', '/escape.txt', tarfile.REGTYPE), ('ads', 'package/file:stream', tarfile.REGTYPE), ('symlink', 'package/link', tarfile.SYMTYPE), ('hardlink', 'package/link', tarfile.LNKTYPE), ('device', 'package/device', tarfile.CHRTYPE), ('reserved', 'package/CON', tarfile.REGTYPE)]
for case, name, kind in cases:
    with tarfile.open(root / (case + '.tar.gz'), 'w:gz') as archive:
        entry = tarfile.TarInfo(name)
        entry.type = kind
        if kind in (tarfile.SYMTYPE, tarfile.LNKTYPE):
            entry.linkname = '../../escape.txt'
        data = b'archive-test' if kind == tarfile.REGTYPE else b''
        entry.size = len(data)
        archive.addfile(entry, io.BytesIO(data))
";
                var created = RunProcess(testPython, new[] { "-I", "-X", "utf8", "-c", fixtures, temporary }, null, null, 15000, null);
                if (created.ExitCode != 0) throw new Exception("Tar test fixture creation failed: " + created.Output);
                string goodTarget = Path.Combine(temporary, "tar-valid");
                SafeExtractTarGzip(Path.Combine(temporary, "valid.tar.gz"), goodTarget, testPython);
                if (File.ReadAllText(Path.Combine(goodTarget, "package", "bin", "data.txt")) != "archive-test") throw new Exception("Tar file extraction test failed.");
                foreach (string item in new[] { "parent", "nested", "absolute", "ads", "symlink", "hardlink", "device", "reserved" })
                {
                    bool rejected = false;
                    try { SafeExtractTarGzip(Path.Combine(temporary, item + ".tar.gz"), Path.Combine(temporary, "tar-" + item), testPython); }
                    catch (InvalidDataException) { rejected = true; }
                    if (!rejected) throw new Exception("Unsafe tar entry accepted: " + item);
                }
                if (File.Exists(Path.Combine(temporary, "escape.txt"))) throw new Exception("Tar test wrote outside destination.");
                Console.WriteLine("tar.gz regular file, traversal, absolute path, stream, link and device checks passed.");
            }
            // Test files are retained in this clearly named temporary directory for diagnostics.
        }
    }

    public sealed class InstallerForm : Form
    {
        private readonly Options options;
        private readonly Label status;
        private readonly ProgressBar progress;
        private readonly TextBox output;
        private readonly Button install;
        private readonly Button openSample;
        private readonly Button copyPrompt;
        private readonly Button openLog;
        private readonly Button folder;
        private readonly Label destination;
        private bool working;
        private string logPath;
        private SetupResult result;

        public InstallerForm(Options value)
        {
            options = value;
            Text = "竖屏动效 Skill · 一键安装 " + Installer.Version;
            Font = new Font("Microsoft YaHei UI", 10F);
            BackColor = Color.FromArgb(247, 247, 250);
            StartPosition = FormStartPosition.CenterScreen;
            ClientSize = new Size(790, 620); MinimumSize = new Size(690, 550);
            var title = new Label { Text = "装好环境，直接开始剪辑", Font = new Font("Microsoft YaHei UI", 20F, FontStyle.Bold), AutoSize = false, Bounds = new Rectangle(24, 22, 730, 46), Anchor = AnchorStyles.Top | AnchorStyles.Left | AnchorStyles.Right };
            var description = new Label { Text = "自动检查并补齐 Python、Node.js/npm、FFmpeg 和渲染依赖，安装 Skill 并渲染示例。\n独立安装到当前用户目录，无需管理员权限；首次安装需要联网。", Bounds = new Rectangle(26, 78, 735, 52), Anchor = AnchorStyles.Top | AnchorStyles.Left | AnchorStyles.Right };
            destination = new Label { Text = "Skill 目录：" + options.SkillsDir, AutoEllipsis = true, Bounds = new Rectangle(26, 139, 590, 25), Anchor = AnchorStyles.Top | AnchorStyles.Left | AnchorStyles.Right };
            folder = new Button { Text = "更改目录…", Bounds = new Rectangle(630, 134, 128, 32), Anchor = AnchorStyles.Top | AnchorStyles.Right };
            folder.Click += delegate { using (var dialog = new FolderBrowserDialog { Description = "选择 Skills 父目录（将创建 portrait-editorial-explainer 子目录）", SelectedPath = options.SkillsDir }) if (dialog.ShowDialog(this) == DialogResult.OK) { options.SkillsDir = dialog.SelectedPath; destination.Text = "Skill 目录：" + options.SkillsDir; } };
            status = new Label { Text = "准备就绪。点击下方按钮开始。", Bounds = new Rectangle(26, 178, 732, 42), Anchor = AnchorStyles.Top | AnchorStyles.Left | AnchorStyles.Right };
            progress = new ProgressBar { Bounds = new Rectangle(26, 225, 732, 14), Minimum = 0, Maximum = 100, Anchor = AnchorStyles.Top | AnchorStyles.Left | AnchorStyles.Right };
            output = new TextBox { ReadOnly = true, Multiline = true, ScrollBars = ScrollBars.Both, WordWrap = false, BackColor = Color.White, Font = new Font("Consolas", 9F), Bounds = new Rectangle(26, 254, 732, 280), Anchor = AnchorStyles.Top | AnchorStyles.Bottom | AnchorStyles.Left | AnchorStyles.Right };
            install = new Button { Text = "安装并准备环境", Bounds = new Rectangle(26, 553, 180, 42), BackColor = Color.FromArgb(100, 71, 212), ForeColor = Color.White, FlatStyle = FlatStyle.Flat, Anchor = AnchorStyles.Bottom | AnchorStyles.Left };
            openSample = new Button { Text = "打开示例", Enabled = false, Bounds = new Rectangle(224, 553, 128, 42), Anchor = AnchorStyles.Bottom | AnchorStyles.Left };
            copyPrompt = new Button { Text = "复制调用指令", Enabled = false, Bounds = new Rectangle(369, 553, 150, 42), Anchor = AnchorStyles.Bottom | AnchorStyles.Left };
            openLog = new Button { Text = "打开日志", Enabled = false, Bounds = new Rectangle(536, 553, 128, 42), Anchor = AnchorStyles.Bottom | AnchorStyles.Left };
            install.Click += delegate { StartInstall(); };
            openSample.Click += delegate { if (result != null) OpenFile(result.sampleVideo); };
            openLog.Click += delegate { if (logPath != null) OpenFile(logPath); };
            copyPrompt.Click += delegate { Clipboard.SetText("使用 $portrait-editorial-explainer，按这套风格剪辑我的视频。根据内容重新设计物件、镜头和转场，先生成 10–15 秒开头。先读取 Skill 中的一键安装运行说明并使用已准备的本机运行环境。"); status.Text = "调用指令已复制。重新打开 Codex 会话，提供素材并粘贴即可。"; };
            Controls.AddRange(new Control[] { title, description, destination, folder, status, progress, output, install, openSample, copyPrompt, openLog });
            FormClosing += delegate(object sender, FormClosingEventArgs args) { if (working) { args.Cancel = true; status.Text = "正在准备环境，请等本次操作结束后关闭。下载/渲染进度见下方日志。"; } };
        }
        private void OpenFile(string path)
        {
            try { Process.Start(new ProcessStartInfo(path) { UseShellExecute = true }); }
            catch (Exception error) { MessageBox.Show(this, "无法打开文件：" + error.Message + "\n" + path, "文件位置", MessageBoxButtons.OK, MessageBoxIcon.Information); }
        }
        private async void StartInstall()
        {
            working = true; install.Enabled = false; folder.Enabled = false; openSample.Enabled = false; copyPrompt.Enabled = false; output.Clear(); progress.Value = 0;
            try
            {
                await Task.Run(delegate {
                    using (var engine = new Installer(options))
                    {
                        logPath = engine.LogPath;
                        BeginInvoke((Action)delegate { openLog.Enabled = true; });
                        engine.Progress += delegate(int value, string message) {
                            BeginInvoke((Action)delegate {
                                progress.Value = value; status.Text = message;
                                output.AppendText(message + Environment.NewLine);
                            });
                        };
                        engine.Install(); result = engine.Result;
                    }
                });
                progress.Value = 100; status.Text = "安装完成，示例已渲染。重新打开 Codex 会话，即可调用这个 Skill。";
                install.Text = "重新检查 / 修复"; openSample.Enabled = true; copyPrompt.Enabled = true;
            }
            catch (Exception error) { status.Text = "尚未完成安装，可以查看日志后重试。"; output.AppendText(error.Message + Environment.NewLine); install.Text = "重试安装"; }
            finally { working = false; install.Enabled = true; folder.Enabled = true; }
        }
    }
}
