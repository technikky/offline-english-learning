import "../testSetup";
import { test } from "node:test";
import assert from "node:assert/strict";
import Fastify from "fastify";
import { ensureSchema, db } from "../db/client";
import { users } from "../db/schema";
import { hashPassword } from "../auth/password";
import { signAccessToken } from "../auth/tokens";
import { aiReadingClient } from "../reading/aiReadingClient";
import { registerReadingRoutes } from "./reading";

function buildApp() {
  const app = Fastify();
  registerReadingRoutes(app);
  return app;
}

function fakeAiReading() {
  const original = aiReadingClient.generateComprehension;
  let calls = 0;
  aiReadingClient.generateComprehension = async () => {
    calls++;
    return {
      summary: "A short summary.",
      vocabularyWords: ["park", "swing"],
      questions: [
        { question: "Where were they?", options: ["park", "school", "hospital", "shop"], correctAnswer: "park" },
        { question: "Who read a book?", options: ["father", "mother", "brother", "sister"], correctAnswer: "father" },
      ],
    };
  };
  return {
    restore: () => {
      aiReadingClient.generateComprehension = original;
    },
    getCallCount: () => calls,
  };
}

async function createStudent(email: string) {
  const passwordHash = await hashPassword("studentpass123");
  const [student] = await db
    .insert(users)
    .values({ email, passwordHash, role: "student", displayName: "Stu" })
    .returning();
  return { student, token: signAccessToken({ sub: student.id, role: "student" }) };
}

test("lists reading passages without exposing content", async () => {
  ensureSchema();
  const { token } = await createStudent("rpassages@x.com");
  const app = buildApp();

  const res = await app.inject({
    method: "GET",
    url: "/reading/passages",
    headers: { authorization: `Bearer ${token}` },
  });
  assert.equal(res.statusCode, 200);
  const passages = res.json();
  assert.ok(passages.length >= 5);
  assert.ok(passages.some((p: { id: string }) => p.id === "a-day-at-the-park"));
  assert.equal(passages[0].content, undefined);
});

test("returns passage detail with AI-generated comprehension, caching it on first request", async () => {
  ensureSchema();
  const fake = fakeAiReading();
  const { token } = await createStudent("rdetail@x.com");
  const app = buildApp();

  const first = await app.inject({
    method: "GET",
    url: "/reading/passages/a-day-at-the-park",
    headers: { authorization: `Bearer ${token}` },
  });
  assert.equal(first.statusCode, 200);
  const detail = first.json();
  assert.equal(detail.summary, "A short summary.");
  assert.equal(detail.questions.length, 2);
  assert.equal(fake.getCallCount(), 1);

  const second = await app.inject({
    method: "GET",
    url: "/reading/passages/a-day-at-the-park",
    headers: { authorization: `Bearer ${token}` },
  });
  assert.equal(second.statusCode, 200);
  assert.equal(fake.getCallCount(), 1, "second request should use the cache, not call the AI again");
  fake.restore();
});

test("returns 404 for an unknown passage id", async () => {
  ensureSchema();
  const { token } = await createStudent("runknown@x.com");
  const app = buildApp();

  const res = await app.inject({
    method: "GET",
    url: "/reading/passages/not-a-real-passage",
    headers: { authorization: `Bearer ${token}` },
  });
  assert.equal(res.statusCode, 404);
});

test("submitting answers scores correctly and updates progress", async () => {
  ensureSchema();
  const fake = fakeAiReading();
  const { token } = await createStudent("rsubmit@x.com");
  const app = buildApp();

  const submitRes = await app.inject({
    method: "POST",
    url: "/reading/passages/a-day-at-the-park/submit",
    headers: { authorization: `Bearer ${token}` },
    payload: { answers: ["Park", "father"] },
  });
  assert.equal(submitRes.statusCode, 200);
  const result = submitRes.json();
  assert.equal(result.correctCount, 2);
  assert.equal(result.totalQuestions, 2);
  assert.equal(result.score, 100);

  const progressRes = await app.inject({
    method: "GET",
    url: "/reading/progress",
    headers: { authorization: `Bearer ${token}` },
  });
  assert.equal(progressRes.statusCode, 200);
  const progress = progressRes.json();
  assert.equal(progress.overallAverageScore, 100);
  const entry = progress.passages.find((p: { passageId: string }) => p.passageId === "a-day-at-the-park");
  assert.equal(entry.attempts, 1);
  assert.equal(entry.bestScore, 100);
  fake.restore();
});

test("a wrong answer lowers the score", async () => {
  ensureSchema();
  const fake = fakeAiReading();
  const { token } = await createStudent("rwrong@x.com");
  const app = buildApp();

  const submitRes = await app.inject({
    method: "POST",
    url: "/reading/passages/a-day-at-the-park/submit",
    headers: { authorization: `Bearer ${token}` },
    payload: { answers: ["park", "mother"] },
  });
  assert.equal(submitRes.statusCode, 200);
  const result = submitRes.json();
  assert.equal(result.correctCount, 1);
  assert.equal(result.score, 50);
  fake.restore();
});

test("requires authentication for reading routes", async () => {
  ensureSchema();
  const app = buildApp();
  const res = await app.inject({ method: "GET", url: "/reading/passages" });
  assert.equal(res.statusCode, 401);
});
