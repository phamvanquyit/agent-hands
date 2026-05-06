import type { FastifyInstance } from "fastify";
import { registerDatabaseRoutes } from "./database.controller.js";
import { registerTableRoutes } from "./table.controller.js";

export default async function databasesModule(app: FastifyInstance) {
  registerDatabaseRoutes(app);
  registerTableRoutes(app);
}

// Metadata for auto-loader
export const MODULE_PREFIX = "/api/databases";
