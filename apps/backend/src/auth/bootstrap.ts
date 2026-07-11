import fs from "node:fs";
import path from "node:path";
import { db } from "../db/client";
import { users } from "../db/schema";
import { generateRandomPassword, hashPassword } from "./password";

const dataDir = path.resolve(__dirname, "../../../../data");
const credentialsPath = path.join(dataDir, "admin-credentials.txt");

/**
 * A fully offline system has no email/SMS channel to deliver an initial
 * admin password through, so one is generated and written to a local file
 * the first time the server boots with an empty users table.
 */
export async function bootstrapAdminIfNeeded(
  logger: { warn: (msg: string) => void },
): Promise<void> {
  const existing = await db.query.users.findFirst();
  if (existing) return;

  const email = "admin@school.local";
  const password = generateRandomPassword();
  const passwordHash = await hashPassword(password);

  await db.insert(users).values({
    email,
    passwordHash,
    role: "admin",
    displayName: "Administrator",
    mustChangePassword: true,
  });

  fs.mkdirSync(dataDir, { recursive: true });
  fs.writeFileSync(
    credentialsPath,
    `Initial admin account (change the password after first login)\nEmail: ${email}\nPassword: ${password}\n`,
    { mode: 0o600 },
  );

  logger.warn(
    `Created initial admin account (${email}). Credentials written to ${credentialsPath}`,
  );
}
