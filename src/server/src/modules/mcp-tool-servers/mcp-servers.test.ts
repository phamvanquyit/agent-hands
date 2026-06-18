/**
 * MCP Tool Servers — Integration Tests
 *
 * Tests full CRUD lifecycle for MCP tool servers and tools.
 *
 * Run: cd src/server && bun test src/modules/mcp-tool-servers/mcp-servers.test.ts
 * Requires: server running at BASE_URL (bun dev:server)
 */

import { afterAll, beforeAll, describe, expect, test } from "bun:test";

// ── Config ────────────────────────────────────────────────────────────────────

const BASE_URL = process.env.TEST_BASE_URL ?? "http://127.0.0.1:18080";
const LOGIN = process.env.TEST_LOGIN ?? "admin";
const PASSWORD = process.env.TEST_PASSWORD ?? "admin123";

// ── State ─────────────────────────────────────────────────────────────────────

let accessToken = "";
let createdServerId = "";
let createdToolId = "";
let createdServerApiKey = "";

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
    body: JSON.stringify({ login: LOGIN, password: PASSWORD }),
  });
  expect(res.ok).toBe(true);
  const data = await json(res);
  accessToken = data.access_token;
  expect(accessToken).toBeTruthy();
});

afterAll(async () => {
  // Cleanup: delete server if still remaining
  if (createdServerId) {
    await apiDelete(`/mcp-tool-servers/${createdServerId}`);
  }
});

// ── Server CRUD ───────────────────────────────────────────────────────────────

describe("MCP Tool Servers — Server CRUD", () => {
  test("GET /mcp-tool-servers — list returns items", async () => {
    const res = await apiGet("/mcp-tool-servers");
    expect(res.status).toBe(200);
    const data = await json(res);
    expect(Array.isArray(data.items)).toBe(true);
  });

  test("POST /mcp-tool-servers — create custom server (with API key)", async () => {
    const res = await apiPost("/mcp-tool-servers", {
      name: "test-mcp-server",
      description: "Test MCP server for integration tests",
    });

    expect(res.status).toBe(201);
    const data = await json(res);
    expect(data.id).toBeTruthy();
    expect(data.name).toBe("test-mcp-server");
    expect(data.type).toBe("custom");
    // Verify API key is auto-generated
    expect(data.apiKey).toBeTruthy();
    expect(data.apiKey.startsWith("msk_")).toBe(true);
    expect(data.apiKeyPrefix).toBeTruthy();

    createdServerId = data.id;
    createdServerApiKey = data.apiKey;
  });

  test("GET /mcp-tool-servers/:id — get server by id", async () => {
    const res = await apiGet(`/mcp-tool-servers/${createdServerId}`);
    expect(res.status).toBe(200);
    const data = await json(res);
    expect(data.id).toBe(createdServerId);
    expect(data.name).toBe("test-mcp-server");
  });

  test("GET /mcp-tool-servers/:id — non-existent id → 400", async () => {
    const res = await apiGet("/mcp-tool-servers/mts_nonexistent_xyz");
    expect(res.status).toBe(400);
  });

  test("PATCH /mcp-tool-servers/:id — update description", async () => {
    const res = await apiPatch(`/mcp-tool-servers/${createdServerId}`, {
      description: "Updated description",
    });
    expect(res.status).toBe(200);
    const data = await json(res);
    expect(data.description).toBe("Updated description");
  });

  test("PATCH /mcp-tool-servers/:id — update extendsBuiltin tools list", async () => {
    const res = await apiPatch(`/mcp-tool-servers/${createdServerId}`, {
      extendsBuiltin: ["kv_get", "kv_list"],
    });
    expect(res.status).toBe(200);
    const data = await json(res);
    expect(Array.isArray(data.extendsBuiltin)).toBe(true);
    expect(data.extendsBuiltin).toContain("kv_get");
    expect(data.extendsBuiltin).toContain("kv_list");
  });

  test("GET /mcp-tool-servers/:id — verify extendsBuiltin is persisted", async () => {
    const res = await apiGet(`/mcp-tool-servers/${createdServerId}`);
    expect(res.status).toBe(200);
    const data = await json(res);
    expect(data.extendsBuiltin).toContain("kv_get");
    expect(data.extendsBuiltin).toContain("kv_list");
  });
});

// ── Tool CRUD ─────────────────────────────────────────────────────────────────

describe("MCP Tool Servers — Tool CRUD", () => {
  test("POST /:id/tools — create tool", async () => {
    const res = await apiPost(`/mcp-tool-servers/${createdServerId}/tools`, {
      name: "test_tool",
      description: "A test tool",
      inputSchema: JSON.stringify({
        type: "object",
        properties: {
          message: { type: "string", description: "A test message" },
        },
        required: ["message"],
      }),
      code: `async function execute(params, context) {
  return { echo: params.message };
}`,
    });

    expect(res.status).toBe(201);
    const data = await json(res);
    expect(data.id).toBeTruthy();
    expect(data.name).toBe("test_tool");
    expect(data.description).toBe("A test tool");
    expect(data.serverId).toBe(createdServerId);

    createdToolId = data.id;
  });

  test("GET /:id/tools — list tools", async () => {
    const res = await apiGet(`/mcp-tool-servers/${createdServerId}/tools`);
    expect(res.status).toBe(200);
    const data = await json(res);
    expect(data.items).toBeDefined();
    expect(data.items.length).toBeGreaterThanOrEqual(1);
  });

  test("GET /:id/tools/:toolId — get tool by id", async () => {
    const res = await apiGet(`/mcp-tool-servers/${createdServerId}/tools/${createdToolId}`);
    expect(res.status).toBe(200);
    const data = await json(res);
    expect(data.id).toBe(createdToolId);
    expect(data.name).toBe("test_tool");
  });

  test("PATCH /:id/tools/:toolId — update tool", async () => {
    const res = await apiPatch(`/mcp-tool-servers/${createdServerId}/tools/${createdToolId}`, {
      description: "Updated description",
    });
    expect(res.status).toBe(200);
    const data = await json(res);
    expect(data.description).toBe("Updated description");
  });

  test("PATCH /:id/tools/:toolId — update tool with empty description", async () => {
    const res = await apiPatch(`/mcp-tool-servers/${createdServerId}/tools/${createdToolId}`, {
      description: "",
    });
    expect(res.status).toBe(200);
    const data = await json(res);
    expect(data.description).toBe("");
  });

  test("PATCH /:id/tools/:toolId — update tool with duplicate name -> 400", async () => {
    const resCreate = await apiPost(`/mcp-tool-servers/${createdServerId}/tools`, {
      name: "second_tool",
      description: "Another test tool",
      code: `async function execute(params, context) { return {}; }`,
    });
    expect(resCreate.status).toBe(201);
    const tool2 = await json(resCreate);

    const resUpdate = await apiPatch(`/mcp-tool-servers/${createdServerId}/tools/${tool2.id}`, {
      name: "test_tool",
    });
    expect(resUpdate.status).toBe(400);
    const errorData = await json(resUpdate);
    expect(errorData.message).toContain("already exists in this server");

    await apiDelete(`/mcp-tool-servers/${createdServerId}/tools/${tool2.id}`);
  });

  test("DELETE /:id/tools/:toolId — delete tool", async () => {
    const res = await apiDelete(`/mcp-tool-servers/${createdServerId}/tools/${createdToolId}`);
    expect(res.status).toBe(200);
    const data = await json(res);
    expect(data.deleted).toBe(true);

    // Verify gone
    const getRes = await apiGet(`/mcp-tool-servers/${createdServerId}/tools/${createdToolId}`);
    expect(getRes.status).toBe(400);

    createdToolId = "";
  });
});

// ── Server Delete ─────────────────────────────────────────────────────────────

describe("MCP Tool Servers — Delete", () => {
  test("DELETE /mcp-tool-servers/:id — delete custom server", async () => {
    if (!createdServerId) return;
    const res = await apiDelete(`/mcp-tool-servers/${createdServerId}`);
    expect(res.status).toBe(200);
    const data = await json(res);
    expect(data.deleted).toBe(true);

    // Verify gone
    const getRes = await apiGet(`/mcp-tool-servers/${createdServerId}`);
    expect(getRes.status).toBe(400);

    createdServerId = ""; // prevent double-delete in afterAll
  });
});

// ── Auth ──────────────────────────────────────────────────────────────────────

describe("MCP Tool Servers — Auth", () => {
  test("list without auth → 401", async () => {
    const res = await fetch(`${BASE_URL}/api/mcp-tool-servers`);
    expect(res.status).toBe(401);
  });

  test("create without auth → 401", async () => {
    const res = await fetch(`${BASE_URL}/api/mcp-tool-servers`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "no-auth-server" }),
    });
    expect(res.status).toBe(401);
  });
});

// ── API Key Management ───────────────────────────────────────────────────────

describe("MCP Tool Servers — API Key Management", () => {
  let keyTestServerId = "";
  let keyTestApiKey = "";

  beforeAll(async () => {
    // Create a server for key tests
    const res = await apiPost("/mcp-tool-servers", {
      name: "key-test-server",
      description: "Server for API key tests",
    });
    const data = await json(res);
    keyTestServerId = data.id;
    keyTestApiKey = data.apiKey;
  });

  afterAll(async () => {
    if (keyTestServerId) {
      await apiDelete(`/mcp-tool-servers/${keyTestServerId}`);
    }
  });

  test("GET server — apiKeyPrefix present, no apiKeyHash", async () => {
    const res = await apiGet(`/mcp-tool-servers/${keyTestServerId}`);
    expect(res.status).toBe(200);
    const data = await json(res);
    expect(data.apiKeyPrefix).toBeTruthy();
    expect(data.apiKeyPrefix.startsWith("msk_")).toBe(true);
    // Hash should NOT be exposed in API response
    expect(data.apiKeyHash).toBeUndefined();
  });

  test("POST /:id/regenerate-key — regenerate key", async () => {
    const res = await apiPost(`/mcp-tool-servers/${keyTestServerId}/regenerate-key`, {});
    expect(res.status).toBe(200);
    const data = await json(res);
    expect(data.apiKey).toBeTruthy();
    expect(data.apiKey.startsWith("msk_")).toBe(true);
    expect(data.apiKeyPrefix).toBeTruthy();
    // Key should be different from original
    expect(data.apiKey).not.toBe(keyTestApiKey);
    keyTestApiKey = data.apiKey; // update for later tests
  });

  test("MCP endpoint — auth with server key (Bearer msk_)", async () => {
    // POST /api/mcp/:serverId with MCP server key
    // This should succeed auth (though the actual MCP initialize may fail, auth itself should pass)
    const res = await fetch(`${BASE_URL}/api/mcp/${keyTestServerId}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${keyTestApiKey}`,
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "initialize",
        params: {
          protocolVersion: "2025-03-26",
          capabilities: {},
          clientInfo: { name: "test", version: "1.0" },
        },
      }),
    });
    // Should not be 401 (auth passed)
    expect(res.status).not.toBe(401);
  });

  test("MCP endpoint — wrong server key → 401", async () => {
    const res = await fetch(`${BASE_URL}/api/mcp/${keyTestServerId}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer msk_invalidkey12345678901234567890",
      },
      body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "initialize" }),
    });
    expect(res.status).toBe(401);
  });

  test("MCP endpoint — server key for wrong server → 401", async () => {
    // Use the key from keyTestServer on a different serverId
    const res = await fetch(`${BASE_URL}/api/mcp/mts_system`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${keyTestApiKey}`,
      },
      body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "initialize" }),
    });
    // msk_ key should not work for a different server
    expect(res.status).toBe(401);
  });

  test("MCP endpoint — JWT auth still works (backward compat)", async () => {
    const res = await fetch(`${BASE_URL}/api/mcp/${keyTestServerId}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "initialize",
        params: {
          protocolVersion: "2025-03-26",
          capabilities: {},
          clientInfo: { name: "test", version: "1.0" },
        },
      }),
    });
    expect(res.status).not.toBe(401);
  });

  test("DELETE /:id/api-key — revoke key", async () => {
    const res = await apiDelete(`/mcp-tool-servers/${keyTestServerId}/api-key`);
    expect(res.status).toBe(200);
    const data = await json(res);
    expect(data.revoked).toBe(true);

    // Verify prefix is now null
    const getRes = await apiGet(`/mcp-tool-servers/${keyTestServerId}`);
    const server = await json(getRes);
    expect(server.apiKeyPrefix).toBeNull();
  });

  test("MCP endpoint — revoked key → 401", async () => {
    const res = await fetch(`${BASE_URL}/api/mcp/${keyTestServerId}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${keyTestApiKey}`,
      },
      body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "initialize" }),
    });
    expect(res.status).toBe(401);
  });

  test("POST /:id/regenerate-key on builtin → 403", async () => {
    const res = await apiPost("/mcp-tool-servers/mts_system/regenerate-key", {});
    expect(res.status).toBe(403);
  });
});

