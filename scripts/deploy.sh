#!/usr/bin/env bash
# Build the arm64 image on this machine, ship it to the Oracle VPS and restart only the app.
# The `app` service is defined in n8n-automation-infra (stack/docker-compose.yml); run that
# repo's deploy.sh once after adding it. This script never touches the VPS's ~/n8n/.env.
set -euo pipefail
cd "$(dirname "${BASH_SOURCE[0]}")/.."

HOST="${DEPLOY_HOST:-oracle-n8n}"   # SSH host alias for the VPS
[[ -f .env.production ]] || { echo "missing .env.production: copy .env.example and fill the AI_* keys" >&2; exit 1; }

echo "→ building linux/arm64 image"
docker buildx build --platform linux/arm64 -t english-tutor:latest --load .

echo "→ shipping image to $HOST"
docker save english-tutor:latest | gzip | ssh "$HOST" 'gunzip | docker load'
scp -q .env.production "$HOST:n8n/english-tutor.env"

echo "→ restarting app (runs prisma migrate deploy on start)"
ssh "$HOST" 'chmod 600 ~/n8n/english-tutor.env && cd ~/n8n \
  && docker compose up -d app && docker image prune -f >/dev/null && docker compose ps app'
