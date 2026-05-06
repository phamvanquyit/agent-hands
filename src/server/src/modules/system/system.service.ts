import { existsSync, readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import type { VersionResponse } from "./system.schema.js";

/**
 * Injected at build time by `src/server/build.ts` via Bun's `define`.
 * In dev (bun --watch) this is undefined, so we fall back to reading package.json.
 */
declare const __PKG_VERSION__: string | undefined;

let _currentVersion: string | null = null;

/**
 * Walk upward from `startDir` looking for a package.json that contains a version field.
 */
function findVersionUpward(startDir: string): string | null {
  let dir = startDir;
  for (let i = 0; i < 6; i++) {
    const candidate = join(dir, "package.json");
    try {
      if (existsSync(candidate)) {
        const pkg = JSON.parse(readFileSync(candidate, "utf-8"));
        if (pkg.version) return pkg.version;
      }
    } catch {
      // skip
    }
    const parent = dirname(dir);
    if (parent === dir) break; // reached filesystem root
    dir = parent;
  }
  return null;
}

export function getCurrentVersion(): string {
  if (_currentVersion && process.env.NODE_ENV !== "development") return _currentVersion;

  // 1. Build-time injected constant (production bundle)
  if (typeof __PKG_VERSION__ !== "undefined") {
    _currentVersion = __PKG_VERSION__;
    return _currentVersion;
  }

  // 2. Dev fallback: walk up from this file's directory to find package.json
  const __dirname = dirname(fileURLToPath(import.meta.url));
  _currentVersion = findVersionUpward(__dirname) ?? "unknown";
  return _currentVersion;
}


/** Cache: latest version fetched from npm registry */
let _cachedLatest: string | null = null;
let _cachedAt = 0;
const CACHE_TTL_MS = 60_000; // 1 minute

export async function checkLatestVersion(): Promise<string | null> {
  const now = Date.now();
  if (_cachedLatest !== null && now - _cachedAt < CACHE_TTL_MS) {
    return _cachedLatest;
  }

  try {
    const res = await fetch("https://registry.npmjs.org/moro-llm-toolkit/latest", {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return _cachedLatest;
    const data = (await res.json()) as { version?: string };
    _cachedLatest = data.version ?? null;
    _cachedAt = now;
    return _cachedLatest;
  } catch {
    return _cachedLatest; // return stale on error
  }
}

/** Compare semver — returns true if latest > current */
function isNewer(current: string, latest: string): boolean {
  const parse = (v: string) => v.replace(/^v/, "").split(".").map(Number);
  const [ca, cb, cc] = parse(current);
  const [la, lb, lc] = parse(latest);
  if (la !== ca) return la > ca;
  if (lb !== cb) return lb > cb;
  return lc > cc;
}

export async function getVersionInfo(): Promise<VersionResponse> {
  const current = getCurrentVersion();
  const latest = await checkLatestVersion();
  const hasUpdate = latest != null && isNewer(current, latest);
  return { current, latest, hasUpdate, checkedAt: Date.now() };
}

/**
 * Performs the actual update:
 * 1. Runs `bun add -g moro-llm-toolkit@latest`
 * 2. Exits with code 1 → monitor process auto-restarts with the new binary
 */
export async function performUpdate(): Promise<{ ok: boolean; message: string }> {
  try {
    const proc = Bun.spawn(["bun", "add", "-g", "moro-llm-toolkit@latest"], {
      stdout: "inherit",
      stderr: "inherit",
    });

    const exitCode = await proc.exited;
    if (exitCode !== 0) {
      return { ok: false, message: `bun add failed with exit code ${exitCode}` };
    }

    // Schedule restart after response is sent (500ms delay)
    setTimeout(() => {
      console.log("[System] Update installed — restarting server...");
      process.exit(1); // monitor will restart with new binary
    }, 500);

    return { ok: true, message: "Update installed. Server will restart shortly." };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return { ok: false, message };
  }
}

/** Invalidate npm version cache (force re-check) */
export function invalidateVersionCache() {
  _cachedAt = 0;
}
