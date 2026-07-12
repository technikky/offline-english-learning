import type { FastifyInstance } from "fastify";
import { desc, eq } from "drizzle-orm";
import { db } from "../db/client";
import { writingSubmissions } from "../db/schema";
import { authenticate } from "../auth/middleware";
import { listWritingPrompts, getWritingPrompt, countWords } from "../writing/prompts";
import { aiWritingClient } from "../writing/aiWritingClient";
import { languageToolClient, type GrammarMatch } from "../grammar/languageToolClient";
import type {
  SubmitWritingRequest,
  WritingFeedback,
  WritingProgressResponse,
  WritingSubmissionSummary,
} from "@englishclass/types";

export function registerWritingRoutes(app: FastifyInstance): void {
  app.get("/writing/prompts", { preHandler: authenticate }, async () => {
    return listWritingPrompts();
  });

  app.get<{ Params: { id: string } }>(
    "/writing/prompts/:id",
    { preHandler: authenticate },
    async (request, reply) => {
      const prompt = getWritingPrompt(request.params.id);
      if (!prompt) return reply.code(404).send({ error: "Prompt not found" });
      return prompt;
    },
  );

  app.post<{ Params: { id: string }; Body: SubmitWritingRequest }>(
    "/writing/prompts/:id/submit",
    { preHandler: authenticate },
    async (request, reply) => {
      const prompt = getWritingPrompt(request.params.id);
      if (!prompt) return reply.code(404).send({ error: "Prompt not found" });

      const { text } = request.body;
      if (!text || !text.trim()) {
        return reply.code(400).send({ error: "text is required" });
      }

      // Concrete grammar/spelling issues come from LanguageTool (deterministic,
      // reused from Stage 5); higher-level analysis comes from the LLM. If
      // LanguageTool is down, degrade to just the LLM feedback rather than fail.
      let mistakes: GrammarMatch[];
      try {
        mistakes = await languageToolClient.check(text);
      } catch {
        mistakes = [];
      }

      let analysis;
      try {
        analysis = await aiWritingClient.analyze(prompt.prompt, text, prompt.cefrLevel);
      } catch {
        return reply.code(502).send({ error: "AI service unavailable" });
      }

      const feedback: WritingFeedback = {
        overall: analysis.overall,
        grammarScore: analysis.grammarScore,
        vocabularyScore: analysis.vocabularyScore,
        coherenceScore: analysis.coherenceScore,
        strengths: analysis.strengths,
        improvements: analysis.improvements,
        modelAnswer: analysis.modelAnswer,
        mistakes: mistakes.map((m) => ({
          originalText: m.originalText,
          correctedText: m.correctedText,
          ruleDescription: m.ruleDescription,
          category: m.category,
        })),
        wordCount: countWords(text),
      };

      await db.insert(writingSubmissions).values({
        studentId: request.authUser!.sub,
        promptId: prompt.id,
        text,
        wordCount: feedback.wordCount,
        grammarScore: feedback.grammarScore,
        vocabularyScore: feedback.vocabularyScore,
        coherenceScore: feedback.coherenceScore,
        feedbackJson: JSON.stringify(feedback),
      });

      return feedback;
    },
  );

  app.get("/writing/progress", { preHandler: authenticate }, async (request) => {
    const rows = await db
      .select()
      .from(writingSubmissions)
      .where(eq(writingSubmissions.studentId, request.authUser!.sub))
      .orderBy(desc(writingSubmissions.createdAt));

    const submissions: WritingSubmissionSummary[] = rows.map((row) => ({
      id: row.id,
      promptId: row.promptId,
      promptTitle: getWritingPrompt(row.promptId)?.title ?? row.promptId,
      wordCount: row.wordCount,
      grammarScore: row.grammarScore,
      vocabularyScore: row.vocabularyScore,
      coherenceScore: row.coherenceScore,
      createdAt: row.createdAt,
    }));

    const averageOverallScore =
      rows.length > 0
        ? Math.round(
            rows.reduce(
              (sum, r) => sum + (r.grammarScore + r.vocabularyScore + r.coherenceScore) / 3,
              0,
            ) / rows.length,
          )
        : 0;

    const response: WritingProgressResponse = {
      submissions,
      totalSubmissions: rows.length,
      averageOverallScore,
    };
    return response;
  });
}
