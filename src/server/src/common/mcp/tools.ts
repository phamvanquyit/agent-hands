/**
 * Register built-in system tools on the MCP server.
 *
 * These tools allow AI agents to interact with the Moro LLM Toolkit's
 * core resources: Variables, Tables, Documents, and Storage.
 */

import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

// ── Variable Tools ──────────────────────────────────────────────────────────

export function registerVariableTools(server: McpServer) {
  server.tool(
    "variables_list",
    "List all variables in a namespace (project). Returns key, value, type, ttl info.",
    {
      namespaceId: z.string().describe("Variable namespace (project) ID"),
      search: z.string().optional().describe("Optional search filter on key name"),
      page: z.number().optional().default(1),
      limit: z.number().optional().default(50),
    },
    async ({ namespaceId, search, page, limit }) => {
      const { listVariables } = await import(
        "../../modules/variables/variable/variable.service.js"
      );
      const result = await listVariables(namespaceId, { search, page, limit });
      return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
    },
  );

  server.tool(
    "variables_get",
    "Get a single variable by key from a namespace.",
    {
      namespaceId: z.string().describe("Variable namespace (project) ID"),
      key: z.string().describe("Variable key to retrieve"),
    },
    async ({ namespaceId, key }) => {
      const { getVariableByKey } = await import(
        "../../modules/variables/variable/variable.service.js"
      );
      const variable = await getVariableByKey(namespaceId, key);
      if (!variable) {
        return { content: [{ type: "text" as const, text: JSON.stringify({ error: "not_found", message: `Variable "${key}" not found` }) }], isError: true };
      }
      return { content: [{ type: "text" as const, text: JSON.stringify(variable, null, 2) }] };
    },
  );

  server.tool(
    "variables_set",
    "Create or update (upsert) a variable. Auto-detects type from value. Supports TTL.",
    {
      namespaceId: z.string().describe("Variable namespace (project) ID"),
      key: z.string().describe("Variable key"),
      value: z.string().describe("Variable value (string, number, boolean, or JSON string)"),
      description: z.string().optional().describe("Optional description"),
      ttl: z.number().optional().describe("Time-to-live in seconds. 0 = no expiry"),
      isSecret: z.boolean().optional().default(false).describe("Mark as secret (masked in UI)"),
    },
    async ({ namespaceId, key, value, description, ttl, isSecret }) => {
      const { getVariableByKey, createVariable, updateVariable } = await import(
        "../../modules/variables/variable/variable.service.js"
      );
      const existing = await getVariableByKey(namespaceId, key);
      if (existing) {
        const updated = await updateVariable(existing.id, { value, description, ttl, isSecret });
        return { content: [{ type: "text" as const, text: JSON.stringify({ action: "updated", variable: updated }, null, 2) }] };
      }
      const created = await createVariable(namespaceId, { key, value, description: description ?? "", ttl, isSecret });
      return { content: [{ type: "text" as const, text: JSON.stringify({ action: "created", variable: created }, null, 2) }] };
    },
  );

  server.tool(
    "variables_delete",
    "Delete a variable by key from a namespace.",
    {
      namespaceId: z.string().describe("Variable namespace (project) ID"),
      key: z.string().describe("Variable key to delete"),
    },
    async ({ namespaceId, key }) => {
      const { getVariableByKey, deleteVariable } = await import(
        "../../modules/variables/variable/variable.service.js"
      );
      const variable = await getVariableByKey(namespaceId, key);
      if (!variable) {
        return { content: [{ type: "text" as const, text: JSON.stringify({ error: "not_found", message: `Variable "${key}" not found` }) }], isError: true };
      }
      await deleteVariable(variable.id);
      return { content: [{ type: "text" as const, text: JSON.stringify({ deleted: true, key }) }] };
    },
  );

  server.tool(
    "variable_namespaces_list",
    "List all variable namespaces (projects).",
    {},
    async () => {
      const { listVariableNamespaces } = await import(
        "../../modules/variables/variable-namespace/variable-namespace.service.js"
      );
      const ns = await listVariableNamespaces();
      return { content: [{ type: "text" as const, text: JSON.stringify(ns, null, 2) }] };
    },
  );

  server.tool(
    "variable_namespaces_create",
    "Create a new variable namespace (project) to organize variables.",
    {
      name: z.string().min(1).max(255).describe("Namespace name"),
      description: z.string().max(1000).optional().describe("Optional description"),
      icon: z.string().max(64).optional().describe("Optional icon emoji or identifier"),
    },
    async ({ name, description, icon }) => {
      const { createVariableNamespace } = await import(
        "../../modules/variables/variable-namespace/variable-namespace.service.js"
      );
      const ns = await createVariableNamespace({ name, description, icon }, "usr_mcp_system");
      return { content: [{ type: "text" as const, text: JSON.stringify(ns, null, 2) }] };
    },
  );

  server.tool(
    "variable_namespaces_update",
    "Update name, description, or icon of an existing variable namespace.",
    {
      namespaceId: z.string().describe("Namespace ID to update"),
      name: z.string().min(1).max(255).optional().describe("New name"),
      description: z.string().max(1000).optional().nullable().describe("New description (null to clear)"),
      icon: z.string().max(64).optional().nullable().describe("New icon (null to clear)"),
    },
    async ({ namespaceId, name, description, icon }) => {
      const { getVariableNamespaceById, updateVariableNamespace } = await import(
        "../../modules/variables/variable-namespace/variable-namespace.service.js"
      );
      const existing = await getVariableNamespaceById(namespaceId);
      if (!existing) {
        return { content: [{ type: "text" as const, text: JSON.stringify({ error: "not_found", message: `Namespace "${namespaceId}" not found` }) }], isError: true };
      }
      const updated = await updateVariableNamespace(namespaceId, { name, description, icon });
      return { content: [{ type: "text" as const, text: JSON.stringify(updated, null, 2) }] };
    },
  );

  server.tool(
    "variable_namespaces_delete",
    "Delete a variable namespace and all variables within it.",
    {
      namespaceId: z.string().describe("Namespace ID to delete"),
    },
    async ({ namespaceId }) => {
      const { getVariableNamespaceById, deleteVariableNamespace } = await import(
        "../../modules/variables/variable-namespace/variable-namespace.service.js"
      );
      const existing = await getVariableNamespaceById(namespaceId);
      if (!existing) {
        return { content: [{ type: "text" as const, text: JSON.stringify({ error: "not_found", message: `Namespace "${namespaceId}" not found` }) }], isError: true };
      }
      await deleteVariableNamespace(namespaceId);
      return { content: [{ type: "text" as const, text: JSON.stringify({ deleted: true, namespaceId }) }] };
    },
  );
}

// ── Database / Table Tools ──────────────────────────────────────────────────

export function registerTableTools(server: McpServer) {
  server.tool(
    "databases_list",
    "List all databases.",
    {},
    async () => {
      const { listDatabases } = await import(
        "../../modules/databases/database.service.js"
      );
      const result = await listDatabases();
      return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
    },
  );

  server.tool(
    "tables_list",
    "List all tables in a database, including column definitions.",
    {
      databaseId: z.string().describe("Database ID"),
    },
    async ({ databaseId }) => {
      const { listTables } = await import(
        "../../modules/databases/table.service.js"
      );
      const result = await listTables(databaseId);
      return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
    },
  );

  server.tool(
    "tables_query",
    "Query rows from a table with optional filters, sorting, and pagination.",
    {
      tableId: z.string().describe("Table ID"),
      page: z.number().optional().default(1),
      limit: z.number().optional().default(50),
      sortBy: z.string().optional().describe("Column ID to sort by"),
      sortDir: z.enum(["asc", "desc"]).optional().default("desc"),
      search: z.string().optional().describe("Full-text search across all columns"),
    },
    async ({ tableId, page, limit, sortBy, sortDir, search }) => {
      const { listRows } = await import(
        "../../modules/databases/table.service.js"
      );
      const result = await listRows(tableId, { page, limit, sortBy, sortDir, search });
      return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
    },
  );

  server.tool(
    "tables_insert",
    "Insert a new row into a table. Data should be an object with column IDs as keys.",
    {
      tableId: z.string().describe("Table ID"),
      data: z.record(z.unknown()).describe("Row data object: { columnId: value, ... }"),
    },
    async ({ tableId, data }) => {
      const { createRow } = await import(
        "../../modules/databases/table.service.js"
      );
      const row = await createRow(tableId, data);
      return { content: [{ type: "text" as const, text: JSON.stringify(row, null, 2) }] };
    },
  );

  server.tool(
    "tables_update",
    "Update an existing row in a table.",
    {
      tableId: z.string().describe("Table ID"),
      rowId: z.string().describe("Row ID to update"),
      data: z.record(z.unknown()).describe("Partial row data to update: { columnId: newValue }"),
    },
    async ({ tableId, rowId, data }) => {
      const { updateRow } = await import(
        "../../modules/databases/table.service.js"
      );
      const row = await updateRow(tableId, rowId, data);
      return { content: [{ type: "text" as const, text: JSON.stringify(row, null, 2) }] };
    },
  );

  server.tool(
    "tables_delete",
    "Delete a row from a table by row ID.",
    {
      tableId: z.string().describe("Table ID"),
      rowId: z.string().describe("Row ID to delete"),
    },
    async ({ tableId, rowId }) => {
      const { deleteRow } = await import(
        "../../modules/databases/table.service.js"
      );
      await deleteRow(tableId, rowId);
      return { content: [{ type: "text" as const, text: JSON.stringify({ deleted: true, rowId }) }] };
    },
  );
}

// ── Document Tools ──────────────────────────────────────────────────────────

export function registerDocumentTools(server: McpServer) {
  server.tool(
    "projects_list",
    "List all document projects.",
    {},
    async () => {
      const { listProjects } = await import(
        "../../modules/documents/project.service.js"
      );
      const result = await listProjects();
      return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
    },
  );

  server.tool(
    "documents_list",
    "List all documents in a project.",
    {
      projectId: z.string().describe("Project ID"),
    },
    async ({ projectId }) => {
      const { listDocuments } = await import(
        "../../modules/documents/document.service.js"
      );
      const result = await listDocuments(projectId);
      return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
    },
  );

  server.tool(
    "documents_get",
    "Get a document by ID, including its full content.",
    {
      projectId: z.string().describe("Project ID"),
      documentId: z.string().describe("Document ID"),
    },
    async ({ projectId, documentId }) => {
      const { getDocumentById } = await import(
        "../../modules/documents/document.service.js"
      );
      const doc = await getDocumentById(projectId, documentId);
      if (!doc) {
        return { content: [{ type: "text" as const, text: JSON.stringify({ error: "not_found", message: "Document not found" }) }], isError: true };
      }
      return { content: [{ type: "text" as const, text: JSON.stringify(doc, null, 2) }] };
    },
  );

  server.tool(
    "documents_create",
    "Create a new document in a project.",
    {
      projectId: z.string().describe("Project ID"),
      title: z.string().describe("Document title"),
      content: z.string().optional().default("").describe("Document content (markdown supported)"),
      contentType: z.enum(["markdown", "text", "html"]).optional().default("markdown"),
    },
    async ({ projectId, title, content, contentType }) => {
      const { createDocument } = await import(
        "../../modules/documents/document.service.js"
      );
      const doc = await createDocument(projectId, { title, content, contentType }, "usr_mcp_system");
      return { content: [{ type: "text" as const, text: JSON.stringify(doc, null, 2) }] };
    },
  );

  server.tool(
    "documents_update",
    "Update an existing document's title or content.",
    {
      projectId: z.string().describe("Project ID"),
      documentId: z.string().describe("Document ID"),
      title: z.string().optional().describe("New title"),
      content: z.string().optional().describe("New content"),
    },
    async ({ projectId, documentId, title, content }) => {
      const { updateDocument } = await import(
        "../../modules/documents/document.service.js"
      );
      const doc = await updateDocument(projectId, documentId, { title, content });
      return { content: [{ type: "text" as const, text: JSON.stringify(doc, null, 2) }] };
    },
  );
}

// ── Storage Tools ───────────────────────────────────────────────────────────

export function registerStorageTools(server: McpServer) {
  server.tool(
    "storage_list_buckets",
    "List all storage buckets.",
    {},
    async () => {
      const { listBuckets } = await import(
        "../../modules/storage/storage.service.js"
      );
      const result = await listBuckets();
      return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
    },
  );

  server.tool(
    "storage_list_objects",
    "List objects (files) in a storage bucket.",
    {
      bucketName: z.string().describe("Bucket name"),
      prefix: z.string().optional().describe("Key prefix filter"),
      page: z.number().optional().default(1),
      limit: z.number().optional().default(100),
    },
    async ({ bucketName, prefix, page, limit }) => {
      const { listObjects } = await import(
        "../../modules/storage/storage.service.js"
      );
      const result = await listObjects(bucketName, { prefix, page, limit });
      return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
    },
  );

  server.tool(
    "storage_get_object_info",
    "Get metadata for a specific object in a bucket (size, type, public status, URLs).",
    {
      bucketName: z.string().describe("Bucket name"),
      key: z.string().describe("Object key (file path)"),
    },
    async ({ bucketName, key }) => {
      const { getObjectMeta } = await import(
        "../../modules/storage/storage.service.js"
      );
      const meta = await getObjectMeta(bucketName, key);
      if (!meta) {
        return { content: [{ type: "text" as const, text: JSON.stringify({ error: "not_found", message: `Object "${key}" not found in bucket "${bucketName}"` }) }], isError: true };
      }
      return { content: [{ type: "text" as const, text: JSON.stringify(meta, null, 2) }] };
    },
  );

  server.tool(
    "storage_get_download_url",
    "Generate a pre-signed download URL for a file in storage. URL expires after the specified duration.",
    {
      bucketName: z.string().describe("Bucket name"),
      key: z.string().describe("Object key (file path)"),
      expiresInSeconds: z.number().optional().default(3600).describe("URL expiry in seconds (default: 1 hour)"),
    },
    async ({ bucketName, key, expiresInSeconds }) => {
      const { createPresignedUrl } = await import(
        "../../modules/storage/storage.service.js"
      );
      const url = await createPresignedUrl(bucketName, key, expiresInSeconds);
      return { content: [{ type: "text" as const, text: JSON.stringify({ url, expiresInSeconds }, null, 2) }] };
    },
  );

  server.tool(
    "storage_delete_object",
    "Delete an object (file) from a storage bucket.",
    {
      bucketName: z.string().describe("Bucket name"),
      key: z.string().describe("Object key to delete"),
    },
    async ({ bucketName, key }) => {
      const { deleteObject } = await import(
        "../../modules/storage/storage.service.js"
      );
      await deleteObject(bucketName, key);
      return { content: [{ type: "text" as const, text: JSON.stringify({ deleted: true, key }) }] };
    },
  );
}

// ── Register All ────────────────────────────────────────────────────────────

export function registerAllSystemTools(server: McpServer) {
  registerVariableTools(server);
  registerTableTools(server);
  registerDocumentTools(server);
  registerStorageTools(server);
}
