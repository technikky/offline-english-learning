import type { FastifyInstance } from "fastify";
import { eq } from "drizzle-orm";
import type { CefrLevel } from "@englishclass/types";
import { db } from "../db/client";
import { users } from "../db/schema";
import { authenticate } from "../auth/middleware";
import { buildCurriculum, getCompletionSets } from "../curriculum/progress";

const LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2"];

function asCefrLevel(value: string | null | undefined): CefrLevel | null {
  return value != null && LEVELS.includes(value) ? (value as CefrLevel) : null;
}

export function registerCurriculumRoutes(app: FastifyInstance): void {
  app.get("/curriculum", { preHandler: authenticate }, async (request) => {
    const studentId = request.authUser!.sub;
    const [sets, user] = await Promise.all([
      getCompletionSets(studentId),
      db.query.users.findFirst({ where: eq(users.id, studentId) }),
    ]);
    return buildCurriculum(sets, asCefrLevel(user?.placementLevel));
  });
}
