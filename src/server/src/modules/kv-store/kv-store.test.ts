/**
 * KV Store Integration Tests
 *
 * Uses Bun test runner + plain fetch.
 * API base: /api/kv-store
 *
 * Run: cd src/server && bun test src/modules/kv-store/kv-store.test.ts
 * Requires: server running at BASE_URL (bun dev)
 */

import { describe, test, expect, beforeAll, afterAll } from "bun:test";

// ── Config ────────────────────────────────────────────────────────────────────

const BASE_URL = process.env.TEST_BASE_URL ?? "http://127.0.0.1:18080";
const API = `${BASE_URL}/api/kv-store`;
const EMAIL = process.env.TEST_EMAIL ?? "admin@local.com";
const PASSWORD = process.env.TEST_PASSWORD ?? "admin123";

// ── State ─────────────────────────────────────────────────────────────────────

let accessToken = "";
let apiKey = "";
let apiKeyId = "";

// Track created variable IDs for cleanup
const createdIds: string[] = [];

// ── Helpers ───────────────────────────────────────────────────────────────────

function authHeader(type: "jwt" | "apikey" = "jwt"): Record<string, string> {
  if (type === "apikey") return { "X-API-Key": apiKey };
  return { Authorization: `Bearer ${accessToken}` };
}

function jsonHeaders(authType: "jwt" | "apikey" = "jwt"): Record<string, string> {
  return { "Content-Type": "application/json", ...authHeader(authType) };
}

async function createVar(body: Record<string, unknown>) {
  const res = await fetch(API, {
    method: "POST",
    headers: jsonHeaders(),
    body: JSON.stringify(body),
  });
  const data = (await res.json()) as any;
  if (res.ok && data?.id) createdIds.push(data.id);
  return { res, data };
}

async function deleteVar(id: string) {
  await fetch(`${API}/${id}`, {
    method: "DELETE",
    headers: authHeader(),
  });
}

// ── Setup / Teardown ──────────────────────────────────────────────────────────

beforeAll(async () => {
  // Login to get JWT
  const res = await fetch(`${BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ login: EMAIL, password: PASSWORD }),
  });
  expect(res.ok).toBe(true);
  const data = (await res.json()) as any;
  accessToken = data.access_token;
  expect(accessToken).toBeTruthy();

  // Create API key for auth tests
  const keyRes = await fetch(`${BASE_URL}/api/api-keys`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeader() },
    body: JSON.stringify({ name: "test-kv-store-key" }),
  });
  expect(keyRes.ok).toBe(true);
  const keyData = (await keyRes.json()) as any;
  apiKey = keyData.key;
  apiKeyId = keyData.id;
  expect(apiKey.startsWith("ltk_")).toBe(true);
});

afterAll(async () => {
  // Cleanup all created variables
  for (const id of createdIds) {
    await deleteVar(id);
  }

  // Delete test API key
  if (apiKeyId) {
    await fetch(`${BASE_URL}/api/api-keys/${apiKeyId}`, {
      method: "DELETE",
      headers: authHeader(),
    });
  }
});

// ── Create Variable ──────────────────────────────────────────────────────────

describe("KV Store — Create (POST /api/kv-store)", () => {
  test("create a string variable", async () => {
    const { res, data } = await createVar({
      key: "test.create.string",
      value: "hello world",
      type: "string",
    });

    expect(res.status).toBe(201);
    expect(data.id).toBeTruthy();
    expect(data.key).toBe("test.create.string");
    expect(data.value).toBe("hello world");
    expect(data.type).toBe("string");
    expect(data.createdAt).toBeTruthy();
    expect(data.updatedAt).toBeTruthy();
  });

  test("create a number variable", async () => {
    const { res, data } = await createVar({
      key: "test.create.number",
      value: "42",
      type: "number",
    });

    expect(res.status).toBe(201);
    expect(data.type).toBe("number");
    expect(data.value).toBe("42");
  });

  test("create a boolean variable", async () => {
    const { res, data } = await createVar({
      key: "test.create.bool",
      value: "true",
      type: "boolean",
    });

    expect(res.status).toBe(201);
    expect(data.type).toBe("boolean");
    expect(data.value).toBe("true");
  });

  test("create a JSON variable", async () => {
    const jsonValue = JSON.stringify({ foo: "bar", num: 123 });
    const { res, data } = await createVar({
      key: "test.create.json",
      value: jsonValue,
      type: "json",
    });

    expect(res.status).toBe(201);
    expect(data.type).toBe("json");
    expect(data.value).toBe(jsonValue);
  });

  test("create with TTL", async () => {
    const { res, data } = await createVar({
      key: "test.create.ttl",
      value: "temporary",
      ttl: 3600,
    });

    expect(res.status).toBe(201);
    expect(data.ttl).toBe(3600);
    expect(data.expiresAt).toBeTruthy();
    expect(data.expiresAt).toBeGreaterThan(Date.now());
  });

  test("create without auth → 401", async () => {
    const res = await fetch(API, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key: "test.noauth", value: "nope" }),
    });
    expect(res.status).toBe(401);
  });

  test("create with API key auth", async () => {
    const { res, data } = await createVar({
      key: "test.create.apikey",
      value: "via-apikey",
    });
    // Use apikey header for this one
    const res2 = await fetch(API, {
      method: "POST",
      headers: jsonHeaders("apikey"),
      body: JSON.stringify({ key: "test.create.apikey-auth", value: "via-apikey" }),
    });
    expect(res2.status).toBe(201);
    const data2 = (await res2.json()) as any;
    if (data2?.id) createdIds.push(data2.id);
  });

  test("create with invalid key (special chars) → 422", async () => {
    const res = await fetch(API, {
      method: "POST",
      headers: jsonHeaders(),
      body: JSON.stringify({ key: "invalid key!@#", value: "bad" }),
    });
    expect(res.status).toBe(422);
  });

  test("create with empty key → 422", async () => {
    const res = await fetch(API, {
      method: "POST",
      headers: jsonHeaders(),
      body: JSON.stringify({ key: "", value: "empty key" }),
    });
    expect(res.status).toBe(422);
  });

  test("create with missing value → 422", async () => {
    const res = await fetch(API, {
      method: "POST",
      headers: jsonHeaders(),
      body: JSON.stringify({ key: "test.novalue" }),
    });
    expect(res.status).toBe(422);
  });
});

// ── Auto-detect Type ─────────────────────────────────────────────────────────

describe("KV Store — Auto-detect Type", () => {
  test("auto-detect number type", async () => {
    const { res, data } = await createVar({
      key: "test.autodetect.number",
      value: "123.45",
    });
    expect(res.status).toBe(201);
    expect(data.type).toBe("number");
  });

  test("auto-detect boolean type (true)", async () => {
    const { res, data } = await createVar({
      key: "test.autodetect.bool-true",
      value: "true",
    });
    expect(res.status).toBe(201);
    expect(data.type).toBe("boolean");
  });

  test("auto-detect boolean type (false)", async () => {
    const { res, data } = await createVar({
      key: "test.autodetect.bool-false",
      value: "false",
    });
    expect(res.status).toBe(201);
    expect(data.type).toBe("boolean");
  });

  test("auto-detect json type (object)", async () => {
    const { res, data } = await createVar({
      key: "test.autodetect.json-obj",
      value: '{"a":1}',
    });
    expect(res.status).toBe(201);
    expect(data.type).toBe("json");
  });

  test("auto-detect json type (array)", async () => {
    const { res, data } = await createVar({
      key: "test.autodetect.json-arr",
      value: "[1,2,3]",
    });
    expect(res.status).toBe(201);
    expect(data.type).toBe("json");
  });

  test("auto-detect string type (fallback)", async () => {
    const { res, data } = await createVar({
      key: "test.autodetect.string",
      value: "just a plain string",
    });
    expect(res.status).toBe(201);
    expect(data.type).toBe("string");
  });
});

// ── Upsert Behavior ──────────────────────────────────────────────────────────

describe("KV Store — Upsert (POST same key)", () => {
  test("upsert updates existing variable's value", async () => {
    // Create first
    const { data: v1 } = await createVar({
      key: "test.upsert.key1",
      value: "original",
      type: "string",
    });
    expect(v1.value).toBe("original");

    // Upsert with same key → should update, not create new
    const res2 = await fetch(API, {
      method: "POST",
      headers: jsonHeaders(),
      body: JSON.stringify({ key: "test.upsert.key1", value: "updated" }),
    });
    expect(res2.status).toBe(201);
    const v2 = (await res2.json()) as any;

    expect(v2.id).toBe(v1.id); // Same ID — upserted, not duplicated
    expect(v2.value).toBe("updated");
  });

  test("upsert can change type", async () => {
    const { data: v1 } = await createVar({
      key: "test.upsert.type-change",
      value: "hello",
      type: "string",
    });
    expect(v1.type).toBe("string");

    const res2 = await fetch(API, {
      method: "POST",
      headers: jsonHeaders(),
      body: JSON.stringify({
        key: "test.upsert.type-change",
        value: "42",
        type: "number",
      }),
    });
    const v2 = (await res2.json()) as any;
    expect(v2.type).toBe("number");
    expect(v2.value).toBe("42");
  });
});

// ── Get Variable ─────────────────────────────────────────────────────────────

describe("KV Store — Get by ID (GET /api/kv-store/:id)", () => {
  let varId = "";

  beforeAll(async () => {
    const { data } = await createVar({
      key: "test.get.byid",
      value: "fetch-me",
      type: "string",
    });
    varId = data.id;
  });

  test("get by ID returns the variable", async () => {
    const res = await fetch(`${API}/${varId}`, {
      headers: authHeader(),
    });
    expect(res.status).toBe(200);
    const data = (await res.json()) as any;
    expect(data.id).toBe(varId);
    expect(data.key).toBe("test.get.byid");
    expect(data.value).toBe("fetch-me");
  });

  test("get non-existent ID → 400", async () => {
    const res = await fetch(`${API}/var_nonexistent999`, {
      headers: authHeader(),
    });
    expect(res.status).toBe(400);
  });

  test("get without auth → 401", async () => {
    const res = await fetch(`${API}/${varId}`);
    expect(res.status).toBe(401);
  });
});

// ── Get by Key ───────────────────────────────────────────────────────────────

describe("KV Store — Get by Key (GET /api/kv-store/by-key/:key)", () => {
  beforeAll(async () => {
    await createVar({
      key: "test.get.bykey",
      value: "key-lookup",
      type: "string",
    });
  });

  test("get by key returns the variable", async () => {
    const res = await fetch(`${API}/by-key/test.get.bykey`, {
      headers: authHeader(),
    });
    expect(res.status).toBe(200);
    const data = (await res.json()) as any;
    expect(data.key).toBe("test.get.bykey");
    expect(data.value).toBe("key-lookup");
  });

  test("get non-existent key → 400", async () => {
    const res = await fetch(`${API}/by-key/test.nonexistent.key`, {
      headers: authHeader(),
    });
    expect(res.status).toBe(400);
  });

  test("get by key without auth → 401", async () => {
    const res = await fetch(`${API}/by-key/test.get.bykey`);
    expect(res.status).toBe(401);
  });
});

// ── Update Variable ──────────────────────────────────────────────────────────

describe("KV Store — Update (PATCH /api/kv-store/:id)", () => {
  let varId = "";

  beforeAll(async () => {
    const { data } = await createVar({
      key: "test.update.target",
      value: "before-update",
      type: "string",
    });
    varId = data.id;
  });

  test("update value", async () => {
    const res = await fetch(`${API}/${varId}`, {
      method: "PATCH",
      headers: jsonHeaders(),
      body: JSON.stringify({ value: "after-update" }),
    });
    expect(res.status).toBe(200);
    const data = (await res.json()) as any;
    expect(data.value).toBe("after-update");
  });

  test("update type", async () => {
    const res = await fetch(`${API}/${varId}`, {
      method: "PATCH",
      headers: jsonHeaders(),
      body: JSON.stringify({ type: "number", value: "100" }),
    });
    expect(res.status).toBe(200);
    const data = (await res.json()) as any;
    expect(data.type).toBe("number");
    expect(data.value).toBe("100");
  });

  test("update with TTL", async () => {
    const res = await fetch(`${API}/${varId}`, {
      method: "PATCH",
      headers: jsonHeaders(),
      body: JSON.stringify({ ttl: 7200 }),
    });
    expect(res.status).toBe(200);
    const data = (await res.json()) as any;
    expect(data.ttl).toBe(7200);
    expect(data.expiresAt).toBeTruthy();
  });

  test("clear TTL by setting null", async () => {
    const res = await fetch(`${API}/${varId}`, {
      method: "PATCH",
      headers: jsonHeaders(),
      body: JSON.stringify({ ttl: null }),
    });
    expect(res.status).toBe(200);
    const data = (await res.json()) as any;
    expect(data.ttl).toBeNull();
    expect(data.expiresAt).toBeNull();
  });

  test("clear TTL by setting 0", async () => {
    // First set a TTL
    await fetch(`${API}/${varId}`, {
      method: "PATCH",
      headers: jsonHeaders(),
      body: JSON.stringify({ ttl: 300 }),
    });

    // Then clear it with 0
    const res = await fetch(`${API}/${varId}`, {
      method: "PATCH",
      headers: jsonHeaders(),
      body: JSON.stringify({ ttl: 0 }),
    });
    expect(res.status).toBe(200);
    const data = (await res.json()) as any;
    expect(data.ttl).toBeNull();
    expect(data.expiresAt).toBeNull();
  });

  test("update non-existent variable → 400", async () => {
    const res = await fetch(`${API}/var_nonexistent999`, {
      method: "PATCH",
      headers: jsonHeaders(),
      body: JSON.stringify({ value: "nope" }),
    });
    expect(res.status).toBe(400);
  });

  test("update without auth → 401", async () => {
    const res = await fetch(`${API}/${varId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ value: "no auth" }),
    });
    expect(res.status).toBe(401);
  });
});

// ── Delete Variable ──────────────────────────────────────────────────────────

describe("KV Store — Delete (DELETE /api/kv-store/:id)", () => {
  test("delete variable successfully", async () => {
    const { data } = await createVar({
      key: "test.delete.single",
      value: "delete-me",
    });

    const res = await fetch(`${API}/${data.id}`, {
      method: "DELETE",
      headers: authHeader(),
    });
    expect(res.status).toBe(200);
    const body = (await res.json()) as any;
    expect(body.id).toBe(data.id);
    expect(body.deleted).toBe(true);

    // Remove from tracked IDs since it's already deleted
    const idx = createdIds.indexOf(data.id);
    if (idx > -1) createdIds.splice(idx, 1);

    // Verify gone
    const getRes = await fetch(`${API}/${data.id}`, {
      headers: authHeader(),
    });
    expect(getRes.status).toBe(400);
  });

  test("delete by key successfully", async () => {
    const { data } = await createVar({
      key: "test.delete.bykey",
      value: "delete-me-bykey",
    });

    const res = await fetch(`${API}/by-key/test.delete.bykey`, {
      method: "DELETE",
      headers: authHeader(),
    });
    expect(res.status).toBe(200);
    const body = (await res.json()) as any;
    expect(body.key).toBe("test.delete.bykey");
    expect(body.deleted).toBe(true);

    // Remove from tracked IDs
    const idx = createdIds.indexOf(data.id);
    if (idx > -1) createdIds.splice(idx, 1);

    // Verify gone
    const getRes = await fetch(`${API}/by-key/test.delete.bykey`, {
      headers: authHeader(),
    });
    expect(getRes.status).toBe(400);
  });

  test("delete non-existent key by-key → 400", async () => {
    const res = await fetch(`${API}/by-key/test.delete.nonexistent`, {
      method: "DELETE",
      headers: authHeader(),
    });
    expect(res.status).toBe(400);
  });

  test("delete without auth → 401", async () => {
    const res = await fetch(`${API}/var_any`, {
      method: "DELETE",
    });
    expect(res.status).toBe(401);
  });
});

// ── Bulk Create ──────────────────────────────────────────────────────────────

describe("KV Store — Bulk Create (POST /api/kv-store/bulk)", () => {
  test("bulk create multiple variables", async () => {
    const res = await fetch(`${API}/bulk`, {
      method: "POST",
      headers: jsonHeaders(),
      body: JSON.stringify({
        variables: [
          { key: "test.bulk.a", value: "alpha" },
          { key: "test.bulk.b", value: "42", type: "number" },
          { key: "test.bulk.c", value: "true", type: "boolean" },
        ],
      }),
    });

    expect(res.status).toBe(201);
    const data = (await res.json()) as any;
    expect(data.items).toHaveLength(3);
    expect(data.meta.total).toBe(3);

    // Track for cleanup
    for (const item of data.items) {
      if (item?.id) createdIds.push(item.id);
    }

    // Verify values
    const keys = data.items.map((v: any) => v.key);
    expect(keys).toContain("test.bulk.a");
    expect(keys).toContain("test.bulk.b");
    expect(keys).toContain("test.bulk.c");
  });

  test("bulk create with empty array → 422", async () => {
    const res = await fetch(`${API}/bulk`, {
      method: "POST",
      headers: jsonHeaders(),
      body: JSON.stringify({ variables: [] }),
    });
    expect(res.status).toBe(422);
  });

  test("bulk create without auth → 401", async () => {
    const res = await fetch(`${API}/bulk`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        variables: [{ key: "test.bulk.noauth", value: "nope" }],
      }),
    });
    expect(res.status).toBe(401);
  });
});

// ── List Variables ───────────────────────────────────────────────────────────

describe("KV Store — List (GET /api/kv-store)", () => {
  beforeAll(async () => {
    // Create a few variables for listing tests
    await createVar({ key: "test.list.alpha", value: "alpha-val" });
    await createVar({ key: "test.list.beta", value: "beta-val" });
    await createVar({ key: "test.list.gamma", value: "100", type: "number" });
  });

  test("list returns items and meta", async () => {
    const res = await fetch(API, { headers: authHeader() });
    expect(res.status).toBe(200);
    const data = (await res.json()) as any;
    expect(Array.isArray(data.items)).toBe(true);
    expect(data.meta).toBeTruthy();
    expect(data.meta.total).toBeGreaterThanOrEqual(3);
    expect(typeof data.meta.page).toBe("number");
    expect(typeof data.meta.limit).toBe("number");
    expect(typeof data.meta.hasMore).toBe("boolean");
  });

  test("list with search filter", async () => {
    const res = await fetch(`${API}?search=test.list.alpha`, {
      headers: authHeader(),
    });
    expect(res.status).toBe(200);
    const data = (await res.json()) as any;
    expect(data.items.length).toBeGreaterThanOrEqual(1);
    expect(data.items[0].key).toContain("test.list.alpha");
  });

  test("list with sort by key asc", async () => {
    const res = await fetch(`${API}?search=test.list&sort=key&order=asc`, {
      headers: authHeader(),
    });
    expect(res.status).toBe(200);
    const data = (await res.json()) as any;
    const keys = data.items.map((v: any) => v.key);
    // alpha < beta < gamma
    const filtered = keys.filter((k: string) => k.startsWith("test.list."));
    for (let i = 1; i < filtered.length; i++) {
      expect(filtered[i] >= filtered[i - 1]).toBe(true);
    }
  });

  test("list with pagination", async () => {
    const res = await fetch(`${API}?page=1&limit=2`, {
      headers: authHeader(),
    });
    expect(res.status).toBe(200);
    const data = (await res.json()) as any;
    expect(data.items.length).toBeLessThanOrEqual(2);
    expect(data.meta.page).toBe(1);
    expect(data.meta.limit).toBe(2);
  });

  test("list without auth → 401", async () => {
    const res = await fetch(API);
    expect(res.status).toBe(401);
  });
});

// ── TTL / Expiry ─────────────────────────────────────────────────────────────

describe("KV Store — TTL Expiry", () => {
  test("variable with very short TTL expires and returns 400", async () => {
    const { data } = await createVar({
      key: "test.ttl.expire-fast",
      value: "ephemeral",
      ttl: 1, // 1 second
    });
    expect(data.ttl).toBe(1);
    expect(data.expiresAt).toBeTruthy();

    // Wait for expiry
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // Should be expired now
    const res = await fetch(`${API}/${data.id}`, {
      headers: authHeader(),
    });
    expect(res.status).toBe(400);
    const body = (await res.json()) as any;
    expect(body.error).toBe("not_found");

    // Also expired by key lookup
    const res2 = await fetch(`${API}/by-key/test.ttl.expire-fast`, {
      headers: authHeader(),
    });
    expect(res2.status).toBe(400);

    // Remove from tracked IDs (expired, but still in DB)
    const idx = createdIds.indexOf(data.id);
    if (idx > -1) createdIds.splice(idx, 1);
  });

  test("variable without TTL never expires", async () => {
    const { data } = await createVar({
      key: "test.ttl.no-expiry",
      value: "persistent",
    });
    expect(data.ttl).toBeNull();
    expect(data.expiresAt).toBeNull();

    // Should still be accessible
    const res = await fetch(`${API}/${data.id}`, {
      headers: authHeader(),
    });
    expect(res.status).toBe(200);
  });

  test("expired variables are excluded from list", async () => {
    await createVar({
      key: "test.ttl.list-hidden",
      value: "should-vanish",
      ttl: 1,
    });

    // Wait for expiry
    await new Promise((resolve) => setTimeout(resolve, 1500));

    const res = await fetch(`${API}?search=test.ttl.list-hidden`, {
      headers: authHeader(),
    });
    const data = (await res.json()) as any;
    const found = data.items.find((v: any) => v.key === "test.ttl.list-hidden");
    expect(found).toBeFalsy(); // Should not appear in list
  });
});

// ── Flush All ────────────────────────────────────────────────────────────────

describe("KV Store — Flush All (DELETE /api/kv-store/flush)", () => {
  test("flush deletes all variables and returns count", async () => {
    // Create some disposable variables
    await createVar({ key: "test.flush.x", value: "x" });
    await createVar({ key: "test.flush.y", value: "y" });

    const res = await fetch(`${API}/flush`, {
      method: "DELETE",
      headers: authHeader(),
    });
    expect(res.status).toBe(200);
    const data = (await res.json()) as any;
    expect(data.deleted).toBeGreaterThanOrEqual(2);

    // Clear tracked IDs since everything is flushed
    createdIds.length = 0;

    // Verify list is empty
    const listRes = await fetch(API, { headers: authHeader() });
    const listData = (await listRes.json()) as any;
    expect(listData.meta.total).toBe(0);
  });

  test("flush without auth → 401", async () => {
    const res = await fetch(`${API}/flush`, {
      method: "DELETE",
    });
    expect(res.status).toBe(401);
  });
});
