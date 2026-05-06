import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { requireAuth } from "../../../common/auth/middleware.js";
import {
  createVariableNamespaceBodySchema,
  updateVariableNamespaceBodySchema,
} from "./variable-namespace.schema.js";
import type { CreateVariableNamespaceBody, UpdateVariableNamespaceBody } from "./variable-namespace.schema.js";
import {
  listVariableNamespaces,
  getVariableNamespaceById,
  createVariableNamespace,
  updateVariableNamespace,
  deleteVariableNamespace,
} from "./variable-namespace.service.js";

export function registerVariableNamespaceRoutes(app: FastifyInstance) {
  const r = app.withTypeProvider<ZodTypeProvider>();

  // GET / — list all variable namespaces
  r.get("/", { preHandler: [requireAuth] }, async (_req, reply) => {
    const data = await listVariableNamespaces();
    return reply.send({
      items: data,
      meta: { total: data.length },
    });
  });

  // POST / — create variable namespace
  r.post(
    "/",
    { preHandler: [requireAuth], schema: { body: createVariableNamespaceBodySchema } },
    async (req, reply) => {
      const ns = await createVariableNamespace(req.body as CreateVariableNamespaceBody, req.auth!.userId);
      return reply.code(201).send(ns);
    },
  );

  // GET /:namespaceId — get variable namespace
  r.get("/:namespaceId", { preHandler: [requireAuth] }, async (req, reply) => {
    const { namespaceId } = req.params as { namespaceId: string };
    const ns = await getVariableNamespaceById(namespaceId);
    if (!ns) return reply.code(400).send({ error: "not_found", message: "Variable namespace not found" });
    return reply.send(ns);
  });

  // PATCH /:namespaceId — update variable namespace
  r.patch(
    "/:namespaceId",
    { preHandler: [requireAuth], schema: { body: updateVariableNamespaceBodySchema } },
    async (req, reply) => {
      const { namespaceId } = req.params as { namespaceId: string };
      const existing = await getVariableNamespaceById(namespaceId);
      if (!existing) return reply.code(400).send({ error: "not_found", message: "Variable namespace not found" });
      const ns = await updateVariableNamespace(namespaceId, req.body as UpdateVariableNamespaceBody);
      return reply.send(ns);
    },
  );

  // DELETE /:namespaceId — delete variable namespace
  r.delete("/:namespaceId", { preHandler: [requireAuth] }, async (req, reply) => {
    const { namespaceId } = req.params as { namespaceId: string };
    const existing = await getVariableNamespaceById(namespaceId);
    if (!existing) return reply.code(400).send({ error: "not_found", message: "Variable namespace not found" });
    await deleteVariableNamespace(namespaceId);
    return reply.send({ id: namespaceId, deleted: true });
  });
}
