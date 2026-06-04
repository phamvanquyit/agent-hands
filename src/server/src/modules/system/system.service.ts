import { existsSync, readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import os from "node:os";
import type { VersionResponse, SystemInfoResponse } from "./system.schema.js";

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


/** Cache: latest version fetched from GitHub Releases */
let _cachedLatest: string | null = null;
let _cachedAt = 0;
const CACHE_TTL_MS = 60_000; // 1 minute
const GITHUB_REPO = process.env.GITHUB_REPO || "Zobite/agent-hands";

export async function checkLatestVersion(): Promise<string | null> {
  const now = Date.now();
  if (_cachedLatest !== null && now - _cachedAt < CACHE_TTL_MS) {
    return _cachedLatest;
  }

  try {
    const res = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/releases/latest`, {
      headers: { Accept: "application/vnd.github+json" },
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return _cachedLatest;
    const data = (await res.json()) as { tag_name?: string };
    // tag_name is "v0.2.9" → strip the "v" prefix
    _cachedLatest = data.tag_name?.replace(/^v/, "") ?? null;
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
 * 1. Runs the install.sh script from GitHub (same as initial install)
 * 2. Exits with code 1 → monitor process auto-restarts with the new binary
 */
export async function performUpdate(): Promise<{ ok: boolean; message: string }> {
  try {
    const installUrl = `https://raw.githubusercontent.com/${GITHUB_REPO}/main/install.sh`;
    const proc = Bun.spawn(["bash", "-c", `curl -fsSL ${installUrl} | bash`], {
      stdout: "inherit",
      stderr: "inherit",
      env: { ...process.env },
    });

    const exitCode = await proc.exited;
    if (exitCode !== 0) {
      return { ok: false, message: `Install script failed with exit code ${exitCode}` };
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

/** Invalidate version cache (force re-check) */
export function invalidateVersionCache() {
  _cachedAt = 0;
}

// ── System Info ────────────────────────────────────────────────────────────────

/** Parse /proc/meminfo to get more accurate memory stats on Linux */
function getLinuxMemory(): { total: number; free: number; used: number } | null {
  try {
    if (os.platform() !== "linux") return null;
    const content = readFileSync("/proc/meminfo", "utf8");
    const memInfo: Record<string, number> = {};
    const lines = content.split("\n");
    for (const line of lines) {
      const match = line.match(/^(\w+):\s+(\d+)\s*kB/);
      if (match) {
        // Convert kB to bytes
        memInfo[match[1]] = parseInt(match[2], 10) * 1024;
      }
    }

    const total = memInfo["MemTotal"];
    const available = memInfo["MemAvailable"];
    if (total !== undefined && available !== undefined) {
      return {
        total,
        free: available,
        used: total - available,
      };
    }

    // Fallback for older Linux kernels (< 3.14) without MemAvailable
    const free = memInfo["MemFree"];
    const buffers = memInfo["Buffers"] ?? 0;
    const cached = memInfo["Cached"] ?? 0;
    if (total !== undefined && free !== undefined) {
      const actualFree = free + buffers + cached;
      return {
        total,
        free: actualFree,
        used: total - actualFree,
      };
    }
  } catch {
    // skip and fallback to os module
  }
  return null;
}

/** Sample CPU usage over a short interval (non-blocking) */
async function getCpuUsage(): Promise<number> {
  const cpus1 = os.cpus();
  const total1 = cpus1.reduce((acc, c) => {
    const t = c.times;
    return acc + t.user + t.nice + t.sys + t.idle + t.irq;
  }, 0);
  const idle1 = cpus1.reduce((acc, c) => acc + c.times.idle, 0);

  await new Promise((r) => setTimeout(r, 200));

  const cpus2 = os.cpus();
  const total2 = cpus2.reduce((acc, c) => {
    const t = c.times;
    return acc + t.user + t.nice + t.sys + t.idle + t.irq;
  }, 0);
  const idle2 = cpus2.reduce((acc, c) => acc + c.times.idle, 0);

  const totalDiff = total2 - total1;
  const idleDiff = idle2 - idle1;
  if (totalDiff === 0) return 0;
  return Math.round(((totalDiff - idleDiff) / totalDiff) * 100 * 10) / 10;
}

/** Get disk usage for the root mount via `df` */
async function getDiskInfo(): Promise<{ total: number; used: number; free: number; usage: number; mount: string }> {
  try {
    const proc = Bun.spawn(["df", "-k", "/"], { stdout: "pipe", stderr: "pipe" });
    const output = await new Response(proc.stdout).text();
    await proc.exited;

    const lines = output.trim().split("\n");
    if (lines.length < 2) throw new Error("unexpected df output");

    // df -k output: Filesystem 1K-blocks Used Available Use%/Capacity Mounted
    // On macOS APFS the "Used" column only reflects a single volume's usage,
    // while "Available" is the real free space across the volume group.
    // Therefore we compute: used = total - available  so the numbers add up.
    const parts = lines[1].split(/\s+/);
    const totalKb = parseInt(parts[1], 10);
    const availKb = parseInt(parts[3], 10);
    const usedKb = totalKb - availKb;
    const mount = parts[parts.length - 1];

    return {
      total: totalKb * 1024,
      used: usedKb * 1024,
      free: availKb * 1024,
      usage: totalKb > 0 ? Math.round((usedKb / totalKb) * 100 * 10) / 10 : 0,
      mount,
    };
  } catch {
    return { total: 0, used: 0, free: 0, usage: 0, mount: "/" };
  }
}

/** Gather all system info */
export async function getSystemInfo(): Promise<SystemInfoResponse> {
  const cpus = os.cpus();
  let totalMem = os.totalmem();
  let freeMem = os.freemem();
  let usedMem = totalMem - freeMem;

  const linuxMem = getLinuxMemory();
  if (linuxMem) {
    totalMem = linuxMem.total;
    freeMem = linuxMem.free;
    usedMem = linuxMem.used;
  }

  const memUsage = process.memoryUsage();

  const [cpuUsage, disk] = await Promise.all([getCpuUsage(), getDiskInfo()]);

  return {
    cpu: {
      model: cpus[0]?.model ?? "unknown",
      cores: cpus.length,
      usage: cpuUsage,
    },
    memory: {
      total: totalMem,
      used: usedMem,
      free: freeMem,
      usage: totalMem > 0 ? Math.round((usedMem / totalMem) * 100 * 10) / 10 : 0,
    },
    disk,
    process: {
      pid: process.pid,
      uptime: Math.floor(process.uptime()),
      memoryRss: memUsage.rss,
      memoryHeap: memUsage.heapUsed,
      bunVersion: typeof Bun !== "undefined" ? Bun.version : "N/A",
      nodeVersion: process.version,
    },
    os: {
      platform: os.platform(),
      arch: os.arch(),
      hostname: os.hostname(),
      release: os.release(),
      uptime: Math.floor(os.uptime()),
    },
    timestamp: Date.now(),
  };
}
