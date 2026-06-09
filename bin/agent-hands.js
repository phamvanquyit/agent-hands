#!/usr/bin/env bun
/**
 * Agent Hands CLI
 * Manages the Agent Hands server as a background daemon or foreground process.
 *
 * Usage:
 *   agent-hands start [--port N] [--host H] [--data-dir D] [--foreground]
 *   agent-hands stop
 *   agent-hands restart [same flags as start]
 *   agent-hands status
 *   agent-hands logs [--lines N] [--follow]
 *   agent-hands version
 *   agent-hands init          -- create super admin on first run
 *   agent-hands mcp           -- start MCP server (stdio)
 */

import { spawn } from "node:child_process";
import { appendFileSync, closeSync, existsSync, mkdirSync, openSync, readFileSync, unlinkSync, writeFileSync } from "node:fs";
import os from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PKG_ROOT = resolve(__dirname, "..");

// ─── Defaults ──────────────────────────────────────────────────────────────────
const DEFAULT_PORT = 18080;
const DEFAULT_HOST = "127.0.0.1";
const DEFAULT_DATA_DIR = join(os.homedir(), ".agent-hands");

// ─── Parse CLI ─────────────────────────────────────────────────────────────────
const rawArgs = process.argv.slice(2);
const COMMANDS = ["start", "stop", "status", "restart", "logs", "version", "init", "mcp", "uninstall", "help", "_monitor"];
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

// ─── Persisted config (saved on start, read by other commands) ──────────────
const configFile = join(PKG_ROOT, ".agent-hands.conf");

function loadSavedConfig() {
  try {
    if (existsSync(configFile)) {
      return JSON.parse(readFileSync(configFile, "utf-8"));
    }
  } catch {}
  return {};
}

function saveConfig(config) {
  try {
    writeFileSync(configFile, JSON.stringify(config, null, 2), "utf-8");
  } catch {}
}

const savedConfig = loadSavedConfig();
const dataDir = flags["data-dir"] ?? process.env.DATA_DIR ?? savedConfig.dataDir ?? DEFAULT_DATA_DIR;
const port = Number(flags.port ?? savedConfig.port ?? DEFAULT_PORT);
const host = flags.host ?? savedConfig.host ?? DEFAULT_HOST;

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
  try {
    unlinkSync(pidFile);
  } catch {}
  return null;
}

function writePid(pid) {
  writeFileSync(pidFile, String(pid), "utf-8");
}

function removePid() {
  try {
    unlinkSync(pidFile);
  } catch {}
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
    console.log(`⚠️  Agent Hands is already running (PID: ${existing})`);
    console.log(`   Use 'agent-hands restart' to restart.`);
    process.exit(1);
  }

  if (!existsSync(serverEntry)) {
    console.error(`❌ Server entry not found: ${serverEntry}`);
    console.error("   Run 'bun run build:server' first.");
    process.exit(1);
  }

  // Persist config so other commands auto-detect paths
  saveConfig({ dataDir, port, host });

  // ── Foreground mode ──────────────────────────────────────────────────────
  if (flags.foreground) {
    console.log("\n🤖 Agent Hands starting in foreground mode...");
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
  appendFileSync(logFile, `\n${separator}\n[${now}] Starting Agent Hands (port: ${port}, host: ${host})\n${separator}\n`);

  const logFd = openSync(logFile, "a");
  const binPath = join(PKG_ROOT, "bin", "agent-hands.js");
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
    console.error("❌ Agent Hands failed to start. Check logs:");
    console.error(`   ${logFile}`);
    process.exit(1);
  }

  writePid(child.pid);
  child.unref();

  console.log("\n🤖 Agent Hands started!");
  console.log(`   PID      : ${child.pid}`);
  console.log(`   URL      : http://${host}:${port}`);
  console.log(`   Data dir : ${dataDir}`);
  console.log(`   Logs     : ${logFile}`);
  console.log(`\n   Use 'agent-hands stop' to stop.\n`);
}

function cmdStop() {
  const pid = readPid();
  if (!pid) {
    console.log("ℹ️  Agent Hands is not running.");
    return;
  }

  console.log(`🛑 Stopping Agent Hands (PID: ${pid})...`);
  process.kill(pid, "SIGTERM");

  const deadline = Date.now() + 5000;
  while (Date.now() < deadline && isProcessAlive(pid)) {
    Bun.sleepSync(200);
  }

  if (isProcessAlive(pid)) {
    console.log("   Force killing...");
    try {
      process.kill(pid, "SIGKILL");
    } catch {}
    Bun.sleepSync(300);
  }

  removePid();
  console.log("✅ Agent Hands stopped.\n");
}

function cmdStatus() {
  const pid = readPid();
  if (pid) {
    console.log("\n🟢 Agent Hands is running");
    console.log(`   PID      : ${pid}`);
    console.log(`   Data dir : ${dataDir}`);
    console.log(`   Logs     : ${logFile}\n`);
  } else {
    console.log("\n🔴 Agent Hands is not running.\n");
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
  console.log(`agent-hands v${v ?? "unknown"}`);
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

async function cmdUninstall() {
  // 1. Stop server if running
  const pid = readPid();
  if (pid) {
    console.log(`🛑 Stopping running server (PID: ${pid})...`);
    cmdStop();
  }

  // 2. Detect paths
  const installDir = PKG_ROOT;
  const binLink = join(
    process.env.BIN_DIR ?? (existsSync(join(os.homedir(), ".local/bin", "agent-hands")) ? join(os.homedir(), ".local/bin") : "/usr/local/bin"),
    "agent-hands",
  );

  // Also try to find symlink by scanning common locations
  const possibleBinDirs = [join(os.homedir(), ".local/bin"), join(os.homedir(), "bin"), "/usr/local/bin"];
  const foundLinks = possibleBinDirs
    .map((dir) => join(dir, "agent-hands"))
    .filter((p) => {
      try {
        return existsSync(p) && readFileSync !== undefined;
      } catch {
        return false;
      }
    });

  console.log("\n🗑️  Agent Hands — Uninstall\n");
  console.log(`   Install dir : ${installDir}`);
  console.log(`   Data dir    : ${dataDir}`);
  if (foundLinks.length > 0) {
    console.log(`   Symlink(s)  : ${foundLinks.join(", ")}`);
  }
  console.log("");

  // 3. Confirm
  const readline = await import("node:readline");
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const ask = (q) => new Promise((res) => rl.question(q, res));

  const answer = await ask("⚠️  This will remove Agent Hands and all data. Continue? [y/N] ");
  rl.close();

  if (answer.trim().toLowerCase() !== "y") {
    console.log("\n❌ Uninstall cancelled.\n");
    process.exit(0);
  }

  // 4. Remove symlink(s)
  for (const link of foundLinks) {
    try {
      const { lstatSync, readlinkSync } = await import("node:fs");
      const stat = lstatSync(link);
      if (stat.isSymbolicLink()) {
        const target = readlinkSync(link);
        // Only remove if it points to our install
        if (target.startsWith(installDir)) {
          try {
            unlinkSync(link);
            console.log(`   ✅ Removed symlink: ${link}`);
          } catch {
            // Try with sudo-like approach
            const { execSync } = await import("node:child_process");
            try {
              execSync(`sudo rm -f "${link}"`, { stdio: "inherit" });
              console.log(`   ✅ Removed symlink: ${link} (sudo)`);
            } catch {
              console.log(`   ⚠️  Could not remove symlink: ${link} (remove manually)`);
            }
          }
        }
      }
    } catch {}
  }

  // 5. Remove install directory
  try {
    const { rmSync } = await import("node:fs");
    rmSync(installDir, { recursive: true, force: true });
    console.log(`   ✅ Removed install dir: ${installDir}`);
  } catch (e) {
    console.log(`   ⚠️  Could not remove install dir: ${installDir}`);
    console.log(`       Remove manually: rm -rf "${installDir}"`);
  }

  // 6. Remove data directory
  try {
    const { rmSync } = await import("node:fs");
    rmSync(dataDir, { recursive: true, force: true });
    console.log(`   ✅ Removed data dir: ${dataDir}`);
  } catch (e) {
    console.log(`   ⚠️  Could not remove data dir: ${dataDir}`);
    console.log(`       Remove manually: rm -rf "${dataDir}"`);
  }

  console.log("\n✅ Agent Hands has been uninstalled.\n");
}

function cmdHelp() {
  console.log(`
🤖 Agent Hands — LLM-First Knowledge Base

USAGE:
  agent-hands <command> [options]

COMMANDS:
  start        Start the server (daemon mode by default)
  stop         Stop the running server
  restart      Restart the server
  status       Show server status
  logs         View server logs
  version      Show version
  init         Create super admin (first run)
  mcp          Start MCP server in stdio mode
  uninstall    Remove Agent Hands and all data
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
  agent-hands init
  agent-hands start
  agent-hands start --port 8080 --host 0.0.0.0
  agent-hands start --foreground
  agent-hands stop
  agent-hands mcp
  agent-hands uninstall
  agent-hands logs --follow
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
  case "start":
    await cmdStart();
    break;
  case "stop":
    cmdStop();
    break;
  case "status":
    cmdStatus();
    break;
  case "restart":
    await cmdRestart();
    break;
  case "logs":
    await cmdLogs();
    break;
  case "version":
    cmdVersion();
    break;
  case "init":
    await cmdInit();
    break;
  case "mcp":
    await cmdMcp();
    break;
  case "uninstall":
    await cmdUninstall();
    break;
  case "_monitor":
    await cmdMonitor();
    break;
  default:
    cmdHelp();
}
