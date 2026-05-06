import { SignJWT, jwtVerify, type JWTPayload } from "jose";

const ALG = "HS256";
const ACCESS_TTL = "1h";
const REFRESH_TTL = "7d";

function getSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET env var is required");
  return new TextEncoder().encode(secret);
}

export interface TokenPayload extends JWTPayload {
  sub: string;   // userId (usr_xxxx)
  role: string;
  type: "access" | "refresh";
}

export async function signAccess(userId: string, role: string): Promise<string> {
  return new SignJWT({ sub: userId, role, type: "access" })
    .setProtectedHeader({ alg: ALG })
    .setIssuedAt()
    .setExpirationTime(ACCESS_TTL)
    .sign(getSecret());
}

export async function signRefresh(userId: string, role: string): Promise<string> {
  return new SignJWT({ sub: userId, role, type: "refresh" })
    .setProtectedHeader({ alg: ALG })
    .setIssuedAt()
    .setExpirationTime(REFRESH_TTL)
    .sign(getSecret());
}

export async function verifyToken(token: string): Promise<TokenPayload> {
  const { payload } = await jwtVerify(token, getSecret());
  return payload as TokenPayload;
}
