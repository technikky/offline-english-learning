import { test } from "node:test";
import assert from "node:assert/strict";
import {
  countChineseCharacters,
  countWords,
  countWritingUnits,
  getWritingPrompt,
  listWritingPrompts,
} from "./prompts";
import { listQuizCategories, isValidQuizCategory } from "../quiz/aiQuizClient";

// Stage 31 regression guards. Chinese is written without spaces, so the English
// word counter scores an entire essay as one "word" -- every Chinese submission
// would look far below its length target.

test("the English word counter collapses Chinese to a single word", () => {
  assert.equal(countWords("我家有三口人。我爸爸是老师。"), 1);
});

test("Chinese length is measured in characters, excluding punctuation", () => {
  assert.equal(countChineseCharacters("我家有三口人。"), 6);
  assert.equal(countWritingUnits("我家有三口人。", "chinese"), 6);
});

test("English counting is unchanged by the language parameter", () => {
  assert.equal(countWritingUnits("My family has three people"), 5);
  assert.equal(countWritingUnits("My family has three people", "english"), 5);
});

test("writing prompts are listed per language", () => {
  const english = listWritingPrompts().map((p) => p.id);
  const chinese = listWritingPrompts("chinese").map((p) => p.id);
  assert.ok(english.includes("write-my-family"));
  assert.ok(!english.some((id) => id.startsWith("zh-")));
  assert.ok(chinese.includes("zh-write-my-family"));
  assert.ok(!chinese.includes("write-my-family"));
});

test("prompt lookup is language-agnostic and carries the language tag", () => {
  assert.equal(getWritingPrompt("zh-write-my-family")?.language, "chinese");
  // English prompts predate the field and are implicitly English.
  assert.equal(getWritingPrompt("write-my-family")?.language, undefined);
});

test("Chinese writing targets are character counts, not word counts", () => {
  for (const prompt of listWritingPrompts("chinese")) {
    assert.ok(prompt.wordCountTarget >= 50, `${prompt.id} target looks too small`);
  }
});

// --- quiz categories ---

test("quiz categories differ per language", () => {
  const english = listQuizCategories("english");
  const chinese = listQuizCategories("chinese");
  assert.ok(english.includes("everyday_english"));
  assert.ok(!english.includes("everyday_chinese"));
  assert.ok(chinese.includes("everyday_chinese"));
  // "everyday_english" is meaningless for a Chinese learner.
  assert.ok(!chinese.includes("everyday_english"));
  // Chinese needs a category English has no equivalent of.
  assert.ok(chinese.includes("characters"));
});

test("category validation is scoped to the learner's language", () => {
  assert.ok(isValidQuizCategory("everyday_english", "english"));
  assert.ok(!isValidQuizCategory("everyday_english", "chinese"));
  assert.ok(isValidQuizCategory("characters", "chinese"));
  assert.ok(!isValidQuizCategory("characters", "english"));
  // Shared categories work in both.
  assert.ok(isValidQuizCategory("grammar", "english"));
  assert.ok(isValidQuizCategory("grammar", "chinese"));
});

test("an unknown language falls back to the English categories", () => {
  assert.deepEqual(listQuizCategories("klingon"), listQuizCategories("english"));
});
