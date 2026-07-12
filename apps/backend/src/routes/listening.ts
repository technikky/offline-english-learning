import type { FastifyInstance } from "fastify";
import { db } from "../db/client";
import { listeningResults } from "../db/schema";
import { authenticate } from "../auth/middleware";
import { listListeningClips, getListeningClip, splitIntoSentences } from "../listening/clips";
import { getOrCreateListeningComprehension } from "../listening/comprehension";
import { getListeningProgress } from "../listening/progress";
import { scoreTextSimilarity } from "../speech/textSimilarity";
import type {
  DictationCheckRequest,
  DictationCheckResponse,
  ListeningClipDetail,
  SubmitListeningRequest,
  SubmitListeningResponse,
} from "@englishclass/types";

function normalizeAnswer(value: string): string {
  return value.trim().toLowerCase();
}

export function registerListeningRoutes(app: FastifyInstance): void {
  app.get("/listening/clips", { preHandler: authenticate }, async () => {
    return listListeningClips();
  });

  app.get<{ Params: { id: string } }>(
    "/listening/clips/:id",
    { preHandler: authenticate },
    async (request, reply) => {
      const clip = getListeningClip(request.params.id);
      if (!clip) return reply.code(404).send({ error: "Clip not found" });

      let comprehension;
      try {
        comprehension = await getOrCreateListeningComprehension(clip);
      } catch {
        return reply.code(502).send({ error: "AI service unavailable" });
      }

      const detail: ListeningClipDetail = {
        id: clip.id,
        title: clip.title,
        cefrLevel: clip.cefrLevel,
        estimatedSeconds: clip.estimatedSeconds,
        transcript: clip.transcript,
        sentences: splitIntoSentences(clip.transcript),
        summary: comprehension.summary,
        vocabularyWords: comprehension.vocabularyWords,
        questions: comprehension.questions,
      };
      return detail;
    },
  );

  app.post<{ Params: { id: string }; Body: SubmitListeningRequest }>(
    "/listening/clips/:id/submit",
    { preHandler: authenticate },
    async (request, reply) => {
      const clip = getListeningClip(request.params.id);
      if (!clip) return reply.code(404).send({ error: "Clip not found" });

      const { answers } = request.body;
      if (!Array.isArray(answers)) {
        return reply.code(400).send({ error: "answers must be an array" });
      }

      let comprehension;
      try {
        comprehension = await getOrCreateListeningComprehension(clip);
      } catch {
        return reply.code(502).send({ error: "AI service unavailable" });
      }

      const totalQuestions = comprehension.questions.length;
      let correctCount = 0;
      for (let i = 0; i < totalQuestions; i++) {
        const studentAnswer = answers[i] ?? "";
        if (normalizeAnswer(studentAnswer) === normalizeAnswer(comprehension.questions[i].correctAnswer)) {
          correctCount++;
        }
      }
      const score = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;

      await db.insert(listeningResults).values({
        studentId: request.authUser!.sub,
        clipId: clip.id,
        score,
        correctCount,
        totalQuestions,
      });

      const response: SubmitListeningResponse = { score, correctCount, totalQuestions };
      return response;
    },
  );

  // Dictation mode: the client plays one sentence, the student types what they
  // heard, and this scores it against the sentence (word-level similarity,
  // reusing the pronunciation scorer's logic). Not persisted -- it's practice.
  app.post<{ Body: DictationCheckRequest }>(
    "/listening/dictation/check",
    { preHandler: authenticate },
    async (request, reply) => {
      const { target, attempt } = request.body;
      if (!target || attempt === undefined) {
        return reply.code(400).send({ error: "target and attempt are required" });
      }
      const response: DictationCheckResponse = {
        score: scoreTextSimilarity(target, attempt),
      };
      return response;
    },
  );

  app.get("/listening/progress", { preHandler: authenticate }, async (request) => {
    return getListeningProgress(request.authUser!.sub);
  });
}
