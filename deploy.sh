#!/usr/bin/env bash
# =============================================================================
# CookChase — one-command deploy (multi-environment)
#
#   ./deploy.sh                                # build + backup + upload + restart
#   ./deploy.sh --env staging                  # load .env.deploy.staging
#   ./deploy.sh --env prod                     # load .env.deploy.prod
#   ./deploy.sh --pipeline                     # staging first, then production
#   ./deploy.sh --pipeline --yes               # ... without the confirmation prompt
#   ./deploy.sh --check-only --env staging     # verify a live env (no deploy)
#   ./deploy.sh --dry-run                      # print every step without doing it
#   ./deploy.sh --skip-build                   # reuse existing .next (faster)
#   ./deploy.sh --mode pm2                     # force PM2 restart (default: docker)
#
# Per-environment config files (key=value, # comments allowed):
#   .env.deploy.example          single-environment template
#   .env.deploy.staging.example  staging template   →  .env.deploy.staging
#   .env.deploy.prod.example     production template → .env.deploy.prod
#
# Precedence: inline environment variables (DEPLOY_HOST=... ./deploy.sh) always
# win over the config file; config file wins over the built-in defaults.
#
# What it does, in order (per environment):
#   1. Preflight — checks ssh exists and the server is reachable.
#   2. Local build  — `npm ci` + `npm run build` (skippable).
#   3. Local backup — a consistent SQLite copy in ./backups.
#   4. Remote backup — backs up the LIVE database on the server first,
#      so a bad deploy never destroys data. In docker mode this runs
#      INSIDE the running container (the DB lives in the docker volume).
#   5. Sync        — uploads code to the server. Uses `rsync` when available,
#      otherwise falls back to `tar | ssh` (handy on Windows Git Bash).
#      The `data/` directory is NEVER uploaded: the server keeps its own
#      live database.
#   6. Restart     — `docker compose up -d --build` (docker mode) or
#      `npm ci && npm run build && pm2 restart cookchase` (pm2 mode).
#   7. Verification — retries the homepage, then checks robots.txt references
#      the sitemap, sitemap.xml serves the right host, and any extra paths in
#      DEPLOY_CHECK_PATHS return 2xx/3xx.
#
# Config keys: DEPLOY_HOST, DEPLOY_USER, DEPLOY_PATH, DEPLOY_PORT, DEPLOY_KEY,
# DEPLOY_MODE (docker|pm2), DEPLOY_SITE_URL, BACKUP_KEEP, DEPLOY_CHECK_PATHS.
#
# Notifications (Telegram / Slack / Discord) — DEPLOY_NOTIFY=1 plus:
#   DEPLOY_WEBHOOK_TYPE=telegram  + DEPLOY_TELEGRAM_TOKEN + DEPLOY_TELEGRAM_CHAT_ID
#   DEPLOY_WEBHOOK_TYPE=slack     + DEPLOY_WEBHOOK_URL
#   DEPLOY_WEBHOOK_TYPE=discord   + DEPLOY_WEBHOOK_URL
# A success/failure message is sent after each deploy with the HTTP status,
# deploy duration, and how many local + remote backups are kept.
# =============================================================================
set -euo pipefail

# --- Flags ------------------------------------------------------------------
DEPLOY_ENV="${DEPLOY_ENV:-}"   # e.g. staging | prod | "" (default)
DRY_RUN=0
SKIP_BUILD=0
PIPELINE=0
AUTO_YES=0
CHECK_ONLY=0

while [ $# -gt 0 ]; do
  case "$1" in
    --dry-run) DRY_RUN=1; shift ;;
    --skip-build) SKIP_BUILD=1; shift ;;
    --pipeline) PIPELINE=1; shift ;;
    --yes) AUTO_YES=1; shift ;;
    --check-only) CHECK_ONLY=1; shift ;;
    --env=*) DEPLOY_ENV="${1#*=}"; shift ;;
    --env) DEPLOY_ENV="$2"; shift 2 ;;
    --mode=*) DEPLOY_MODE="${1#*=}"; shift ;;
    --mode) DEPLOY_MODE="$2"; shift 2 ;;
    -h|--help)
      sed -n '2,40p' "$0" | sed 's/^# \{0,1\}//'
      exit 0
      ;;
    *) echo "Unknown argument: $1 (try --help)"; exit 1 ;;
  esac
done

# --- Configuration (defaults; overridden by config file then inline env) ------
# Capture inline env values BEFORE defaults are applied, so load_env_file knows
# which keys the user really set (inline env / CLI flags always win over files).
# A plain space-separated string keeps this working on macOS bash 3.2 (no
# associative arrays) and Git Bash.
INLINE_SET=""
for _k in DEPLOY_HOST DEPLOY_USER DEPLOY_PATH DEPLOY_PORT DEPLOY_KEY DEPLOY_MODE DEPLOY_SITE_URL BACKUP_KEEP DEPLOY_CHECK_PATHS DEPLOY_NOTIFY DEPLOY_WEBHOOK_TYPE DEPLOY_WEBHOOK_URL DEPLOY_TELEGRAM_TOKEN DEPLOY_TELEGRAM_CHAT_ID; do
  if [ -n "${!_k:-}" ]; then
    INLINE_SET="$INLINE_SET $_k"
  fi
done

DEPLOY_HOST="${DEPLOY_HOST:-}"
DEPLOY_USER="${DEPLOY_USER:-root}"
DEPLOY_PATH="${DEPLOY_PATH:-/opt/cookchase}"
DEPLOY_PORT="${DEPLOY_PORT:-22}"
DEPLOY_KEY="${DEPLOY_KEY:-}"              # path to SSH private key (optional)
DEPLOY_MODE="${DEPLOY_MODE:-docker}"      # docker | pm2
DEPLOY_SITE_URL="${DEPLOY_SITE_URL:-http://localhost:3000}"
BACKUP_KEEP="${BACKUP_KEEP:-14}"           # how many local/remote backups to keep
DEPLOY_CHECK_PATHS="${DEPLOY_CHECK_PATHS:-}"  # extra space-separated URL paths to verify
# Webhook deploy notifications (telegram | slack | discord)
DEPLOY_NOTIFY="${DEPLOY_NOTIFY:-0}"          # 1 = send notifications
DEPLOY_WEBHOOK_TYPE="${DEPLOY_WEBHOOK_TYPE:-}" # telegram | slack | discord
DEPLOY_WEBHOOK_URL="${DEPLOY_WEBHOOK_URL:-}"   # slack/discord incoming webhook URL
DEPLOY_TELEGRAM_TOKEN="${DEPLOY_TELEGRAM_TOKEN:-}" # telegram bot token
DEPLOY_TELEGRAM_CHAT_ID="${DEPLOY_TELEGRAM_CHAT_ID:-}" # telegram chat id

# --- Helpers ----------------------------------------------------------------
GREEN='\033[0;32m'; YELLOW='\033[1;33m'; RED='\033[0;31m'; NC='\033[0m'
step()  { echo -e "\n${YELLOW}==> $*${NC}"; }
ok()    { echo -e "${GREEN}    ✔ $*${NC}"; }
fail()  { echo -e "${RED}    ✘ $*${NC}"; }

# Run a local command (honoring --dry-run). Never used for remote commands.
run_local() {
  if [ "$DRY_RUN" = "1" ]; then
    echo -e "    (dry-run) $*"
  else
    bash -c "$*"
  fi
}

# Source a key=value config file (no eval of arbitrary content — plain parse).
# Keys the user set inline (recorded in INLINE_SET above) are never clobbered.
# Inline comments (`KEY=value  # note`) and blank lines are tolerated.
load_env_file() {
  local file="$1" required="$2"
  if [ ! -f "$file" ]; then
    if [ "$required" = "1" ]; then
      fail "Config file '$file' not found."
      echo "    Copy the template and fill it in:"
      echo "      cp ${file}.example $file"
      exit 1
    fi
    return 0
  fi
  echo -e "    config   : ${file}"
  local key val
  while IFS='=' read -r key val; do
    # strip whitespace, skip blanks and comments
    key="$(echo "$key" | tr -d '[:space:]')"
    [ -n "$key" ] || continue
    case "$key" in \#*) continue ;; esac
    if [ -n "$INLINE_SET" ]; then
      case " $INLINE_SET " in
        *" $key "*) continue ;; # inline env / CLI flag already set — it wins
      esac
    fi
    # drop trailing inline comments and trim the value
    val="${val%%#*}"
    val="$(echo "$val" | sed 's/[[:space:]]*$//')"
    export "$key"="$val"
  done < "$file"
}

# Resolve SSH args from the CURRENT config (word-safe, no eval).
ssh_remote() {
  local target="${DEPLOY_USER}@${DEPLOY_HOST}"
  local opts=(-o BatchMode=yes -o StrictHostKeyChecking=accept-new -o ConnectTimeout=15)
  [ -n "$DEPLOY_KEY" ] && opts+=(-i "$DEPLOY_KEY")
  ssh "${opts[@]}" -p "$DEPLOY_PORT" "$target" "$1"
}

# Portable "keep newest N files matching a glob": works on GNU & BSD (macOS),
# and tolerates "no match" so set -e never trips on an empty directory.
prune_old_backups() {
  local pattern="$1"
  if [ "$DRY_RUN" = "1" ]; then
    echo -e "    (dry-run) prune $pattern (keep ${BACKUP_KEEP})"
    return
  fi
  local files
  files=$(ls -1t "$pattern" 2>/dev/null | tail -n +"$((BACKUP_KEEP + 1))") || true
  if [ -n "$files" ]; then
    printf '%s\n' "$files" | while IFS= read -r f; do
      rm -f -- "$f"
      echo "    pruned $f"
    done
  fi
}

# --- Deploy notifications (webhook) ------------------------------------------
# Sends a success/failure message to Telegram, Slack or Discord with the HTTP
# status, deploy duration and how many backups remain. All curl payloads are
# built with printf + a tiny JSON escaper — no jq required.

# Track the last HTTP status seen and whether a real deploy started, so the
# EXIT trap below knows whether to report a failure (check-only runs and plain
# config errors never spam the channel).
LAST_HTTP_CODE="000"
DEPLOY_RAN=0
DEPLOY_STARTED_EPOCH="$(date +%s 2>/dev/null || echo 0)"

# Fire only on a NON-zero exit after a deploy began: report the failure to the
# webhook, then re-raise the original status (safe under set -e — `true`
# swallows the notify error so the original exit code always wins).
on_failure_exit() {
  local rc=$?
  if [ "$rc" != "0" ] && [ "$DEPLOY_RAN" = "1" ]; then
    notify_deploy failure "$LAST_HTTP_CODE" || true
  fi
  exit "$rc"
}
trap on_failure_exit EXIT

notify_configured() {
  [ "$DEPLOY_NOTIFY" = "1" ] || return 1
  case "$DEPLOY_WEBHOOK_TYPE" in
    slack|discord) [ -n "$DEPLOY_WEBHOOK_URL" ] && return 0 ;;
    telegram) [ -n "$DEPLOY_TELEGRAM_TOKEN" ] && [ -n "$DEPLOY_TELEGRAM_CHAT_ID" ] && return 0 ;;
  esac
  return 1
}

# Escape a string for embedding inside a JSON string literal. Slurps the whole
# input (so real newlines are seen) and escapes backslash, double quote, tab,
# CR and newline — exactly the JSON control sequences. Order matters: backslash
# first (so pre-existing backslash-n text is doubled as literal text), then the
# control characters whose introduced backslashes must NOT be re-escaped.
json_escape() {
  printf '%s' "$1" \
    | sed ':a;N;$!ba; s/\\/\\\\/g; s/"/\\"/g; s/\t/\\t/g; s/\r/\\r/g; s/\n/\\n/g'
}

# How many backups are kept (local + remote). Remote count is best-effort: it
# runs on the server through the same SSH/container path used for the deploy.
# The $1 flag skips the SSH probe (used on failure paths where the server may
# be the thing that's down).
backup_counts() {
  local skip_remote="${1:-0}"
  local local_count remote_count
  # `|| echo 0` so a missing backups dir (first ever deploy) can't trip
  # pipefail and silently swallow the whole notification.
  local_count=$(ls -1 backups/local-*.db 2>/dev/null | wc -l | tr -d ' ' || echo 0)
  remote_count="?"
  if [ "$skip_remote" = "1" ] || [ "$DRY_RUN" = "1" ]; then
    remote_count="?"
  elif [ "$DEPLOY_MODE" = "docker" ]; then
    remote_count=$(ssh_remote "cd '$DEPLOY_PATH' 2>/dev/null && docker compose exec -T cookchase sh -c 'ls -1 /app/data/backups/remote-*.db 2>/dev/null | wc -l'" 2>/dev/null | tr -d ' \r' || echo "?")
  else
    remote_count=$(ssh_remote "ls -1 '$DEPLOY_PATH/backups'/remote-*.db 2>/dev/null | wc -l" 2>/dev/null | tr -d ' \r' || echo "?")
  fi
  echo "${local_count} local, ${remote_count:-?} remote"
}

# send_webhook <title> <body> — posts to the configured provider.
# Returns 0 on HTTP 2xx.
send_webhook() {
  local title="$1" body="$2"
  local payload="" url="" result=""
  local text="$(json_escape "${title}
${body}")"

  case "$DEPLOY_WEBHOOK_TYPE" in
    telegram)
      url="https://api.telegram.org/bot${DEPLOY_TELEGRAM_TOKEN}/sendMessage"
      payload="{\"chat_id\":\"$(json_escape "$DEPLOY_TELEGRAM_CHAT_ID")\",\"text\":\"${text}\"}"
      ;;
    slack)
      url="$DEPLOY_WEBHOOK_URL"
      payload="{\"text\":\"${text}\"}"
      ;;
    discord)
      url="$DEPLOY_WEBHOOK_URL"
      payload="{\"content\":\"${text}\"}"
      ;;
  esac

  # curl prints '000' via -w when it cannot connect, so don't let a second
  # '000' fallback double it up into '000000' — keep whatever -w wrote.
  result=$(curl -s -o /dev/null -w '%{http_code}' -X POST -H 'Content-Type: application/json' \
    --data "$payload" "$url" 2>/dev/null || true)
  result="${result:-000}"
  case "$result" in
    2*) ok "notification sent (${DEPLOY_WEBHOOK_TYPE}, HTTP $result)" ;;
    *)  fail "notification failed (${DEPLOY_WEBHOOK_TYPE}, HTTP $result)"
        return 1 ;;
  esac
  return 0
}

# notify_deploy <status> <http_code> — the one entry point used by the script.
# status: success | failure
notify_deploy() {
  local status="$1" http_code="$2"
  if [ "$DRY_RUN" = "1" ]; then
    echo -e "    (dry-run) notify ${status} (HTTP ${http_code}) via ${DEPLOY_WEBHOOK_TYPE:-none}"
    return 0
  fi
  if ! notify_configured; then
    return 0
  fi

  local env_label="${DEPLOY_ENV:-default}"
  local icon="✅"
  [ "$status" = "failure" ] && icon="❌"
  local finished now_epoch duration counts
  finished=$(date -u +%Y-%m-%dT%H:%M:%SZ)
  now_epoch=$(date +%s 2>/dev/null || echo 0)
  duration="?"
  if [ "$DEPLOY_STARTED_EPOCH" != "0" ] && [ "$now_epoch" != "0" ] && [ "$now_epoch" -ge "$DEPLOY_STARTED_EPOCH" ]; then
    duration="$((now_epoch - DEPLOY_STARTED_EPOCH))s"
  fi
  # On failure, skip the remote-count SSH probe (the server may be what failed).
  if [ "$status" = "failure" ]; then
    counts="$(backup_counts 1)"
  else
    counts="$(backup_counts)"
  fi

  # Real newlines in the message → json_escape turns them into proper \n JSON
  # escapes, so Slack/Telegram/Discord render line breaks (not literal \n text).
  send_webhook \
    "${icon} Deploy ${status} — ${env_label}" \
    "Target: ${DEPLOY_USER}@${DEPLOY_HOST}:${DEPLOY_PATH}
Mode: ${DEPLOY_MODE} · URL: ${DEPLOY_SITE_URL}
HTTP: ${http_code}
Finished: ${finished} · Duration: ${duration}
Backups kept: ${counts}"
}

# --- 0. Preflight ------------------------------------------------------------
preflight() {
  step "Preflight"
  if [ -z "$DEPLOY_HOST" ]; then
    fail "DEPLOY_HOST is not set. Set it inline or in a config file, e.g.:"
    echo "    DEPLOY_HOST=203.0.113.10 ./deploy.sh"
    echo "    ./deploy.sh --env staging   (reads .env.deploy.staging)"
    exit 1
  fi
  if [ "$DEPLOY_MODE" != "docker" ] && [ "$DEPLOY_MODE" != "pm2" ]; then
    fail "DEPLOY_MODE must be 'docker' or 'pm2' (got '$DEPLOY_MODE')."
    exit 1
  fi
  if ! command -v ssh >/dev/null 2>&1; then
    fail "Required tool 'ssh' not found."
    exit 1
  fi
  if [ "$DEPLOY_NOTIFY" = "1" ] && ! command -v curl >/dev/null 2>&1; then
    fail "DEPLOY_NOTIFY=1 requires 'curl' for webhook notifications."
    exit 1
  fi
  if [ "$DEPLOY_NOTIFY" = "1" ] && ! notify_configured; then
    fail "DEPLOY_NOTIFY=1 but webhook is not configured."
    echo "    Set DEPLOY_WEBHOOK_TYPE=telegram|slack|discord plus the matching"
    echo "    DEPLOY_WEBHOOK_URL (slack/discord) or DEPLOY_TELEGRAM_TOKEN +"
    echo "    DEPLOY_TELEGRAM_CHAT_ID (telegram)."
    exit 1
  fi
  HAVE_RSYNC=0
  command -v rsync >/dev/null 2>&1 && HAVE_RSYNC=1
  if [ "$HAVE_RSYNC" = "1" ]; then
    echo -e "    transfer : rsync"
  else
    echo -e "    transfer : tar-over-ssh (rsync not found — fine on Windows Git Bash)"
  fi
  echo -e "    target   : ${DEPLOY_USER}@${DEPLOY_HOST}:${DEPLOY_PATH} (mode: ${DEPLOY_MODE})"
  echo -e "    site url : ${DEPLOY_SITE_URL}"

  if [ "$DRY_RUN" = "1" ]; then
    echo -e "    (dry-run) skip live reachability check"
  else
    if ! ssh_remote 'echo reachable' >/dev/null 2>&1; then
      fail "Cannot reach ${DEPLOY_USER}@${DEPLOY_HOST} over SSH. Check host, key, and that sshd is running."
      exit 1
    fi
    ok "server reachable"
  fi
}

# --- 1. Local build ----------------------------------------------------------
build_locally() {
  if [ "$SKIP_BUILD" = "1" ]; then
    step "Local build (skipped via --skip-build)"
    return
  fi
  step "Local build"
  run_local "npm ci && npm run build"
  ok "build finished"
}

# --- 2 + 3. Backups ----------------------------------------------------------
backup_local() {
  step "Local database backup"
  run_local "node scripts/backup-db.js local"
  prune_old_backups 'backups/local-*.db'
  ok "local backup done (kept last ${BACKUP_KEEP})"
}

backup_remote() {
  step "Remote database backup (live data first!)"
  if [ "$DRY_RUN" = "1" ]; then
    echo -e "    (dry-run) back up the live database on the server"
    return
  fi
  if [ "$DEPLOY_MODE" = "docker" ]; then
    # The DB lives inside the container at /app/data (docker volume), so the
    # backup must run inside the container and write into the mounted volume.
    if ssh_remote "cd '$DEPLOY_PATH' 2>/dev/null && docker compose ps -q 2>/dev/null | grep -q ."; then
      if ! ssh_remote "cd '$DEPLOY_PATH' && docker compose exec -T cookchase node scripts/backup-db.js remote /app/data/backups && docker compose exec -T cookchase sh -c 'ls -1t /app/data/backups/remote-*.db 2>/dev/null | tail -n +$((BACKUP_KEEP + 1)) | while read f; do rm -f \"\$f\"; done'"; then
        fail "Remote (docker) backup failed — aborting before any changes."
        exit 1
      fi
    else
      echo "    container not running yet — nothing live to back up (first deploy). Skipping."
    fi
  else
    # pm2 mode: node runs directly on the host, DB at $DEPLOY_PATH/data.
    if ! ssh_remote "mkdir -p '$DEPLOY_PATH/backups' && cd '$DEPLOY_PATH' && node scripts/backup-db.js remote && (ls -1t backups/remote-*.db 2>/dev/null | tail -n +$((BACKUP_KEEP + 1)) | while read f; do rm -f \"\$f\"; done; true)"; then
      fail "Remote backup failed — aborting before any changes."
      exit 1
    fi
  fi
  ok "remote database backed up"
}

# --- 4. Sync code to server (data/ is NEVER uploaded) ------------------------
sync_code() {
  step "Uploading code (excluding data/, .next, node_modules, .env*)"
  if [ "$DRY_RUN" = "1" ]; then
    echo -e "    (dry-run) sync ./ → ${DEPLOY_USER}@${DEPLOY_HOST}:${DEPLOY_PATH}/"
    return
  fi
  ssh_remote "mkdir -p '$DEPLOY_PATH'"
  if [ "$HAVE_RSYNC" = "1" ]; then
    RSYNC_SSH="ssh -p ${DEPLOY_PORT} -o BatchMode=yes -o StrictHostKeyChecking=accept-new"
    [ -n "$DEPLOY_KEY" ] && RSYNC_SSH="$RSYNC_SSH -i \"$DEPLOY_KEY\""
    rsync -az --delete -e "$RSYNC_SSH" \
      --exclude='node_modules' --exclude='.next' --exclude='data' \
      --exclude='backups' --exclude='.git' --exclude='.env' --exclude='.env.*' \
      --exclude='logs' --exclude='*.log' --exclude='.freebuff' \
      ./ "${DEPLOY_USER}@${DEPLOY_HOST}:${DEPLOY_PATH}/"
  else
    # tar-over-ssh fallback (no --delete; stale files are harmless leftovers)
    tar cf - --exclude='node_modules' --exclude='.next' --exclude='data' \
      --exclude='backups' --exclude='.git' --exclude='.env' --exclude='.env.*' \
      --exclude='logs' --exclude='*.log' --exclude='.freebuff' . |
      ssh -p "$DEPLOY_PORT" -o BatchMode=yes -o StrictHostKeyChecking=accept-new \
        ${DEPLOY_KEY:+-i "$DEPLOY_KEY"} \
        "${DEPLOY_USER}@${DEPLOY_HOST}" "tar xf - -C '$DEPLOY_PATH'"
  fi
  ok "code uploaded"
}

# --- 5. Restart on the server -------------------------------------------------
restart_server() {
  step "Restarting on the server ($DEPLOY_MODE mode)"
  if [ "$DRY_RUN" = "1" ]; then
    if [ "$DEPLOY_MODE" = "docker" ]; then
      echo -e "    (dry-run) ssh ... 'cd $DEPLOY_PATH && docker compose up -d --build'"
    else
      echo -e "    (dry-run) ssh ... 'cd $DEPLOY_PATH && npm ci && npm run build && (pm2 restart cookchase || pm2 start ecosystem.config.js)'"
    fi
    return
  fi
  if [ "$DEPLOY_MODE" = "docker" ]; then
    ssh_remote "cd '$DEPLOY_PATH' && docker compose up -d --build"
  else
    ssh_remote "cd '$DEPLOY_PATH' && npm ci && npm run build && (pm2 restart cookchase || pm2 start ecosystem.config.js)"
  fi
  ok "restart issued"
}

# --- 6. Post-deploy verification ---------------------------------------------
# Retries the homepage, then confirms robots.txt references the sitemap,
# sitemap.xml serves the expected host, and every DEPLOY_CHECK_PATHS entry
# answers 2xx/3xx. Used after a deploy AND by --check-only.
verify_deploy() {
  step "Post-deploy verification"
  if [ "$DRY_RUN" = "1" ]; then
    echo -e "    (dry-run) curl ${DEPLOY_SITE_URL} + robots.txt + sitemap.xml + check paths (retries)"
    return
  fi

  local failed=0

  # 6a. Homepage reachable (with retries — the app needs a moment to boot).
  code="000"
  for attempt in 1 2 3 4 5 6; do
    sleep 5
    code=$(ssh_remote "curl -s -o /dev/null -w '%{http_code}' '$DEPLOY_SITE_URL'" 2>/dev/null || echo "000")
    if [ "$code" = "200" ] || [ "$code" = "301" ] || [ "$code" = "302" ]; then
      break
    fi
    echo "    attempt ${attempt}: HTTP ${code}… waiting for the app to come up"
  done
  LAST_HTTP_CODE="$code"
  if [ "$code" = "200" ] || [ "$code" = "301" ] || [ "$code" = "302" ]; then
    ok "site responded HTTP $code"
  else
    fail "Site returned HTTP $code. Check logs:"
    echo "    ssh ${DEPLOY_USER}@${DEPLOY_HOST} 'cd $DEPLOY_PATH && docker compose logs --tail=50'"
    echo "    (pm2)  ssh ${DEPLOY_USER}@${DEPLOY_HOST} 'cd $DEPLOY_PATH && pm2 logs cookchase --lines 50'"
    echo "    Restore the newest backups/remote-*.db (or /app/data/backups in docker) to data/cookchase.db."
    return 1
  fi

  # 6b. robots.txt exists and points at the sitemap (AdSense/SEO sanity).
  local robots
  robots=$(ssh_remote "curl -s '$DEPLOY_SITE_URL/robots.txt'" 2>/dev/null || true)
  if printf '%s' "$robots" | grep -q 'Sitemap:'; then
    ok "robots.txt references the sitemap"
  else
    fail "robots.txt is missing a 'Sitemap:' line — check the /robots.txt route."
    failed=1
  fi

  # 6c. sitemap.xml serves and uses the right host (no localhost leakage).
  local sitemap host
  sitemap=$(ssh_remote "curl -s '$DEPLOY_SITE_URL/sitemap.xml'" 2>/dev/null || true)
  host=$(printf '%s' "$DEPLOY_SITE_URL" | sed -E 's#^[a-z]+://##; s#[:/].*$##')
  if printf '%s' "$sitemap" | grep -q 'urlset'; then
    if printf '%s' "$sitemap" | grep -q "$host"; then
      ok "sitemap.xml serves URLs for $host"
    else
      fail "sitemap.xml serves but no URL mentions '$host' — is SITE_URL set on the server?"
      failed=1
    fi
  else
    fail "sitemap.xml did not return a valid urlset — check the /sitemap.xml route."
    failed=1
  fi

  # 6d. Extra paths from the config (e.g. /, /pricing, /tools/recipe-scaler).
  local extra
  for extra in $DEPLOY_CHECK_PATHS; do
    local extra_code
    extra_code=$(ssh_remote "curl -s -o /dev/null -w '%{http_code}' '$DEPLOY_SITE_URL$extra'" 2>/dev/null || echo "000")
    if [ "$extra_code" = "200" ] || [ "$extra_code" = "301" ] || [ "$extra_code" = "302" ]; then
      ok "check $extra → HTTP $extra_code"
    else
      fail "check $extra → HTTP $extra_code"
      failed=1
    fi
  done

  if [ "$failed" = "1" ]; then
    fail "One or more checks failed — the deploy is NOT verified."
    return 1
  fi
  return 0
}

# --- Deploy a single environment ---------------------------------------------
deploy_env() {
  local env_name="$1"
  local config_file="$2"
  local required="${3:-1}"
  load_env_file "$config_file" "$required"
  DEPLOY_RAN=1
  # Reset per environment so a pipeline failure never reports a stale 200 from
  # a previous environment's successful verification.
  LAST_HTTP_CODE="000"

  echo -e "\n${YELLOW}========== Deploying environment: ${env_name:-default} ==========${NC}"
  preflight
  build_locally
  backup_local
  backup_remote
  sync_code
  restart_server
  if ! verify_deploy; then
    fail "Verification failed for environment '${env_name:-default}' — deploy aborted."
    exit 1
  fi
  # A webhook failure must never flip a successful deploy into a failure.
  notify_deploy success "$LAST_HTTP_CODE" || true
  ok "environment '${env_name:-default}' deployed and verified"
}

# --- Entry point ---------------------------------------------------------------
if [ "$PIPELINE" = "1" ] && [ "$CHECK_ONLY" = "1" ]; then
  # Verify both environments without deploying.
  for env in staging prod; do
    step "Verifying ${env} (check-only)"
    load_env_file ".env.deploy.${env}" 1
    preflight
    verify_deploy || { fail "Verification failed for ${env}."; exit 1; }
  done
  echo -e "\n${GREEN}✅ Pipeline check complete (staging + prod verified).${NC}"
  exit 0
fi

if [ "$CHECK_ONLY" = "1" ]; then
  if [ -n "$DEPLOY_ENV" ]; then
    load_env_file ".env.deploy.${DEPLOY_ENV}" 1
    preflight
    verify_deploy || { fail "Verification failed for '${DEPLOY_ENV}'."; exit 1; }
  else
    load_env_file ".env.deploy" 0
    preflight
    verify_deploy || { fail "Verification failed."; exit 1; }
  fi
  echo -e "\n${GREEN}✅ Verification complete.${NC}"
  exit 0
fi

if [ "$PIPELINE" = "1" ]; then
  echo -e "\n${YELLOW}==> Pipeline: staging first, then production${NC}"
  deploy_env "staging" ".env.deploy.staging"

  if [ "$AUTO_YES" != "1" ]; then
    echo
    # `|| confirm=""` so a closed stdin (CI / < /dev/null) defaults to "no"
    # instead of aborting under set -e.
    read -r -p "    Staging passed. Deploy to PRODUCTION? [y/N] " confirm || confirm=""
    case "$confirm" in
      y|Y|yes|YES) ;;
      *)
        echo -e "\n    Production deploy skipped by user. Staging is live and verified."
        exit 0
        ;;
    esac
  fi
  # Reuse the local build from the staging pass.
  SKIP_BUILD=1
  deploy_env "prod" ".env.deploy.prod"
  echo -e "\n${GREEN}✅ Pipeline complete: staging + production deployed and verified.${NC}"
  exit 0
fi

if [ -n "$DEPLOY_ENV" ]; then
  deploy_env "$DEPLOY_ENV" ".env.deploy.${DEPLOY_ENV}"
else
  # Legacy single-environment path: .env.deploy is optional — inline env vars
  # (DEPLOY_HOST=... ./deploy.sh) work with no config file at all.
  deploy_env "" ".env.deploy" 0
fi

echo -e "\n${GREEN}✅ Deploy complete.${NC}"
