import "../testSetup";
import { test } from "node:test";
import assert from "node:assert/strict";
import { eq } from "drizzle-orm";
import Fastify from "fastify";
import { ensureSchema, db } from "../db/client";
import { pronunciationResults, users } from "../db/schema";
import { hashPassword } from "../auth/password";
import { signAccessToken } from "../auth/tokens";
import { aiSpeechClient } from "../speech/aiSpeechClient";
import { registerSpeechRoutes } from "./speech";

function buildApp() {
  const app = Fastify();
  registerSpeechRoutes(app);
  return app;
}

function fakeSpeechClient(transcript: string) {
  const original = { transcribe: aiSpeechClient.transcribe, synthesize: aiSpeechClient.synthesize };
  const calls: { synthesizeVoice: string | undefined } = { synthesizeVoice: undefined };
  aiSpeechClient.transcribe = async () => transcript;
  aiSpeechClient.synthesize = async (_text: string, voice?: "male" | "female") => {
    calls.synthesizeVoice = voice;
    return "ZmFrZS1hdWRpby1ieXRlcw==";
  };
  const restore = () => {
    aiSpeechClient.transcribe = original.transcribe;
    aiSpeechClient.synthesize = original.synthesize;
  };
  return Object.assign(restore, { calls });
}

test("transcribes audio via the AI speech client", async () => {
  ensureSchema();
  const restore = fakeSpeechClient("hello world");
  const passwordHash = await hashPassword("studentpass123");
  const [student] = await db
    .insert(users)
    .values({ email: "speechstu@x.com", passwordHash, role: "student", displayName: "Stu" })
    .returning();

  try {
    const app = buildApp();
    const token = signAccessToken({ sub: student.id, role: "student" });

    const res = await app.inject({
      method: "POST",
      url: "/speech/transcribe",
      headers: { authorization: `Bearer ${token}` },
      payload: { audioBase64: "ZmFrZQ==" },
    });
    assert.equal(res.statusCode, 200);
    assert.equal(res.json().transcript, "hello world");
  } finally {
    restore();
  }
});

test("synthesizes speech via the AI speech client", async () => {
  ensureSchema();
  const restore = fakeSpeechClient("unused");
  const passwordHash = await hashPassword("studentpass123");
  const [student] = await db
    .insert(users)
    .values({ email: "speechstu2@x.com", passwordHash, role: "student", displayName: "Stu2" })
    .returning();

  try {
    const app = buildApp();
    const token = signAccessToken({ sub: student.id, role: "student" });

    const res = await app.inject({
      method: "POST",
      url: "/speech/synthesize",
      headers: { authorization: `Bearer ${token}` },
      payload: { text: "hello" },
    });
    assert.equal(res.statusCode, 200);
    assert.equal(res.json().audioBase64, "ZmFrZS1hdWRpby1ieXRlcw==");
    // No voice specified -> defaults to female (the original single voice).
    assert.equal(restore.calls.synthesizeVoice, "female");
  } finally {
    restore();
  }
});

test("forwards the selected voice (male) to the AI speech client", async () => {
  ensureSchema();
  const restore = fakeSpeechClient("unused");
  const passwordHash = await hashPassword("studentpass123");
  const [student] = await db
    .insert(users)
    .values({ email: "speechvoice@x.com", passwordHash, role: "student", displayName: "V" })
    .returning();

  try {
    const app = buildApp();
    const token = signAccessToken({ sub: student.id, role: "student" });

    const res = await app.inject({
      method: "POST",
      url: "/speech/synthesize",
      headers: { authorization: `Bearer ${token}` },
      payload: { text: "hello", voice: "male" },
    });
    assert.equal(res.statusCode, 200);
    assert.equal(restore.calls.synthesizeVoice, "male");
  } finally {
    restore();
  }
});

test("an unknown voice value falls back to female", async () => {
  ensureSchema();
  const restore = fakeSpeechClient("unused");
  const passwordHash = await hashPassword("studentpass123");
  const [student] = await db
    .insert(users)
    .values({ email: "speechvoice2@x.com", passwordHash, role: "student", displayName: "V2" })
    .returning();

  try {
    const app = buildApp();
    const token = signAccessToken({ sub: student.id, role: "student" });

    const res = await app.inject({
      method: "POST",
      url: "/speech/synthesize",
      headers: { authorization: `Bearer ${token}` },
      payload: { text: "hello", voice: "banana" },
    });
    assert.equal(res.statusCode, 200);
    assert.equal(restore.calls.synthesizeVoice, "female");
  } finally {
    restore();
  }
});

test("scores a pronunciation attempt and persists the result", async () => {
  ensureSchema();
  const restore = fakeSpeechClient("the quick brown fox");
  const passwordHash = await hashPassword("studentpass123");
  const [student] = await db
    .insert(users)
    .values({ email: "speechstu3@x.com", passwordHash, role: "student", displayName: "Stu3" })
    .returning();

  try {
    const app = buildApp();
    const token = signAccessToken({ sub: student.id, role: "student" });

    const res = await app.inject({
      method: "POST",
      url: "/pronunciation/practice",
      headers: { authorization: `Bearer ${token}` },
      payload: { targetPhrase: "The quick brown fox", audioBase64: "ZmFrZQ==" },
    });
    assert.equal(res.statusCode, 200);
    const body = res.json();
    assert.equal(body.accuracyScore, 100);
    assert.equal(body.transcript, "the quick brown fox");

    const rows = await db
      .select()
      .from(pronunciationResults)
      .where(eq(pronunciationResults.studentId, student.id));
    assert.equal(rows.length, 1);
    assert.equal(rows[0].accuracyScore, 100);
    assert.equal(rows[0].targetPhrase, "The quick brown fox");
  } finally {
    restore();
  }
});

test("requires authentication for all speech routes", async () => {
  ensureSchema();
  const app = buildApp();

  const transcribeRes = await app.inject({
    method: "POST",
    url: "/speech/transcribe",
    payload: { audioBase64: "ZmFrZQ==" },
  });
  assert.equal(transcribeRes.statusCode, 401);

  const practiceRes = await app.inject({
    method: "POST",
    url: "/pronunciation/practice",
    payload: { targetPhrase: "hi", audioBase64: "ZmFrZQ==" },
  });
  assert.equal(practiceRes.statusCode, 401);
});

// --- Stage 30: Mandarin tone scoring ---

function fakeToneClient(transcript: string, tone: unknown, opts: { fail?: boolean } = {}) {
  const original = {
    transcribe: aiSpeechClient.transcribe,
    scoreTone: aiSpeechClient.scoreTone,
  };
  const calls = { toneCalls: 0 };
  aiSpeechClient.transcribe = async () => transcript;
  aiSpeechClient.scoreTone = async () => {
    calls.toneCalls++;
    if (opts.fail) throw new Error("ai service down");
    return tone as Awaited<ReturnType<typeof aiSpeechClient.scoreTone>>;
  };
  const restore = () => {
    aiSpeechClient.transcribe = original.transcribe;
    aiSpeechClient.scoreTone = original.scoreTone;
  };
  return Object.assign(restore, { calls });
}

async function makeStudent(email: string, targetLanguage: "english" | "chinese") {
  const passwordHash = await hashPassword("studentpass123");
  const [student] = await db
    .insert(users)
    .values({ email, passwordHash, role: "student", displayName: "Stu", targetLanguage })
    .returning();
  return { student, token: signAccessToken({ sub: student.id, role: "student" }) };
}

test("English pronunciation practice does not request a tone score", async () => {
  ensureSchema();
  const restore = fakeToneClient("hello world", null);
  try {
    const { token } = await makeStudent("toneen@x.com", "english");
    const app = buildApp();
    const res = await app.inject({
      method: "POST",
      url: "/pronunciation/practice",
      headers: { authorization: `Bearer ${token}` },
      payload: { targetPhrase: "hello world", audioBase64: "AAAA" },
    });
    assert.equal(res.statusCode, 200);
    assert.equal(res.json().tone, undefined);
    assert.equal(restore.calls.toneCalls, 0, "tone scoring is Mandarin-only");
  } finally {
    restore();
  }
});

test("Chinese pronunciation practice returns and stores a tone score", async () => {
  ensureSchema();
  const restore = fakeToneClient("我买书", {
    toneScore: 78,
    confident: true,
    meanSemitoneDistance: 2.1,
    feedback: "Mostly good tones.",
  });
  try {
    const { student, token } = await makeStudent("tonezh@x.com", "chinese");
    const app = buildApp();
    const res = await app.inject({
      method: "POST",
      url: "/pronunciation/practice",
      headers: { authorization: `Bearer ${token}` },
      payload: { targetPhrase: "我买书", audioBase64: "AAAA" },
    });
    assert.equal(res.statusCode, 200);
    assert.equal(res.json().tone.toneScore, 78);
    assert.equal(restore.calls.toneCalls, 1);

    const [row] = await db
      .select()
      .from(pronunciationResults)
      .where(eq(pronunciationResults.studentId, student.id));
    assert.equal(row.toneScore, 78);
  } finally {
    restore();
  }
});

test("a low-confidence tone result is not stored as a real score", async () => {
  ensureSchema();
  const restore = fakeToneClient("我买书", {
    toneScore: 0,
    confident: false,
    meanSemitoneDistance: 0,
    feedback: "We couldn't hear enough voiced speech.",
  });
  try {
    const { student, token } = await makeStudent("tonelow@x.com", "chinese");
    const app = buildApp();
    await app.inject({
      method: "POST",
      url: "/pronunciation/practice",
      headers: { authorization: `Bearer ${token}` },
      payload: { targetPhrase: "我买书", audioBase64: "AAAA" },
    });
    const [row] = await db
      .select()
      .from(pronunciationResults)
      .where(eq(pronunciationResults.studentId, student.id));
    // A silent recording is a microphone problem, not a 0% tone attempt.
    assert.equal(row.toneScore, null);
  } finally {
    restore();
  }
});

test("a tone-scoring failure does not fail the whole attempt", async () => {
  ensureSchema();
  const restore = fakeToneClient("我买书", null, { fail: true });
  try {
    const { token } = await makeStudent("tonefail@x.com", "chinese");
    const app = buildApp();
    const res = await app.inject({
      method: "POST",
      url: "/pronunciation/practice",
      headers: { authorization: `Bearer ${token}` },
      payload: { targetPhrase: "我买书", audioBase64: "AAAA" },
    });
    assert.equal(res.statusCode, 200, "the transcript-based score must still come back");
    assert.equal(res.json().tone, undefined);
    assert.ok(typeof res.json().accuracyScore === "number");
  } finally {
    restore();
  }
});
