import { eq, desc, sql } from "drizzle-orm";
import { getDb } from "../../common/db/client.js";
import { databases, dynamicTables, dynamicTableRows } from "../../common/db/schema.js";
import { genId, now } from "../../common/utils.js";
import type { CreateDatabaseBody, UpdateDatabaseBody } from "./database.schema.js";

// ── List all databases ─────────────────────────────────────────────────────────

export async function listDatabases() {
  const db = getDb();
  const rows = await db
    .select()
    .from(databases)
    .orderBy(desc(databases.updatedAt))
    .all();

  // Count tables per database
  const counts = await db
    .select({
      databaseId: dynamicTables.databaseId,
      count: sql<number>`COUNT(*)`,
    })
    .from(dynamicTables)
    .where(sql`${dynamicTables.databaseId} IS NOT NULL`)
    .groupBy(dynamicTables.databaseId)
    .all();

  const countMap = new Map(counts.map((c) => [c.databaseId, c.count]));

  return rows.map((row) => ({
    ...row,
    tableCount: countMap.get(row.id) ?? 0,
  }));
}

// ── Get database by ID ─────────────────────────────────────────────────────────

export async function getDatabaseById(id: string) {
  const db = getDb();
  const row = await db
    .select()
    .from(databases)
    .where(eq(databases.id, id))
    .get();
  if (!row) return null;

  const countResult = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(dynamicTables)
    .where(eq(dynamicTables.databaseId, id))
    .get();

  return {
    ...row,
    tableCount: countResult?.count ?? 0,
  };
}

// ── Create database ────────────────────────────────────────────────────────────

export async function createDatabase(data: CreateDatabaseBody, userId: string) {
  const db = getDb();
  const id = genId("dbs");
  const ts = now();

  await db.insert(databases).values({
    id,
    name: data.name,
    description: data.description ?? null,
    icon: data.icon ?? null,
    createdBy: userId,
    createdAt: ts,
    updatedAt: ts,
  });

  return getDatabaseById(id);
}

// ── Update database ────────────────────────────────────────────────────────────

export async function updateDatabase(id: string, data: UpdateDatabaseBody) {
  const db = getDb();
  const ts = now();
  const updates: Record<string, unknown> = { updatedAt: ts };

  if (data.name !== undefined) updates.name = data.name;
  if (data.description !== undefined) updates.description = data.description;
  if (data.icon !== undefined) updates.icon = data.icon;

  await db.update(databases).set(updates).where(eq(databases.id, id));
  return getDatabaseById(id);
}

// ── Delete database ────────────────────────────────────────────────────────────

export async function deleteDatabase(id: string) {
  const db = getDb();

  // Delete all rows belonging to tables in this database
  const tables = await db
    .select({ id: dynamicTables.id })
    .from(dynamicTables)
    .where(eq(dynamicTables.databaseId, id))
    .all();

  for (const table of tables) {
    await db.delete(dynamicTableRows).where(eq(dynamicTableRows.tableId, table.id));
  }

  // Delete all tables in this database
  await db.delete(dynamicTables).where(eq(dynamicTables.databaseId, id));

  // Delete the database itself
  await db.delete(databases).where(eq(databases.id, id));
  return true;
}
