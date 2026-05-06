import { eq, sql, desc, asc, and } from "drizzle-orm";
import { getDb } from "../../common/db/client.js";
import { documents } from "../../common/db/schema.js";
import { genId, now } from "../../common/utils.js";
import type {
  CreateDocumentBody,
  UpdateDocumentBody,
} from "./document.schema.js";

// ── Helpers ─────────────────────────────────────────────────────────────────────

function formatDoc(row: typeof documents.$inferSelect) {
  return {
    id: row.id,
    projectId: row.projectId,
    title: row.title,
    icon: row.icon,
    cover: row.cover,
    content: row.content,
    isPublic: row.isPublic === 1,
    createdBy: row.createdBy,
    order: row.order,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

// ── CRUD (scoped by projectId) ──────────────────────────────────────────────────

export async function listDocuments(projectId: string) {
  const db = getDb();
  const rows = await db
    .select()
    .from(documents)
    .where(eq(documents.projectId, projectId))
    .orderBy(asc(documents.order), desc(documents.createdAt))
    .all();

  return rows.map((r) => ({
    id: r.id,
    projectId: r.projectId,
    title: r.title,
    icon: r.icon,
    order: r.order,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
  }));
}

export async function getDocumentById(projectId: string, id: string) {
  const db = getDb();
  const row = await db
    .select()
    .from(documents)
    .where(and(eq(documents.id, id), eq(documents.projectId, projectId)))
    .get();
  if (!row) return null;
  return formatDoc(row);
}

/** Look up a document by only its ID (no projectId required). */
export async function getDocumentByIdOnly(id: string) {
  const db = getDb();
  const row = await db
    .select()
    .from(documents)
    .where(eq(documents.id, id))
    .get();
  if (!row) return null;
  return formatDoc(row);
}

export async function createDocument(projectId: string, data: CreateDocumentBody, userId: string) {
  const db = getDb();
  const id = genId("doc");
  const ts = now();

  // Calculate order: place at the end
  const siblings = await db
    .select({ order: documents.order })
    .from(documents)
    .where(eq(documents.projectId, projectId))
    .orderBy(desc(documents.order))
    .limit(1)
    .all();

  const maxOrder = siblings.length > 0 ? siblings[0].order : 0;

  await db.insert(documents).values({
    id,
    projectId,
    title: data.title ?? "Untitled",
    icon: data.icon ?? null,
    content: data.content ?? "",
    createdBy: userId,
    order: maxOrder + 1,
    createdAt: ts,
    updatedAt: ts,
  });

  return getDocumentById(projectId, id);
}

export async function updateDocument(projectId: string, id: string, data: UpdateDocumentBody) {
  const db = getDb();
  const ts = now();
  const updates: Record<string, unknown> = { updatedAt: ts };

  if (data.title !== undefined) updates.title = data.title;
  if (data.icon !== undefined) updates.icon = data.icon;
  if (data.cover !== undefined) updates.cover = data.cover;
  if (data.content !== undefined) updates.content = data.content;

  await db
    .update(documents)
    .set(updates)
    .where(and(eq(documents.id, id), eq(documents.projectId, projectId)));

  return getDocumentById(projectId, id);
}

export async function deleteDocument(projectId: string, id: string) {
  const db = getDb();
  await db
    .delete(documents)
    .where(and(eq(documents.id, id), eq(documents.projectId, projectId)));
  return true;
}

// ── Search ──────────────────────────────────────────────────────────────────────

export async function searchDocuments(projectId: string, query: string) {
  const db = getDb();

  const results = await db.all<{
    id: string;
    title: string;
    icon: string | null;
    project_id: string | null;
    created_at: number;
    updated_at: number;
  }>(
    sql`SELECT d.id, d.title, d.icon, d.project_id, d.created_at, d.updated_at
        FROM fts_documents fts
        JOIN documents d ON d.id = fts.id
        WHERE fts_documents MATCH ${query + '*'}
          AND d.project_id = ${projectId}
        ORDER BY rank
        LIMIT 20`,
  );

  return results.map((r) => ({
    id: r.id,
    projectId: r.project_id,
    title: r.title,
    icon: r.icon,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  }));
}
