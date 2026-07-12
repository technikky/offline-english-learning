import type { FastifyInstance } from "fastify";
import { eq, sql } from "drizzle-orm";
import type {
  CreateSchoolAdminRequest,
  CreateSchoolRequest,
  SchoolSummary,
  UserProfile,
} from "@englishclass/types";
import { db } from "../db/client";
import { schools, users } from "../db/schema";
import { hashPassword } from "../auth/password";
import { authenticate, requireRole } from "../auth/middleware";
import { buildUserProfile } from "../auth/profile";
import { recordAuditEvent } from "../audit/log";

// All routes here are platform-level and restricted to the super_admin.
export function registerSchoolRoutes(app: FastifyInstance): void {
  app.get(
    "/schools",
    { preHandler: [authenticate, requireRole("super_admin")] },
    async () => {
      const rows = await db.select().from(schools).orderBy(schools.id);

      // Per-role counts per school, in one grouped query.
      const counts = await db
        .select({
          schoolId: users.schoolId,
          role: users.role,
          count: sql<number>`count(*)`,
        })
        .from(users)
        .groupBy(users.schoolId, users.role);

      const summaries: SchoolSummary[] = rows.map((school) => {
        const forSchool = counts.filter((c) => c.schoolId === school.id);
        const countFor = (role: string) =>
          forSchool.find((c) => c.role === role)?.count ?? 0;
        return {
          id: school.id,
          name: school.name,
          createdAt: school.createdAt,
          adminCount: countFor("admin"),
          teacherCount: countFor("teacher"),
          studentCount: countFor("student"),
        };
      });
      return summaries;
    },
  );

  app.post<{ Body: CreateSchoolRequest }>(
    "/schools",
    { preHandler: [authenticate, requireRole("super_admin")] },
    async (request, reply) => {
      const name = request.body?.name?.trim();
      if (!name) return reply.code(400).send({ error: "name is required" });

      const [created] = await db.insert(schools).values({ name }).returning();

      await recordAuditEvent({
        userId: request.authUser!.sub,
        action: "school_created",
        detail: `school id=${created.id} name=${name}`,
        ipAddress: request.ip,
      });

      const summary: SchoolSummary = {
        id: created.id,
        name: created.name,
        createdAt: created.createdAt,
        adminCount: 0,
        teacherCount: 0,
        studentCount: 0,
      };
      return reply.code(201).send(summary);
    },
  );

  app.post<{ Params: { id: string }; Body: CreateSchoolAdminRequest }>(
    "/schools/:id/admins",
    { preHandler: [authenticate, requireRole("super_admin")] },
    async (request, reply) => {
      const schoolId = Number(request.params.id);
      const school = await db.query.schools.findFirst({
        where: eq(schools.id, schoolId),
      });
      if (!school) return reply.code(404).send({ error: "School not found" });

      const { email, password, displayName } = request.body;
      if (!email || !password || password.length < 8 || !displayName) {
        return reply.code(400).send({
          error: "email, displayName and a password of at least 8 characters are required",
        });
      }

      const existing = await db.query.users.findFirst({
        where: eq(users.email, email),
      });
      if (existing) {
        return reply.code(409).send({ error: "Email already registered" });
      }

      const passwordHash = await hashPassword(password);
      const [created] = await db
        .insert(users)
        .values({ email, passwordHash, role: "admin", displayName, schoolId })
        .returning();

      await recordAuditEvent({
        userId: request.authUser!.sub,
        action: "school_admin_created",
        detail: `admin id=${created.id} email=${email} school=${schoolId}`,
        ipAddress: request.ip,
      });

      const profile: UserProfile = await buildUserProfile(created);
      return reply.code(201).send(profile);
    },
  );
}
