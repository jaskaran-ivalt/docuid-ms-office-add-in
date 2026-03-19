param(
  [Parameter(Mandatory = $true)]
  [string]$ManifestPath,
  [string]$AddinId = "c42a66ec-73b7-459d-af77-4324c5454a40"
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

if (-not (Test-Path -LiteralPath $ManifestPath)) {
  throw "Manifest file not found at: $ManifestPath"
}

$officeVersions = @("15.0", "16.0")
$manifestFileName = "DocuID-$AddinId.xml"

foreach ($officeVersion in $officeVersions) {
  $wefDirectory = Join-Path -Path $env:LOCALAPPDATA -ChildPath "Microsoft\Office\$officeVersion\Wef"
  New-Item -Path $wefDirectory -ItemType Directory -Force | Out-Null

  $targetManifestPath = Join-Path -Path $wefDirectory -ChildPath $manifestFileName
  Copy-Item -LiteralPath $ManifestPath -Destination $targetManifestPath -Force

  # Word/Excel/PPT load sideloaded manifests from HKCU\...\WEF\Developer (name = add-in Id, data = manifest path).
  # File-only drops in Wef are not enough on many Office builds (same behavior as office-addin-dev-settings register).
  $developerRegPath = "HKCU:\Software\Microsoft\Office\$officeVersion\WEF\Developer"
  New-Item -Path $developerRegPath -Force | Out-Null
  New-ItemProperty -Path $developerRegPath -Name $AddinId -Value $targetManifestPath -PropertyType String -Force | Out-Null
}

Write-Output "iVALT Docuid add-in registered for current user (manifest + WEF Developer registry)."
