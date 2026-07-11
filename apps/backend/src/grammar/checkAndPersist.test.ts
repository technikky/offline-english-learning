import "../testSetup";
import { test } from "node:test";
import assert from "node:assert/strict";
import { eq } from "drizzle-orm";
import { ensureSchema, db } from "../db/client";
import { conversations, grammarMistakes, messages, users } from "../db/schema";
import { hashPassword } from "../auth/password";
import { languageToolClient } from "./languageToolClient";
import { checkAndPersistGrammar } from "./checkAndPersist";

test("persists each mistake LanguageTool detects, tied to the message", async () => {
  ensureSchema();
  const passwordHash = await hashPassword("studentpass123");
  const [student] = await db
    .insert(users)
    .values({ email: "gramstu@x.com", passwordHash, role: "student", displayName: "Stu" })
    .returning();
  const [conversation] = await db
    .insert(conversations)
    .values({ studentId: student.id, scenario: "daily" })
    .returning();
  const [message] = await db
    .insert(messages)
    .values({ conversationId: conversation.id, role: "user", content: "She go to school." })
    .returning();

  const originalCheck = languageToolClient.check;
  languageToolClient.check = async () => [
    {
      originalText: "go",
      correctedText: "goes",
      ruleId: "HE_VERB_AGR",
      ruleDescription: "Agreement error",
      category: "Grammar",
    },
  ];

  try {
    const result = await checkAndPersistGrammar(message.id, message.content);

    assert.equal(result.length, 1);
    assert.equal(result[0].correctedText, "goes");
    assert.equal(result[0].explanation, null);

    const rows = await db
      .select()
      .from(grammarMistakes)
      .where(eq(grammarMistakes.messageId, message.id));
    assert.equal(rows.length, 1);
    assert.equal(rows[0].ruleId, "HE_VERB_AGR");
  } finally {
    languageToolClient.check = originalCheck;
  }
});

test("returns an empty array when LanguageTool finds no mistakes", async () => {
  ensureSchema();
  const passwordHash = await hashPassword("studentpass123");
  const [student] = await db
    .insert(users)
    .values({ email: "gramstu2@x.com", passwordHash, role: "student", displayName: "Stu2" })
    .returning();
  const [conversation] = await db
    .insert(conversations)
    .values({ studentId: student.id, scenario: "daily" })
    .returning();
  const [message] = await db
    .insert(messages)
    .values({ conversationId: conversation.id, role: "user", content: "She goes to school." })
    .returning();

  const originalCheck = languageToolClient.check;
  languageToolClient.check = async () => [];

  try {
    const result = await checkAndPersistGrammar(message.id, message.content);
    assert.deepEqual(result, []);
  } finally {
    languageToolClient.check = originalCheck;
  }
});
