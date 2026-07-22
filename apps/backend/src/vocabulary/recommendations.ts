import { eq } from "drizzle-orm";
import type { CefrLevel, VocabularyDto } from "@englishclass/types";
import { db } from "../db/client";
import { messages, vocabularyNotebook, vocabulary } from "../db/schema";
import { COMMON_WORDS } from "./commonWords";
import { lookupOrCreateVocabulary } from "./lookup";
import { wordlistLevelOf } from "./wordlist";

const MIN_CANDIDATE_LENGTH = 7;
const MAX_RECOMMENDATIONS = 5;

const CEFR_ORDER: CefrLevel[] = ["A1", "A2", "B1", "B2", "C1", "C2"];

function levelIndex(level: CefrLevel): number {
  return CEFR_ORDER.indexOf(level);
}

/**
 * Stage 33: decides whether a word seen in conversation is worth recommending.
 *
 * The original heuristic was "7+ letters and not a stopword", which flags any
 * long word regardless of whether it is actually useful — "restaurant" and
 * "yesterday" scored the same as "inevitable". Now the curated CEFR wordlist
 * answers the question directly: a word is worth recommending if it is graded
 * **at or above** the student's current level. Words graded below their level
 * are skipped as already-known, and words absent from the list fall back to the
 * old length heuristic so genuinely rare vocabulary is still surfaced.
 */
export function isWorthRecommending(word: string, studentLevel: CefrLevel): boolean {
  if (COMMON_WORDS.has(word)) return false;

  const graded = wordlistLevelOf(word);
  if (graded) return levelIndex(graded) >= levelIndex(studentLevel);

  return word.length >= MIN_CANDIDATE_LENGTH;
}

function extractCandidateWords(text: string, studentLevel: CefrLevel): string[] {
  const words = text.toLowerCase().match(/[a-z']+/g) ?? [];
  const seen = new Set<string>();
  const candidates: string[] = [];

  for (const word of words) {
    if (seen.has(word)) continue;
    if (!isWorthRecommending(word, studentLevel)) continue;
    seen.add(word);
    candidates.push(word);
  }

  return candidates;
}

/** Ranks candidates so the most useful come first: graded words (which carry an
 * authored definition) ahead of ungraded guesses, and within those, the ones
 * closest to the student's own level ahead of far harder ones. */
export function rankCandidates(words: string[], studentLevel: CefrLevel): string[] {
  return [...words].sort((a, b) => {
    const levelA = wordlistLevelOf(a);
    const levelB = wordlistLevelOf(b);
    if (levelA && !levelB) return -1;
    if (!levelA && levelB) return 1;
    if (levelA && levelB) {
      const distanceA = levelIndex(levelA) - levelIndex(studentLevel);
      const distanceB = levelIndex(levelB) - levelIndex(studentLevel);
      if (distanceA !== distanceB) return distanceA - distanceB;
    }
    return a.localeCompare(b);
  });
}

/** Surfaces words from the AI's own replies that are worth the student
 * learning next, excluding words already in their notebook. Recommendations
 * are returned for the student to choose from, not auto-added. */
export async function getRecommendationsForConversation(
  conversationId: number,
  studentId: number,
  studentLevel: CefrLevel = "B1",
): Promise<VocabularyDto[]> {
  const assistantMessages = await db
    .select({ content: messages.content })
    .from(messages)
    .where(eq(messages.conversationId, conversationId));

  const candidateWords = new Set<string>();
  for (const message of assistantMessages) {
    for (const word of extractCandidateWords(message.content, studentLevel)) {
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

  const toRecommend = rankCandidates([...candidateWords], studentLevel)
    .filter((word) => !alreadySaved.has(word))
    .slice(0, MAX_RECOMMENDATIONS);

  // Sequential, not Promise.all: the AI service runs a single CPU-bound
  // llama.cpp instance that doesn't handle concurrent completions well —
  // see docs/09-stage6-plan.md. (Curated words skip the LLM entirely.)
  const results: VocabularyDto[] = [];
  for (const word of toRecommend) {
    results.push(await lookupOrCreateVocabulary(word, studentLevel));
  }
  return results;
}
