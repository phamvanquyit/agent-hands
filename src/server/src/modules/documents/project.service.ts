import { eq, desc, sql } from "drizzle-orm";
import { getDb } from "../../common/db/client.js";
import { projects } from "../../common/db/schema.js";
import { genId, now } from "../../common/utils.js";
import type { CreateProjectBody, UpdateProjectBody } from "./project.schema.js";

const documentCountSq = sql<number>`(SELECT COUNT(*) FROM documents WHERE documents.project_id = projects.id)`.as("documentCount");

export async function listProjects() {
  const db = getDb();
  return db
    .select({
      id: projects.id,
      name: projects.name,
      description: projects.description,
      icon: projects.icon,
      createdBy: projects.createdBy,
      createdAt: projects.createdAt,
      updatedAt: projects.updatedAt,
      documentCount: documentCountSq,
    })
    .from(projects)
    .orderBy(desc(projects.updatedAt))
    .all();
}

export async function getProjectById(id: string) {
  const db = getDb();
  return db
    .select({
      id: projects.id,
      name: projects.name,
      description: projects.description,
      icon: projects.icon,
      createdBy: projects.createdBy,
      createdAt: projects.createdAt,
      updatedAt: projects.updatedAt,
      documentCount: documentCountSq,
    })
    .from(projects)
    .where(eq(projects.id, id))
    .get() ?? null;
}

export async function createProject(data: CreateProjectBody, userId: string) {
  const db = getDb();
  const id = genId("prj");
  const ts = now();

  await db.insert(projects).values({
    id,
    name: data.name,
    description: data.description ?? null,
    icon: data.icon ?? null,
    createdBy: userId,
    createdAt: ts,
    updatedAt: ts,
  });

  return getProjectById(id);
}

export async function updateProject(id: string, data: UpdateProjectBody) {
  const db = getDb();
  const ts = now();
  const updates: Record<string, unknown> = { updatedAt: ts };

  if (data.name !== undefined) updates.name = data.name;
  if (data.description !== undefined) updates.description = data.description;
  if (data.icon !== undefined) updates.icon = data.icon;

  await db.update(projects).set(updates).where(eq(projects.id, id));
  return getProjectById(id);
}

export async function deleteProject(id: string) {
  const db = getDb();
  await db.delete(projects).where(eq(projects.id, id));
  return true;
}
