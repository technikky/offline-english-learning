import { test } from "node:test";
import assert from "node:assert/strict";
import { scorePronunciation } from "./scoring";

test("scores an exact match at 100", () => {
  const { accuracyScore, feedback } = scorePronunciation(
    "The quick brown fox",
    "The quick brown fox",
  );
  assert.equal(accuracyScore, 100);
  assert.match(feedback, /Excellent/);
});

test("is case- and punctuation-insensitive", () => {
  const { accuracyScore } = scorePronunciation(
    "The quick brown fox",
    "the quick brown fox.",
  );
  assert.equal(accuracyScore, 100);
});

test("scores a completely different phrase low", () => {
  const { accuracyScore, feedback } = scorePronunciation(
    "The quick brown fox jumps over the lazy dog",
    "She sells seashells by the seashore",
  );
  assert.ok(accuracyScore < 50, `expected a low score, got ${accuracyScore}`);
  assert.match(feedback, /didn't match/);
});

test("scores a partial match in the middle range", () => {
  const { accuracyScore } = scorePronunciation(
    "I would like a cup of coffee please",
    "I would like a cup of tea please",
  );
  assert.ok(
    accuracyScore > 50 && accuracyScore < 100,
    `expected a partial score, got ${accuracyScore}`,
  );
});

test("handles an empty target phrase without throwing", () => {
  const { accuracyScore, feedback } = scorePronunciation("", "hello");
  assert.equal(accuracyScore, 0);
  assert.match(feedback, /No target phrase/);
});
