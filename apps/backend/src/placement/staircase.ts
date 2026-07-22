import type { CefrLevel } from "@englishclass/types";

// Stage 26: adaptive placement-test staircase.
//
// A pure, dependency-free implementation of a simple "up/down staircase"
// adaptive test. The learner is served one block of questions per CEFR rung;
// passing a rung moves them up a level, failing moves them down. The test
// concludes as soon as the boundary between a passed and a failed rung is
// found (or a level is topped out / floored), so a placement usually takes
// only 2-4 blocks rather than testing every level.
//
// Kept free of DB/HTTP so it can be unit-tested in isolation; the route layer
// (routes/placement.ts) owns session persistence and item selection.

export const LEVELS: CefrLevel[] = ["A1", "A2", "B1", "B2", "C1", "C2"];
export const START_LEVEL: CefrLevel = "B1";
export const BLOCK_SIZE = 3;
export const PASS_THRESHOLD = 2; // correct answers (out of BLOCK_SIZE) needed to pass a rung

export interface RungResult {
  correct: number;
  total: number;
}

export interface PlacementState {
  currentLevel: CefrLevel;
  asked: Partial<Record<CefrLevel, RungResult>>;
  status: "in_progress" | "complete";
  resultLevel: CefrLevel | null;
}

export function startState(): PlacementState {
  return { currentLevel: START_LEVEL, asked: {}, status: "in_progress", resultLevel: null };
}

function passed(result: RungResult): boolean {
  return result.correct >= PASS_THRESHOLD;
}

// The placement result is the highest rung the learner passed; if they passed
// nothing (failed even the lowest rung reached), they're placed at A1.
function computeResult(asked: PlacementState["asked"]): CefrLevel {
  let bestIndex = -1;
  for (const level of LEVELS) {
    const result = asked[level];
    if (result && passed(result)) {
      bestIndex = Math.max(bestIndex, LEVELS.indexOf(level));
    }
  }
  return bestIndex >= 0 ? LEVELS[bestIndex] : "A1";
}

/**
 * Record the learner's score on the current rung and advance the staircase.
 * Never mutates the input state.
 *
 * @param state   the in-progress placement state
 * @param correct number of correct answers in the just-completed block
 * @param total   number of questions in the block (normally BLOCK_SIZE)
 */
export function recordBlock(state: PlacementState, correct: number, total: number): PlacementState {
  if (state.status === "complete") return state;

  const level = state.currentLevel;
  const asked: PlacementState["asked"] = { ...state.asked, [level]: { correct, total } };
  const didPass = correct >= PASS_THRESHOLD;
  const index = LEVELS.indexOf(level);
  const nextIndex = didPass ? index + 1 : index - 1;

  const toppedOut = didPass && index === LEVELS.length - 1;
  const floored = !didPass && index === 0;
  const outOfRange = nextIndex < 0 || nextIndex >= LEVELS.length;
  const nextLevel = outOfRange ? undefined : LEVELS[nextIndex];
  // We've found the boundary once we'd step onto a rung we already tested.
  const revisiting = nextLevel !== undefined && asked[nextLevel] !== undefined;

  if (toppedOut || floored || outOfRange || revisiting) {
    return {
      currentLevel: level,
      asked,
      status: "complete",
      resultLevel: computeResult(asked),
    };
  }

  return {
    currentLevel: nextLevel!,
    asked,
    status: "in_progress",
    resultLevel: null,
  };
}
