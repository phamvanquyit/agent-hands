import { int, real, sqliteTable, text } from "drizzle-orm/sqlite-core";

// ─── Users ─────────────────────────────────────────────────────────────────────
export const users = sqliteTable("users", {
  id: text("id").primaryKey(),         // usr_xxxx
  username: text("username").unique(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  name: text("name").notNull(),
  role: text("role", { enum: ["superadmin", "admin", "member"] })
    .notNull()
    .default("member"),
  createdAt: int("created_at").notNull(),
  updatedAt: int("updated_at").notNull(),
});

// ─── API Keys ──────────────────────────────────────────────────────────────────
export const apiKeys = sqliteTable("api_keys", {
  id: text("id").primaryKey(),           // key_xxxx
  name: text("name").notNull(),
  keyHash: text("key_hash").notNull().unique(),
  prefix: text("prefix").notNull(),       // first 8 chars of raw key (ltk_xxxx)
  userId: text("user_id").notNull(),
  permissions: text("permissions").notNull().default('["*"]'),  // JSON array
  lastUsedAt: int("last_used_at"),
  expiresAt: int("expires_at"),           // epoch ms, null = never expires
  createdAt: int("created_at").notNull(),
});

// ─── Variable Namespaces ───────────────────────────────────────────────────────
export const variableNamespaces = sqliteTable("variable_projects", {
  id: text("id").primaryKey(),             // vns_xxxx
  name: text("name").notNull(),
  description: text("description"),
  icon: text("icon"),
  createdBy: text("created_by").notNull(),
  createdAt: int("created_at").notNull(),
  updatedAt: int("updated_at").notNull(),
});

// ─── Variables (Dynamic Key-Value Store) ───────────────────────────────────────
export const variables = sqliteTable("variables", {
  id: text("id").primaryKey(),          // var_xxxx
  projectId: text("project_id"),        // scoped under a variable_namespace (null = global)
  key: text("key").notNull(),
  value: text("value").notNull(),       // stored as text regardless of type
  type: text("type", { enum: ["string", "number", "boolean", "json"] })
    .notNull()
    .default("string"),
  ttl: int("ttl"),                      // seconds, null/0 = no expiry
  expiresAt: int("expires_at"),         // epoch ms, null = persistent
  createdAt: int("created_at").notNull(),
  updatedAt: int("updated_at").notNull(),
});

// ─── Databases (grouping for Dynamic Tables) ──────────────────────────────────
export const databases = sqliteTable("databases_v2", {
  id: text("id").primaryKey(),             // dbs_xxxx
  name: text("name").notNull(),
  description: text("description"),
  icon: text("icon"),
  createdBy: text("created_by").notNull(),
  createdAt: int("created_at").notNull(),
  updatedAt: int("updated_at").notNull(),
});

// ─── Dynamic Tables ────────────────────────────────────────────────────────────
export const dynamicTables = sqliteTable("dynamic_tables", {
  id: text("id").primaryKey(),            // dtb_xxxx
  databaseId: text("database_id"),        // optional: group under a database
  name: text("name").notNull(),
  description: text("description"),
  icon: text("icon"),
  columns: text("columns").notNull().default("[]"),  // JSON: ColumnDef[]
  createdBy: text("created_by").notNull(),
  createdAt: int("created_at").notNull(),
  updatedAt: int("updated_at").notNull(),
});

export const dynamicTableRows = sqliteTable("dynamic_table_rows", {
  id: text("id").primaryKey(),            // dtr_xxxx
  tableId: text("table_id").notNull(),
  data: text("data").notNull().default("{}"),  // JSON: { colId: value }
  createdBy: text("created_by"),
  createdAt: int("created_at").notNull(),
  updatedAt: int("updated_at").notNull(),
});

// ─── Projects ──────────────────────────────────────────────────────────────────
export const projects = sqliteTable("projects", {
  id: text("id").primaryKey(),             // prj_xxxx
  name: text("name").notNull(),
  description: text("description"),
  icon: text("icon"),
  createdBy: text("created_by").notNull(),
  createdAt: int("created_at").notNull(),
  updatedAt: int("updated_at").notNull(),
});

// ─── Documents ─────────────────────────────────────────────────────────────────
export const documents = sqliteTable("documents", {
  id: text("id").primaryKey(),             // doc_xxxx
  projectId: text("project_id"),           // scoped under a project
  title: text("title").notNull().default("Untitled"),
  icon: text("icon"),
  cover: text("cover"),
  content: text("content").notNull().default(""), // markdown text
  parentId: text("parent_id"),             // for nested sub-pages (future)
  isPublic: int("is_public").notNull().default(0),
  createdBy: text("created_by").notNull(),
  order: real("order").notNull().default(0),
  createdAt: int("created_at").notNull(),
  updatedAt: int("updated_at").notNull(),
});

// ─── Storage: Buckets ──────────────────────────────────────────────────────────
export const buckets = sqliteTable("buckets", {
  id: text("id").primaryKey(),             // bkt_xxxx
  name: text("name").notNull().unique(),
  isPublic: int("is_public").notNull().default(0),
  createdAt: int("created_at").notNull(),
});

// ─── Storage: Objects ──────────────────────────────────────────────────────────
export const objects = sqliteTable("objects", {
  id: text("id").primaryKey(),             // obj_xxxx
  bucketId: text("bucket_id").notNull(),
  key: text("key").notNull(),              // e.g. images/avatars/user1.png
  size: int("size").notNull().default(0),
  contentType: text("content_type").notNull().default("application/octet-stream"),
  etag: text("etag").notNull(),            // MD5 hash
  isPublic: int("is_public").notNull().default(0),
  createdAt: int("created_at").notNull(),
  updatedAt: int("updated_at").notNull(),
});

// ─── Storage: Access Keys (S3 API auth) ────────────────────────────────────────
export const storageAccessKeys = sqliteTable("storage_access_keys", {
  id: text("id").primaryKey(),             // sak_xxxx
  accessKey: text("access_key").notNull().unique(),   // 20 chars
  secretKeyHash: text("secret_key_hash").notNull(),
  label: text("label").notNull().default(""),
  isActive: int("is_active").notNull().default(1),
  createdAt: int("created_at").notNull(),
});

// ─── MCP Tool Servers ──────────────────────────────────────────────────────────
export const mcpToolServers = sqliteTable("mcp_tool_servers", {
  id: text("id").primaryKey(),              // mts_xxxx
  name: text("name").notNull().unique(),
  description: text("description"),
  type: text("type", { enum: ["builtin", "custom"] })
    .notNull()
    .default("custom"),
  isActive: int("is_active").notNull().default(1),
  createdAt: int("created_at").notNull(),
  updatedAt: int("updated_at").notNull(),
});

// ─── MCP Tools ─────────────────────────────────────────────────────────────────
export const mcpTools = sqliteTable("mcp_tools", {
  id: text("id").primaryKey(),              // mtl_xxxx
  serverId: text("server_id").notNull(),    // FK → mcp_tool_servers
  name: text("name").notNull(),             // snake_case tool name
  description: text("description").notNull().default(""),
  inputSchema: text("input_schema"),        // JSON Schema string
  code: text("code").notNull().default(""),  // Python source code
  isActive: int("is_active").notNull().default(1),
  createdAt: int("created_at").notNull(),
  updatedAt: int("updated_at").notNull(),
});

// ─── Types ─────────────────────────────────────────────────────────────────────
export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type ApiKey = typeof apiKeys.$inferSelect;
export type InsertApiKey = typeof apiKeys.$inferInsert;
export type VariableNamespace = typeof variableNamespaces.$inferSelect;
export type InsertVariableNamespace = typeof variableNamespaces.$inferInsert;
export type Variable = typeof variables.$inferSelect;
export type InsertVariable = typeof variables.$inferInsert;
export type DatabaseRecord = typeof databases.$inferSelect;
export type InsertDatabase = typeof databases.$inferInsert;
export type DynamicTable = typeof dynamicTables.$inferSelect;
export type InsertDynamicTable = typeof dynamicTables.$inferInsert;
export type DynamicTableRow = typeof dynamicTableRows.$inferSelect;
export type InsertDynamicTableRow = typeof dynamicTableRows.$inferInsert;
export type Project = typeof projects.$inferSelect;
export type InsertProject = typeof projects.$inferInsert;
export type Document = typeof documents.$inferSelect;
export type InsertDocument = typeof documents.$inferInsert;
export type Bucket = typeof buckets.$inferSelect;
export type InsertBucket = typeof buckets.$inferInsert;
export type StorageObject = typeof objects.$inferSelect;
export type InsertStorageObject = typeof objects.$inferInsert;
export type StorageAccessKey = typeof storageAccessKeys.$inferSelect;
export type InsertStorageAccessKey = typeof storageAccessKeys.$inferInsert;
export type McpToolServer = typeof mcpToolServers.$inferSelect;
export type InsertMcpToolServer = typeof mcpToolServers.$inferInsert;
export type McpTool = typeof mcpTools.$inferSelect;
export type InsertMcpTool = typeof mcpTools.$inferInsert;

