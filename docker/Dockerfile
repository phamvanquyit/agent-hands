# ─── Stage 1: Build ───────────────────────────────────────────────────────────
FROM oven/bun:1.2-alpine AS builder
WORKDIR /app

# Install deps (root workspace + sub-packages)
COPY package.json bun.lock ./
COPY src/server/package.json ./src/server/
COPY src/web/package.json ./src/web/
RUN bun install --frozen-lockfile

# Copy source
COPY src/server ./src/server
COPY src/web ./src/web

# Build web (Vite)
RUN cd src/web && bun run build

# Build server (tsc — keeps file structure needed by __dirname migration runner)
RUN cd src/server && bunx tsc -b

# ─── Stage 2: Runtime ────────────────────────────────────────────────────────
FROM oven/bun:1.2-alpine AS runtime
WORKDIR /app

# Python3 for custom tool execution (venv + pip)
RUN apk add --no-cache python3 py3-pip

# Install only production deps (need all workspace package.json for lockfile)
COPY package.json bun.lock ./
COPY src/server/package.json ./src/server/
COPY src/web/package.json ./src/web/
RUN bun install --production --frozen-lockfile

# Copy server build output
COPY --from=builder /app/src/server/dist ./dist

# Copy migrations (sits next to dist/common/db/ where __dirname resolves)
COPY --from=builder /app/src/server/src/common/db/migrations ./dist/common/db/migrations

# Copy web build → ./public (server looks for ../public relative to dist/)
COPY --from=builder /app/src/web/dist ./public

# Runtime configuration
ENV DATA_DIR=/data
ENV HOST=0.0.0.0

VOLUME ["/data"]

# Server serves both API + static web on port 18080 (default)
EXPOSE 18080

CMD ["bun", "run", "dist/index.js"]
