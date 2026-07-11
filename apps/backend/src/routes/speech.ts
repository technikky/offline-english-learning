import type { FastifyInstance } from "fastify";
import type {
  PronunciationPracticeRequest,
  PronunciationPracticeResponse,
  SynthesizeRequest,
  SynthesizeResponse,
  TranscribeRequest,
  TranscribeResponse,
} from "@englishclass/types";
import { db } from "../db/client";
import { pronunciationResults } from "../db/schema";
import { authenticate } from "../auth/middleware";
import { aiSpeechClient } from "../speech/aiSpeechClient";
import { scorePronunciation } from "../speech/scoring";

export function registerSpeechRoutes(app: FastifyInstance): void {
  app.post<{ Body: TranscribeRequest }>(
    "/speech/transcribe",
    { preHandler: authenticate },
    async (request, reply) => {
      const { audioBase64 } = request.body;
      if (!audioBase64) {
        return reply.code(400).send({ error: "audioBase64 is required" });
      }

      const transcript = await aiSpeechClient.transcribe(audioBase64);
      const response: TranscribeResponse = { transcript };
      return response;
    },
  );

  app.post<{ Body: SynthesizeRequest }>(
    "/speech/synthesize",
    { preHandler: authenticate },
    async (request, reply) => {
      const { text } = request.body;
      if (!text || !text.trim()) {
        return reply.code(400).send({ error: "text is required" });
      }

      const audioBase64 = await aiSpeechClient.synthesize(text);
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

      const transcript = await aiSpeechClient.transcribe(audioBase64);
      const { accuracyScore, feedback } = scorePronunciation(targetPhrase, transcript);

      await db.insert(pronunciationResults).values({
        studentId: request.authUser!.sub,
        targetPhrase,
        transcript,
        accuracyScore,
      });

      const response: PronunciationPracticeResponse = {
        transcript,
        accuracyScore,
        feedback,
      };
      return response;
    },
  );
}
