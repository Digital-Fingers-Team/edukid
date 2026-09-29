#!/usr/bin/env bash
# Run the Playwright suite on the pricelens server against a throwaway EduKid instance.
# Usage (from ~/edukid on the server, after `npm run build -w apps/web`): e2e/run-on-server.sh [playwright args…]
set -uo pipefail
cd "$(dirname "$0")/.."
DATA=$(mktemp -d /tmp/edukid-e2e.XXXXXX)
PORT=4411
DATA_DIR=$DATA WEB_DIR=$PWD/apps/web/dist BOOKS_DIR=$HOME/edukid-site/books PORT=$PORT HOST=127.0.0.1 \
  node apps/api/src/server.ts > "$DATA/api.log" 2>&1 &
API=$!
trap 'kill $API 2>/dev/null; rm -rf "$DATA"' EXIT
for _ in $(seq 30); do curl -sf "http://127.0.0.1:$PORT/api/health" >/dev/null && break; sleep 1; done
mkdir -p test-results/screens
podman run --rm --network host -v "$PWD:/w:z" -w /w -e E2E_BASE="http://127.0.0.1:$PORT" -e SCREENS_DIR=/w/test-results/screens \
  mcr.microsoft.com/playwright:v1.63.0-noble npx playwright test -c e2e/playwright.config.ts "$@"
