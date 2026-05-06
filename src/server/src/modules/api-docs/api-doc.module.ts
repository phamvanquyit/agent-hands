import type { FastifyInstance } from "fastify";
import { registerApiDocRoutes } from "./api-doc.controller.js";

export default async function apiDocModule(app: FastifyInstance) {
  registerApiDocRoutes(app);
}

export const MODULE_PREFIX = "/api/docs";
