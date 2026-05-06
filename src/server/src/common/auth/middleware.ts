import type { FastifyRequest, FastifyReply } from "fastify";
import { verifyToken } from "./jwt.js";
import { getDb } from "../db/client.js";
import { apiKeys } from "../db/schema.js";
import { eq } from "drizzle-orm";

export interface AuthContext {
  userId: string;
  role: string;
  via: "jwt" | "apikey";
}

declare module "fastify" {
  interface FastifyRequest {
    auth?: AuthContext;
  }
}

/** Hash an API key with SHA-256 (hex) */
async function hashApiKey(raw: string): Promise<string> {
  const hasher = new Bun.CryptoHasher("sha256");
  hasher.update(raw);
  return hasher.digest("hex");
}

/** Resolve auth from API key (ltk_xxx) */
async function resolveApiKey(rawKey: string): Promise<AuthContext | null> {
  if (!rawKey.startsWith("ltk_")) return null;

  const keyHash = await hashApiKey(rawKey);
  const db = getDb();

  const record = await db
    .select()
    .from(apiKeys)
    .where(eq(apiKeys.keyHash, keyHash))
    .get();

  if (!record) return null;

  // Check expiration
  if (record.expiresAt && record.expiresAt < Date.now()) return null;

  // Update last_used_at (fire-and-forget)
  db.update(apiKeys)
    .set({ lastUsedAt: Date.now() })
    .where(eq(apiKeys.id, record.id))
    .run();

  return { userId: record.userId, role: "member", via: "apikey" };
}

/**
 * Extract auth from:
 *   1. Authorization: Bearer <jwt>
 *   2. Authorization: Bearer <api-key>  (prefix "ltk_")
 *   3. X-API-Key: <api-key>
 */
export async function resolveAuth(req: FastifyRequest): Promise<AuthContext | null> {
  // 1. Check X-API-Key header first
  const xApiKey = req.headers["x-api-key"];
  if (xApiKey && typeof xApiKey === "string") {
    return resolveApiKey(xApiKey);
  }

  // 2. Check Authorization: Bearer ...
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) return null;

  const token = authHeader.slice(7);
  if (!token) return null;

  // 3. If token starts with ltk_ → API key
  if (token.startsWith("ltk_")) {
    return resolveApiKey(token);
  }

  // 4. Otherwise → JWT
  try {
    const payload = await verifyToken(token);
    if (payload.type !== "access") return null;
    return { userId: payload.sub!, role: payload.role, via: "jwt" };
  } catch {
    return null;
  }
}

/** Fastify preHandler — requires authenticated request */
export async function requireAuth(req: FastifyRequest, reply: FastifyReply) {
  const auth = await resolveAuth(req);
  if (!auth) {
    const err = new Error("Authentication required") as Error & { statusCode: number };
    err.statusCode = 401;
    throw err;
  }
  req.auth = auth;
}

/** Fastify preHandler — requires superadmin or admin role */
export async function requireAdmin(req: FastifyRequest, reply: FastifyReply) {
  await requireAuth(req, reply);
  if (req.auth!.role !== "superadmin" && req.auth!.role !== "admin") {
    const err = new Error("Admin access required") as Error & { statusCode: number };
    err.statusCode = 403;
    throw err;
  }
}

/** Fastify preHandler — requires superadmin role */
export async function requireSuperAdmin(req: FastifyRequest, reply: FastifyReply) {
  await requireAuth(req, reply);
  if (req.auth!.role !== "superadmin") {
    const err = new Error("Superadmin access required") as Error & { statusCode: number };
    err.statusCode = 403;
    throw err;
  }
}

