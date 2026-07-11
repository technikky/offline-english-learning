import type { FastifyInstance } from "fastify";
import { eq } from "drizzle-orm";
import type {
  LoginRequest,
  LoginResponse,
  LogoutRequest,
  RefreshRequest,
  UserProfile,
} from "@englishclass/types";
import { db } from "../db/client";
import { users } from "../db/schema";
import { verifyPassword, hashPassword } from "../auth/password";
import {
  accessTokenTtlSeconds,
  issueRefreshToken,
  revokeRefreshToken,
  rotateRefreshToken,
  signAccessToken,
} from "../auth/tokens";
import { authenticate } from "../auth/middleware";
import { recordAuditEvent } from "../audit/log";

const loginRateLimit = { rateLimit: { max: 10, timeWindow: "1 minute" } };

function toProfile(user: typeof users.$inferSelect): UserProfile {
  return {
    id: user.id,
    email: user.email,
    role: user.role,
    displayName: user.displayName,
    mustChangePassword: user.mustChangePassword,
  };
}

export function registerAuthRoutes(app: FastifyInstance): void {
  app.post<{ Body: LoginRequest }>(
    "/auth/login",
    { config: loginRateLimit },
    async (request, reply) => {
      const { email, password } = request.body;

      const user = await db.query.users.findFirst({
        where: eq(users.email, email),
      });

      if (!user || !(await verifyPassword(user.passwordHash, password))) {
        await recordAuditEvent({
          userId: user?.id ?? null,
          action: "login_failure",
          detail: `email=${email}`,
          ipAddress: request.ip,
        });
        return reply.code(401).send({ error: "Invalid email or password" });
      }

      const accessToken = signAccessToken({ sub: user.id, role: user.role });
      const refreshToken = await issueRefreshToken(user.id);

      await recordAuditEvent({
        userId: user.id,
        action: "login_success",
        detail: null,
        ipAddress: request.ip,
      });

      const response: LoginResponse = {
        accessToken,
        refreshToken,
        expiresInSeconds: accessTokenTtlSeconds,
        user: toProfile(user),
      };
      return response;
    },
  );

  app.post<{ Body: RefreshRequest }>(
    "/auth/refresh",
    { config: loginRateLimit },
    async (request, reply) => {
      const rotated = await rotateRefreshToken(request.body.refreshToken);
      if (!rotated) {
        return reply.code(401).send({ error: "Invalid or expired refresh token" });
      }
      return { ...rotated, expiresInSeconds: accessTokenTtlSeconds };
    },
  );

  app.post<{ Body: LogoutRequest }>("/auth/logout", async (request) => {
    await revokeRefreshToken(request.body.refreshToken);
    await recordAuditEvent({
      userId: request.authUser?.sub ?? null,
      action: "logout",
      detail: null,
      ipAddress: request.ip,
    });
    return { ok: true };
  });

  app.get(
    "/auth/me",
    { preHandler: authenticate },
    async (request, reply) => {
      const user = await db.query.users.findFirst({
        where: eq(users.id, request.authUser!.sub),
      });
      if (!user) return reply.code(404).send({ error: "User not found" });
      return toProfile(user);
    },
  );

  app.post<{ Body: { newPassword: string } }>(
    "/auth/change-password",
    { preHandler: authenticate },
    async (request, reply) => {
      const { newPassword } = request.body;
      if (!newPassword || newPassword.length < 8) {
        return reply
          .code(400)
          .send({ error: "Password must be at least 8 characters" });
      }

      const passwordHash = await hashPassword(newPassword);
      await db
        .update(users)
        .set({ passwordHash, mustChangePassword: false })
        .where(eq(users.id, request.authUser!.sub));

      return { ok: true };
    },
  );
}
