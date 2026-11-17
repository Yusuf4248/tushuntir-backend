#!/usr/bin/env bash
# Deploy the latest code on the server (run as the app user, e.g. tushuntir):
#   ~/app/deploy/deploy.sh
# git pull (fast-forward only) -> npm ci -> build -> migrations -> pm2 reload -> health check.
# Stops at the first error. If install, build or migrations fail, the code and the build are
# put back to the previous commit, so the running app and a later restart keep working.
set -Eeuo pipefail

APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$APP_DIR"
APP_NAME="tushuntir-api"

step() { printf '\n==> %s\n' "$*"; }
fail() { printf '\nDEPLOY FAILED: %s\n' "$*" >&2; exit 1; }

[ -f .env ] || fail ".env is missing in $APP_DIR"
git diff --quiet && git diff --cached --quiet ||
  fail "local changes in $APP_DIR; commit or discard them first (git status)"

PORT="${PORT:-$(grep -E '^PORT=' .env | tail -1 | cut -d= -f2 | cut -d'#' -f1 | tr -d ' "')}"
HEALTH_URL="${HEALTH_URL:-http://127.0.0.1:${PORT:-4004}/api/health}"
BRANCH="$(git rev-parse --abbrev-ref HEAD)"
PREVIOUS="$(git rev-parse HEAD)"

# Before the reload a failure restores the previous commit and its build.
rollback() {
  printf '\n==> Restoring %s and its build\n' "${PREVIOUS:0:7}" >&2
  git reset --hard --quiet "$PREVIOUS"
  npm ci --include=dev --no-audit --no-fund >/dev/null && npm run build >/dev/null &&
    echo "Restored ${PREVIOUS:0:7}; the running app was not touched." >&2 ||
    echo "Restoring the build failed too: run 'npm ci --include=dev && npm run build' by hand." >&2
}
trap 'rollback; fail "see the output above (line $LINENO)"' ERR

step "Now at ${PREVIOUS:0:7} on $BRANCH; pulling"
git fetch --prune origin
git merge --ff-only "origin/$BRANCH"
if [ "$(git rev-parse HEAD)" = "$PREVIOUS" ]; then
  echo "Already up to date; rebuilding and reloading anyway."
fi

step "Installing dependencies (npm ci)"
npm ci --include=dev --no-audit --no-fund

step "Building"
npm run build

step "Database migrations"
npm run migration:run:prod

# From here on the new version is live; a failure is reported, not rolled back.
trap - ERR
mkdir -p logs
step "Reloading $APP_NAME"
if pm2 describe "$APP_NAME" >/dev/null 2>&1; then
  pm2 reload ecosystem.config.cjs --update-env
else
  pm2 start ecosystem.config.cjs
fi
pm2 save >/dev/null

step "Health check ($HEALTH_URL)"
for _ in $(seq 1 30); do
  if curl -fsS --max-time 5 "$HEALTH_URL"; then
    printf '\n\nDeployed %s (was %s).\n' "$(git rev-parse --short HEAD)" "${PREVIOUS:0:7}"
    exit 0
  fi
  sleep 2
done
fail "the app did not become healthy within 60 s: check 'pm2 logs $APP_NAME'; to go back: docs/DEPLOY.md, Rollback"
