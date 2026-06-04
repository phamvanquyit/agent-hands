import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

export function registerDatatablesDeleteRow(server: McpServer) {
  server.registerTool(
    "datatables_delete_row",
      {
        description: "Delete a single row from a table. This permanently removes the row and cannot be undone. Returns { deleted: true, rowId }.",
        inputSchema: {
      tableId: z
        .string()
        .min(1)
        .describe("Table ID (e.g. 'dtb_xxx'). Use datatables_list_tables to find table IDs"),
      rowId: z
        .string()
        .min(1)
        .describe("Row ID to delete (e.g. 'row_xxx'). Use datatables_query_rows to find row IDs"),
        },
      },
    async ({ tableId, rowId }) => {
      try {
        const { deleteRow } = await import(
          "../../../../modules/datatables/table.service.js"
        );
        await deleteRow(tableId, rowId);
        return {
          content: [{ type: "text" as const, text: JSON.stringify({ deleted: true, rowId }, null, 2) }],
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
