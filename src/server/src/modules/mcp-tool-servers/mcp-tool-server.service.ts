import { eq, and, sql, desc } from "drizzle-orm";
import { getDb } from "../../common/db/client.js";
import { mcpToolServers, mcpTools } from "../../common/db/schema.js";
import { genId, now } from "../../common/utils.js";
import type {
  CreateMcpServerBody,
  UpdateMcpServerBody,
  CreateMcpToolBody,
  UpdateMcpToolBody,
  ListMcpToolsQuery,
} from "./mcp-tool-server.schema.js";

// ── Constants ───────────────────────────────────────────────────────────────

const BUILTIN_SERVER_ID = "mts_system";

// ── MCP Server CRUD ─────────────────────────────────────────────────────────

export async function listMcpServers() {
  const db = getDb();
  const servers = await db
    .select()
    .from(mcpToolServers)
    .orderBy(desc(mcpToolServers.createdAt))
    .all();

  // Count tools per server
  const toolCounts = await db
    .select({
      serverId: mcpTools.serverId,
      count: sql<number>`COUNT(*)`,
    })
    .from(mcpTools)
    .groupBy(mcpTools.serverId)
    .all();

  const countMap = new Map(toolCounts.map((tc) => [tc.serverId, tc.count]));

  // Sort: builtin first, then by createdAt desc
  const sorted = servers.sort((a, b) => {
    if (a.type === "builtin" && b.type !== "builtin") return -1;
    if (b.type === "builtin" && a.type !== "builtin") return 1;
    return b.createdAt - a.createdAt;
  });

  return {
    items: sorted.map((s) => ({
      ...s,
      toolCount: countMap.get(s.id) ?? 0,
    })),
    meta: { total: sorted.length },
  };
}

export async function getMcpServerById(id: string) {
  const db = getDb();
  const server = await db
    .select()
    .from(mcpToolServers)
    .where(eq(mcpToolServers.id, id))
    .get();
  if (!server) return null;

  // Count tools
  const countResult = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(mcpTools)
    .where(eq(mcpTools.serverId, id))
    .get();

  return {
    ...server,
    toolCount: countResult?.count ?? 0,
  };
}

export async function createMcpServer(data: CreateMcpServerBody) {
  const db = getDb();
  const id = genId("mts");
  const ts = now();

  await db.insert(mcpToolServers).values({
    id,
    name: data.name,
    description: data.description ?? null,
    type: "custom",
    isActive: 1,
    createdAt: ts,
    updatedAt: ts,
  });

  return getMcpServerById(id);
}

export async function updateMcpServer(id: string, data: UpdateMcpServerBody) {
  const db = getDb();
  const ts = now();

  const updates: Record<string, unknown> = { updatedAt: ts };
  if (data.name !== undefined) updates.name = data.name;
  if (data.description !== undefined) updates.description = data.description;
  if (data.isActive !== undefined) updates.isActive = data.isActive ? 1 : 0;

  await db
    .update(mcpToolServers)
    .set(updates)
    .where(eq(mcpToolServers.id, id));

  return getMcpServerById(id);
}

export async function deleteMcpServer(id: string) {
  const db = getDb();
  // CASCADE will handle tools deletion
  await db.delete(mcpToolServers).where(eq(mcpToolServers.id, id));
  return true;
}

export function isBuiltinServer(id: string): boolean {
  return id === BUILTIN_SERVER_ID;
}

// ── MCP Tool CRUD ───────────────────────────────────────────────────────────

export async function listMcpTools(serverId: string, query: ListMcpToolsQuery) {
  const db = getDb();
  const page = query.page ?? 1;
  const limit = query.limit ?? 50;
  const offset = (page - 1) * limit;

  const countResult = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(mcpTools)
    .where(eq(mcpTools.serverId, serverId))
    .get();
  const total = countResult?.count ?? 0;

  const rows = await db
    .select()
    .from(mcpTools)
    .where(eq(mcpTools.serverId, serverId))
    .orderBy(desc(mcpTools.createdAt))
    .limit(limit)
    .offset(offset)
    .all();

  return {
    items: rows,
    meta: { total, page, limit, hasMore: offset + limit < total },
  };
}

export async function getMcpToolById(toolId: string) {
  const db = getDb();
  return db.select().from(mcpTools).where(eq(mcpTools.id, toolId)).get() ?? null;
}

export async function createMcpTool(serverId: string, data: CreateMcpToolBody) {
  const db = getDb();
  const id = genId("mtl");
  const ts = now();

  // Check unique name within server
  const existing = await db
    .select({ id: mcpTools.id })
    .from(mcpTools)
    .where(and(eq(mcpTools.serverId, serverId), eq(mcpTools.name, data.name)))
    .get();

  if (existing) {
    throw new Error(`Tool name "${data.name}" already exists in this server`);
  }

  await db.insert(mcpTools).values({
    id,
    serverId,
    name: data.name,
    description: data.description,
    inputSchema: data.inputSchema ?? null,
    code: data.code,
    isActive: 1,
    createdAt: ts,
    updatedAt: ts,
  });

  return getMcpToolById(id);
}

export async function updateMcpTool(
  serverId: string,
  toolId: string,
  data: UpdateMcpToolBody,
) {
  const db = getDb();
  const ts = now();

  // If renaming, check unique within server
  if (data.name !== undefined) {
    const existing = await db
      .select({ id: mcpTools.id })
      .from(mcpTools)
      .where(
        and(
          eq(mcpTools.serverId, serverId),
          eq(mcpTools.name, data.name),
        ),
      )
      .get();

    if (existing && existing.id !== toolId) {
      throw new Error(`Tool name "${data.name}" already exists in this server`);
    }
  }

  const updates: Record<string, unknown> = { updatedAt: ts };
  if (data.name !== undefined) updates.name = data.name;
  if (data.description !== undefined) updates.description = data.description;
  if (data.inputSchema !== undefined) updates.inputSchema = data.inputSchema;
  if (data.code !== undefined) updates.code = data.code;
  if (data.isActive !== undefined) updates.isActive = data.isActive ? 1 : 0;

  await db.update(mcpTools).set(updates).where(eq(mcpTools.id, toolId));

  return getMcpToolById(toolId);
}

export async function deleteMcpTool(toolId: string) {
  const db = getDb();
  await db.delete(mcpTools).where(eq(mcpTools.id, toolId));
  return true;
}
