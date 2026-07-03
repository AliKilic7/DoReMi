#!/usr/bin/env bash
# Creates a compressed logical backup of the DoReMi database.
#   npm run db:backup            → backups/doremi-<UTC timestamp>.dump
# DATABASE_URL is read from the environment, falling back to server/.env.
set -euo pipefail

cd "$(dirname "$0")/.."

if [[ -z "${DATABASE_URL:-}" && -f server/.env ]]; then
  DATABASE_URL=$(grep -E '^DATABASE_URL=' server/.env | cut -d= -f2- | tr -d '"')
fi
: "${DATABASE_URL:?DATABASE_URL is not set}"
# pg tools reject Prisma's ?schema=… query parameter
DATABASE_URL="${DATABASE_URL%%\?*}"

mkdir -p backups
out="backups/doremi-$(date -u +%Y%m%dT%H%M%SZ).dump"

pg_dump --format=custom --no-owner --dbname="$DATABASE_URL" --file="$out"
echo "✓ backup written to $out ($(du -h "$out" | cut -f1))"
