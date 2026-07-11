import "../testSetup";
import { test } from "node:test";
import assert from "node:assert/strict";
import Fastify from "fastify";
import { ensureSchema, db } from "../db/client";
import { users } from "../db/schema";
import { hashPassword } from "../auth/password";
import { signAccessToken } from "../auth/tokens";
import { aiExerciseClient } from "../grammar/aiExerciseClient";
import { registerGrammarLessonRoutes } from "./grammarLessons";

function buildApp() {
  const app = Fastify();
  registerGrammarLessonRoutes(app);
  return app;
}

function fakeAiExercise() {
  const original = aiExerciseClient.generate;
  aiExerciseClient.generate = async () => ({
    question: "She ____ to school every day.",
    options: ["go", "goes", "going", "gone"],
    correctAnswer: "goes",
    explanation: "Third-person singular takes -s.",
  });
  return () => {
    aiExerciseClient.generate = original;
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

test("lists grammar topics grouped by level, without exposing explanation/examples", async () => {
  ensureSchema();
  const { token } = await createStudent("gtopics@x.com");
  const app = buildApp();

  const res = await app.inject({
    method: "GET",
    url: "/grammar/topics",
    headers: { authorization: `Bearer ${token}` },
  });
  assert.equal(res.statusCode, 200);
  const topics = res.json();
  assert.ok(topics.length >= 9);
  assert.ok(topics.some((t: { id: string }) => t.id === "present-tense"));
  assert.equal(topics[0].explanation, undefined);
});

test("returns full topic detail including explanation and examples", async () => {
  ensureSchema();
  const { token } = await createStudent("gdetail@x.com");
  const app = buildApp();

  const res = await app.inject({
    method: "GET",
    url: "/grammar/topics/present-tense",
    headers: { authorization: `Bearer ${token}` },
  });
  assert.equal(res.statusCode, 200);
  const topic = res.json();
  assert.equal(topic.title, "Present Simple Tense");
  assert.ok(topic.examples.length > 0);
});

test("returns 404 for an unknown topic id", async () => {
  ensureSchema();
  const { token } = await createStudent("gunknown@x.com");
  const app = buildApp();

  const res = await app.inject({
    method: "GET",
    url: "/grammar/topics/not-a-real-topic",
    headers: { authorization: `Bearer ${token}` },
  });
  assert.equal(res.statusCode, 404);
});

test("generates an exercise via the AI service", async () => {
  ensureSchema();
  const restore = fakeAiExercise();
  const { token } = await createStudent("gexercise@x.com");
  const app = buildApp();

  const res = await app.inject({
    method: "POST",
    url: "/grammar/topics/present-tense/exercise",
    headers: { authorization: `Bearer ${token}` },
    payload: { exerciseType: "multiple_choice" },
  });
  assert.equal(res.statusCode, 200);
  const exercise = res.json();
  assert.equal(exercise.correctAnswer, "goes");
  assert.equal(exercise.options.length, 4);
  restore();
});

test("submitting a correct answer records the attempt as correct and updates progress", async () => {
  ensureSchema();
  const { token } = await createStudent("gsubmit@x.com");
  const app = buildApp();

  const submitRes = await app.inject({
    method: "POST",
    url: "/grammar/topics/present-tense/exercise/submit",
    headers: { authorization: `Bearer ${token}` },
    payload: {
      exerciseType: "multiple_choice",
      question: "She ____ to school.",
      correctAnswer: "Goes",
      studentAnswer: "goes",
    },
  });
  assert.equal(submitRes.statusCode, 200);
  assert.equal(submitRes.json().isCorrect, true, "answer comparison should be case-insensitive");

  const progressRes = await app.inject({
    method: "GET",
    url: "/grammar/progress",
    headers: { authorization: `Bearer ${token}` },
  });
  assert.equal(progressRes.statusCode, 200);
  const progress = progressRes.json();
  assert.equal(progress.totalAttempts, 1);
  assert.equal(progress.overallAccuracy, 100);
  const topicProgress = progress.topics.find(
    (t: { topicId: string }) => t.topicId === "present-tense",
  );
  assert.equal(topicProgress.attempts, 1);
  assert.equal(topicProgress.correct, 1);
});

test("submitting a wrong answer records the attempt as incorrect", async () => {
  ensureSchema();
  const { token } = await createStudent("gwrong@x.com");
  const app = buildApp();

  const submitRes = await app.inject({
    method: "POST",
    url: "/grammar/topics/past-tense/exercise/submit",
    headers: { authorization: `Bearer ${token}` },
    payload: {
      exerciseType: "fill_blank",
      question: "Yesterday, I ____ to the store.",
      correctAnswer: "walked",
      studentAnswer: "walk",
    },
  });
  assert.equal(submitRes.statusCode, 200);
  assert.equal(submitRes.json().isCorrect, false);
});

test("requires authentication for grammar lesson routes", async () => {
  ensureSchema();
  const app = buildApp();
  const res = await app.inject({ method: "GET", url: "/grammar/topics" });
  assert.equal(res.statusCode, 401);
});
