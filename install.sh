#!/bin/bash
# ─────────────────────────────────────────────────────────────────────────────
# Agent Hands — Installer
#
# Usage:
#   curl -fsSL https://raw.githubusercontent.com/phamvanquyit/agent-hands/main/install.sh | bash
#
# Options (environment variables — use export before piping):
#   export VERSION=0.3.0 && curl ... | bash    Install a specific version
#   INSTALL_DIR=...    Custom install directory (default: ~/.local/share/agent-hands)
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

# Di chuyển về thư mục tạm an toàn để tránh lỗi cwd bị xóa
cd /tmp || cd "$HOME" || cd /


# ── Config ──────────────────────────────────────────────────────────────────
REPO="phamvanquyit/agent-hands"
INSTALL_DIR="${INSTALL_DIR:-$HOME/.local/share/agent-hands}"
# Determine the best BIN_DIR (prefer user-local directories if they are in PATH)
if [ -z "${BIN_DIR:-}" ]; then
  if [[ ":$PATH:" == *":$HOME/.local/bin:"* ]]; then
    BIN_DIR="$HOME/.local/bin"
  elif [[ ":$PATH:" == *":$HOME/bin:"* ]]; then
    BIN_DIR="$HOME/bin"
  else
    BIN_DIR="/usr/local/bin"
  fi
fi
BIN_NAME="agent-hands"

# ── Colors ──────────────────────────────────────────────────────────────────
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

info()    { echo -e "${CYAN}ℹ${NC}  $*"; }
success() { echo -e "${GREEN}✅${NC} $*"; }
warn()    { echo -e "${YELLOW}⚠️${NC}  $*"; }
error()   { echo -e "${RED}❌${NC} $*"; exit 1; }

# ── Banner ──────────────────────────────────────────────────────────────────
echo ""
echo -e "${BOLD}🤖 Agent Hands — Installer${NC}"
echo ""

# ── 1. Check prerequisites ─────────────────────────────────────────────────
if ! command -v bun &> /dev/null; then
  error "Bun runtime is required but not installed.
   Install it first:  curl -fsSL https://bun.sh/install | bash
   Then re-run this installer."
fi

BUN_VERSION=$(bun --version 2>/dev/null || echo "0.0.0")
info "Bun detected: v${BUN_VERSION}"

if ! command -v curl &> /dev/null && ! command -v wget &> /dev/null; then
  error "Either 'curl' or 'wget' is required to download files."
fi

# ── 2. Determine version ───────────────────────────────────────────────────
if [ -n "${VERSION:-}" ]; then
  TAG="v${VERSION}"
  info "Installing specified version: ${TAG}"
else
  info "Fetching latest release..."
  if command -v curl &> /dev/null; then
    TAG=$(curl -fsSL "https://api.github.com/repos/${REPO}/releases/latest" | grep '"tag_name"' | sed -E 's/.*"tag_name": *"([^"]+)".*/\1/')
  else
    TAG=$(wget -qO- "https://api.github.com/repos/${REPO}/releases/latest" | grep '"tag_name"' | sed -E 's/.*"tag_name": *"([^"]+)".*/\1/')
  fi

  if [ -z "$TAG" ]; then
    error "Could not determine the latest version. Check https://github.com/${REPO}/releases"
  fi

  info "Latest version: ${TAG}"
fi

VERSION_NUM="${TAG#v}"
TARBALL_NAME="agent-hands-${VERSION_NUM}.tar.gz"
DOWNLOAD_URL="https://github.com/${REPO}/releases/download/${TAG}/${TARBALL_NAME}"

# ── 3. Check for existing installation ──────────────────────────────────────
if [ -d "$INSTALL_DIR" ]; then
  EXISTING_VERSION=""
  if [ -f "$INSTALL_DIR/package.json" ]; then
    EXISTING_VERSION=$(grep '"version"' "$INSTALL_DIR/package.json" | head -1 | sed -E 's/.*"version": *"([^"]+)".*/\1/')
  fi

  if [ -n "$EXISTING_VERSION" ]; then
    if [ "$EXISTING_VERSION" = "$VERSION_NUM" ]; then
      warn "v${VERSION_NUM} is already installed. Reinstalling..."
    else
      info "Upgrading v${EXISTING_VERSION} → v${VERSION_NUM}"
    fi
  fi
fi

# ── 4. Download ─────────────────────────────────────────────────────────────
TMP_DIR=$(mktemp -d)
trap 'rm -rf "$TMP_DIR"' EXIT

info "Downloading ${TARBALL_NAME}..."
if command -v curl &> /dev/null; then
  curl -fSL --progress-bar "$DOWNLOAD_URL" -o "$TMP_DIR/$TARBALL_NAME"
else
  wget --show-progress -q "$DOWNLOAD_URL" -O "$TMP_DIR/$TARBALL_NAME"
fi

# ── 5. Extract (safe: stage first, then swap) ──────────────────────────────
info "Installing to ${INSTALL_DIR}..."
IS_FIRST_INSTALL=false
if [ ! -d "$INSTALL_DIR" ] || [ ! -f "$INSTALL_DIR/package.json" ]; then
  IS_FIRST_INSTALL=true
fi

STAGING_DIR="$TMP_DIR/staging"
mkdir -p "$STAGING_DIR"
tar -xzf "$TMP_DIR/$TARBALL_NAME" -C "$STAGING_DIR" --strip-components=1 --no-xattrs 2>/dev/null \
  || tar -xzf "$TMP_DIR/$TARBALL_NAME" -C "$STAGING_DIR" --strip-components=1 2>/dev/null \
  || tar -xzf "$TMP_DIR/$TARBALL_NAME" -C "$STAGING_DIR" --strip-components=1

# Stop running server BEFORE removing the old directory.
# If we don't, the monitor/server process keeps running with a deleted cwd,
# __dirname resolves to a stale inode, and the SPA routes fail with 404.

# Read saved port from config (so we can kill processes on the right port)
DATA_DIR="${DATA_DIR:-$HOME/.agent-hands}"
SAVED_PORT=""
CONF_FILE="$DATA_DIR/.agent-hands.conf"
if [ -f "$CONF_FILE" ]; then
  SAVED_PORT=$(grep -o '"port":[0-9]*' "$CONF_FILE" 2>/dev/null | grep -o '[0-9]*' || true)
fi
SAVED_PORT="${SAVED_PORT:-18080}"

if [ -f "$INSTALL_DIR/bin/agent-hands.js" ]; then
  info "Stopping running server before upgrade..."
  bun "$INSTALL_DIR/bin/agent-hands.js" stop 2>/dev/null || true
  sleep 2
fi

# Kill any remaining processes on the port (handles orphans and failed CLI stop)
kill_port_processes() {
  local target_port="$1"
  local pids=""

  # Try lsof first (macOS + most Linux)
  pids=$(lsof -ti :"$target_port" 2>/dev/null || true)

  # Fallback: ss (Alpine/Debian without lsof)
  if [ -z "$pids" ]; then
    pids=$(ss -tlnp "sport = :$target_port" 2>/dev/null | grep -oP 'pid=\K[0-9]+' || true)
  fi

  if [ -n "$pids" ]; then
    info "Killing remaining processes on port ${target_port}: ${pids}"
    for p in $pids; do
      kill "$p" 2>/dev/null || true
    done
    sleep 2
    # Force kill if still alive
    for p in $pids; do
      kill -0 "$p" 2>/dev/null && kill -9 "$p" 2>/dev/null || true
    done
    sleep 1
  fi
}

kill_port_processes "$SAVED_PORT"

# Also kill by PID file if it exists
PID_FILE="$DATA_DIR/server.pid"
if [ -f "$PID_FILE" ]; then
  OLD_PID=$(cat "$PID_FILE" 2>/dev/null | tr -d '[:space:]')
  if [ -n "$OLD_PID" ] && kill -0 "$OLD_PID" 2>/dev/null; then
    info "Killing old process PID ${OLD_PID}..."
    kill "$OLD_PID" 2>/dev/null || true
    sleep 2
    kill -0 "$OLD_PID" 2>/dev/null && kill -9 "$OLD_PID" 2>/dev/null || true
  fi
  rm -f "$PID_FILE"
fi

# Only remove old installation after successful extract + server stop
rm -rf "$INSTALL_DIR"
mkdir -p "$(dirname "$INSTALL_DIR")"
mv "$STAGING_DIR" "$INSTALL_DIR"

# ── 6. Set permissions ──────────────────────────────────────────────────────
chmod +x "$INSTALL_DIR/bin/agent-hands.js"

# ── 7. Create symlink ──────────────────────────────────────────────────────
LINK_TARGET="$INSTALL_DIR/bin/agent-hands.js"

# Check if correct symlink already exists to avoid unnecessary sudo prompts on updates
if [ -L "$BIN_DIR/$BIN_NAME" ] && [ "$(readlink "$BIN_DIR/$BIN_NAME")" = "$LINK_TARGET" ]; then
  info "Symlink already exists and is correct. Skipping."
else
  info "Creating symlink..."

  # Ensure BIN_DIR exists
  if [ ! -d "$BIN_DIR" ]; then
    info "Creating directory ${BIN_DIR}..."
    if [ -w "$(dirname "$BIN_DIR")" ]; then
      mkdir -p "$BIN_DIR"
    else
      warn "Need sudo to create directory ${BIN_DIR}"
      sudo mkdir -p "$BIN_DIR" || warn "Could not create directory ${BIN_DIR}."
    fi
  fi

  if [ -d "$BIN_DIR" ]; then
    NEEDS_SUDO=false
    if [ ! -w "$BIN_DIR" ]; then
      NEEDS_SUDO=true
    fi

    if [ "$NEEDS_SUDO" = true ]; then
      warn "Need sudo to create symlink in ${BIN_DIR}"
      sudo ln -sf "$LINK_TARGET" "$BIN_DIR/$BIN_NAME" || warn "Failed to create symlink in ${BIN_DIR}. You can create it manually later."
    else
      ln -sf "$LINK_TARGET" "$BIN_DIR/$BIN_NAME" || warn "Failed to create symlink in ${BIN_DIR}. You can create it manually later."
    fi
  fi
fi
# ── 7b. Install Playwright browser (optional) ────────────────────────────────
# Browser Profiles feature requires Playwright + Chromium. This is optional:
# if it fails, the server still works — only the Browser feature is disabled.
echo ""
if [ "${SKIP_BROWSER:-}" = "true" ]; then
  info "Skipping Playwright browser install (SKIP_BROWSER=true)"
else
  info "Installing Playwright browser for Browser Profiles feature..."
  if (cd "$INSTALL_DIR" && bun add playwright >/dev/null && bunx playwright install --with-deps chromium); then
    success "Chromium browser installed — Browser Profiles feature is ready"
  else
    warn "Could not install Playwright/Chromium. Browser Profiles feature will not be available."
    warn "To enable it later:  cd $INSTALL_DIR && bun add playwright && npx playwright install --with-deps chromium"
  fi
fi

# ── 8. Start Server ──────────────────────────────────────────────────────────
# The server auto-seeds a default super admin on first start if no users exist.
# We already stopped the old process above, so just start (not restart).
echo ""
info "Starting Agent Hands server..."
if bun "$INSTALL_DIR/bin/agent-hands.js" start; then
  echo ""
  success "Agent Hands is up and running!"
  echo -e "   ${BOLD}Version${NC}  : ${VERSION_NUM}"
  echo -e "   ${BOLD}Location${NC} : ${INSTALL_DIR}"
  if [ -x "$BIN_DIR/$BIN_NAME" ]; then
    echo -e "   ${BOLD}Binary${NC}   : ${BIN_DIR}/${BIN_NAME}"
  fi
  echo ""
  echo -e "   🎉 ${BOLD}Web UI is available at:${NC}"
  echo -e "     🔗  ${CYAN}http://localhost:${SAVED_PORT}${NC}"
  echo ""

  # Verify running version matches installed version
  sleep 2
  RUNNING_VERSION=$(curl -fsSL "http://127.0.0.1:${SAVED_PORT}/api/system/version" 2>/dev/null | grep -o '"current":"[^"]*"' | grep -o '[0-9][^"]*' || true)
  if [ -n "$RUNNING_VERSION" ] && [ "$RUNNING_VERSION" != "$VERSION_NUM" ]; then
    warn "Version mismatch! Installed v${VERSION_NUM} but server reports v${RUNNING_VERSION}"
    warn "Try: agent-hands stop && agent-hands start"
  fi

  # ── Show default credentials on first install ──────────────────────────
  if [ "$IS_FIRST_INSTALL" = true ]; then
    echo -e "   ┌──────────────────────────────────────────────┐"
    echo -e "   │  ${BOLD}🔑 Default Login Credentials${NC}                │"
    echo -e "   │                                              │"
    echo -e "   │    Username : ${CYAN}admin${NC}                         │"
    echo -e "   │    Password : ${CYAN}admin123${NC}                      │"
    echo -e "   │                                              │"
    echo -e "   │  ${YELLOW}⚠️  Please change your password after${NC}      │"
    echo -e "   │  ${YELLOW}   first login for security!${NC}               │"
    echo -e "   └──────────────────────────────────────────────┘"
    echo ""
  fi

  echo -e "   To manage the server in the future:"
  echo -e "     ${CYAN}agent-hands stop${NC}      # Stop the server"
  echo -e "     ${CYAN}agent-hands status${NC}    # Check status"
  echo -e "     ${CYAN}agent-hands logs${NC}      # View logs"
  echo ""
else
  warn "Could not start Agent Hands server automatically."
  echo ""
  success "Agent Hands files installed successfully to ${INSTALL_DIR}"
  if ! command -v "$BIN_NAME" &> /dev/null; then
    warn "Could not verify binary in PATH. You may need to add it manually:"
    echo -e "     ${CYAN}export PATH=\"${BIN_DIR}:\$PATH\"${NC}"
  fi

  # ── Show default credentials even if server didn't start ────────────────
  if [ "$IS_FIRST_INSTALL" = true ]; then
    echo ""
    echo -e "   ┌──────────────────────────────────────────────┐"
    echo -e "   │  ${BOLD}🔑 Default Login Credentials${NC}                │"
    echo -e "   │                                              │"
    echo -e "   │    Username : ${CYAN}admin${NC}                         │"
    echo -e "   │    Password : ${CYAN}admin123${NC}                      │"
    echo -e "   │                                              │"
    echo -e "   │  ${YELLOW}⚠️  Please change your password after${NC}      │"
    echo -e "   │  ${YELLOW}   first login for security!${NC}               │"
    echo -e "   └──────────────────────────────────────────────┘"
  fi
  echo ""
fi
