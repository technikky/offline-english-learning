import type { FastifyInstance } from "fastify";
import { authenticate } from "../auth/middleware";
import { getLearningHistory } from "../history/aggregate";

export function registerHistoryRoutes(app: FastifyInstance): void {
  // A student's own unified activity history across every module.
  app.get("/history", { preHandler: authenticate }, async (request) => {
    return getLearningHistory(request.authUser!.sub);
  });
}
