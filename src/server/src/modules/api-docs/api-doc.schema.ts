import { z } from "zod";

// ── Endpoint schema ─────────────────────────────────────────────────────────

export const endpointSchema = z.object({
  method: z.enum(["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD"]),
  path: z.string(),
  summary: z.string(),
  auth: z.enum(["jwt", "apikey", "both", "none"]),
  body: z.string().optional(),
  response: z.string().optional(),
  queryParams: z.string().optional(),
  notes: z.string().optional(),
  jsExample: z.string().optional(),
});

export const apiSectionSchema = z.object({
  id: z.string(),
  label: z.string(),
  description: z.string(),
  basePrefix: z.string(),
  endpoints: z.array(endpointSchema),
});

export const apiDocsResponseSchema = z.object({
  introSections: z.array(apiSectionSchema),
  apiSections: z.array(apiSectionSchema),
});

export type Endpoint = z.infer<typeof endpointSchema>;
export type ApiSection = z.infer<typeof apiSectionSchema>;
export type ApiDocsResponse = z.infer<typeof apiDocsResponseSchema>;
