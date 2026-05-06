import type { FastifyInstance } from "fastify";
import { getVersionInfo, performUpdate } from "./system.service.js";

export function registerSystemRoutes(app: FastifyInstance) {
  // GET /version — current + latest version info
  app.get("/version", async (_req, reply) => {
    const info = await getVersionInfo();
    return reply.send(info);
  });

  // POST /update — trigger self-update (superadmin only)
  app.post("/update", async (_req, reply) => {
    const result = await performUpdate();
    if (!result.ok) {
      return reply.code(500).send({ error: "update_failed", message: result.message });
    }
    return reply.send(result);
  });
}
