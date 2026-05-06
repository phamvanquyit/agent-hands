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
        jsExample: `const { MoroClient } = require("moro-llm-toolkit-client");

const client = new MoroClient({
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
    id: "variables",
    label: "Variables",
    description: "Key-value store with TTL, scoped under variable namespaces.",
    basePrefix: "/api/variable-namespaces/:namespaceId/variables",
    endpoints: [
      {
        method: "GET",
        path: "/",
        summary: "List variables (paginated, filterable)",
        auth: "both",
        queryParams: "namespace, search, sort (key|type|updated_at|ttl), order (asc|desc), page, limit",
        response: `{
  "items": [...],
  "meta": {
    "total": 42,
    "page": 1,
    "limit": 20,
    "hasMore": true
  }
}`,
        jsExample: `const result = await client.variables.list("vns_xxx", {
  namespace: "config",
  search: "api",
  page: 1,
  limit: 20
});

console.log(result.items);   // Variable[]
console.log(result.meta);    // { total, page, limit, hasMore }`,
      },
      {
        method: "GET",
        path: "/namespaces",
        summary: "List all namespaces with counts",
        auth: "both",
        response: `{
  "items": [
    { "namespace": "default", "count": 15 },
    { "namespace": "cache", "count": 8 }
  ],
  "meta": { "total": 2 }
}`,
        jsExample: `const ns = await client.variables.listNamespaces("prj_xxx");
ns.forEach(n => console.log(n.namespace, n.count));`,
      },
      {
        method: "GET",
        path: "/by-key/:key",
        summary: "Get variable by key (query: namespace)",
        auth: "both",
        queryParams: "namespace (default: 'default')",
        response: `{
  "id": "var_xxx",
  "projectId": "vns_xxx",
  "key": "api_url",
  "value": "https://...",
  "type": "string",
  "namespace": "default"
}`,
        jsExample: `const v = await client.variables.getByKey("vns_xxx", "api_url", "config");
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
  "namespace": "config",
  "ttl": 3600
}`,
        notes: "If a variable with the same key+namespace exists within the project, it will be updated (upsert).",
        jsExample: `const v = await client.variables.create("vns_xxx", {
  key: "api_url",
  value: "https://example.com",
  type: "string",
  namespace: "config",
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
        jsExample: `const vars = await client.variables.bulkCreate("vns_xxx", [
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
        jsExample: `const updated = await client.variables.update("vns_xxx", "var_xxx", {
  value: "new-value",
  ttl: 7200
});`,
      },
      {
        method: "DELETE",
        path: "/:id",
        summary: "Delete a single variable",
        auth: "both",
        jsExample: `await client.variables.delete("vns_xxx", "var_xxx");`,
      },
      {
        method: "DELETE",
        path: "/",
        summary: "Flush all variables in a namespace",
        auth: "both",
        notes: "Deletes ALL variables belonging to the namespace. Cannot flush global (null namespace).",
        jsExample: `const result = await client.variables.flushNamespace("vns_xxx");
console.log(result.deleted); // number of deleted variables`,
      },
    ],
  },
  {
    id: "databases",
    label: "Databases",
    description: "Group tables into logical databases for organization.",
    basePrefix: "/api/databases",
    endpoints: [
      {
        method: "GET",
        path: "/",
        summary: "List all databases",
        auth: "both",
        response: `{
  "items": [{
    "id": "dbs_xxx",
    "name": "CRM",
    "description": "Customer data",
    "tableCount": 5,
    "createdAt": 1714000000,
    "updatedAt": 1714000000
  }],
  "meta": { "total": 1 }
}`,
        jsExample: `const databases = await client.databases.list();
databases.forEach(db => console.log(db.name, db.tableCount));`,
      },
      {
        method: "POST",
        path: "/",
        summary: "Create a new database",
        auth: "both",
        body: `{
  "name": "CRM",
  "description": "Customer relationship management"
}`,
        jsExample: `const db = await client.databases.create({
  name: "CRM",
  description: "Customer relationship management"
});`,
      },
      {
        method: "GET",
        path: "/:id",
        summary: "Get database by ID",
        auth: "both",
        jsExample: `const db = await client.databases.get("dbs_xxx");
console.log(db.tableCount);`,
      },
      {
        method: "PATCH",
        path: "/:id",
        summary: "Update database metadata",
        auth: "both",
        body: `{ "name": "Updated Name" }`,
        jsExample: `await client.databases.update("dbs_xxx", {
  name: "Updated Name"
});`,
      },
      {
        method: "DELETE",
        path: "/:id",
        summary: "Delete database (tables are unlinked, not deleted)",
        auth: "both",
        jsExample: `await client.databases.delete("dbs_xxx");`,
      },
    ],
  },
  {
    id: "tables",
    label: "Tables (nested under Databases)",
    description: "Tables are nested under databases. All table operations require a database ID.",
    basePrefix: "/api/databases/:dbId/tables",
    endpoints: [
      {
        method: "GET",
        path: "/",
        summary: "List tables in a database",
        auth: "both",
        jsExample: `const tables = await client.tables.list("dbs_xxx");`,
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
        jsExample: `const table = await client.tables.create("dbs_xxx", {
  name: "Contacts",
  columns: [{ name: "Name", type: "text" }]
});`,
      },
      {
        method: "GET",
        path: "/:id",
        summary: "Get table details by ID",
        auth: "both",
        jsExample: `const table = await client.tables.get("dbs_xxx", "dtb_xxx");`,
      },
      {
        method: "PATCH",
        path: "/:id",
        summary: "Update table metadata",
        auth: "both",
        body: `{ "name": "Updated Name" }`,
        jsExample: `await client.tables.update("dbs_xxx", "dtb_xxx", { name: "Updated" });`,
      },
      {
        method: "DELETE",
        path: "/:id",
        summary: "Delete table and all rows",
        auth: "both",
        jsExample: `await client.tables.delete("dbs_xxx", "dtb_xxx");`,
      },
      {
        method: "POST",
        path: "/:id/columns",
        summary: "Add a new column",
        auth: "both",
        body: `{ "name": "Status", "type": "text" }`,
        jsExample: `await client.tables.addColumn("dbs_xxx", "dtb_xxx", { name: "Status", type: "text" });`,
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
const result = await client.tables.listRows("dbs_xxx", "dtb_xxx", { page: 1, limit: 50 });

// Filter by column NAME (LLM-friendly — no need to look up column IDs)
const filtered = await client.tables.listRows("dbs_xxx", "dtb_xxx", {
  filter: [
    { column: "Name", operator: "contains", value: "John" },
    { column: "Age", operator: "gt", value: 18 }
  ],
  filterLogic: "and"
});

// Sort by column name
const sorted = await client.tables.listRows("dbs_xxx", "dtb_xxx", {
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
        jsExample: `const row = await client.tables.createRow("dbs_xxx", "dtb_xxx", { data: { col_xxx: "John" } });`,
      },
      {
        method: "PATCH",
        path: "/:id/rows/:rowId",
        summary: "Update a row",
        auth: "both",
        body: `{ "data": { "col_xxx": "Updated" } }`,
        jsExample: `await client.tables.updateRow("dbs_xxx", "dtb_xxx", "dtr_yyy", { data: { col_xxx: "Updated" } });`,
      },
      {
        method: "DELETE",
        path: "/:id/rows/:rowId",
        summary: "Delete a row",
        auth: "both",
        jsExample: `await client.tables.deleteRow("dbs_xxx", "dtb_xxx", "dtr_yyy");`,
      },
      {
        method: "POST",
        path: "/:id/rows/bulk-delete",
        summary: "Bulk delete rows",
        auth: "both",
        body: `{ "rowIds": ["dtr_a", "dtr_b"] }`,
        jsExample: `await client.tables.bulkDeleteRows("dbs_xxx", "dtb_xxx", ["dtr_a", "dtr_b"]);`,
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
        jsExample: `const result = await client.tables.bulkUpdateRows("dbs_xxx", "dtb_xxx", [
  { rowId: "dtr_a", data: { col_xxx: "new value" } },
  { rowId: "dtr_b", data: { col_xxx: "other value" } }
]);
console.log(result.updated); // number of updated rows`,
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
    label: "Storage",
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
    description: "S3-compatible endpoint at /s3 on the same server. Create access keys from the Storage UI, then use with aws-sdk, minio-js, mc CLI, or rclone.",
    basePrefix: "/s3",
    endpoints: [
      {
        method: "GET",
        path: "/",
        summary: "ListBuckets — list all buckets",
        auth: "none",
        notes: "Auth via AWS Signature V4 (Authorization header). Create access keys from the Storage → Access Keys tab.",
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
    description: "Manage the built-in MCP server (Moro LLM Toolkit). Custom servers coming soon.",
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
    "name": "Moro LLM Toolkit",
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
];

/** Return full API docs data */
export function getApiDocs(): ApiDocsResponse {
  return {
    introSections: INTRO_SECTIONS,
    apiSections: API_SECTIONS,
  };
}
