param(
  [string]$IssPath = "$PSScriptRoot\DocuIDInstaller.iss"
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

if (-not (Test-Path -LiteralPath $IssPath)) {
  throw "Inno Setup script not found at: $IssPath"
}

$candidatePaths = @(
  (Join-Path -Path ${env:ProgramFiles(x86)} -ChildPath "Inno Setup 6\ISCC.exe"),
  (Join-Path -Path $env:ProgramFiles -ChildPath "Inno Setup 6\ISCC.exe"),
  (Join-Path -Path $env:LocalAppData -ChildPath "Programs\Inno\ISCC.exe")
)

$isccFromPath = Get-Command -Name "iscc.exe" -ErrorAction SilentlyContinue
if ($isccFromPath) {
  $candidatePaths = @($isccFromPath.Source) + $candidatePaths
}

$isccPath = $candidatePaths | Where-Object { $_ -and (Test-Path -LiteralPath $_) } | Select-Object -First 1

if (-not $isccPath) {
  throw "Inno Setup Compiler (ISCC.exe) not found. Install Inno Setup 6 and retry."
}

& $isccPath $IssPath

if ($LASTEXITCODE -ne 0) {
  throw "Installer build failed with exit code $LASTEXITCODE."
}

Write-Output "Installer build completed successfully."
