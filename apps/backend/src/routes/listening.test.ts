import "../testSetup";
import { test } from "node:test";
import assert from "node:assert/strict";
import Fastify from "fastify";
import { ensureSchema, db } from "../db/client";
import { users } from "../db/schema";
import { hashPassword } from "../auth/password";
import { signAccessToken } from "../auth/tokens";
import { aiReadingClient } from "../reading/aiReadingClient";
import { registerListeningRoutes } from "./listening";

function buildApp() {
  const app = Fastify();
  registerListeningRoutes(app);
  return app;
}

function fakeAiComprehension() {
  const original = aiReadingClient.generateComprehension;
  let calls = 0;
  aiReadingClient.generateComprehension = async () => {
    calls++;
    return {
      summary: "A person describes their morning routine.",
      vocabularyWords: ["routine", "breakfast"],
      questions: [
        { question: "When do they wake up?", options: ["six", "seven", "eight", "nine"], correctAnswer: "seven" },
        { question: "What do they drink?", options: ["milk", "coffee", "orange juice", "tea"], correctAnswer: "orange juice" },
      ],
    };
  };
  return { restore: () => { aiReadingClient.generateComprehension = original; }, getCallCount: () => calls };
}

async function createStudent(email: string) {
  const passwordHash = await hashPassword("studentpass123");
  const [student] = await db
    .insert(users)
    .values({ email, passwordHash, role: "student", displayName: "Stu" })
    .returning();
  return signAccessToken({ sub: student.id, role: "student" });
}

test("lists listening clips without exposing the transcript", async () => {
  ensureSchema();
  const token = await createStudent("lclips@x.com");
  const app = buildApp();
  const res = await app.inject({ method: "GET", url: "/listening/clips", headers: { authorization: `Bearer ${token}` } });
  assert.equal(res.statusCode, 200);
  const clips = res.json();
  assert.ok(clips.length >= 4);
  assert.ok(clips.some((c: { id: string }) => c.id === "listen-morning-routine"));
  assert.equal(clips[0].transcript, undefined);
});

test("returns clip detail with transcript, sentences, and AI comprehension, caching it", async () => {
  ensureSchema();
  const fake = fakeAiComprehension();
  const token = await createStudent("ldetail@x.com");
  const app = buildApp();

  const first = await app.inject({ method: "GET", url: "/listening/clips/listen-morning-routine", headers: { authorization: `Bearer ${token}` } });
  assert.equal(first.statusCode, 200);
  const detail = first.json();
  assert.ok(detail.transcript.length > 0);
  assert.ok(detail.sentences.length > 1, "transcript should split into multiple sentences");
  assert.equal(detail.questions.length, 2);
  assert.equal(fake.getCallCount(), 1);

  const second = await app.inject({ method: "GET", url: "/listening/clips/listen-morning-routine", headers: { authorization: `Bearer ${token}` } });
  assert.equal(second.statusCode, 200);
  assert.equal(fake.getCallCount(), 1, "second request should hit the cache");
  fake.restore();
});

test("returns 404 for an unknown clip", async () => {
  ensureSchema();
  const token = await createStudent("lunknown@x.com");
  const app = buildApp();
  const res = await app.inject({ method: "GET", url: "/listening/clips/nope", headers: { authorization: `Bearer ${token}` } });
  assert.equal(res.statusCode, 404);
});

test("scores comprehension answers and updates progress", async () => {
  ensureSchema();
  const fake = fakeAiComprehension();
  const token = await createStudent("lsubmit@x.com");
  const app = buildApp();

  const submitRes = await app.inject({
    method: "POST",
    url: "/listening/clips/listen-morning-routine/submit",
    headers: { authorization: `Bearer ${token}` },
    payload: { answers: ["Seven", "orange juice"] },
  });
  assert.equal(submitRes.statusCode, 200);
  assert.deepEqual(submitRes.json(), { score: 100, correctCount: 2, totalQuestions: 2 });

  const progressRes = await app.inject({ method: "GET", url: "/listening/progress", headers: { authorization: `Bearer ${token}` } });
  const progress = progressRes.json();
  assert.equal(progress.overallAverageScore, 100);
  assert.equal(progress.clips.find((c: { clipId: string }) => c.clipId === "listen-morning-routine").bestScore, 100);
  fake.restore();
});

test("dictation check scores word-level similarity", async () => {
  ensureSchema();
  const token = await createStudent("ldictation@x.com");
  const app = buildApp();

  const exact = await app.inject({
    method: "POST",
    url: "/listening/dictation/check",
    headers: { authorization: `Bearer ${token}` },
    payload: { target: "I wake up at seven.", attempt: "i wake up at seven" },
  });
  assert.equal(exact.statusCode, 200);
  assert.equal(exact.json().score, 100);

  const partial = await app.inject({
    method: "POST",
    url: "/listening/dictation/check",
    headers: { authorization: `Bearer ${token}` },
    payload: { target: "I wake up at seven", attempt: "I wake at seven" },
  });
  assert.ok(partial.json().score > 0 && partial.json().score < 100);
});

test("requires authentication for listening routes", async () => {
  ensureSchema();
  const app = buildApp();
  const res = await app.inject({ method: "GET", url: "/listening/clips" });
  assert.equal(res.statusCode, 401);
});
