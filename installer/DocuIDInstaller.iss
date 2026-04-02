#define MyAppName "iVALT Docuid Word Add-in"
#define MyAppVersion "1.0.2"
#define MyAppPublisher "iVALT"
#define MyAppExeName "iVALTDocuidInstaller.exe"

[Setup]
AppId={{C42A66EC-73B7-459D-AF77-4324C5454A40}
AppName={#MyAppName}
AppVersion={#MyAppVersion}
AppPublisher={#MyAppPublisher}
DefaultDirName={commonappdata}\DocuID\OfficeAddin
DisableDirPage=yes
DisableProgramGroupPage=yes
OutputDir=..\dist\installer
OutputBaseFilename=iVALT-Docuid-WordAddin-Installer-{#MyAppVersion}
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
Source: "Register-ForCurrentUser.ps1"; DestDir: "{commonappdata}\DocuID\OfficeAddin"; Flags: ignoreversion

[Run]
Filename: "{sys}\WindowsPowerShell\v1.0\powershell.exe"; Parameters: "-NoProfile -ExecutionPolicy Bypass -File ""{commonappdata}\DocuID\OfficeAddin\Install-DocuIDAddin.ps1"" -ManifestSourcePath ""{commonappdata}\DocuID\OfficeAddin\manifest-production.xml"" -SharedInstallRoot ""{commonappdata}\DocuID\OfficeAddin"""; Flags: runhidden waituntilterminated
; Per-user registry (HKCU) for whoever launched setup — needed when the admin step above targeted a different account.
Filename: "{sys}\WindowsPowerShell\v1.0\powershell.exe"; Parameters: "-NoProfile -ExecutionPolicy Bypass -File ""{commonappdata}\DocuID\OfficeAddin\Register-ForCurrentUser.ps1"""; Flags: postinstall runasoriginaluser waituntilterminated; Description: "Register the add-in for the account that ran this installer (recommended)"

[UninstallRun]
Filename: "{sys}\WindowsPowerShell\v1.0\powershell.exe"; Parameters: "-NoProfile -ExecutionPolicy Bypass -File ""{commonappdata}\DocuID\OfficeAddin\Uninstall-DocuIDAddin.ps1"" -SharedInstallRoot ""{commonappdata}\DocuID\OfficeAddin"""; Flags: runhidden waituntilterminated
