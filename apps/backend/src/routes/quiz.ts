import { randomUUID } from "node:crypto";
import type { FastifyInstance } from "fastify";
import { and, desc, eq, isNotNull } from "drizzle-orm";
import { db } from "../db/client";
import { quizInstances } from "../db/schema";
import { authenticate } from "../auth/middleware";
import {
  aiQuizClient,
  isValidQuizCategory,
  listQuizCategories,
  type GeneratedQuizQuestion,
} from "../quiz/aiQuizClient";
import { getTargetLanguage } from "../users/language";
import { selectQuestions } from "../quiz/questionBank";
import type {
  CefrLevel,
  GenerateQuizRequest,
  QuizCategory,
  QuizDto,
  QuizProgressResponse,
  QuizResultResponse,
  SubmitQuizRequest,
} from "@englishclass/types";

// Matches QUIZ_QUESTION_COUNT in the AI service's prompt builder.
const QUIZ_QUESTION_COUNT = 5;

function normalize(value: string): string {
  return value.trim().toLowerCase();
}

export function registerQuizRoutes(app: FastifyInstance): void {
  app.post<{ Body: GenerateQuizRequest }>(
    "/quiz/generate",
    { preHandler: authenticate },
    async (request, reply) => {
      const category = request.body?.category ?? "grammar";
      const difficultyLevel = request.body?.difficultyLevel ?? "B1";
      const targetLanguage = await getTargetLanguage(request.authUser!.sub);
      if (!isValidQuizCategory(category, targetLanguage)) {
        return reply.code(400).send({ error: "Invalid category" });
      }

      // Stage 38: curated questions first, AI only for any shortfall. A bucket
      // that the bank covers never touches the model, so the quiz appears
      // instantly and is always well-formed -- the same curated-first pattern
      // as the Stage 33 vocabulary wordlist.
      const curated = selectQuestions(
        targetLanguage,
        category,
        difficultyLevel as CefrLevel,
        QUIZ_QUESTION_COUNT,
      );
      let questions: GeneratedQuizQuestion[] = curated.map((q) => ({
        type: q.type,
        question: q.question,
        options: q.options,
        correctAnswer: q.correctAnswer,
        explanation: q.explanation,
      }));

      if (questions.length < QUIZ_QUESTION_COUNT) {
        try {
          const generated = await aiQuizClient.generate(
            category,
            difficultyLevel,
            targetLanguage,
          );
          questions = [...questions, ...generated].slice(0, QUIZ_QUESTION_COUNT);
        } catch {
          // A generation failure is only fatal if the bank gave us nothing.
          if (questions.length === 0) {
            return reply.code(502).send({ error: "AI service unavailable" });
          }
        }
      }

      if (questions.length === 0) {
        return reply.code(502).send({ error: "AI service could not generate a quiz" });
      }

      const quizId = randomUUID();
      await db.insert(quizInstances).values({
        id: quizId,
        studentId: request.authUser!.sub,
        category,
        difficultyLevel,
        questionsJson: JSON.stringify(questions),
      });

      // Return the student-facing view: no correctAnswer/explanation yet.
      const dto: QuizDto = {
        quizId,
        category: category as QuizCategory,
        difficultyLevel: difficultyLevel as CefrLevel,
        questions: questions.map((q) => ({
          type: q.type,
          question: q.question,
          options: q.options,
        })),
      };
      return dto;
    },
  );

  app.post<{ Params: { quizId: string }; Body: SubmitQuizRequest }>(
    "/quiz/:quizId/submit",
    { preHandler: authenticate },
    async (request, reply) => {
      const instance = await db.query.quizInstances.findFirst({
        where: and(
          eq(quizInstances.id, request.params.quizId),
          eq(quizInstances.studentId, request.authUser!.sub),
        ),
      });
      if (!instance) return reply.code(404).send({ error: "Quiz not found" });

      const questions = JSON.parse(instance.questionsJson) as GeneratedQuizQuestion[];
      const answers = request.body?.answers ?? [];
      if (!Array.isArray(answers)) {
        return reply.code(400).send({ error: "answers must be an array" });
      }

      let correctCount = 0;
      const results = questions.map((q, i) => {
        const studentAnswer = answers[i] ?? "";
        const isCorrect = normalize(studentAnswer) === normalize(q.correctAnswer);
        if (isCorrect) correctCount++;
        return {
          question: q.question,
          options: q.options,
          studentAnswer,
          correctAnswer: q.correctAnswer,
          isCorrect,
          explanation: q.explanation,
        };
      });
      const score = questions.length > 0 ? Math.round((correctCount / questions.length) * 100) : 0;

      await db
        .update(quizInstances)
        .set({ score })
        .where(eq(quizInstances.id, instance.id));

      const response: QuizResultResponse = {
        score,
        correctCount,
        totalQuestions: questions.length,
        results,
      };
      return response;
    },
  );

  // Stage 31: the category list depends on the language being learned.
  app.get("/quiz/categories", { preHandler: authenticate }, async (request) => {
    const targetLanguage = await getTargetLanguage(request.authUser!.sub);
    return { categories: listQuizCategories(targetLanguage) };
  });

  app.get("/quiz/progress", { preHandler: authenticate }, async (request) => {
    const rows = await db
      .select()
      .from(quizInstances)
      .where(
        and(
          eq(quizInstances.studentId, request.authUser!.sub),
          isNotNull(quizInstances.score),
        ),
      )
      .orderBy(desc(quizInstances.createdAt))
      .limit(20);

    const response: QuizProgressResponse = {
      recent: rows.map((r) => ({
        quizId: r.id,
        category: r.category as QuizCategory,
        difficultyLevel: r.difficultyLevel as CefrLevel,
        score: r.score ?? 0,
        createdAt: r.createdAt,
      })),
      totalQuizzes: rows.length,
      averageScore:
        rows.length > 0
          ? Math.round(rows.reduce((sum, r) => sum + (r.score ?? 0), 0) / rows.length)
          : 0,
    };
    return response;
  });
}
