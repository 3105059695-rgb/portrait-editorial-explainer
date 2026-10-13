@echo off
setlocal
if exist "%~dp0OneClick-Install.exe" goto launch
set "PORTRAIT_CSC=%WINDIR%\Microsoft.NET\Framework64\v4.0.30319\csc.exe"
if not exist "%PORTRAIT_CSC%" set "PORTRAIT_CSC=%WINDIR%\Microsoft.NET\Framework\v4.0.30319\csc.exe"
if not exist "%PORTRAIT_CSC%" goto compiler_missing
rem Compile directly: CALL would expand percent signs in the extracted folder twice.
"%PORTRAIT_CSC%" /nologo /target:winexe /platform:x64 /optimize+ /utf8output /win32manifest:"%~dp0installer\app.manifest" /out:"%~dp0OneClick-Install.exe" /reference:System.dll /reference:System.Core.dll /reference:System.Drawing.dll /reference:System.Windows.Forms.dll /reference:System.Web.Extensions.dll /reference:System.IO.Compression.dll /reference:System.IO.Compression.FileSystem.dll "%~dp0installer\OneClickInstaller.cs"
if errorlevel 1 goto build_failed
if not exist "%~dp0OneClick-Install.exe" goto build_failed
:launch
start "Portrait Editorial Installer" "%~dp0OneClick-Install.exe" --source "%~dp0."
if errorlevel 1 goto launch_failed
exit /b 0
:compiler_missing
echo Cannot find the Windows .NET Framework compiler.
echo Download and extract the complete release ZIP with OneClick-Install.exe.
pause
exit /b 1
:build_failed
echo Build failed. Installation has not completed and no installer was launched.
echo Please download and extract the complete release ZIP, then try again.
pause
exit /b 1
:launch_failed
echo Could not open the installer. Installation has not completed.
pause
exit /b 1
