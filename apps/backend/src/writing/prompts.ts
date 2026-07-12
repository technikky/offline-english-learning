import type { WritingPromptDetail, WritingPromptSummary } from "@englishclass/types";

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
];

export function listWritingPrompts(): WritingPromptSummary[] {
  return PROMPTS.map(({ id, title, cefrLevel, wordCountTarget }) => ({
    id,
    title,
    cefrLevel,
    wordCountTarget,
  }));
}

export function getWritingPrompt(id: string): WritingPromptDetail | undefined {
  return PROMPTS.find((p) => p.id === id);
}

export function countWords(text: string): number {
  return text.trim().split(/\s+/).filter((w) => w.length > 0).length;
}
