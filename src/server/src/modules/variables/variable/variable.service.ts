import { eq, and, like, sql, isNull, or, desc, asc } from "drizzle-orm";
import { getDb } from "../../../common/db/client.js";
import { variables } from "../../../common/db/schema.js";
import type { InsertVariable } from "../../../common/db/schema.js";
import { genId, now } from "../../../common/utils.js";
import type { CreateVariableBody, UpdateVariableBody, ListVariablesQuery } from "./variable.schema.js";

// ── Helpers ─────────────────────────────────────────────────────────────────────

/** Auto-detect variable type from value string */
function detectType(value: string): "string" | "number" | "boolean" | "json" {
  if (value === "true" || value === "false") return "boolean";
  if (!Number.isNaN(Number(value)) && value.trim() !== "") return "number";
  try {
    const parsed = JSON.parse(value);
    if (typeof parsed === "object" && parsed !== null) return "json";
  } catch {
    // not JSON
  }
  return "string";
}

/** Calculate expiresAt from TTL in seconds */
function calcExpiry(ttl?: number | null): number | null {
  if (!ttl || ttl <= 0) return null;
  return now() + ttl * 1000;
}

/** Filter condition to exclude expired variables */
function notExpired() {
  const currentTime = now();
  return or(
    isNull(variables.expiresAt),
    sql`${variables.expiresAt} > ${currentTime}`,
  );
}

/** Build project filter condition */
function projectFilter(projectId: string | null) {
  if (projectId) {
    return eq(variables.projectId, projectId);
  }
  return isNull(variables.projectId);
}

// ── CRUD ────────────────────────────────────────────────────────────────────────

export async function listVariables(projectId: string | null, query: ListVariablesQuery) {
  const db = getDb();
  const page = query.page ?? 1;
  const limit = query.limit ?? 50;
  const offset = (page - 1) * limit;

  // Build conditions
  const conditions = [notExpired()!, projectFilter(projectId)!];

  if (query.search) {
    conditions.push(like(variables.key, `%${query.search}%`));
  }

  const where = and(...conditions);

  // Count
  const countResult = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(variables)
    .where(where)
    .get();
  const total = countResult?.count ?? 0;

  // Sort
  const sortField = query.sort ?? "updated_at";
  const sortOrder = query.order ?? "desc";
  const orderCol =
    sortField === "key"
      ? variables.key
      : sortField === "type"
        ? variables.type
        : sortField === "ttl"
          ? variables.ttl
          : variables.updatedAt;
  const orderFn = sortOrder === "asc" ? asc : desc;

  const rows = await db
    .select()
    .from(variables)
    .where(where)
    .orderBy(orderFn(orderCol))
    .limit(limit)
    .offset(offset)
    .all();

  return {
    items: rows,
    meta: { total, page, limit, hasMore: offset + limit < total },
  };
}

export async function getVariableById(id: string) {
  const db = getDb();
  const row = await db.select().from(variables).where(eq(variables.id, id)).get();
  if (!row) return null;
  // Check expired
  if (row.expiresAt && now() >= row.expiresAt) return null;
  return row;
}

export async function getVariableByKey(projectId: string | null, key: string) {
  const db = getDb();
  const row = await db
    .select()
    .from(variables)
    .where(and(eq(variables.key, key), projectFilter(projectId)))
    .get();
  if (!row) return null;
  if (row.expiresAt && now() >= row.expiresAt) return null;
  return row;
}

export async function createVariable(projectId: string | null, data: CreateVariableBody) {
  const db = getDb();
  const id = genId("var");
  const ts = now();
  const type = data.type ?? detectType(data.value);
  const expiresAt = calcExpiry(data.ttl);

  // Check uniqueness within project scope
  const existing = await db
    .select({ id: variables.id })
    .from(variables)
    .where(and(
      eq(variables.key, data.key),
      projectFilter(projectId),
    ))
    .get();

  if (existing) {
    // Upsert: update existing variable
    await db
      .update(variables)
      .set({
        value: data.value,
        type,
        ttl: data.ttl ?? null,
        expiresAt,
        updatedAt: ts,
      })
      .where(eq(variables.id, existing.id));
    return getVariableById(existing.id);
  }

  await db.insert(variables).values({
    id,
    projectId,
    key: data.key,
    value: data.value,
    type,
    ttl: data.ttl ?? null,
    expiresAt,
    createdAt: ts,
    updatedAt: ts,
  });

  return getVariableById(id);
}

export async function updateVariable(id: string, data: UpdateVariableBody) {
  const db = getDb();
  const ts = now();
  const updates: Partial<InsertVariable> = { updatedAt: ts };

  if (data.value !== undefined) updates.value = data.value;
  if (data.type !== undefined) updates.type = data.type;

  // Handle TTL changes
  if (data.ttl !== undefined) {
    if (data.ttl === null || data.ttl === 0) {
      updates.ttl = null;
      updates.expiresAt = null;
    } else {
      updates.ttl = data.ttl;
      updates.expiresAt = calcExpiry(data.ttl);
    }
  }

  await db.update(variables).set(updates).where(eq(variables.id, id));
  return getVariableById(id);
}

export async function deleteVariable(id: string) {
  const db = getDb();
  await db.delete(variables).where(eq(variables.id, id));
  return true;
}

export async function bulkCreateVariables(projectId: string | null, items: CreateVariableBody[]) {
  const results = [];
  for (const item of items) {
    const v = await createVariable(projectId, item);
    if (v) results.push(v);
  }
  return results;
}

/** Cleanup expired variables (called periodically) */
export async function cleanupExpired() {
  const db = getDb();
  const currentTime = now();
  // Count first, then delete
  const countResult = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(variables)
    .where(and(
      sql`${variables.expiresAt} IS NOT NULL`,
      sql`${variables.expiresAt} <= ${currentTime}`,
    ))
    .get();
  const deleted = countResult?.count ?? 0;
  await db
    .delete(variables)
    .where(and(
      sql`${variables.expiresAt} IS NOT NULL`,
      sql`${variables.expiresAt} <= ${currentTime}`,
    ));
  return { deleted };
}

/** Flush (delete) all variables in a namespace */
export async function flushNamespaceVariables(namespaceId: string) {
  const db = getDb();
  // Count first, then delete
  const countResult = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(variables)
    .where(eq(variables.projectId, namespaceId))
    .get();
  const deleted = countResult?.count ?? 0;
  await db.delete(variables).where(eq(variables.projectId, namespaceId));
  return { deleted };
}
