import fs from "node:fs";
import path from "node:path";
import { db } from "../db/client";
import { schools, users } from "../db/schema";
import { generateRandomPassword, hashPassword } from "./password";

const dataDir = path.resolve(__dirname, "../../../../data");
const credentialsPath = path.join(dataDir, "admin-credentials.txt");

/**
 * A fully offline system has no email/SMS channel to deliver initial passwords
 * through, so they're generated and written to a local file the first time the
 * server boots with an empty users table.
 *
 * Stage 20 (multi-school): bootstrap now creates two accounts —
 *  - a platform **super_admin** (manages schools and their admins), and
 *  - a **Default School** with its own school **admin**,
 * so a single-school deployment works out of the box (log in as the school
 * admin, exactly like before) while multi-school is available (log in as the
 * super_admin to add more schools).
 */
export async function bootstrapAdminIfNeeded(
  logger: { warn: (msg: string) => void },
): Promise<void> {
  const existing = await db.query.users.findFirst();
  if (existing) return;

  const superAdminEmail = "superadmin@platform.local";
  const superAdminPassword = generateRandomPassword();
  await db.insert(users).values({
    email: superAdminEmail,
    passwordHash: await hashPassword(superAdminPassword),
    role: "super_admin",
    displayName: "Platform Administrator",
    schoolId: null,
    mustChangePassword: true,
  });

  const [defaultSchool] = await db
    .insert(schools)
    .values({ name: "Default School" })
    .returning();

  const adminEmail = "admin@school.local";
  const adminPassword = generateRandomPassword();
  await db.insert(users).values({
    email: adminEmail,
    passwordHash: await hashPassword(adminPassword),
    role: "admin",
    displayName: "Administrator",
    schoolId: defaultSchool.id,
    mustChangePassword: true,
  });

  fs.mkdirSync(dataDir, { recursive: true });
  fs.writeFileSync(
    credentialsPath,
    "Initial accounts (change the passwords after first login)\n\n" +
      "Platform super-admin (manages schools):\n" +
      `Email: ${superAdminEmail}\nPassword: ${superAdminPassword}\n\n` +
      `School admin for "Default School":\nEmail: ${adminEmail}\nPassword: ${adminPassword}\n`,
    { mode: 0o600 },
  );

  logger.warn(
    `Created initial super-admin (${superAdminEmail}) and Default School admin ` +
      `(${adminEmail}). Credentials written to ${credentialsPath}`,
  );
}
