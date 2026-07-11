import type { FastifyInstance } from "fastify";
import { eq } from "drizzle-orm";
import type { CreateUserRequest, UserProfile } from "@englishclass/types";
import { db } from "../db/client";
import { users } from "../db/schema";
import { hashPassword } from "../auth/password";
import { authenticate, requireRole } from "../auth/middleware";

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
}
