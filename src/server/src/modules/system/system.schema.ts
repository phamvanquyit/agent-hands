import { z } from "zod";

export const versionResponseSchema = z.object({
  current: z.string(),
  latest: z.string().nullable(),
  hasUpdate: z.boolean(),
  checkedAt: z.number(),
});

export type VersionResponse = z.infer<typeof versionResponseSchema>;

export const updateResponseSchema = z.object({
  ok: z.boolean(),
  message: z.string(),
});

export type UpdateResponse = z.infer<typeof updateResponseSchema>;
