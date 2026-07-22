import "../testSetup";
import { test } from "node:test";
import assert from "node:assert/strict";
import Fastify from "fastify";
import { ensureSchema, db } from "../db/client";
import { users } from "../db/schema";
import { hashPassword } from "../auth/password";
import { signAccessToken } from "../auth/tokens";
import { aiVocabClient } from "../vocabulary/aiVocabClient";
import { registerVocabularyRoutes } from "./vocabulary";

function buildApp() {
  const app = Fastify();
  registerVocabularyRoutes(app);
  return app;
}

function fakeAiVocab() {
  const original = { explain: aiVocabClient.explain, embed: aiVocabClient.embed };
  aiVocabClient.explain = async (word: string) => ({
    definition: `definition of ${word}`,
    example: `example with ${word}`,
    synonyms: [],
    antonyms: [],
    cefrLevel: "B1",
  });
  aiVocabClient.embed = async () => [0.1, 0.2, 0.3];
  return () => {
    aiVocabClient.explain = original.explain;
    aiVocabClient.embed = original.embed;
  };
}

test("adds a word to the notebook and lists it back", async () => {
  ensureSchema();
  const restore = fakeAiVocab();
  const passwordHash = await hashPassword("studentpass123");
  const [student] = await db
    .insert(users)
    .values({ email: "vocstu@x.com", passwordHash, role: "student", displayName: "Stu" })
    .returning();

  try {
    const app = buildApp();
    const token = signAccessToken({ sub: student.id, role: "student" });

    const added = await app.inject({
      method: "POST",
      url: "/vocabulary/notebook",
      headers: { authorization: `Bearer ${token}` },
      payload: { word: "ambitious" },
    });
    assert.equal(added.statusCode, 201);
    assert.equal(added.json().vocabulary.word, "ambitious");

    const list = await app.inject({
      method: "GET",
      url: "/vocabulary/notebook",
      headers: { authorization: `Bearer ${token}` },
    });
    assert.equal(list.statusCode, 200);
    const entries = list.json();
    assert.equal(entries.length, 1);
    assert.equal(entries[0].vocabulary.word, "ambitious");
  } finally {
    restore();
  }
});

test("adding the same word twice does not create a duplicate notebook entry", async () => {
  ensureSchema();
  const restore = fakeAiVocab();
  const passwordHash = await hashPassword("studentpass123");
  const [student] = await db
    .insert(users)
    .values({ email: "vocstu2@x.com", passwordHash, role: "student", displayName: "Stu2" })
    .returning();

  try {
    const app = buildApp();
    const token = signAccessToken({ sub: student.id, role: "student" });

    await app.inject({
      method: "POST",
      url: "/vocabulary/notebook",
      headers: { authorization: `Bearer ${token}` },
      payload: { word: "diligent" },
    });
    await app.inject({
      method: "POST",
      url: "/vocabulary/notebook",
      headers: { authorization: `Bearer ${token}` },
      payload: { word: "diligent" },
    });

    const list = await app.inject({
      method: "GET",
      url: "/vocabulary/notebook",
      headers: { authorization: `Bearer ${token}` },
    });
    assert.equal(list.json().length, 1);
  } finally {
    restore();
  }
});

test("a student cannot delete another student's notebook entry", async () => {
  ensureSchema();
  const restore = fakeAiVocab();
  const passwordHash = await hashPassword("studentpass123");
  const [owner] = await db
    .insert(users)
    .values({ email: "owner@x.com", passwordHash, role: "student", displayName: "Owner" })
    .returning();
  const [intruder] = await db
    .insert(users)
    .values({ email: "intruder2@x.com", passwordHash, role: "student", displayName: "Intruder" })
    .returning();

  try {
    const app = buildApp();
    const ownerToken = signAccessToken({ sub: owner.id, role: "student" });
    const intruderToken = signAccessToken({ sub: intruder.id, role: "student" });

    const added = await app.inject({
      method: "POST",
      url: "/vocabulary/notebook",
      headers: { authorization: `Bearer ${ownerToken}` },
      payload: { word: "resilient" },
    });
    const entryId = added.json().id;

    const deleteAttempt = await app.inject({
      method: "DELETE",
      url: `/vocabulary/notebook/${entryId}`,
      headers: { authorization: `Bearer ${intruderToken}` },
    });
    assert.equal(deleteAttempt.statusCode, 404);

    const ownDelete = await app.inject({
      method: "DELETE",
      url: `/vocabulary/notebook/${entryId}`,
      headers: { authorization: `Bearer ${ownerToken}` },
    });
    assert.equal(ownDelete.statusCode, 200);
  } finally {
    restore();
  }
});

// --- Stage 25: spaced-repetition review flow ---

test("a newly-saved word is immediately due for review and grading schedules it forward", async () => {
  ensureSchema();
  const restore = fakeAiVocab();
  const passwordHash = await hashPassword("studentpass123");
  const [student] = await db
    .insert(users)
    .values({ email: "srsstu@x.com", passwordHash, role: "student", displayName: "Srs" })
    .returning();

  try {
    const app = buildApp();
    const token = signAccessToken({ sub: student.id, role: "student" });

    const added = await app.inject({
      method: "POST",
      url: "/vocabulary/notebook",
      headers: { authorization: `Bearer ${token}` },
      payload: { word: "meticulous" },
    });
    const entryId = added.json().id;
    // The POST response carries the SRS schedule, and a fresh card is due now.
    assert.equal(added.json().srs.due, true);
    assert.equal(added.json().srs.repetitions, 0);

    // It shows up in the due queue and the stats.
    const queue1 = await app.inject({
      method: "GET",
      url: "/vocabulary/review/queue",
      headers: { authorization: `Bearer ${token}` },
    });
    assert.equal(queue1.json().cards.length, 1);

    const stats1 = await app.inject({
      method: "GET",
      url: "/vocabulary/review/stats",
      headers: { authorization: `Bearer ${token}` },
    });
    assert.deepEqual(stats1.json(), { total: 1, due: 1, learning: 1, mature: 0 });

    // Grade it "good" -> it moves out of the due queue (next review in the future).
    const graded = await app.inject({
      method: "POST",
      url: `/vocabulary/review/${entryId}`,
      headers: { authorization: `Bearer ${token}` },
      payload: { rating: "good" },
    });
    assert.equal(graded.statusCode, 200);
    assert.equal(graded.json().srs.repetitions, 1);
    assert.equal(graded.json().srs.due, false);
    assert.equal(graded.json().srs.intervalDays, 1);

    const queue2 = await app.inject({
      method: "GET",
      url: "/vocabulary/review/queue",
      headers: { authorization: `Bearer ${token}` },
    });
    assert.equal(queue2.json().cards.length, 0);
  } finally {
    restore();
  }
});

test("review rejects an unknown rating and refuses another student's card", async () => {
  ensureSchema();
  const restore = fakeAiVocab();
  const passwordHash = await hashPassword("studentpass123");
  const [owner] = await db
    .insert(users)
    .values({ email: "srsowner@x.com", passwordHash, role: "student", displayName: "O" })
    .returning();
  const [intruder] = await db
    .insert(users)
    .values({ email: "srsintruder@x.com", passwordHash, role: "student", displayName: "I" })
    .returning();

  try {
    const app = buildApp();
    const ownerToken = signAccessToken({ sub: owner.id, role: "student" });
    const intruderToken = signAccessToken({ sub: intruder.id, role: "student" });

    const added = await app.inject({
      method: "POST",
      url: "/vocabulary/notebook",
      headers: { authorization: `Bearer ${ownerToken}` },
      payload: { word: "tenacious" },
    });
    const entryId = added.json().id;

    const badRating = await app.inject({
      method: "POST",
      url: `/vocabulary/review/${entryId}`,
      headers: { authorization: `Bearer ${ownerToken}` },
      payload: { rating: "sometimes" },
    });
    assert.equal(badRating.statusCode, 400);

    const crossStudent = await app.inject({
      method: "POST",
      url: `/vocabulary/review/${entryId}`,
      headers: { authorization: `Bearer ${intruderToken}` },
      payload: { rating: "good" },
    });
    assert.equal(crossStudent.statusCode, 404);
  } finally {
    restore();
  }
});

// --- Stage 33: curated wordlist + SRS seeding ---

test("the curated wordlist is browsable per level and marks saved words", async () => {
  ensureSchema();
  const restore = fakeAiVocab();
  const passwordHash = await hashPassword("studentpass123");
  const [student] = await db
    .insert(users)
    .values({ email: "wl1@x.com", passwordHash, role: "student", displayName: "W" })
    .returning();

  try {
    const app = buildApp();
    const token = signAccessToken({ sub: student.id, role: "student" });

    const res = await app.inject({
      method: "GET",
      url: "/vocabulary/wordlist?level=A1",
      headers: { authorization: `Bearer ${token}` },
    });
    assert.equal(res.statusCode, 200);
    const body = res.json();
    assert.equal(body.level, "A1");
    assert.ok(body.entries.length >= 15);
    assert.ok(body.entries.every((e: { cefrLevel: string }) => e.cefrLevel === "A1"));
    assert.ok(body.entries.every((e: { saved: boolean }) => e.saved === false));
    assert.equal(body.totalSaved, 0);
  } finally {
    restore();
  }
});

test("seeding fills the SRS notebook with a level's starter pack", async () => {
  ensureSchema();
  const restore = fakeAiVocab();
  const passwordHash = await hashPassword("studentpass123");
  const [student] = await db
    .insert(users)
    .values({ email: "wl2@x.com", passwordHash, role: "student", displayName: "W" })
    .returning();

  try {
    const app = buildApp();
    const token = signAccessToken({ sub: student.id, role: "student" });

    const seeded = await app.inject({
      method: "POST",
      url: "/vocabulary/notebook/seed",
      headers: { authorization: `Bearer ${token}` },
      payload: { level: "A2", count: 5 },
    });
    assert.equal(seeded.statusCode, 200);
    assert.equal(seeded.json().added, 5);
    assert.equal(seeded.json().level, "A2");

    // Seeded words become due SRS cards immediately — the whole point.
    const stats = await app.inject({
      method: "GET",
      url: "/vocabulary/review/stats",
      headers: { authorization: `Bearer ${token}` },
    });
    assert.equal(stats.json().total, 5);
    assert.equal(stats.json().due, 5);

    // Seeding again skips what's already saved rather than duplicating.
    const again = await app.inject({
      method: "POST",
      url: "/vocabulary/notebook/seed",
      headers: { authorization: `Bearer ${token}` },
      payload: { level: "A2", count: 5 },
    });
    assert.equal(again.json().skipped, 5);
    const after = await app.inject({
      method: "GET",
      url: "/vocabulary/review/stats",
      headers: { authorization: `Bearer ${token}` },
    });
    assert.equal(after.json().total, 10, "second seed adds 5 different words");
  } finally {
    restore();
  }
});

test("seeding rejects an invalid level", async () => {
  ensureSchema();
  const restore = fakeAiVocab();
  const passwordHash = await hashPassword("studentpass123");
  const [student] = await db
    .insert(users)
    .values({ email: "wl3@x.com", passwordHash, role: "student", displayName: "W" })
    .returning();
  try {
    const app = buildApp();
    const token = signAccessToken({ sub: student.id, role: "student" });
    const res = await app.inject({
      method: "POST",
      url: "/vocabulary/notebook/seed",
      headers: { authorization: `Bearer ${token}` },
      payload: { level: "Z9" },
    });
    assert.equal(res.statusCode, 400);
  } finally {
    restore();
  }
});

test("a curated word is defined without calling the LLM", async () => {
  ensureSchema();
  const restore = fakeAiVocab();
  const passwordHash = await hashPassword("studentpass123");
  const [student] = await db
    .insert(users)
    .values({ email: "wl4@x.com", passwordHash, role: "student", displayName: "W" })
    .returning();

  try {
    const app = buildApp();
    const token = signAccessToken({ sub: student.id, role: "student" });
    const res = await app.inject({
      method: "POST",
      url: "/vocabulary/lookup",
      headers: { authorization: `Bearer ${token}` },
      payload: { word: "ubiquitous" },
    });
    assert.equal(res.statusCode, 200);
    // The fake LLM would have returned "definition of ubiquitous"; the curated
    // entry must win, so the authored definition is what comes back.
    assert.match(res.json().definition, /everywhere/i);
    assert.equal(res.json().cefrLevel, "C2");
  } finally {
    restore();
  }
});
