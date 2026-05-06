import type { FastifyInstance } from "fastify";
import { getApiDocs } from "./api-doc.service.js";

export function registerApiDocRoutes(app: FastifyInstance) {
  // GET / — Return full API docs JSON (public, no auth required)
  app.get("/", async (_req, reply) => {
    const docs = getApiDocs();
    return reply.send(docs);
  });
}
