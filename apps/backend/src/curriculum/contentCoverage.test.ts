import { test } from "node:test";
import assert from "node:assert/strict";
import type { CefrLevel } from "@englishclass/types";
import { COURSES, ENGLISH_COURSE } from "./course";
import { listGrammarTopics } from "../grammar/curriculum";
import { listReadingPassages } from "../reading/passages";
import { listListeningClips } from "../listening/clips";
import { listWritingPrompts } from "../writing/prompts";

// Stage 32: content-depth guarantees. Thin content is what caps how far a
// learner can actually get, so these lock in the coverage rather than leaving
// it to drift as content is edited.

const ENGLISH_LEVELS: CefrLevel[] = ["A1", "A2", "B1", "B2", "C1", "C2"];
const LESSON_TYPES = ["grammar", "reading", "listening", "writing", "conversation", "quiz"];

function levelsOf(items: { cefrLevel: CefrLevel }[]): Set<CefrLevel> {
  return new Set(items.map((i) => i.cefrLevel));
}

test("English has content at every CEFR level in every content module", () => {
  const modules = {
    grammar: listGrammarTopics("english"),
    reading: listReadingPassages("english"),
    listening: listListeningClips("english"),
    writing: listWritingPrompts("english"),
  };
  for (const [name, items] of Object.entries(modules)) {
    const levels = levelsOf(items);
    for (const level of ENGLISH_LEVELS) {
      assert.ok(levels.has(level), `English ${name} has nothing at ${level}`);
    }
  }
});

test("the English path runs all the way to C2", () => {
  const levels = ENGLISH_COURSE.units.map((u) => u.level);
  assert.deepEqual(levels, ENGLISH_LEVELS, "one unit per CEFR level, A1 through C2");
});

test("every unit of every course covers all six lesson types", () => {
  for (const [language, course] of Object.entries(COURSES)) {
    for (const unit of course.units) {
      const types = new Set(unit.lessons.map((l) => l.type));
      for (const expected of LESSON_TYPES) {
        assert.ok(
          types.has(expected as never),
          `${language}/${unit.id} is missing a ${expected} lesson`,
        );
      }
    }
  }
});

test("no CEFR level is a dead end: A1-B2 have more than one reading passage", () => {
  // A learner shouldn't exhaust a level's reading in a single sitting.
  const passages = listReadingPassages("english");
  for (const level of ["A1", "A2", "B1", "B2", "C1"] as CefrLevel[]) {
    const count = passages.filter((p) => p.cefrLevel === level).length;
    assert.ok(count >= 2, `only ${count} English reading passage(s) at ${level}`);
  }
});

test("content ids stay unique within each English module", () => {
  const modules = {
    grammar: listGrammarTopics("english").map((t) => t.id),
    reading: listReadingPassages("english").map((t) => t.id),
    listening: listListeningClips("english").map((t) => t.id),
    writing: listWritingPrompts("english").map((t) => t.id),
  };
  for (const [name, ids] of Object.entries(modules)) {
    assert.equal(new Set(ids).size, ids.length, `duplicate id in English ${name}`);
  }
});
