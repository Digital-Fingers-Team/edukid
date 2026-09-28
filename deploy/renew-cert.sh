#!/usr/bin/env bash
# Renew the EduKid certificate (webroot) and reload pricelens-proxy (which terminates TLS for EduKid) if it changed.
set -euo pipefail
NAME=edukid.130-110-124-121.sslip.io
CONF="$HOME/pricelens/docker/certbot/conf"
WWW="$HOME/pricelens/docker/certbot/www"
sum() { sha256sum "$CONF/live/$NAME/fullchain.pem" 2>/dev/null | cut -d" " -f1; }
before="$(sum)"
podman run --rm -v "$CONF:/etc/letsencrypt:z" -v "$WWW:/var/www/certbot:z" \
  docker.io/certbot/certbot:latest renew --cert-name "$NAME" --webroot -w /var/www/certbot --quiet
[[ "$(sum)" != "$before" ]] && podman exec pricelens-proxy nginx -s reload && echo renewed || echo "not due"
