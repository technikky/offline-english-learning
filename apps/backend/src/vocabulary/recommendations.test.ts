import "../testSetup";
import { test } from "node:test";
import assert from "node:assert/strict";
import { ensureSchema, db } from "../db/client";
import { conversations, messages, users, vocabulary, vocabularyNotebook } from "../db/schema";
import { hashPassword } from "../auth/password";
import { aiVocabClient } from "./aiVocabClient";
import { encodeEmbedding } from "./embeddingCodec";
import { getRecommendationsForConversation } from "./recommendations";

test("recommends difficult words from the AI's replies, excluding common words and words already saved", async () => {
  ensureSchema();
  const passwordHash = await hashPassword("studentpass123");
  const [student] = await db
    .insert(users)
    .values({ email: "recstu@x.com", passwordHash, role: "student", displayName: "Stu" })
    .returning();
  const [conversation] = await db
    .insert(conversations)
    .values({ studentId: student.id, scenario: "daily" })
    .returning();

  await db.insert(messages).values({
    conversationId: conversation.id,
    role: "assistant",
    content:
      "That sounds absolutely wonderful! I find your perspective quite extraordinary and interesting.",
  });

  const [alreadySaved] = await db
    .insert(vocabulary)
    .values({
      word: "wonderful",
      definition: "d",
      example: "e",
      synonyms: "[]",
      antonyms: "[]",
      cefrLevel: "B1",
      embedding: encodeEmbedding([0, 0, 0]),
    })
    .returning();
  await db.insert(vocabularyNotebook).values({
    studentId: student.id,
    vocabularyId: alreadySaved.id,
    source: "manual",
  });

  const originalExplain = aiVocabClient.explain;
  const originalEmbed = aiVocabClient.embed;
  const explainedWords: string[] = [];
  aiVocabClient.explain = async (word: string) => {
    explainedWords.push(word);
    return { definition: "d", example: "e", synonyms: [], antonyms: [], cefrLevel: "B1" };
  };
  aiVocabClient.embed = async () => [0, 0, 0];

  try {
    const recommendations = await getRecommendationsForConversation(conversation.id, student.id);
    const words = recommendations.map((r) => r.word);

    assert.ok(words.includes("extraordinary"));
    assert.ok(words.includes("interesting"));
    assert.ok(!words.includes("wonderful"), "already-saved word should be excluded");
    assert.ok(!words.includes("that"), "short common words should be excluded");
    assert.ok(!words.includes("sounds"), "short common words should be excluded");
  } finally {
    aiVocabClient.explain = originalExplain;
    aiVocabClient.embed = originalEmbed;
  }
});

test("returns an empty list when there are no assistant messages yet", async () => {
  ensureSchema();
  const passwordHash = await hashPassword("studentpass123");
  const [student] = await db
    .insert(users)
    .values({ email: "recstu2@x.com", passwordHash, role: "student", displayName: "Stu2" })
    .returning();
  const [conversation] = await db
    .insert(conversations)
    .values({ studentId: student.id, scenario: "daily" })
    .returning();

  const recommendations = await getRecommendationsForConversation(conversation.id, student.id);
  assert.deepEqual(recommendations, []);
});
