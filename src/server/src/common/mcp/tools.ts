/**
 * Register all built-in system tools on the MCP server.
 *
 * Each tool is defined in its own file under ./tools/<category>/.
 * This file simply imports and calls each registration function.
 */

import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

// ── KV Store ───────────────────────────────────────────────────────────────────
import { registerKvList } from "./tools/kv/kv-list.js";
import { registerKvGet } from "./tools/kv/kv-get.js";
import { registerKvSet } from "./tools/kv/kv-set.js";
import { registerKvDelete } from "./tools/kv/kv-delete.js";

// ── DataTables ─────────────────────────────────────────────────────────────────
import { registerDatatablesListProjects } from "./tools/datatables/datatables-list-projects.js";
import { registerDatatablesCreateProject } from "./tools/datatables/datatables-create-project.js";
import { registerDatatablesListTables } from "./tools/datatables/datatables-list-tables.js";
import { registerDatatablesCreateTable } from "./tools/datatables/datatables-create-table.js";
import { registerDatatablesUpdateTable } from "./tools/datatables/datatables-update-table.js";
import { registerDatatablesQueryRows } from "./tools/datatables/datatables-query-rows.js";
import { registerDatatablesInsertRow } from "./tools/datatables/datatables-insert-row.js";
import { registerDatatablesUpdateRow } from "./tools/datatables/datatables-update-row.js";
import { registerDatatablesDeleteRow } from "./tools/datatables/datatables-delete-row.js";

// ── Object Storage ─────────────────────────────────────────────────────────────
import { registerStorageListBuckets } from "./tools/storage/storage-list-buckets.js";
import { registerStorageListObjects } from "./tools/storage/storage-list-objects.js";
import { registerStorageGetObjectInfo } from "./tools/storage/storage-get-object-info.js";
import { registerStorageGetDownloadUrl } from "./tools/storage/storage-get-download-url.js";
import { registerStorageUploadObject } from "./tools/storage/storage-upload-object.js";
import { registerStorageDeleteObject } from "./tools/storage/storage-delete-object.js";

// ── Browser Profiles ───────────────────────────────────────────────────────────
import { registerBrowserList } from "./tools/browser/browser-list.js";
import { registerBrowserCreate } from "./tools/browser/browser-create.js";
import { registerBrowserStart } from "./tools/browser/browser-start.js";
import { registerBrowserStop } from "./tools/browser/browser-stop.js";
import { registerBrowserDelete } from "./tools/browser/browser-delete.js";
import { registerBrowserListTabs } from "./tools/browser/browser-list-tabs.js";
import { registerBrowserRunSteps } from "./tools/browser/browser-run-steps.js";
import { registerBrowserQuickRun } from "./tools/browser/browser-quick-run.js";

// ── Dynamic APIs ─────────────────────────────────────────────────────────────
import { registerDynamicApiList } from "./tools/dynamic-apis/dynamic-api-list.js";
import { registerDynamicApiGet } from "./tools/dynamic-apis/dynamic-api-get.js";
import { registerDynamicApiCreate } from "./tools/dynamic-apis/dynamic-api-create.js";
import { registerDynamicApiUpdate } from "./tools/dynamic-apis/dynamic-api-update.js";
import { registerDynamicApiDelete } from "./tools/dynamic-apis/dynamic-api-delete.js";

// ── Register All ───────────────────────────────────────────────────────────────

export function registerAllSystemTools(server: McpServer) {
  // KV Store
  registerKvList(server);
  registerKvGet(server);
  registerKvSet(server);
  registerKvDelete(server);

  // DataTables
  registerDatatablesListProjects(server);
  registerDatatablesCreateProject(server);
  registerDatatablesListTables(server);
  registerDatatablesCreateTable(server);
  registerDatatablesUpdateTable(server);
  registerDatatablesQueryRows(server);
  registerDatatablesInsertRow(server);
  registerDatatablesUpdateRow(server);
  registerDatatablesDeleteRow(server);

  // Object Storage
  registerStorageListBuckets(server);
  registerStorageListObjects(server);
  registerStorageGetObjectInfo(server);
  registerStorageGetDownloadUrl(server);
  registerStorageUploadObject(server);
  registerStorageDeleteObject(server);

  // Browser Profiles
  registerBrowserList(server);
  registerBrowserCreate(server);
  registerBrowserStart(server);
  registerBrowserStop(server);
  registerBrowserDelete(server);
  registerBrowserListTabs(server);
  registerBrowserRunSteps(server);
  registerBrowserQuickRun(server);

  // Dynamic APIs
  registerDynamicApiList(server);
  registerDynamicApiGet(server);
  registerDynamicApiCreate(server);
  registerDynamicApiUpdate(server);
  registerDynamicApiDelete(server);
}
