import { and, desc, eq } from "drizzle-orm";
import type { CefrLevel } from "@englishclass/types";
import { db } from "../db/client";
import { conversations, messages } from "../db/schema";

/**
 * v1 heuristic: estimates a CEFR band from a student's own message history
 * (average sentence length + vocabulary diversity). A real implementation
 * would also weigh in grammar-error frequency (Stage 5) and vocabulary
 * notebook data (Stage 6) once those exist — see docs/07-stage4-plan.md.
 */
export async function estimateDifficultyLevel(studentId: number): Promise<CefrLevel> {
  const recentMessages = await db
    .select({ content: messages.content })
    .from(messages)
    .innerJoin(conversations, eq(messages.conversationId, conversations.id))
    .where(and(eq(conversations.studentId, studentId), eq(messages.role, "user")))
    .orderBy(desc(messages.createdAt))
    .limit(20);

  if (recentMessages.length === 0) return "B1";

  let totalWords = 0;
  let totalSentences = 0;
  const uniqueWords = new Set<string>();

  for (const { content } of recentMessages) {
    const sentences = content.split(/[.!?]+/).filter((s) => s.trim().length > 0);
    const words = content
      .toLowerCase()
      .split(/\s+/)
      .map((w) => w.replace(/[^a-z']/g, ""))
      .filter((w) => w.length > 0);

    totalSentences += Math.max(sentences.length, 1);
    totalWords += words.length;
    words.forEach((w) => uniqueWords.add(w));
  }

  const avgWordsPerSentence = totalWords / totalSentences;
  const vocabDiversity = totalWords === 0 ? 0 : uniqueWords.size / totalWords;

  return bandFromMetrics(avgWordsPerSentence, vocabDiversity);
}

function bandFromMetrics(avgWordsPerSentence: number, vocabDiversity: number): CefrLevel {
  // Sentence length dominates the score; vocabulary diversity is a small
  // adjustment only, since short samples naturally have a high type-token
  // ratio (few chances to repeat a word) and would otherwise swamp the
  // signal that actually distinguishes a beginner from an advanced learner.
  const score = avgWordsPerSentence + vocabDiversity * 3;

  if (score < 5) return "A1";
  if (score < 8) return "A2";
  if (score < 11) return "B1";
  if (score < 14) return "B2";
  if (score < 17) return "C1";
  return "C2";
}
