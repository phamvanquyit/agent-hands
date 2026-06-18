import { customAlphabet } from "nanoid";

const alpha = customAlphabet("0123456789abcdefghijklmnopqrstuvwxyz", 16);

/** Generate a typed semantic ID */
export function genId(
  prefix:
    | "usr"
    | "doc"
    | "blk"
    | "db"
    | "row"
    | "file"
    | "key"
    | "var"
    | "dtb"
    | "dtr"
    | "col"
    | "prj"
    | "bkt"
    | "obj"
    | "sak"
    | "dbs"
    | "vpr"
    | "vns"
    | "mts"
    | "mtl"
    | "mtlg"
    | "dap"
    | "dal"
    | "llm"
    | "bpr",
): string {
  return `${prefix}_${alpha()}`;
}

/** Generate an API key — ltk_ prefix + 32 chars */
export function genApiKey(): string {
  const body = customAlphabet("0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz", 32)();
  return `ltk_${body}`;
}

/** Generate an MCP server key — msk_ prefix + 32 chars */
export function genMcpServerKey(): string {
  const body = customAlphabet("0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz", 32)();
  return `msk_${body}`;
}

export function now(): number {
  return Date.now();
}

export function paginate<T>(
  allItems: T[],
  page: number,
  limit: number,
): { items: T[]; meta: { total: number; page: number; limit: number; hasMore: boolean } } {
  const total = allItems.length;
  const start = (page - 1) * limit;
  const items = allItems.slice(start, start + limit);
  return {
    items,
    meta: { total, page, limit, hasMore: start + limit < total },
  };
}

/** Resolve the public base URL for the API server.
 *  Uses API_BASE_URL env var (configured domain) or falls back to localhost. */
export function getBaseUrl(): string {
  return process.env.API_BASE_URL ?? `http://localhost:${process.env.PORT ?? 18080}`;
}
