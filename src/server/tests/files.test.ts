/**
 * File Server Integration Tests
 *
 * Dùng Bun test runner + fetch thuần (không cần S3 client).
 * API hoạt động theo giao thức S3-compatible: PUT/GET/DELETE /files/:key
 *
 * Chạy: bun test src/server/tests/files.test.ts
 * Yêu cầu: server đang chạy ở BASE_URL (bun dev:server)
 */

import { describe, test, expect, beforeAll, afterAll } from "bun:test";

// ── Config ────────────────────────────────────────────────────────────────────

const BASE_URL = process.env.TEST_BASE_URL ?? "http://127.0.0.1:18080";
const EMAIL = process.env.TEST_EMAIL ?? "admin@moro.local";
const PASSWORD = process.env.TEST_PASSWORD ?? "admin123";

// ── State ─────────────────────────────────────────────────────────────────────

let accessToken = "";
let apiKey = "";
let apiKeyId = "";

// ── Helpers ───────────────────────────────────────────────────────────────────

function authHeader(type: "jwt" | "apikey" = "jwt"): Record<string, string> {
  if (type === "apikey") return { "X-API-Key": apiKey };
  return { Authorization: `Bearer ${accessToken}` };
}

async function del(key: string) {
  await fetch(`${BASE_URL}/files/${key}`, {
    method: "DELETE",
    headers: authHeader(),
  });
}

// ── Setup / Teardown ──────────────────────────────────────────────────────────

beforeAll(async () => {
  // Login để lấy JWT
  const res = await fetch(`${BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
  });
  expect(res.ok).toBe(true);
  const data = await res.json() as any;
  accessToken = data.access_token;
  expect(accessToken).toBeTruthy();

  // Tạo API key để test auth via X-API-Key
  const keyRes = await fetch(`${BASE_URL}/api/api-keys`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeader() },
    body: JSON.stringify({ name: "test-key" }),
  });
  expect(keyRes.ok).toBe(true);
  const keyData = await keyRes.json() as any;
  apiKey = keyData.data.key;
  apiKeyId = keyData.data.id;
  expect(apiKey.startsWith("ltk_")).toBe(true);
});

afterAll(async () => {
  // Xóa API key test
  if (apiKeyId) {
    await fetch(`${BASE_URL}/api/api-keys/${apiKeyId}`, {
      method: "DELETE",
      headers: authHeader(),
    });
  }
});

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("File Server — Upload (PUT)", () => {
  test("upload text file", async () => {
    const key = "test/hello.txt";
    const body = "Hello, Moro LLM Toolkit!";

    const res = await fetch(`${BASE_URL}/files/${key}`, {
      method: "PUT",
      headers: { "Content-Type": "text/plain", ...authHeader() },
      body,
    });

    expect(res.status).toBe(200);
    const data = await res.json() as any;
    expect(data.data.key).toBe(key);
    expect(data.data.size).toBe(new TextEncoder().encode(body).length);

    await del(key); // cleanup
  });

  test("upload binary (PNG image)", async () => {
    const key = "test/pixel.png";
    // 1x1 transparent PNG
    const png = new Uint8Array([
      0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, // PNG header
      0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44, 0x52, // IHDR chunk
      0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
      0x08, 0x06, 0x00, 0x00, 0x00, 0x1f, 0x15, 0xc4,
      0x89, 0x00, 0x00, 0x00, 0x0a, 0x49, 0x44, 0x41,
      0x54, 0x78, 0x9c, 0x62, 0x00, 0x01, 0x00, 0x00,
      0x05, 0x00, 0x01, 0x0d, 0x0a, 0x2d, 0xb4, 0x00,
      0x00, 0x00, 0x00, 0x49, 0x45, 0x4e, 0x44, 0xae,
      0x42, 0x60, 0x82,
    ]);

    const res = await fetch(`${BASE_URL}/files/${key}`, {
      method: "PUT",
      headers: { "Content-Type": "image/png", ...authHeader() },
      body: png,
    });

    expect(res.status).toBe(200);
    const data = await res.json() as any;
    expect(data.data.key).toBe(key);

    await del(key);
  });

  test("upload JSON file", async () => {
    const key = "test/config.json";
    const json = JSON.stringify({ version: 1, name: "test" });

    const res = await fetch(`${BASE_URL}/files/${key}`, {
      method: "PUT",
      headers: { "Content-Type": "application/octet-stream", ...authHeader() },
      body: json,
    });

    expect(res.status).toBe(200);
    await del(key);
  });

  test("upload upsert — upload lại cùng key thì size được cập nhật", async () => {
    const key = "test/upsert.txt";

    await fetch(`${BASE_URL}/files/${key}`, {
      method: "PUT",
      headers: { "Content-Type": "text/plain", ...authHeader() },
      body: "v1",
    });

    const v2Body = "version 2 content longer";
    const res = await fetch(`${BASE_URL}/files/${key}`, {
      method: "PUT",
      headers: { "Content-Type": "text/plain", ...authHeader() },
      body: v2Body,
    });

    expect(res.status).toBe(200);
    const data = await res.json() as any;
    expect(data.data.size).toBe(new TextEncoder().encode(v2Body).length);

    await del(key);
  });

  test("upload không có auth → 401", async () => {
    const res = await fetch(`${BASE_URL}/files/test/no-auth.txt`, {
      method: "PUT",
      headers: { "Content-Type": "text/plain" },
      body: "no auth",
    });
    expect(res.status).toBe(401);
  });

  test("upload auth bằng API key (X-API-Key)", async () => {
    const key = "test/via-apikey.txt";

    const res = await fetch(`${BASE_URL}/files/${key}`, {
      method: "PUT",
      headers: { "Content-Type": "text/plain", ...authHeader("apikey") },
      body: "uploaded via api key",
    });

    expect(res.status).toBe(200);
    await del(key);
  });
});

// ─────────────────────────────────────────────────────────────────────────────

describe("File Server — Download (GET)", () => {
  const key = "test/download-test.txt";
  const content = "Download me please!";

  beforeAll(async () => {
    await fetch(`${BASE_URL}/files/${key}`, {
      method: "PUT",
      headers: { "Content-Type": "text/plain", ...authHeader() },
      body: content,
    });
  });

  afterAll(async () => { await del(key); });

  test("download file — content đúng", async () => {
    const res = await fetch(`${BASE_URL}/files/${key}`, {
      headers: authHeader(),
    });

    expect(res.status).toBe(200);
    const text = await res.text();
    expect(text).toBe(content);
  });

  test("download file — Content-Type đúng", async () => {
    const res = await fetch(`${BASE_URL}/files/${key}`, {
      headers: authHeader(),
    });
    expect(res.headers.get("content-type")).toContain("text/plain");
  });

  test("text file → Content-Disposition: inline", async () => {
    const res = await fetch(`${BASE_URL}/files/${key}`, {
      headers: authHeader(),
    });
    expect(res.headers.get("content-disposition")).toBe("inline");
  });

  test("?download=1 → Content-Disposition: attachment", async () => {
    const res = await fetch(`${BASE_URL}/files/${key}?download=1`, {
      headers: authHeader(),
    });
    const disposition = res.headers.get("content-disposition") ?? "";
    expect(disposition).toContain("attachment");
    expect(disposition).toContain("download-test.txt");
  });

  test("download file không tồn tại → 404", async () => {
    const res = await fetch(`${BASE_URL}/files/test/not-exist-xxx.txt`, {
      headers: authHeader(),
    });
    expect(res.status).toBe(404);
  });

  test("download không có auth → 401", async () => {
    const res = await fetch(`${BASE_URL}/files/${key}`);
    expect(res.status).toBe(401);
  });

  test("image file → Content-Disposition: inline", async () => {
    const imgKey = "test/inline-check.png";
    const png = new Uint8Array([
      0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
    ]);

    await fetch(`${BASE_URL}/files/${imgKey}`, {
      method: "PUT",
      headers: { "Content-Type": "image/png", ...authHeader() },
      body: png,
    });

    const res = await fetch(`${BASE_URL}/files/${imgKey}`, {
      headers: authHeader(),
    });
    expect(res.headers.get("content-disposition")).toBe("inline");
    await del(imgKey);
  });
});

// ─────────────────────────────────────────────────────────────────────────────

describe("File Server — Delete (DELETE)", () => {
  test("xóa file thành công → 204", async () => {
    const key = "test/to-delete.txt";
    await fetch(`${BASE_URL}/files/${key}`, {
      method: "PUT",
      headers: { "Content-Type": "text/plain", ...authHeader() },
      body: "delete me",
    });

    const res = await fetch(`${BASE_URL}/files/${key}`, {
      method: "DELETE",
      headers: authHeader(),
    });
    expect(res.status).toBe(204);

    // Verify gone
    const getRes = await fetch(`${BASE_URL}/files/${key}`, {
      headers: authHeader(),
    });
    expect(getRes.status).toBe(404);
  });

  test("xóa không có auth → 401", async () => {
    const res = await fetch(`${BASE_URL}/files/test/any.txt`, {
      method: "DELETE",
    });
    expect(res.status).toBe(401);
  });
});

// ─────────────────────────────────────────────────────────────────────────────

describe("File Server — List (GET /files)", () => {
  const keys = ["test/list-a.txt", "test/list-b.txt", "other/list-c.txt"];

  beforeAll(async () => {
    for (const k of keys) {
      await fetch(`${BASE_URL}/files/${k}`, {
        method: "PUT",
        headers: { "Content-Type": "text/plain", ...authHeader() },
        body: `content of ${k}`,
      });
    }
  });

  afterAll(async () => {
    for (const k of keys) await del(k);
  });

  test("list tất cả files", async () => {
    const res = await fetch(`${BASE_URL}/files`, {
      headers: authHeader(),
    });
    expect(res.status).toBe(200);
    const data = await res.json() as any;
    expect(Array.isArray(data.objects)).toBe(true);
    expect(data.total).toBeGreaterThanOrEqual(3);
  });

  test("list với prefix filter", async () => {
    const res = await fetch(`${BASE_URL}/files?prefix=test/list`, {
      headers: authHeader(),
    });
    const data = await res.json() as any;
    // Chỉ trả về 2 file với prefix test/list
    const filtered = data.objects.filter((f: any) => f.key.startsWith("test/list"));
    expect(filtered.length).toBe(2);
  });

  test("list không có auth → 401", async () => {
    const res = await fetch(`${BASE_URL}/files`);
    expect(res.status).toBe(401);
  });
});

// ─────────────────────────────────────────────────────────────────────────────

describe("File Server — Signed URL", () => {
  const key = "test/signed-file.txt";
  const content = "Secret content via signed URL";

  beforeAll(async () => {
    await fetch(`${BASE_URL}/files/${key}`, {
      method: "PUT",
      headers: { "Content-Type": "text/plain", ...authHeader() },
      body: content,
    });
  });

  afterAll(async () => { await del(key); });

  test("tạo signed URL thành công", async () => {
    const res = await fetch(`${BASE_URL}/files/sign`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeader() },
      body: JSON.stringify({ key, expiresIn: 300 }),
    });

    expect(res.status).toBe(200);
    const data = await res.json() as any;
    expect(data.data.url).toContain("/files/test/signed-file.txt");
    expect(data.data.url).toContain("token=");
    expect(data.data.url).toContain("expires=");
    expect(data.data.expiresAt).toBeTruthy();
  });

  test("dùng signed URL download — không cần auth header", async () => {
    // 1. Tạo signed URL
    const signRes = await fetch(`${BASE_URL}/files/sign`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeader() },
      body: JSON.stringify({ key, expiresIn: 60 }),
    });
    const { data } = await signRes.json() as any;

    // 2. Download bằng signed URL, không có auth header
    const res = await fetch(data.url); // no auth!
    expect(res.status).toBe(200);
    const text = await res.text();
    expect(text).toBe(content);
  });

  test("signed URL với token sai → 403", async () => {
    const res = await fetch(
      `${BASE_URL}/files/${key}?token=invalidtoken123&expires=${Date.now() + 60_000}`,
    );
    expect(res.status).toBe(403);
  });

  test("signed URL hết hạn → 403", async () => {
    // expires trong quá khứ
    const signRes = await fetch(`${BASE_URL}/files/sign`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeader() },
      body: JSON.stringify({ key, expiresIn: 1 }),
    });
    const { data } = await signRes.json() as any;

    // Giả expires đã qua
    const expiredUrl = data.url.replace(/expires=\d+/, `expires=${Date.now() - 1000}`);
    const res = await fetch(expiredUrl);
    expect(res.status).toBe(403);
  });

  test("signed URL cho file không tồn tại → 404", async () => {
    const res = await fetch(`${BASE_URL}/files/sign`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeader() },
      body: JSON.stringify({ key: "test/nonexistent-xyz.txt" }),
    });
    expect(res.status).toBe(404);
  });

  test("tạo signed URL không có auth → 401", async () => {
    const res = await fetch(`${BASE_URL}/files/sign`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key }),
    });
    expect(res.status).toBe(401);
  });
});
