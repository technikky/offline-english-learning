import jwt from "jsonwebtoken";
import { eq } from "drizzle-orm";
import { db } from "../db/client";
import { refreshTokens, users } from "../db/schema";
import { loadOrCreateJwtSecret } from "./jwtSecret";
import { generateOpaqueToken, hashOpaqueToken } from "./password";

const JWT_SECRET = loadOrCreateJwtSecret();
const ACCESS_TOKEN_TTL_SECONDS = 15 * 60;
const REFRESH_TOKEN_TTL_DAYS = 30;

export interface AccessTokenPayload {
  sub: number;
  role: "admin" | "teacher" | "student";
}

export function signAccessToken(payload: AccessTokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: ACCESS_TOKEN_TTL_SECONDS });
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  return jwt.verify(token, JWT_SECRET) as unknown as AccessTokenPayload;
}

export async function issueRefreshToken(userId: number): Promise<string> {
  const token = generateOpaqueToken();
  const expiresAt = new Date(
    Date.now() + REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000,
  ).toISOString();

  await db.insert(refreshTokens).values({
    userId,
    tokenHash: hashOpaqueToken(token),
    expiresAt,
  });

  return token;
}

export interface RotatedTokens {
  accessToken: string;
  refreshToken: string;
}

/** Validates a refresh token, revokes it, and issues a fresh access+refresh pair. */
export async function rotateRefreshToken(
  presentedToken: string,
): Promise<RotatedTokens | null> {
  const tokenHash = hashOpaqueToken(presentedToken);

  const row = await db.query.refreshTokens.findFirst({
    where: eq(refreshTokens.tokenHash, tokenHash),
  });

  if (!row || row.revokedAt || new Date(row.expiresAt) < new Date()) {
    return null;
  }

  const user = await db.query.users.findFirst({
    where: eq(users.id, row.userId),
  });
  if (!user) return null;

  await db
    .update(refreshTokens)
    .set({ revokedAt: new Date().toISOString() })
    .where(eq(refreshTokens.id, row.id));

  const accessToken = signAccessToken({ sub: user.id, role: user.role });
  const refreshToken = await issueRefreshToken(user.id);

  return { accessToken, refreshToken };
}

export async function revokeRefreshToken(presentedToken: string): Promise<void> {
  const tokenHash = hashOpaqueToken(presentedToken);
  await db
    .update(refreshTokens)
    .set({ revokedAt: new Date().toISOString() })
    .where(eq(refreshTokens.tokenHash, tokenHash));
}

export const accessTokenTtlSeconds = ACCESS_TOKEN_TTL_SECONDS;
