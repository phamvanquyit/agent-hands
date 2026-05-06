import type { FastifyInstance } from "fastify";
import { registerProjectRoutes } from "./project.controller.js";
import { registerDocumentRoutes } from "./document.controller.js";

export default async function documentsModule(app: FastifyInstance) {
  registerProjectRoutes(app);
  registerDocumentRoutes(app);
}

// Routes: /api/projects + /api/projects/:projectId/documents
export const MODULE_PREFIX = "/api/projects";
