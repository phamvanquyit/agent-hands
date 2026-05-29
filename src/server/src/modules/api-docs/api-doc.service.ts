import type { ApiSection, ApiDocsResponse } from "./api-doc.schema.js";

// ── Intro (non-endpoint) sections ─────────────────────────────────────────

const INTRO_SECTIONS: ApiSection[] = [
  {
    id: "getting-started",
    label: "Getting Started",
    description: "",
    basePrefix: "",
    endpoints: [],
  },
  {
    id: "authentication",
    label: "Authentication",
    description: "",
    basePrefix: "",
    endpoints: [],
  },
  {
    id: "response-format",
    label: "Response Format",
    description: "",
    basePrefix: "",
    endpoints: [],
  },
];

// ── API endpoint sections ─────────────────────────────────────────────────

const API_SECTIONS: ApiSection[] = [
  {
    id: "auth",
    label: "Auth",
    description: "Login, token refresh, and session management.",
    basePrefix: "/api/auth",
    endpoints: [
      {
        method: "POST",
        path: "/login",
        summary: "Login with username/email + password",
        auth: "none",
        body: `{
  "login": "admin@example.com",
  "password": "secret"
}`,
        response: `{
  "access_token": "eyJhbGci...",
  "refresh_token": "eyJhbGci...",
  "token_type": "Bearer",
  "user": {
    "id": "usr_xxx",
    "name": "Admin",
    "role": "superadmin"
  }
}`,
        jsExample: `const { AgentHandsClient } = require("agent-hands-client");

const client = new AgentHandsClient({
  baseUrl: "{{BASE_URL}}"
});

const result = await client.auth.login({
  login: "admin@example.com",
  password: "secret"
});

console.log(result.access_token);
console.log(result.user);`,
      },
      {
        method: "POST",
        path: "/refresh",
        summary: "Refresh access token",
        auth: "none",
        body: `{ "refresh_token": "eyJhbGci..." }`,
        response: `{
  "access_token": "...",
  "refresh_token": "...",
  "token_type": "Bearer"
}`,
        jsExample: `await client.auth.refresh(refreshToken);`,
      },
      {
        method: "GET",
        path: "/me",
        summary: "Get current authenticated user",
        auth: "both",
        response: `{
  "id": "usr_xxx",
  "email": "admin@example.com",
  "name": "Admin",
  "role": "superadmin"
}`,
        jsExample: `const me = await client.auth.me();
console.log(me.name, me.role);`,
      },
      {
        method: "POST",
        path: "/change-password",
        summary: "Change password for current user",
        auth: "jwt",
        body: `{
  "old_password": "current",
  "new_password": "newpass123"
}`,
        jsExample: `await client.auth.changePassword({
  old_password: "current",
  new_password: "newpass123"
});`,
      },
    ],
  },
  {
    id: "api-keys",
    label: "API Keys",
    description: "Create and manage API keys for programmatic access.",
    basePrefix: "/api/api-keys",
    endpoints: [
      {
        method: "GET",
        path: "/",
        summary: "List all API keys (masked)",
        auth: "both",
        response: `{
  "items": [{
    "id": "key_xxx",
    "name": "My Agent",
    "prefix": "ltk_AbCd",
    "permissions": ["*"],
    "lastUsedAt": null,
    "expiresAt": null,
    "createdAt": 1714000000
  }],
  "meta": { "total": 1 }
}`,
        jsExample: `const keys = await client.apiKeys.list();
keys.forEach(k => console.log(k.name, k.prefix));`,
      },
      {
        method: "POST",
        path: "/",
        summary: "Create new API key — raw key returned once",
        auth: "both",
        body: `{
  "name": "My AI Agent",
  "permissions": ["*"],
  "expiresAt": 1735689600000
}`,
        response: `{
  "id": "key_xxx",
  "name": "My AI Agent",
  "key": "ltk_AbCdEfGhIjKlMnOp...",
  "prefix": "ltk_AbCd",
  "permissions": ["*"]
}`,
        notes: "⚠️ The raw key is shown only once. Copy it immediately.",
        jsExample: `const created = await client.apiKeys.create({
  name: "My AI Agent"
});

// Save this! It's shown only once.
console.log(created.key);`,
      },
      {
        method: "DELETE",
        path: "/:id",
        summary: "Revoke (delete) an API key",
        auth: "both",
        jsExample: `await client.apiKeys.delete("key_xxx");`,
      },
    ],
  },
  {
    id: "kv-store",
    label: "KV Store",
    description: "Key-value store with TTL. Use key prefixes for organization (e.g. config.api_url, cache.token).",
    basePrefix: "/api/kv-store",
    endpoints: [
      {
        method: "GET",
        path: "/",
        summary: "List variables (paginated, filterable)",
        auth: "both",
        queryParams: "search, sort (key|type|updated_at|ttl), order (asc|desc), page, limit",
        response: `{
  "items": [...],
  "meta": {
    "total": 42,
    "page": 1,
    "limit": 20,
    "hasMore": true
  }
}`,
        jsExample: `const result = await client.kvStore.list({
  search: "api",
  page: 1,
  limit: 20
});

console.log(result.items);   // Variable[]
console.log(result.meta);    // { total, page, limit, hasMore }`,
      },
      {
        method: "GET",
        path: "/by-key/:key",
        summary: "Get variable by key",
        auth: "both",
        response: `{
  "id": "var_xxx",
  "key": "api_url",
  "value": "https://...",
  "type": "string",
  "ttl": null,
  "expiresAt": null
}`,
        jsExample: `const v = await client.kvStore.getByKey("api_url");
console.log(v.value);`,
      },
      {
        method: "POST",
        path: "/",
        summary: "Create or upsert a variable",
        auth: "both",
        body: `{
  "key": "api_url",
  "value": "https://example.com",
  "type": "string",
  "ttl": 3600
}`,
        notes: "If a variable with the same key exists, it will be updated (upsert).",
        jsExample: `const v = await client.kvStore.create({
  key: "api_url",
  value: "https://example.com",
  type: "string",
  ttl: 3600     // seconds, 0 = no expiry
});`,
      },
      {
        method: "POST",
        path: "/bulk",
        summary: "Batch create/upsert multiple variables",
        auth: "both",
        body: `{
  "variables": [
    { "key": "a", "value": "1" },
    { "key": "b", "value": "2" }
  ]
}`,
        jsExample: `const vars = await client.kvStore.bulkCreate([
  { key: "a", value: "1" },
  { key: "b", value: "2" }
]);`,
      },
      {
        method: "PATCH",
        path: "/:id",
        summary: "Update variable by ID",
        auth: "both",
        body: `{ "value": "new-value", "ttl": 7200 }`,
        jsExample: `const updated = await client.kvStore.update("var_xxx", {
  value: "new-value",
  ttl: 7200
});`,
      },
      {
        method: "DELETE",
        path: "/:id",
        summary: "Delete a single variable by ID",
        auth: "both",
        jsExample: `await client.kvStore.delete("var_xxx");`,
      },
      {
        method: "DELETE",
        path: "/by-key/:key",
        summary: "Delete variable by key",
        auth: "both",
        jsExample: `await fetch("{{BASE_URL}}/api/kv-store/by-key/api_url", {
  method: "DELETE",
  headers: { "X-API-Key": "YOUR_API_KEY" }
});`,
      },
      {
        method: "DELETE",
        path: "/flush",
        summary: "Flush (delete) all variables",
        auth: "both",
        notes: "Deletes ALL variables. Use with caution.",
        jsExample: `const result = await client.kvStore.flush();
console.log(result.deleted); // number of deleted variables`,
      },
    ],
  },
  {
    id: "datatables-projects",
    label: "DataTable Projects",
    description: "Group tables into logical projects for organization.",
    basePrefix: "/api/datatables",
    endpoints: [
      {
        method: "GET",
        path: "/",
        summary: "List all projects",
        auth: "both",
        response: `{
  "items": [{
    "id": "prj_xxx",
    "name": "CRM",
    "description": "Customer data",
    "tableCount": 5,
    "createdAt": 1714000000,
    "updatedAt": 1714000000
  }],
  "meta": { "total": 1 }
}`,
        jsExample: `const projects = await client.projects.list();
projects.forEach(p => console.log(db.name, db.tableCount));`,
      },
      {
        method: "POST",
        path: "/",
        summary: "Create a new project",
        auth: "both",
        body: `{
  "name": "CRM",
  "description": "Customer relationship management"
}`,
        jsExample: `const db = await client.projects.create({
  name: "CRM",
  description: "Customer relationship management"
});`,
      },
      {
        method: "GET",
        path: "/:id",
        summary: "Get project by ID",
        auth: "both",
        jsExample: `const db = await client.projects.get("prj_xxx");
console.log(db.tableCount);`,
      },
      {
        method: "PATCH",
        path: "/:id",
        summary: "Update project metadata",
        auth: "both",
        body: `{ "name": "Updated Name" }`,
        jsExample: `await client.projects.update("prj_xxx", {
  name: "Updated Name"
});`,
      },
      {
        method: "DELETE",
        path: "/:id",
        summary: "Delete project (cascades tables + rows)",
        auth: "both",
        jsExample: `await client.projects.delete("prj_xxx");`,
      },
    ],
  },
  {
    id: "tables",
    label: "Tables (nested under Projects)",
    description: "Tables are nested under projects. All table operations require a project ID.",
    basePrefix: "/api/datatables/:projectId/tables",
    endpoints: [
      {
        method: "GET",
        path: "/",
        summary: "List tables in a project",
        auth: "both",
        jsExample: `const tables = await client.tables.list("prj_xxx");`,
      },
      {
        method: "POST",
        path: "/",
        summary: "Create a new table with columns",
        auth: "both",
        body: `{
  "name": "Contacts",
  "columns": [
    { "name": "Name", "type": "text" },
    { "name": "Email", "type": "text" }
  ]
}`,
        jsExample: `const table = await client.tables.create("prj_xxx", {
  name: "Contacts",
  columns: [{ name: "Name", type: "text" }]
});`,
      },
      {
        method: "GET",
        path: "/:id",
        summary: "Get table details by ID",
        auth: "both",
        jsExample: `const table = await client.tables.get("prj_xxx", "dtb_xxx");`,
      },
      {
        method: "PATCH",
        path: "/:id",
        summary: "Update table metadata",
        auth: "both",
        body: `{ "name": "Updated Name" }`,
        jsExample: `await client.tables.update("prj_xxx", "dtb_xxx", { name: "Updated" });`,
      },
      {
        method: "DELETE",
        path: "/:id",
        summary: "Delete table and all rows",
        auth: "both",
        jsExample: `await client.tables.delete("prj_xxx", "dtb_xxx");`,
      },
      {
        method: "POST",
        path: "/:id/columns",
        summary: "Add a new column",
        auth: "both",
        body: `{ "name": "Status", "type": "text" }`,
        jsExample: `await client.tables.addColumn("prj_xxx", "dtb_xxx", { name: "Status", type: "text" });`,
      },
      {
        method: "GET",
        path: "/:id/rows",
        summary: "List rows (paginated, sortable, filterable)",
        auth: "both",
        queryParams: "page, limit (max 200), sort (updated_at|created_at|col_xxx|\"Column Name\"), order (asc|desc), filter (JSON array), filterLogic (and|or)",
        notes: `Filter supports both column name and column ID:
• { "column": "Name", "operator": "contains", "value": "John" } — by name (LLM-friendly)
• { "columnId": "col_xxx", "operator": "eq", "value": "test" } — by ID
Operators: eq, neq, contains, not_contains, starts_with, ends_with, gt, gte, lt, lte, is_empty, is_not_empty.
Sort also supports column names: sort=Name&order=asc`,
        jsExample: `// Simple list
const result = await client.tables.listRows("prj_xxx", "dtb_xxx", { page: 1, limit: 50 });

// Filter by column NAME (LLM-friendly — no need to look up column IDs)
const filtered = await client.tables.listRows("prj_xxx", "dtb_xxx", {
  filter: [
    { column: "Name", operator: "contains", value: "John" },
    { column: "Age", operator: "gt", value: 18 }
  ],
  filterLogic: "and"
});

// Sort by column name
const sorted = await client.tables.listRows("prj_xxx", "dtb_xxx", {
  sort: "Name",
  order: "asc"
});`,
      },
      {
        method: "POST",
        path: "/:id/rows",
        summary: "Create a new row",
        auth: "both",
        body: `{ "data": { "col_xxx": "John" } }`,
        jsExample: `const row = await client.tables.createRow("prj_xxx", "dtb_xxx", { data: { col_xxx: "John" } });`,
      },
      {
        method: "PATCH",
        path: "/:id/rows/:rowId",
        summary: "Update a row",
        auth: "both",
        body: `{ "data": { "col_xxx": "Updated" } }`,
        jsExample: `await client.tables.updateRow("prj_xxx", "dtb_xxx", "dtr_yyy", { data: { col_xxx: "Updated" } });`,
      },
      {
        method: "DELETE",
        path: "/:id/rows/:rowId",
        summary: "Delete a row",
        auth: "both",
        jsExample: `await client.tables.deleteRow("prj_xxx", "dtb_xxx", "dtr_yyy");`,
      },
      {
        method: "POST",
        path: "/:id/rows/bulk-delete",
        summary: "Bulk delete rows",
        auth: "both",
        body: `{ "rowIds": ["dtr_a", "dtr_b"] }`,
        jsExample: `await client.tables.bulkDeleteRows("prj_xxx", "dtb_xxx", ["dtr_a", "dtr_b"]);`,
      },
      {
        method: "POST",
        path: "/:id/rows/bulk-update",
        summary: "Bulk update multiple rows at once",
        auth: "both",
        body: `{
  "updates": [
    { "rowId": "dtr_a", "data": { "col_xxx": "new value" } },
    { "rowId": "dtr_b", "data": { "col_xxx": "other value" } }
  ]
}`,
        jsExample: `const result = await client.tables.bulkUpdateRows("prj_xxx", "dtb_xxx", [
  { rowId: "dtr_a", data: { col_xxx: "new value" } },
  { rowId: "dtr_b", data: { col_xxx: "other value" } }
]);
console.log(result.updated); // number of updated rows`,
      },
      {
        method: "POST",
        path: "/:id/query",
        summary: "Execute MQL query (SQL-like syntax for flexible row querying)",
        auth: "both",
        body: `{
  "q": "SELECT name, email WHERE city = 'HCM' AND age > 30 ORDER BY name ASC LIMIT 10"
}`,
        response: `{
  "items": [
    { "id": "dtr_xxx", "data": { "col_name": "Bob", "col_email": "bob@test.com" }, ... }
  ],
  "meta": { "total": 3, "limit": 10, "offset": 0, "hasMore": false, "query": "..." }
}`,
        notes: `MQL (Agent Hands Query Language) — a safe SQL-like DSL for querying rows.

Syntax: [SELECT cols] [WHERE conditions] [ORDER BY col ASC|DESC, ...] [LIMIT n] [OFFSET n]

Operators: = != > >= < <= LIKE IN BETWEEN IS NULL IS NOT NULL
Logic: AND, OR, parentheses for grouping
Special: COUNT WHERE ... (count-only, no data returned)

Security: MQL is NOT raw SQL. It's parsed into structured filters.
• DDL/DML keywords (DROP, DELETE, INSERT, UPDATE, etc.) are rejected
• Semicolons and SQL comments (--) are rejected
• Column names are validated against the table schema
• Table scope is from URL path — cannot query other tables

Examples:
• "WHERE active = true ORDER BY name LIMIT 20"
• "SELECT name, email WHERE age BETWEEN 25 AND 40"
• "WHERE city IN ('HCM', 'Hanoi') ORDER BY age DESC"
• "WHERE (status = 'active' AND age > 30) OR role = 'admin'"
• "COUNT WHERE status = 'pending'"
• "WHERE name LIKE '%john%' ORDER BY created_at DESC"`,
        jsExample: `// Simple filter
const result = await fetch("{{BASE_URL}}/api/datatables/prj_xxx/tables/dtb_xxx/query", {
  method: "POST",
  headers: { "Content-Type": "application/json", "Authorization": "Bearer TOKEN" },
  body: JSON.stringify({
    q: "WHERE active = true AND age > 25 ORDER BY name LIMIT 10"
  })
});

// Select specific columns
{ q: "SELECT name, email WHERE city = 'HCM'" }

// Complex filter with nested logic
{ q: "WHERE (city = 'HCM' AND age > 30) OR status = 'vip'" }

// IN operator
{ q: "WHERE city IN ('HCM', 'Hanoi', 'Danang')" }

// Count only (no data returned)
{ q: "COUNT WHERE active = true" }

// Multi-sort
{ q: "ORDER BY city ASC, age DESC LIMIT 50" }`,
      },
    ],
  },
  {
    id: "users",
    label: "Users",
    description: "User management — admin/superadmin only for most operations.",
    basePrefix: "/api/users",
    endpoints: [
      {
        method: "GET",
        path: "/",
        summary: "List all users (admin+)",
        auth: "both",
        response: `{
  "items": [{
    "id": "usr_xxx",
    "username": "admin",
    "email": "admin@example.com",
    "name": "Admin",
    "role": "superadmin",
    "createdAt": 1714000000,
    "updatedAt": 1714000000
  }],
  "meta": { "total": 1 }
}`,
        jsExample: `const users = await client.users.list();`,
      },
      {
        method: "POST",
        path: "/",
        summary: "Create a new user (admin+)",
        auth: "both",
        body: `{
  "username": "agent",
  "email": "agent@example.com",
  "password": "secret123",
  "name": "Agent",
  "role": "member"
}`,
        jsExample: `const user = await client.users.create({
  username: "agent",
  email: "agent@example.com",
  password: "secret123",
  name: "Agent",
  role: "member"
});`,
      },
      {
        method: "GET",
        path: "/:id",
        summary: "Get user by ID",
        auth: "both",
        notes: "Members can only view themselves.",
        jsExample: `const user = await client.users.get("usr_xxx");`,
      },
      {
        method: "PATCH",
        path: "/:id",
        summary: "Update user",
        auth: "both",
        body: `{ "name": "New Name", "role": "admin" }`,
        notes: "Members can only edit themselves. Only admin+ can change roles.",
        jsExample: `await client.users.update("usr_xxx", {
  name: "New Name"
});`,
      },
      {
        method: "DELETE",
        path: "/:id",
        summary: "Delete user (admin+)",
        auth: "both",
        jsExample: `await client.users.delete("usr_xxx");`,
      },
      {
        method: "POST",
        path: "/:id/reset-password",
        summary: "Admin reset password for any user (no old password needed)",
        auth: "both",
        body: `{ "password": "newpassword123" }`,
        notes: "Admin/superadmin only. Does not require the old password.",
        jsExample: `await client.users.resetPassword("usr_xxx", "newpassword123");`,
      },
    ],
  },
  {
    id: "storage",
    label: "Object Storage",
    description: "Object storage with buckets, file upload/download, presigned URLs, and access keys.",
    basePrefix: "/api/storage",
    endpoints: [
      {
        method: "GET",
        path: "/",
        summary: "List all buckets with stats",
        auth: "both",
        response: `{
  "items": [{
    "id": "bkt_xxx",
    "name": "my-bucket",
    "isPublic": false,
    "objectCount": 42,
    "totalSize": 1048576,
    "createdAt": 1714000000
  }],
  "meta": { "total": 1 }
}`,
        jsExample: `const result = await client.storage.listBuckets();
result.items.forEach(b => console.log(b.name, b.objectCount));`,
      },
      {
        method: "GET",
        path: "/stats",
        summary: "Get storage statistics",
        auth: "both",
        response: `{ "bucketCount": 3, "objectCount": 150, "totalSize": 52428800 }`,
        jsExample: `const stats = await client.storage.stats();
console.log(stats.totalSize);`,
      },
      {
        method: "POST",
        path: "/buckets",
        summary: "Create a new bucket",
        auth: "both",
        body: `{ "name": "my-bucket", "isPublic": false }`,
        notes: "Bucket names: lowercase alphanumeric + hyphens, 3-63 chars (S3 naming rules).",
        jsExample: `const bucket = await client.storage.createBucket({
  name: "my-bucket",
  isPublic: false
});`,
      },
      {
        method: "PATCH",
        path: "/buckets/:name",
        summary: "Update bucket (toggle public/private)",
        auth: "both",
        body: `{ "isPublic": true }`,
        jsExample: `await client.storage.updateBucket("my-bucket", { isPublic: true });`,
      },
      {
        method: "DELETE",
        path: "/buckets/:name",
        summary: "Delete a bucket",
        auth: "both",
        queryParams: "force (boolean) — delete even if bucket has objects",
        jsExample: `await client.storage.deleteBucket("my-bucket", true);`,
      },
      {
        method: "GET",
        path: "/buckets/:name/objects",
        summary: "List objects in a bucket",
        auth: "both",
        queryParams: "prefix, delimiter, page, limit, search",
        jsExample: `const result = await client.storage.listObjects("my-bucket", {
  prefix: "images/",
  delimiter: "/",
  page: 1,
  limit: 100
});`,
      },
      {
        method: "POST",
        path: "/buckets/:name/upload",
        summary: "Upload file (multipart/form-data)",
        auth: "both",
        notes: "Send as multipart: key (string field) + file (file field). Max 100MB default.",
        jsExample: `const file = new File(["content"], "hello.txt", { type: "text/plain" });
const result = await client.storage.upload("my-bucket", "path/to/hello.txt", file);
console.log(result.etag);`,
      },
      {
        method: "DELETE",
        path: "/buckets/:name/objects/:key",
        summary: "Delete a single object",
        auth: "both",
        jsExample: `await client.storage.deleteObject("my-bucket", "path/to/file.txt");`,
      },
      {
        method: "POST",
        path: "/buckets/:name/presign/:key",
        summary: "Generate a presigned URL for temporary access",
        auth: "both",
        body: `{ "expiresIn": 3600 }`,
        notes: "expiresIn: 1 to 604800 seconds (max 7 days). Default: 3600 (1 hour).",
        jsExample: `const result = await client.storage.presignUrl("my-bucket", "secret.pdf", 3600);
console.log(result.url, result.expiresAt);`,
      },
      {
        method: "GET",
        path: "/access-keys",
        summary: "List all storage access keys",
        auth: "both",
        jsExample: `const result = await client.storage.listAccessKeys();
result.items.forEach(k => console.log(k.accessKey, k.label));`,
      },
      {
        method: "POST",
        path: "/access-keys",
        summary: "Create a new access key pair",
        auth: "both",
        body: `{ "label": "My App" }`,
        notes: "⚠️ The secret key is shown only once. Copy it immediately.",
        jsExample: `const key = await client.storage.createAccessKey({ label: "My App" });
console.log(key.accessKey, key.secretKey); // save secretKey!`,
      },
      {
        method: "DELETE",
        path: "/access-keys/:id",
        summary: "Delete an access key",
        auth: "both",
        jsExample: `await client.storage.deleteAccessKey("sak_xxx");`,
      },
    ],
  },
  {
    id: "s3-api",
    label: "S3-compatible API",
    description: "S3-compatible endpoint at /s3 on the same server. Create access keys from the Object Storage UI, then use with aws-sdk, minio-js, mc CLI, or rclone.",
    basePrefix: "/s3",
    endpoints: [
      {
        method: "GET",
        path: "/",
        summary: "ListBuckets — list all buckets",
        auth: "none",
        notes: "Auth via AWS Signature V4 (Authorization header). Create access keys from the Object Storage → Access Keys tab.",
        response: `<?xml version="1.0"?>
<ListAllMyBucketsResult>
  <Buckets>
    <Bucket>
      <Name>my-bucket</Name>
      <CreationDate>2026-01-01T00:00:00Z</CreationDate>
    </Bucket>
  </Buckets>
</ListAllMyBucketsResult>`,
        jsExample: `import { S3Client, ListBucketsCommand } from "@aws-sdk/client-s3";

const s3 = new S3Client({
  endpoint: "{{BASE_URL}}/s3",
  forcePathStyle: true,
  region: "us-east-1",
  credentials: {
    accessKeyId: "YOUR_ACCESS_KEY",
    secretAccessKey: "YOUR_SECRET_KEY",
  },
});

const { Buckets } = await s3.send(new ListBucketsCommand({}));
console.log(Buckets);`,
      },
      {
        method: "PUT",
        path: "/:bucket",
        summary: "CreateBucket",
        auth: "none",
        jsExample: `import { CreateBucketCommand } from "@aws-sdk/client-s3";

await s3.send(new CreateBucketCommand({ Bucket: "my-new-bucket" }));`,
      },
      {
        method: "PUT",
        path: "/:bucket/:key",
        summary: "PutObject — upload a file",
        auth: "none",
        jsExample: `import { PutObjectCommand } from "@aws-sdk/client-s3";

await s3.send(new PutObjectCommand({
  Bucket: "my-bucket",
  Key: "path/to/file.txt",
  Body: "hello world",
  ContentType: "text/plain",
}));`,
      },
      {
        method: "GET",
        path: "/:bucket/:key",
        summary: "GetObject — download a file",
        auth: "none",
        jsExample: `import { GetObjectCommand } from "@aws-sdk/client-s3";

const { Body } = await s3.send(new GetObjectCommand({
  Bucket: "my-bucket",
  Key: "path/to/file.txt",
}));

const text = await Body.transformToString();
console.log(text);`,
      },
      {
        method: "DELETE",
        path: "/:bucket/:key",
        summary: "DeleteObject",
        auth: "none",
        jsExample: `import { DeleteObjectCommand } from "@aws-sdk/client-s3";

await s3.send(new DeleteObjectCommand({
  Bucket: "my-bucket",
  Key: "path/to/file.txt",
}));`,
      },
      {
        method: "GET",
        path: "/:bucket?list-type=2",
        summary: "ListObjectsV2 — list objects with prefix/delimiter",
        auth: "none",
        jsExample: `import { ListObjectsV2Command } from "@aws-sdk/client-s3";

const result = await s3.send(new ListObjectsV2Command({
  Bucket: "my-bucket",
  Prefix: "images/",
  Delimiter: "/",
  MaxKeys: 100,
}));

console.log(result.Contents);
console.log(result.CommonPrefixes);`,
      },
    ],
  },
  {
    id: "mcp-tool-servers",
    label: "MCP Tool Servers",
    description: "Manage the built-in MCP server (Agent Hands). Custom servers coming soon.",
    basePrefix: "/api/mcp-tool-servers",
    endpoints: [
      {
        method: "GET",
        path: "/",
        summary: "List all MCP tool servers",
        auth: "both",
        response: `{
  "items": [{
    "id": "mts_system",
    "name": "Agent Hands",
    "type": "builtin",
    "isActive": 1,
    "toolCount": 0
  }],
  "meta": { "total": 1 }
}`,
        jsExample: `const servers = await client.mcpToolServers.list();
servers.forEach(s => console.log(s.name, s.type, s.toolCount));`,
      },
      {
        method: "POST",
        path: "/",
        summary: "Create a new custom MCP server",
        auth: "both",
        body: `{
  "name": "weather-tools",
  "description": "Weather-related tools"
}`,
        jsExample: `const server = await client.mcpToolServers.create({
  name: "weather-tools",
  description: "Weather-related tools"
});`,
      },
      {
        method: "GET",
        path: "/:id",
        summary: "Get MCP server by ID",
        auth: "both",
        jsExample: `const server = await client.mcpToolServers.get("mts_xxx");`,
      },
      {
        method: "PATCH",
        path: "/:id",
        summary: "Update MCP server",
        auth: "both",
        body: `{ "name": "updated-name", "description": "new desc" }`,
        notes: "Cannot rename the built-in 'System Tools' server.",
        jsExample: `await client.mcpToolServers.update("mts_xxx", { name: "updated" });`,
      },
      {
        method: "DELETE",
        path: "/:id",
        summary: "Delete MCP server (cascade deletes all tools)",
        auth: "both",
        notes: "Cannot delete the built-in server.",
        jsExample: `await client.mcpToolServers.delete("mts_xxx");`,
      },
      {
        method: "GET",
        path: "/:id/tools",
        summary: "List tools in a server",
        auth: "both",
        queryParams: "page, limit",
        jsExample: `const result = await client.mcpToolServers.listTools("mts_xxx");
result.items.forEach(t => console.log(t.name));`,
      },
      {
        method: "POST",
        path: "/:id/tools",
        summary: "Create a new tool (Python code)",
        auth: "both",
        body: `{
  "name": "get_weather",
  "description": "Get current weather for a city",
  "inputSchema": "{\\"type\\":\\"object\\",\\"properties\\":{\\"city\\":{\\"type\\":\\"string\\"}}}",
  "code": "def execute(params, context):\\n    return {\\"temp\\": 25}"
}`,
        notes: "Tool name must be snake_case. Code runs in a Python sandbox.",
        jsExample: `const tool = await client.mcpToolServers.createTool("mts_xxx", {
  name: "get_weather",
  description: "Get weather for a city",
  code: "def execute(params, context):\\n    return {'temp': 25}"
});`,
      },
      {
        method: "PATCH",
        path: "/:id/tools/:toolId",
        summary: "Update a tool",
        auth: "both",
        body: `{ "description": "Updated", "code": "..." }`,
        jsExample: `await client.mcpToolServers.updateTool("mts_xxx", "mtl_xxx", {
  description: "Updated description"
});`,
      },
      {
        method: "DELETE",
        path: "/:id/tools/:toolId",
        summary: "Delete a tool",
        auth: "both",
        jsExample: `await client.mcpToolServers.deleteTool("mts_xxx", "mtl_xxx");`,
      },
      {
        method: "POST",
        path: "/:id/tools/:toolId/test",
        summary: "Test execute a tool",
        auth: "both",
        body: `{ "params": { "city": "Tokyo" } }`,
        jsExample: `const result = await client.mcpToolServers.testTool("mts_xxx", "mtl_xxx", {
  city: "Tokyo"
});
console.log(result.success, result.result);`,
      },
    ],
  },
  {
    id: "dynamic-apis",
    label: "Dynamic APIs",
    description: "Create and manage HTTP API endpoints at runtime. Endpoints execute JS/TS code on Bun runtime.",
    basePrefix: "/api/dynamic-apis",
    endpoints: [
      {
        method: "GET",
        path: "/",
        summary: "List all dynamic API endpoints",
        auth: "both",
        queryParams: "search, method (GET|POST|PUT|PATCH|DELETE), status (active|inactive), page, limit",
        response: `{
  "items": [{
    "id": "dap_xxx",
    "name": "Get Users",
    "method": "GET",
    "path": "/users",
    "isActive": true
  }],
  "meta": { "total": 1, "page": 1, "limit": 50, "hasMore": false }
}`,
        jsExample: `const result = await client.dynamicApis.list({ search: "user" });
result.items.forEach(api => console.log(api.method, api.path));`,
      },
      {
        method: "POST",
        path: "/",
        summary: "Create a new dynamic API endpoint",
        auth: "both",
        body: `{
  "name": "Get Users",
  "method": "GET",
  "path": "/users",
  "code": "async function handler(request, context) {\\n  return { status: 200, body: { users: [] } };\\n}",
  "dependencies": { "lodash": "^4.17.21" }
}`,
        notes: "When dependencies is set with npm packages, the handler runs in isolated mode (Bun subprocess with per-endpoint node_modules).",
        jsExample: `const api = await client.dynamicApis.create({
  name: "Get Users",
  method: "GET",
  path: "/users",
  dependencies: { "lodash": "^4.17.21" }
});`,
      },
      {
        method: "GET",
        path: "/:id",
        summary: "Get dynamic API by ID",
        auth: "both",
        jsExample: `const api = await client.dynamicApis.get("dap_xxx");`,
      },
      {
        method: "PATCH",
        path: "/:id",
        summary: "Update dynamic API (code, draftCode, config, dependencies, toggle active)",
        auth: "both",
        body: `{ "code": "...", "draftCode": "...", "dependencies": { "axios": "^1.7.0" }, "isActive": false }`,
        notes: `Set dependencies to null to switch back to fast mode (in-process execution).
\`code\` is the live/production handler code. \`draftCode\` is a staging area for code being developed or tested.
Use the Draft Code Workflow: save draftCode → dry-run test → iterate → promote to code.`,
        jsExample: `// Update live code
await client.dynamicApis.update("dap_xxx", {
  code: "export default async function handler(req, ctx) { ... }",
  draftCode: "export default async function handler(req, ctx) { ... }"
});

// Save draft only (does not affect live endpoint)
await client.dynamicApis.update("dap_xxx", {
  draftCode: "export default async function handler(req, ctx) { ... }"
});

// Discard draft
await client.dynamicApis.update("dap_xxx", { draftCode: null });`,
      },
      {
        method: "DELETE",
        path: "/:id",
        summary: "Delete dynamic API endpoint",
        auth: "both",
        jsExample: `await client.dynamicApis.delete("dap_xxx");`,
      },
      {
        method: "GET",
        path: "/:id/logs",
        summary: "List execution logs for an endpoint",
        auth: "both",
        queryParams: "status (success|error), startDate (epoch ms), endDate (epoch ms), page, limit",
        jsExample: `const logs = await client.dynamicApis.listLogs("dap_xxx", {
  status: "error",
  startDate: Date.now() - 86400_000, // last 24 hours
  endDate: Date.now()
});`,
      },
      {
        method: "POST",
        path: "/:id/test",
        summary: "Dry-run test — execute draft or production code from DB",
        auth: "both",
        body: `{
  "source": "draft",
  "params": { "id": "123" },
  "query": { "page": "1" },
  "headers": {},
  "body": null,
  "timeout": 30000
}`,
        response: `{
  "status": 200,
  "headers": {},
  "body": { "ok": true },
  "consoleLogs": ["Hello from handler!"],
  "executionTimeMs": 12,
  "executionMode": "fast",
  "error": null
}`,
        notes: `\`source\`: \`"draft"\` (default) runs \`draftCode\` from DB, falls back to \`code\`. \`"prod"\` runs the live \`code\`.
Method and path are read from the DB record. \`params\`, \`query\`, \`headers\`, \`body\` simulate the incoming request.
Typical workflow: save draftCode via PATCH → test via POST /test → iterate → promote to live code.`,
        jsExample: `// Step 1: Save draft code
await fetch("{{BASE_URL}}/api/dynamic-apis/dap_xxx", {
  method: "PATCH",
  headers: { "Content-Type": "application/json", "X-API-Key": "YOUR_API_KEY" },
  body: JSON.stringify({
    draftCode: 'export default async function handler(req, ctx) { return { status: 200, body: { time: Date.now() } }; }'
  })
});

// Step 2: Test the draft
const result = await fetch("{{BASE_URL}}/api/dynamic-apis/dap_xxx/test", {
  method: "POST",
  headers: { "Content-Type": "application/json", "X-API-Key": "YOUR_API_KEY" },
  body: JSON.stringify({ source: "draft", params: {}, query: {} })
});
const data = await result.json();
console.log(data.status, data.body, data.executionTimeMs);`,
      },
    ],
  },
  {
    id: "dynamic-api-runtime",
    label: "Dynamic API Runtime",
    description: "Call your dynamic endpoints. All requests to /apis/* are routed to the matching handler.",
    basePrefix: "/apis",
    endpoints: [
      {
        method: "GET",
        path: "/*",
        summary: "Call a dynamic GET endpoint",
        auth: "none",
        notes: "Auth depends on endpoint config (isPublic). Path params extracted automatically (e.g. /users/:id).",
        jsExample: `// If you created GET /users/:id
const res = await fetch("{{BASE_URL}}/apis/users/123");
const data = await res.json();`,
      },
      {
        method: "POST",
        path: "/*",
        summary: "Call a dynamic POST endpoint",
        auth: "none",
        jsExample: `const res = await fetch("{{BASE_URL}}/apis/orders", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ item: "Widget", qty: 5 })
});`,
      },
    ],
  },
  {
    id: "llm-providers",
    label: "LLM Providers",
    description: "Manage LLM provider configurations (API keys, base URLs, cached model lists).",
    basePrefix: "/api/llm-providers",
    endpoints: [
      {
        method: "GET",
        path: "/",
        summary: "List all LLM providers (API keys are masked)",
        auth: "both",
        response: `{
  "items": [{
    "id": "llm_xxx",
    "name": "My OpenAI",
    "providerType": "openai",
    "apiKey": "••••••••abcd",
    "baseUrl": null,
    "models": [{ "id": "gpt-4o", "name": "gpt-4o" }],
    "createdAt": 1714000000,
    "updatedAt": 1714000000
  }],
  "meta": { "total": 1 }
}`,
        jsExample: `const providers = await client.llmProviders.list();
providers.forEach(p => console.log(p.name, p.models.length));`,
      },
      {
        method: "POST",
        path: "/",
        summary: "Create a new LLM provider — fetches models on save",
        auth: "both",
        body: `{
  "name": "My OpenAI",
  "providerType": "openai",
  "apiKey": "sk-...",
  "baseUrl": ""
}`,
        notes: "The server will attempt to fetch models from the provider. If the fetch fails (invalid key, unreachable), the request returns 400.",
        jsExample: `const provider = await client.llmProviders.create({
  name: "My OpenAI",
  providerType: "openai",
  apiKey: "sk-..."
});
console.log(provider.models.length); // cached models`,
      },
      {
        method: "GET",
        path: "/:id",
        summary: "Get a single provider by ID",
        auth: "both",
        jsExample: `const provider = await client.llmProviders.get("llm_xxx");`,
      },
      {
        method: "PUT",
        path: "/:id",
        summary: "Update provider — re-fetches models if key or URL changed",
        auth: "both",
        body: `{ "name": "Updated Name", "apiKey": "sk-new..." }`,
        notes: "If apiKey or baseUrl changes, models are re-fetched. If re-fetch fails, returns 400 and no update is applied.",
        jsExample: `const updated = await client.llmProviders.update("llm_xxx", {
  name: "Updated Name",
  apiKey: "sk-new..."
});`,
      },
      {
        method: "DELETE",
        path: "/:id",
        summary: "Delete an LLM provider",
        auth: "both",
        jsExample: `await client.llmProviders.delete("llm_xxx");`,
      },
      {
        method: "POST",
        path: "/:id/refresh-models",
        summary: "Re-fetch models from the provider using stored credentials",
        auth: "both",
        notes: "Uses the stored API key and base URL to fetch the latest model list. On failure, the existing models are preserved.",
        jsExample: `const refreshed = await client.llmProviders.refreshModels("llm_xxx");
console.log(refreshed.models.length);`,
      },
    ],
  },
];

/** Return full API docs data */
export function getApiDocs(): ApiDocsResponse {
  return {
    introSections: INTRO_SECTIONS,
    apiSections: API_SECTIONS,
  };
}
