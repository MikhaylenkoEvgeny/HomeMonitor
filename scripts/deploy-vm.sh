#!/usr/bin/env bash
set -euo pipefail

: "${DEPLOY_HOST:?DEPLOY_HOST is required}"
: "${DEPLOY_USER:=ubuntu}"
: "${DEPLOY_PATH:=/opt/homemonitor}"

ssh "$DEPLOY_USER@$DEPLOY_HOST" "mkdir -p '$DEPLOY_PATH'"
rsync -az --delete \
  --exclude node_modules \
  --exclude .git \
  --exclude .next \
  --exclude dist \
  ./ "$DEPLOY_USER@$DEPLOY_HOST:$DEPLOY_PATH/"
ssh "$DEPLOY_USER@$DEPLOY_HOST" "cd '$DEPLOY_PATH' && docker compose -f infra/docker/docker-compose.yml up -d --build"
