import { test } from "node:test";
import assert from "node:assert/strict";
import { recordBlock, startState, PASS_THRESHOLD, BLOCK_SIZE } from "./staircase";

const PASS = PASS_THRESHOLD; // 2 correct
const FAIL = PASS_THRESHOLD - 1; // 1 correct
const N = BLOCK_SIZE;

test("a test starts at B1, in progress", () => {
  const s = startState();
  assert.equal(s.currentLevel, "B1");
  assert.equal(s.status, "in_progress");
  assert.equal(s.resultLevel, null);
});

test("passing B1 moves up to B2; failing B1 moves down to A2", () => {
  const up = recordBlock(startState(), PASS, N);
  assert.equal(up.currentLevel, "B2");
  assert.equal(up.status, "in_progress");

  const down = recordBlock(startState(), FAIL, N);
  assert.equal(down.currentLevel, "A2");
  assert.equal(down.status, "in_progress");
});

test("pass then fail finds the boundary and places at the last passed rung", () => {
  let s = startState(); // B1
  s = recordBlock(s, PASS, N); // pass B1 -> B2
  s = recordBlock(s, FAIL, N); // fail B2 -> would revisit B1 -> conclude
  assert.equal(s.status, "complete");
  assert.equal(s.resultLevel, "B1");
});

test("a strong learner tops out at C2", () => {
  let s = startState(); // B1
  s = recordBlock(s, N, N); // pass B1 -> B2
  s = recordBlock(s, N, N); // pass B2 -> C1
  s = recordBlock(s, N, N); // pass C1 -> C2
  s = recordBlock(s, N, N); // pass C2 -> topped out
  assert.equal(s.status, "complete");
  assert.equal(s.resultLevel, "C2");
});

test("failing every rung down to the floor places at A1", () => {
  let s = startState(); // B1
  s = recordBlock(s, FAIL, N); // fail B1 -> A2
  s = recordBlock(s, FAIL, N); // fail A2 -> A1
  s = recordBlock(s, FAIL, N); // fail A1 -> floored
  assert.equal(s.status, "complete");
  assert.equal(s.resultLevel, "A1");
});

test("fail B1 then pass A2 places at A2", () => {
  let s = startState(); // B1
  s = recordBlock(s, FAIL, N); // fail B1 -> A2
  s = recordBlock(s, PASS, N); // pass A2 -> would revisit B1 -> conclude
  assert.equal(s.status, "complete");
  assert.equal(s.resultLevel, "A2");
});

test("a completed test is immutable to further blocks", () => {
  let s = startState();
  s = recordBlock(s, PASS, N);
  s = recordBlock(s, FAIL, N); // complete at B1
  const again = recordBlock(s, N, N);
  assert.deepEqual(again, s);
});
