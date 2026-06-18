import type { Migration } from "../migrate.js";

const migration: Migration = {
  name: "0025_mcp_server_api_keys",
  up: [
    `ALTER TABLE mcp_tool_servers ADD COLUMN api_key_hash TEXT`,
    `ALTER TABLE mcp_tool_servers ADD COLUMN api_key_prefix TEXT`,
  ],
};

export default migration;
