import type { GrammarTopicDetail, TargetLanguage } from "@englishclass/types";
import { CHINESE_GRAMMAR_TOPICS } from "../chinese/grammar";

// Stage 14: a curated grammar curriculum. Deliberately static/curated rather
// than AI-generated -- foundational lesson content (the explanation and
// examples a student first reads) benefits from being reliable and
// consistent, which a 1.5B local model can't guarantee. The AI is used
// instead for what it's good for: generating a fresh practice exercise per
// attempt (see aiExerciseClient.ts). Adding more topics later is just
// appending to this array -- no schema/migration change needed.
const CURRICULUM: GrammarTopicDetail[] = [
  {
    id: "present-tense",
    level: "beginner",
    cefrLevel: "A1",
    title: "Present Simple Tense",
    explanation:
      "Use the present simple for habits, routines, facts, and things that are generally true. " +
      "Add -s or -es to the verb for he/she/it (I work -> she works). Use 'do/does' to make " +
      "questions and negatives (Do you work? She doesn't work).",
    examples: [
      "I drink coffee every morning.",
      "The sun rises in the east.",
      "She works at a hospital.",
      "They don't like spicy food.",
      "Does he play football on weekends?",
    ],
  },
  {
    id: "past-tense",
    level: "beginner",
    cefrLevel: "A1",
    title: "Past Simple Tense",
    explanation:
      "Use the past simple for actions that started and finished in the past. Regular verbs " +
      "add -ed (walk -> walked). Many common verbs are irregular (go -> went, see -> saw) and " +
      "must be memorized. Use 'did' for questions and negatives (Did you go? I didn't go).",
    examples: [
      "I walked to school yesterday.",
      "She visited her grandmother last weekend.",
      "They went to the beach in July.",
      "He didn't finish his homework.",
      "Did you see that movie?",
    ],
  },
  {
    id: "articles",
    level: "beginner",
    cefrLevel: "A2",
    title: "Articles: a, an, the",
    explanation:
      "Use 'a' before a consonant sound and 'an' before a vowel sound, for a single, " +
      "non-specific noun mentioned for the first time (a dog, an apple). Use 'the' for a " +
      "specific noun both speaker and listener already know about, or when there's only one " +
      "of something (the sun, the president).",
    examples: [
      "I saw a cat in the garden.",
      "She bought an umbrella yesterday.",
      "The cat I saw was black and white.",
      "The Earth orbits the sun.",
      "Can you close the door, please?",
    ],
  },
  {
    id: "prepositions",
    level: "beginner",
    cefrLevel: "A2",
    title: "Prepositions of Time and Place",
    explanation:
      "Use 'at' for exact times and specific points (at 5pm, at the door), 'in' for months, " +
      "years, and enclosed spaces (in July, in the box), and 'on' for days and dates and " +
      "surfaces (on Monday, on the table).",
    examples: [
      "The meeting is at 3pm.",
      "I was born in 1995.",
      "Let's meet on Friday.",
      "The keys are in the drawer.",
      "The book is on the shelf.",
    ],
  },
  {
    id: "present-perfect",
    level: "intermediate",
    cefrLevel: "B1",
    title: "Present Perfect Tense",
    explanation:
      "Use the present perfect (have/has + past participle) for past actions with a " +
      "connection to now: experiences without a specific time (I have visited Paris), " +
      "recent actions with a present result (She has broken her arm), or actions continuing " +
      "up to now (We have lived here for ten years).",
    examples: [
      "I have never eaten sushi.",
      "She has already finished her homework.",
      "They have lived in London since 2015.",
      "Have you ever been to Japan?",
      "He hasn't called me yet.",
    ],
  },
  {
    id: "passive-voice",
    level: "intermediate",
    cefrLevel: "B1",
    title: "Passive Voice",
    explanation:
      "Use the passive voice (a form of 'be' + past participle) when the action matters more " +
      "than who did it, or the doer is unknown/unimportant. The object of an active sentence " +
      "becomes the subject: 'The chef cooked the meal' (active) -> 'The meal was cooked by the " +
      "chef' (passive).",
    examples: [
      "The window was broken last night.",
      "This song was written by a famous composer.",
      "English is spoken in many countries.",
      "The report will be finished tomorrow.",
      "Mistakes were made during the project.",
    ],
  },
  {
    id: "conditionals",
    level: "intermediate",
    cefrLevel: "B2",
    title: "Conditionals (First and Second)",
    explanation:
      "The first conditional (If + present simple, will + verb) describes real, likely future " +
      "situations: 'If it rains, I will stay home.' The second conditional (If + past simple, " +
      "would + verb) describes hypothetical or unlikely situations: 'If I won the lottery, I " +
      "would travel the world.'",
    examples: [
      "If it rains tomorrow, we will cancel the picnic.",
      "If she studies hard, she will pass the exam.",
      "If I had a million dollars, I would buy a house.",
      "If he were taller, he would play basketball.",
      "What would you do if you saw a ghost?",
    ],
  },
  {
    id: "modal-verbs",
    level: "advanced",
    cefrLevel: "B2",
    title: "Modal Verbs of Deduction and Speculation",
    explanation:
      "Use 'must' for a confident deduction (something is almost certainly true), 'might/could' " +
      "for a possibility, and 'can't' for something you're confident is false, when speculating " +
      "about a present or past situation: 'She must be tired' (present deduction), 'He might " +
      "have missed the bus' (past speculation).",
    examples: [
      "He must be at work; his car is gone.",
      "She might have forgotten about the meeting.",
      "That can't be true; I just saw him yesterday.",
      "They could be stuck in traffic.",
      "It must have rained last night; the ground is wet.",
    ],
  },
  {
    id: "relative-clauses",
    level: "advanced",
    cefrLevel: "C1",
    title: "Relative Clauses",
    explanation:
      "Relative clauses add information about a noun using who/which/that/whose/where. " +
      "Defining relative clauses (no commas) identify which noun you mean: 'The book that I " +
      "borrowed was excellent.' Non-defining relative clauses (with commas) add extra, " +
      "non-essential information: 'My brother, who lives in Canada, is visiting next week.'",
    examples: [
      "The woman who called earlier didn't leave her name.",
      "This is the restaurant where we had our first date.",
      "My car, which is ten years old, still runs perfectly.",
      "Students whose grades improve will get a reward.",
      "The movie that won the award was directed by a newcomer.",
    ],
  },
  // --- Stage 32: filling real syllabus gaps and building out C1/C2 ---
  {
    id: "gerunds-infinitives",
    level: "intermediate",
    cefrLevel: "B1",
    title: "Gerunds and Infinitives",
    explanation:
      "Some verbs are followed by -ing (a gerund), others by to + verb (an infinitive), and a " +
      "few by either. Enjoy, avoid, finish, suggest and mind take -ing. Want, decide, hope, " +
      "promise and agree take to + verb. After a preposition, always use -ing. A few verbs " +
      "(stop, remember, forget) change meaning depending on which you choose.",
    examples: [
      "I enjoy swimming in the sea.",
      "She decided to move to another city.",
      "He is good at solving problems.",
      "I stopped smoking. (I quit) / I stopped to smoke. (I paused in order to smoke)",
      "Remember to lock the door. (do it) / I remember locking the door. (the memory)",
    ],
  },
  {
    id: "inversion",
    level: "advanced",
    cefrLevel: "C1",
    title: "Inversion for Emphasis",
    explanation:
      "When a negative or limiting expression starts a sentence, the subject and auxiliary swap " +
      "places, as in a question. This is a formal, emphatic structure used in writing and " +
      "speeches. Common triggers: never, rarely, seldom, not only, no sooner, little, only " +
      "then, under no circumstances. If there is no auxiliary, add do/does/did.",
    examples: [
      "Never have I seen such a beautiful sunset.",
      "Not only did she finish first, but she also broke the record.",
      "Rarely do we get an opportunity like this.",
      "No sooner had he sat down than the phone rang.",
      "Under no circumstances should you open this door.",
    ],
  },
  {
    id: "cleft-sentences",
    level: "advanced",
    cefrLevel: "C2",
    title: "Cleft Sentences",
    explanation:
      "A cleft sentence splits one idea into two clauses to put the spotlight on a particular " +
      "part of it. An it-cleft (It is X that…) highlights a noun phrase; a what-cleft (What I " +
      "need is…) highlights an action or thing. These let you control emphasis in writing " +
      "without changing your words, and they are a hallmark of fluent, controlled prose.",
    examples: [
      "It was Maria who solved the problem. (not someone else)",
      "It wasn't until midnight that we finally arrived.",
      "What surprised me most was his honesty.",
      "What we need is a clearer plan.",
      "All I want is a quiet evening.",
    ],
  },
  {
    id: "hedging-and-nuance",
    level: "advanced",
    cefrLevel: "C2",
    title: "Hedging and Nuanced Modality",
    explanation:
      "Advanced writers rarely state things as absolute fact. Hedging softens a claim so it is " +
      "defensible: modal verbs (may, might, could), distancing verbs (appears, suggests, tends " +
      "to), and qualifiers (broadly, arguably, to some extent). The opposite — boosting — " +
      "strengthens a claim (clearly, undoubtedly). Choosing the right strength is what makes " +
      "academic and professional English sound credible rather than naive.",
    examples: [
      "The results suggest that the treatment may be effective. (careful)",
      "This tends to happen when demand rises sharply.",
      "Arguably, the policy has had little measurable effect.",
      "The evidence would seem to point in a different direction.",
      "There is undoubtedly room for improvement. (boosted, not hedged)",
    ],
  },
];

// Stage 28: topics for the language the student is learning. Ids are globally
// unique across languages, so only *listing* needs the language -- lookups can
// stay language-agnostic and search every catalog.
export function listGrammarTopics(language: TargetLanguage = "english"): GrammarTopicDetail[] {
  return language === "chinese" ? CHINESE_GRAMMAR_TOPICS : CURRICULUM;
}

export function getGrammarTopic(id: string): GrammarTopicDetail | undefined {
  return (
    CURRICULUM.find((topic) => topic.id === id) ??
    CHINESE_GRAMMAR_TOPICS.find((topic) => topic.id === id)
  );
}
