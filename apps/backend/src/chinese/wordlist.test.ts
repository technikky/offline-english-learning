import { test } from "node:test";
import assert from "node:assert/strict";
import type { CefrLevel } from "@englishclass/types";
import {
  CHINESE_WORDLIST_SIZE,
  getWordlistEntry,
  listWordlist,
  wordlistLevelOf,
} from "../vocabulary/wordlist";
import { isWorthRecommending } from "../vocabulary/recommendations";

const LEVELS: CefrLevel[] = ["A1", "A2", "B1", "B2", "C1", "C2"];
const HANZI = /[一-鿿]/;

test("the HSK wordlist covers every level", () => {
  for (const level of LEVELS) {
    assert.ok(listWordlist(level, "chinese").length >= 10, `too few Chinese words at ${level}`);
  }
  assert.equal(
    LEVELS.reduce((sum, l) => sum + listWordlist(l, "chinese").length, 0),
    CHINESE_WORDLIST_SIZE,
  );
});

test("every Chinese entry is hanzi, tagged chinese, and carries pinyin", () => {
  for (const entry of listWordlist(undefined, "chinese")) {
    assert.ok(HANZI.test(entry.word), `${entry.word} is not Chinese`);
    assert.equal(entry.language, "chinese", `${entry.word} is not tagged chinese`);
    // Pinyin is carried inline at the front of the definition.
    assert.ok(entry.definition.includes(" — "), `${entry.word} definition lacks a pinyin gloss`);
    assert.ok(entry.example.includes(entry.word), `${entry.word}: example omits the word`);
    assert.ok(entry.example.includes("("), `${entry.word}: example lacks pinyin`);
  }
});

test("the two language lists are kept separate", () => {
  const english = listWordlist(undefined, "english");
  const chinese = listWordlist(undefined, "chinese");
  assert.ok(english.every((e) => !HANZI.test(e.word)), "a Chinese word leaked into the English list");
  assert.ok(chinese.every((e) => HANZI.test(e.word)), "an English word leaked into the Chinese list");
});

test("lookup is language-agnostic because hanzi and latin cannot collide", () => {
  assert.equal(wordlistLevelOf("你好"), "A1");
  assert.equal(wordlistLevelOf("ubiquitous"), "C2");
  assert.equal(getWordlistEntry("努力")?.language, "chinese");
  assert.equal(getWordlistEntry("family")?.language, undefined);
});

// --- the extraction bug this stage fixed ---

test("Chinese words below the student's level are not recommended", () => {
  // 你好 is A1; a B1 learner knows it.
  assert.equal(isWorthRecommending("你好", "B1", "chinese"), false);
});

test("Chinese words at or above the student's level are recommended", () => {
  assert.equal(isWorthRecommending("趋势", "B2", "chinese"), true); // C1 word
  assert.equal(isWorthRecommending("努力", "B1", "chinese"), true); // B1 word
});

test("an unknown Chinese string is never recommended by length", () => {
  // The English length fallback must not apply to Chinese: a long run of
  // characters is not evidence that it is a word worth learning.
  assert.equal(isWorthRecommending("这个那个什么", "A1", "chinese"), false);
});

test("the English stoplist does not suppress Chinese words", () => {
  // COMMON_WORDS is latin-only; applying it to Chinese would be meaningless.
  assert.equal(isWorthRecommending("努力", "A1", "chinese"), true);
});
