import type { FastifyInstance } from "fastify";
import { getConfiguration, setConfiguration } from "../configurations/configuration.service.js";
import { getSystemInfo, getVersionInfo, invalidateVersionCache } from "./system.service.js";

export function registerSystemRoutes(app: FastifyInstance) {
  // GET /version — current + latest version info (includes installCommand for manual updates)
  app.get("/version", async (_req, reply) => {
    const info = await getVersionInfo();
    return reply.send(info);
  });

  // GET /info — system metrics (CPU, memory, disk, process, OS)
  app.get("/info", async (_req, reply) => {
    const info = await getSystemInfo();
    return reply.send(info);
  });

  // GET /update-channel — get current update channel preference
  app.get("/update-channel", async (_req, reply) => {
    const config = await getConfiguration("update_channel");
    return reply.send({ channel: config?.value ?? "stable" });
  });

  // PUT /update-channel — set update channel (stable or dev)
  app.put<{ Body: { channel: string } }>("/update-channel", async (req, reply) => {
    const { channel } = req.body;
    if (channel !== "stable" && channel !== "dev") {
      return reply.code(400).send({ error: "bad_request", message: "Channel must be 'stable' or 'dev'" });
    }
    await setConfiguration("update_channel", channel);
    invalidateVersionCache();
    return reply.send({ channel });
  });
}
