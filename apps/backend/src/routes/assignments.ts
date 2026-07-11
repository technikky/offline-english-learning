import type { FastifyInstance } from "fastify";
import { eq } from "drizzle-orm";
import type {
  AssignmentDto,
  AssignmentWithCompletion,
  CreateAssignmentRequest,
  Scenario,
} from "@englishclass/types";
import { db } from "../db/client";
import { assignments, classStudents, users } from "../db/schema";
import { authenticate, requireRole } from "../auth/middleware";
import { getOwnedClass } from "../teacher/ownership";
import { hasCompletedAssignment } from "../teacher/completion";
import { isValidScenario } from "../conversations/scenarios";

function toDto(row: typeof assignments.$inferSelect): AssignmentDto {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    scenario: row.scenario as Scenario,
    dueDate: row.dueDate,
    createdAt: row.createdAt,
  };
}

export function registerAssignmentRoutes(app: FastifyInstance): void {
  app.post<{ Params: { id: string }; Body: CreateAssignmentRequest }>(
    "/teacher/classes/:id/assignments",
    { preHandler: [authenticate, requireRole("teacher")] },
    async (request, reply) => {
      const classId = Number(request.params.id);
      const classRow = await getOwnedClass(classId, request.authUser!.sub);
      if (!classRow) return reply.code(404).send({ error: "Class not found" });

      const { title, description, scenario, dueDate } = request.body;
      if (!title || !description || !dueDate) {
        return reply
          .code(400)
          .send({ error: "title, description and dueDate are required" });
      }
      if (!isValidScenario(scenario)) {
        return reply.code(400).send({ error: "Invalid scenario" });
      }

      const [created] = await db
        .insert(assignments)
        .values({
          classId,
          teacherId: request.authUser!.sub,
          title,
          description,
          scenario,
          dueDate,
        })
        .returning();

      return reply.code(201).send(toDto(created));
    },
  );

  app.get<{ Params: { id: string } }>(
    "/teacher/classes/:id/assignments",
    { preHandler: [authenticate, requireRole("teacher")] },
    async (request, reply) => {
      const classId = Number(request.params.id);
      const classRow = await getOwnedClass(classId, request.authUser!.sub);
      if (!classRow) return reply.code(404).send({ error: "Class not found" });

      const assignmentRows = await db
        .select()
        .from(assignments)
        .where(eq(assignments.classId, classId));

      const roster = await db
        .select({ student: users })
        .from(classStudents)
        .innerJoin(users, eq(classStudents.studentId, users.id))
        .where(eq(classStudents.classId, classId));

      const results: AssignmentWithCompletion[] = [];
      for (const assignment of assignmentRows) {
        const completion = [];
        for (const { student } of roster) {
          const completed = await hasCompletedAssignment(
            student.id,
            assignment.scenario,
            assignment.createdAt,
          );
          completion.push({
            studentId: student.id,
            displayName: student.displayName,
            completed,
          });
        }
        results.push({ ...toDto(assignment), completion });
      }

      return results;
    },
  );
}
