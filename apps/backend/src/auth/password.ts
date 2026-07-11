import argon2 from "argon2";
import crypto from "node:crypto";

export function hashPassword(plain: string): Promise<string> {
  return argon2.hash(plain, { type: argon2.argon2id });
}

export function verifyPassword(hash: string, plain: string): Promise<boolean> {
  return argon2.verify(hash, plain);
}

export function generateRandomPassword(): string {
  return crypto.randomBytes(12).toString("base64url");
}

export function hashOpaqueToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export function generateOpaqueToken(): string {
  return crypto.randomBytes(32).toString("base64url");
}
