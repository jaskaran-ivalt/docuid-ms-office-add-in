param(
  [string]$SharedInstallRoot = "$env:ProgramData\DocuID\OfficeAddin",
  [string]$AddinId = "c42a66ec-73b7-459d-af77-4324c5454a40"
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

function Remove-PathIfExists {
  param([Parameter(Mandatory = $true)][string]$PathToRemove)

  if (Test-Path -LiteralPath $PathToRemove) {
    Remove-Item -LiteralPath $PathToRemove -Recurse -Force
  }
}

$activeSetupRegPath = "HKLM:\SOFTWARE\Microsoft\Active Setup\Installed Components\DocuID.OfficeAddin"
if (Test-Path -LiteralPath $activeSetupRegPath) {
  Remove-Item -LiteralPath $activeSetupRegPath -Recurse -Force
}

$manifestFileName = "DocuID-$AddinId.xml"
$userProfiles = Get-ChildItem -Path "$env:SystemDrive\Users" -Directory -ErrorAction SilentlyContinue

foreach ($profile in $userProfiles) {
  foreach ($officeVersion in @("15.0", "16.0")) {
    $wefPath = Join-Path -Path $profile.FullName -ChildPath "AppData\Local\Microsoft\Office\$officeVersion\Wef\$manifestFileName"
    if (Test-Path -LiteralPath $wefPath) {
      Remove-Item -LiteralPath $wefPath -Force
    }
  }
}

foreach ($officeVersion in @("15.0", "16.0")) {
  $currentUserWefPath = Join-Path -Path $env:LOCALAPPDATA -ChildPath "Microsoft\Office\$officeVersion\Wef\$manifestFileName"
  if (Test-Path -LiteralPath $currentUserWefPath) {
    Remove-Item -LiteralPath $currentUserWefPath -Force
  }

  $devPath = "HKCU:\Software\Microsoft\Office\$officeVersion\WEF\Developer"
  if (Test-Path -LiteralPath $devPath) {
    Remove-ItemProperty -Path $devPath -Name $AddinId -ErrorAction SilentlyContinue
  }
}

Remove-PathIfExists -PathToRemove $SharedInstallRoot

Write-Output "iVALT Docuid add-in uninstall cleanup completed."
