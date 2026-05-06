import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

// ── Static module imports (required for bun build bundling) ─────────────────
import apiDocsModule, { MODULE_PREFIX as API_DOCS_PREFIX } from "./modules/api-docs/api-doc.module.js";
import apiKeysModule, { MODULE_PREFIX as API_KEYS_PREFIX } from "./modules/api-keys/api-key.module.js";
import authModule, { MODULE_PREFIX as AUTH_PREFIX } from "./modules/auth/auth.module.js";
import databasesModule, { MODULE_PREFIX as DATABASES_PREFIX } from "./modules/databases/database.module.js";
import documentsModule, { MODULE_PREFIX as DOCUMENTS_PREFIX } from "./modules/documents/document.module.js";
import mcpToolServersModule, { MODULE_PREFIX as MCP_TOOL_SERVERS_PREFIX } from "./modules/mcp-tool-servers/mcp-tool-server.module.js";
import s3Module, { MODULE_PREFIX as S3_PREFIX } from "./modules/s3/s3.module.js";
import storageModule, { MODULE_PREFIX as STORAGE_PREFIX } from "./modules/storage/storage.module.js";
import usersModule, { MODULE_PREFIX as USERS_PREFIX } from "./modules/users/user.module.js";
import variablesModule, { MODULE_PREFIX as VARIABLES_PREFIX } from "./modules/variables/variables.module.js";
import systemModule, { MODULE_PREFIX as SYSTEM_PREFIX } from "./modules/system/system.module.js";
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

// Session tracker for MCP (Streamable HTTP)
const mcpStreamableSessions = new Map<string, { transport: StreamableHTTPServerTransport; mcpServer: ReturnType<typeof createMcpServer> }>();

const __dirname = dirname(fileURLToPath(import.meta.url));

// ── Module Registry (static — bun build compatible) ────────────────────────
const MODULE_REGISTRY = [
  { name: "api-docs",         plugin: apiDocsModule,         prefix: API_DOCS_PREFIX },
  { name: "api-keys",         plugin: apiKeysModule,         prefix: API_KEYS_PREFIX },
  { name: "auth",             plugin: authModule,             prefix: AUTH_PREFIX },
  { name: "databases",        plugin: databasesModule,        prefix: DATABASES_PREFIX },
  { name: "documents",        plugin: documentsModule,        prefix: DOCUMENTS_PREFIX },
  { name: "mcp-tool-servers", plugin: mcpToolServersModule,   prefix: MCP_TOOL_SERVERS_PREFIX },
  { name: "s3",               plugin: s3Module,               prefix: S3_PREFIX },
  { name: "storage",          plugin: storageModule,          prefix: STORAGE_PREFIX },
  { name: "users",            plugin: usersModule,            prefix: USERS_PREFIX },
  { name: "variables",        plugin: variablesModule,        prefix: VARIABLES_PREFIX },
  { name: "system",           plugin: systemModule,           prefix: SYSTEM_PREFIX },
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
      app: "moro-llm-toolkit",
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

  // ── MCP Streamable HTTP Transport — per-server endpoints ───────────────────
  // Supports both POST (messages) and GET (SSE stream) on the same endpoint.
  // This is the modern MCP transport used by clients with `serverUrl` config.
  //
  // IMPORTANT: StreamableHTTPServerTransport generates sessionId DURING
  // handleRequest (when processing the "initialize" JSON-RPC call), NOT at
  // construction time. So we must store the session AFTER handleRequest.

  // POST /api/mcp/:serverId — handle JSON-RPC messages (initialize, tool calls, etc.)
  app.post("/api/mcp/:serverId", async (req, reply) => {
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
    const mcpServer = createMcpServer();
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
  app.get("/api/mcp/:serverId", async (req, reply) => {
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
  app.delete("/api/mcp/:serverId", async (req, reply) => {
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
