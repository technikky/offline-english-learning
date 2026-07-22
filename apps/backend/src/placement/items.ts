import type { CefrLevel } from "@englishclass/types";
import { BLOCK_SIZE } from "./staircase";

// Stage 26: curated placement-test item bank. Static/curated for the same
// reason as the grammar curriculum and reading passages (Stages 14/15): a
// placement test must be reliable and consistently level-appropriate, which a
// small local model can't guarantee per-run. Each CEFR level has at least
// BLOCK_SIZE items; the staircase serves one block per rung and never revisits
// a rung, so no item is shown twice in a single test.

export interface PlacementItem {
  id: string;
  level: CefrLevel;
  question: string;
  options: string[];
  correctAnswer: string;
}

const ITEMS: PlacementItem[] = [
  // --- A1: to be, present simple, plurals ---
  { id: "a1-1", level: "A1", question: "She ___ a teacher.", options: ["is", "are", "am", "be"], correctAnswer: "is" },
  { id: "a1-2", level: "A1", question: "___ you like coffee?", options: ["Do", "Does", "Are", "Is"], correctAnswer: "Do" },
  { id: "a1-3", level: "A1", question: "I have two ___.", options: ["cats", "cat", "cates", "cats'"], correctAnswer: "cats" },

  // --- A2: past simple, comparatives, common collocations ---
  { id: "a2-1", level: "A2", question: "Yesterday I ___ to the market.", options: ["went", "go", "gone", "going"], correctAnswer: "went" },
  { id: "a2-2", level: "A2", question: "This box is ___ than that one.", options: ["heavier", "heavy", "heaviest", "more heavy"], correctAnswer: "heavier" },
  { id: "a2-3", level: "A2", question: "We are looking ___ to the trip.", options: ["forward", "front", "ahead", "after"], correctAnswer: "forward" },

  // --- B1: present perfect, first conditional, connectors ---
  { id: "b1-1", level: "B1", question: "I have ___ been to Japan.", options: ["never", "ever", "yet", "still"], correctAnswer: "never" },
  { id: "b1-2", level: "B1", question: "If it rains, we ___ stay home.", options: ["will", "would", "are", "have"], correctAnswer: "will" },
  { id: "b1-3", level: "B1", question: "She was tired, ___ she finished the work.", options: ["but", "because", "so", "or"], correctAnswer: "but" },

  // --- B2: passive, wish + past perfect, adjective form ---
  { id: "b2-1", level: "B2", question: "The bridge ___ built in 1920.", options: ["was", "is", "has", "being"], correctAnswer: "was" },
  { id: "b2-2", level: "B2", question: "I wish I ___ more time yesterday.", options: ["had had", "have", "had", "have had"], correctAnswer: "had had" },
  { id: "b2-3", level: "B2", question: "His argument was quite ___; nobody could refute it.", options: ["convincing", "convince", "convinced", "convincingly"], correctAnswer: "convincing" },

  // --- C1: inversion, advanced collocation, idiom ---
  { id: "c1-1", level: "C1", question: "Not only ___ late, but he also forgot the documents.", options: ["was he", "he was", "he is", "he did"], correctAnswer: "was he" },
  { id: "c1-2", level: "C1", question: "The findings have significant ___ for future policy.", options: ["implications", "implication", "implicates", "implicating"], correctAnswer: "implications" },
  { id: "c1-3", level: "C1", question: "She takes everything ___ her stride, never panicking.", options: ["in", "on", "at", "by"], correctAnswer: "in" },

  // --- C2: fronting/participle clause, inversion, subjunctive ---
  { id: "c2-1", level: "C2", question: "___ the circumstances, the team performed admirably.", options: ["Given", "Giving", "Gave", "Give"], correctAnswer: "Given" },
  { id: "c2-2", level: "C2", question: "Rarely ___ such a compelling performance.", options: ["have we seen", "we have seen", "we saw", "did we saw"], correctAnswer: "have we seen" },
  { id: "c2-3", level: "C2", question: "It's high time we ___ this issue.", options: ["addressed", "address", "will address", "addressing"], correctAnswer: "addressed" },
];

/** Returns the block of items to serve for a given rung (the first BLOCK_SIZE of that level). */
export function getBlock(level: CefrLevel): PlacementItem[] {
  return ITEMS.filter((item) => item.level === level).slice(0, BLOCK_SIZE);
}

/** Looks up an item by id (used server-side for grading). */
export function getItemById(id: string): PlacementItem | undefined {
  return ITEMS.find((item) => item.id === id);
}

export const PLACEMENT_ITEMS = ITEMS;
