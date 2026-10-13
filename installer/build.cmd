@echo off
setlocal
set "PORTRAIT_CSC=%WINDIR%\Microsoft.NET\Framework64\v4.0.30319\csc.exe"
if not exist "%PORTRAIT_CSC%" set "PORTRAIT_CSC=%WINDIR%\Microsoft.NET\Framework\v4.0.30319\csc.exe"
if not exist "%PORTRAIT_CSC%" (
  echo Cannot find the Windows .NET Framework compiler.
  echo Use the prebuilt OneClick-Install.exe from the complete release ZIP.
  exit /b 1
)
"%PORTRAIT_CSC%" /nologo /target:winexe /platform:x64 /optimize+ /utf8output /win32manifest:"%~dp0app.manifest" /out:"%~dp0..\OneClick-Install.exe" /reference:System.dll /reference:System.Core.dll /reference:System.Drawing.dll /reference:System.Windows.Forms.dll /reference:System.Web.Extensions.dll /reference:System.IO.Compression.dll /reference:System.IO.Compression.FileSystem.dll "%~dp0OneClickInstaller.cs"
if errorlevel 1 (
  echo Build failed. No installer was launched.
  exit /b 1
)
echo OneClick-Install.exe is ready.
exit /b 0
