import type { FastifyInstance } from "fastify";
import { and, eq } from "drizzle-orm";
import type {
  LookupWordRequest,
  NotebookEntryDto,
  RecommendationsResponse,
  SimilarWordsResponse,
  VocabularyDto,
  CefrLevel,
} from "@englishclass/types";
import { db } from "../db/client";
import { conversations, vocabulary, vocabularyNotebook } from "../db/schema";
import { authenticate } from "../auth/middleware";
import { estimateDifficultyLevel } from "../conversations/difficulty";
import { lookupOrCreateVocabulary } from "../vocabulary/lookup";
import { findSimilarWords } from "../vocabulary/similarity";
import { getRecommendationsForConversation } from "../vocabulary/recommendations";

function vocabRowToDto(row: typeof vocabulary.$inferSelect): VocabularyDto {
  return {
    id: row.id,
    word: row.word,
    definition: row.definition,
    example: row.example,
    synonyms: JSON.parse(row.synonyms) as string[],
    antonyms: JSON.parse(row.antonyms) as string[],
    cefrLevel: row.cefrLevel as CefrLevel,
  };
}

export function registerVocabularyRoutes(app: FastifyInstance): void {
  app.post<{ Body: LookupWordRequest }>(
    "/vocabulary/lookup",
    { preHandler: authenticate },
    async (request, reply) => {
      const { word } = request.body;
      if (!word || !word.trim()) {
        return reply.code(400).send({ error: "word is required" });
      }

      const difficultyLevel = await estimateDifficultyLevel(request.authUser!.sub);
      const entry = await lookupOrCreateVocabulary(word, difficultyLevel);
      return entry;
    },
  );

  app.post<{ Body: LookupWordRequest }>(
    "/vocabulary/notebook",
    { preHandler: authenticate },
    async (request, reply) => {
      const { word } = request.body;
      if (!word || !word.trim()) {
        return reply.code(400).send({ error: "word is required" });
      }

      const difficultyLevel = await estimateDifficultyLevel(request.authUser!.sub);
      const entry = await lookupOrCreateVocabulary(word, difficultyLevel);

      const existing = await db.query.vocabularyNotebook.findFirst({
        where: and(
          eq(vocabularyNotebook.studentId, request.authUser!.sub),
          eq(vocabularyNotebook.vocabularyId, entry.id),
        ),
      });

      const row =
        existing ??
        (
          await db
            .insert(vocabularyNotebook)
            .values({
              studentId: request.authUser!.sub,
              vocabularyId: entry.id,
              source: "manual",
            })
            .returning()
        )[0];

      const dto: NotebookEntryDto = {
        id: row.id,
        source: row.source,
        createdAt: row.createdAt,
        vocabulary: entry,
      };
      return reply.code(201).send(dto);
    },
  );

  app.get(
    "/vocabulary/notebook",
    { preHandler: authenticate },
    async (request) => {
      const rows = await db
        .select({ notebook: vocabularyNotebook, vocabulary })
        .from(vocabularyNotebook)
        .innerJoin(vocabulary, eq(vocabularyNotebook.vocabularyId, vocabulary.id))
        .where(eq(vocabularyNotebook.studentId, request.authUser!.sub));

      const entries: NotebookEntryDto[] = rows.map((row) => ({
        id: row.notebook.id,
        source: row.notebook.source,
        createdAt: row.notebook.createdAt,
        vocabulary: vocabRowToDto(row.vocabulary),
      }));
      return entries;
    },
  );

  app.delete<{ Params: { id: string } }>(
    "/vocabulary/notebook/:id",
    { preHandler: authenticate },
    async (request, reply) => {
      const entryId = Number(request.params.id);
      const entry = await db.query.vocabularyNotebook.findFirst({
        where: eq(vocabularyNotebook.id, entryId),
      });
      if (!entry || entry.studentId !== request.authUser!.sub) {
        return reply.code(404).send({ error: "Notebook entry not found" });
      }

      await db.delete(vocabularyNotebook).where(eq(vocabularyNotebook.id, entryId));
      return { ok: true };
    },
  );

  app.get<{ Querystring: { conversationId?: string } }>(
    "/vocabulary/recommendations",
    { preHandler: authenticate },
    async (request, reply) => {
      const conversationId = Number(request.query.conversationId);
      if (!conversationId) {
        return reply.code(400).send({ error: "conversationId is required" });
      }

      const conversation = await db.query.conversations.findFirst({
        where: eq(conversations.id, conversationId),
      });
      if (!conversation || conversation.studentId !== request.authUser!.sub) {
        return reply.code(404).send({ error: "Conversation not found" });
      }

      const words = await getRecommendationsForConversation(
        conversationId,
        request.authUser!.sub,
      );
      const response: RecommendationsResponse = { words };
      return response;
    },
  );

  app.get<{ Querystring: { word?: string } }>(
    "/vocabulary/similar",
    { preHandler: authenticate },
    async (request, reply) => {
      const { word } = request.query;
      if (!word || !word.trim()) {
        return reply.code(400).send({ error: "word is required" });
      }

      const words = await findSimilarWords(word);
      const response: SimilarWordsResponse = { words };
      return response;
    },
  );
}
