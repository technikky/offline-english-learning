import type { FastifyInstance } from "fastify";
import { eq } from "drizzle-orm";
import type {
  ClassSummary,
  CreateClassRequest,
  RegisterStudentRequest,
} from "@englishclass/types";
import { db } from "../db/client";
import { classes, classStudents, users } from "../db/schema";
import { hashPassword } from "../auth/password";
import { authenticate, requireRole } from "../auth/middleware";

export function registerTeacherRoutes(app: FastifyInstance): void {
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

      const classRow = await db.query.classes.findFirst({
        where: eq(classes.id, classId),
      });
      if (!classRow || classRow.teacherId !== request.authUser!.sub) {
        return reply.code(404).send({ error: "Class not found" });
      }

      const existing = await db.query.users.findFirst({
        where: eq(users.email, email),
      });
      if (existing) {
        return reply.code(409).send({ error: "Email already registered" });
      }

      const passwordHash = await hashPassword(password);
      const [student] = await db
        .insert(users)
        .values({ email, passwordHash, role: "student", displayName })
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
