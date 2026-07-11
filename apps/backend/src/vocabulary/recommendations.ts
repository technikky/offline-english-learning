import { eq } from "drizzle-orm";
import type { VocabularyDto } from "@englishclass/types";
import { db } from "../db/client";
import { messages, vocabularyNotebook, vocabulary } from "../db/schema";
import { COMMON_WORDS } from "./commonWords";
import { lookupOrCreateVocabulary } from "./lookup";

const MIN_CANDIDATE_LENGTH = 7;
const MAX_RECOMMENDATIONS = 5;

function extractCandidateWords(text: string): string[] {
  const words = text.toLowerCase().match(/[a-z']+/g) ?? [];
  const seen = new Set<string>();
  const candidates: string[] = [];

  for (const word of words) {
    if (word.length < MIN_CANDIDATE_LENGTH) continue;
    if (COMMON_WORDS.has(word)) continue;
    if (seen.has(word)) continue;
    seen.add(word);
    candidates.push(word);
  }

  return candidates;
}

/** Surfaces words from the AI's own replies that are likely above the
 * student's level (v1 length + stoplist heuristic — see
 * docs/09-stage6-plan.md), excluding words already in their notebook.
 * Recommendations are returned for the student to choose from, not
 * auto-added. */
export async function getRecommendationsForConversation(
  conversationId: number,
  studentId: number,
): Promise<VocabularyDto[]> {
  const assistantMessages = await db
    .select({ content: messages.content })
    .from(messages)
    .where(eq(messages.conversationId, conversationId));

  const candidateWords = new Set<string>();
  for (const message of assistantMessages) {
    for (const word of extractCandidateWords(message.content)) {
      candidateWords.add(word);
    }
  }

  if (candidateWords.size === 0) return [];

  const notebookWords = await db
    .select({ word: vocabulary.word })
    .from(vocabularyNotebook)
    .innerJoin(vocabulary, eq(vocabularyNotebook.vocabularyId, vocabulary.id))
    .where(eq(vocabularyNotebook.studentId, studentId));
  const alreadySaved = new Set(notebookWords.map((row) => row.word));

  const toRecommend = [...candidateWords]
    .filter((word) => !alreadySaved.has(word))
    .slice(0, MAX_RECOMMENDATIONS);

  // Sequential, not Promise.all: the AI service runs a single CPU-bound
  // llama.cpp instance that doesn't handle concurrent completions well —
  // see docs/09-stage6-plan.md.
  const results: VocabularyDto[] = [];
  for (const word of toRecommend) {
    results.push(await lookupOrCreateVocabulary(word));
  }
  return results;
}
