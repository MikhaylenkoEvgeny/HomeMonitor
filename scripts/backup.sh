#!/usr/bin/env bash
set -euo pipefail

: "${DATABASE_URL:?DATABASE_URL is required}"
: "${BACKUP_DIR:=./data/backups}"

mkdir -p "$BACKUP_DIR"
stamp="$(date -u +%Y%m%dT%H%M%SZ)"
pg_dump "$DATABASE_URL" | gzip > "$BACKUP_DIR/homemonitor-$stamp.sql.gz"
echo "Backup written to $BACKUP_DIR/homemonitor-$stamp.sql.gz"
