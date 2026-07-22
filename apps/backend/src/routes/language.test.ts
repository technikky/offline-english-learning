import "../testSetup";
import { test } from "node:test";
import assert from "node:assert/strict";
import Fastify from "fastify";
import { ensureSchema, db } from "../db/client";
import { users } from "../db/schema";
import { hashPassword } from "../auth/password";
import { signAccessToken } from "../auth/tokens";
import { registerLanguageRoutes } from "./language";
import { registerCurriculumRoutes } from "./curriculum";
import { registerGrammarLessonRoutes } from "./grammarLessons";

function buildApp() {
  const app = Fastify();
  registerLanguageRoutes(app);
  registerCurriculumRoutes(app);
  registerGrammarLessonRoutes(app);
  return app;
}

async function createStudent(email: string) {
  const passwordHash = await hashPassword("studentpass123");
  const [student] = await db
    .insert(users)
    .values({ email, passwordHash, role: "student", displayName: "Stu" })
    .returning();
  return { student, token: signAccessToken({ sub: student.id, role: "student" }) };
}

test("a student defaults to learning English", async () => {
  ensureSchema();
  const { token } = await createStudent("lang1@x.com");
  const app = buildApp();
  const res = await app.inject({
    method: "GET",
    url: "/me/language",
    headers: { authorization: `Bearer ${token}` },
  });
  assert.equal(res.statusCode, 200);
  assert.equal(res.json().targetLanguage, "english");
});

test("switching to Chinese persists and is read back", async () => {
  ensureSchema();
  const { token } = await createStudent("lang2@x.com");
  const app = buildApp();

  const put = await app.inject({
    method: "PUT",
    url: "/me/language",
    headers: { authorization: `Bearer ${token}` },
    payload: { targetLanguage: "chinese" },
  });
  assert.equal(put.statusCode, 200);
  assert.equal(put.json().targetLanguage, "chinese");

  const get = await app.inject({
    method: "GET",
    url: "/me/language",
    headers: { authorization: `Bearer ${token}` },
  });
  assert.equal(get.json().targetLanguage, "chinese");
});

test("an unknown language is rejected", async () => {
  ensureSchema();
  const { token } = await createStudent("lang3@x.com");
  const app = buildApp();
  const res = await app.inject({
    method: "PUT",
    url: "/me/language",
    headers: { authorization: `Bearer ${token}` },
    payload: { targetLanguage: "klingon" },
  });
  assert.equal(res.statusCode, 400);
});

test("the grammar topic list follows the student's target language", async () => {
  ensureSchema();
  const { token } = await createStudent("lang4@x.com");
  const app = buildApp();

  const english = await app.inject({
    method: "GET",
    url: "/grammar/topics",
    headers: { authorization: `Bearer ${token}` },
  });
  const englishIds = english.json().map((t: { id: string }) => t.id);
  assert.ok(englishIds.includes("present-tense"));
  assert.ok(!englishIds.some((id: string) => id.startsWith("zh-")));

  await app.inject({
    method: "PUT",
    url: "/me/language",
    headers: { authorization: `Bearer ${token}` },
    payload: { targetLanguage: "chinese" },
  });

  const chinese = await app.inject({
    method: "GET",
    url: "/grammar/topics",
    headers: { authorization: `Bearer ${token}` },
  });
  const chineseIds = chinese.json().map((t: { id: string }) => t.id);
  assert.ok(chineseIds.includes("zh-basic-sentence"));
  assert.ok(!chineseIds.includes("present-tense"));
});

test("the curriculum path follows the student's target language", async () => {
  ensureSchema();
  const { token } = await createStudent("lang5@x.com");
  const app = buildApp();

  const before = (
    await app.inject({
      method: "GET",
      url: "/curriculum",
      headers: { authorization: `Bearer ${token}` },
    })
  ).json();
  assert.match(before.courseTitle, /English/);
  assert.equal(before.units[0].id, "unit-a1");

  await app.inject({
    method: "PUT",
    url: "/me/language",
    headers: { authorization: `Bearer ${token}` },
    payload: { targetLanguage: "chinese" },
  });

  const after = (
    await app.inject({
      method: "GET",
      url: "/curriculum",
      headers: { authorization: `Bearer ${token}` },
    })
  ).json();
  assert.match(after.courseTitle, /Chinese/);
  assert.equal(after.units[0].id, "unit-zh-a1");
  assert.ok(after.totalLessons > 0);
});

// --- Stage 36: interface locale (independent of target language) ---

test("a user defaults to the English interface", async () => {
  ensureSchema();
  const { token } = await createStudent("loc1@x.com");
  const app = buildApp();
  const res = await app.inject({
    method: "GET",
    url: "/me/locale",
    headers: { authorization: `Bearer ${token}` },
  });
  assert.equal(res.statusCode, 200);
  assert.equal(res.json().uiLocale, "en");
});

test("the interface locale persists and is independent of the target language", async () => {
  ensureSchema();
  const { token } = await createStudent("loc2@x.com");
  const app = buildApp();

  // A Chinese speaker learning English: Chinese UI, English target.
  const put = await app.inject({
    method: "PUT",
    url: "/me/locale",
    headers: { authorization: `Bearer ${token}` },
    payload: { uiLocale: "zh" },
  });
  assert.equal(put.json().uiLocale, "zh");

  const language = await app.inject({
    method: "GET",
    url: "/me/language",
    headers: { authorization: `Bearer ${token}` },
  });
  assert.equal(
    language.json().targetLanguage,
    "english",
    "changing the interface language must not change what the student is learning",
  );

  const locale = await app.inject({
    method: "GET",
    url: "/me/locale",
    headers: { authorization: `Bearer ${token}` },
  });
  assert.equal(locale.json().uiLocale, "zh");
});

test("changing the target language does not change the interface locale", async () => {
  ensureSchema();
  const { token } = await createStudent("loc3@x.com");
  const app = buildApp();
  await app.inject({
    method: "PUT",
    url: "/me/language",
    headers: { authorization: `Bearer ${token}` },
    payload: { targetLanguage: "chinese" },
  });
  const locale = await app.inject({
    method: "GET",
    url: "/me/locale",
    headers: { authorization: `Bearer ${token}` },
  });
  assert.equal(locale.json().uiLocale, "en", "the two settings are orthogonal");
});

test("an unknown interface locale is rejected", async () => {
  ensureSchema();
  const { token } = await createStudent("loc4@x.com");
  const app = buildApp();
  const res = await app.inject({
    method: "PUT",
    url: "/me/locale",
    headers: { authorization: `Bearer ${token}` },
    payload: { uiLocale: "fr" },
  });
  assert.equal(res.statusCode, 400);
});
