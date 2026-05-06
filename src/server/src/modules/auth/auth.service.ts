import { eq, or } from "drizzle-orm";
import { getDb } from "../../common/db/client.js";
import { users } from "../../common/db/schema.js";
import { signAccess, signRefresh, verifyToken } from "../../common/auth/jwt.js";

/** Login by username or email */
export async function loginService(login: string, password: string) {
  const db = getDb();
  const user = await db
    .select()
    .from(users)
    .where(or(eq(users.email, login), eq(users.username, login)))
    .get();

  if (!user) return null;

  const valid = await Bun.password.verify(password, user.passwordHash);
  if (!valid) return null;

  const accessToken = await signAccess(user.id, user.role);
  const refreshToken = await signRefresh(user.id, user.role);

  return {
    access_token: accessToken,
    refresh_token: refreshToken,
    token_type: "Bearer",
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      name: user.name,
      role: user.role,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    },
  };
}

/** Refresh access token — validates refresh JWT, issues new access + rotated refresh */
export async function refreshService(refreshToken: string) {
  const payload = await verifyToken(refreshToken);
  if (payload.type !== "refresh") return null;

  // Verify user still exists
  const db = getDb();
  const user = await db
    .select()
    .from(users)
    .where(eq(users.id, payload.sub!))
    .get();

  if (!user) return null;

  // Issue new tokens (rotate refresh)
  const newAccess = await signAccess(user.id, user.role);
  const newRefresh = await signRefresh(user.id, user.role);

  return {
    access_token: newAccess,
    refresh_token: newRefresh,
    token_type: "Bearer",
  };
}

/** Change password — verifies old password, then hashes and saves new */
export async function changePasswordService(
  userId: string,
  oldPassword: string,
  newPassword: string,
) {
  const db = getDb();
  const user = await db
    .select()
    .from(users)
    .where(eq(users.id, userId))
    .get();

  if (!user) return { ok: false, reason: "not_found" as const };

  const valid = await Bun.password.verify(oldPassword, user.passwordHash);
  if (!valid) return { ok: false, reason: "wrong_password" as const };

  const newHash = await Bun.password.hash(newPassword);
  await db
    .update(users)
    .set({ passwordHash: newHash, updatedAt: Math.floor(Date.now() / 1000) })
    .where(eq(users.id, userId));

  return { ok: true, reason: null };
}

export async function getMeService(userId: string) {
  const db = getDb();
  const user = await db
    .select({
      id: users.id,
      username: users.username,
      email: users.email,
      name: users.name,
      role: users.role,
      createdAt: users.createdAt,
      updatedAt: users.updatedAt,
    })
    .from(users)
    .where(eq(users.id, userId))
    .get();
  return user ?? null;
}

