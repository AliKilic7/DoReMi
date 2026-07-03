#!/usr/bin/env bash
# Restores a backup created by db-backup.sh. DESTRUCTIVE: replaces current data.
#   npm run db:restore -- backups/doremi-<timestamp>.dump
set -euo pipefail

cd "$(dirname "$0")/.."

file="${1:?usage: db-restore.sh <backup-file.dump>}"
[[ -f "$file" ]] || { echo "✗ no such file: $file" >&2; exit 1; }

if [[ -z "${DATABASE_URL:-}" && -f server/.env ]]; then
  DATABASE_URL=$(grep -E '^DATABASE_URL=' server/.env | cut -d= -f2- | tr -d '"')
fi
: "${DATABASE_URL:?DATABASE_URL is not set}"
# pg tools reject Prisma's ?schema=… query parameter
DATABASE_URL="${DATABASE_URL%%\?*}"

read -r -p "This OVERWRITES the database with '$file'. Continue? [y/N] " answer
[[ "$answer" == "y" || "$answer" == "Y" ]] || { echo "aborted"; exit 1; }

pg_restore --clean --if-exists --no-owner --dbname="$DATABASE_URL" "$file"
echo "✓ restored from $file"
