import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

// ── Static module imports (required for bun build bundling) ─────────────────
import apiDocsModule, { MODULE_PREFIX as API_DOCS_PREFIX } from "./modules/api-docs/api-doc.module.js";
import apiKeysModule, { MODULE_PREFIX as API_KEYS_PREFIX } from "./modules/api-keys/api-key.module.js";
import authModule, { MODULE_PREFIX as AUTH_PREFIX } from "./modules/auth/auth.module.js";
import datatablesModule, { MODULE_PREFIX as DATATABLES_PREFIX } from "./modules/datatables/datatable.module.js";
import mcpToolServersModule, { MODULE_PREFIX as MCP_TOOL_SERVERS_PREFIX } from "./modules/mcp-tool-servers/mcp-tool-server.module.js";
import s3Module, { MODULE_PREFIX as S3_PREFIX } from "./modules/s3/s3.module.js";
import storageModule, { MODULE_PREFIX as STORAGE_PREFIX } from "./modules/storage/storage.module.js";
import usersModule, { MODULE_PREFIX as USERS_PREFIX } from "./modules/users/user.module.js";
import kvStoreModule, { MODULE_PREFIX as KV_STORE_PREFIX } from "./modules/kv-store/kv-store.module.js";
import systemModule, { MODULE_PREFIX as SYSTEM_PREFIX } from "./modules/system/system.module.js";
import dynamicApisModule, { MODULE_PREFIX as DYNAMIC_APIS_PREFIX } from "./modules/dynamic-apis/dynamic-api.module.js";
import llmProvidersModule, { MODULE_PREFIX as LLM_PROVIDERS_PREFIX } from "./modules/llm-providers/llm-provider.module.js";
import configurationsModule, { MODULE_PREFIX as CONFIGURATIONS_PREFIX } from "./modules/configurations/configuration.module.js";
import { registerDynamicApiRunner } from "./modules/dynamic-apis/dynamic-api.runner.js";
import Fastify from "fastify";
import type { FastifyError, FastifyInstance } from "fastify";
import cors from "@fastify/cors";
import multipart from "@fastify/multipart";
import {
  serializerCompiler,
  validatorCompiler,
  type ZodTypeProvider,
} from "fastify-type-provider-zod";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { createMcpServer } from "./common/mcp/server.js";
import { requireAuth } from "./common/auth/middleware.js";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { getMcpServerById, listMcpTools } from "./modules/mcp-tool-servers/mcp-tool-server.service.js";
import { executeMcpTool } from "./modules/mcp-tool-servers/mcp-tool-executor.js";
import { createMcpToolLog } from "./modules/mcp-tool-servers/mcp-tool-server.service.js";

// Session tracker for MCP (Streamable HTTP)
const mcpStreamableSessions = new Map<string, { transport: StreamableHTTPServerTransport; mcpServer: McpServer | ReturnType<typeof createMcpServer> }>();

/**
 * Create an MCP server for a custom MCP tool server.
 * Dynamically loads tools from DB and registers them.
 */
async function createCustomMcpServer(serverId: string, authToken: string): Promise<McpServer | null> {
  const serverRecord = await getMcpServerById(serverId);
  if (!serverRecord || serverRecord.type === "builtin") return null;

  const server = new McpServer({
    name: serverRecord.name,
    version: "1.0.0",
  });

  // Load all active tools for this server
  const toolsResult = await listMcpTools(serverId, { page: 1, limit: 500 });
  const activeTools = toolsResult.items.filter((t: { isActive: number }) => t.isActive);

  for (const tool of activeTools) {
    // Parse input schema to build Zod schema for MCP
    let inputShape: Record<string, any> = {};
    if (tool.inputSchema) {
      try {
        const schema = JSON.parse(tool.inputSchema);
        if (schema.properties) {
          for (const [key, prop] of Object.entries(schema.properties)) {
            const p = prop as { type?: string; description?: string };
            let zField: any = z.any();
            if (p.type === "string") zField = z.string();
            else if (p.type === "number" || p.type === "integer") zField = z.number();
            else if (p.type === "boolean") zField = z.boolean();
            if (p.description) zField = zField.describe(p.description);
            const required = schema.required as string[] | undefined;
            if (!required?.includes(key)) zField = zField.optional();
            inputShape[key] = zField;
          }
        }
      } catch {
        // If schema parsing fails, accept any payload
        inputShape = { payload: z.any().optional() };
      }
    }

    const toolId = tool.id;
    const toolCode = tool.code;
    const toolServerId = serverId;

    server.tool(
      tool.name,
      tool.description || `Custom tool: ${tool.name}`,
      Object.keys(inputShape).length > 0 ? inputShape : {},
      async (params: Record<string, unknown>) => {
        const startTime = Date.now();
        const result = await executeMcpTool(toolId, toolCode, params, {
          timeoutMs: 30_000,
          baseUrl: `http://127.0.0.1:${process.env.PORT ?? "18080"}`,
          authToken,
        });

        // Log execution (fire-and-forget)
        createMcpToolLog({
          toolId,
          serverId: toolServerId,
          callerType: "mcp_agent",
          callerInfo: "mcp_client",
          inputParams: params,
          outputResult: result.result,
          status: result.success ? "success" : "error",
          errorMessage: result.success ? undefined : (result.stderr || "Execution error"),
          executionTimeMs: result.executionTimeMs,
        }).catch(() => {});

        if (!result.success) {
          return {
            content: [{ type: "text" as const, text: JSON.stringify({ error: result.result }) }],
            isError: true,
          };
        }
        return {
          content: [{ type: "text" as const, text: JSON.stringify(result.result, null, 2) }],
        };
      },
    );
  }

  return server;
}

const __dirname = dirname(fileURLToPath(import.meta.url));

// ── Module Registry (static — bun build compatible) ────────────────────────
const MODULE_REGISTRY = [
  { name: "api-docs",         plugin: apiDocsModule,         prefix: API_DOCS_PREFIX },
  { name: "api-keys",         plugin: apiKeysModule,         prefix: API_KEYS_PREFIX },
  { name: "auth",             plugin: authModule,             prefix: AUTH_PREFIX },
  { name: "datatables",       plugin: datatablesModule,       prefix: DATATABLES_PREFIX },
  { name: "mcp-tool-servers", plugin: mcpToolServersModule,   prefix: MCP_TOOL_SERVERS_PREFIX },
  { name: "s3",               plugin: s3Module,               prefix: S3_PREFIX },
  { name: "storage",          plugin: storageModule,          prefix: STORAGE_PREFIX },
  { name: "users",            plugin: usersModule,            prefix: USERS_PREFIX },
  { name: "kv-store",        plugin: kvStoreModule,          prefix: KV_STORE_PREFIX },
  { name: "system",           plugin: systemModule,           prefix: SYSTEM_PREFIX },
  { name: "dynamic-apis",     plugin: dynamicApisModule,      prefix: DYNAMIC_APIS_PREFIX },
  { name: "llm-providers",    plugin: llmProvidersModule,     prefix: LLM_PROVIDERS_PREFIX },
  { name: "configurations",   plugin: configurationsModule,   prefix: CONFIGURATIONS_PREFIX },
] as const;

async function loadModules(app: FastifyInstance) {
  for (const { name, plugin, prefix } of MODULE_REGISTRY) {
    app.register(plugin, { prefix });
    console.log(`  ✔ Module loaded: ${name} → ${prefix}`);
  }
}

// ── App Factory ─────────────────────────────────────────────────────────────────

export async function createApp() {
  const app = Fastify({
    logger: false,
    bodyLimit: 10 * 1024 * 1024 * 1024, // 10GB
  }).withTypeProvider<ZodTypeProvider>();

  app.setValidatorCompiler(validatorCompiler);
  app.setSerializerCompiler(serializerCompiler);

  // ── Plugins ─────────────────────────────────────────────────────────────────
  app.register(cors, {
    origin: "*",
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-API-Key"],
  });

  app.register(multipart, { limits: { fileSize: 10 * 1024 * 1024 * 1024 } });

  // ── Handle empty application/json bodies gracefully without throwing ──────
  app.addContentTypeParser(
    "application/json",
    { parseAs: "string" },
    (_req, body, done) => {
      const text = typeof body === "string" ? body.trim() : "";
      if (text === "") {
        done(null, {});
        return;
      }
      try {
        const json = JSON.parse(text);
        done(null, json);
      } catch (err) {
        (err as any).statusCode = 400;
        done(err as Error, undefined);
      }
    }
  );

  // ── Binary content-type fallback (fix 415 on file upload) ────────────────
  app.addContentTypeParser(
    /^(?!application\/json|multipart\/).*$/,
    { parseAs: "buffer" },
    (_req, body, done) => done(null, body),
  );

  // ── Global error handler ───────────────────────────────────────────────────
  app.setErrorHandler((err: FastifyError, req, reply) => {
    // If reply was already sent, don't try again
    if (reply.sent) return;

    if (err.validation) {
      return reply.code(422).send({
        error: "validation_error",
        message: "Request validation failed",
        details: err.validation,
      });
    }

    // Auth/permission errors thrown with statusCode
    const statusCode = (err as any).statusCode;
    if (statusCode === 401) {
      return reply.code(401).send({ error: "unauthorized", message: err.message });
    }
    if (statusCode === 403) {
      return reply.code(403).send({ error: "forbidden", message: err.message });
    }

    console.error("[Error]", err);
    return reply.code(statusCode ?? 500).send({ error: "internal_error", message: "Internal server error" });
  });

  // ── Health ─────────────────────────────────────────────────────────────────
  app.get("/api/health", async () => {
    const pkgPath = join(__dirname, "../package.json");
    let version = "0.0.0";
    try {
      version = JSON.parse(readFileSync(pkgPath, "utf-8")).version;
    } catch {
      // fallback
    }

    return {
      ok: true,
      app: "agent-hands",
      version,
      runtime: "bun",
      timestamp: Date.now(),
    };
  });

  // ── Auto-load modules ─────────────────────────────────────────────────────
  await loadModules(app);

  // ── Public file serving (no auth) ─────────────────────────────────────────
  const { registerPublicFileRoutes } = await import("./modules/storage/storage.controller.js");
  registerPublicFileRoutes(app);

  // ── Dynamic API runner (catch-all /apis/*) ─────────────────────────────────
  registerDynamicApiRunner(app);

  // ── MCP Streamable HTTP Transport — per-server endpoints ───────────────────
  // Supports both POST (messages) and GET (SSE stream) on the same endpoint.
  // This is the modern MCP transport used by clients with `serverUrl` config.
  //
  // IMPORTANT: StreamableHTTPServerTransport generates sessionId DURING
  // handleRequest (when processing the "initialize" JSON-RPC call), NOT at
  // construction time. So we must store the session AFTER handleRequest.

  // POST /api/mcp/:serverId — handle JSON-RPC messages (initialize, tool calls, etc.)
  app.post("/api/mcp/:serverId", { preHandler: [requireAuth] }, async (req, reply) => {
    const sessionId = req.headers["mcp-session-id"] as string | undefined;

    // ── Existing session → reuse transport ──────────────────────────────────
    if (sessionId) {
      const session = mcpStreamableSessions.get(sessionId);
      if (!session) {
        return reply.code(404).send({ error: "not_found", message: "Session not found" });
      }
      reply.hijack();
      await session.transport.handleRequest(req.raw, reply.raw, req.body);
      return reply;
    }

    // ── No session header → this should be an "initialize" request ──────────
    const { serverId } = req.params as { serverId: string };

    // Extract auth token for custom server context SDK
    const authHeader = req.headers.authorization;
    const authToken = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : "";

    // Check if this is a custom server
    let mcpServer: McpServer | ReturnType<typeof createMcpServer>;
    const customServer = await createCustomMcpServer(serverId, authToken);
    if (customServer) {
      mcpServer = customServer;
    } else {
      mcpServer = createMcpServer();
    }
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: () => crypto.randomUUID(),
    });

    transport.onclose = () => {
      if (transport.sessionId) {
        mcpStreamableSessions.delete(transport.sessionId);
      }
    };

    await mcpServer.connect(transport);

    reply.hijack();
    await transport.handleRequest(req.raw, reply.raw, req.body);

    // After handleRequest, the transport has a sessionId (generated during initialize)
    if (transport.sessionId) {
      mcpStreamableSessions.set(transport.sessionId, { transport, mcpServer });
    }

    return reply;
  });

  // GET /api/mcp/:serverId — SSE stream for server-to-client notifications
  app.get("/api/mcp/:serverId", { preHandler: [requireAuth] }, async (req, reply) => {
    const sessionId = req.headers["mcp-session-id"] as string | undefined;
    if (!sessionId) {
      return reply.code(400).send({ error: "bad_request", message: "Missing mcp-session-id header" });
    }

    const session = mcpStreamableSessions.get(sessionId);
    if (!session) {
      return reply.code(404).send({ error: "not_found", message: "Session not found" });
    }

    reply.hijack();
    await session.transport.handleRequest(req.raw, reply.raw);
    return reply;
  });

  // DELETE /api/mcp/:serverId — close a session explicitly
  app.delete("/api/mcp/:serverId", { preHandler: [requireAuth] }, async (req, reply) => {
    const sessionId = req.headers["mcp-session-id"] as string | undefined;
    if (!sessionId) {
      return reply.code(400).send({ error: "bad_request", message: "Missing mcp-session-id header" });
    }

    const session = mcpStreamableSessions.get(sessionId);
    if (session) {
      await session.transport.close();
      await session.mcpServer.close();
      mcpStreamableSessions.delete(sessionId);
    }

    return reply.code(200).send({ ok: true });
  });

  // ── Serve web SPA under /ui ─────────────────────────────────────────────────
  const webDistPaths = [
    join(__dirname, "../../web/dist"),
    join(__dirname, "../public"),
  ];
  const webDist = webDistPaths.find((p) => existsSync(join(p, "index.html")));

  if (webDist) {
    // Redirect root to /ui
    app.get("/", async (_req, reply) => {
      return reply.redirect("/ui");
    });

    // Serve static assets and SPA fallback under /ui
    app.get("/ui", async (_req, reply) => {
      const indexFile = Bun.file(join(webDist, "index.html"));
      const buf = Buffer.from(await indexFile.arrayBuffer());
      return reply.header("Content-Type", "text/html; charset=utf-8").send(buf);
    });

    app.get("/ui/*", async (req, reply) => {
      // Strip /ui prefix to resolve file path
      const relPath = req.url.replace(/^\/ui/, "") || "/";
      const filePath = join(webDist, relPath);

      if (relPath !== "/" && existsSync(filePath)) {
        const file = Bun.file(filePath);
        const buf = Buffer.from(await file.arrayBuffer());
        return reply.header("Content-Type", file.type).send(buf);
      }

      // SPA fallback — serve index.html for all unmatched routes
      const indexFile = Bun.file(join(webDist, "index.html"));
      const buf = Buffer.from(await indexFile.arrayBuffer());
      return reply
        .header("Content-Type", "text/html; charset=utf-8")
        .send(buf);
    });
  }

  return app;
}
