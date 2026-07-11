import "../testSetup";
import { test } from "node:test";
import assert from "node:assert/strict";
import { ensureSchema, db } from "../db/client";
import {
  conversations,
  grammarMistakes,
  messages,
  users,
  vocabulary,
  vocabularyNotebook,
} from "../db/schema";
import { hashPassword } from "../auth/password";
import { encodeEmbedding } from "../vocabulary/embeddingCodec";
import { getStudentAnalytics } from "./aggregate";

test("aggregates conversation, message, mistake and vocabulary counts correctly", async () => {
  ensureSchema();
  const passwordHash = await hashPassword("studentpass123");
  const [student] = await db
    .insert(users)
    .values({ email: "analyticsstu@x.com", passwordHash, role: "student", displayName: "Stu" })
    .returning();

  const [conversation] = await db
    .insert(conversations)
    .values({ studentId: student.id, scenario: "daily" })
    .returning();

  const [userMessage] = await db
    .insert(messages)
    .values({ conversationId: conversation.id, role: "user", content: "She go home." })
    .returning();
  await db.insert(messages).values({
    conversationId: conversation.id,
    role: "assistant",
    content: "That is nice.",
  });

  await db.insert(grammarMistakes).values([
    {
      messageId: userMessage.id,
      originalText: "go",
      correctedText: "goes",
      ruleId: "HE_VERB_AGR",
      ruleDescription: "Agreement error",
      category: "Grammar",
    },
    {
      messageId: userMessage.id,
      originalText: "a",
      correctedText: "an",
      ruleId: "EN_A_VS_AN",
      ruleDescription: "Article error",
      category: "Miscellaneous",
    },
    {
      messageId: userMessage.id,
      originalText: "teh",
      correctedText: "the",
      ruleId: "MORFOLOGIK_RULE",
      ruleDescription: "Spelling",
      category: "Grammar",
    },
  ]);

  const [word] = await db
    .insert(vocabulary)
    .values({
      word: "meticulous",
      definition: "d",
      example: "e",
      synonyms: "[]",
      antonyms: "[]",
      cefrLevel: "B2",
      embedding: encodeEmbedding([0, 0, 0]),
    })
    .returning();
  await db.insert(vocabularyNotebook).values({
    studentId: student.id,
    vocabularyId: word.id,
    source: "manual",
  });

  const analytics = await getStudentAnalytics(student.id);

  assert.equal(analytics.totalConversations, 1);
  assert.equal(analytics.totalMessages, 2);
  assert.equal(analytics.displayName, "Stu");

  assert.equal(analytics.grammarWeaknesses.length, 2);
  const grammarWeakness = analytics.grammarWeaknesses.find((w) => w.category === "Grammar");
  const miscWeakness = analytics.grammarWeaknesses.find((w) => w.category === "Miscellaneous");
  assert.equal(grammarWeakness?.count, 2);
  assert.equal(miscWeakness?.count, 1);
  // most-frequent category first
  assert.equal(analytics.grammarWeaknesses[0].category, "Grammar");

  assert.equal(analytics.vocabularyGrowth.length, 1);
  assert.equal(analytics.vocabularyGrowth[0].cumulativeCount, 1);

  assert.equal(analytics.practiceFrequency.length, 1);
  assert.equal(analytics.practiceFrequency[0].count, 1);
});

test("returns zeroed-out analytics for a student with no activity", async () => {
  ensureSchema();
  const passwordHash = await hashPassword("studentpass123");
  const [student] = await db
    .insert(users)
    .values({ email: "quietstu@x.com", passwordHash, role: "student", displayName: "Quiet" })
    .returning();

  const analytics = await getStudentAnalytics(student.id);

  assert.equal(analytics.totalConversations, 0);
  assert.equal(analytics.totalMessages, 0);
  assert.equal(analytics.estimatedPracticeMinutes, 0);
  assert.deepEqual(analytics.practiceFrequency, []);
  assert.deepEqual(analytics.grammarWeaknesses, []);
  assert.deepEqual(analytics.vocabularyGrowth, []);
  assert.equal(analytics.estimatedLevel, "B1");
});
