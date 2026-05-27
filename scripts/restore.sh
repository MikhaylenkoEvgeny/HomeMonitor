#!/usr/bin/env bash
set -euo pipefail

: "${DATABASE_URL:?DATABASE_URL is required}"

backup_file="${1:?Usage: scripts/restore.sh <backup.sql.gz>}"
gzip -dc "$backup_file" | psql "$DATABASE_URL"
