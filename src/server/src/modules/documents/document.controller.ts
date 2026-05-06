import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { requireAuth } from "../../common/auth/middleware.js";
import {
  createDocumentBodySchema,
  updateDocumentBodySchema,
  searchDocumentsQuerySchema,
} from "./document.schema.js";
import type {
  CreateDocumentBody,
  UpdateDocumentBody,
  SearchDocumentsQuery,
} from "./document.schema.js";
import {
  listDocuments,
  getDocumentById,
  getDocumentByIdOnly,
  createDocument,
  updateDocument,
  deleteDocument,
  searchDocuments,
} from "./document.service.js";
import { getProjectById } from "./project.service.js";

export function registerDocumentRoutes(app: FastifyInstance) {
  const r = app.withTypeProvider<ZodTypeProvider>();

  // Shared: validate projectId exists
  const validateProject = async (projectId: string, reply: any) => {
    const project = await getProjectById(projectId);
    if (!project) {
      reply.code(400).send({ error: "not_found", message: "Project not found" });
      return false;
    }
    return true;
  };

  // GET /documents/resolve/:id — resolve a document by ID only (no projectId needed)
  r.get(
    "/documents/resolve/:id",
    { preHandler: [requireAuth] },
    async (req, reply) => {
      const { id } = req.params as { id: string };
      const doc = await getDocumentByIdOnly(id);
      if (!doc) return reply.code(400).send({ error: "not_found", message: "Document not found" });
      return reply.send(doc);
    },
  );

  // GET /:projectId/documents — list all documents in project
  r.get(
    "/:projectId/documents",
    { preHandler: [requireAuth] },
    async (req, reply) => {
      const { projectId } = req.params as { projectId: string };
      if (!(await validateProject(projectId, reply))) return;
      const docs = await listDocuments(projectId);
      return reply.send({
        items: docs,
        meta: { total: docs.length },
      });
    },
  );

  // GET /:projectId/documents/search — full-text search
  r.get(
    "/:projectId/documents/search",
    {
      preHandler: [requireAuth],
      schema: { querystring: searchDocumentsQuerySchema },
    },
    async (req, reply) => {
      const { projectId } = req.params as { projectId: string };
      if (!(await validateProject(projectId, reply))) return;
      const { q } = req.query as SearchDocumentsQuery;
      const results = await searchDocuments(projectId, q);
      return reply.send({
        items: results,
        meta: { total: results.length },
      });
    },
  );

  // POST /:projectId/documents — create document
  r.post(
    "/:projectId/documents",
    {
      preHandler: [requireAuth],
      schema: { body: createDocumentBodySchema },
    },
    async (req, reply) => {
      const { projectId } = req.params as { projectId: string };
      if (!(await validateProject(projectId, reply))) return;
      const doc = await createDocument(projectId, req.body as CreateDocumentBody, req.auth!.userId);
      return reply.code(201).send(doc);
    },
  );

  // GET /:projectId/documents/:id — get document detail
  r.get(
    "/:projectId/documents/:id",
    { preHandler: [requireAuth] },
    async (req, reply) => {
      const { projectId, id } = req.params as { projectId: string; id: string };
      const doc = await getDocumentById(projectId, id);
      if (!doc) return reply.code(400).send({ error: "not_found", message: "Document not found" });
      return reply.send(doc);
    },
  );

  // PATCH /:projectId/documents/:id — update document
  r.patch(
    "/:projectId/documents/:id",
    {
      preHandler: [requireAuth],
      schema: { body: updateDocumentBodySchema },
    },
    async (req, reply) => {
      const { projectId, id } = req.params as { projectId: string; id: string };
      const existing = await getDocumentById(projectId, id);
      if (!existing) return reply.code(400).send({ error: "not_found", message: "Document not found" });
      const doc = await updateDocument(projectId, id, req.body as UpdateDocumentBody);
      return reply.send(doc);
    },
  );

  // DELETE /:projectId/documents/:id — delete document
  r.delete(
    "/:projectId/documents/:id",
    { preHandler: [requireAuth] },
    async (req, reply) => {
      const { projectId, id } = req.params as { projectId: string; id: string };
      const existing = await getDocumentById(projectId, id);
      if (!existing) return reply.code(400).send({ error: "not_found", message: "Document not found" });
      await deleteDocument(projectId, id);
      return reply.send({ id, deleted: true });
    },
  );
}
