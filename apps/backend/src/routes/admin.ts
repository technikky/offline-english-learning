import type { FastifyInstance } from "fastify";
import { eq } from "drizzle-orm";
import type { CreateUserRequest, UserProfile } from "@englishclass/types";
import { db } from "../db/client";
import { users } from "../db/schema";
import { hashPassword } from "../auth/password";
import { authenticate, requireRole } from "../auth/middleware";
import { recordAuditEvent } from "../audit/log";
import { createBackup, listBackups, restoreBackup } from "../admin/backup";

export function registerAdminRoutes(app: FastifyInstance): void {
  app.post<{ Body: CreateUserRequest }>(
    "/admin/users",
    { preHandler: [authenticate, requireRole("admin")] },
    async (request, reply) => {
      const { email, password, displayName, role } = request.body;

      if (role !== "teacher" && role !== "student") {
        return reply
          .code(400)
          .send({ error: "role must be 'teacher' or 'student'" });
      }
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
        .values({ email, passwordHash, role, displayName })
        .returning();

      await recordAuditEvent({
        userId: request.authUser!.sub,
        action: "admin_user_created",
        detail: `created user id=${created.id} role=${role} email=${email}`,
        ipAddress: request.ip,
      });

      const profile: UserProfile = {
        id: created.id,
        email: created.email,
        role: created.role,
        displayName: created.displayName,
        mustChangePassword: created.mustChangePassword,
      };
      return reply.code(201).send(profile);
    },
  );

  app.post(
    "/admin/backups",
    { preHandler: [authenticate, requireRole("admin")] },
    async (request, reply) => {
      const backup = await createBackup();
      await recordAuditEvent({
        userId: request.authUser!.sub,
        action: "backup_created",
        detail: `filename=${backup.filename}`,
        ipAddress: request.ip,
      });
      return reply.code(201).send(backup);
    },
  );

  app.get(
    "/admin/backups",
    { preHandler: [authenticate, requireRole("admin")] },
    async () => {
      return listBackups();
    },
  );

  app.post<{ Params: { filename: string } }>(
    "/admin/backups/:filename/restore",
    { preHandler: [authenticate, requireRole("admin")] },
    async (request, reply) => {
      try {
        restoreBackup(request.params.filename);
      } catch (err) {
        return reply.code(404).send({ error: (err as Error).message });
      }
      await recordAuditEvent({
        userId: request.authUser!.sub,
        action: "backup_restored",
        detail: `filename=${request.params.filename}`,
        ipAddress: request.ip,
      });
      return { ok: true };
    },
  );
}
