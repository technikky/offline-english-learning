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
