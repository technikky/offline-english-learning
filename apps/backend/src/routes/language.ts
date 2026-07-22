import type { FastifyInstance } from "fastify";
import { eq } from "drizzle-orm";
import type {
  SetTargetLanguageRequest,
  SetUiLocaleRequest,
  TargetLanguageResponse,
  UiLocaleResponse,
} from "@englishclass/types";
import { db } from "../db/client";
import { users } from "../db/schema";
import { authenticate } from "../auth/middleware";
import {
  getTargetLanguage,
  getUiLocale,
  isTargetLanguage,
  isUiLocale,
} from "../users/language";

// Stage 28: the learner chooses which language they are studying. This drives
// the content catalogs (grammar topics, reading passages), the curriculum
// path, and the language the AI conversation partner speaks.
export function registerLanguageRoutes(app: FastifyInstance): void {
  app.get("/me/language", { preHandler: authenticate }, async (request) => {
    const response: TargetLanguageResponse = {
      targetLanguage: await getTargetLanguage(request.authUser!.sub),
    };
    return response;
  });

  app.put<{ Body: SetTargetLanguageRequest }>(
    "/me/language",
    { preHandler: authenticate },
    async (request, reply) => {
      const { targetLanguage } = request.body ?? {};
      if (!isTargetLanguage(targetLanguage)) {
        return reply.code(400).send({ error: "targetLanguage must be 'english' or 'chinese'" });
      }

      await db
        .update(users)
        .set({ targetLanguage })
        .where(eq(users.id, request.authUser!.sub));

      const response: TargetLanguageResponse = { targetLanguage };
      return response;
    },
  );

  // Stage 36: the interface language, independent of the target language.
  app.get("/me/locale", { preHandler: authenticate }, async (request) => {
    const response: UiLocaleResponse = {
      uiLocale: await getUiLocale(request.authUser!.sub),
    };
    return response;
  });

  app.put<{ Body: SetUiLocaleRequest }>(
    "/me/locale",
    { preHandler: authenticate },
    async (request, reply) => {
      const { uiLocale } = request.body ?? {};
      if (!isUiLocale(uiLocale)) {
        return reply.code(400).send({ error: "uiLocale must be 'en' or 'zh'" });
      }
      await db.update(users).set({ uiLocale }).where(eq(users.id, request.authUser!.sub));
      const response: UiLocaleResponse = { uiLocale };
      return response;
    },
  );
}
