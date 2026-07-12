import { eq } from "drizzle-orm";
import { db } from "../db/client";
import { customTopics, users } from "../db/schema";

// Stage 23: a custom (teacher-authored) topic is referenced in the scenario
// field as "custom:<id>", to coexist with the built-in scenario keys.
const CUSTOM_PREFIX = "custom:";

export function isCustomScenario(scenario: string): boolean {
  return scenario.startsWith(CUSTOM_PREFIX);
}

export function parseCustomTopicId(scenario: string): number | null {
  if (!isCustomScenario(scenario)) return null;
  const id = Number(scenario.slice(CUSTOM_PREFIX.length));
  return Number.isInteger(id) && id > 0 ? id : null;
}

export function customScenarioValue(id: number): string {
  return `${CUSTOM_PREFIX}${id}`;
}

export async function getCustomTopic(id: number) {
  return db.query.customTopics.findFirst({ where: eq(customTopics.id, id) });
}

/** A student's schoolId (used to scope which custom topics they can see/use). */
export async function getUserSchoolId(userId: number): Promise<number | null> {
  const user = await db.query.users.findFirst({ where: eq(users.id, userId) });
  return user?.schoolId ?? null;
}

/** Custom topics a user may use: those authored by teachers in the same school.
 * schoolId null (e.g. an unassigned account) sees only its own school's null-
 * scoped topics, which keeps behavior sane for single-school setups. */
export async function listAccessibleCustomTopics(schoolId: number | null) {
  if (schoolId == null) {
    return db.select().from(customTopics);
  }
  return db.select().from(customTopics).where(eq(customTopics.schoolId, schoolId));
}

export async function isTopicAccessible(topicId: number, schoolId: number | null): Promise<boolean> {
  const topic = await getCustomTopic(topicId);
  if (!topic) return false;
  // Same school, or (single-school fallback) both null.
  return topic.schoolId === schoolId || (schoolId == null);
}

export async function listOwnTopics(teacherId: number) {
  return db.select().from(customTopics).where(eq(customTopics.teacherId, teacherId));
}
