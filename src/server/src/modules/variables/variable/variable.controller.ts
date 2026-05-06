import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { requireAuth } from "../../../common/auth/middleware.js";
import {
  createVariableBodySchema,
  updateVariableBodySchema,
  bulkCreateBodySchema,
  listVariablesQuerySchema,
} from "./variable.schema.js";
import type {
  CreateVariableBody,
  UpdateVariableBody,
  BulkCreateBody,
  ListVariablesQuery,
} from "./variable.schema.js";
import {
  listVariables,
  getVariableById,
  getVariableByKey,
  createVariable,
  updateVariable,
  deleteVariable,
  bulkCreateVariables,
  flushNamespaceVariables,
} from "./variable.service.js";

/** Extract namespaceId from route params — null means global */
function extractNamespaceId(params: Record<string, unknown>): string | null {
  const nid = params.namespaceId as string | undefined;
  return nid ?? null;
}

export function registerVariableRoutes(app: FastifyInstance) {
  const r = app.withTypeProvider<ZodTypeProvider>();

  // GET / — list variables (with query params)
  r.get(
    "/",
    {
      preHandler: [requireAuth],
      schema: { querystring: listVariablesQuerySchema },
    },
    async (req, reply) => {
      const namespaceId = extractNamespaceId(req.params as Record<string, unknown>);
      const query = req.query as ListVariablesQuery;
      const result = await listVariables(namespaceId, query);
      return reply.send(result);
    },
  );

  // GET /by-key/:key — get variable by key
  r.get("/by-key/:key", { preHandler: [requireAuth] }, async (req, reply) => {
    const namespaceId = extractNamespaceId(req.params as Record<string, unknown>);
    const { key } = req.params as { key: string };
    const variable = await getVariableByKey(namespaceId, key);
    if (!variable) return reply.code(400).send({ error: "not_found", message: "Variable not found or expired" });
    return reply.send(variable);
  });

  // GET /:id — get variable by ID
  r.get("/:id", { preHandler: [requireAuth] }, async (req, reply) => {
    const { id } = req.params as { id: string };
    const variable = await getVariableById(id);
    if (!variable) return reply.code(400).send({ error: "not_found", message: "Variable not found or expired" });
    return reply.send(variable);
  });

  // POST / — create/upsert variable
  r.post(
    "/",
    {
      preHandler: [requireAuth],
      schema: { body: createVariableBodySchema },
    },
    async (req, reply) => {
      const namespaceId = extractNamespaceId(req.params as Record<string, unknown>);
      const variable = await createVariable(namespaceId, req.body as CreateVariableBody);
      return reply.code(201).send(variable);
    },
  );

  // POST /bulk — batch create/upsert variables
  r.post(
    "/bulk",
    {
      preHandler: [requireAuth],
      schema: { body: bulkCreateBodySchema },
    },
    async (req, reply) => {
      const namespaceId = extractNamespaceId(req.params as Record<string, unknown>);
      const { variables } = req.body as BulkCreateBody;
      const results = await bulkCreateVariables(namespaceId, variables);
      return reply.code(201).send({
        items: results,
        meta: { total: results.length },
      });
    },
  );

  // PATCH /:id — update variable
  r.patch(
    "/:id",
    {
      preHandler: [requireAuth],
      schema: { body: updateVariableBodySchema },
    },
    async (req, reply) => {
      const { id } = req.params as { id: string };
      const existing = await getVariableById(id);
      if (!existing) return reply.code(400).send({ error: "not_found", message: "Variable not found" });

      const updated = await updateVariable(id, req.body as UpdateVariableBody);
      return reply.send(updated);
    },
  );

  // DELETE / — flush all variables in namespace
  r.delete("/", { preHandler: [requireAuth] }, async (req, reply) => {
    const namespaceId = extractNamespaceId(req.params as Record<string, unknown>);
    if (!namespaceId) {
      return reply.code(400).send({ error: "bad_request", message: "Namespace required for flush" });
    }
    const result = await flushNamespaceVariables(namespaceId);
    return reply.send(result);
  });

  // DELETE /:id — delete single variable
  r.delete("/:id", { preHandler: [requireAuth] }, async (req, reply) => {
    const { id } = req.params as { id: string };
    await deleteVariable(id);
    return reply.send({ id, deleted: true });
  });
}
