import { z } from "zod";

// ── Params ──────────────────────────────────────────────────────────────────────

export const projectDocParamsSchema = z.object({
  projectId: z.string(),
});

export const docIdParamsSchema = z.object({
  projectId: z.string(),
  id: z.string(),
});

// ── Create Document ─────────────────────────────────────────────────────────────

export const createDocumentBodySchema = z.object({
  title: z.string().min(1).max(500).optional().default("Untitled"),
  icon: z.string().max(64).nullable().optional(),
  content: z.string().optional().default(""),  // markdown text
});

// ── Update Document ─────────────────────────────────────────────────────────────

export const updateDocumentBodySchema = z.object({
  title: z.string().min(1).max(500).optional(),
  icon: z.string().max(64).nullable().optional(),
  cover: z.string().max(2000).nullable().optional(),
  content: z.string().optional(),  // markdown text
});

// ── Search ──────────────────────────────────────────────────────────────────────

export const searchDocumentsQuerySchema = z.object({
  q: z.string().min(1).max(200),
});

// ── Inferred Types ──────────────────────────────────────────────────────────────

export type CreateDocumentBody = z.infer<typeof createDocumentBodySchema>;
export type UpdateDocumentBody = z.infer<typeof updateDocumentBodySchema>;
export type SearchDocumentsQuery = z.infer<typeof searchDocumentsQuerySchema>;
