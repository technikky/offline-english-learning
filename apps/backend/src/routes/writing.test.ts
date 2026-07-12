import "../testSetup";
import { test } from "node:test";
import assert from "node:assert/strict";
import Fastify from "fastify";
import { ensureSchema, db } from "../db/client";
import { users } from "../db/schema";
import { hashPassword } from "../auth/password";
import { signAccessToken } from "../auth/tokens";
import { aiWritingClient } from "../writing/aiWritingClient";
import { languageToolClient } from "../grammar/languageToolClient";
import { registerWritingRoutes } from "./writing";

function buildApp() {
  const app = Fastify();
  registerWritingRoutes(app);
  return app;
}

function fakeAi() {
  const origAi = aiWritingClient.analyze;
  const origLt = languageToolClient.check;
  aiWritingClient.analyze = async () => ({
    overall: "A good first attempt.",
    grammarScore: 80,
    vocabularyScore: 70,
    coherenceScore: 75,
    strengths: ["clear ideas"],
    improvements: ["use more linking words"],
    modelAnswer: "My family is small and warm.",
  });
  languageToolClient.check = async () => [
    { originalText: "recieve", correctedText: "receive", ruleId: "SPELL", ruleDescription: "Spelling", category: "Typos" },
  ];
  return () => {
    aiWritingClient.analyze = origAi;
    languageToolClient.check = origLt;
  };
}

async function createStudent(email: string) {
  const passwordHash = await hashPassword("studentpass123");
  const [student] = await db
    .insert(users)
    .values({ email, passwordHash, role: "student", displayName: "Stu" })
    .returning();
  return signAccessToken({ sub: student.id, role: "student" });
}

test("lists writing prompts without exposing the full prompt/hints", async () => {
  ensureSchema();
  const token = await createStudent("wlist@x.com");
  const app = buildApp();
  const res = await app.inject({ method: "GET", url: "/writing/prompts", headers: { authorization: `Bearer ${token}` } });
  assert.equal(res.statusCode, 200);
  const prompts = res.json();
  assert.ok(prompts.length >= 4);
  assert.ok(prompts.some((p: { id: string }) => p.id === "write-my-family"));
  assert.equal(prompts[0].hints, undefined);
  assert.equal(typeof prompts[0].wordCountTarget, "number");
});

test("returns prompt detail with scaffolding (vocab, grammar focus, hints)", async () => {
  ensureSchema();
  const token = await createStudent("wdetail@x.com");
  const app = buildApp();
  const res = await app.inject({ method: "GET", url: "/writing/prompts/write-my-family", headers: { authorization: `Bearer ${token}` } });
  assert.equal(res.statusCode, 200);
  const p = res.json();
  assert.ok(p.targetVocabulary.length > 0);
  assert.ok(p.grammarFocus.length > 0);
  assert.ok(p.hints.length > 0);
});

test("submitting an essay returns combined LanguageTool + AI feedback and persists it", async () => {
  ensureSchema();
  const restore = fakeAi();
  const token = await createStudent("wsubmit@x.com");
  const app = buildApp();

  const res = await app.inject({
    method: "POST",
    url: "/writing/prompts/write-my-family/submit",
    headers: { authorization: `Bearer ${token}` },
    payload: { text: "My family has four people. We recieve guests often and eat together." },
  });
  assert.equal(res.statusCode, 200);
  const fb = res.json();
  assert.equal(fb.grammarScore, 80);
  assert.equal(fb.modelAnswer, "My family is small and warm.");
  assert.equal(fb.mistakes.length, 1);
  assert.equal(fb.mistakes[0].correctedText, "receive");
  assert.ok(fb.wordCount > 0);

  const progressRes = await app.inject({ method: "GET", url: "/writing/progress", headers: { authorization: `Bearer ${token}` } });
  const progress = progressRes.json();
  assert.equal(progress.totalSubmissions, 1);
  assert.equal(progress.submissions[0].promptTitle, "My Family");
  assert.equal(progress.averageOverallScore, 75); // (80+70+75)/3
  restore();
});

test("degrades gracefully to AI-only feedback when LanguageTool is down", async () => {
  ensureSchema();
  const origAi = aiWritingClient.analyze;
  const origLt = languageToolClient.check;
  aiWritingClient.analyze = async () => ({
    overall: "ok", grammarScore: 50, vocabularyScore: 50, coherenceScore: 50,
    strengths: [], improvements: [], modelAnswer: "x",
  });
  languageToolClient.check = async () => { throw new Error("LT down"); };

  const token = await createStudent("wdegraded@x.com");
  const app = buildApp();
  const res = await app.inject({
    method: "POST",
    url: "/writing/prompts/write-my-family/submit",
    headers: { authorization: `Bearer ${token}` },
    payload: { text: "Some text here." },
  });
  assert.equal(res.statusCode, 200);
  assert.deepEqual(res.json().mistakes, []);
  aiWritingClient.analyze = origAi;
  languageToolClient.check = origLt;
});

test("returns 404 for an unknown prompt and 400 for empty text", async () => {
  ensureSchema();
  const token = await createStudent("w404@x.com");
  const app = buildApp();
  const notFound = await app.inject({ method: "GET", url: "/writing/prompts/nope", headers: { authorization: `Bearer ${token}` } });
  assert.equal(notFound.statusCode, 404);
  const empty = await app.inject({
    method: "POST",
    url: "/writing/prompts/write-my-family/submit",
    headers: { authorization: `Bearer ${token}` },
    payload: { text: "   " },
  });
  assert.equal(empty.statusCode, 400);
});

test("requires authentication for writing routes", async () => {
  ensureSchema();
  const app = buildApp();
  const res = await app.inject({ method: "GET", url: "/writing/prompts" });
  assert.equal(res.statusCode, 401);
});
