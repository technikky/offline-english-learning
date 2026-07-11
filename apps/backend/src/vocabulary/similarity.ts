import { eq, ne } from "drizzle-orm";
import type { VocabularyDto, CefrLevel } from "@englishclass/types";
import { db } from "../db/client";
import { vocabulary } from "../db/schema";
import { lookupOrCreateVocabulary } from "./lookup";
import { cosineSimilarity, decodeEmbedding } from "./embeddingCodec";

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

/** Brute-force cosine similarity over the shared vocabulary cache. See
 * docs/09-stage6-plan.md for why this doesn't use sqlite-vec (yet). */
export async function findSimilarWords(
  word: string,
  limit: number = 5,
): Promise<VocabularyDto[]> {
  const normalized = word.trim().toLowerCase();
  await lookupOrCreateVocabulary(normalized);

  const target = await db.query.vocabulary.findFirst({
    where: eq(vocabulary.word, normalized),
  });
  if (!target) return [];

  const others = await db.select().from(vocabulary).where(ne(vocabulary.word, normalized));

  const targetVector = decodeEmbedding(target.embedding);

  const scored = others.map((row) => ({
    row,
    score: cosineSimilarity(targetVector, decodeEmbedding(row.embedding)),
  }));

  scored.sort((a, b) => b.score - a.score);

  return scored.slice(0, limit).map((entry) => toDto(entry.row));
}
