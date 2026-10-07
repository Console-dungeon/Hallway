#!/usr/bin/env bash
# Runs ON THE SERVER as the `deploy` user, called by .github/workflows/deploy.yml.
# Usage: remote-deploy.sh <qa|prod> <image-tag>
# Expects the repo's deploy/ files already copied to /srv/hallway/_incoming/.
set -euo pipefail

STACK="$1"
IMAGE_TAG="$2"
ROOT="${HALLWAY_ROOT:-/srv/hallway}"
INCOMING="$ROOT/_incoming"

case "$STACK" in qa | prod) ;; *) echo "Unknown stack: $STACK" >&2; exit 1 ;; esac
for f in "$ROOT/edge/.env" "$ROOT/$STACK/.env"; do
  [ -f "$f" ] || { echo "Missing $f – create it first (see deploy/README.md)" >&2; exit 1; }
done

docker network inspect edge >/dev/null 2>&1 || docker network create edge

# Records deploy-managed keys in .env, so plain `docker compose ps|logs` works on the server
set_env() {
  sed -i "/^$1=/d" .env
  printf '%s=%s\n' "$1" "$2" >> .env
}

echo "==> Edge (Caddy)"
install -m 644 "$INCOMING/edge/docker-compose.yml" "$INCOMING/edge/Caddyfile" "$ROOT/edge/"
cd "$ROOT/edge"
set_env COMPOSE_PROJECT_NAME hallway-edge
docker compose up -d
# Pick up Caddyfile changes without dropping connections
docker compose exec -T caddy caddy reload --config /etc/caddy/Caddyfile

echo "==> Stack $STACK, images $IMAGE_TAG"
install -m 644 "$INCOMING/docker-compose.yml" "$ROOT/$STACK/"
cd "$ROOT/$STACK"
export STACK IMAGE_TAG COMPOSE_PROJECT_NAME="hallway-$STACK"
compose() { docker compose "$@"; }

# sha-* tags never change, so only images not yet on the server are downloaded
compose pull --policy missing
compose up -d --wait postgres
echo "==> Database migrations"
compose run --rm api node dist/migrate.js
compose up -d --wait --remove-orphans
# Only after a successful start: remember what is running
set_env COMPOSE_PROJECT_NAME "hallway-$STACK"
set_env STACK "$STACK"
set_env IMAGE_TAG "$IMAGE_TAG"

echo "==> Cleanup"
docker image prune -f >/dev/null
rm -rf "$INCOMING"
echo "==> Deployed $STACK ($IMAGE_TAG)"
