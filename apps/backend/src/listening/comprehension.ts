import { eq } from "drizzle-orm";
import type { ComprehensionQuestion } from "@englishclass/types";
import { db } from "../db/client";
import { listeningComprehensionCache } from "../db/schema";
// Reuses the reading module's comprehension generator -- despite the name it
// takes generic (text, cefrLevel) and isn't reading-specific, so listening
// gets its questions from the same AI call rather than a duplicate one.
import { aiReadingClient } from "../reading/aiReadingClient";
import type { ListeningClipRecord } from "./clips";

export async function getOrCreateListeningComprehension(clip: ListeningClipRecord): Promise<{
  summary: string;
  vocabularyWords: string[];
  questions: ComprehensionQuestion[];
}> {
  const existing = await db.query.listeningComprehensionCache.findFirst({
    where: eq(listeningComprehensionCache.clipId, clip.id),
  });
  if (existing) {
    return {
      summary: existing.summary,
      vocabularyWords: JSON.parse(existing.vocabularyWords) as string[],
      questions: JSON.parse(existing.questions) as ComprehensionQuestion[],
    };
  }

  const generated = await aiReadingClient.generateComprehension(clip.transcript, clip.cefrLevel);

  await db.insert(listeningComprehensionCache).values({
    clipId: clip.id,
    summary: generated.summary,
    vocabularyWords: JSON.stringify(generated.vocabularyWords),
    questions: JSON.stringify(generated.questions),
  });

  return generated;
}
