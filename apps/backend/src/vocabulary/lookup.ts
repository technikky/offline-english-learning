import { eq } from "drizzle-orm";
import type { CefrLevel, VocabularyDto } from "@englishclass/types";
import { db } from "../db/client";
import { vocabulary } from "../db/schema";
import { aiVocabClient } from "./aiVocabClient";
import { encodeEmbedding } from "./embeddingCodec";

function normalizeWord(word: string): string {
  return word.trim().toLowerCase();
}

function toDto(row: typeof vocabulary.$inferSelect): VocabularyDto {
  return {
    id: row.id,
    word: row.word,
    definition: row.definition,
    example: row.example,
    synonyms: JSON.parse(row.synonyms) as string[],
    antonyms: JSON.parse(row.antonyms) as string[],
    cefrLevel: row.cefrLevel as CefrLevel,
  };
}

/** Returns the cached vocabulary entry for a word, generating and caching
 * one via the AI service on first lookup. See docs/09-stage6-plan.md. */
export async function lookupOrCreateVocabulary(
  word: string,
  difficultyLevel: string = "B1",
): Promise<VocabularyDto> {
  const normalized = normalizeWord(word);

  const existing = await db.query.vocabulary.findFirst({
    where: eq(vocabulary.word, normalized),
  });
  if (existing) return toDto(existing);

  // Sequential, not Promise.all: the AI service runs a single CPU-bound
  // llama.cpp instance that doesn't handle concurrent requests well.
  const explanation = await aiVocabClient.explain(normalized, difficultyLevel);
  const embedding = await aiVocabClient.embed(normalized);

  const [created] = await db
    .insert(vocabulary)
    .values({
      word: normalized,
      definition: explanation.definition,
      example: explanation.example,
      synonyms: JSON.stringify(explanation.synonyms),
      antonyms: JSON.stringify(explanation.antonyms),
      cefrLevel: explanation.cefrLevel,
      embedding: encodeEmbedding(embedding),
    })
    .returning();

  return toDto(created);
}
