#!/usr/bin/env bash
# deploy.sh — Production deploy script for Gateway Nova
#
# Usage:
#   ./deploy.sh                 # full deploy: pull → backup → build → restart → health-check
#   ./deploy.sh --skip-backup   # skip the pg_dump step (faster, riskier)
#   ./deploy.sh --no-pull       # skip git pull (use when CI already updated the working tree)
#   ./deploy.sh --help          # show this help
#
# Exit codes:
#   0  success
#   1  precondition failed (wrong dir, missing tools, dirty tree, etc.)
#   2  deploy step failed (build, migration, health-check)
set -euo pipefail

# ---------- colors (skip if not a TTY) ----------
if [ -t 1 ]; then
  C_RESET='\033[0m'; C_BOLD='\033[1m'
  C_GREEN='\033[32m'; C_YELLOW='\033[33m'; C_RED='\033[31m'; C_BLUE='\033[34m'
else
  C_RESET=''; C_BOLD=''; C_GREEN=''; C_YELLOW=''; C_RED=''; C_BLUE=''
fi

step()  { printf "${C_BLUE}${C_BOLD}▶ %s${C_RESET}\n" "$*"; }
ok()    { printf "${C_GREEN}✓ %s${C_RESET}\n" "$*"; }
warn()  { printf "${C_YELLOW}! %s${C_RESET}\n" "$*"; }
fail()  { printf "${C_RED}✗ %s${C_RESET}\n" "$*" >&2; }

# ---------- parse flags ----------
SKIP_BACKUP=0
NO_PULL=0
for arg in "$@"; do
  case "$arg" in
    --skip-backup) SKIP_BACKUP=1 ;;
    --no-pull)     NO_PULL=1 ;;
    --help|-h)
      sed -n '2,12p' "$0" | sed 's/^# \{0,1\}//'
      exit 0
      ;;
    *) fail "Unknown flag: $arg"; exit 1 ;;
  esac
done

# ---------- preflight ----------
step "Preflight checks"

cd "$(dirname "$0")"

command -v git >/dev/null     || { fail "git not found in PATH"; exit 1; }
command -v docker >/dev/null  || { fail "docker not found in PATH"; exit 1; }
docker compose version >/dev/null 2>&1 || { fail "docker compose plugin not available"; exit 1; }

[ -f docker-compose.yml ] || { fail "docker-compose.yml not found; are you in the project root?"; exit 1; }
[ -f .env ] || { fail ".env not found; copy .env.example to .env first"; exit 1; }

if ! git diff-index --quiet HEAD --; then
  warn "Working tree has uncommitted changes — they will be kept but not deployed."
fi

ok "Environment looks good"

# ---------- pull ----------
if [ "$NO_PULL" -eq 0 ]; then
  step "Pulling latest from origin/main"
  PREV_SHA="$(git rev-parse HEAD)"
  git fetch origin main
  git checkout main
  git pull --ff-only origin main
  NEW_SHA="$(git rev-parse HEAD)"
  if [ "$PREV_SHA" = "$NEW_SHA" ]; then
    ok "Already up to date ($NEW_SHA)"
  else
    ok "Updated $(git rev-parse --short "$PREV_SHA") → $(git rev-parse --short "$NEW_SHA")"
    printf "${C_BLUE}Changes:${C_RESET}\n"
    git log --oneline "$PREV_SHA..$NEW_SHA"
  fi
else
  warn "Skipping git pull (--no-pull)"
fi

# ---------- env var drift check ----------
step "Checking for new env vars in .env.example"
example_keys=$(grep -E '^[A-Z_][A-Z0-9_]*=' .env.example | cut -d= -f1 | sort -u)
env_keys=$(grep -E '^[A-Z_][A-Z0-9_]*=' .env | cut -d= -f1 | sort -u)
missing=$(comm -23 <(echo "$example_keys") <(echo "$env_keys") || true)
if [ -n "$missing" ]; then
  warn "New keys in .env.example are missing from .env:"
  echo "$missing" | sed 's/^/    - /'
  warn "Add them to .env before continuing or the app may fail to start."
  read -r -p "Continue anyway? [y/N] " yn
  case "$yn" in [yY]|[yY][eE][sS]) ;; *) fail "Aborted by user"; exit 1 ;; esac
else
  ok "No new env vars to set"
fi

# ---------- backup ----------
if [ "$SKIP_BACKUP" -eq 0 ]; then
  step "Backing up PostgreSQL"
  if docker compose ps --status running --services 2>/dev/null | grep -q '^db$'; then
    mkdir -p backups
    backup_file="backups/homepage-$(date +%Y%m%d-%H%M%S).dump"
    docker compose exec -T db pg_dump -U "${POSTGRES_USER:-homepage}" -F c "${POSTGRES_DB:-homepage}" > "$backup_file"
    ok "Backup saved: $backup_file ($(du -h "$backup_file" | cut -f1))"
  else
    warn "db service not running — skipping backup (this looks like a first deploy)"
  fi
else
  warn "Skipping DB backup (--skip-backup)"
fi

# ---------- build & restart ----------
step "Building image and restarting containers"
docker compose up -d --build
ok "Containers restarted"

# ---------- health check ----------
step "Waiting for app to become healthy"
app_port="${APP_PORT:-3100}"
health_url="http://127.0.0.1:${app_port}/api/health"
deadline=$(( $(date +%s) + 90 ))
while : ; do
  if curl -fsS --max-time 3 "$health_url" >/dev/null 2>&1; then
    ok "App healthy at $health_url"
    break
  fi
  if [ "$(date +%s)" -ge "$deadline" ]; then
    fail "App did not become healthy within 90s"
    printf "${C_YELLOW}Last 30 lines of app logs:${C_RESET}\n"
    docker compose logs --tail=30 app || true
    exit 2
  fi
  sleep 2
done

# ---------- summary ----------
step "Deploy complete"
echo
docker compose ps
echo
ok "Open: http://localhost:${app_port}"
if [ "$SKIP_BACKUP" -eq 0 ] && [ -n "${backup_file:-}" ]; then
  echo
  printf "${C_BLUE}Rollback hint:${C_RESET}\n"
  echo "    git checkout <previous-sha> && docker compose up -d --build"
  echo "    # then restore the DB if needed:"
  echo "    docker compose exec -T db pg_restore -U ${POSTGRES_USER:-homepage} -d ${POSTGRES_DB:-homepage} --clean < $backup_file"
fi
