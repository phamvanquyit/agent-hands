#!/bin/bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT_DIR"

echo ""
echo "🤖 Moro Agent — Build & Publish"
echo ""

# ── 1. Version selection (BEFORE build so version is baked into the bundle) ────
CURRENT_VERSION=$(node -p "require('./package.json').version")

IFS='.' read -r MAJOR MINOR PATCH <<< "$CURRENT_VERSION"
V_PATCH="$MAJOR.$MINOR.$((PATCH + 1))"
V_MINOR="$MAJOR.$((MINOR + 1)).0"
V_MAJOR="$((MAJOR + 1)).0.0"

echo "📊 Versioning:"
echo "   Current: $CURRENT_VERSION"
echo ""
echo "   1) patch  → $V_PATCH"
echo "   2) minor  → $V_MINOR"
echo "   3) major  → $V_MAJOR"
echo "   4) skip   → keep $CURRENT_VERSION"
echo ""
read -p "   Choose [1-4] (default: 1): " CHOICE
CHOICE=${CHOICE:-1}

case "$CHOICE" in
  1) NEW_VERSION="$V_PATCH" ;;
  2) NEW_VERSION="$V_MINOR" ;;
  3) NEW_VERSION="$V_MAJOR" ;;
  4) NEW_VERSION="$CURRENT_VERSION" ;;
  *) echo "❌ Invalid choice"; exit 1 ;;
esac

# ── 2. Apply version bump ──────────────────────────────────────────────────────
if [ "$NEW_VERSION" != "$CURRENT_VERSION" ]; then
  echo ""
  echo "✏️  Bumping version → $NEW_VERSION"
  sed -i '' "s/\"version\": \"$CURRENT_VERSION\"/\"version\": \"$NEW_VERSION\"/" package.json
  sed -i '' "s/\"version\": \"[^\"]*\"/\"version\": \"$NEW_VERSION\"/" src/server/package.json
  sed -i '' "s/\"version\": \"[^\"]*\"/\"version\": \"$NEW_VERSION\"/" src/web/package.json
fi

# ── 3. Build (version is now correct in package.json → injected into bundle) ──
echo ""
echo "📦 [1/5] Building Web (vite)..."
(cd src/web && bun run build) || { echo "❌ Web build failed!"; exit 1; }

echo "📦 [2/5] Building Server (bun bundle with version $NEW_VERSION)..."
(cd src/server && bun run build) || { echo "❌ Server build failed!"; exit 1; }

echo "✅ Build successful! (v$NEW_VERSION baked into bundle)"
echo ""

# ── 4. Prepare publish layout ───────────────────────────────────────────────────
echo ""
echo "📁 [3/5] Preparing publish layout..."
rm -rf public

# Web static files → ./public (server looks for ../public relative to dist/)
cp -r src/web/dist ./public

# Final check for bin permissions
echo "🔧 [4/5] Setting permissions..."
chmod +x bin/moro-llm-toolkit.js

echo ""
echo "✅ Preparation complete! (v$NEW_VERSION)"
echo ""

# ── 5. Publish & Git ────────────────────────────────────────────────────────────
read -p "🚀 Ready to publish v$NEW_VERSION to npm? [y/N]: " CONFIRM_PUB
if [[ "$CONFIRM_PUB" =~ ^[Yy]$ ]]; then
  echo "📡 Publishing to npm..."
  npm publish

  echo ""
  echo "🏷️  Tagging v$NEW_VERSION..."
  git add -A
  git commit -m "release: v$NEW_VERSION"
  git tag "v$NEW_VERSION"
  git push && git push --tags

  echo ""
  echo "🎉 Done! v$NEW_VERSION published to npm + tagged on git."
else
  echo "⚠️  Skipped npm publish. Version bumped locally."
fi

echo ""
