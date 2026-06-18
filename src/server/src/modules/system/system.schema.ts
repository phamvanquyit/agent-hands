import { z } from "zod";

export const versionResponseSchema = z.object({
  current: z.string(),
  latest: z.string().nullable(),
  hasUpdate: z.boolean(),
  channel: z.enum(["stable", "dev"]),
  isPreRelease: z.boolean(),
  installCommand: z.string().nullable(),
  checkedAt: z.number(),
});

export type VersionResponse = z.infer<typeof versionResponseSchema>;



// ── System Info ──────────────────────────────────────────────────────────────

const cpuInfoSchema = z.object({
  model: z.string(),
  cores: z.number(),
  usage: z.number(), // percentage 0-100
});

const memoryInfoSchema = z.object({
  total: z.number(), // bytes
  used: z.number(), // bytes
  free: z.number(), // bytes
  usage: z.number(), // percentage 0-100
});

const diskInfoSchema = z.object({
  total: z.number(), // bytes
  used: z.number(), // bytes
  free: z.number(), // bytes
  usage: z.number(), // percentage 0-100
  mount: z.string(),
});

const processInfoSchema = z.object({
  pid: z.number(),
  uptime: z.number(), // seconds
  memoryRss: z.number(), // bytes
  memoryHeap: z.number(), // bytes
  bunVersion: z.string(),
  nodeVersion: z.string(),
});

const osInfoSchema = z.object({
  platform: z.string(),
  arch: z.string(),
  hostname: z.string(),
  release: z.string(),
  uptime: z.number(), // seconds
});

export const systemInfoResponseSchema = z.object({
  cpu: cpuInfoSchema,
  memory: memoryInfoSchema,
  disk: diskInfoSchema,
  process: processInfoSchema,
  os: osInfoSchema,
  timestamp: z.number(),
});

export type SystemInfoResponse = z.infer<typeof systemInfoResponseSchema>;
