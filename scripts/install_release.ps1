# Downloads a verified complete release and runs installation without GUI clicks.
[CmdletBinding()]
param(
    [ValidatePattern('^v[0-9]+\.[0-9]+\.[0-9]+$')][string]$ReleaseTag = 'v3.4.0',
    [string]$AppHome,
    [string]$SkillsDir,
    [switch]$ForcePortable,
    [switch]$PrepareOnly
)
$ErrorActionPreference = 'Stop'
$ProgressPreference = 'SilentlyContinue'
if ([Environment]::OSVersion.Platform -ne [PlatformID]::Win32NT -or -not [Environment]::Is64BitOperatingSystem) {
    throw 'This automatic installer requires Windows 10/11 x64.'
}
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
$repository = '3105059695-rgb/portrait-editorial-explainer'
$packageName = "portrait-editorial-explainer-$ReleaseTag.zip"
$workRoot = Join-Path ([IO.Path]::GetTempPath()) ('portrait-install-' + [Guid]::NewGuid().ToString('N'))
[IO.Directory]::CreateDirectory($workRoot) | Out-Null
Write-Host "Downloading $ReleaseTag. Work directory: $workRoot"
$headers = @{ 'User-Agent' = 'PortraitEditorialExplainer-AutoInstall' }
$releaseBase = "https://github.com/$repository/releases/download/$ReleaseTag"
$zipPath = Join-Path $workRoot $packageName
$hashPath = Join-Path $workRoot 'SHA256SUMS.txt'
Invoke-WebRequest -UseBasicParsing -Uri "$releaseBase/SHA256SUMS.txt" -OutFile $hashPath -Headers $headers
Invoke-WebRequest -UseBasicParsing -Uri "$releaseBase/$packageName" -OutFile $zipPath -Headers $headers
$hashLines = @(Get-Content -LiteralPath $hashPath | Where-Object { $_ -match ('^[a-fA-F0-9]{64}\s+\*?' + [Regex]::Escape($packageName) + '$') })
if ($hashLines.Count -ne 1) { throw 'The ZIP has no unique SHA-256 entry.' }
$expected = ($hashLines[0] -split '\s+')[0]
if ((Get-FileHash -LiteralPath $zipPath -Algorithm SHA256).Hash -ne $expected) { throw 'SHA-256 mismatch. The package will not be executed.' }
Add-Type -AssemblyName System.IO.Compression.FileSystem
$extracted = Join-Path $workRoot 'package'
$zip = [IO.Compression.ZipFile]::OpenRead($zipPath)
try {
    $total = 0L
    foreach ($entry in $zip.Entries) {
        $total += $entry.Length
        if ($total -gt 2GB) { throw 'Unexpected archive size.' }
        $relative = $entry.FullName.Replace('/', '\')
        if ([IO.Path]::IsPathRooted($relative) -or $relative.Contains(':') -or ($relative.Split('\') -contains '..')) { throw 'Unsafe archive path.' }
        if ((($entry.ExternalAttributes -shr 16) -band 0xF000) -eq 0xA000) { throw 'Archive symlinks are not supported.' }
    }
} finally { $zip.Dispose() }
[IO.Compression.ZipFile]::ExtractToDirectory($zipPath, $extracted)
$source = Join-Path $extracted "portrait-editorial-explainer-$ReleaseTag"
$exe = Join-Path $source 'OneClick-Install.exe'
if (-not (Test-Path -LiteralPath $exe -PathType Leaf) -or -not (Test-Path -LiteralPath (Join-Path $source 'SKILL.md'))) { throw 'Complete installer not found in release.' }
Write-Host "Verified and extracted: $source"
if ($PrepareOnly) { return }
function ConvertTo-ProcessArgument([string]$Value) {
    if ($Value.Contains('"')) { throw 'Quotes are not allowed in installation paths.' }
    return '"' + $Value.TrimEnd('\') + '"'
}
$arguments = @('--headless', '--source', (ConvertTo-ProcessArgument $source))
if ($AppHome) { $arguments += @('--app-home', (ConvertTo-ProcessArgument $AppHome)) }
if ($SkillsDir) { $arguments += @('--skills-dir', (ConvertTo-ProcessArgument $SkillsDir)) }
if ($ForcePortable) { $arguments += '--force-portable' }
$info = [Diagnostics.ProcessStartInfo]::new()
$info.FileName = $exe
$info.Arguments = $arguments -join ' '
$info.UseShellExecute = $false
$info.CreateNoWindow = $true
$process = [Diagnostics.Process]::Start($info)
$process.WaitForExit()
if ($process.ExitCode -ne 0) { throw "Installation failed with exit code $($process.ExitCode). Check the installation log." }
$runtimeRoot = if ($AppHome) { [IO.Path]::GetFullPath($AppHome) } else { Join-Path ([Environment]::GetFolderPath('LocalApplicationData')) 'PortraitEditorialExplainer' }
$resultPath = Join-Path $runtimeRoot 'setup-result.json'
$result = Get-Content -LiteralPath $resultPath -Raw | ConvertFrom-Json
if ($result.status -ne 'ready' -or -not (Test-Path -LiteralPath $result.sampleVideo -PathType Leaf) -or -not (Test-Path -LiteralPath (Join-Path $result.skillRoot 'SKILL.md') -PathType Leaf)) { throw 'The installer did not produce a ready result and sample.' }
Write-Host 'READY: Skill installed, dependencies prepared, sample rendered and decoded.'
Write-Host "RESULT: $resultPath"
Write-Host "SKILL: $($result.skillRoot)"
Write-Host "SAMPLE: $($result.sampleVideo)"
Write-Host 'Open a new Codex conversation and invoke $portrait-editorial-explainer with your materials.'
