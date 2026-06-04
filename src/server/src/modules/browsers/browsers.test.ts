/**
 * Browser Profiles Integration Tests
 *
 * Uses Bun test runner + plain fetch.
 * API base: /api/browsers
 *
 * Run: cd src/server && bun test src/modules/browsers/browsers.test.ts
 * Requires: server running at BASE_URL (bun dev)
 */

import { describe, test, expect, beforeAll, afterAll } from "bun:test";

// ── Config ────────────────────────────────────────────────────────────────────

const BASE_URL = process.env.TEST_BASE_URL ?? "http://127.0.0.1:18080";
const API = `${BASE_URL}/api/browsers`;
const EMAIL = process.env.TEST_EMAIL ?? "admin@local.com";
const PASSWORD = process.env.TEST_PASSWORD ?? "admin123";

// ── State ─────────────────────────────────────────────────────────────────────

let accessToken = "";
const createdIds: string[] = [];

// ── Helpers ───────────────────────────────────────────────────────────────────

function authHeader(): Record<string, string> {
  return { Authorization: `Bearer ${accessToken}` };
}

function jsonHeaders(): Record<string, string> {
  return { "Content-Type": "application/json", ...authHeader() };
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
});

afterAll(async () => {
  // Cleanup all created browser profiles
  for (const id of createdIds) {
    try {
      // Force stop first
      await fetch(`${API}/${id}/stop`, {
        method: "POST",
        headers: authHeader(),
      });
    } catch {
      // Ignore errors during cleanup stop
    }
    try {
      // Delete profile record and user data dir
      await fetch(`${API}/${id}`, {
        method: "DELETE",
        headers: authHeader(),
      });
    } catch {
      // Ignore errors during cleanup delete
    }
  }
});

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("Browser Profiles CRUD & Lifecycle Integration", () => {
  let profileId = "";

  test("create a browser profile", async () => {
    const res = await fetch(API, {
      method: "POST",
      headers: jsonHeaders(),
      body: JSON.stringify({
        name: "Test Profile Integration",
        description: "Integration test profile creation",
      }),
    });

    expect(res.status).toBe(201);
    const data = (await res.json()) as any;
    expect(data.id).toBeTruthy();
    expect(data.name).toBe("Test Profile Integration");
    expect(data.status).toBe("idle");

    profileId = data.id;
    createdIds.push(profileId);
  });

  test("get browser profile by ID", async () => {
    const res = await fetch(`${API}/${profileId}`, {
      headers: authHeader(),
    });

    expect(res.status).toBe(200);
    const data = (await res.json()) as any;
    expect(data.id).toBe(profileId);
    expect(data.name).toBe("Test Profile Integration");
    expect(data.status).toBe("idle");
    expect(Array.isArray(data.tabs)).toBe(true);
  });

  test("list browser profiles", async () => {
    const res = await fetch(`${API}?search=Test Profile Integration`, {
      headers: authHeader(),
    });

    expect(res.status).toBe(200);
    const data = (await res.json()) as any;
    expect(data.items).toHaveLength(1);
    expect(data.items[0].id).toBe(profileId);
  });

  test("update browser profile config", async () => {
    const res = await fetch(`${API}/${profileId}`, {
      method: "PATCH",
      headers: jsonHeaders(),
      body: JSON.stringify({
        name: "Updated Test Profile Name",
        description: "Updated description",
      }),
    });

    expect(res.status).toBe(200);
    const data = (await res.json()) as any;
    expect(data.name).toBe("Updated Test Profile Name");
    expect(data.description).toBe("Updated description");
  });

  test("start browser profile", async () => {
    const res = await fetch(`${API}/${profileId}/start`, {
      method: "POST",
      headers: authHeader(),
    });

    expect(res.status).toBe(200);
    const data = (await res.json()) as any;
    expect(data.status).toBe("running");
    expect(data.cdpPort).toBeTruthy();
    expect(data.wsEndpoint).toBeTruthy();
  });

  test("prevent config updates when profile is running", async () => {
    const res = await fetch(`${API}/${profileId}`, {
      method: "PATCH",
      headers: jsonHeaders(),
      body: JSON.stringify({
        name: "Should Not Allow Update",
      }),
    });

    expect(res.status).toBe(400);
    const data = (await res.json()) as any;
    expect(data.error).toBe("bad_request");
    expect(data.message).toContain("running");
  });

  test("get active tabs for running profile", async () => {
    const res = await fetch(`${API}/${profileId}/tabs`, {
      headers: authHeader(),
    });

    expect(res.status).toBe(200);
    const data = (await res.json()) as any;
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBeGreaterThanOrEqual(1);
    expect(data[0].url).toBeTruthy();
  });

  test("control browser (navigate + execute steps)", async () => {
    const res = await fetch(`${API}/${profileId}/control`, {
      method: "POST",
      headers: jsonHeaders(),
      body: JSON.stringify({
        steps: [
          {
            action: "navigate",
            url: `${BASE_URL}/api/health`,
          },
          {
            action: "get_content",
          },
        ],
        tabIndex: 0,
      }),
    });

    expect(res.status).toBe(200);
    const data = (await res.json()) as any;
    expect(data.results).toHaveLength(2);
    expect(data.results[0].success).toBe(true);
    expect(data.results[1].success).toBe(true);
    expect(data.results[1].result.content).toContain("agent-hands");
  });

  test("capture live screenshot", async () => {
    const res = await fetch(`${API}/${profileId}/screenshot?tabIndex=0`, {
      headers: authHeader(),
    });

    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toBe("image/png");
    const buffer = await res.arrayBuffer();
    expect(buffer.byteLength).toBeGreaterThan(0);
  });

  test("stop browser profile", async () => {
    const res = await fetch(`${API}/${profileId}/stop`, {
      method: "POST",
      headers: authHeader(),
    });

    expect(res.status).toBe(200);
    const data = (await res.json()) as any;
    expect(data.stopped).toBe(true);
  });

  test("delete browser profile", async () => {
    const res = await fetch(`${API}/${profileId}`, {
      method: "DELETE",
      headers: authHeader(),
    });

    expect(res.status).toBe(200);
    const data = (await res.json()) as any;
    expect(data.deleted).toBe(true);

    // Remove from createdIds tracking since it's deleted
    const index = createdIds.indexOf(profileId);
    if (index > -1) {
      createdIds.splice(index, 1);
    }

    // Verify profile is actually deleted
    const checkRes = await fetch(`${API}/${profileId}`, {
      headers: authHeader(),
    });
    expect(checkRes.status).toBe(400);
  });

  test("stop non-existent profile returns 500/400 error", async () => {
    const res = await fetch(`${API}/bpr_nonexistent999/stop`, {
      method: "POST",
      headers: authHeader(),
    });
    expect(res.status).toBeGreaterThanOrEqual(400);
  });
});
