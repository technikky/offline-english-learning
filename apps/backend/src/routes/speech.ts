import type { FastifyInstance } from "fastify";
import type {
  PronunciationPracticeRequest,
  PronunciationPracticeResponse,
  SynthesizeRequest,
  SynthesizeResponse,
  ToneScoreDto,
  TranscribeRequest,
  TranscribeResponse,
} from "@englishclass/types";
import { db } from "../db/client";
import { pronunciationResults } from "../db/schema";
import { authenticate } from "../auth/middleware";
import { aiSpeechClient } from "../speech/aiSpeechClient";
import { scorePronunciation } from "../speech/scoring";
import { getTargetLanguage } from "../users/language";

export function registerSpeechRoutes(app: FastifyInstance): void {
  app.post<{ Body: TranscribeRequest }>(
    "/speech/transcribe",
    { preHandler: authenticate },
    async (request, reply) => {
      const { audioBase64 } = request.body;
      if (!audioBase64) {
        return reply.code(400).send({ error: "audioBase64 is required" });
      }

      const targetLanguage = await getTargetLanguage(request.authUser!.sub);
      const transcript = await aiSpeechClient.transcribe(audioBase64, targetLanguage);
      const response: TranscribeResponse = { transcript };
      return response;
    },
  );

  app.post<{ Body: SynthesizeRequest }>(
    "/speech/synthesize",
    { preHandler: authenticate },
    async (request, reply) => {
      const { text, voice } = request.body;
      if (!text || !text.trim()) {
        return reply.code(400).send({ error: "text is required" });
      }

      const selectedVoice = voice === "male" ? "male" : "female";
      const targetLanguage = await getTargetLanguage(request.authUser!.sub);
      const audioBase64 = await aiSpeechClient.synthesize(text, selectedVoice, targetLanguage);
      const response: SynthesizeResponse = { audioBase64 };
      return response;
    },
  );

  app.post<{ Body: PronunciationPracticeRequest }>(
    "/pronunciation/practice",
    { preHandler: authenticate },
    async (request, reply) => {
      const { targetPhrase, audioBase64 } = request.body;
      if (!targetPhrase || !targetPhrase.trim() || !audioBase64) {
        return reply
          .code(400)
          .send({ error: "targetPhrase and audioBase64 are required" });
      }

      const targetLanguage = await getTargetLanguage(request.authUser!.sub);
      const transcript = await aiSpeechClient.transcribe(audioBase64, targetLanguage);
      const { accuracyScore, feedback } = scorePronunciation(
        targetPhrase,
        transcript,
        targetLanguage,
      );

      // Stage 30: for Mandarin, character accuracy alone isn't pronunciation --
      // a correctly-transcribed syllable can still be the wrong word if the
      // tone is wrong. Scored from pitch, and reported alongside (not merged
      // into) the accuracy score so the student can see which one they missed.
      // Kept non-fatal: a tone-scoring failure must not lose the whole attempt.
      let tone: ToneScoreDto | undefined;
      if (targetLanguage === "chinese") {
        try {
          tone = await aiSpeechClient.scoreTone(audioBase64, targetPhrase);
        } catch {
          tone = undefined;
        }
      }

      await db.insert(pronunciationResults).values({
        studentId: request.authUser!.sub,
        targetPhrase,
        transcript,
        accuracyScore,
        toneScore: tone && tone.confident ? tone.toneScore : null,
      });

      const response: PronunciationPracticeResponse = {
        transcript,
        accuracyScore,
        feedback,
        tone,
      };
      return response;
    },
  );
}
