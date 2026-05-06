import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { requireAuth } from "../../common/auth/middleware.js";
import {
  createDatabaseBodySchema,
  updateDatabaseBodySchema,
} from "./database.schema.js";
import type { CreateDatabaseBody, UpdateDatabaseBody } from "./database.schema.js";
import {
  listDatabases,
  getDatabaseById,
  createDatabase,
  updateDatabase,
  deleteDatabase,
} from "./database.service.js";

export function registerDatabaseRoutes(app: FastifyInstance) {
  const r = app.withTypeProvider<ZodTypeProvider>();

  // GET / — list all databases
  r.get("/", { preHandler: [requireAuth] }, async (_req, reply) => {
    const items = await listDatabases();
    return reply.send({
      items,
      meta: { total: items.length },
    });
  });

  // POST / — create database
  r.post(
    "/",
    {
      preHandler: [requireAuth],
      schema: { body: createDatabaseBodySchema },
    },
    async (req, reply) => {
      const result = await createDatabase(req.body as CreateDatabaseBody, req.auth!.userId);
      return reply.code(201).send(result);
    },
  );

  // GET /:id — get database by id
  r.get("/:id", { preHandler: [requireAuth] }, async (req, reply) => {
    const { id } = req.params as { id: string };
    const result = await getDatabaseById(id);
    if (!result) return reply.code(400).send({ error: "not_found", message: "Database not found" });
    return reply.send(result);
  });

  // PATCH /:id — update database metadata
  r.patch(
    "/:id",
    {
      preHandler: [requireAuth],
      schema: { body: updateDatabaseBodySchema },
    },
    async (req, reply) => {
      const { id } = req.params as { id: string };
      const existing = await getDatabaseById(id);
      if (!existing) return reply.code(400).send({ error: "not_found", message: "Database not found" });

      const result = await updateDatabase(id, req.body as UpdateDatabaseBody);
      return reply.send(result);
    },
  );

  // DELETE /:id — delete database (unlinks tables, doesn't delete them)
  r.delete("/:id", { preHandler: [requireAuth] }, async (req, reply) => {
    const { id } = req.params as { id: string };
    const existing = await getDatabaseById(id);
    if (!existing) return reply.code(400).send({ error: "not_found", message: "Database not found" });

    await deleteDatabase(id);
    return reply.send({ id, deleted: true });
  });
}
