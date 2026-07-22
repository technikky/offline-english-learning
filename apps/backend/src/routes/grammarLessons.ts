import type { FastifyInstance } from "fastify";
import { db } from "../db/client";
import { grammarExerciseAttempts } from "../db/schema";
import { authenticate } from "../auth/middleware";
import { listGrammarTopics, getGrammarTopic } from "../grammar/curriculum";
import { aiExerciseClient } from "../grammar/aiExerciseClient";
import { getGrammarProgress } from "../grammar/progress";
import { getTargetLanguage } from "../users/language";
import type {
  GrammarExerciseDto,
  GrammarExerciseType,
  SubmitGrammarExerciseRequest,
  SubmitGrammarExerciseResponse,
} from "@englishclass/types";

function normalizeAnswer(value: string): string {
  return value.trim().toLowerCase();
}

export function registerGrammarLessonRoutes(app: FastifyInstance): void {
  app.get("/grammar/topics", { preHandler: authenticate }, async (request) => {
    const language = await getTargetLanguage(request.authUser!.sub);
    return listGrammarTopics(language).map(({ id, level, title, cefrLevel }) => ({
      id,
      level,
      title,
      cefrLevel,
      language,
    }));
  });

  app.get<{ Params: { id: string } }>(
    "/grammar/topics/:id",
    { preHandler: authenticate },
    async (request, reply) => {
      const topic = getGrammarTopic(request.params.id);
      if (!topic) return reply.code(404).send({ error: "Topic not found" });
      return topic;
    },
  );

  app.post<{ Params: { id: string }; Body: { exerciseType?: GrammarExerciseType } }>(
    "/grammar/topics/:id/exercise",
    { preHandler: authenticate },
    async (request, reply) => {
      const topic = getGrammarTopic(request.params.id);
      if (!topic) return reply.code(404).send({ error: "Topic not found" });

      const exerciseType = request.body?.exerciseType ?? "multiple_choice";

      let generated;
      try {
        generated = await aiExerciseClient.generate(
          topic.title,
          topic.explanation,
          topic.cefrLevel,
          exerciseType,
        );
      } catch {
        return reply.code(502).send({ error: "AI service unavailable" });
      }

      if (!generated.correctAnswer) {
        return reply.code(502).send({ error: "AI service could not generate an exercise" });
      }

      const dto: GrammarExerciseDto = {
        exerciseType,
        question: generated.question,
        options: generated.options,
        explanation: generated.explanation,
        correctAnswer: generated.correctAnswer,
      };
      return dto;
    },
  );

  app.post<{ Params: { id: string }; Body: SubmitGrammarExerciseRequest }>(
    "/grammar/topics/:id/exercise/submit",
    { preHandler: authenticate },
    async (request, reply) => {
      const topic = getGrammarTopic(request.params.id);
      if (!topic) return reply.code(404).send({ error: "Topic not found" });

      const { exerciseType, question, correctAnswer, studentAnswer } = request.body;
      if (!question || !correctAnswer || studentAnswer === undefined) {
        return reply.code(400).send({
          error: "question, correctAnswer and studentAnswer are required",
        });
      }

      const isCorrect = normalizeAnswer(studentAnswer) === normalizeAnswer(correctAnswer);

      await db.insert(grammarExerciseAttempts).values({
        studentId: request.authUser!.sub,
        topicId: topic.id,
        exerciseType,
        question,
        correctAnswer,
        studentAnswer,
        isCorrect,
      });

      const response: SubmitGrammarExerciseResponse = { isCorrect, correctAnswer };
      return response;
    },
  );

  app.get("/grammar/progress", { preHandler: authenticate }, async (request) => {
    return getGrammarProgress(request.authUser!.sub);
  });
}
