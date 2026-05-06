import { eq } from "drizzle-orm";
import { getDb } from "./client.js";
import { users } from "./schema.js";
import { genId, now } from "../utils.js";

/**
 * Create superadmin user — used for initial setup / CLI init.
 * Throws if a superadmin already exists.
 */
export async function createSuperAdmin(
  username: string,
  email: string,
  password: string,
  name: string,
) {
  const db = getDb();
  const existing = await db
    .select()
    .from(users)
    .where(eq(users.role, "superadmin"))
    .get();

  if (existing) throw new Error("superadmin already exists");

  const id = genId("usr");
  const passwordHash = await Bun.password.hash(password);
  const ts = now();

  await db.insert(users).values({
    id, username, email, passwordHash, name,
    role: "superadmin",
    createdAt: ts,
    updatedAt: ts,
  });

  return { id, username, email, name, role: "superadmin" };
}
