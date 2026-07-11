import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

const dataDir = path.resolve(__dirname, "../../../../data");
const secretPath = path.join(dataDir, "jwt-secret.txt");

/**
 * A fully offline system has no secrets manager to pull a JWT signing key
 * from, so one is generated on first boot and persisted locally. Restarting
 * the server must not invalidate every existing session, hence the file.
 */
export function loadOrCreateJwtSecret(): string {
  if (process.env.JWT_SECRET) return process.env.JWT_SECRET;

  fs.mkdirSync(dataDir, { recursive: true });

  if (fs.existsSync(secretPath)) {
    return fs.readFileSync(secretPath, "utf-8").trim();
  }

  const secret = crypto.randomBytes(48).toString("hex");
  fs.writeFileSync(secretPath, secret, { mode: 0o600 });
  return secret;
}
