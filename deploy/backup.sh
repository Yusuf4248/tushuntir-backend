#!/usr/bin/env bash
# Daily backup of the database and the uploads folder (run as the app user, e.g. tushuntir).
#
#   cron (crontab -e):
#   30 3 * * * /home/tushuntir/app/deploy/backup.sh >> /home/tushuntir/app/logs/backup.log 2>&1
#
# Writes to BACKUP_DIR (default /var/backups/tushuntir) and keeps the newest KEEP (default 7):
#   tushuntir-db-<time>.dump          pg_dump custom format (compressed), without the vector
#                                     extension itself (it is created once by postgres)
#   tushuntir-uploads-<time>.tar.gz   UPLOADS_DIR without the tts/ cache (it is rebuilt)
# Database settings come from .env (DATABASE_URL or PG_*); nothing secret is printed.
#
# Restore (see docs/DEPLOY.md, Backups):
#   pm2 stop tushuntir-api
#   pg_restore --clean --if-exists --no-owner --dbname "<database url>" tushuntir-db-<time>.dump
#   tar -xzf tushuntir-uploads-<time>.tar.gz -C "$(dirname <UPLOADS_DIR>)"
#   pm2 start tushuntir-api
set -Eeuo pipefail
umask 077

APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$APP_DIR"
BACKUP_DIR="${BACKUP_DIR:-/var/backups/tushuntir}"
KEEP="${KEEP:-7}"
PG_DUMP="${PG_DUMP:-pg_dump}"
STAMP="$(date +%Y%m%d-%H%M%S)"

# The database URL and the uploads folder, read from .env exactly as the app reads them.
eval "$(node -e '
  const path = require("path");
  require("dotenv").config({ quiet: true });
  const e = process.env;
  const url = e.DATABASE_URL?.trim() ||
    `postgresql://${encodeURIComponent(e.PG_USER)}:${encodeURIComponent(e.PG_PASSWORD)}@${e.PG_HOST}:${e.PG_PORT}/${encodeURIComponent(e.PG_DB)}`;
  const uploads = e.UPLOADS_DIR?.trim()
    ? path.resolve(e.UPLOADS_DIR.trim())
    : e.NODE_ENV === "production" ? "/var/lib/tushuntir/uploads" : path.resolve("uploads");
  const q = (v) => "\x27" + String(v).replace(/\x27/g, "\x27\\\x27\x27") + "\x27";
  console.log(`DB_URL=${q(url)}; UPLOADS=${q(uploads)}`);
')"

mkdir -p "$BACKUP_DIR"
DB_FILE="$BACKUP_DIR/tushuntir-db-$STAMP.dump"
UP_FILE="$BACKUP_DIR/tushuntir-uploads-$STAMP.tar.gz"

echo "$(date '+%F %T') backup start"
"$PG_DUMP" --format=custom --compress=6 --no-owner --exclude-extension=vector \
  --dbname="$DB_URL" --file="$DB_FILE.part"
mv "$DB_FILE.part" "$DB_FILE"

if [ -d "$UPLOADS" ]; then
  NAME="$(basename "$UPLOADS")"
  tar -czf "$UP_FILE.part" --exclude="$NAME/tts" -C "$(dirname "$UPLOADS")" "$NAME"
  mv "$UP_FILE.part" "$UP_FILE"
fi

# Keep the newest KEEP of each kind.
for kind in db uploads; do
  ls -1t "$BACKUP_DIR"/tushuntir-"$kind"-* 2>/dev/null | tail -n +"$((KEEP + 1))" | xargs -r rm -f --
done
echo "$(date '+%F %T') backup done: $(du -h "$DB_FILE" | cut -f1) database, $([ -f "$UP_FILE" ] && du -h "$UP_FILE" | cut -f1 || echo 'no') uploads"
