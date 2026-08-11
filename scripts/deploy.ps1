# ============================================================
# Deploy script — work around 25 MiB asset limit on free plan
# Loại trừ scan-agent.exe (65 MB) ra khỏi assets bundle vì vượt
# giới hạn Workers Free. File này vẫn serve từ cPanel gốc.
# ============================================================
$ErrorActionPreference = 'Stop'

Write-Host "==> Xóa scan-agent.exe khỏi assets bundle..."
$assetPath = Join-Path $PSScriptRoot "..\.open-next\assets\scan-agent.exe"
if (Test-Path $assetPath) {
    Remove-Item $assetPath -Force
    Write-Host "    OK"
} else {
    Write-Host "    (đã được loại trừ)"
}

Write-Host "==> Deploy lên Cloudflare Workers..."
npx wrangler deploy
