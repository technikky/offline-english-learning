import type { FastifyInstance } from "fastify";
import { eq } from "drizzle-orm";
import type { ExplainMistakeRequest, ExplainMistakeResponse } from "@englishclass/types";
import { db } from "../db/client";
import { conversations, grammarMistakes, messages } from "../db/schema";
import { authenticate } from "../auth/middleware";
import { estimateDifficultyLevel } from "../conversations/difficulty";
import { aiExplainClient } from "../grammar/aiExplainClient";

export function registerGrammarRoutes(app: FastifyInstance): void {
  app.post<{ Body: ExplainMistakeRequest }>(
    "/grammar/explain",
    { preHandler: authenticate },
    async (request, reply) => {
      const { mistakeId } = request.body;

      const mistake = await db.query.grammarMistakes.findFirst({
        where: eq(grammarMistakes.id, mistakeId),
      });
      if (!mistake) {
        return reply.code(404).send({ error: "Mistake not found" });
      }

      const message = await db.query.messages.findFirst({
        where: eq(messages.id, mistake.messageId),
      });
      if (!message) {
        return reply.code(404).send({ error: "Mistake not found" });
      }

      const conversation = await db.query.conversations.findFirst({
        where: eq(conversations.id, message.conversationId),
      });
      if (!conversation || conversation.studentId !== request.authUser!.sub) {
        return reply.code(404).send({ error: "Mistake not found" });
      }

      if (mistake.explanation && mistake.example !== null) {
        const cached: ExplainMistakeResponse = {
          explanation: mistake.explanation,
          example: mistake.example,
        };
        return cached;
      }

      const difficultyLevel = await estimateDifficultyLevel(request.authUser!.sub);
      const { explanation, example } = await aiExplainClient.explain(
        mistake.originalText,
        mistake.correctedText,
        mistake.ruleDescription,
        difficultyLevel,
      );

      await db
        .update(grammarMistakes)
        .set({ explanation, example })
        .where(eq(grammarMistakes.id, mistakeId));

      const response: ExplainMistakeResponse = { explanation, example };
      return response;
    },
  );
}
