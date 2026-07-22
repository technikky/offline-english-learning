import { eq } from "drizzle-orm";
import type { ListeningProgressEntry, ListeningProgressResponse } from "@englishclass/types";
import { db } from "../db/client";
import { listeningResults } from "../db/schema";
import { listListeningClips } from "./clips";
import { getTargetLanguage } from "../users/language";

export async function getListeningProgress(studentId: number): Promise<ListeningProgressResponse> {
  const results = await db
    .select()
    .from(listeningResults)
    .where(eq(listeningResults.studentId, studentId));

  const language = await getTargetLanguage(studentId);
  const clips: ListeningProgressEntry[] = listListeningClips(language)
    .map((clip) => {
      const clipResults = results.filter((r) => r.clipId === clip.id);
      const bestScore =
        clipResults.length > 0 ? Math.max(...clipResults.map((r) => r.score)) : 0;
      return {
        clipId: clip.id,
        title: clip.title,
        cefrLevel: clip.cefrLevel,
        bestScore,
        attempts: clipResults.length,
      };
    })
    .filter((entry) => entry.attempts > 0);

  const overallAverageScore =
    results.length > 0
      ? Math.round(results.reduce((sum, r) => sum + r.score, 0) / results.length)
      : 0;

  return { clips, overallAverageScore };
}
