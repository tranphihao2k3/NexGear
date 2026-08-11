#!/usr/bin/env bash
# ============================================================
# Deploy script — work around 25 MiB asset limit on free plan
# Loại trừ scan-agent.exe (65 MB) ra khỏi assets bundle vì vượt
# giới hạn Workers Free. File này vẫn serve từ cPanel gốc.
# ============================================================
set -e

echo "==> Xóa scan-agent.exe khỏi assets bundle..."
if [ -f .open-next/assets/scan-agent.exe ]; then
  rm .open-next/assets/scan-agent.exe
  echo "    OK"
else
  echo "    (đã được loại trừ)"
fi

echo "==> Deploy lên Cloudflare Workers..."
npx wrangler deploy
