import type { FastifyInstance } from "fastify";
import { eq } from "drizzle-orm";
import type {
  ClassDetail,
  ClassSummary,
  CreateClassRequest,
  RegisterStudentRequest,
  StudentSummary,
} from "@englishclass/types";
import { db } from "../db/client";
import { classes, classStudents, users } from "../db/schema";
import { hashPassword } from "../auth/password";
import { authenticate, requireRole } from "../auth/middleware";
import { getOwnedClass } from "../teacher/ownership";

export function registerTeacherRoutes(app: FastifyInstance): void {
  app.get(
    "/teacher/classes",
    { preHandler: [authenticate, requireRole("teacher")] },
    async (request) => {
      const rows = await db
        .select()
        .from(classes)
        .where(eq(classes.teacherId, request.authUser!.sub));

      const summaries: ClassSummary[] = rows.map((row) => ({
        id: row.id,
        name: row.name,
        teacherId: row.teacherId,
      }));
      return summaries;
    },
  );

  app.get<{ Params: { id: string } }>(
    "/teacher/classes/:id",
    { preHandler: [authenticate, requireRole("teacher")] },
    async (request, reply) => {
      const classId = Number(request.params.id);
      const classRow = await getOwnedClass(classId, request.authUser!.sub);
      if (!classRow) return reply.code(404).send({ error: "Class not found" });

      const roster = await db
        .select({ student: users })
        .from(classStudents)
        .innerJoin(users, eq(classStudents.studentId, users.id))
        .where(eq(classStudents.classId, classId));

      const students: StudentSummary[] = roster.map((row) => ({
        id: row.student.id,
        email: row.student.email,
        displayName: row.student.displayName,
      }));

      const detail: ClassDetail = {
        id: classRow.id,
        name: classRow.name,
        teacherId: classRow.teacherId,
        students,
      };
      return detail;
    },
  );

  app.post<{ Body: CreateClassRequest }>(
    "/teacher/classes",
    { preHandler: [authenticate, requireRole("teacher")] },
    async (request, reply) => {
      const { name } = request.body;
      if (!name) return reply.code(400).send({ error: "name is required" });

      const [created] = await db
        .insert(classes)
        .values({ name, teacherId: request.authUser!.sub })
        .returning();

      const summary: ClassSummary = {
        id: created.id,
        name: created.name,
        teacherId: created.teacherId,
      };
      return reply.code(201).send(summary);
    },
  );

  app.post<{ Params: { id: string }; Body: RegisterStudentRequest }>(
    "/teacher/classes/:id/students",
    { preHandler: [authenticate, requireRole("teacher")] },
    async (request, reply) => {
      const classId = Number(request.params.id);
      const { email, password, displayName } = request.body;

      if (!email || !password || password.length < 8 || !displayName) {
        return reply.code(400).send({
          error: "email, displayName and a password of at least 8 characters are required",
        });
      }

      const classRow = await getOwnedClass(classId, request.authUser!.sub);
      if (!classRow) {
        return reply.code(404).send({ error: "Class not found" });
      }

      const existing = await db.query.users.findFirst({
        where: eq(users.email, email),
      });
      if (existing) {
        return reply.code(409).send({ error: "Email already registered" });
      }

      // Stage 20: the new student inherits the teacher's school.
      const teacher = await db.query.users.findFirst({
        where: eq(users.id, request.authUser!.sub),
      });

      const passwordHash = await hashPassword(password);
      const [student] = await db
        .insert(users)
        .values({ email, passwordHash, role: "student", displayName, schoolId: teacher?.schoolId ?? null })
        .returning();

      await db.insert(classStudents).values({
        classId,
        studentId: student.id,
      });

      return reply.code(201).send({
        id: student.id,
        email: student.email,
        displayName: student.displayName,
        role: student.role,
        mustChangePassword: student.mustChangePassword,
      });
    },
  );
}
