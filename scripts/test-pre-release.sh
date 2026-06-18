#!/bin/bash
# ─────────────────────────────────────────────────────────────────────────────
# Agent Hands — Pre-Release Test Suite
#
# Chạy TẤT CẢ kiểm tra trước khi release:
#   1. Static checks (build, version, typecheck, lint)
#   2. Server integration tests (bun test)
#   3. Production smoke tests (start server → hit mọi endpoint)
#   4. Upgrade 404 regression (directory-swap bug)
#   5. CLI & install.sh validation
#
# Usage:
#   bash scripts/test-pre-release.sh
#
# Prerequisites:
#   - Project đã build: bun run build
#   - Port 19998 free
#   - Dev server chạy trên 18080 (cho integration tests) hoặc script tự start
# ─────────────────────────────────────────────────────────────────────────────
set -uo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR"

# ── Config ──────────────────────────────────────────────────────────────────
TEST_PORT=19998
TEST_HOST="127.0.0.1"
VERSION=$(node -p "require('./package.json').version" 2>/dev/null || echo "unknown")

# ── Colors ──────────────────────────────────────────────────────────────────
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
BOLD='\033[1m'
DIM='\033[2m'
NC='\033[0m'

# ── Counters ────────────────────────────────────────────────────────────────
TOTAL=0
PASSED=0
FAILED=0
SKIPPED=0
FAILED_NAMES=()
PHASE_START=0
OVERALL_START=$(date +%s)

phase() {
  echo ""
  echo -e "${CYAN}${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${CYAN}${BOLD}  $*${NC}"
  echo -e "${CYAN}${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  PHASE_START=$(date +%s)
}

phase_end() {
  local elapsed=$(( $(date +%s) - PHASE_START ))
  echo -e "\n  ${DIM}⏱  ${elapsed}s${NC}"
}

step()      { echo -e "\n${CYAN}▸${NC} ${BOLD}$*${NC}"; }
info()      { echo -e "  ${DIM}$*${NC}"; }

pass_test() {
  TOTAL=$((TOTAL + 1)); PASSED=$((PASSED + 1))
  echo -e "  ${GREEN}✔${NC}  $1"
}

fail_test() {
  TOTAL=$((TOTAL + 1)); FAILED=$((FAILED + 1))
  FAILED_NAMES+=("$1")
  echo -e "  ${RED}✘${NC}  $1"
  [ -n "${2:-}" ] && echo -e "     ${DIM}$2${NC}"
}

skip_test() {
  TOTAL=$((TOTAL + 1)); SKIPPED=$((SKIPPED + 1))
  echo -e "  ${YELLOW}⊘${NC}  $1 ${DIM}(skipped)${NC}"
}

# ── Server helpers ──────────────────────────────────────────────────────────
SERVER_PID=""
TEST_DIR=""
AUTH_TOKEN=""

start_test_server() {
  TEST_DIR=$(mktemp -d)
  local install_dir="$TEST_DIR/agent-hands"
  local data_dir="$TEST_DIR/data"
  mkdir -p "$install_dir/dist" "$data_dir"
  cp "$ROOT_DIR/dist/index.js" "$install_dir/dist/"
  cp -r "$ROOT_DIR/public" "$install_dir/public" 2>/dev/null || true
  cp "$ROOT_DIR/package.json" "$install_dir/"

  PORT=$TEST_PORT HOST=$TEST_HOST DATA_DIR=$data_dir \
    bun run "$install_dir/dist/index.js" >"$TEST_DIR/server.log" 2>&1 &
  SERVER_PID=$!

  for i in $(seq 1 20); do
    curl -sf "http://$TEST_HOST:$TEST_PORT/api/health" >/dev/null 2>&1 && return 0
    sleep 1
  done
  echo "Server log:" && tail -20 "$TEST_DIR/server.log"
  return 1
}

stop_test_server() {
  if [ -n "$SERVER_PID" ] && kill -0 "$SERVER_PID" 2>/dev/null; then
    kill "$SERVER_PID" 2>/dev/null || true
    wait "$SERVER_PID" 2>/dev/null || true
  fi
  SERVER_PID=""
  lsof -ti :$TEST_PORT 2>/dev/null | xargs kill -9 2>/dev/null || true
  [ -n "$TEST_DIR" ] && rm -rf "$TEST_DIR" && TEST_DIR=""
}

api_get()    { curl -sf "http://$TEST_HOST:$TEST_PORT$1" -H "Authorization: Bearer $AUTH_TOKEN" 2>/dev/null; }
api_post()   { curl -sf "http://$TEST_HOST:$TEST_PORT$1" -H "Authorization: Bearer $AUTH_TOKEN" -H "Content-Type: application/json" -d "$2" 2>/dev/null; }
api_delete() { curl -sf "http://$TEST_HOST:$TEST_PORT$1" -H "Authorization: Bearer $AUTH_TOKEN" -X DELETE 2>/dev/null; }
api_status() { curl -so /dev/null -w "%{http_code}" "http://$TEST_HOST:$TEST_PORT$1" -H "Authorization: Bearer $AUTH_TOKEN" 2>/dev/null || echo "000"; }

cleanup_all() { stop_test_server; }
trap 'cleanup_all' EXIT

# ── Banner ──────────────────────────────────────────────────────────────────
echo ""
echo -e "${BOLD}🧪 Agent Hands — Pre-Release Test Suite${NC}"
echo -e "${DIM}   Version: v${VERSION} | $(date '+%Y-%m-%d %H:%M:%S')${NC}"
echo ""

# ════════════════════════════════════════════════════════════════════════════
# PHASE 1: Static Checks
# ════════════════════════════════════════════════════════════════════════════
phase "Phase 1: Static Checks"

# ── 1.1 Build artifacts ───────────────────────────────────────────────────
step "Build artifacts"

if [ -f "$ROOT_DIR/dist/index.js" ]; then
  pass_test "dist/index.js exists"
else
  fail_test "dist/index.js exists" "Run 'bun run build' first"
fi

if [ -f "$ROOT_DIR/public/index.html" ]; then
  pass_test "public/index.html exists"
else
  fail_test "public/index.html exists" "Run 'bun run build:web' and copy to public/"
fi

if [ -d "$ROOT_DIR/public/assets" ]; then
  ASSET_COUNT=$(find "$ROOT_DIR/public/assets" -type f | wc -l | tr -d ' ')
  pass_test "public/assets/ has $ASSET_COUNT files"
else
  fail_test "public/assets/ exists"
fi

# ── 1.2 Version consistency ──────────────────────────────────────────────
step "Version consistency"

ROOT_VER=$(node -p "require('./package.json').version")
SERVER_VER=$(node -p "require('./src/server/package.json').version")
WEB_VER=$(node -p "require('./src/web/package.json').version")

if [ "$ROOT_VER" = "$SERVER_VER" ] && [ "$ROOT_VER" = "$WEB_VER" ]; then
  pass_test "All package.json versions match: v$ROOT_VER"
else
  fail_test "Version mismatch" "root=$ROOT_VER, server=$SERVER_VER, web=$WEB_VER"
fi

# ── 1.3 TypeScript typecheck ─────────────────────────────────────────────
step "TypeScript typecheck — Server"
if (cd src/server && bunx tsc --noEmit >/dev/null 2>&1); then
  pass_test "Server typecheck passed"
else
  fail_test "Server typecheck failed"
fi

step "TypeScript typecheck — Web"
if (cd src/web && bunx tsc --noEmit >/dev/null 2>&1); then
  pass_test "Web typecheck passed"
else
  fail_test "Web typecheck failed"
fi

# ── 1.4 Lint ─────────────────────────────────────────────────────────────
step "Biome lint — Web"
if (bunx biome lint ./src/web >/dev/null 2>&1); then
  pass_test "Web lint passed (no errors)"
else
  fail_test "Web lint has errors"
fi

phase_end

# ════════════════════════════════════════════════════════════════════════════
# PHASE 2: Server Integration Tests
# ════════════════════════════════════════════════════════════════════════════
phase "Phase 2: Server Integration Tests"

step "Checking dev server on port 18080..."

DEV_SERVER_WAS_RUNNING=true
DEV_PID=""

if ! curl -sf "http://127.0.0.1:18080/api/health" >/dev/null 2>&1; then
  DEV_SERVER_WAS_RUNNING=false
  info "Starting dev server..."
  DATA_DIR="$HOME/.agent-hands" PORT=18080 HOST=127.0.0.1 \
    bun run src/server/src/index.ts >/tmp/agent-hands-test-dev.log 2>&1 &
  DEV_PID=$!
  for i in $(seq 1 15); do
    curl -sf "http://127.0.0.1:18080/api/health" >/dev/null 2>&1 && break
    sleep 1
  done
fi

if curl -sf "http://127.0.0.1:18080/api/health" >/dev/null 2>&1; then
  pass_test "Dev server ready on :18080"

  TEST_FILES=(
    "src/server/src/modules/kv-store/kv-store.test.ts"
    "src/server/src/modules/datatables/mql-query.test.ts"
    "src/server/src/modules/storage/files.test.ts"
    "src/server/src/modules/llm-providers/llm-providers.test.ts"
    "src/server/src/modules/users/users.test.ts"
    "src/server/src/modules/dynamic-apis/dynamic-apis.test.ts"
    "src/server/src/modules/mcp-tool-servers/mcp-servers.test.ts"
    "src/server/src/modules/browsers/browsers.test.ts"
  )

  for test_file in "${TEST_FILES[@]}"; do
    test_name=$(basename "$test_file" .test.ts)
    if [ -f "$ROOT_DIR/$test_file" ]; then
      step "Running: $test_name"
      if (cd src/server && bun test "$ROOT_DIR/$test_file" 2>&1 | tail -3); then
        pass_test "$test_name"
      else
        fail_test "$test_name"
      fi
    else
      skip_test "$test_name — file not found"
    fi
  done
else
  skip_test "Integration tests — dev server unavailable"
fi

# Cleanup dev server if we started it
if [ "$DEV_SERVER_WAS_RUNNING" = false ] && [ -n "$DEV_PID" ]; then
  kill "$DEV_PID" 2>/dev/null || true
  wait "$DEV_PID" 2>/dev/null || true
fi

phase_end

# ════════════════════════════════════════════════════════════════════════════
# PHASE 3: Production Smoke Tests
# ════════════════════════════════════════════════════════════════════════════
phase "Phase 3: Production Smoke Tests"

step "Starting server from dist/ (port $TEST_PORT)"

if ! start_test_server; then
  fail_test "Server starts from dist/" "Check $TEST_DIR/server.log"
  echo -e "\n  ${RED}${BOLD}Server failed to start — aborting smoke tests${NC}"
  phase_end
  # jump to summary
  FAILED=$((FAILED + 20))  # approximate remaining tests
  # fall through to summary
else
  pass_test "Server starts from dist/"

  # ── Health ─────────────────────────────────────────────────────────────
  step "Health & version"

  HEALTH=$(curl -sf "http://$TEST_HOST:$TEST_PORT/api/health" 2>/dev/null)
  if echo "$HEALTH" | grep -q '"ok":true'; then
    pass_test "GET /api/health → ok:true"
  else
    fail_test "GET /api/health" "$HEALTH"
  fi

  if echo "$HEALTH" | grep -q "\"version\":\"$VERSION\""; then
    pass_test "Version matches: v$VERSION"
  else
    fail_test "Version mismatch in /api/health"
  fi

  # ── Auth ───────────────────────────────────────────────────────────────
  step "Authentication"

  LOGIN_RESP=$(curl -sf "http://$TEST_HOST:$TEST_PORT/api/auth/login" \
    -H "Content-Type: application/json" \
    -d '{"login":"admin","password":"admin123"}' 2>/dev/null)

  if echo "$LOGIN_RESP" | grep -q '"access_token"'; then
    pass_test "POST /api/auth/login — OK"
    AUTH_TOKEN=$(echo "$LOGIN_RESP" | grep -o '"access_token":"[^"]*"' | sed 's/"access_token":"//;s/"//')
  else
    fail_test "POST /api/auth/login" "$LOGIN_RESP"
  fi

  WRONG=$(curl -so /dev/null -w "%{http_code}" "http://$TEST_HOST:$TEST_PORT/api/auth/login" \
    -H "Content-Type: application/json" -d '{"login":"admin","password":"wrong"}' 2>/dev/null)
  [ "$WRONG" = "401" ] && pass_test "Wrong password → 401" || fail_test "Wrong password → $WRONG (expected 401)"

  NOAUTH=$(curl -so /dev/null -w "%{http_code}" "http://$TEST_HOST:$TEST_PORT/api/users" 2>/dev/null)
  [ "$NOAUTH" = "401" ] && pass_test "No token → 401" || fail_test "No token → $NOAUTH (expected 401)"

  # ── Core CRUD ──────────────────────────────────────────────────────────
  step "Core API endpoints"

  # KV Store
  KV_SET=$(api_post "/api/kv-store" '{"key":"_test_rel","value":"hello","namespace":"default"}')
  echo "$KV_SET" | grep -q '"key"' && pass_test "POST /api/kv-store" || fail_test "POST /api/kv-store" "$KV_SET"

  KV_GET=$(api_get "/api/kv-store/by-key/_test_rel?namespace=default")
  echo "$KV_GET" | grep -q 'hello' && pass_test "GET /api/kv-store/by-key/:key" || fail_test "GET /api/kv-store/by-key/:key" "$KV_GET"

  api_delete "/api/kv-store/by-key/_test_rel?namespace=default" >/dev/null 2>&1
  pass_test "DELETE /api/kv-store — cleanup"

  # Users
  USERS=$(api_get "/api/users")
  echo "$USERS" | grep -q '"admin"' && pass_test "GET /api/users" || fail_test "GET /api/users" "$USERS"

  # All module endpoints (status check)
  ENDPOINT_PATHS=(
    "/api/docs"
    "/api/system/info"
    "/api/mcp-tool-servers?page=1&limit=10"
    "/api/datatables"
    "/api/storage"
    "/api/dynamic-apis"
    "/api/llm-providers"
    "/api/browsers?page=1&limit=10"
    "/api/api-keys"
  )
  ENDPOINT_NAMES=(
    "API Docs"
    "System Info"
    "MCP Servers"
    "Datatables"
    "Storage"
    "Dynamic APIs"
    "LLM Providers"
    "Browsers"
    "API Keys"
  )

  for i in "${!ENDPOINT_PATHS[@]}"; do
    path="${ENDPOINT_PATHS[$i]}"
    name="${ENDPOINT_NAMES[$i]}"
    status=$(api_status "$path")
    [ "$status" = "200" ] \
      && pass_test "GET $name → 200" \
      || fail_test "GET $name → $status (expected 200)"
  done

  # Configurations (404 OK — may not have any yet)
  CONF_STATUS=$(api_status "/api/configurations")
  if [ "$CONF_STATUS" = "200" ] || [ "$CONF_STATUS" = "404" ]; then
    pass_test "GET Configurations → $CONF_STATUS"
  else
    fail_test "GET Configurations → $CONF_STATUS"
  fi

  # ── SPA ────────────────────────────────────────────────────────────────
  step "Web UI (SPA)"

  UI=$(curl -so /dev/null -w "%{http_code}" "http://$TEST_HOST:$TEST_PORT/ui" 2>/dev/null)
  [ "$UI" = "200" ] && pass_test "GET /ui → 200" || fail_test "GET /ui → $UI"

  UI_DEEP=$(curl -so /dev/null -w "%{http_code}" "http://$TEST_HOST:$TEST_PORT/ui/settings" 2>/dev/null)
  [ "$UI_DEEP" = "200" ] && pass_test "GET /ui/settings (deep route) → 200" || fail_test "GET /ui/settings → $UI_DEEP"

  ROOT_R=$(curl -so /dev/null -w "%{http_code}" "http://$TEST_HOST:$TEST_PORT/" 2>/dev/null)
  [ "$ROOT_R" = "302" ] || [ "$ROOT_R" = "301" ] && pass_test "GET / → redirect ($ROOT_R)" || fail_test "GET / → $ROOT_R (expected 3xx)"

  UI_HTML=$(curl -sf "http://$TEST_HOST:$TEST_PORT/ui" 2>/dev/null)
  echo "$UI_HTML" | grep -q '<div id="root"' && pass_test "SPA HTML has React root" || fail_test "SPA HTML missing React root"

  FAV=$(curl -so /dev/null -w "%{http_code}" "http://$TEST_HOST:$TEST_PORT/ui/favicon.svg" 2>/dev/null)
  [ "$FAV" = "200" ] && pass_test "GET /ui/favicon.svg → 200" || fail_test "GET /ui/favicon.svg → $FAV"

  # ── S3 ─────────────────────────────────────────────────────────────────
  step "S3 endpoint"
  S3=$(curl -so /dev/null -w "%{http_code}" "http://$TEST_HOST:$TEST_PORT/s3" 2>/dev/null)
  [ "$S3" != "000" ] && pass_test "S3 /s3 responds ($S3)" || fail_test "S3 /s3 unreachable"

  stop_test_server
  phase_end
fi

# ════════════════════════════════════════════════════════════════════════════
# PHASE 4: Upgrade 404 Regression
# ════════════════════════════════════════════════════════════════════════════
phase "Phase 4: Upgrade 404 Regression"

step "Simulating directory-swap upgrade"

TEST_DIR=$(mktemp -d)
INSTALL_DIR="$TEST_DIR/agent-hands"
DATA_DIR="$TEST_DIR/data"

mkdir -p "$INSTALL_DIR/dist" "$DATA_DIR"
cp "$ROOT_DIR/dist/index.js" "$INSTALL_DIR/dist/"
cp -r "$ROOT_DIR/public" "$INSTALL_DIR/public" 2>/dev/null || true
cp "$ROOT_DIR/package.json" "$INSTALL_DIR/"

PORT=$TEST_PORT HOST=$TEST_HOST DATA_DIR=$DATA_DIR \
  bun run "$INSTALL_DIR/dist/index.js" >"$TEST_DIR/server.log" 2>&1 &
SERVER_PID=$!

for i in $(seq 1 20); do
  curl -sf "http://$TEST_HOST:$TEST_PORT/api/health" >/dev/null 2>&1 && break
  sleep 1
done

if ! curl -sf "http://$TEST_HOST:$TEST_PORT/api/health" >/dev/null 2>&1; then
  fail_test "Server start for upgrade test"
else
  UI_BEFORE=$(curl -so /dev/null -w "%{http_code}" "http://$TEST_HOST:$TEST_PORT/ui" 2>/dev/null)
  [ "$UI_BEFORE" = "200" ] && pass_test "/ui → 200 before upgrade" || fail_test "/ui → $UI_BEFORE before upgrade"

  # BAD upgrade: rm -rf + recreate WITHOUT stopping
  info "Deleting and recreating install dir (server still running)..."
  rm -rf "$INSTALL_DIR"
  mkdir -p "$INSTALL_DIR/dist"
  cp "$ROOT_DIR/dist/index.js" "$INSTALL_DIR/dist/"
  cp -r "$ROOT_DIR/public" "$INSTALL_DIR/public" 2>/dev/null || true
  cp "$ROOT_DIR/package.json" "$INSTALL_DIR/"

  # Kill and restart (simulates monitor respawn)
  info "Killing server and respawning (like monitor)..."
  kill $SERVER_PID 2>/dev/null || true
  wait $SERVER_PID 2>/dev/null || true

  PORT=$TEST_PORT HOST=$TEST_HOST DATA_DIR=$DATA_DIR \
    bun run "$INSTALL_DIR/dist/index.js" >"$TEST_DIR/server2.log" 2>&1 &
  SERVER_PID=$!

  for i in $(seq 1 20); do
    curl -sf "http://$TEST_HOST:$TEST_PORT/api/health" >/dev/null 2>&1 && break
    sleep 1
  done

  if curl -sf "http://$TEST_HOST:$TEST_PORT/api/health" >/dev/null 2>&1; then
    UI_AFTER=$(curl -so /dev/null -w "%{http_code}" "http://$TEST_HOST:$TEST_PORT/ui" 2>/dev/null)
    [ "$UI_AFTER" = "200" ] \
      && pass_test "/ui → 200 after directory-swap (fix works!)" \
      || fail_test "/ui → $UI_AFTER after directory-swap (404 REGRESSION!)"
  else
    fail_test "Server restart after upgrade"
  fi
fi

stop_test_server

phase_end

# ════════════════════════════════════════════════════════════════════════════
# PHASE 5: CLI & install.sh Validation
# ════════════════════════════════════════════════════════════════════════════
phase "Phase 5: CLI & install.sh"

step "CLI entry point"

[ -f "$ROOT_DIR/bin/agent-hands.js" ] && pass_test "bin/agent-hands.js exists" || fail_test "bin/agent-hands.js missing"

head -1 "$ROOT_DIR/bin/agent-hands.js" | grep -q "#!/usr/bin/env bun" \
  && pass_test "CLI shebang correct" || fail_test "CLI shebang missing"

CLI_HELP=$(bun "$ROOT_DIR/bin/agent-hands.js" help 2>&1)
echo "$CLI_HELP" | grep -q "start" && pass_test "CLI help shows commands" || fail_test "CLI help broken"

CLI_VER=$(bun "$ROOT_DIR/bin/agent-hands.js" version 2>&1)
echo "$CLI_VER" | grep -q "$VERSION" \
  && pass_test "CLI version: $CLI_VER" \
  || fail_test "CLI version mismatch" "Expected $VERSION, got: $CLI_VER"

# ── install.sh ───────────────────────────────────────────────────────────
step "install.sh"

[ -f "$ROOT_DIR/install.sh" ] && pass_test "install.sh exists" || fail_test "install.sh missing"

grep -q "Stopping running server before" "$ROOT_DIR/install.sh" \
  && pass_test "install.sh stops server before rm -rf (404 fix)" \
  || fail_test "install.sh missing stop-before-delete (404 bug risk!)"

for pattern in "INSTALL_DIR" "tar -xzf" "chmod +x" "agent-hands.js" "restart"; do
  grep -q "$pattern" "$ROOT_DIR/install.sh" \
    && pass_test "install.sh has '$pattern'" \
    || fail_test "install.sh missing '$pattern'"
done

# ── Tarball structure ────────────────────────────────────────────────────
step "Tarball structure"

STAGING_DIR=$(mktemp -d)
STAGING="$STAGING_DIR/agent-hands"
mkdir -p "$STAGING/bin" "$STAGING/dist" "$STAGING/public"
cp -r "$ROOT_DIR/dist/"* "$STAGING/dist/" 2>/dev/null
cp -r "$ROOT_DIR/public/"* "$STAGING/public/" 2>/dev/null
cp "$ROOT_DIR/bin/agent-hands.js" "$STAGING/bin/"
cp "$ROOT_DIR/package.json" "$STAGING/"

for path in "dist/index.js" "public/index.html" "public/favicon.svg" "public/assets" "bin/agent-hands.js" "package.json"; do
  [ -e "$STAGING/$path" ] && pass_test "Tarball: $path" || fail_test "Tarball: $path missing"
done

TOTAL_FILES=$(find "$STAGING" -type f | wc -l | tr -d ' ')
[ "$TOTAL_FILES" -gt 10 ] \
  && pass_test "Tarball file count: $TOTAL_FILES" \
  || fail_test "Tarball too few files ($TOTAL_FILES)"

# ── Release package.json cleanliness ─────────────────────────────────
step "Release package.json validation"

# Simulate what release.sh does: clean the package.json
if command -v node &> /dev/null; then
  node -e "
    const fs = require('fs');
    const p = JSON.parse(fs.readFileSync('$STAGING/package.json', 'utf8'));
    delete p.workspaces;
    delete p.devDependencies;
    delete p.scripts;
    fs.writeFileSync('$STAGING/package.json', JSON.stringify(p, null, 2) + '\n');
  "
fi

# Test: no workspaces in release package.json
if grep -q '"workspaces"' "$STAGING/package.json"; then
  fail_test "Release package.json has 'workspaces'" \
    "This breaks 'bun add' in install dir (src/server, src/web don't exist)"
else
  pass_test "Release package.json: no workspaces"
fi

# Test: no devDependencies in release package.json
if grep -q '"devDependencies"' "$STAGING/package.json"; then
  fail_test "Release package.json has 'devDependencies'" \
    "Dev deps are not needed in production"
else
  pass_test "Release package.json: no devDependencies"
fi

# Test: no scripts in release package.json
if grep -q '"scripts"' "$STAGING/package.json"; then
  fail_test "Release package.json has 'scripts'" \
    "Source scripts reference src/ dirs that don't exist in release"
else
  pass_test "Release package.json: no scripts"
fi

# Test: bun add works in staging dir (simulates playwright install step)
step "bun add in release dir (Playwright install simulation)"
if (cd "$STAGING" && bun add --dry-run is-even >/dev/null 2>&1); then
  pass_test "bun add works in release dir (no workspace errors)"
else
  fail_test "bun add fails in release dir" \
    "Users will see 'Workspace not found' when install.sh tries to add playwright"
fi

rm -rf "$STAGING_DIR"

phase_end

# ════════════════════════════════════════════════════════════════════════════
# PHASE 6: Container Install Tests (Apple container CLI)
# ════════════════════════════════════════════════════════════════════════════
phase "Phase 6: Container Install Tests"

# Find Apple container CLI
CONTAINER_CLI=""
for candidate in \
  "$(command -v container 2>/dev/null || true)" \
  "/opt/homebrew/bin/container" \
  "/usr/local/bin/container"
do
  if [ -n "$candidate" ] && [ -x "$candidate" ] && "$candidate" --version &>/dev/null; then
    CONTAINER_CLI="$candidate"
    break
  fi
done

if [ -z "$CONTAINER_CLI" ]; then
  skip_test "Container install tests — Apple container CLI not available (brew install container)"
  phase_end
else
  info "Using Apple container CLI: $($CONTAINER_CLI --version 2>&1)"

  step "Preparing test artifacts"

  CONTAINER_TMP=$(mktemp -d)
  trap "rm -rf '$CONTAINER_TMP'; cleanup_all" EXIT

  # ── Create test tarball ──────────────────────────────────────────────
  STAGING="$CONTAINER_TMP/agent-hands"
  mkdir -p "$STAGING/bin" "$STAGING/dist" "$STAGING/public"

  # Minimal CLI (functional with bun)
  cat > "$STAGING/bin/agent-hands.js" << 'CLI_EOF'
#!/usr/bin/env bun
import { existsSync } from "node:fs";
import { join, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import os from "node:os";
const __dirname = dirname(fileURLToPath(import.meta.url));
const PKG_ROOT = resolve(__dirname, "..");
const dataDir = process.env.DATA_DIR ?? join(os.homedir(), ".agent-hands");
const markerFile = join(dataDir, ".initialized");
const cmd = process.argv[2];
switch (cmd) {
  case "version": console.log(`agent-hands v1.0.0`); break;
  case "init":    console.log("✅ Super admin created (test)."); break;
  case "start":   console.log("🤖 Server started (test)."); break;
  case "stop":    console.log("🛑 Server stopped (test)."); break;
  case "restart":
    console.log("🛑 Stopping...");
    if (!existsSync(markerFile)) {
      console.log("🔑 Default super admin created:");
      console.log("   Username : admin");
      const { mkdirSync, writeFileSync } = await import("node:fs");
      mkdirSync(dataDir, { recursive: true });
      writeFileSync(markerFile, "done");
    }
    console.log("🤖 Agent Hands started!");
    console.log("   PID      : 12345");
    console.log("   URL      : http://127.0.0.1:18080");
    break;
  case "status":  console.log("🟢 Agent Hands is running"); break;
  default:        console.log("Usage: agent-hands <command>"); break;
}
CLI_EOF
  chmod +x "$STAGING/bin/agent-hands.js"
  cat > "$STAGING/package.json" << 'PKG'
{ "name": "agent-hands", "version": "1.0.0" }
PKG
  echo "// server entry (test)" > "$STAGING/dist/index.js"

  TARBALL_PATH="$CONTAINER_TMP/agent-hands-1.0.0.tar.gz"
  (cd "$CONTAINER_TMP" && COPYFILE_DISABLE=1 tar -czf "$TARBALL_PATH" agent-hands)

  # ── Prepare HTTP server files ────────────────────────────────────────
  HTTP_DIR="$CONTAINER_TMP/http"
  mkdir -p "$HTTP_DIR/repos/phamvanquyit/agent-hands/releases"
  echo '{"tag_name": "v1.0.0"}' > "$HTTP_DIR/repos/phamvanquyit/agent-hands/releases/latest"
  mkdir -p "$HTTP_DIR/phamvanquyit/agent-hands/releases/download/v1.0.0"
  cp "$TARBALL_PATH" "$HTTP_DIR/phamvanquyit/agent-hands/releases/download/v1.0.0/"

  # ── Create Containerfile (Dockerfile) ────────────────────────────────
  cat > "$CONTAINER_TMP/Dockerfile" << 'DOCKERFILE'
FROM debian:bookworm-slim
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl ca-certificates sudo python3 unzip \
    && rm -rf /var/lib/apt/lists/*
RUN useradd -m -s /bin/bash testuser \
    && echo "testuser ALL=(ALL) NOPASSWD:ALL" >> /etc/sudoers
USER testuser
WORKDIR /home/testuser
RUN curl -fsSL https://bun.sh/install | bash
ENV PATH="/home/testuser/.bun/bin:$PATH"
USER root
WORKDIR /test
COPY run-tests.sh /test/run-tests.sh
RUN chmod +x /test/run-tests.sh
USER testuser
WORKDIR /home/testuser
ENTRYPOINT ["/test/run-tests.sh"]
DOCKERFILE

  # ── Create test runner script ────────────────────────────────────────
  cat > "$CONTAINER_TMP/run-tests.sh" << 'RUNNER_EOF'
#!/bin/bash
set -uo pipefail
RED='\033[0;31m'; GREEN='\033[0;32m'; CYAN='\033[0;36m'; BOLD='\033[1m'; DIM='\033[2m'; NC='\033[0m'
TP=0; TF=0; TT=0
pass() { TP=$((TP+1)); TT=$((TT+1)); echo -e "  ${GREEN}✅${NC} $1"; }
fail_t() { TF=$((TF+1)); TT=$((TT+1)); echo -e "  ${RED}❌${NC} $1"; [ -n "${2:-}" ] && echo -e "     ${DIM}$2${NC}"; }
assert_eq() { TT=$((TT+1)); [ "$2" = "$3" ] && pass "$1" || fail_t "$1" "Expected '$2', got '$3'"; }
assert()  { local label="$1"; shift; TT=$((TT+1)); if "$@" 2>/dev/null; then pass "$label"; else fail_t "$label" "Failed: $*"; fi; }

HTTP_PID=""
start_http() { cd /test/http; python3 -m http.server 18888 --bind 127.0.0.1 &>/dev/null & HTTP_PID=$!; cd ~; sleep 0.5; }
stop_http()  { [ -n "$HTTP_PID" ] && kill "$HTTP_PID" 2>/dev/null; }
patched_installer() {
  sed -e "s|https://api.github.com|http://127.0.0.1:18888|g" \
      -e "s|https://github.com|http://127.0.0.1:18888|g" \
      /test/install.sh > "$1"
  chmod +x "$1"
}
cleanup() {
  rm -rf "$HOME/.local/share/agent-hands" 2>/dev/null
  sudo rm -f /usr/local/bin/agent-hands 2>/dev/null
  rm -f "$HOME/.local/bin/agent-hands" "$HOME/bin/agent-hands" 2>/dev/null
}

echo -e "\n${BOLD}📦 Container Install Tests${NC}"
start_http
trap 'stop_http' EXIT

# ── Test 1: Fresh Install ──────────────────────────────────
echo -e "\n${CYAN}${BOLD}▸ Fresh Install${NC}"
cleanup
inst="/tmp/inst.sh"; patched_installer "$inst"
output=$(VERSION=1.0.0 bash "$inst" 2>&1); ec=$?
dir="$HOME/.local/share/agent-hands"
assert_eq "Exit code 0" "0" "$ec"
assert "Install dir exists" test -d "$dir"
assert "package.json exists" test -f "$dir/package.json"
assert "CLI executable" test -x "$dir/bin/agent-hands.js"
v=$(grep '"version"' "$dir/package.json" | sed -E 's/.*"version": *"([^"]+)".*/\1/')
assert_eq "Version 1.0.0" "1.0.0" "$v"
TT=$((TT+1)); if [ -L /usr/local/bin/agent-hands ] || [ -L "$HOME/.local/bin/agent-hands" ]; then pass "Symlink created"; else fail_t "Symlink created"; fi
cli=$(bun "$dir/bin/agent-hands.js" version 2>&1)
TT=$((TT+1)); echo "$cli" | grep -q "v1.0.0" && pass "CLI works" || fail_t "CLI broken" "$cli"
TT=$((TT+1)); echo "$output" | grep -q "Default super admin created" && pass "Admin seeded" || fail_t "Admin not seeded"
cleanup

# ── Test 2: Upgrade ────────────────────────────────────────
echo -e "\n${CYAN}${BOLD}▸ Upgrade v0.9.0 → v1.0.0${NC}"
cleanup
mkdir -p "$dir/bin"
echo '{ "name": "agent-hands", "version": "0.9.0" }' > "$dir/package.json"
echo '#!/usr/bin/env bun' > "$dir/bin/agent-hands.js"; chmod +x "$dir/bin/agent-hands.js"
output=$(VERSION=1.0.0 bash "$inst" 2>&1); ec=$?
assert_eq "Exit code 0" "0" "$ec"
v=$(grep '"version"' "$dir/package.json" | sed -E 's/.*"version": *"([^"]+)".*/\1/')
assert_eq "Upgraded to 1.0.0" "1.0.0" "$v"
TT=$((TT+1)); echo "$output" | grep -q "Upgrading v0.9.0" && pass "Upgrade msg shown" || fail_t "No upgrade msg"
cleanup

# ── Test 3: Corrupt tarball ────────────────────────────────
echo -e "\n${CYAN}${BOLD}▸ Corrupt Tarball${NC}"
cleanup
mkdir -p "$dir/bin"
echo '{ "name": "agent-hands", "version": "0.9.0" }' > "$dir/package.json"
echo '#!/usr/bin/env bun' > "$dir/bin/agent-hands.js"; chmod +x "$dir/bin/agent-hands.js"
corrupt="/tmp/corrupt-http"
mkdir -p "$corrupt/repos/phamvanquyit/agent-hands/releases" "$corrupt/phamvanquyit/agent-hands/releases/download/v1.0.0"
echo '{"tag_name": "v1.0.0"}' > "$corrupt/repos/phamvanquyit/agent-hands/releases/latest"
echo "CORRUPT" > "$corrupt/phamvanquyit/agent-hands/releases/download/v1.0.0/agent-hands-1.0.0.tar.gz"
cd "$corrupt"; python3 -m http.server 18889 --bind 127.0.0.1 &>/dev/null & cpid=$!; cd ~; sleep 0.3
cinst="/tmp/cinst.sh"
sed -e "s|https://api.github.com|http://127.0.0.1:18889|g" -e "s|https://github.com|http://127.0.0.1:18889|g" /test/install.sh > "$cinst"; chmod +x "$cinst"
output=$(VERSION=1.0.0 bash "$cinst" 2>&1); ec=$?
kill "$cpid" 2>/dev/null
TT=$((TT+1)); [ "$ec" -ne 0 ] && pass "Fails on corrupt tarball" || fail_t "Should fail on corrupt"
assert "Old package.json preserved" test -f "$dir/package.json"
pv=$(grep '"version"' "$dir/package.json" | sed -E 's/.*"version": *"([^"]+)".*/\1/')
assert_eq "Old version preserved" "0.9.0" "$pv"
rm -rf "$corrupt"
cleanup

# ── Test 4: Path with spaces ──────────────────────────────
echo -e "\n${CYAN}${BOLD}▸ Path With Spaces${NC}"
cleanup
spaced="$HOME/my apps/agent hands"
output=$(INSTALL_DIR="$spaced" VERSION=1.0.0 bash "$inst" 2>&1); ec=$?
assert_eq "Exit code 0" "0" "$ec"
assert "Spaced dir exists" test -d "$spaced"
assert "CLI in spaced path" test -x "$spaced/bin/agent-hands.js"
rm -rf "$spaced"
cleanup

# ── Test 5: File permissions ──────────────────────────────
echo -e "\n${CYAN}${BOLD}▸ File Permissions${NC}"
cleanup
VERSION=1.0.0 bash "$inst" &>/dev/null
assert "CLI is executable" test -x "$dir/bin/agent-hands.js"
owner=$(stat -c '%U' "$dir/bin/agent-hands.js" 2>/dev/null)
assert_eq "Owned by testuser" "testuser" "$owner"
cleanup

# ── Summary ────────────────────────────────────────────────
echo ""
echo -e "${DIM}─────────────────────────────────────────────────────${NC}"
echo -e "${BOLD}Container Results:${NC} ${GREEN}${TP} passed${NC}, ${RED}${TF} failed${NC}, ${TT} total"
echo ""
if [ "$TF" -gt 0 ]; then exit 1; else exit 0; fi
RUNNER_EOF

  # ── Build & Run ──────────────────────────────────────────────────────
  step "Building container image"
  IMAGE_NAME="agent-hands-prerelease-test"
  CONTAINER_BUILD_OK=false
  CONTAINER_BUILD_LOG=$(mktemp)
  $CONTAINER_CLI build -t "$IMAGE_NAME" -f "$CONTAINER_TMP/Dockerfile" "$CONTAINER_TMP" > "$CONTAINER_BUILD_LOG" 2>&1
  if [ $? -eq 0 ]; then
    pass_test "Container image built"
    CONTAINER_BUILD_OK=true
  else
    skip_test "Container image build — container system not ready (run: container system start)"
    info "$(cat "$CONTAINER_BUILD_LOG")"
  fi
  rm -f "$CONTAINER_BUILD_LOG"

  if [ "$CONTAINER_BUILD_OK" = true ]; then
    step "Running install tests in container"
    CONTAINER_RUN_LOG=$(mktemp)
    $CONTAINER_CLI run --rm \
      -v "$ROOT_DIR/install.sh:/test/install.sh:ro" \
      -v "$HTTP_DIR:/test/http:ro" \
      "$IMAGE_NAME" > "$CONTAINER_RUN_LOG" 2>&1
    CONTAINER_EXIT=$?

    cat "$CONTAINER_RUN_LOG"
    rm -f "$CONTAINER_RUN_LOG"

    if [ "$CONTAINER_EXIT" -eq 0 ]; then
      pass_test "Container install tests — all passed"
    else
      fail_test "Container install tests — some failed"
    fi

    $CONTAINER_CLI image rm "$IMAGE_NAME" &>/dev/null || true
  else
    skip_test "Container install tests — skipped (build failed)"
  fi

  # Cleanup
  rm -rf "$CONTAINER_TMP"

  phase_end
fi


# ════════════════════════════════════════════════════════════════════════════
# SUMMARY
# ════════════════════════════════════════════════════════════════════════════
TOTAL_TIME=$(( $(date +%s) - OVERALL_START ))

echo ""
echo ""
echo -e "${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BOLD}  📊 Pre-Release Test Results — v${VERSION}${NC}"
echo -e "${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "  ${GREEN}Passed${NC}  : $PASSED"
echo -e "  ${RED}Failed${NC}  : $FAILED"
[ "$SKIPPED" -gt 0 ] && echo -e "  ${YELLOW}Skipped${NC} : $SKIPPED"
echo -e "  ${DIM}Total${NC}   : $TOTAL"
echo -e "  ${DIM}Time${NC}    : ${TOTAL_TIME}s"

if [ ${#FAILED_NAMES[@]} -gt 0 ]; then
  echo ""
  echo -e "  ${RED}${BOLD}Failed:${NC}"
  for name in "${FAILED_NAMES[@]}"; do
    echo -e "    ${RED}✘${NC} $name"
  done
fi

echo ""
if [ "$FAILED" -eq 0 ]; then
  echo -e "  ${GREEN}${BOLD}✅ ALL TESTS PASSED — Safe to release v${VERSION}${NC}"
  echo -e "  ${DIM}Next: bash scripts/release.sh${NC}"
else
  echo -e "  ${RED}${BOLD}❌ ${FAILED} TEST(S) FAILED — DO NOT RELEASE${NC}"
  echo -e "  ${DIM}Fix the failures above before running release.sh${NC}"
fi
echo ""
echo -e "${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

exit $FAILED
