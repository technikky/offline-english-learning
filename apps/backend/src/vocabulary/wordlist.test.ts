import { test } from "node:test";
import assert from "node:assert/strict";
import type { CefrLevel } from "@englishclass/types";
import {
  getWordlistEntry,
  listWordlist,
  wordlistLevelOf,
  WORDLIST_SIZE,
} from "./wordlist";
import { isWorthRecommending, rankCandidates } from "./recommendations";

const LEVELS: CefrLevel[] = ["A1", "A2", "B1", "B2", "C1", "C2"];

// --- the list itself ---

test("the wordlist covers every CEFR level", () => {
  for (const level of LEVELS) {
    assert.ok(listWordlist(level).length >= 15, `too few words at ${level}`);
  }
  assert.equal(
    LEVELS.reduce((sum, l) => sum + listWordlist(l).length, 0),
    WORDLIST_SIZE,
    "every entry must have a valid CEFR level",
  );
});

test("words are unique and stored lowercase", () => {
  const words = listWordlist().map((e) => e.word);
  assert.equal(new Set(words).size, words.length, "duplicate word in the list");
  for (const word of words) {
    assert.equal(word, word.toLowerCase(), `${word} should be lowercase`);
  }
});

test("every entry has a usable definition and example", () => {
  for (const entry of listWordlist()) {
    assert.ok(entry.definition.length > 10, `${entry.word} has a thin definition`);
    assert.ok(entry.example.length > 5, `${entry.word} has no real example`);
    // The example should actually demonstrate the word (allowing inflections).
    const stem = entry.word.slice(0, Math.max(4, entry.word.length - 2));
    assert.ok(
      entry.example.toLowerCase().includes(stem),
      `${entry.word}: example does not contain the word`,
    );
  }
});

test("lookup is case-insensitive and reports the level", () => {
  assert.equal(getWordlistEntry("Family")?.cefrLevel, "A1");
  assert.equal(wordlistLevelOf("  UBIQUITOUS  "), "C2");
  assert.equal(wordlistLevelOf("notarealword"), undefined);
});

// --- recommendation grading (the point of having the list) ---

test("a word below the student's level is not recommended", () => {
  // "family" is A1; a B2 learner already knows it.
  assert.equal(isWorthRecommending("family", "B2"), false);
});

test("a word at or above the student's level is recommended", () => {
  assert.equal(isWorthRecommending("inevitable", "B1"), true); // B2 word, B1 learner
  assert.equal(isWorthRecommending("ubiquitous", "C2"), true); // C2 word, C2 learner
});

test("the old length heuristic still catches words outside the list", () => {
  // Not graded, but long enough to be worth surfacing.
  assert.equal(wordlistLevelOf("kaleidoscope"), undefined);
  assert.equal(isWorthRecommending("kaleidoscope", "B1"), true);
  // Short ungraded words are still ignored.
  assert.equal(isWorthRecommending("blort", "B1"), false);
});

test("stopwords are never recommended, whatever the level", () => {
  assert.equal(isWorthRecommending("because", "A1"), false);
});

test("graded words rank ahead of ungraded guesses, nearest level first", () => {
  const ranked = rankCandidates(["kaleidoscope", "ubiquitous", "inevitable"], "B1");
  // inevitable (B2) is closest to B1, then ubiquitous (C2), then the ungraded word.
  assert.deepEqual(ranked, ["inevitable", "ubiquitous", "kaleidoscope"]);
});

test("a long easy word no longer outranks a genuinely useful one", () => {
  // The old heuristic treated these as equally worth learning, purely by length:
  // "restaurant" is long but ordinary, "significant" is genuinely B2 vocabulary.
  assert.equal(isWorthRecommending("restaurant", "B2"), true); // ungraded, length fallback
  const ranked = rankCandidates(["restaurant", "significant"], "B2");
  assert.equal(ranked[0], "significant", "the CEFR-graded word should come first");
});
