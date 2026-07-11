import "../testSetup";
import { test } from "node:test";
import assert from "node:assert/strict";
import { ensureSchema, db } from "../db/client";
import { vocabulary } from "../db/schema";
import { aiVocabClient } from "./aiVocabClient";
import { encodeEmbedding } from "./embeddingCodec";
import { findSimilarWords } from "./similarity";

test("ranks closer embeddings above distant ones", async () => {
  ensureSchema();

  const originalExplain = aiVocabClient.explain;
  const originalEmbed = aiVocabClient.embed;
  aiVocabClient.explain = async () => ({
    definition: "def",
    example: "ex",
    synonyms: [],
    antonyms: [],
    cefrLevel: "B1",
  });
  aiVocabClient.embed = async () => [1, 0, 0];

  try {
    await db.insert(vocabulary).values({
      word: "close-word",
      definition: "d",
      example: "e",
      synonyms: "[]",
      antonyms: "[]",
      cefrLevel: "B1",
      embedding: encodeEmbedding([0.9, 0.1, 0]),
    });
    await db.insert(vocabulary).values({
      word: "far-word",
      definition: "d",
      example: "e",
      synonyms: "[]",
      antonyms: "[]",
      cefrLevel: "B1",
      embedding: encodeEmbedding([0, 0, 1]),
    });

    const results = await findSimilarWords("target-word", 5);

    assert.equal(results.length, 2);
    assert.equal(results[0].word, "close-word");
    assert.equal(results[1].word, "far-word");
  } finally {
    aiVocabClient.explain = originalExplain;
    aiVocabClient.embed = originalEmbed;
  }
});
