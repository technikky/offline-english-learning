import type { FastifyInstance } from "fastify";
import { and, eq } from "drizzle-orm";
import { db } from "../db/client";
import { classStudents, classes } from "../db/schema";
import { authenticate, requireRole } from "../auth/middleware";
import { getStudentAnalytics } from "../analytics/aggregate";

async function teacherOwnsStudent(teacherId: number, studentId: number): Promise<boolean> {
  const match = await db
    .select({ id: classStudents.id })
    .from(classStudents)
    .innerJoin(classes, eq(classStudents.classId, classes.id))
    .where(and(eq(classes.teacherId, teacherId), eq(classStudents.studentId, studentId)))
    .limit(1);
  return match.length > 0;
}

export function registerAnalyticsRoutes(app: FastifyInstance): void {
  app.get(
    "/analytics/me",
    { preHandler: authenticate },
    async (request) => {
      return getStudentAnalytics(request.authUser!.sub);
    },
  );

  app.get<{ Params: { id: string } }>(
    "/analytics/students/:id",
    { preHandler: [authenticate, requireRole("teacher")] },
    async (request, reply) => {
      const studentId = Number(request.params.id);
      const owns = await teacherOwnsStudent(request.authUser!.sub, studentId);
      if (!owns) return reply.code(404).send({ error: "Student not found" });

      return getStudentAnalytics(studentId);
    },
  );
}
