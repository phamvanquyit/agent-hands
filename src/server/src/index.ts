import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { createApp } from "./app.js";
import { getDb, closeDb } from "./common/db/client.js";
import { runMigrations } from "./common/db/migrate.js";
import { createSuperAdmin } from "./common/db/seed.js";
import { startMcpServer } from "./common/mcp/server.js";


export interface ServerOptions {
  port?: number;
  host?: string;
  dataDir?: string;
}

export async function startServer(options: ServerOptions = {}): Promise<void> {
  const port = options.port ?? Number(process.env.PORT ?? "18080");
  const host = options.host ?? process.env.HOST ?? "127.0.0.1";
  const dataDir =
    options.dataDir ??
    process.env.DATA_DIR ??
    `${process.env.HOME}/.moro-llm-toolkit`;

  process.env.DATA_DIR = dataDir;

  // Ensure JWT secret exists (generate on first run)
  ensureJwtSecret(dataDir);

  // Run DB migrations
  runMigrations(dataDir);

  // Initialize DB singleton
  getDb(dataDir);

  // Auto-seed: if no users exist → create default super admin
  await seedDefaultAdmin();

  const app = await createApp();

  try {
    await app.listen({ port, host });
    console.log(`\n🤖 Moro LLM Toolkit API running at http://${host}:${port}`);
    console.log(`DEBUG: NODE_ENV=${process.env.NODE_ENV}`);
    if (process.env.NODE_ENV !== "development") {
      console.log(`   Web UI   : http://${host}:${port}/ui`);
    }
    console.log(`   Data dir  : ${dataDir}`);
    console.log(`   OpenAPI   : http://${host}:${port}/api/openapi.json`);
    console.log(`   Health    : http://${host}:${port}/api/health`);
    console.log(`   S3 API   : http://${host}:${port}/s3 (path-style)\n`);
  } catch (err) {
    console.error("[Server] Failed to start:", err);
    process.exit(1);
  }

  // Graceful shutdown
  const shutdown = async () => {
    console.log("\n[Server] Shutting down...");

    await app.close();
    closeDb();
    process.exit(0);
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

/** Create super admin — called by `moro init` */
export async function initSuperAdmin(): Promise<void> {
  const dataDir =
    process.env.DATA_DIR ?? `${process.env.HOME}/.moro-llm-toolkit`;

  process.env.DATA_DIR = dataDir;
  runMigrations(dataDir);
  getDb(dataDir);

  // Prompt for credentials
  const readline = await import("node:readline");
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const ask = (q: string) => new Promise<string>((res) => rl.question(q, res));

  console.log("\n🤖 Moro LLM Toolkit — Create Super Admin\n");

  const username = await ask("   Username : ");
  const email = await ask("   Email    : ");
  const name = await ask("   Name     : ");
  const password = await ask("   Password : ");
  rl.close();

  try {
    const user = await createSuperAdmin(username.trim(), email.trim(), password.trim(), name.trim());
    console.log(`\n✅ Super admin created: ${user.email} (${user.id})\n`);
    console.log(`   Run 'moro-llm-toolkit start' to launch the server.\n`);
  } catch (err: any) {
    console.error(`\n❌ ${err.message}\n`);
    process.exit(1);
  }

  closeDb();
}

// ─── JWT Secret ───────────────────────────────────────────────────────────────
function ensureJwtSecret(dataDir: string) {
  if (process.env.JWT_SECRET) return;

  const secretFile = join(dataDir, "jwt.secret");

  if (existsSync(secretFile)) {
    process.env.JWT_SECRET = readFileSync(secretFile, "utf-8").trim();
    return;
  }

  // Generate 64-byte random hex, save with owner-read-only permissions
  mkdirSync(dataDir, { recursive: true });
  const secret = Buffer.from(crypto.getRandomValues(new Uint8Array(64))).toString("hex");
  writeFileSync(secretFile, secret, { mode: 0o600 });
  process.env.JWT_SECRET = secret;
  console.log(`🔐 JWT secret generated → ${secretFile}`);
}

// ─── Auto-seed ────────────────────────────────────────────────────────────────
const DEFAULT_USERNAME = "admin";
const DEFAULT_EMAIL = "admin@local.com";
const DEFAULT_PASSWORD = "admin123";
const DEFAULT_NAME = "Admin";

async function seedDefaultAdmin() {
  const db = getDb();
  const { users } = await import("./common/db/schema.js");
  const existing = db.select().from(users).get();
  if (existing) return; // already has users

  try {
    await createSuperAdmin(DEFAULT_USERNAME, DEFAULT_EMAIL, DEFAULT_PASSWORD, DEFAULT_NAME);
    console.log("🔑 Default super admin created:");
    console.log(`   Username : ${DEFAULT_USERNAME}`);
    console.log(`   Email    : ${DEFAULT_EMAIL}`);
    console.log(`   Password : ${DEFAULT_PASSWORD}`);
    console.log("   ⚠️  Change your password after first login!\n");
  } catch {
    // ignore — superadmin may already exist from a previous run
  }
}

export { startMcpServer };

// ─── Direct run ───────────────────────────────────────────────────────────────
if (import.meta.main) {
  startServer();
}
