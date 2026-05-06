/**
 * MCP Client Servers — Integration Tests
 *
 * Test toàn bộ CRUD + connect/disconnect flow của /api/mcp-servers.
 *
 * Chạy: bun test src/server/tests/mcp-servers.test.ts
 * Yêu cầu: server đang chạy ở BASE_URL (bun dev:server)
 */

import { describe, test, expect, beforeAll, afterAll } from "bun:test";

// ── Config ────────────────────────────────────────────────────────────────────

const BASE_URL = process.env.TEST_BASE_URL ?? "http://127.0.0.1:18080";
const EMAIL    = process.env.TEST_EMAIL    ?? "admin@moro.local";
const PASSWORD = process.env.TEST_PASSWORD ?? "admin123";

// ── State ─────────────────────────────────────────────────────────────────────

let accessToken = "";
let createdId   = "";

// ── Helpers ───────────────────────────────────────────────────────────────────

function auth(): Record<string, string> {
  return { Authorization: `Bearer ${accessToken}` };
}

async function json(res: Response) {
  return res.json() as Promise<any>;
}

async function apiPost(path: string, body: unknown) {
  return fetch(`${BASE_URL}/api${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...auth() },
    body: JSON.stringify(body),
  });
}

async function apiPatch(path: string, body: unknown) {
  return fetch(`${BASE_URL}/api${path}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", ...auth() },
    body: JSON.stringify(body),
  });
}

async function apiGet(path: string) {
  return fetch(`${BASE_URL}/api${path}`, { headers: auth() });
}

async function apiDelete(path: string) {
  return fetch(`${BASE_URL}/api${path}`, { method: "DELETE", headers: auth() });
}

// ── Setup ─────────────────────────────────────────────────────────────────────

beforeAll(async () => {
  const res = await fetch(`${BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
  });
  expect(res.ok).toBe(true);
  const data = await json(res);
  accessToken = data.data.access_token;
  expect(accessToken).toBeTruthy();
});

afterAll(async () => {
  // Cleanup: xóa server nếu còn sót
  if (createdId) {
    await apiDelete(`/mcp-servers/${createdId}`);
  }
});

// ── CRUD ──────────────────────────────────────────────────────────────────────

describe("MCP Servers — CRUD", () => {
  test("GET /mcp-servers — list rỗng hoặc array", async () => {
    const res = await apiGet("/mcp-servers");
    expect(res.status).toBe(200);
    const data = await json(res);
    expect(Array.isArray(data.data)).toBe(true);
  });

  test("POST /mcp-servers — tạo stdio server", async () => {
    const res = await apiPost("/mcp-servers", {
      name: "test-mcp-stdio",
      transport: "stdio",
      command: "npx",
      args: ["mcp-remote", "https://remote.mcp.server/sse"],
      env: { TEST_VAR: "hello" },
      autoConnect: false,
    });

    expect(res.status).toBe(200);
    const data = await json(res);
    expect(data.data.id).toBeTruthy();
    expect(data.data.name).toBe("test-mcp-stdio");
    expect(data.data.transport).toBe("stdio");
    expect(data.data.command).toBe("npx");
    expect(data.data.status).toBe("disconnected");
    expect(data.data.connected).toBeUndefined(); // chỉ có trong list endpoint

    createdId = data.data.id;
  });

  test("POST /mcp-servers — tạo SSE server", async () => {
    const res = await apiPost("/mcp-servers", {
      name: "test-mcp-sse",
      transport: "sse",
      url: "https://example.com/sse",
      autoConnect: false,
    });

    expect(res.status).toBe(200);
    const data = await json(res);
    expect(data.data.transport).toBe("sse");
    expect(data.data.url).toBe("https://example.com/sse");

    // Cleanup
    await apiDelete(`/mcp-servers/${data.data.id}`);
  });

  test("GET /mcp-servers — list có server vừa tạo, có connected + toolCount", async () => {
    const res = await apiGet("/mcp-servers");
    const data = await json(res);

    const found = data.data.find((s: any) => s.id === createdId);
    expect(found).toBeTruthy();
    expect(found.connected).toBe(false);
    expect(typeof found.toolCount).toBe("number");
  });

  test("GET /mcp-servers/:id — lấy server theo id", async () => {
    const res = await apiGet(`/mcp-servers/${createdId}`);
    expect(res.status).toBe(200);
    const data = await json(res);
    expect(data.data.id).toBe(createdId);
    expect(data.data.name).toBe("test-mcp-stdio");
  });

  test("GET /mcp-servers/:id — id không tồn tại → 404", async () => {
    const res = await apiGet("/mcp-servers/non-existent-id-xyz");
    expect(res.status).toBe(404);
  });

  test("PATCH /mcp-servers/:id — đổi tên", async () => {
    const res = await apiPatch(`/mcp-servers/${createdId}`, {
      name: "test-mcp-stdio-renamed",
    });
    expect(res.status).toBe(200);
    const data = await json(res);
    expect(data.data.name).toBe("test-mcp-stdio-renamed");

    // Rename lại để cleanup dễ
    await apiPatch(`/mcp-servers/${createdId}`, { name: "test-mcp-stdio" });
  });

  test("PATCH /mcp-servers/:id — cập nhật args", async () => {
    const res = await apiPatch(`/mcp-servers/${createdId}`, {
      args: ["mcp-remote", "https://new.server/sse"],
    });
    expect(res.status).toBe(200);
    const data = await json(res);
    // args được lưu dưới dạng JSON string trong DB
    const parsed = JSON.parse(data.data.args);
    expect(parsed).toEqual(["mcp-remote", "https://new.server/sse"]);
  });
});

// ── Connect / Disconnect ──────────────────────────────────────────────────────

describe("MCP Servers — Connect / Disconnect", () => {
  test("POST /:id/connect — server không reachable → 400 + error message", async () => {
    // Server npx mcp-remote https://remote.mcp.server/sse không tồn tại → sẽ fail
    const res = await apiPost(`/mcp-servers/${createdId}/connect`, {});
    // Phải trả về 400 kèm error message (không crash server)
    expect(res.status).toBe(400);
    const data = await json(res);
    expect(data.error).toBe("connection_failed");
    expect(data.message).toBeTruthy();
  });

  test("Sau khi connect fail — status được update thành error", async () => {
    const res = await apiGet(`/mcp-servers/${createdId}`);
    const data = await json(res);
    // Status phải là error hoặc disconnected (không phải connected)
    expect(["error", "disconnected"]).toContain(data.data.status);
  });

  test("POST /:id/disconnect — server không connected → ok (idempotent)", async () => {
    const res = await apiPost(`/mcp-servers/${createdId}/disconnect`, {});
    expect(res.status).toBe(200);
    const data = await json(res);
    expect(data.ok).toBe(true);
  });

  test("GET /:id/tools — server không connected → list rỗng", async () => {
    const res = await apiGet(`/mcp-servers/${createdId}/tools`);
    expect(res.status).toBe(200);
    const data = await json(res);
    expect(Array.isArray(data.data)).toBe(true);
    expect(data.data.length).toBe(0);
  });
});

// ── Connect real MCP server (nếu có) ─────────────────────────────────────────

describe("MCP Servers — Real server (echo-stdio)", () => {
  let echoServerId = "";

  // Dùng một MCP server đơn giản built-in: npx -y @modelcontextprotocol/server-everything
  // Nếu không có npx → skip bằng cách catch error
  beforeAll(async () => {
    const res = await apiPost("/mcp-servers", {
      name: "test-mcp-everything",
      transport: "stdio",
      command: "npx",
      args: ["-y", "@modelcontextprotocol/server-everything"],
      autoConnect: false,
    });
    const data = await json(res);
    echoServerId = data.data?.id ?? "";
  });

  afterAll(async () => {
    if (echoServerId) {
      await apiPost(`/mcp-servers/${echoServerId}/disconnect`, {});
      await apiDelete(`/mcp-servers/${echoServerId}`);
    }
  });

  test("connect → tools list không rỗng", async () => {
    if (!echoServerId) return;

    const res = await apiPost(`/mcp-servers/${echoServerId}/connect`, {});

    // Nếu npx không có hoặc package không tải được → skip
    if (res.status === 400) {
      console.log("[skip] @modelcontextprotocol/server-everything not available");
      return;
    }

    expect(res.status).toBe(200);
    const data = await json(res);
    expect(data.data.connected).toBe(true);
    expect(Array.isArray(data.data.tools)).toBe(true);
    expect(data.data.tools.length).toBeGreaterThan(0);

    // Mỗi tool phải có name + description
    const tool = data.data.tools[0];
    expect(tool.name).toBeTruthy();
    expect(typeof tool.description).toBe("string");
  });

  test("GET /:id/tools sau connect — trả về tools", async () => {
    if (!echoServerId) return;

    const res = await apiGet(`/mcp-servers/${echoServerId}/tools`);
    expect(res.status).toBe(200);
    const data = await json(res);
    // Nếu connect thành công, tools > 0; nếu skip, có thể rỗng
    expect(Array.isArray(data.data)).toBe(true);
  });

  test("disconnect → connected = false", async () => {
    if (!echoServerId) return;

    await apiPost(`/mcp-servers/${echoServerId}/disconnect`, {});

    const res = await apiGet("/mcp-servers");
    const list = await json(res);
    const found = list.data.find((s: any) => s.id === echoServerId);
    if (found) {
      expect(found.connected).toBe(false);
    }
  });
});

// ── Delete ────────────────────────────────────────────────────────────────────

describe("MCP Servers — Delete", () => {
  test("DELETE /mcp-servers/:id — xóa thành công", async () => {
    if (!createdId) return;
    const res = await apiDelete(`/mcp-servers/${createdId}`);
    expect(res.status).toBe(200);
    const data = await json(res);
    expect(data.ok).toBe(true);

    // Verify gone
    const getRes = await apiGet(`/mcp-servers/${createdId}`);
    expect(getRes.status).toBe(404);

    createdId = ""; // prevent double-delete in afterAll
  });

  test("DELETE /mcp-servers/:id — id không tồn tại → ok (idempotent)", async () => {
    // Xóa id không tồn tại không nên throw 500
    const res = await apiDelete("/mcp-servers/non-existent-xyz-99");
    // Có thể 200 hoặc 404 — quan trọng không phải 500
    expect([200, 404]).toContain(res.status);
  });
});
