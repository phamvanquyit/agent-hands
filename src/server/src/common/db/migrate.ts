import { Database as BunSQLite } from "bun:sqlite";
import { mkdirSync } from "node:fs";

/**
 * Run migrations using raw SQL on bun:sqlite.
 * We keep migrations as inline SQL strings — no drizzle-kit required at runtime.
 */
const MIGRATIONS: string[] = [
  // ── v1: initial schema ──────────────────────────────────────────────────────
  `CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'member',
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
  )`,

  `CREATE TABLE IF NOT EXISTS api_keys (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    key_hash TEXT NOT NULL UNIQUE,
    prefix TEXT NOT NULL,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    permissions TEXT NOT NULL DEFAULT '["*"]',
    last_used_at INTEGER,
    expires_at INTEGER,
    created_at INTEGER NOT NULL
  )`,

  `CREATE TABLE IF NOT EXISTS documents (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL DEFAULT 'Untitled',
    icon TEXT,
    cover TEXT,
    parent_id TEXT,
    is_public INTEGER NOT NULL DEFAULT 0,
    created_by TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    "order" REAL NOT NULL DEFAULT 0,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
  )`,

  `CREATE TABLE IF NOT EXISTS blocks (
    id TEXT PRIMARY KEY,
    doc_id TEXT NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    parent_id TEXT,
    type TEXT NOT NULL,
    content TEXT NOT NULL DEFAULT '{}',
    "order" REAL NOT NULL DEFAULT 0,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
  )`,

  `CREATE TABLE IF NOT EXISTS databases (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    schema TEXT NOT NULL DEFAULT '[]',
    doc_id TEXT,
    created_by TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
  )`,

  `CREATE TABLE IF NOT EXISTS database_rows (
    id TEXT PRIMARY KEY,
    database_id TEXT NOT NULL REFERENCES databases(id) ON DELETE CASCADE,
    properties TEXT NOT NULL DEFAULT '{}',
    created_by TEXT REFERENCES users(id) ON DELETE SET NULL,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
  )`,

  `CREATE TABLE IF NOT EXISTS files (
    id TEXT PRIMARY KEY,
    key TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    mime_type TEXT NOT NULL DEFAULT 'application/octet-stream',
    size INTEGER NOT NULL DEFAULT 0,
    uploaded_by TEXT REFERENCES users(id) ON DELETE SET NULL,
    created_at INTEGER NOT NULL
  )`,

  `CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at INTEGER NOT NULL
  )`,

  // ── Indexes ─────────────────────────────────────────────────────────────────
  `CREATE INDEX IF NOT EXISTS idx_blocks_doc_id ON blocks(doc_id)`,
  `CREATE INDEX IF NOT EXISTS idx_documents_parent_id ON documents(parent_id)`,
  `CREATE INDEX IF NOT EXISTS idx_database_rows_database_id ON database_rows(database_id)`,
  `CREATE INDEX IF NOT EXISTS idx_api_keys_user_id ON api_keys(user_id)`,

  // ── FTS5: full-text search on docs and blocks ────────────────────────────────
  `CREATE VIRTUAL TABLE IF NOT EXISTS fts_documents USING fts5(
    id UNINDEXED,
    title,
    content='documents',
    content_rowid='rowid'
  )`,

  `CREATE VIRTUAL TABLE IF NOT EXISTS fts_blocks USING fts5(
    id UNINDEXED,
    doc_id UNINDEXED,
    type UNINDEXED,
    content,
    content='blocks',
    content_rowid='rowid'
  )`,

  // FTS triggers
  `CREATE TRIGGER IF NOT EXISTS trg_fts_docs_insert AFTER INSERT ON documents BEGIN
    INSERT INTO fts_documents(id, title) VALUES (new.id, new.title);
  END`,

  `CREATE TRIGGER IF NOT EXISTS trg_fts_docs_update AFTER UPDATE ON documents BEGIN
    UPDATE fts_documents SET title = new.title WHERE id = old.id;
  END`,

  `CREATE TRIGGER IF NOT EXISTS trg_fts_docs_delete AFTER DELETE ON documents BEGIN
    DELETE FROM fts_documents WHERE id = old.id;
  END`,

  `CREATE TRIGGER IF NOT EXISTS trg_fts_blocks_insert AFTER INSERT ON blocks BEGIN
    INSERT INTO fts_blocks(id, doc_id, type, content) VALUES (new.id, new.doc_id, new.type, new.content);
  END`,

  `CREATE TRIGGER IF NOT EXISTS trg_fts_blocks_update AFTER UPDATE ON blocks BEGIN
    UPDATE fts_blocks SET content = new.content WHERE id = old.id;
  END`,

  `CREATE TRIGGER IF NOT EXISTS trg_fts_blocks_delete AFTER DELETE ON blocks BEGIN
    DELETE FROM fts_blocks WHERE id = old.id;
  END`,

  // migrations tracker
  `CREATE TABLE IF NOT EXISTS _migrations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    applied_at INTEGER NOT NULL
  )`,

  // ── v24: MCP client servers ─────────────────────────────────────────────────
  `CREATE TABLE IF NOT EXISTS mcp_servers (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    transport TEXT NOT NULL DEFAULT 'stdio',
    command TEXT,
    args TEXT NOT NULL DEFAULT '[]',
    env TEXT NOT NULL DEFAULT '{}',
    url TEXT,
    status TEXT NOT NULL DEFAULT 'disconnected',
    last_error TEXT,
    auto_connect INTEGER NOT NULL DEFAULT 1,
    is_active INTEGER NOT NULL DEFAULT 1,
    created_at INTEGER NOT NULL DEFAULT (unixepoch()),
    updated_at INTEGER NOT NULL DEFAULT (unixepoch())
  )`,

  // ── v25: add username to users ──────────────────────────────────────────────
  `ALTER TABLE users ADD COLUMN username TEXT`,
  `UPDATE users SET username = substr(email, 1, instr(email, '@') - 1) WHERE username IS NULL`,
  `CREATE UNIQUE INDEX IF NOT EXISTS idx_users_username ON users(username)`,

  // ── v26: Dynamic Variables ──────────────────────────────────────────────────
  `CREATE TABLE IF NOT EXISTS variables (
    id TEXT PRIMARY KEY,
    key TEXT NOT NULL,
    value TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'string',
    namespace TEXT NOT NULL DEFAULT 'default',
    ttl INTEGER,
    expires_at INTEGER,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS idx_variables_ns_key ON variables(namespace, key)`,
  `CREATE INDEX IF NOT EXISTS idx_variables_namespace ON variables(namespace)`,
  `CREATE INDEX IF NOT EXISTS idx_variables_expires_at ON variables(expires_at)`,

  // ── v27: Dynamic Tables ────────────────────────────────────────────────────
  `CREATE TABLE IF NOT EXISTS dynamic_tables (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    icon TEXT,
    columns TEXT NOT NULL DEFAULT '[]',
    created_by TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS dynamic_table_rows (
    id TEXT PRIMARY KEY,
    table_id TEXT NOT NULL REFERENCES dynamic_tables(id) ON DELETE CASCADE,
    data TEXT NOT NULL DEFAULT '{}',
    created_by TEXT,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
  )`,
  `CREATE INDEX IF NOT EXISTS idx_dynamic_table_rows_table_id ON dynamic_table_rows(table_id)`,

  // ── v28: Add content column to documents for markdown content ────────────
  `ALTER TABLE documents ADD COLUMN content TEXT NOT NULL DEFAULT '[]'`,

  // ── v29: Projects table ─────────────────────────────────────────────────
  `CREATE TABLE IF NOT EXISTS projects (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    icon TEXT,
    created_by TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
  )`,

  // ── v30: Add project_id to documents ────────────────────────────────────
  `ALTER TABLE documents ADD COLUMN project_id TEXT`,
  `CREATE INDEX IF NOT EXISTS idx_documents_project_id ON documents(project_id)`,

  // ── v31: Storage — Buckets ─────────────────────────────────────────────
  `CREATE TABLE IF NOT EXISTS buckets (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    is_public INTEGER NOT NULL DEFAULT 0,
    created_at INTEGER NOT NULL
  )`,

  // ── v32: Storage — Objects ─────────────────────────────────────────────
  `CREATE TABLE IF NOT EXISTS objects (
    id TEXT PRIMARY KEY,
    bucket_id TEXT NOT NULL REFERENCES buckets(id) ON DELETE CASCADE,
    key TEXT NOT NULL,
    size INTEGER NOT NULL DEFAULT 0,
    content_type TEXT NOT NULL DEFAULT 'application/octet-stream',
    etag TEXT NOT NULL,
    is_public INTEGER NOT NULL DEFAULT 0,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS idx_objects_bucket_key ON objects(bucket_id, key)`,
  `CREATE INDEX IF NOT EXISTS idx_objects_bucket_id ON objects(bucket_id)`,

  // ── v33: Storage — Access Keys (S3 API auth) ──────────────────────────
  `CREATE TABLE IF NOT EXISTS storage_access_keys (
    id TEXT PRIMARY KEY,
    access_key TEXT NOT NULL UNIQUE,
    secret_key_hash TEXT NOT NULL,
    label TEXT NOT NULL DEFAULT '',
    is_active INTEGER NOT NULL DEFAULT 1,
    created_at INTEGER NOT NULL
  )`,

  // ── v34: Databases (grouping for dynamic tables) ───────────────────────
  `CREATE TABLE IF NOT EXISTS databases_v2 (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    icon TEXT,
    created_by TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
  )`,

  // ── v35: Add database_id to dynamic_tables ────────────────────────────
  `ALTER TABLE dynamic_tables ADD COLUMN database_id TEXT`,
  `CREATE INDEX IF NOT EXISTS idx_dynamic_tables_database_id ON dynamic_tables(database_id)`,

  // ── v36: Add project_id to variables ────────────────────────────────
  `ALTER TABLE variables ADD COLUMN project_id TEXT`,
  `CREATE INDEX IF NOT EXISTS idx_variables_project_id ON variables(project_id)`,
  // Update unique index to include project_id (drop old one, create new)
  `DROP INDEX IF EXISTS idx_variables_ns_key`,
  `CREATE UNIQUE INDEX IF NOT EXISTS idx_variables_prj_ns_key ON variables(COALESCE(project_id, ''), namespace, key)`,

  // ── v37: Variable Projects (separate from document projects) ────────────
  `CREATE TABLE IF NOT EXISTS variable_projects (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    icon TEXT,
    created_by TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
  )`,

  // ── v38: MCP Tool Servers ──────────────────────────────────────────────
  `CREATE TABLE IF NOT EXISTS mcp_tool_servers (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    type TEXT NOT NULL DEFAULT 'custom',
    is_active INTEGER NOT NULL DEFAULT 1,
    created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
    updated_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
  )`,

  // Seed built-in System Tools server
  `INSERT OR IGNORE INTO mcp_tool_servers (id, name, description, type, is_active, created_at, updated_at)
   VALUES ('mts_system', 'System Tools', 'Built-in MCP server exposing toolkit system tools (Variables, Tables, Documents, Storage)', 'builtin', 1, (unixepoch() * 1000), (unixepoch() * 1000))`,

  // ── v39: MCP Tools ────────────────────────────────────────────────────
  `CREATE TABLE IF NOT EXISTS mcp_tools (
    id TEXT PRIMARY KEY,
    server_id TEXT NOT NULL REFERENCES mcp_tool_servers(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    input_schema TEXT,
    code TEXT NOT NULL DEFAULT '',
    is_active INTEGER NOT NULL DEFAULT 1,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
  )`,
  `CREATE INDEX IF NOT EXISTS idx_mcp_tools_server_id ON mcp_tools(server_id)`,
  `CREATE UNIQUE INDEX IF NOT EXISTS idx_mcp_tools_server_name ON mcp_tools(server_id, name)`,

  // ── v40: Rename built-in server ────────────────────────────────────────
  `UPDATE mcp_tool_servers SET name = 'Moro Agent Toolkit', description = 'Built-in MCP server providing system tools for AI agents to interact with Variables, Tables, Documents, and Storage.' WHERE id = 'mts_system'`,

  // ── v41: Rename project to Moro LLM Toolkit ────────────────────────────
  `UPDATE mcp_tool_servers SET name = 'Moro LLM Toolkit' WHERE id = 'mts_system'`,
];

export function runMigrations(dataDir: string) {
  mkdirSync(dataDir, { recursive: true });
  const sqlite = new BunSQLite(`${dataDir}/data.db`, { create: true });
  sqlite.exec("PRAGMA journal_mode=WAL;");
  sqlite.exec("PRAGMA foreign_keys=ON;");

  // Check how many migrations already applied
  sqlite.exec(`CREATE TABLE IF NOT EXISTS _migrations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    applied_at INTEGER NOT NULL
  )`);

  const applied = sqlite
    .query<{ id: number }, []>("SELECT COUNT(*) as id FROM _migrations")
    .get()!.id;

  const pending = MIGRATIONS.slice(applied);
  if (pending.length === 0) {
    console.log("[DB] No pending migrations.");
    sqlite.close();
    return;
  }

  sqlite.transaction(() => {
    for (const sql of pending) {
      sqlite.exec(sql);
      sqlite.exec(
        `INSERT INTO _migrations(applied_at) VALUES (${Date.now()})`,
      );
    }
  })();

  console.log(`[DB] Applied ${pending.length} migration(s).`);
  sqlite.close();
}

// CLI: bun src/common/db/migrate.ts
if (import.meta.main) {
  const dataDir =
    process.env.DATA_DIR ?? `${process.env.HOME}/.moro-llm-toolkit`;
  runMigrations(dataDir);
}
