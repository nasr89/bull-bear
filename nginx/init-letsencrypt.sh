#!/usr/bin/env bash
# One-time HTTPS bootstrap for the Bull & Bear VPS deploy.
# Usage:  bash nginx/init-letsencrypt.sh
# Reads DOMAIN and LETSENCRYPT_EMAIL from .env.production.
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
ENV_FILE="$ROOT_DIR/.env.production"
COMPOSE="docker compose -f $ROOT_DIR/docker-compose.prod.yml --env-file $ENV_FILE"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "ERROR: $ENV_FILE not found. Copy .env.production.example and fill it in first." >&2
  exit 1
fi

# shellcheck disable=SC1090
set -a; source "$ENV_FILE"; set +a

: "${DOMAIN:?DOMAIN not set in .env.production}"
: "${LETSENCRYPT_EMAIL:?LETSENCRYPT_EMAIL not set in .env.production}"

TEMPLATE_DIR="$ROOT_DIR/nginx/templates"
APP_TEMPLATE="$TEMPLATE_DIR/app.conf.template"
BOOTSTRAP_TEMPLATE="$TEMPLATE_DIR/app-bootstrap.conf.template"
APP_TEMPLATE_BACKUP="$TEMPLATE_DIR/app.conf.template.bak"

echo ">> Stage 1: start nginx with HTTP-only bootstrap config"
# Hide the real app.conf so nginx only loads the bootstrap during issuance.
if [[ -f "$APP_TEMPLATE" ]]; then
  mv "$APP_TEMPLATE" "$APP_TEMPLATE_BACKUP"
fi

cleanup() {
  if [[ -f "$APP_TEMPLATE_BACKUP" ]]; then
    mv "$APP_TEMPLATE_BACKUP" "$APP_TEMPLATE"
  fi
}
trap cleanup EXIT

$COMPOSE up -d nginx
echo ">> Waiting for nginx to be reachable on port 80…"
sleep 5

echo ">> Stage 2: request the Let's Encrypt certificate"
$COMPOSE run --rm --entrypoint "certbot certonly \
  --webroot -w /var/www/certbot \
  --email $LETSENCRYPT_EMAIL \
  -d $DOMAIN \
  --agree-tos --no-eff-email --non-interactive" certbot

echo ">> Stage 3: restore HTTPS config and reload nginx"
cleanup
trap - EXIT

$COMPOSE restart nginx
echo
echo "Done. Verify with:  curl -I https://$DOMAIN"
