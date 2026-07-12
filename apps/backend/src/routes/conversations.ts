import type { FastifyInstance } from "fastify";
import { asc, eq } from "drizzle-orm";
import type {
  ConversationDetail,
  ConversationSummary,
  CreateConversationRequest,
  Scenario,
  SendMessageRequest,
} from "@englishclass/types";
import { db } from "../db/client";
import { conversations, grammarMistakes, messages } from "../db/schema";
import { authenticate } from "../auth/middleware";
import { estimateDifficultyLevel } from "../conversations/difficulty";
import { requestAiChatStream, type AiChatMessage } from "../conversations/aiClient";
import { checkAndPersistGrammar } from "../grammar/checkAndPersist";
import { isValidScenario } from "../conversations/scenarios";
import {
  isCustomScenario,
  parseCustomTopicId,
  isTopicAccessible,
  getCustomTopic,
  getUserSchoolId,
} from "../conversations/customTopics";

export function registerConversationRoutes(app: FastifyInstance): void {
  app.post<{ Body: CreateConversationRequest }>(
    "/conversations",
    { preHandler: authenticate },
    async (request, reply) => {
      const { scenario } = request.body;

      // Stage 23: a scenario is either a built-in key or "custom:<id>" for a
      // teacher-authored topic the student's school has access to.
      if (isCustomScenario(scenario)) {
        const topicId = parseCustomTopicId(scenario);
        const schoolId = await getUserSchoolId(request.authUser!.sub);
        if (!topicId || !(await isTopicAccessible(topicId, schoolId))) {
          return reply.code(400).send({ error: "Invalid or inaccessible topic" });
        }
      } else if (!isValidScenario(scenario)) {
        return reply.code(400).send({ error: "Invalid scenario" });
      }

      const [created] = await db
        .insert(conversations)
        .values({ studentId: request.authUser!.sub, scenario })
        .returning();

      const summary: ConversationSummary = {
        id: created.id,
        scenario: created.scenario as Scenario,
        createdAt: created.createdAt,
      };
      return reply.code(201).send(summary);
    },
  );

  app.get<{ Params: { id: string } }>(
    "/conversations/:id",
    { preHandler: authenticate },
    async (request, reply) => {
      const conversationId = Number(request.params.id);
      const conversation = await db.query.conversations.findFirst({
        where: eq(conversations.id, conversationId),
      });

      if (!conversation || conversation.studentId !== request.authUser!.sub) {
        return reply.code(404).send({ error: "Conversation not found" });
      }

      const history = await db
        .select()
        .from(messages)
        .where(eq(messages.conversationId, conversationId))
        .orderBy(asc(messages.createdAt));

      const mistakesByMessageId = new Map<number, (typeof grammarMistakes.$inferSelect)[]>();
      for (const message of history) {
        const rows = await db
          .select()
          .from(grammarMistakes)
          .where(eq(grammarMistakes.messageId, message.id));
        if (rows.length > 0) mistakesByMessageId.set(message.id, rows);
      }

      const detail: ConversationDetail = {
        id: conversation.id,
        scenario: conversation.scenario as Scenario,
        createdAt: conversation.createdAt,
        messages: history.map((m) => ({
          id: m.id,
          role: m.role,
          content: m.content,
          createdAt: m.createdAt,
          grammarMistakes: mistakesByMessageId.get(m.id)?.map((row) => ({
            id: row.id,
            originalText: row.originalText,
            correctedText: row.correctedText,
            ruleId: row.ruleId,
            ruleDescription: row.ruleDescription,
            category: row.category,
            explanation: row.explanation,
            example: row.example,
          })),
        })),
      };
      return detail;
    },
  );

  app.post<{ Params: { id: string }; Body: SendMessageRequest }>(
    "/conversations/:id/messages",
    { preHandler: authenticate },
    async (request, reply) => {
      const conversationId = Number(request.params.id);
      const { content } = request.body;

      if (!content || !content.trim()) {
        return reply.code(400).send({ error: "content is required" });
      }

      const conversation = await db.query.conversations.findFirst({
        where: eq(conversations.id, conversationId),
      });
      if (!conversation || conversation.studentId !== request.authUser!.sub) {
        return reply.code(404).send({ error: "Conversation not found" });
      }

      const [userMessage] = await db
        .insert(messages)
        .values({
          conversationId,
          role: "user",
          content,
        })
        .returning();

      const persistedMistakes = await checkAndPersistGrammar(userMessage.id, content);

      const history = await db
        .select()
        .from(messages)
        .where(eq(messages.conversationId, conversationId))
        .orderBy(asc(messages.createdAt));

      const aiMessages: AiChatMessage[] = history.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const difficultyLevel = await estimateDifficultyLevel(request.authUser!.sub);

      // Stage 23: for a teacher-authored topic, supply its prompt to the AI.
      let customPrompt: string | null = null;
      const customTopicId = parseCustomTopicId(conversation.scenario);
      if (customTopicId) {
        customPrompt = (await getCustomTopic(customTopicId))?.prompt ?? null;
      }

      const aiResponse = await requestAiChatStream(
        aiMessages,
        conversation.scenario,
        difficultyLevel,
        customPrompt,
      );

      if (!aiResponse.ok || !aiResponse.body) {
        return reply.code(502).send({ error: "AI service unavailable" });
      }

      reply.hijack();
      reply.raw.writeHead(200, { "Content-Type": "application/x-ndjson" });
      reply.raw.write(JSON.stringify({ grammarMistakes: persistedMistakes }) + "\n");

      const reader = aiResponse.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let fullText = "";

      // eslint-disable-next-line no-constant-condition
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunkText = decoder.decode(value, { stream: true });
        reply.raw.write(chunkText);
        buffer += chunkText;

        let newlineIndex: number;
        while ((newlineIndex = buffer.indexOf("\n")) >= 0) {
          const line = buffer.slice(0, newlineIndex);
          buffer = buffer.slice(newlineIndex + 1);
          if (!line.trim()) continue;
          try {
            const parsed = JSON.parse(line);
            if (parsed.done) fullText = parsed.fullText;
          } catch {
            // ignore malformed line; forwarding to client already happened
          }
        }
      }

      reply.raw.end();

      if (fullText) {
        await db.insert(messages).values({
          conversationId,
          role: "assistant",
          content: fullText,
        });
      }
    },
  );
}
