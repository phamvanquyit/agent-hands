import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { requireAuth } from "../../common/auth/middleware.js";
import {
  createTableBodySchema,
  updateTableBodySchema,
  addColumnBodySchema,
  updateColumnBodySchema,
  bulkDeleteRowsBodySchema,
  bulkUpdateRowsBodySchema,
  createRowBodySchema,
  updateRowBodySchema,
  listRowsQuerySchema,
} from "./table.schema.js";
import type {
  CreateTableBody,
  UpdateTableBody,
  AddColumnBody,
  UpdateColumnBody,
  CreateRowBody,
  UpdateRowBody,
  ListRowsQuery,
  BulkDeleteRowsBody,
  BulkUpdateRowsBody,
} from "./table.schema.js";
import {
  listTables,
  getTableById,
  createTable,
  updateTable,
  deleteTable,
  addColumn,
  updateColumn,
  deleteColumn,
  listRows,
  createRow,
  updateRow,
  deleteRow,
  bulkDeleteRows,
  bulkUpdateRows,
} from "./table.service.js";
import { getDatabaseById } from "./database.service.js";

/**
 * Register table routes nested under /:dbId/tables/...
 * All routes are scoped to a specific database.
 */
export function registerTableRoutes(app: FastifyInstance) {
  const r = app.withTypeProvider<ZodTypeProvider>();

  // ── Table CRUD ──────────────────────────────────────────────────────────────

  // GET /:dbId/tables — list tables in database
  r.get("/:dbId/tables", { preHandler: [requireAuth] }, async (req, reply) => {
    const { dbId } = req.params as { dbId: string };
    const db = await getDatabaseById(dbId);
    if (!db) return reply.code(400).send({ error: "not_found", message: "Database not found" });

    const tables = await listTables(dbId);
    return reply.send({
      items: tables,
      meta: { total: tables.length },
    });
  });

  // POST /:dbId/tables — create table in database
  r.post(
    "/:dbId/tables",
    {
      preHandler: [requireAuth],
      schema: { body: createTableBodySchema },
    },
    async (req, reply) => {
      const { dbId } = req.params as { dbId: string };
      const db = await getDatabaseById(dbId);
      if (!db) return reply.code(400).send({ error: "not_found", message: "Database not found" });

      const table = await createTable(dbId, req.body as CreateTableBody, req.auth!.userId);
      return reply.code(201).send(table);
    },
  );

  // GET /:dbId/tables/:id — get table by id
  r.get("/:dbId/tables/:id", { preHandler: [requireAuth] }, async (req, reply) => {
    const { id } = req.params as { dbId: string; id: string };
    const table = await getTableById(id);
    if (!table) return reply.code(400).send({ error: "not_found", message: "Table not found" });
    return reply.send(table);
  });

  // PATCH /:dbId/tables/:id — update table metadata
  r.patch(
    "/:dbId/tables/:id",
    {
      preHandler: [requireAuth],
      schema: { body: updateTableBodySchema },
    },
    async (req, reply) => {
      const { id } = req.params as { dbId: string; id: string };
      const existing = await getTableById(id);
      if (!existing) return reply.code(400).send({ error: "not_found", message: "Table not found" });

      const table = await updateTable(id, req.body as UpdateTableBody);
      return reply.send(table);
    },
  );

  // DELETE /:dbId/tables/:id — delete table + cascade rows
  r.delete("/:dbId/tables/:id", { preHandler: [requireAuth] }, async (req, reply) => {
    const { id } = req.params as { dbId: string; id: string };
    const existing = await getTableById(id);
    if (!existing) return reply.code(400).send({ error: "not_found", message: "Table not found" });

    await deleteTable(id);
    return reply.send({ id, deleted: true });
  });

  // ── Column Management ────────────────────────────────────────────────────────

  // GET /:dbId/tables/:id/columns — list columns
  r.get("/:dbId/tables/:id/columns", { preHandler: [requireAuth] }, async (req, reply) => {
    const { id } = req.params as { dbId: string; id: string };
    const table = await getTableById(id);
    if (!table) return reply.code(400).send({ error: "not_found", message: "Table not found" });
    return reply.send({
      items: table.columns,
      meta: { total: table.columns.length },
    });
  });

  // POST /:dbId/tables/:id/columns — add column
  r.post(
    "/:dbId/tables/:id/columns",
    {
      preHandler: [requireAuth],
      schema: { body: addColumnBodySchema },
    },
    async (req, reply) => {
      const { id } = req.params as { dbId: string; id: string };
      const col = await addColumn(id, req.body as AddColumnBody);
      if (!col) return reply.code(400).send({ error: "not_found", message: "Table not found" });
      return reply.code(201).send(col);
    },
  );

  // PATCH /:dbId/tables/:id/columns/:colId — update column
  r.patch(
    "/:dbId/tables/:id/columns/:colId",
    {
      preHandler: [requireAuth],
      schema: { body: updateColumnBodySchema },
    },
    async (req, reply) => {
      const { id, colId } = req.params as { dbId: string; id: string; colId: string };
      const col = await updateColumn(id, colId, req.body as UpdateColumnBody);
      if (!col) return reply.code(400).send({ error: "not_found", message: "Table or column not found" });
      return reply.send(col);
    },
  );

  // DELETE /:dbId/tables/:id/columns/:colId — delete column
  r.delete(
    "/:dbId/tables/:id/columns/:colId",
    { preHandler: [requireAuth] },
    async (req, reply) => {
      const { id, colId } = req.params as { dbId: string; id: string; colId: string };
      try {
        const result = await deleteColumn(id, colId);
        if (!result) return reply.code(400).send({ error: "not_found", message: "Table or column not found" });
        return reply.send({ colId, deleted: true });
      } catch (err) {
        if ((err as { statusCode?: number }).statusCode === 400) {
          return reply.code(400).send({ error: "bad_request", message: (err as Error).message });
        }
        throw err;
      }
    },
  );

  // ── Row CRUD ──────────────────────────────────────────────────────────────────

  // GET /:dbId/tables/:id/rows — list rows (paginated)
  r.get(
    "/:dbId/tables/:id/rows",
    {
      preHandler: [requireAuth],
      schema: { querystring: listRowsQuerySchema },
    },
    async (req, reply) => {
      const { id } = req.params as { dbId: string; id: string };
      const table = await getTableById(id);
      if (!table) return reply.code(400).send({ error: "not_found", message: "Table not found" });

      const result = await listRows(id, req.query as ListRowsQuery);
      return reply.send(result);
    },
  );

  // POST /:dbId/tables/:id/rows — create row
  r.post(
    "/:dbId/tables/:id/rows",
    {
      preHandler: [requireAuth],
      schema: { body: createRowBodySchema },
    },
    async (req, reply) => {
      const { id } = req.params as { dbId: string; id: string };
      const table = await getTableById(id);
      if (!table) return reply.code(400).send({ error: "not_found", message: "Table not found" });

      const row = await createRow(id, req.body as CreateRowBody, req.auth!.userId);
      return reply.code(201).send(row);
    },
  );

  // PATCH /:dbId/tables/:id/rows/:rowId — update row
  r.patch(
    "/:dbId/tables/:id/rows/:rowId",
    {
      preHandler: [requireAuth],
      schema: { body: updateRowBodySchema },
    },
    async (req, reply) => {
      const { id, rowId } = req.params as { dbId: string; id: string; rowId: string };
      const row = await updateRow(id, rowId, req.body as UpdateRowBody);
      if (!row) return reply.code(400).send({ error: "not_found", message: "Row not found" });
      return reply.send(row);
    },
  );

  // DELETE /:dbId/tables/:id/rows/:rowId — delete row
  r.delete(
    "/:dbId/tables/:id/rows/:rowId",
    { preHandler: [requireAuth] },
    async (req, reply) => {
      const { id, rowId } = req.params as { dbId: string; id: string; rowId: string };
      const result = await deleteRow(id, rowId);
      if (!result) return reply.code(400).send({ error: "not_found", message: "Row not found" });
      return reply.send({ rowId, deleted: true });
    },
  );

  // POST /:dbId/tables/:id/rows/bulk-delete — bulk delete rows
  r.post(
    "/:dbId/tables/:id/rows/bulk-delete",
    {
      preHandler: [requireAuth],
      schema: { body: bulkDeleteRowsBodySchema },
    },
    async (req, reply) => {
      const { id } = req.params as { dbId: string; id: string };
      const { rowIds } = req.body as BulkDeleteRowsBody;
      const result = await bulkDeleteRows(id, rowIds);
      return reply.send(result);
    },
  );

  // POST /:dbId/tables/:id/rows/bulk-update — bulk update rows
  r.post(
    "/:dbId/tables/:id/rows/bulk-update",
    {
      preHandler: [requireAuth],
      schema: { body: bulkUpdateRowsBodySchema },
    },
    async (req, reply) => {
      const { id } = req.params as { dbId: string; id: string };
      const { updates } = req.body as BulkUpdateRowsBody;
      const result = await bulkUpdateRows(id, updates);
      return reply.send(result);
    },
  );
}
