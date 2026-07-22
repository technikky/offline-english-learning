import { eq } from "drizzle-orm";
import type { ReadingProgressEntry, ReadingProgressResponse } from "@englishclass/types";
import { db } from "../db/client";
import { readingResults } from "../db/schema";
import { listReadingPassages } from "./passages";
import { getTargetLanguage } from "../users/language";

export async function getReadingProgress(studentId: number): Promise<ReadingProgressResponse> {
  const results = await db
    .select()
    .from(readingResults)
    .where(eq(readingResults.studentId, studentId));

  const language = await getTargetLanguage(studentId);
  const passages: ReadingProgressEntry[] = listReadingPassages(language)
    .map((passage) => {
      const passageResults = results.filter((r) => r.passageId === passage.id);
      const bestScore =
        passageResults.length > 0 ? Math.max(...passageResults.map((r) => r.score)) : 0;
      return {
        passageId: passage.id,
        title: passage.title,
        cefrLevel: passage.cefrLevel,
        bestScore,
        attempts: passageResults.length,
      };
    })
    .filter((entry) => entry.attempts > 0);

  const overallAverageScore =
    results.length > 0
      ? Math.round(results.reduce((sum, r) => sum + r.score, 0) / results.length)
      : 0;

  return { passages, overallAverageScore };
}
