import { ALL_SCENARIOS, type Scenario } from "@englishclass/types";

// Single source of truth for valid scenarios, shared by the conversation and
// assignment routes (previously duplicated as two separate arrays -- Stage 13).
const VALID_SCENARIO_SET = new Set<string>(ALL_SCENARIOS);

export function isValidScenario(value: string): value is Scenario {
  return VALID_SCENARIO_SET.has(value);
}
