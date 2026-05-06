import { z } from "zod";

export const createVariableNamespaceBodySchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().max(1000).optional(),
  icon: z.string().max(64).optional(),
});

export const updateVariableNamespaceBodySchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().max(1000).nullable().optional(),
  icon: z.string().max(64).nullable().optional(),
});

export type CreateVariableNamespaceBody = z.infer<typeof createVariableNamespaceBodySchema>;
export type UpdateVariableNamespaceBody = z.infer<typeof updateVariableNamespaceBodySchema>;
