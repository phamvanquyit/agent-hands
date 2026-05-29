/**
 * Migration registry — import all migration files and export them in order.
 *
 * To add a new migration:
 *   1. Create `NNNN_descriptive_name.ts` in this directory
 *   2. Import and add it to the `migrations` array below
 */
import m0001 from "./0001_initial_schema.js";
import m0002 from "./0002_mcp_servers.js";
import m0003 from "./0003_users_username.js";
import m0004 from "./0004_variables.js";
import m0005 from "./0005_dynamic_tables.js";
import m0006 from "./0006_documents_content.js";
import m0007 from "./0007_projects.js";
import m0008 from "./0008_storage.js";
import m0009 from "./0009_databases_v2.js";
import m0010 from "./0010_variables_project.js";
import m0011 from "./0011_variable_projects.js";
import m0012 from "./0012_mcp_tool_servers.js";
import m0013 from "./0013_mcp_tools.js";
import m0014 from "./0014_rename_builtin_server.js";
import m0015 from "./0015_dynamic_apis.js";
import m0016 from "./0016_dynamic_api_logs.js";
import m0017 from "./0017_llm_providers.js";
import m0018 from "./0018_configurations.js";
import m0019 from "./0019_mcp_tool_logs.js";
import m0020 from "./0020_remove_variable_namespaces.js";
import m0021 from "./0021_mcp_tools_draft_code.js";
import m0022 from "./0022_rebrand_agent_hands.js";
import m0023 from "./0023_dynamic_apis_draft_code.js";

import type { Migration } from "../migrate.js";

export const migrations: Migration[] = [
  m0001,
  m0002,
  m0003,
  m0004,
  m0005,
  m0006,
  m0007,
  m0008,
  m0009,
  m0010,
  m0011,
  m0012,
  m0013,
  m0014,
  m0015,
  m0016,
  m0017,
  m0018,
  m0019,
  m0020,
  m0021,
  m0022,
  m0023,
];

