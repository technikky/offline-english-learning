import "../testSetup";
import { test } from "node:test";
import assert from "node:assert/strict";
import { ensureSchema } from "../db/client";
import { aiVocabClient } from "./aiVocabClient";
import { lookupOrCreateVocabulary } from "./lookup";

test("generates a vocabulary entry via the AI service on first lookup, then caches it", async () => {
  ensureSchema();

  let explainCalls = 0;
  let embedCalls = 0;
  const originalExplain = aiVocabClient.explain;
  const originalEmbed = aiVocabClient.embed;
  aiVocabClient.explain = async () => {
    explainCalls++;
    return {
      definition: "a made-up word for testing",
      example: "This is a flibbertigibbet example.",
      synonyms: ["nonsense-word"],
      antonyms: [],
      cefrLevel: "B1",
    };
  };
  aiVocabClient.embed = async () => {
    embedCalls++;
    return [0.1, 0.2, 0.3];
  };

  try {
    const first = await lookupOrCreateVocabulary("flibbertigibbet");
    assert.equal(first.word, "flibbertigibbet");
    assert.equal(first.cefrLevel, "B1");
    assert.equal(explainCalls, 1);
    assert.equal(embedCalls, 1);

    const second = await lookupOrCreateVocabulary("flibbertigibbet");
    assert.equal(second.id, first.id);
    assert.equal(explainCalls, 1, "second lookup should be served from cache");
    assert.equal(embedCalls, 1, "second lookup should be served from cache");
  } finally {
    aiVocabClient.explain = originalExplain;
    aiVocabClient.embed = originalEmbed;
  }
});

test("normalizes case and whitespace so the same word isn't cached twice", async () => {
  ensureSchema();

  const originalExplain = aiVocabClient.explain;
  const originalEmbed = aiVocabClient.embed;
  aiVocabClient.explain = async () => ({
    definition: "def",
    example: "ex",
    synonyms: [],
    antonyms: [],
    cefrLevel: "A2",
  });
  aiVocabClient.embed = async () => [1, 0, 0];

  try {
    const a = await lookupOrCreateVocabulary("  Wonderful  ");
    const b = await lookupOrCreateVocabulary("wonderful");
    assert.equal(a.id, b.id);
    assert.equal(a.word, "wonderful");
  } finally {
    aiVocabClient.explain = originalExplain;
    aiVocabClient.embed = originalEmbed;
  }
});
