import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

export function registerDatatablesUpdateRow(server: McpServer) {
  server.registerTool(
    "datatables_update_row",
      {
        description: "Update an existing row in a table (partial update — only specified columns are changed). Returns the updated row.",
        inputSchema: {
      tableId: z
        .string()
        .min(1)
        .describe("Table ID (e.g. 'dtb_xxx'). Use datatables_list_tables to find table IDs"),
      rowId: z
        .string()
        .min(1)
        .describe("Row ID to update (e.g. 'row_xxx'). Use datatables_query_rows to find row IDs"),
      data: z
        .record(z.unknown())
        .describe(
          "Partial row data — only include columns you want to update. " +
          "Example: { \"col_name\": \"Jane\", \"col_active\": false }"
        ),
        },
      },
    async ({ tableId, rowId, data }) => {
      try {
        const { updateRow } = await import(
          "../../../../modules/datatables/table.service.js"
        );
        const result = await updateRow(tableId, rowId, { data });
        return {
          content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }],
        };
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Internal error";
        return {
          content: [{ type: "text" as const, text: JSON.stringify({ error: msg }) }],
          isError: true,
        };
      }
    },
  );
}
