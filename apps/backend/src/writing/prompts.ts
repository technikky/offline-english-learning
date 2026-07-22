import type {
  TargetLanguage,
  WritingPromptDetail,
  WritingPromptSummary,
} from "@englishclass/types";
import { CHINESE_WRITING_PROMPTS } from "../chinese/prompts";

// Stage 18: curated writing prompts. Per the master brief, every prompt is
// scaffolded (topic, target vocabulary, grammar focus, word-count target,
// hints) rather than a bare blank page.
const PROMPTS: WritingPromptDetail[] = [
  {
    id: "write-my-family",
    title: "My Family",
    cefrLevel: "A1",
    wordCountTarget: 50,
    prompt: "Write a short paragraph about your family. Who are the people in your family? What do they like to do?",
    targetVocabulary: ["family", "mother", "father", "sister", "brother", "together"],
    grammarFocus: "Present simple tense and the verb 'to be'",
    hints: [
      "Start by saying how many people are in your family.",
      "Use 'My mother is…', 'My father likes…' style sentences.",
      "Add one sentence about something you do together.",
    ],
  },
  {
    id: "write-a-memorable-trip",
    title: "A Memorable Trip",
    cefrLevel: "A2",
    wordCountTarget: 90,
    prompt: "Write about a trip you remember well. Where did you go? What did you do there? How did you feel?",
    targetVocabulary: ["travel", "visit", "enjoy", "arrive", "beautiful", "unforgettable"],
    grammarFocus: "Past simple tense (regular and irregular verbs)",
    hints: [
      "Say where and when you went.",
      "Describe two or three things you did, in order.",
      "End with how the trip made you feel.",
    ],
  },
  {
    id: "write-technology-opinion",
    title: "Technology in Daily Life",
    cefrLevel: "B1",
    wordCountTarget: 130,
    prompt: "Some people say technology makes our lives easier, while others think it creates new problems. What is your opinion? Give reasons and examples.",
    targetVocabulary: ["convenient", "communicate", "distraction", "efficient", "however", "in my opinion"],
    grammarFocus: "Expressing opinions and linking words (however, because, for example)",
    hints: [
      "State your opinion clearly in the first sentence.",
      "Give at least two reasons, each with an example.",
      "Use linking words to connect your ideas.",
      "Finish with a short conclusion that restates your view.",
    ],
  },
  {
    id: "write-environment-essay",
    title: "Protecting the Environment",
    cefrLevel: "B2",
    wordCountTarget: 180,
    prompt: "Climate change is one of the biggest challenges of our time. What can individuals and governments do to protect the environment? Discuss both perspectives.",
    targetVocabulary: ["sustainable", "emissions", "renewable", "policy", "consequence", "collective"],
    grammarFocus: "Modal verbs for suggestions/obligation (should, must, could) and passive voice",
    hints: [
      "Introduce the topic and why it matters.",
      "Devote one paragraph to what individuals can do.",
      "Devote another to what governments should do.",
      "Use modal verbs and some passive constructions.",
      "Conclude with a balanced final thought.",
    ],
  },
  // --- Stage 32: completing C1/C2 and adding a second B2 task ---
  {
    id: "write-a-formal-complaint",
    title: "A Formal Complaint",
    cefrLevel: "B2",
    wordCountTarget: 160,
    prompt:
      "You ordered a product online that arrived damaged, and your first email received no " +
      "reply. Write a formal complaint to the company explaining what happened and what you " +
      "want them to do about it.",
    targetVocabulary: [
      "purchase",
      "faulty",
      "refund",
      "resolve",
      "unacceptable",
      "prompt response",
    ],
    grammarFocus: "The passive voice and polite but firm modal verbs (should, would expect)",
    hints: [
      "Open by stating clearly what you bought and when.",
      "Describe the problem factually, without emotional language.",
      "State exactly what outcome you want, and give a reasonable deadline.",
    ],
  },
  {
    id: "write-a-balanced-argument",
    title: "A Balanced Argument",
    cefrLevel: "C1",
    wordCountTarget: 280,
    prompt:
      "Some people argue that university education should be free for everyone; others say " +
      "students should contribute to the cost. Discuss both views and give your own opinion, " +
      "supporting it with reasons and examples.",
    targetVocabulary: [
      "subsidise",
      "taxpayer",
      "access",
      "long-term investment",
      "counterargument",
      "on balance",
    ],
    grammarFocus:
      "Concessive structures (while, although, admittedly), relative clauses, and inversion for emphasis",
    hints: [
      "Devote one paragraph to each view, presenting the strongest version of it.",
      "Acknowledge the opposing case before you answer it — that is what makes an argument credible.",
      "Signal your own position clearly in the final paragraph with a phrase like 'On balance'.",
    ],
  },
  {
    id: "write-a-critical-review",
    title: "A Critical Review",
    cefrLevel: "C2",
    wordCountTarget: 350,
    prompt:
      "Write a critical review of a book, film, or article that you found genuinely flawed but " +
      "worth engaging with. Summarise its central claim fairly, identify where the reasoning " +
      "or execution breaks down, and explain what it nonetheless gets right.",
    targetVocabulary: [
      "premise",
      "compelling",
      "overstate",
      "nuance",
      "notwithstanding",
      "fall short of",
    ],
    grammarFocus:
      "Hedging and nuanced modality, cleft sentences for emphasis, and complex noun phrases",
    hints: [
      "Summarise the argument so fairly that its author would accept your description.",
      "Distinguish between a weakness in the argument and a matter of taste.",
      "Hedge claims you cannot fully support ('arguably', 'tends to'), and boost only the ones you can.",
    ],
  }
];

// Stage 31: prompts for the language being learned. Ids stay globally unique
// across languages, so only listing filters (the Stage 28 rule).
export function listWritingPrompts(
  language: TargetLanguage = "english",
): WritingPromptSummary[] {
  const catalog = language === "chinese" ? CHINESE_WRITING_PROMPTS : PROMPTS;
  return catalog.map(({ id, title, cefrLevel, wordCountTarget, language: lang }) => ({
    id,
    title,
    cefrLevel,
    wordCountTarget,
    language: lang,
  }));
}

export function getWritingPrompt(id: string): WritingPromptDetail | undefined {
  return (
    PROMPTS.find((p) => p.id === id) ?? CHINESE_WRITING_PROMPTS.find((p) => p.id === id)
  );
}

export function countWords(text: string): number {
  return text.trim().split(/\s+/).filter((w) => w.length > 0).length;
}

const CJK_CHARACTER = /[一-鿿㐀-䶿]/;

/** Counts Chinese characters (字数) -- the conventional measure of Chinese
 * writing length. Punctuation and whitespace are excluded. */
export function countChineseCharacters(text: string): number {
  return Array.from(text).filter((ch) => CJK_CHARACTER.test(ch)).length;
}

/**
 * Stage 31: length of a submission in the units that language actually uses.
 *
 * Chinese is written without spaces, so the English word-splitter would score
 * an entire Chinese essay as 1 "word" -- making every submission look far below
 * its length target.
 */
export function countWritingUnits(
  text: string,
  language: TargetLanguage = "english",
): number {
  return language === "chinese" ? countChineseCharacters(text) : countWords(text);
}
