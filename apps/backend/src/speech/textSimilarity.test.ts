import "../testSetup";
import { test } from "node:test";
import assert from "node:assert/strict";
import { scoreTextSimilarity } from "./textSimilarity";

test("identical text (ignoring case and punctuation) scores 100", () => {
  assert.equal(scoreTextSimilarity("The quick brown fox.", "the quick brown fox"), 100);
});

test("a missing word lowers the score below 100 but above 0", () => {
  const score = scoreTextSimilarity("I wake up at seven", "I wake at seven");
  assert.ok(score > 0 && score < 100);
});

test("completely different text scores low", () => {
  assert.ok(scoreTextSimilarity("hello world", "completely unrelated phrase here") < 50);
});

test("an empty target scores 0", () => {
  assert.equal(scoreTextSimilarity("", "anything"), 0);
});
