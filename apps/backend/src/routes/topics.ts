import type { FastifyInstance } from "fastify";
import { and, eq } from "drizzle-orm";
import type {
  ConversationTopicOption,
  CreateCustomTopicRequest,
  CustomTopicDto,
} from "@englishclass/types";
import { ALL_SCENARIOS, SCENARIO_LABELS } from "@englishclass/types";
import { db } from "../db/client";
import { customTopics } from "../db/schema";
import { authenticate, requireRole } from "../auth/middleware";
import {
  getUserSchoolId,
  listAccessibleCustomTopics,
  listOwnTopics,
  customScenarioValue,
} from "../conversations/customTopics";

function toDto(row: typeof customTopics.$inferSelect): CustomTopicDto {
  return { id: row.id, title: row.title, prompt: row.prompt, createdAt: row.createdAt };
}

export function registerTopicRoutes(app: FastifyInstance): void {
  // Any authenticated user: the conversation topic picker (built-in + custom
  // topics available to their school).
  app.get("/topics", { preHandler: authenticate }, async (request) => {
    const schoolId = await getUserSchoolId(request.authUser!.sub);
    const custom = await listAccessibleCustomTopics(schoolId);

    const options: ConversationTopicOption[] = [
      ...ALL_SCENARIOS.map((s) => ({ value: s, label: SCENARIO_LABELS[s], isCustom: false })),
      ...custom.map((t) => ({ value: customScenarioValue(t.id), label: t.title, isCustom: true })),
    ];
    return options;
  });

  // Teacher: manage their own custom topics.
  app.get(
    "/teacher/topics",
    { preHandler: [authenticate, requireRole("teacher")] },
    async (request) => {
      const rows = await listOwnTopics(request.authUser!.sub);
      return rows.map(toDto);
    },
  );

  app.post<{ Body: CreateCustomTopicRequest }>(
    "/teacher/topics",
    { preHandler: [authenticate, requireRole("teacher")] },
    async (request, reply) => {
      const title = request.body?.title?.trim();
      const prompt = request.body?.prompt?.trim();
      if (!title || !prompt) {
        return reply.code(400).send({ error: "title and prompt are required" });
      }

      const schoolId = await getUserSchoolId(request.authUser!.sub);
      const [created] = await db
        .insert(customTopics)
        .values({ teacherId: request.authUser!.sub, schoolId, title, prompt })
        .returning();
      return reply.code(201).send(toDto(created));
    },
  );

  app.delete<{ Params: { id: string } }>(
    "/teacher/topics/:id",
    { preHandler: [authenticate, requireRole("teacher")] },
    async (request, reply) => {
      const id = Number(request.params.id);
      // A teacher can only delete their own topic.
      const deleted = await db
        .delete(customTopics)
        .where(and(eq(customTopics.id, id), eq(customTopics.teacherId, request.authUser!.sub)))
        .returning();
      if (deleted.length === 0) {
        return reply.code(404).send({ error: "Topic not found" });
      }
      return { ok: true };
    },
  );
}
