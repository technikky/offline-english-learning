import "../testSetup";
import { test } from "node:test";
import assert from "node:assert/strict";
import Fastify from "fastify";
import { eq } from "drizzle-orm";
import { ensureSchema, db } from "../db/client";
import { quizInstances, users } from "../db/schema";
import { hashPassword } from "../auth/password";
import { signAccessToken } from "../auth/tokens";
import { aiQuizClient } from "../quiz/aiQuizClient";
import { registerQuizRoutes } from "./quiz";

function buildApp() {
  const app = Fastify();
  registerQuizRoutes(app);
  return app;
}

function fakeQuiz() {
  const original = aiQuizClient.generate;
  aiQuizClient.generate = async () => [
    { type: "multiple_choice", question: "She ___ home.", options: ["go", "goes", "going", "gone"], correctAnswer: "goes", explanation: "3rd person singular." },
    { type: "true_false", question: "'Happy' is an adjective.", options: ["True", "False"], correctAnswer: "True", explanation: "Describes a noun." },
  ];
  return () => { aiQuizClient.generate = original; };
}

async function createStudent(email: string) {
  const passwordHash = await hashPassword("studentpass123");
  const [student] = await db
    .insert(users)
    .values({ email, passwordHash, role: "student", displayName: "Stu" })
    .returning();
  return signAccessToken({ sub: student.id, role: "student" });
}

test("generates a quiz without exposing correct answers to the client", async () => {
  ensureSchema();
  const restore = fakeQuiz();
  const token = await createStudent("qgen@x.com");
  const app = buildApp();

  const res = await app.inject({
    method: "POST",
    url: "/quiz/generate",
    headers: { authorization: `Bearer ${token}` },
    payload: { category: "grammar", difficultyLevel: "A2" },
  });
  assert.equal(res.statusCode, 200);
  const quiz = res.json();
  assert.ok(quiz.quizId);
  // Stage 38: the curated bank fills the whole quiz, so it is always 5.
  assert.equal(quiz.questions.length, 5);
  assert.equal(quiz.questions[0].correctAnswer, undefined, "correctAnswer must not be sent to the client");
  assert.equal(quiz.questions[0].explanation, undefined);
  restore();
});

// --- Stage 38: curated question bank ---

test("a covered bucket is served entirely from the bank, never calling the AI", async () => {
  ensureSchema();
  const original = aiQuizClient.generate;
  let aiCalls = 0;
  aiQuizClient.generate = async () => {
    aiCalls++;
    return [];
  };
  try {
    const token = await createStudent("qcur@x.com");
    const app = buildApp();
    const res = await app.inject({
      method: "POST",
      url: "/quiz/generate",
      headers: { authorization: `Bearer ${token}` },
      payload: { category: "vocabulary", difficultyLevel: "B1" },
    });
    assert.equal(res.statusCode, 200);
    assert.equal(res.json().questions.length, 5);
    assert.equal(aiCalls, 0, "curated coverage must keep the model out of the happy path");
  } finally {
    aiQuizClient.generate = original;
  }
});

test("an AI failure no longer breaks quiz generation", async () => {
  ensureSchema();
  const original = aiQuizClient.generate;
  aiQuizClient.generate = async () => {
    throw new Error("ai service down");
  };
  try {
    const token = await createStudent("qdown@x.com");
    const app = buildApp();
    const res = await app.inject({
      method: "POST",
      url: "/quiz/generate",
      headers: { authorization: `Bearer ${token}` },
      payload: { category: "grammar", difficultyLevel: "C1" },
    });
    // Before this stage an unavailable model meant a 502 and no quiz at all.
    assert.equal(res.statusCode, 200);
    assert.equal(res.json().questions.length, 5);
  } finally {
    aiQuizClient.generate = original;
  }
});

test("curated questions still grade correctly end to end", async () => {
  ensureSchema();
  const token = await createStudent("qgrade@x.com");
  const app = buildApp();

  const generated = await app.inject({
    method: "POST",
    url: "/quiz/generate",
    headers: { authorization: `Bearer ${token}` },
    payload: { category: "grammar", difficultyLevel: "A1" },
  });
  const quiz = generated.json();

  const submitted = await app.inject({
    method: "POST",
    url: `/quiz/${quiz.quizId}/submit`,
    headers: { authorization: `Bearer ${token}` },
    payload: { answers: quiz.questions.map(() => "definitely-wrong") },
  });
  assert.equal(submitted.statusCode, 200);
  const result = submitted.json();
  assert.equal(result.score, 0);
  assert.equal(result.totalQuestions, 5);
  // Grading reveals the answer and explanation only after submission.
  assert.ok(result.results.every((r: { correctAnswer: string }) => r.correctAnswer));
  assert.ok(result.results.every((r: { explanation: string }) => r.explanation));
});

test("rejects an invalid category", async () => {
  ensureSchema();
  const token = await createStudent("qcat@x.com");
  const app = buildApp();
  const res = await app.inject({
    method: "POST",
    url: "/quiz/generate",
    headers: { authorization: `Bearer ${token}` },
    payload: { category: "astrophysics", difficultyLevel: "B1" },
  });
  assert.equal(res.statusCode, 400);
});

test("grades a submitted quiz, reveals answers/explanations, and updates progress", async () => {
  ensureSchema();
  const token = await createStudent("qsubmit@x.com");
  const app = buildApp();

  const gen = await app.inject({
    method: "POST",
    url: "/quiz/generate",
    headers: { authorization: `Bearer ${token}` },
    payload: { category: "grammar", difficultyLevel: "A2" },
  });
  const quizId = gen.json().quizId;

  // Stage 38: questions now come from the curated bank, so the answers aren't
  // known up front. Read them from the server-side record -- which also proves
  // the answers really are stored server-side and never sent to the client.
  const [row] = await db
    .select()
    .from(quizInstances)
    .where(eq(quizInstances.id, quizId));
  const stored = JSON.parse(row.questionsJson) as { correctAnswer: string; explanation: string }[];
  assert.equal(stored.length, 5);

  // Answer the first three correctly (upper-cased, to prove case-insensitive
  // grading) and the rest wrong.
  const answers = stored.map((q, i) =>
    i < 3 ? q.correctAnswer.toUpperCase() : "definitely-wrong",
  );

  const submit = await app.inject({
    method: "POST",
    url: `/quiz/${quizId}/submit`,
    headers: { authorization: `Bearer ${token}` },
    payload: { answers },
  });
  assert.equal(submit.statusCode, 200);
  const result = submit.json();
  assert.equal(result.correctCount, 3);
  assert.equal(result.totalQuestions, 5);
  assert.equal(result.score, 60);
  assert.equal(result.results[0].isCorrect, true);
  assert.equal(result.results[0].correctAnswer, stored[0].correctAnswer);
  assert.equal(result.results[0].explanation, stored[0].explanation);
  assert.equal(result.results[4].isCorrect, false);

  const progress = await app.inject({
    method: "GET",
    url: "/quiz/progress",
    headers: { authorization: `Bearer ${token}` },
  });
  const p = progress.json();
  assert.equal(p.totalQuizzes, 1);
  assert.equal(p.averageScore, 60);
  assert.equal(p.recent[0].category, "grammar");
});

test("cannot submit another student's quiz", async () => {
  ensureSchema();
  const restore = fakeQuiz();
  const tokenA = await createStudent("qownerA@x.com");
  const tokenB = await createStudent("qownerB@x.com");
  const app = buildApp();

  const gen = await app.inject({
    method: "POST", url: "/quiz/generate",
    headers: { authorization: `Bearer ${tokenA}` },
    payload: { category: "grammar", difficultyLevel: "A2" },
  });
  const quizId = gen.json().quizId;

  const submit = await app.inject({
    method: "POST", url: `/quiz/${quizId}/submit`,
    headers: { authorization: `Bearer ${tokenB}` },
    payload: { answers: ["goes", "True"] },
  });
  assert.equal(submit.statusCode, 404);
  restore();
});

test("requires authentication for quiz routes", async () => {
  ensureSchema();
  const app = buildApp();
  const res = await app.inject({ method: "GET", url: "/quiz/progress" });
  assert.equal(res.statusCode, 401);
});
