import { eq, desc } from "drizzle-orm";
import { getDb } from "../../../common/db/client.js";
import { variableNamespaces } from "../../../common/db/schema.js";
import { genId, now } from "../../../common/utils.js";
import type { CreateVariableNamespaceBody, UpdateVariableNamespaceBody } from "./variable-namespace.schema.js";

export async function listVariableNamespaces() {
  const db = getDb();
  return db
    .select()
    .from(variableNamespaces)
    .orderBy(desc(variableNamespaces.updatedAt))
    .all();
}

export async function getVariableNamespaceById(id: string) {
  const db = getDb();
  return db
    .select()
    .from(variableNamespaces)
    .where(eq(variableNamespaces.id, id))
    .get() ?? null;
}

export async function createVariableNamespace(data: CreateVariableNamespaceBody, userId: string) {
  const db = getDb();
  const id = genId("vns");
  const ts = now();

  await db.insert(variableNamespaces).values({
    id,
    name: data.name,
    description: data.description ?? null,
    icon: data.icon ?? null,
    createdBy: userId,
    createdAt: ts,
    updatedAt: ts,
  });

  return getVariableNamespaceById(id);
}

export async function updateVariableNamespace(id: string, data: UpdateVariableNamespaceBody) {
  const db = getDb();
  const ts = now();
  const updates: Record<string, unknown> = { updatedAt: ts };

  if (data.name !== undefined) updates.name = data.name;
  if (data.description !== undefined) updates.description = data.description;
  if (data.icon !== undefined) updates.icon = data.icon;

  await db.update(variableNamespaces).set(updates).where(eq(variableNamespaces.id, id));
  return getVariableNamespaceById(id);
}

export async function deleteVariableNamespace(id: string) {
  const db = getDb();
  await db.delete(variableNamespaces).where(eq(variableNamespaces.id, id));
  return true;
}
