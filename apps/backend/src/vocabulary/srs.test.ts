import { test } from "node:test";
import assert from "node:assert/strict";
import {
  scheduleReview,
  INITIAL_SRS_STATE,
  MIN_EASE_FACTOR,
  type SrsState,
} from "./srs";

test("a brand-new card graduates to a 1-day interval on first 'good'", () => {
  const next = scheduleReview(INITIAL_SRS_STATE, "good");
  assert.equal(next.repetitions, 1);
  assert.equal(next.intervalDays, 1);
  assert.equal(next.lapses, 0);
  // "good" (q=4) leaves ease unchanged.
  assert.equal(next.easeFactor, 2.5);
});

test("second success moves the interval to the fixed 6 days", () => {
  let s: SrsState = INITIAL_SRS_STATE;
  s = scheduleReview(s, "good"); // -> interval 1, reps 1
  s = scheduleReview(s, "good"); // -> interval 6, reps 2
  assert.equal(s.repetitions, 2);
  assert.equal(s.intervalDays, 6);
});

test("third+ success multiplies the interval by the ease factor", () => {
  let s: SrsState = INITIAL_SRS_STATE;
  s = scheduleReview(s, "good"); // interval 1
  s = scheduleReview(s, "good"); // interval 6
  s = scheduleReview(s, "good"); // interval round(6 * 2.5) = 15
  assert.equal(s.repetitions, 3);
  assert.equal(s.intervalDays, 15);
});

test("'again' resets the streak, schedules relearning tomorrow, and counts a lapse", () => {
  let s: SrsState = INITIAL_SRS_STATE;
  s = scheduleReview(s, "good"); // reps 1
  s = scheduleReview(s, "good"); // reps 2, interval 6
  const beforeLapses = s.lapses;
  s = scheduleReview(s, "again");
  assert.equal(s.repetitions, 0);
  assert.equal(s.intervalDays, 1);
  assert.equal(s.lapses, beforeLapses + 1);
});

test("failing a never-learned card does not record a lapse", () => {
  const next = scheduleReview(INITIAL_SRS_STATE, "again");
  assert.equal(next.repetitions, 0);
  assert.equal(next.intervalDays, 1);
  assert.equal(next.lapses, 0);
});

test("'easy' raises the ease factor, 'hard' lowers it", () => {
  const easy = scheduleReview(INITIAL_SRS_STATE, "easy");
  assert.ok(easy.easeFactor > 2.5, "easy should increase ease");
  const hard = scheduleReview(INITIAL_SRS_STATE, "hard");
  assert.ok(hard.easeFactor < 2.5, "hard should decrease ease");
});

test("the ease factor is clamped at the SM-2 floor of 1.3", () => {
  // Repeatedly rating a mature card "hard" must never push ease below the floor.
  let s: SrsState = { repetitions: 5, easeFactor: 1.4, intervalDays: 100, lapses: 0 };
  for (let i = 0; i < 20; i++) {
    s = scheduleReview(s, "hard");
    assert.ok(s.easeFactor >= MIN_EASE_FACTOR);
  }
  assert.equal(s.easeFactor, MIN_EASE_FACTOR);
});

test("intervals stay monotonic and at least 1 day for a steady learner", () => {
  let s: SrsState = INITIAL_SRS_STATE;
  let prev = 0;
  for (let i = 0; i < 8; i++) {
    s = scheduleReview(s, "good");
    assert.ok(s.intervalDays >= 1);
    assert.ok(s.intervalDays >= prev, "interval should not shrink on success");
    prev = s.intervalDays;
  }
});
