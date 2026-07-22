import { test } from "node:test";
import assert from "node:assert/strict";
import {
  normalizeTokens,
  normalizeWords,
  scoreTextSimilarity,
} from "./textSimilarity";
import { scorePronunciation } from "./scoring";
import { splitIntoSentences } from "../listening/clips";

// Stage 29 regression guards. The English tokenizer strips every non-latin
// character, so before this stage Chinese scored 0 no matter what the student
// said, and a Chinese clip was one giant "sentence" in dictation mode.

test("the English tokenizer discards Chinese entirely (why a separate one is needed)", () => {
  assert.deepEqual(normalizeWords("我喝茶"), []);
});

test("Chinese is tokenized character by character", () => {
  assert.deepEqual(normalizeTokens("我喝茶。", "chinese"), ["我", "喝", "茶"]);
});

test("English tokenization is unchanged by the language parameter", () => {
  assert.deepEqual(normalizeTokens("The quick fox."), ["the", "quick", "fox"]);
  assert.deepEqual(normalizeTokens("The quick fox.", "english"), ["the", "quick", "fox"]);
});

test("an identical Chinese utterance scores 100, not 0", () => {
  assert.equal(scoreTextSimilarity("我喝茶。", "我喝茶", "chinese"), 100);
});

test("Chinese scoring degrades with real differences", () => {
  const near = scoreTextSimilarity("我今天很忙。", "我今天很累。", "chinese");
  const far = scoreTextSimilarity("我今天很忙。", "他们去北京了。", "chinese");
  assert.ok(near > far, "a one-character difference should score better than a different sentence");
  assert.ok(near < 100);
});

test("Chinese pronunciation scoring returns a real score instead of always zero", () => {
  const { accuracyScore } = scorePronunciation("你好吗", "你好吗", "chinese");
  assert.equal(accuracyScore, 100);
  // Without the language argument the same phrase would be untokenizable.
  assert.equal(scorePronunciation("你好吗", "你好吗").accuracyScore, 0);
});

test("Chinese transcripts split into sentences on full-width punctuation", () => {
  const sentences = splitIntoSentences("你好！我叫李明。我是学生。");
  assert.deepEqual(sentences, ["你好！", "我叫李明。", "我是学生。"]);
});

test("English sentence splitting is unchanged", () => {
  assert.deepEqual(splitIntoSentences("Hello there. How are you? Good!"), [
    "Hello there.",
    "How are you?",
    "Good!",
  ]);
});
