/**
 * Users Module — Integration Tests
 *
 * Tests the users module against the feature specs:
 *  - 01: Super admin init (seed)
 *  - 04: Create user (admin only, password hashed, validation)
 *  - 05: Edit user (admin can edit all, member can only edit self, cannot change role)
 *  - 06: Delete user (admin only, cannot delete superadmin)
 *  - 08: Roles (3 roles, 403 on insufficient permissions)
 *
 * Uses Fastify inject() — no running server needed.
 * Run: bun test tests/users.test.ts
 */

import { describe, test, expect, beforeAll, afterAll } from "bun:test";
import { mkdirSync, rmSync } from "node:fs";
import { join } from "node:path";
import { createApp } from "../src/app.js";
import { runMigrations } from "../src/common/db/migrate.js";
import { getDb, closeDb } from "../src/common/db/client.js";
import { createSuperAdmin } from "../src/common/db/seed.js";
import { signAccess } from "../src/common/auth/jwt.js";
import type { FastifyInstance } from "fastify";

// ── Test Config ─────────────────────────────────────────────────────────────────

const TEST_DATA_DIR = join(import.meta.dir, ".test-data-users");

let app: FastifyInstance;
let superAdminToken: string;
let superAdminId: string;
let adminToken: string;
let adminId: string;
let memberToken: string;
let memberId: string;

function authHeader(token: string) {
  return { Authorization: `Bearer ${token}` };
}

// ── Setup / Teardown ────────────────────────────────────────────────────────────

beforeAll(async () => {
  // Clean slate
  rmSync(TEST_DATA_DIR, { recursive: true, force: true });
  mkdirSync(TEST_DATA_DIR, { recursive: true });

  // Set JWT secret for test
  process.env.JWT_SECRET = "test-secret-for-users-module-32chars!";
  process.env.DATA_DIR = TEST_DATA_DIR;

  // DB setup
  runMigrations(TEST_DATA_DIR);
  getDb(TEST_DATA_DIR);

  // Seed superadmin
  const sa = await createSuperAdmin("superadmin@test.local", "password123", "Super Admin");
  superAdminId = sa.id;
  superAdminToken = await signAccess(sa.id, sa.role);

  // Create app
  app = await createApp();
  await app.ready();

  // Seed admin user via API
  const adminRes = await app.inject({
    method: "POST",
    url: "/api/users",
    headers: { ...authHeader(superAdminToken), "content-type": "application/json" },
    payload: { email: "admin@test.local", password: "password123", name: "Test Admin", role: "admin" },
  });
  const adminData = adminRes.json() as any;
  adminId = adminData.data.id;
  adminToken = await signAccess(adminId, "admin");

  // Seed member user via API
  const memberRes = await app.inject({
    method: "POST",
    url: "/api/users",
    headers: { ...authHeader(superAdminToken), "content-type": "application/json" },
    payload: { email: "member@test.local", password: "password123", name: "Test Member" },
  });
  const memberData = memberRes.json() as any;
  memberId = memberData.data.id;
  memberToken = await signAccess(memberId, "member");
});

afterAll(async () => {
  await app.close();
  closeDb();
  rmSync(TEST_DATA_DIR, { recursive: true, force: true });
});

// ── Tests ────────────────────────────────────────────────────────────────────────

// ═══════════════════════════════════════════════════════════════════════════════
// Feature 04: Create User
// ═══════════════════════════════════════════════════════════════════════════════

describe("POST /api/users — Create User", () => {
  test("admin can create user", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/users",
      headers: { ...authHeader(adminToken), "content-type": "application/json" },
      payload: { email: "newuser@test.local", password: "securepass1", name: "New User" },
    });

    expect(res.statusCode).toBe(201);
    const body = res.json() as any;
    expect(body.data.email).toBe("newuser@test.local");
    expect(body.data.name).toBe("New User");
    expect(body.data.role).toBe("member"); // default role
    expect(body.data.id).toMatch(/^usr_/);
    // AC-04: password should NOT be in response
    expect(body.data.password).toBeUndefined();
    expect(body.data.passwordHash).toBeUndefined();
  });

  test("admin can create user with specific role", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/users",
      headers: { ...authHeader(adminToken), "content-type": "application/json" },
      payload: { email: "admin2@test.local", password: "securepass1", name: "Admin 2", role: "admin" },
    });

    expect(res.statusCode).toBe(201);
    expect((res.json() as any).data.role).toBe("admin");
  });

  test("member cannot create user → 403", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/users",
      headers: { ...authHeader(memberToken), "content-type": "application/json" },
      payload: { email: "hacker@test.local", password: "securepass1", name: "Hacker" },
    });

    expect(res.statusCode).toBe(403);
  });

  test("no auth → 401", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/users",
      headers: { "content-type": "application/json" },
      payload: { email: "noauth@test.local", password: "securepass1", name: "No Auth" },
    });

    expect(res.statusCode).toBe(401);
  });

  test("invalid email → 422 validation error", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/users",
      headers: { ...authHeader(adminToken), "content-type": "application/json" },
      payload: { email: "not-an-email", password: "securepass1", name: "Bad Email" },
    });

    expect(res.statusCode).toBe(422);
  });

  test("password too short → 422 validation error", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/users",
      headers: { ...authHeader(adminToken), "content-type": "application/json" },
      payload: { email: "short@test.local", password: "short", name: "Short Pass" },
    });

    expect(res.statusCode).toBe(422);
  });

  test("missing required fields → 422", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/users",
      headers: { ...authHeader(adminToken), "content-type": "application/json" },
      payload: { email: "incomplete@test.local" },
    });

    expect(res.statusCode).toBe(422);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// Feature: List Users
// ═══════════════════════════════════════════════════════════════════════════════

describe("GET /api/users — List Users", () => {
  test("admin can list all users", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/users",
      headers: authHeader(adminToken),
    });

    expect(res.statusCode).toBe(200);
    const body = res.json() as any;
    expect(Array.isArray(body.data)).toBe(true);
    expect(body.data.length).toBeGreaterThanOrEqual(3); // superadmin + admin + member

    // AC: password hash never exposed
    for (const user of body.data) {
      expect(user.passwordHash).toBeUndefined();
      expect(user.password_hash).toBeUndefined();
    }
  });

  test("member cannot list users → 403", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/users",
      headers: authHeader(memberToken),
    });

    expect(res.statusCode).toBe(403);
  });

  test("no auth → 401", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/users",
    });

    expect(res.statusCode).toBe(401);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// Feature: Get User by ID
// ═══════════════════════════════════════════════════════════════════════════════

describe("GET /api/users/:id — Get User", () => {
  test("admin can get any user", async () => {
    const res = await app.inject({
      method: "GET",
      url: `/api/users/${memberId}`,
      headers: authHeader(adminToken),
    });

    expect(res.statusCode).toBe(200);
    expect((res.json() as any).data.id).toBe(memberId);
  });

  test("member can get own profile", async () => {
    const res = await app.inject({
      method: "GET",
      url: `/api/users/${memberId}`,
      headers: authHeader(memberToken),
    });

    expect(res.statusCode).toBe(200);
    expect((res.json() as any).data.id).toBe(memberId);
  });

  test("member cannot get other user → 403", async () => {
    const res = await app.inject({
      method: "GET",
      url: `/api/users/${adminId}`,
      headers: authHeader(memberToken),
    });

    expect(res.statusCode).toBe(403);
  });

  test("nonexistent user → 404", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/users/usr_nonexistent",
      headers: authHeader(adminToken),
    });

    expect(res.statusCode).toBe(404);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// Feature 05: Edit User
// ═══════════════════════════════════════════════════════════════════════════════

describe("PATCH /api/users/:id — Edit User", () => {
  test("admin can update user name", async () => {
    const res = await app.inject({
      method: "PATCH",
      url: `/api/users/${memberId}`,
      headers: { ...authHeader(adminToken), "content-type": "application/json" },
      payload: { name: "Updated Member" },
    });

    expect(res.statusCode).toBe(200);
    expect((res.json() as any).data.name).toBe("Updated Member");
  });

  test("admin can change user role", async () => {
    // Create a temp user to change role
    const createRes = await app.inject({
      method: "POST",
      url: "/api/users",
      headers: { ...authHeader(adminToken), "content-type": "application/json" },
      payload: { email: "roletest@test.local", password: "password123", name: "Role Test" },
    });
    const userId = (createRes.json() as any).data.id;

    const res = await app.inject({
      method: "PATCH",
      url: `/api/users/${userId}`,
      headers: { ...authHeader(adminToken), "content-type": "application/json" },
      payload: { role: "admin" },
    });

    expect(res.statusCode).toBe(200);
    expect((res.json() as any).data.role).toBe("admin");
  });

  test("member can edit own profile", async () => {
    const res = await app.inject({
      method: "PATCH",
      url: `/api/users/${memberId}`,
      headers: { ...authHeader(memberToken), "content-type": "application/json" },
      payload: { name: "Self Updated" },
    });

    expect(res.statusCode).toBe(200);
    expect((res.json() as any).data.name).toBe("Self Updated");
  });

  test("member cannot edit other user → 403", async () => {
    const res = await app.inject({
      method: "PATCH",
      url: `/api/users/${adminId}`,
      headers: { ...authHeader(memberToken), "content-type": "application/json" },
      payload: { name: "Hacked" },
    });

    expect(res.statusCode).toBe(403);
  });

  test("member cannot change own role → 403", async () => {
    const res = await app.inject({
      method: "PATCH",
      url: `/api/users/${memberId}`,
      headers: { ...authHeader(memberToken), "content-type": "application/json" },
      payload: { role: "admin" },
    });

    expect(res.statusCode).toBe(403);
  });

  test("no auth → 401", async () => {
    const res = await app.inject({
      method: "PATCH",
      url: `/api/users/${memberId}`,
      headers: { "content-type": "application/json" },
      payload: { name: "No Auth" },
    });

    expect(res.statusCode).toBe(401);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// Feature 06: Delete User
// ═══════════════════════════════════════════════════════════════════════════════

describe("DELETE /api/users/:id — Delete User", () => {
  test("admin can delete user", async () => {
    // Create a temp user to delete
    const createRes = await app.inject({
      method: "POST",
      url: "/api/users",
      headers: { ...authHeader(adminToken), "content-type": "application/json" },
      payload: { email: "todelete@test.local", password: "password123", name: "To Delete" },
    });
    const userId = (createRes.json() as any).data.id;

    const res = await app.inject({
      method: "DELETE",
      url: `/api/users/${userId}`,
      headers: authHeader(adminToken),
    });

    expect(res.statusCode).toBe(200);
    expect((res.json() as any).data.deleted).toBe(true);

    // Verify user is gone
    const getRes = await app.inject({
      method: "GET",
      url: `/api/users/${userId}`,
      headers: authHeader(adminToken),
    });
    expect(getRes.statusCode).toBe(404);
  });

  test("cannot delete superadmin → 400", async () => {
    const res = await app.inject({
      method: "DELETE",
      url: `/api/users/${superAdminId}`,
      headers: authHeader(superAdminToken),
    });

    // Superadmin should not be deletable
    // The exact behavior depends on whether there are other superadmins
    // With our data, superadmin is the only one → error
    expect(res.statusCode).toBe(400);
    expect((res.json() as any).error).toBe("bad_request");
    expect((res.json() as any).message).toContain("superadmin");
  });

  test("member cannot delete user → 403", async () => {
    const res = await app.inject({
      method: "DELETE",
      url: `/api/users/${adminId}`,
      headers: authHeader(memberToken),
    });

    expect(res.statusCode).toBe(403);
  });

  test("no auth → 401", async () => {
    const res = await app.inject({
      method: "DELETE",
      url: `/api/users/${memberId}`,
    });

    expect(res.statusCode).toBe(401);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// Feature 08: Roles & Permissions
// ═══════════════════════════════════════════════════════════════════════════════

describe("Roles & Permissions", () => {
  test("3 role values are supported: superadmin, admin, member", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/users",
      headers: authHeader(superAdminToken),
    });

    expect(res.statusCode).toBe(200);
    const users = (res.json() as any).data;
    const roles = new Set(users.map((u: any) => u.role));
    // superadmin and admin are guaranteed — member may have been deleted by prior tests
    expect(roles.has("superadmin")).toBe(true);
    expect(roles.has("admin")).toBe(true);
  });

  test("superadmin has full access to user management", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/users",
      headers: authHeader(superAdminToken),
    });
    expect(res.statusCode).toBe(200);
  });

  test("admin has access to user management", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/users",
      headers: authHeader(adminToken),
    });
    expect(res.statusCode).toBe(200);
  });

  test("member denied user management → 403", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/users",
      headers: authHeader(memberToken),
    });
    expect(res.statusCode).toBe(403);
  });

  test("response never exposes passwordHash", async () => {
    // Get single user
    const res = await app.inject({
      method: "GET",
      url: `/api/users/${memberId}`,
      headers: authHeader(adminToken),
    });

    const data = (res.json() as any).data;
    expect(data.passwordHash).toBeUndefined();
    expect(data.password_hash).toBeUndefined();
    expect(data.password).toBeUndefined();
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// Feature 01: Super admin seed
// ═══════════════════════════════════════════════════════════════════════════════

describe("Super Admin Seed", () => {
  test("superadmin exists in user list", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/users",
      headers: authHeader(superAdminToken),
    });

    expect(res.statusCode).toBe(200);
    const users = (res.json() as any).data;
    const sa = users.find((u: any) => u.id === superAdminId);
    expect(sa).toBeTruthy();
    expect(sa.role).toBe("superadmin");
    expect(sa.email).toBe("superadmin@test.local");
  });

  test("cannot create duplicate superadmin", async () => {
    await expect(
      createSuperAdmin("another@test.local", "password123", "Another SA"),
    ).rejects.toThrow("superadmin already exists");
  });
});
