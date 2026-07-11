import "../testSetup";
import { test } from "node:test";
import assert from "node:assert/strict";
import { ALL_SCENARIOS } from "@englishclass/types";
import { isValidScenario } from "./scenarios";

test("accepts every scenario in the shared ALL_SCENARIOS list", () => {
  for (const scenario of ALL_SCENARIOS) {
    assert.equal(isValidScenario(scenario), true, `expected ${scenario} to be valid`);
  }
});

test("rejects an unknown scenario string", () => {
  assert.equal(isValidScenario("not-a-real-scenario"), false);
});

test("rejects renamed legacy scenario names", () => {
  // Stage 13 renamed interview/business/daily -> job_interview/business_meeting/daily_life.
  assert.equal(isValidScenario("interview"), false);
  assert.equal(isValidScenario("business"), false);
  assert.equal(isValidScenario("daily"), false);
});
