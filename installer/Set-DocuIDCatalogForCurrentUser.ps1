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

$officeVersions = @("16.0")
$manifestFileName = "DocuID-$AddinId.xml"

foreach ($officeVersion in $officeVersions) {
  $wefDirectory = Join-Path -Path $env:LOCALAPPDATA -ChildPath "Microsoft\Office\$officeVersion\Wef"
  New-Item -Path $wefDirectory -ItemType Directory -Force | Out-Null

  $targetManifestPath = Join-Path -Path $wefDirectory -ChildPath $manifestFileName
  Copy-Item -LiteralPath $ManifestPath -Destination $targetManifestPath -Force
}

Write-Output "DocuID add-in manifest copied for current user."
