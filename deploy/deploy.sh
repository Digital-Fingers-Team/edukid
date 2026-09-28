#!/usr/bin/env bash
# Run on the pricelens server from ~/edukid after syncing the code:
# install, test, build, and restart the API (which serves the web build — always restart after a build).
set -euo pipefail
cd "$(dirname "$0")/.."
npm ci
npm test
npm run build -w apps/web
node apps/web/scripts/check-build.mjs
pm2 restart edukid-api --update-env
sleep 3
B=https://edukid.130-110-124-121.sslip.io
curl -sf "$B/api/health" >/dev/null
js=$(curl -s "$B/" | grep -o '/assets/index-[^"]*\.js' | head -1)
curl -sf -o /dev/null -w '%{content_type}\n' "$B$js" | grep -q javascript
echo "deployed: $B ($js)"
