import { eq } from "drizzle-orm";
import type { TargetLanguage } from "@englishclass/types";
import { db } from "../db/client";
import { users } from "../db/schema";

const VALID: TargetLanguage[] = ["english", "chinese"];

export function isTargetLanguage(value: unknown): value is TargetLanguage {
  return typeof value === "string" && (VALID as string[]).includes(value);
}

/**
 * Stage 28: the language a student is currently learning. Content catalogs
 * (grammar topics, reading passages, the curriculum path) and the conversation
 * system prompt are all selected from this. Defaults to English so every
 * pre-Stage-28 user and every non-student account behaves exactly as before.
 */
export async function getTargetLanguage(userId: number): Promise<TargetLanguage> {
  const user = await db.query.users.findFirst({ where: eq(users.id, userId) });
  return isTargetLanguage(user?.targetLanguage) ? user.targetLanguage : "english";
}
