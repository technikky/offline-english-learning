import { test } from "node:test";
import assert from "node:assert/strict";
import { buildCurriculum, type CompletionSets } from "./progress";
import { COURSE } from "./course";

function emptySets(): CompletionSets {
  return {
    grammar: new Set(),
    reading: new Set(),
    listening: new Set(),
    writing: new Set(),
    quiz: new Set(),
    conversation: new Set(),
  };
}

const TOTAL = COURSE.units.reduce((sum, u) => sum + u.lessons.length, 0);

test("with no progress, nothing is complete and totals match the course", () => {
  const c = buildCurriculum(emptySets(), null);
  assert.equal(c.completedLessons, 0);
  assert.equal(c.totalLessons, TOTAL);
  assert.equal(c.courseTitle, COURSE.title);
});

test("with no placement, the recommended unit is the first (A1)", () => {
  const c = buildCurriculum(emptySets(), null);
  assert.equal(c.recommendedUnitId, "unit-a1");
});

test("placement level seeds the recommended unit", () => {
  const c = buildCurriculum(emptySets(), "B1");
  assert.equal(c.recommendedUnitId, "unit-b1");
  assert.equal(c.placementLevel, "B1");
});

test("completing a unit's lessons marks it done and advances the recommendation", () => {
  const sets = emptySets();
  // Complete every lesson in unit-a1 by seeding the referenced ids.
  const a1 = COURSE.units.find((u) => u.id === "unit-a1")!;
  for (const lesson of a1.lessons) {
    sets[lesson.type].add(lesson.refId);
  }

  const c = buildCurriculum(sets, null);
  const unitA1 = c.units.find((u) => u.id === "unit-a1")!;
  assert.equal(unitA1.completedCount, unitA1.totalCount);
  // With A1 done and no placement, the next incomplete unit is recommended.
  assert.equal(c.recommendedUnitId, "unit-a2");
  assert.ok(c.completedLessons >= a1.lessons.length);
});

test("recommendation falls back sensibly when the placement-level unit is fully done", () => {
  const sets = emptySets();
  const b1 = COURSE.units.find((u) => u.id === "unit-b1")!;
  for (const lesson of b1.lessons) {
    sets[lesson.type].add(lesson.refId);
  }
  // Placed at B1 but B1 already complete -> recommend the next incomplete unit above it.
  const c = buildCurriculum(sets, "B1");
  assert.equal(c.recommendedUnitId, "unit-b2");
});
