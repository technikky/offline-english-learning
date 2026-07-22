import { eq } from "drizzle-orm";
import type { TargetLanguage, UiLocale } from "@englishclass/types";
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

const VALID_LOCALES: UiLocale[] = ["en", "zh"];

export function isUiLocale(value: unknown): value is UiLocale {
  return typeof value === "string" && (VALID_LOCALES as string[]).includes(value);
}

/**
 * Stage 36: the language the INTERFACE is shown in. Deliberately separate from
 * getTargetLanguage(): a Chinese speaker learning English wants a Chinese UI
 * and an English target language, and tying the two together would make the
 * app unusable for exactly the schools it is built for.
 */
export async function getUiLocale(userId: number): Promise<UiLocale> {
  const user = await db.query.users.findFirst({ where: eq(users.id, userId) });
  return isUiLocale(user?.uiLocale) ? user.uiLocale : "en";
}
