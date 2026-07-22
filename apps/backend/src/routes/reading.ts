import type { FastifyInstance } from "fastify";
import { db } from "../db/client";
import { readingResults } from "../db/schema";
import { authenticate } from "../auth/middleware";
import { listReadingPassages, getReadingPassage } from "../reading/passages";
import { getOrCreateComprehension } from "../reading/comprehension";
import { getReadingProgress } from "../reading/progress";
import { getTargetLanguage } from "../users/language";
import type { ReadingPassageDetail, SubmitReadingRequest, SubmitReadingResponse } from "@englishclass/types";

function normalizeAnswer(value: string): string {
  return value.trim().toLowerCase();
}

export function registerReadingRoutes(app: FastifyInstance): void {
  app.get("/reading/passages", { preHandler: authenticate }, async (request) => {
    const language = await getTargetLanguage(request.authUser!.sub);
    return listReadingPassages(language);
  });

  app.get<{ Params: { id: string } }>(
    "/reading/passages/:id",
    { preHandler: authenticate },
    async (request, reply) => {
      const passage = getReadingPassage(request.params.id);
      if (!passage) return reply.code(404).send({ error: "Passage not found" });

      let comprehension;
      try {
        comprehension = await getOrCreateComprehension(passage);
      } catch {
        return reply.code(502).send({ error: "AI service unavailable" });
      }

      const detail: ReadingPassageDetail = {
        id: passage.id,
        title: passage.title,
        cefrLevel: passage.cefrLevel,
        estimatedReadingMinutes: passage.estimatedReadingMinutes,
        content: passage.content,
        summary: comprehension.summary,
        vocabularyWords: comprehension.vocabularyWords,
        questions: comprehension.questions,
      };
      return detail;
    },
  );

  app.post<{ Params: { id: string }; Body: SubmitReadingRequest }>(
    "/reading/passages/:id/submit",
    { preHandler: authenticate },
    async (request, reply) => {
      const passage = getReadingPassage(request.params.id);
      if (!passage) return reply.code(404).send({ error: "Passage not found" });

      const { answers } = request.body;
      if (!Array.isArray(answers)) {
        return reply.code(400).send({ error: "answers must be an array" });
      }

      let comprehension;
      try {
        comprehension = await getOrCreateComprehension(passage);
      } catch {
        return reply.code(502).send({ error: "AI service unavailable" });
      }

      const totalQuestions = comprehension.questions.length;
      let correctCount = 0;
      for (let i = 0; i < totalQuestions; i++) {
        const question = comprehension.questions[i];
        const studentAnswer = answers[i] ?? "";
        if (normalizeAnswer(studentAnswer) === normalizeAnswer(question.correctAnswer)) {
          correctCount++;
        }
      }
      const score = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;

      await db.insert(readingResults).values({
        studentId: request.authUser!.sub,
        passageId: passage.id,
        score,
        correctCount,
        totalQuestions,
      });

      const response: SubmitReadingResponse = { score, correctCount, totalQuestions };
      return response;
    },
  );

  app.get("/reading/progress", { preHandler: authenticate }, async (request) => {
    return getReadingProgress(request.authUser!.sub);
  });
}
