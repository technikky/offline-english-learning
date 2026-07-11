import "../testSetup";
import { test } from "node:test";
import assert from "node:assert/strict";
import { eq } from "drizzle-orm";
import Fastify from "fastify";
import { ensureSchema, db } from "../db/client";
import { conversations, grammarMistakes, messages, users } from "../db/schema";
import { hashPassword } from "../auth/password";
import { signAccessToken } from "../auth/tokens";
import { aiExplainClient } from "../grammar/aiExplainClient";
import { registerGrammarRoutes } from "./grammar";

function buildApp() {
  const app = Fastify();
  registerGrammarRoutes(app);
  return app;
}

async function createStudentWithMistake(email: string) {
  const passwordHash = await hashPassword("studentpass123");
  const [student] = await db
    .insert(users)
    .values({ email, passwordHash, role: "student", displayName: "Stu" })
    .returning();
  const [conversation] = await db
    .insert(conversations)
    .values({ studentId: student.id, scenario: "daily" })
    .returning();
  const [message] = await db
    .insert(messages)
    .values({ conversationId: conversation.id, role: "user", content: "She go to school." })
    .returning();
  const [mistake] = await db
    .insert(grammarMistakes)
    .values({
      messageId: message.id,
      originalText: "go",
      correctedText: "goes",
      ruleId: "HE_VERB_AGR",
      ruleDescription: "Agreement error",
      category: "Grammar",
    })
    .returning();
  return { student, mistake };
}

test("explains a mistake by calling the AI service and persists the result", async () => {
  ensureSchema();
  const { student, mistake } = await createStudentWithMistake("explain1@x.com");

  const originalExplain = aiExplainClient.explain;
  aiExplainClient.explain = async () => ({
    explanation: "Because 'she' needs a verb ending in -s.",
    example: "He goes to work.",
  });

  try {
    const app = buildApp();
    const token = signAccessToken({ sub: student.id, role: "student" });

    const res = await app.inject({
      method: "POST",
      url: "/grammar/explain",
      headers: { authorization: `Bearer ${token}` },
      payload: { mistakeId: mistake.id },
    });

    assert.equal(res.statusCode, 200);
    const body = res.json();
    assert.equal(body.explanation, "Because 'she' needs a verb ending in -s.");
    assert.equal(body.example, "He goes to work.");

    const updated = await db.query.grammarMistakes.findFirst({
      where: (table, { eq }) => eq(table.id, mistake.id),
    });
    assert.equal(updated?.explanation, "Because 'she' needs a verb ending in -s.");
  } finally {
    aiExplainClient.explain = originalExplain;
  }
});

test("returns a cached explanation without calling the AI service again", async () => {
  ensureSchema();
  const { student, mistake } = await createStudentWithMistake("explain2@x.com");
  await db
    .update(grammarMistakes)
    .set({ explanation: "cached explanation", example: "cached example" })
    .where(eq(grammarMistakes.id, mistake.id));

  const originalExplain = aiExplainClient.explain;
  aiExplainClient.explain = async () => {
    throw new Error("should not be called when cached");
  };

  try {
    const app = buildApp();
    const token = signAccessToken({ sub: student.id, role: "student" });

    const res = await app.inject({
      method: "POST",
      url: "/grammar/explain",
      headers: { authorization: `Bearer ${token}` },
      payload: { mistakeId: mistake.id },
    });

    assert.equal(res.statusCode, 200);
    assert.equal(res.json().explanation, "cached explanation");
  } finally {
    aiExplainClient.explain = originalExplain;
  }
});

test("a student cannot explain a mistake belonging to someone else's conversation", async () => {
  ensureSchema();
  const { mistake } = await createStudentWithMistake("victim@x.com");

  const passwordHash = await hashPassword("studentpass123");
  const [otherStudent] = await db
    .insert(users)
    .values({ email: "intruder@x.com", passwordHash, role: "student", displayName: "Intruder" })
    .returning();

  const app = buildApp();
  const token = signAccessToken({ sub: otherStudent.id, role: "student" });

  const res = await app.inject({
    method: "POST",
    url: "/grammar/explain",
    headers: { authorization: `Bearer ${token}` },
    payload: { mistakeId: mistake.id },
  });

  assert.equal(res.statusCode, 404);
});
