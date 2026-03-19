#define MyAppName "DocuID Word Add-in"
#define MyAppVersion "1.0.0"
#define MyAppPublisher "DocuID"
#define MyAppExeName "DocuIDInstaller.exe"

[Setup]
AppId={{C42A66EC-73B7-459D-AF77-4324C5454A40}
AppName={#MyAppName}
AppVersion={#MyAppVersion}
AppPublisher={#MyAppPublisher}
DefaultDirName={commonappdata}\DocuID\OfficeAddin
DisableDirPage=yes
DisableProgramGroupPage=yes
OutputDir=..\dist\installer
OutputBaseFilename=DocuID-WordAddin-Installer
Compression=lzma
SolidCompression=yes
ArchitecturesInstallIn64BitMode=x64compatible
PrivilegesRequired=admin
WizardStyle=modern
UninstallDisplayIcon={sys}\WindowsPowerShell\v1.0\powershell.exe

[Files]
Source: "..\manifest-production.xml"; DestDir: "{commonappdata}\DocuID\OfficeAddin"; DestName: "manifest-production.xml"; Flags: ignoreversion
Source: "Install-DocuIDAddin.ps1"; DestDir: "{commonappdata}\DocuID\OfficeAddin"; Flags: ignoreversion
Source: "Uninstall-DocuIDAddin.ps1"; DestDir: "{commonappdata}\DocuID\OfficeAddin"; Flags: ignoreversion
Source: "Set-DocuIDCatalogForCurrentUser.ps1"; DestDir: "{commonappdata}\DocuID\OfficeAddin"; Flags: ignoreversion

[Run]
Filename: "{sys}\WindowsPowerShell\v1.0\powershell.exe"; Parameters: "-NoProfile -ExecutionPolicy Bypass -File ""{commonappdata}\DocuID\OfficeAddin\Install-DocuIDAddin.ps1"" -ManifestSourcePath ""{commonappdata}\DocuID\OfficeAddin\manifest-production.xml"" -SharedInstallRoot ""{commonappdata}\DocuID\OfficeAddin"""; Flags: runhidden waituntilterminated

[UninstallRun]
Filename: "{sys}\WindowsPowerShell\v1.0\powershell.exe"; Parameters: "-NoProfile -ExecutionPolicy Bypass -File ""{commonappdata}\DocuID\OfficeAddin\Uninstall-DocuIDAddin.ps1"" -SharedInstallRoot ""{commonappdata}\DocuID\OfficeAddin"""; Flags: runhidden waituntilterminated
