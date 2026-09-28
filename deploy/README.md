# EduKid on the pricelens server

| What | Where |
|---|---|
| Code | `~/edukid` (branch synced from the repo) |
| Process | pm2 `edukid-api` — `node apps/api/src/server.ts` on 127.0.0.1:4410; also serves `apps/web/dist` and `/books/` |
| Env | `DATA_DIR=~/edukid-data WEB_DIR=~/edukid/apps/web/dist BOOKS_DIR=~/edukid-site/books NODE_ENV=production PORT=4410 HOST=127.0.0.1` |
| Data | `~/edukid-data/edukid.sqlite` + `~/edukid-data/recordings/<child>/` |
| Books | `~/edukid-site/books/*.pdf` |
| HTTPS | shared `pricelens-proxy` (host network); vhost `~/pricelens/docker/nginx-upstreams/edukid.conf` (copy: `nginx-edukid.conf`) |
| Certificate | `edukid.130-110-124-121.sslip.io`, renewed by user timer `edukid-cert.timer` → `renew-cert.sh` |

**Deploy:** sync the code, then `deploy/deploy.sh` (tests, builds, restarts pm2, checks the live bundle).
Changing the vhost: edit the file, `podman exec pricelens-proxy nginx -t && podman exec pricelens-proxy nginx -s reload`.

**E2E / screenshots:** `e2e/run-on-server.sh` (throwaway instance on :4411, Playwright in podman).

**Backup:**
`node -e "new (require('node:sqlite').DatabaseSync)(process.argv[1]).exec(\"VACUUM INTO '\"+process.argv[2]+\"'\")" ~/edukid-data/edukid.sqlite ~/edukid-backup-$(date +%F).sqlite`
