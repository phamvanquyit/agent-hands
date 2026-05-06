import { z } from "zod";

// ── Database CRUD Schemas ───────────────────────────────────────────────────────

export const createDatabaseBodySchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().max(1000).optional(),
  icon: z.string().max(32).optional(),
});

export const updateDatabaseBodySchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().max(1000).nullable().optional(),
  icon: z.string().max(32).nullable().optional(),
});

// ── Inferred Types ──────────────────────────────────────────────────────────────

export type CreateDatabaseBody = z.infer<typeof createDatabaseBodySchema>;
export type UpdateDatabaseBody = z.infer<typeof updateDatabaseBodySchema>;
