param()
$root = Split-Path -Parent $MyInvocation.MyCommand.Definition
$src1 = "wallet-voice-app - copia/frontend"
$src2 = "wallet-voice-app - copia/backend"
Write-Host "Moving frontend to frontend/..."
New-Item -ItemType Directory -Force -Path "$root\frontend" | Out-Null
if (Test-Path $src1) {
  Copy-Item -Path "$src1\*" -Destination "$root\frontend" -Recurse -Force
  Write-Host "Frontend moved."
} else {
  Write-Host "Warning: $src1 not found"
}
Write-Host "Moving backend to backend/..."
New-Item -ItemType Directory -Force -Path "$root\backend" | Out-Null
if (Test-Path $src2) {
  Copy-Item -Path "$src2\*" -Destination "$root\backend" -Recurse -Force
  Write-Host "Backend moved."
} else {
  Write-Host "Warning: $src2 not found"
}
Write-Host "Cleaning old dirs..."
Remove-Item -Recurse -Force "$src1" -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force "$src2" -ErrorAction SilentlyContinue
