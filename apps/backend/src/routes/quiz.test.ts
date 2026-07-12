import "../testSetup";
import { test } from "node:test";
import assert from "node:assert/strict";
import Fastify from "fastify";
import { ensureSchema, db } from "../db/client";
import { users } from "../db/schema";
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
  assert.equal(quiz.questions.length, 2);
  assert.equal(quiz.questions[0].correctAnswer, undefined, "correctAnswer must not be sent to the client");
  assert.equal(quiz.questions[0].explanation, undefined);
  restore();
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
  const restore = fakeQuiz();
  const token = await createStudent("qsubmit@x.com");
  const app = buildApp();

  const gen = await app.inject({
    method: "POST",
    url: "/quiz/generate",
    headers: { authorization: `Bearer ${token}` },
    payload: { category: "grammar", difficultyLevel: "A2" },
  });
  const quizId = gen.json().quizId;

  const submit = await app.inject({
    method: "POST",
    url: `/quiz/${quizId}/submit`,
    headers: { authorization: `Bearer ${token}` },
    payload: { answers: ["Goes", "False"] }, // Q1 correct (case-insensitive), Q2 wrong
  });
  assert.equal(submit.statusCode, 200);
  const result = submit.json();
  assert.equal(result.correctCount, 1);
  assert.equal(result.totalQuestions, 2);
  assert.equal(result.score, 50);
  assert.equal(result.results[0].isCorrect, true);
  assert.equal(result.results[0].correctAnswer, "goes");
  assert.equal(result.results[0].explanation, "3rd person singular.");
  assert.equal(result.results[1].isCorrect, false);

  const progress = await app.inject({ method: "GET", url: "/quiz/progress", headers: { authorization: `Bearer ${token}` } });
  const p = progress.json();
  assert.equal(p.totalQuizzes, 1);
  assert.equal(p.averageScore, 50);
  assert.equal(p.recent[0].category, "grammar");
  restore();
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
