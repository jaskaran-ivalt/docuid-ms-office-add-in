# Run this script as the Word user (no administrator required) if the ribbon add-in does not appear
# after a machine-wide install (for example, when an admin installed while you were already signed in).

param(
  [string]$ManifestPath = "$env:ProgramData\DocuID\OfficeAddin\manifest.xml",
  [string]$CatalogScript = "$env:ProgramData\DocuID\OfficeAddin\Set-DocuIDCatalogForCurrentUser.ps1"
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

if (-not (Test-Path -LiteralPath $ManifestPath)) {
  throw "Manifest not found: $ManifestPath. Install the add-in as administrator first."
}
if (-not (Test-Path -LiteralPath $CatalogScript)) {
  throw "Setup script not found: $CatalogScript. Reinstall the add-in."
}

& powershell.exe -NoProfile -ExecutionPolicy Bypass -File $CatalogScript -ManifestPath $ManifestPath
Write-Output "Done. Close all Word windows, reopen Word, and check the Home tab for iVALT Docuid."
