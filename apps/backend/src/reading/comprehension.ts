import { eq } from "drizzle-orm";
import type { ComprehensionQuestion } from "@englishclass/types";
import { db } from "../db/client";
import { readingComprehensionCache } from "../db/schema";
import { aiReadingClient } from "./aiReadingClient";
import type { PassageRecord } from "./passages";

/** Returns the cached comprehension package (summary/vocabulary/questions)
 * for a passage, generating and caching one via the AI service on first
 * request. Unlike Stage 14's grammar exercises, this deliberately stays
 * consistent per passage rather than varying each time -- a reading
 * comprehension quiz should be the same test every time a student (or a
 * different student) reads the same passage. */
export async function getOrCreateComprehension(passage: PassageRecord): Promise<{
  summary: string;
  vocabularyWords: string[];
  questions: ComprehensionQuestion[];
}> {
  const existing = await db.query.readingComprehensionCache.findFirst({
    where: eq(readingComprehensionCache.passageId, passage.id),
  });
  if (existing) {
    return {
      summary: existing.summary,
      vocabularyWords: JSON.parse(existing.vocabularyWords) as string[],
      questions: JSON.parse(existing.questions) as ComprehensionQuestion[],
    };
  }

  const generated = await aiReadingClient.generateComprehension(
    passage.content,
    passage.cefrLevel,
  );

  await db.insert(readingComprehensionCache).values({
    passageId: passage.id,
    summary: generated.summary,
    vocabularyWords: JSON.stringify(generated.vocabularyWords),
    questions: JSON.stringify(generated.questions),
  });

  return generated;
}
