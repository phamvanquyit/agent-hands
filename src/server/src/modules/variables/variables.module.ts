import type { FastifyInstance } from "fastify";
import { registerVariableNamespaceRoutes } from "./variable-namespace/variable-namespace.controller.js";
import { registerVariableRoutes } from "./variable/variable.controller.js";

export default async function variablesModule(app: FastifyInstance) {
  // Register namespace routes at /api/variable-namespaces
  // Register variable routes at /api/variable-namespaces/:namespaceId/variables
  registerVariableNamespaceRoutes(app);
  app.register(
    async (sub) => {
      registerVariableRoutes(sub);
    },
    { prefix: "/:namespaceId/variables" },
  );
}

// Metadata for auto-loader
export const MODULE_PREFIX = "/api/variable-namespaces";
