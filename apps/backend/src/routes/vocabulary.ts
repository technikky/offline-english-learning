import type { FastifyInstance } from "fastify";
import { and, asc, eq, lte } from "drizzle-orm";
import type {
  LookupWordRequest,
  NotebookEntryDto,
  RecommendationsResponse,
  ReviewQueueResponse,
  ReviewRating,
  ReviewStatsResponse,
  SimilarWordsResponse,
  SrsScheduleDto,
  SeedNotebookRequest,
  SeedNotebookResponse,
  SubmitReviewRequest,
  SubmitReviewResponse,
  WordlistEntryDto,
  WordlistResponse,
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
import { scheduleReview } from "../vocabulary/srs";
import { listWordlist } from "../vocabulary/wordlist";
import { getTargetLanguage } from "../users/language";

const REVIEW_RATINGS: ReviewRating[] = ["again", "hard", "good", "easy"];
const LEVELS: string[] = ["A1", "A2", "B1", "B2", "C1", "C2"];
const DEFAULT_SEED_COUNT = 10;
const MAX_SEED_COUNT = 30;
const MATURE_INTERVAL_DAYS = 21;
const DEFAULT_REVIEW_LIMIT = 20;

type NotebookRow = typeof vocabularyNotebook.$inferSelect;

// SQLite's current_timestamp is UTC formatted 'YYYY-MM-DD HH:MM:SS'. We produce
// the same shape from JS so due-date comparisons line up regardless of which
// clock (SQLite's default vs JS's) wrote a given row.
function nowSqlUtc(): string {
  return new Date().toISOString().slice(0, 19).replace("T", " ");
}

function sqlUtcPlusDays(days: number): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 19).replace("T", " ");
}

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

function srsRowToDto(row: NotebookRow, now: string): SrsScheduleDto {
  const dueAt = row.dueAt ?? row.createdAt;
  return {
    repetitions: row.repetitions,
    easeFactor: row.easeFactor,
    intervalDays: row.intervalDays,
    lapses: row.lapses,
    dueAt,
    lastReviewedAt: row.lastReviewedAt ?? null,
    due: dueAt <= now,
  };
}

function notebookRowsToDto(
  notebookRow: NotebookRow,
  vocabRow: typeof vocabulary.$inferSelect,
  now: string,
): NotebookEntryDto {
  return {
    id: notebookRow.id,
    source: notebookRow.source,
    createdAt: notebookRow.createdAt,
    vocabulary: vocabRowToDto(vocabRow),
    srs: srsRowToDto(notebookRow, now),
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

      // A brand-new card keeps the schema defaults (due immediately, ease 2.5),
      // so a freshly-saved word joins the review queue right away.
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
        srs: srsRowToDto(row, nowSqlUtc()),
      };
      return reply.code(201).send(dto);
    },
  );

  app.get(
    "/vocabulary/notebook",
    { preHandler: authenticate },
    async (request) => {
      const now = nowSqlUtc();
      const rows = await db
        .select({ notebook: vocabularyNotebook, vocabulary })
        .from(vocabularyNotebook)
        .innerJoin(vocabulary, eq(vocabularyNotebook.vocabularyId, vocabulary.id))
        .where(eq(vocabularyNotebook.studentId, request.authUser!.sub));

      const entries: NotebookEntryDto[] = rows.map((row) =>
        notebookRowsToDto(row.notebook, row.vocabulary, now),
      );
      return entries;
    },
  );

  // Stage 25: the spaced-repetition review queue -- cards whose next review is
  // due now, oldest-due first, so the most overdue words surface earliest.
  app.get<{ Querystring: { limit?: string } }>(
    "/vocabulary/review/queue",
    { preHandler: authenticate },
    async (request) => {
      const now = nowSqlUtc();
      const parsedLimit = Number(request.query.limit);
      const limit =
        Number.isFinite(parsedLimit) && parsedLimit > 0
          ? Math.min(parsedLimit, 100)
          : DEFAULT_REVIEW_LIMIT;

      const rows = await db
        .select({ notebook: vocabularyNotebook, vocabulary })
        .from(vocabularyNotebook)
        .innerJoin(vocabulary, eq(vocabularyNotebook.vocabularyId, vocabulary.id))
        .where(
          and(
            eq(vocabularyNotebook.studentId, request.authUser!.sub),
            lte(vocabularyNotebook.dueAt, now),
          ),
        )
        .orderBy(asc(vocabularyNotebook.dueAt))
        .limit(limit);

      const response: ReviewQueueResponse = {
        cards: rows.map((row) => notebookRowsToDto(row.notebook, row.vocabulary, now)),
      };
      return response;
    },
  );

  // Stage 25: counts powering the "Review (N due)" badge and the queue summary.
  app.get(
    "/vocabulary/review/stats",
    { preHandler: authenticate },
    async (request) => {
      const now = nowSqlUtc();
      const rows = await db
        .select()
        .from(vocabularyNotebook)
        .where(eq(vocabularyNotebook.studentId, request.authUser!.sub));

      const response: ReviewStatsResponse = {
        total: rows.length,
        due: rows.filter((r) => (r.dueAt ?? r.createdAt) <= now).length,
        learning: rows.filter((r) => r.repetitions < 2).length,
        mature: rows.filter((r) => r.intervalDays >= MATURE_INTERVAL_DAYS).length,
      };
      return response;
    },
  );

  // Stage 25: grade a card. Applies the SM-2 scheduler and persists the new
  // schedule; `dueAt` is recomputed from the returned interval.
  app.post<{ Params: { id: string }; Body: SubmitReviewRequest }>(
    "/vocabulary/review/:id",
    { preHandler: authenticate },
    async (request, reply) => {
      const entryId = Number(request.params.id);
      const { rating } = request.body ?? {};
      if (!rating || !REVIEW_RATINGS.includes(rating)) {
        return reply
          .code(400)
          .send({ error: `rating must be one of: ${REVIEW_RATINGS.join(", ")}` });
      }

      const entry = await db.query.vocabularyNotebook.findFirst({
        where: eq(vocabularyNotebook.id, entryId),
      });
      if (!entry || entry.studentId !== request.authUser!.sub) {
        return reply.code(404).send({ error: "Notebook entry not found" });
      }

      const next = scheduleReview(
        {
          repetitions: entry.repetitions,
          easeFactor: entry.easeFactor,
          intervalDays: entry.intervalDays,
          lapses: entry.lapses,
        },
        rating,
      );

      const now = nowSqlUtc();
      const dueAt = sqlUtcPlusDays(next.intervalDays);
      const [updated] = await db
        .update(vocabularyNotebook)
        .set({
          repetitions: next.repetitions,
          easeFactor: next.easeFactor,
          intervalDays: next.intervalDays,
          lapses: next.lapses,
          dueAt,
          lastReviewedAt: now,
        })
        .where(eq(vocabularyNotebook.id, entryId))
        .returning();

      const response: SubmitReviewResponse = {
        entryId: updated.id,
        srs: srsRowToDto(updated, now),
      };
      return response;
    },
  );

  // Stage 33: browse the curated CEFR wordlist, marking which words the
  // student has already saved.
  app.get<{ Querystring: { level?: string } }>(
    "/vocabulary/wordlist",
    { preHandler: authenticate },
    async (request) => {
      const level = LEVELS.includes(request.query.level ?? "")
        ? (request.query.level as CefrLevel)
        : undefined;
      const language = await getTargetLanguage(request.authUser!.sub);
      const entries = listWordlist(level, language);

      const savedRows = await db
        .select({ word: vocabulary.word })
        .from(vocabularyNotebook)
        .innerJoin(vocabulary, eq(vocabularyNotebook.vocabularyId, vocabulary.id))
        .where(eq(vocabularyNotebook.studentId, request.authUser!.sub));
      const saved = new Set(savedRows.map((r) => r.word));

      const response: WordlistResponse = {
        level: level ?? null,
        entries: entries.map<WordlistEntryDto>((e) => ({
          word: e.word,
          cefrLevel: e.cefrLevel,
          definition: e.definition,
          example: e.example,
          saved: saved.has(e.word),
        })),
        totalSaved: entries.filter((e) => saved.has(e.word)).length,
      };
      return response;
    },
  );

  // Stage 33: seed the spaced-repetition notebook with a starter pack. Before
  // this, SRS only ever saw words a student happened to look up, so the most
  // effective retention mechanism in the platform sat idle until they went
  // hunting for words themselves.
  app.post<{ Body: SeedNotebookRequest }>(
    "/vocabulary/notebook/seed",
    { preHandler: authenticate },
    async (request, reply) => {
      const { level, count } = request.body ?? {};
      if (!level || !LEVELS.includes(level)) {
        return reply.code(400).send({ error: `level must be one of: ${LEVELS.join(", ")}` });
      }
      const limit = Math.min(Math.max(Number(count) || DEFAULT_SEED_COUNT, 1), MAX_SEED_COUNT);
      const studentId = request.authUser!.sub;
      const language = await getTargetLanguage(studentId);

      const savedRows = await db
        .select({ word: vocabulary.word })
        .from(vocabularyNotebook)
        .innerJoin(vocabulary, eq(vocabularyNotebook.vocabularyId, vocabulary.id))
        .where(eq(vocabularyNotebook.studentId, studentId));
      const saved = new Set(savedRows.map((r) => r.word));

      const levelWords = listWordlist(level, language);
      const candidates = levelWords.filter((e) => !saved.has(e.word));
      const skipped = levelWords.length - candidates.length;

      let added = 0;
      // Sequential: each word still needs an embedding from the single-threaded
      // AI service. Curated words skip the LLM, so this is embed-only and fast.
      for (const entry of candidates.slice(0, limit)) {
        const vocabEntry = await lookupOrCreateVocabulary(entry.word, level);
        const existing = await db.query.vocabularyNotebook.findFirst({
          where: and(
            eq(vocabularyNotebook.studentId, studentId),
            eq(vocabularyNotebook.vocabularyId, vocabEntry.id),
          ),
        });
        if (existing) continue;
        await db.insert(vocabularyNotebook).values({
          studentId,
          vocabularyId: vocabEntry.id,
          source: "recommended",
        });
        added += 1;
      }

      const response: SeedNotebookResponse = { added, skipped, level };
      return response;
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

      // Stage 33: the student's level decides which words are worth
      // recommending, so it has to be threaded through.
      const studentLevel = await estimateDifficultyLevel(request.authUser!.sub);
      const language = await getTargetLanguage(request.authUser!.sub);
      const words = await getRecommendationsForConversation(
        conversationId,
        request.authUser!.sub,
        studentLevel,
        language,
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
