param(
  [Parameter(Mandatory = $true)]
  [string]$ManifestSourcePath,
  [string]$SharedInstallRoot = "$env:ProgramData\DocuID\OfficeAddin"
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

function Assert-Admin {
  $currentIdentity = [Security.Principal.WindowsIdentity]::GetCurrent()
  $principal = New-Object Security.Principal.WindowsPrincipal($currentIdentity)
  if (-not $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
    throw "Administrator permissions are required."
  }
}

Assert-Admin

if (-not (Test-Path -LiteralPath $ManifestSourcePath)) {
  throw "Manifest source file not found at: $ManifestSourcePath"
}

New-Item -Path $SharedInstallRoot -ItemType Directory -Force | Out-Null

$manifestPath = Join-Path -Path $SharedInstallRoot -ChildPath "manifest.xml"
$currentUserSetupScriptPath = Join-Path -Path $SharedInstallRoot -ChildPath "Set-DocuIDCatalogForCurrentUser.ps1"
$addinId = "c42a66ec-73b7-459d-af77-4324c5454a40"
$manifestFileName = "DocuID-$addinId.xml"

Copy-Item -LiteralPath $ManifestSourcePath -Destination $manifestPath -Force

$scriptSourcePath = Join-Path -Path $PSScriptRoot -ChildPath "Set-DocuIDCatalogForCurrentUser.ps1"
if (-not (Test-Path -LiteralPath $scriptSourcePath)) {
  throw "Current user setup script is missing at: $scriptSourcePath"
}
Copy-Item -LiteralPath $scriptSourcePath -Destination $currentUserSetupScriptPath -Force

$activeSetupRegPath = "HKLM:\SOFTWARE\Microsoft\Active Setup\Installed Components\DocuID.OfficeAddin"
$stubPath = "powershell.exe -NoProfile -ExecutionPolicy Bypass -File `"$currentUserSetupScriptPath`" -ManifestPath `"$manifestPath`""

New-Item -Path $activeSetupRegPath -Force | Out-Null
New-ItemProperty -Path $activeSetupRegPath -Name "(Default)" -PropertyType String -Value "iVALT Docuid Office Add-in User Bootstrap" -Force | Out-Null
New-ItemProperty -Path $activeSetupRegPath -Name "Version" -PropertyType String -Value "1,0,2,0" -Force | Out-Null
New-ItemProperty -Path $activeSetupRegPath -Name "StubPath" -PropertyType String -Value $stubPath -Force | Out-Null
New-ItemProperty -Path $activeSetupRegPath -Name "IsInstalled" -PropertyType DWord -Value 1 -Force | Out-Null

# Pre-provision all existing local user profiles on the machine.
$excludedProfiles = @("All Users", "Default", "Default User", "Public")
$userProfiles = Get-ChildItem -Path "$env:SystemDrive\Users" -Directory -ErrorAction SilentlyContinue
foreach ($profile in $userProfiles) {
  if ($excludedProfiles -contains $profile.Name) {
    continue
  }

  $profileLocalAppData = Join-Path -Path $profile.FullName -ChildPath "AppData\Local"
  if (-not (Test-Path -LiteralPath $profileLocalAppData)) {
    continue
  }

  foreach ($officeVersion in @("15.0", "16.0")) {
    $profileWefPath = Join-Path -Path $profileLocalAppData -ChildPath "Microsoft\Office\$officeVersion\Wef"
    New-Item -Path $profileWefPath -ItemType Directory -Force | Out-Null
    $profileManifestTarget = Join-Path -Path $profileWefPath -ChildPath $manifestFileName
    Copy-Item -LiteralPath $manifestPath -Destination $profileManifestTarget -Force
  }
}

# Ensure the add-in is available for the installing user immediately.
& powershell.exe -NoProfile -ExecutionPolicy Bypass -File $currentUserSetupScriptPath -ManifestPath $manifestPath

Write-Output "iVALT Docuid add-in installation completed successfully."
