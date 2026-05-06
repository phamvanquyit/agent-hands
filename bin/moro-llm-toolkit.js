#!/usr/bin/env bun
/**
 * Moro LLM Toolkit CLI
 * Manages the Moro LLM Toolkit server as a background daemon or foreground process.
 *
 * Usage:
 *   moro-llm-toolkit start [--port N] [--host H] [--data-dir D] [--foreground]
 *   moro-llm-toolkit stop
 *   moro-llm-toolkit restart [same flags as start]
 *   moro-llm-toolkit status
 *   moro-llm-toolkit logs [--lines N] [--follow]
 *   moro-llm-toolkit version
 *   moro-llm-toolkit init          -- create super admin on first run
 *   moro-llm-toolkit mcp           -- start MCP server (stdio)
 */

import { spawn } from "node:child_process";
import {
  existsSync,
  readFileSync,
  writeFileSync,
  appendFileSync,
  unlinkSync,
  mkdirSync,
  openSync,
  closeSync,
} from "node:fs";
import { join, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import os from "node:os";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PKG_ROOT = resolve(__dirname, "..");

// ─── Defaults ──────────────────────────────────────────────────────────────────
const DEFAULT_PORT = 18080;
const DEFAULT_HOST = "127.0.0.1";
const DEFAULT_DATA_DIR = join(os.homedir(), ".moro-llm-toolkit");

// ─── Parse CLI ─────────────────────────────────────────────────────────────────
const rawArgs = process.argv.slice(2);
const COMMANDS = [
  "start", "stop", "status", "restart", "logs",
  "version", "init", "mcp", "help", "_monitor",
];
const command = COMMANDS.includes(rawArgs[0]) ? rawArgs.shift() : "help";

function parseFlags(args) {
  const flags = {};
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === "--foreground" || arg === "-f") {
      flags.foreground = true;
    } else if (arg === "--follow") {
      flags.follow = true;
    } else if (arg.startsWith("--") && args[i + 1] && !args[i + 1].startsWith("--")) {
      flags[arg.slice(2)] = args[++i];
    }
  }
  return flags;
}

const flags = parseFlags(rawArgs);
const dataDir = flags["data-dir"] ?? process.env.DATA_DIR ?? DEFAULT_DATA_DIR;
const port = Number(flags.port ?? DEFAULT_PORT);
const host = flags.host ?? DEFAULT_HOST;

// Ensure data dir exists
mkdirSync(dataDir, { recursive: true });

const pidFile = join(dataDir, "server.pid");
const logFile = join(dataDir, "server.log");
const serverEntry = join(PKG_ROOT, "dist", "index.js");

// ─── Helpers ───────────────────────────────────────────────────────────────────

function isProcessAlive(pid) {
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

function readPid() {
  if (!existsSync(pidFile)) return null;
  const raw = readFileSync(pidFile, "utf-8").trim();
  const pid = Number(raw);
  if (Number.isNaN(pid)) return null;
  if (isProcessAlive(pid)) return pid;
  try { unlinkSync(pidFile); } catch {}
  return null;
}

function writePid(pid) {
  writeFileSync(pidFile, String(pid), "utf-8");
}

function removePid() {
  try { unlinkSync(pidFile); } catch {}
}

function getLocalVersion() {
  try {
    return JSON.parse(readFileSync(join(PKG_ROOT, "package.json"), "utf-8")).version;
  } catch {
    return null;
  }
}

// ─── Commands ──────────────────────────────────────────────────────────────────

async function cmdStart() {
  const existing = readPid();
  if (existing) {
    console.log(`⚠️  Moro LLM Toolkit is already running (PID: ${existing})`);
    console.log(`   Use 'moro-llm-toolkit restart' to restart.`);
    process.exit(1);
  }

  if (!existsSync(serverEntry)) {
    console.error(`❌ Server entry not found: ${serverEntry}`);
    console.error("   Run 'bun run build:server' first.");
    process.exit(1);
  }

  // ── Foreground mode ──────────────────────────────────────────────────────
  if (flags.foreground) {
    console.log("\n🤖 Moro LLM Toolkit starting in foreground mode...");
    console.log(`   Port     : ${port}`);
    console.log(`   Host     : ${host}`);
    console.log(`   Data dir : ${dataDir}\n`);

    process.env.PORT = String(port);
    process.env.HOST = host;
    process.env.DATA_DIR = dataDir;

    const { startServer } = await import(serverEntry);
    await startServer();
    return;
  }

  // ── Daemon mode ──────────────────────────────────────────────────────────
  const now = new Date().toISOString();
  const separator = "─".repeat(60);
  appendFileSync(logFile, `\n${separator}\n[${now}] Starting Moro LLM Toolkit (port: ${port}, host: ${host})\n${separator}\n`);

  const logFd = openSync(logFile, "a");
  const binPath = join(PKG_ROOT, "bin", "moro-llm-toolkit.js");
  const monitorArgs = ["run", binPath, "_monitor"];
  if (flags.port) monitorArgs.push("--port", String(port));
  if (flags.host) monitorArgs.push("--host", host);
  if (flags["data-dir"]) monitorArgs.push("--data-dir", dataDir);

  const child = spawn("bun", monitorArgs, {
    detached: true,
    stdio: ["ignore", logFd, logFd],
    env: {
      ...process.env,
      PORT: String(port),
      HOST: host,
      DATA_DIR: dataDir,
    },
    cwd: PKG_ROOT,
  });

  closeSync(logFd);

  await new Promise((resolve) => setTimeout(resolve, 800));

  if (child.exitCode !== null) {
    console.error("❌ Moro LLM Toolkit failed to start. Check logs:");
    console.error(`   ${logFile}`);
    process.exit(1);
  }

  writePid(child.pid);
  child.unref();

  console.log("\n🤖 Moro LLM Toolkit started!");
  console.log(`   PID      : ${child.pid}`);
  console.log(`   URL      : http://${host}:${port}`);
  console.log(`   Data dir : ${dataDir}`);
  console.log(`   Logs     : ${logFile}`);
  console.log(`\n   Use 'moro-llm-toolkit stop' to stop.\n`);
}

function cmdStop() {
  const pid = readPid();
  if (!pid) {
    console.log("ℹ️  Moro LLM Toolkit is not running.");
    return;
  }

  console.log(`🛑 Stopping Moro LLM Toolkit (PID: ${pid})...`);
  process.kill(pid, "SIGTERM");

  const deadline = Date.now() + 5000;
  while (Date.now() < deadline && isProcessAlive(pid)) {
    Bun.sleepSync(200);
  }

  if (isProcessAlive(pid)) {
    console.log("   Force killing...");
    try { process.kill(pid, "SIGKILL"); } catch {}
    Bun.sleepSync(300);
  }

  removePid();
  console.log("✅ Moro LLM Toolkit stopped.\n");
}

function cmdStatus() {
  const pid = readPid();
  if (pid) {
    console.log("\n🟢 Moro LLM Toolkit is running");
    console.log(`   PID      : ${pid}`);
    console.log(`   Data dir : ${dataDir}`);
    console.log(`   Logs     : ${logFile}\n`);
  } else {
    console.log("\n🔴 Moro LLM Toolkit is not running.\n");
  }
}

async function cmdRestart() {
  const pid = readPid();
  if (pid) {
    cmdStop();
    await new Promise((r) => setTimeout(r, 500));
  }
  await cmdStart();
}

function cmdLogs() {
  if (!existsSync(logFile)) {
    console.log("ℹ️  No log file found. Start the server first.");
    return;
  }

  const lines = Number(flags.lines ?? 50);

  if (flags.follow) {
    const tail = spawn("tail", ["-f", "-n", String(lines), logFile], {
      stdio: "inherit",
    });
    process.on("SIGINT", () => {
      tail.kill();
      process.exit(0);
    });
    return new Promise(() => {});
  }

  const content = readFileSync(logFile, "utf-8");
  const allLines = content.split("\n");
  const lastLines = allLines.slice(-lines).join("\n");
  console.log(lastLines);
}

function cmdVersion() {
  const v = getLocalVersion();
  console.log(`moro-llm-toolkit v${v ?? "unknown"}`);
}

async function cmdInit() {
  if (!existsSync(serverEntry)) {
    console.error("❌ Server not built. Run 'bun run build:server' first.");
    process.exit(1);
  }
  process.env.DATA_DIR = dataDir;
  const { initSuperAdmin } = await import(serverEntry);
  await initSuperAdmin();
}

async function cmdMcp() {
  if (!existsSync(serverEntry)) {
    console.error("❌ Server not built. Run 'bun run build:server' first.");
    process.exit(1);
  }
  process.env.DATA_DIR = dataDir;
  const { startMcpServer } = await import(serverEntry);
  await startMcpServer();
}

function cmdHelp() {
  console.log(`
🤖 Moro LLM Toolkit — LLM-First Knowledge Base

USAGE:
  moro-llm-toolkit <command> [options]

COMMANDS:
  start        Start the server (daemon mode by default)
  stop         Stop the running server
  restart      Restart the server
  status       Show server status
  logs         View server logs
  version      Show version
  init         Create super admin (first run)
  mcp          Start MCP server in stdio mode
  help         Show this help

OPTIONS (start / restart):
  --port <number>        Server port (default: ${DEFAULT_PORT})
  --host <string>        Server host (default: ${DEFAULT_HOST})
  --data-dir <path>      Data directory (default: ${DEFAULT_DATA_DIR})
  -f, --foreground       Run in foreground

OPTIONS (logs):
  --lines <number>       Number of lines (default: 50)
  --follow               Tail log continuously

EXAMPLES:
  moro-llm-toolkit init
  moro-llm-toolkit start
  moro-llm-toolkit start --port 8080 --host 0.0.0.0
  moro-llm-toolkit start --foreground
  moro-llm-toolkit stop
  moro-llm-toolkit mcp
  moro-llm-toolkit logs --follow
`);
}

// ─── Monitor ───────────────────────────────────────────────────────────────────
const MAX_RAPID_CRASHES = 5;
const RAPID_CRASH_WINDOW_MS = 60_000;
const RESTART_DELAY_MS = 3000;

async function cmdMonitor() {
  const crashTimes = [];
  let stopping = false;
  let activeChild = null;

  const handleStop = () => {
    stopping = true;
    if (activeChild) activeChild.kill("SIGTERM");
  };
  process.on("SIGTERM", handleStop);
  process.on("SIGINT", handleStop);

  while (!stopping) {
    const serverChild = Bun.spawn(["bun", "run", serverEntry], {
      env: { ...process.env, PORT: String(port), HOST: host, DATA_DIR: dataDir },
      cwd: PKG_ROOT,
      stdout: "inherit",
      stderr: "inherit",
    });
    activeChild = serverChild;

    const exitCode = await serverChild.exited;
    if (stopping) break;
    if (exitCode === 0) break;

    const now = Date.now();
    crashTimes.push(now);
    while (crashTimes.length > 0 && crashTimes[0] < now - RAPID_CRASH_WINDOW_MS) {
      crashTimes.shift();
    }

    if (crashTimes.length >= MAX_RAPID_CRASHES) {
      console.error(`[Monitor] ${MAX_RAPID_CRASHES} crashes in ${RAPID_CRASH_WINDOW_MS / 1000}s — giving up.`);
      process.exit(1);
    }

    console.log(`[Monitor] Crashed (exit: ${exitCode}). Restarting in ${RESTART_DELAY_MS / 1000}s...`);
    await new Promise((r) => setTimeout(r, RESTART_DELAY_MS));
  }
}

// ─── Run ───────────────────────────────────────────────────────────────────────
switch (command) {
  case "start":    await cmdStart(); break;
  case "stop":     cmdStop(); break;
  case "status":   cmdStatus(); break;
  case "restart":  await cmdRestart(); break;
  case "logs":     await cmdLogs(); break;
  case "version":  cmdVersion(); break;
  case "init":     await cmdInit(); break;
  case "mcp":      await cmdMcp(); break;
  case "_monitor": await cmdMonitor(); break;
  default:         cmdHelp();
}
