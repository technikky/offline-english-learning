import type { FastifyReply, FastifyRequest } from "fastify";
import { verifyAccessToken, type AccessTokenPayload } from "./tokens";

declare module "fastify" {
  interface FastifyRequest {
    authUser?: AccessTokenPayload;
  }
}

export async function authenticate(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const header = request.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    return reply.code(401).send({ error: "Missing bearer token" });
  }

  try {
    request.authUser = verifyAccessToken(header.slice("Bearer ".length));
  } catch {
    return reply.code(401).send({ error: "Invalid or expired token" });
  }
}

export function requireRole(...roles: AccessTokenPayload["role"][]) {
  return async function (request: FastifyRequest, reply: FastifyReply): Promise<void> {
    if (!request.authUser || !roles.includes(request.authUser.role)) {
      return reply.code(403).send({ error: "Insufficient permissions" });
    }
  };
}
