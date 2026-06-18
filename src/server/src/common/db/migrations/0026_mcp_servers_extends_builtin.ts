import type { Migration } from "../migrate.js";

const migration: Migration = {
  name: "0026_mcp_servers_extends_builtin",
  up: [
    `ALTER TABLE mcp_tool_servers ADD COLUMN extends_builtin TEXT NOT NULL DEFAULT '[]'`,
  ],
};

export default migration;
