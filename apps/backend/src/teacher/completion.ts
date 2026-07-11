import { and, eq, gte } from "drizzle-orm";
import { db } from "../db/client";
import { conversations } from "../db/schema";

/** v1 heuristic: a student has "completed" an assignment if they've started
 * any conversation with the assignment's scenario after the assignment was
 * created. There's no separate submission record — see docs/10-stage7-plan.md
 * for why assignments here are scenario-practice targets, not a graded
 * homework/submission system. */
export async function hasCompletedAssignment(
  studentId: number,
  scenario: string,
  assignmentCreatedAt: string,
): Promise<boolean> {
  const match = await db.query.conversations.findFirst({
    where: and(
      eq(conversations.studentId, studentId),
      eq(conversations.scenario, scenario),
      gte(conversations.createdAt, assignmentCreatedAt),
    ),
  });
  return Boolean(match);
}
