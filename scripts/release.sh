#!/bin/bash
# ─────────────────────────────────────────────────────────────────────────────
# Agent Hands — Release Script
#
# Builds the project, creates a tarball, and publishes a GitHub Release.
#
# Prerequisites:
#   - GitHub CLI (gh): https://cli.github.com/
#   - Bun runtime
#
# Usage:
#   ./scripts/release.sh              # interactive version bump + release
#   ./scripts/release.sh --dry-run    # build + package only, skip GitHub release
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR"

# ── Config ──────────────────────────────────────────────────────────────────
TARBALL_DIR="$ROOT_DIR/releases"
DRY_RUN=false

for arg in "$@"; do
  case "$arg" in
    --dry-run) DRY_RUN=true ;;
  esac
done

# ── Colors ──────────────────────────────────────────────────────────────────
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
BOLD='\033[1m'
DIM='\033[2m'
NC='\033[0m'

step()    { echo -e "\n${CYAN}${BOLD}▸${NC} ${BOLD}$*${NC}"; }
info()    { echo -e "  ${DIM}$*${NC}"; }
success() { echo -e "  ${GREEN}✅ $*${NC}"; }
warn()    { echo -e "  ${YELLOW}⚠️  $*${NC}"; }
fail()    { echo -e "  ${RED}❌ $*${NC}"; exit 1; }

# ── Banner ──────────────────────────────────────────────────────────────────
echo ""
echo -e "${BOLD}🤖 Agent Hands — Release${NC}"
if [ "$DRY_RUN" = true ]; then
  echo -e "${YELLOW}   (dry run — will not publish to GitHub)${NC}"
fi
echo ""

# ── 1. Check prerequisites ─────────────────────────────────────────────────
step "Checking prerequisites"

if ! command -v bun &> /dev/null; then
  fail "Bun runtime is required."
fi
info "bun $(bun --version)"

if [ "$DRY_RUN" = false ] && ! command -v gh &> /dev/null; then
  fail "GitHub CLI (gh) is required. Install: https://cli.github.com/"
fi

if [ "$DRY_RUN" = false ]; then
  if ! gh auth status &> /dev/null; then
    fail "Not authenticated with GitHub CLI. Run: gh auth login"
  fi
  info "gh authenticated ✓"
fi

# ── 2. Build ────────────────────────────────────────────────────────────────
CURRENT_VERSION=$(node -p "require('./package.json').version")

step "[1/4] Building Web (Vite)"
(cd src/web && bun run build) || fail "Web build failed!"
success "Web build complete"

step "[2/4] Building Server (Bun bundle, v${CURRENT_VERSION})"
(cd src/server && bun run build) || fail "Server build failed!"
success "Server build complete"

# ── 3. Version selection ───────────────────────────────────────────────────
step "Version selection"

IFS='.' read -r MAJOR MINOR PATCH <<< "$CURRENT_VERSION"
V_PATCH="$MAJOR.$MINOR.$((PATCH + 1))"
V_MINOR="$MAJOR.$((MINOR + 1)).0"
V_MAJOR="$((MAJOR + 1)).0.0"

echo ""
echo -e "  Current: ${BOLD}v${CURRENT_VERSION}${NC}"
echo ""
echo "  1) patch  → v${V_PATCH}"
echo "  2) minor  → v${V_MINOR}"
echo "  3) major  → v${V_MAJOR}"
echo "  4) skip   → keep v${CURRENT_VERSION}"
echo ""
read -p "  Choose [1-4] (default: 1): " CHOICE
CHOICE=${CHOICE:-1}

case "$CHOICE" in
  1) NEW_VERSION="$V_PATCH" ;;
  2) NEW_VERSION="$V_MINOR" ;;
  3) NEW_VERSION="$V_MAJOR" ;;
  4) NEW_VERSION="$CURRENT_VERSION" ;;
  *) fail "Invalid choice" ;;
esac

TAG="v${NEW_VERSION}"
echo ""
info "Release version: ${TAG}"

# ── 4. Bump version in package.json files ───────────────────────────────────
if [ "$NEW_VERSION" != "$CURRENT_VERSION" ]; then
  step "Bumping version → ${NEW_VERSION}"

  sed -i '' "s/\"version\": \"$CURRENT_VERSION\"/\"version\": \"$NEW_VERSION\"/" package.json
  sed -i '' "s/\"version\": \"[^\"]*\"/\"version\": \"$NEW_VERSION\"/" src/server/package.json
  sed -i '' "s/\"version\": \"[^\"]*\"/\"version\": \"$NEW_VERSION\"/" src/web/package.json

  success "Version bumped in all package.json files"

  # Rebuild server to bake in __PKG_VERSION__ with the new version
  step "Rebuilding server with v${NEW_VERSION}"
  (cd src/server && bun run build) || fail "Server rebuild failed!"
  success "Server rebuilt with correct version"
fi

# ── 5. Prepare release layout ──────────────────────────────────────────────
step "[3/4] Preparing release tarball (v${NEW_VERSION})"

STAGING_DIR=$(mktemp -d)
STAGING="$STAGING_DIR/agent-hands"
trap 'rm -rf "$STAGING_DIR"' EXIT

mkdir -p "$STAGING"

# Copy built artifacts
cp -r dist "$STAGING/dist"

# Copy web static → public
rm -rf public
cp -r src/web/dist ./public
cp -r public "$STAGING/public"

# Copy CLI
mkdir -p "$STAGING/bin"
cp bin/agent-hands.js "$STAGING/bin/"
chmod +x "$STAGING/bin/agent-hands.js"

# Copy essential files
cp package.json "$STAGING/"
cp README.md "$STAGING/"

info "Staged files:"
(cd "$STAGING" && find . -type f | head -20 | sed 's/^/    /')
FILE_COUNT=$(cd "$STAGING" && find . -type f | wc -l | tr -d ' ')
info "Total: ${FILE_COUNT} files"

# Create tarball
mkdir -p "$TARBALL_DIR"
TARBALL_NAME="agent-hands-${NEW_VERSION}.tar.gz"
TARBALL_PATH="$TARBALL_DIR/$TARBALL_NAME"

(cd "$STAGING_DIR" && COPYFILE_DISABLE=1 tar -czf "$TARBALL_PATH" agent-hands)

TARBALL_SIZE=$(du -h "$TARBALL_PATH" | cut -f1 | tr -d ' ')
success "Tarball created: ${TARBALL_NAME} (${TARBALL_SIZE})"

# ── 6. Publish to GitHub ───────────────────────────────────────────────────
if [ "$DRY_RUN" = true ]; then
  echo ""
  warn "Dry run — skipping GitHub release"
  info "Tarball: ${TARBALL_PATH}"
  echo ""
  exit 0
fi

step "[4/4] Publishing to GitHub"

# Commit + tag
echo ""
read -p "  🚀 Ready to release ${TAG} to GitHub? [y/N]: " CONFIRM
if [[ ! "$CONFIRM" =~ ^[Yy]$ ]]; then
  warn "Aborted. Tarball saved at: ${TARBALL_PATH}"
  exit 0
fi

info "Committing changes..."
git add -A
git commit -m "release: ${TAG}" || info "(nothing to commit)"

info "Creating tag ${TAG}..."
git tag -a "$TAG" -m "Release ${TAG}"

info "Pushing to remote..."
git push && git push --tags

# Create GitHub Release with tarball
info "Creating GitHub Release..."

RELEASE_NOTES="## Agent Hands ${TAG}

### Installation

\`\`\`bash
curl -fsSL https://raw.githubusercontent.com/Zobite/agent-hands/main/install.sh | bash
\`\`\`

### Or install a specific version

\`\`\`bash
VERSION=${NEW_VERSION} curl -fsSL https://raw.githubusercontent.com/Zobite/agent-hands/main/install.sh | bash
\`\`\`

---

See [README](https://github.com/Zobite/agent-hands#readme) for full documentation."

gh release create "$TAG" \
  "$TARBALL_PATH" \
  --title "Agent Hands ${TAG}" \
  --notes "$RELEASE_NOTES"

success "GitHub Release ${TAG} published!"

echo ""
echo -e "${GREEN}${BOLD}🎉 Release ${TAG} complete!${NC}"
echo ""
echo -e "  ${BOLD}Release page${NC}: https://github.com/Zobite/agent-hands/releases/tag/${TAG}"
echo -e "  ${BOLD}Install cmd${NC} : curl -fsSL https://raw.githubusercontent.com/Zobite/agent-hands/main/install.sh | bash"
echo ""
