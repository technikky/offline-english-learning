import { eq } from "drizzle-orm";
import type { UserProfile } from "@englishclass/types";
import { db } from "../db/client";
import { schools, users } from "../db/schema";
import { isTargetLanguage } from "../users/language";

/** Builds the client-facing profile, resolving the school name (Stage 20).
 * A single small lookup — profiles are only built at login/create, not per
 * request. */
export async function buildUserProfile(user: typeof users.$inferSelect): Promise<UserProfile> {
  let schoolName: string | null = null;
  if (user.schoolId != null) {
    const school = await db.query.schools.findFirst({
      where: eq(schools.id, user.schoolId),
    });
    schoolName = school?.name ?? null;
  }

  return {
    id: user.id,
    email: user.email,
    role: user.role,
    displayName: user.displayName,
    mustChangePassword: user.mustChangePassword,
    schoolId: user.schoolId ?? null,
    schoolName,
    // Stage 28: which language this user is learning (defaults to English).
    targetLanguage: isTargetLanguage(user.targetLanguage) ? user.targetLanguage : "english",
  };
}
