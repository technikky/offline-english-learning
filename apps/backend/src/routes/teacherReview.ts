import type { FastifyInstance } from "fastify";
import { desc, eq, inArray } from "drizzle-orm";
import type { MistakeReviewEntryDto } from "@englishclass/types";
import { db } from "../db/client";
import {
  classStudents,
  conversations,
  grammarMistakes,
  messages,
  users,
} from "../db/schema";
import { authenticate, requireRole } from "../auth/middleware";
import { getOwnedClass } from "../teacher/ownership";

export function registerTeacherReviewRoutes(app: FastifyInstance): void {
  app.get<{ Params: { id: string } }>(
    "/teacher/classes/:id/mistakes",
    { preHandler: [authenticate, requireRole("teacher")] },
    async (request, reply) => {
      const classId = Number(request.params.id);
      const classRow = await getOwnedClass(classId, request.authUser!.sub);
      if (!classRow) return reply.code(404).send({ error: "Class not found" });

      const roster = await db
        .select({ studentId: classStudents.studentId })
        .from(classStudents)
        .where(eq(classStudents.classId, classId));
      const studentIds = roster.map((r) => r.studentId);

      if (studentIds.length === 0) return [] as MistakeReviewEntryDto[];

      const rows = await db
        .select({ mistake: grammarMistakes, student: users })
        .from(grammarMistakes)
        .innerJoin(messages, eq(grammarMistakes.messageId, messages.id))
        .innerJoin(conversations, eq(messages.conversationId, conversations.id))
        .innerJoin(users, eq(conversations.studentId, users.id))
        .where(inArray(conversations.studentId, studentIds))
        .orderBy(desc(grammarMistakes.createdAt))
        .limit(50);

      const entries: MistakeReviewEntryDto[] = rows.map(({ mistake, student }) => ({
        id: mistake.id,
        originalText: mistake.originalText,
        correctedText: mistake.correctedText,
        ruleId: mistake.ruleId,
        ruleDescription: mistake.ruleDescription,
        category: mistake.category,
        explanation: mistake.explanation,
        example: mistake.example,
        studentId: student.id,
        studentName: student.displayName,
        createdAt: mistake.createdAt,
      }));

      return entries;
    },
  );
}
