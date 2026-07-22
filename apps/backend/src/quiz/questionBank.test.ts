import { test } from "node:test";
import assert from "node:assert/strict";
import type { CefrLevel, TargetLanguage } from "@englishclass/types";
import { QUESTION_BANK, QUESTION_BANK_SIZE, selectQuestions } from "./questionBank";
import { listQuizCategories } from "./aiQuizClient";

const LEVELS: CefrLevel[] = ["A1", "A2", "B1", "B2", "C1", "C2"];
const LANGUAGES: TargetLanguage[] = ["english", "chinese"];
const QUIZ_SIZE = 5;

// The whole point of curating questions is that they are well-formed, which the
// AI could not guarantee. These assert exactly that.

test("every question is internally consistent", () => {
  for (const q of QUESTION_BANK) {
    assert.ok(q.question.length > 5, `${q.id}: question too short`);
    assert.ok(q.explanation.length > 5, `${q.id}: no real explanation`);
    // The failure mode that made AI quizzes unusable: a stem whose correct
    // answer is not among the options.
    assert.ok(
      q.options.includes(q.correctAnswer),
      `${q.id}: correctAnswer is not one of the options`,
    );
    assert.equal(new Set(q.options).size, q.options.length, `${q.id}: duplicate options`);
    if (q.type === "true_false") {
      assert.deepEqual(q.options, ["True", "False"], `${q.id}: true_false options must be True/False`);
    } else {
      assert.equal(q.options.length, 4, `${q.id}: multiple_choice needs exactly 4 options`);
    }
  }
});

test("question ids are unique", () => {
  const ids = QUESTION_BANK.map((q) => q.id);
  assert.equal(new Set(ids).size, ids.length, "duplicate question id");
});

test("every question belongs to a real category for its language", () => {
  for (const q of QUESTION_BANK) {
    assert.ok(
      listQuizCategories(q.language).includes(q.category),
      `${q.id}: ${q.category} is not a valid ${q.language} category`,
    );
  }
});

test("every bucket can fill a whole quiz from curated content alone", () => {
  // This is the guarantee that keeps the AI out of the happy path entirely.
  for (const language of LANGUAGES) {
    for (const category of listQuizCategories(language)) {
      for (const level of LEVELS) {
        const picked = selectQuestions(language, category, level, QUIZ_SIZE);
        assert.equal(
          picked.length,
          QUIZ_SIZE,
          `${language}/${category}/${level} only yields ${picked.length} curated questions`,
        );
      }
    }
  }
});

test("selection never mixes languages or categories", () => {
  const picked = selectQuestions("chinese", "characters", "B1", QUIZ_SIZE);
  assert.ok(picked.every((q) => q.language === "chinese"));
  assert.ok(picked.every((q) => q.category === "characters"));
});

test("selection prefers the exact level, then the nearest ones", () => {
  // Deterministic RNG so the ordering is inspectable.
  const picked = selectQuestions("english", "grammar", "B1", QUIZ_SIZE, () => 0);
  const exact = picked.filter((q) => q.cefrLevel === "B1").length;
  assert.equal(exact, 3, "all three exact-level questions should be taken first");
  // The remainder must come from immediately adjacent levels, never further.
  const order = LEVELS.indexOf("B1");
  for (const q of picked) {
    assert.ok(
      Math.abs(LEVELS.indexOf(q.cefrLevel) - order) <= 1,
      `${q.id} at ${q.cefrLevel} is more than one level from B1`,
    );
  }
});

test("repeating a quiz does not always replay the same questions", () => {
  // Without variety a student re-taking a quiz just memorises five items.
  const seen = new Set<string>();
  for (let i = 0; i < 12; i++) {
    for (const q of selectQuestions("english", "vocabulary", "B1", QUIZ_SIZE)) {
      seen.add(q.id);
    }
  }
  assert.ok(seen.size > QUIZ_SIZE, `only ever saw ${seen.size} distinct questions`);
});

test("the bank covers both languages at every level", () => {
  for (const language of LANGUAGES) {
    for (const level of LEVELS) {
      const count = QUESTION_BANK.filter(
        (q) => q.language === language && q.cefrLevel === level,
      ).length;
      assert.ok(count > 0, `${language} has no questions at ${level}`);
    }
  }
  assert.ok(QUESTION_BANK_SIZE >= 100, `bank is thin: ${QUESTION_BANK_SIZE}`);
});
