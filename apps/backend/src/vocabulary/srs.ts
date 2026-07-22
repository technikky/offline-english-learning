import type { ReviewRating } from "@englishclass/types";

// Stage 25: Spaced-repetition scheduler.
//
// A pure, dependency-free implementation of the classic SM-2 algorithm
// (SuperMemo 2) -- the same math Anki and most flashcard apps are built on.
// It's deliberately kept free of any DB / date handling so it can be unit
// tested in isolation: it takes the card's current scheduling state plus the
// learner's self-rating and returns the *next* state. The route layer
// (routes/vocabulary.ts) is responsible for turning `intervalDays` into a
// concrete `dueAt` timestamp and persisting the result.
//
// Why SM-2 rather than a newer model (FSRS, etc.): it's tiny, well understood,
// has no trained parameters to ship, and runs entirely offline with a few
// lines of arithmetic -- a perfect fit for this project's constraints. It can
// be swapped later without touching callers, since they only depend on the
// SrsState shape.

export interface SrsState {
  /** Number of consecutive successful recalls (SM-2 "n"). Resets to 0 on a lapse. */
  repetitions: number;
  /** Ease factor (SM-2 "EF"); starts at 2.5, never drops below 1.3. */
  easeFactor: number;
  /** Current inter-repetition interval in days (SM-2 "I"). */
  intervalDays: number;
  /** Lifetime count of times this card was forgotten after being learned. */
  lapses: number;
}

/** The state a brand-new notebook card starts in: due immediately, never reviewed. */
export const INITIAL_SRS_STATE: SrsState = {
  repetitions: 0,
  easeFactor: 2.5,
  intervalDays: 0,
  lapses: 0,
};

export const MIN_EASE_FACTOR = 1.3;

// Map the four learner-facing buttons to SM-2 quality grades (0-5). "again" is
// a failure (< 3, triggers relearning); "hard" is a low pass that still erodes
// ease; "good"/"easy" are comfortable passes. Keeping the button vocabulary
// small (Anki-style) is friendlier for students than exposing a 0-5 scale.
const QUALITY_BY_RATING: Record<ReviewRating, number> = {
  again: 1,
  hard: 3,
  good: 4,
  easy: 5,
};

function roundToInt(value: number): number {
  return Math.max(1, Math.round(value));
}

/**
 * Advance a card's scheduling state by one review.
 *
 * @param state  the card's current SRS state
 * @param rating the learner's self-assessment of recall
 * @returns      the next SRS state (never mutates the input)
 */
export function scheduleReview(state: SrsState, rating: ReviewRating): SrsState {
  const quality = QUALITY_BY_RATING[rating];

  // Update the ease factor first (SM-2 uses the *new* EF for the interval).
  const nextEase = Math.max(
    MIN_EASE_FACTOR,
    state.easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02)),
  );

  // A failure ("again") sends the card back to relearning: streak resets, it
  // comes back tomorrow, and -- if it had already been learned -- we count a lapse.
  if (quality < 3) {
    return {
      repetitions: 0,
      easeFactor: nextEase,
      intervalDays: 1,
      lapses: state.lapses + (state.repetitions > 0 ? 1 : 0),
    };
  }

  const nextRepetitions = state.repetitions + 1;
  let nextInterval: number;
  if (state.repetitions === 0) {
    nextInterval = 1;
  } else if (state.repetitions === 1) {
    nextInterval = 6;
  } else {
    nextInterval = roundToInt(state.intervalDays * nextEase);
  }

  return {
    repetitions: nextRepetitions,
    easeFactor: nextEase,
    intervalDays: nextInterval,
    lapses: state.lapses,
  };
}
