import type { CefrLevel, TargetLanguage } from "@englishclass/types";
import { CHINESE_QUESTIONS } from "../chinese/questionBank";

// Stage 38: a curated quiz question bank.
//
// Quizzes were the last module still generated entirely by the LLM on every
// request. That had three costs: a several-second wait before a quiz appeared,
// output that varied in quality run to run, and the occasional malformed
// question from a 1.5B model -- a stem with no correct option among the four,
// which is worse than useless in an assessment.
//
// This follows the pattern proven by the Stage 33 wordlist: curated content
// first, AI as the fallback. A quiz whose bucket is fully covered here never
// touches the model at all, so it appears instantly and is always well-formed.
//
// Coverage is 3 questions per (language, category, CEFR level). Selection
// widens to neighbouring levels when a bucket alone can't fill a quiz (see
// selectQuestions), so every bucket yields a full 5-question quiz from curated
// content while staying within one level of the target.

export interface BankQuestion {
  id: string;
  language: TargetLanguage;
  category: string;
  cefrLevel: CefrLevel;
  type: "multiple_choice" | "true_false";
  question: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
}

const TF = ["True", "False"];

const ENGLISH_QUESTIONS: BankQuestion[] = [
  // ===== grammar =====
  { id: "en-gram-a1-1", language: "english", category: "grammar", cefrLevel: "A1", type: "multiple_choice", question: "She ___ to school every day.", options: ["go", "goes", "going", "gone"], correctAnswer: "goes", explanation: "Present simple adds -s for he/she/it." },
  { id: "en-gram-a1-2", language: "english", category: "grammar", cefrLevel: "A1", type: "multiple_choice", question: "___ you like tea?", options: ["Do", "Does", "Is", "Are"], correctAnswer: "Do", explanation: "Use 'do' with 'you' to form a present simple question." },
  { id: "en-gram-a1-3", language: "english", category: "grammar", cefrLevel: "A1", type: "true_false", question: "'I am have a car' is correct English.", options: TF, correctAnswer: "False", explanation: "It should be 'I have a car' — do not add 'am' before another verb." },

  { id: "en-gram-a2-1", language: "english", category: "grammar", cefrLevel: "A2", type: "multiple_choice", question: "Yesterday I ___ to the cinema.", options: ["go", "goes", "went", "gone"], correctAnswer: "went", explanation: "'Go' is irregular: its past simple is 'went'." },
  { id: "en-gram-a2-2", language: "english", category: "grammar", cefrLevel: "A2", type: "multiple_choice", question: "The meeting is ___ Monday.", options: ["in", "at", "on", "to"], correctAnswer: "on", explanation: "Use 'on' with days and dates." },
  { id: "en-gram-a2-3", language: "english", category: "grammar", cefrLevel: "A2", type: "multiple_choice", question: "This box is ___ than that one.", options: ["heavy", "heavier", "heaviest", "more heavy"], correctAnswer: "heavier", explanation: "Short adjectives form the comparative with -er." },

  { id: "en-gram-b1-1", language: "english", category: "grammar", cefrLevel: "B1", type: "multiple_choice", question: "I ___ never been to Japan.", options: ["have", "has", "had", "am"], correctAnswer: "have", explanation: "Present perfect uses 'have' with I/you/we/they." },
  { id: "en-gram-b1-2", language: "english", category: "grammar", cefrLevel: "B1", type: "multiple_choice", question: "I enjoy ___ in the sea.", options: ["swim", "to swim", "swimming", "swam"], correctAnswer: "swimming", explanation: "'Enjoy' is followed by the -ing form." },
  { id: "en-gram-b1-3", language: "english", category: "grammar", cefrLevel: "B1", type: "true_false", question: "In 'The window was broken', the doer of the action is unknown or unimportant.", options: TF, correctAnswer: "True", explanation: "That is exactly what the passive voice is for." },

  { id: "en-gram-b2-1", language: "english", category: "grammar", cefrLevel: "B2", type: "multiple_choice", question: "If I ___ more time, I would learn the piano.", options: ["have", "had", "will have", "would have"], correctAnswer: "had", explanation: "The second conditional uses the past simple after 'if'." },
  { id: "en-gram-b2-2", language: "english", category: "grammar", cefrLevel: "B2", type: "multiple_choice", question: "He isn't answering — he ___ be asleep.", options: ["must", "can't", "should", "would"], correctAnswer: "must", explanation: "'Must' expresses a confident deduction." },
  { id: "en-gram-b2-3", language: "english", category: "grammar", cefrLevel: "B2", type: "multiple_choice", question: "I stopped ___ coffee because it kept me awake.", options: ["drink", "to drink", "drinking", "drunk"], correctAnswer: "drinking", explanation: "'Stop + -ing' means to quit the activity; 'stop to drink' would mean pausing in order to drink." },

  { id: "en-gram-c1-1", language: "english", category: "grammar", cefrLevel: "C1", type: "multiple_choice", question: "Not only ___ late, but he also forgot the tickets.", options: ["he was", "was he", "he is", "did he"], correctAnswer: "was he", explanation: "A fronted negative expression triggers subject-auxiliary inversion." },
  { id: "en-gram-c1-2", language: "english", category: "grammar", cefrLevel: "C1", type: "multiple_choice", question: "My car, ___ is ten years old, still runs perfectly.", options: ["that", "which", "who", "what"], correctAnswer: "which", explanation: "Non-defining relative clauses use 'which', never 'that'." },
  { id: "en-gram-c1-3", language: "english", category: "grammar", cefrLevel: "C1", type: "true_false", question: "'The book that I borrowed was excellent' contains a defining relative clause.", options: TF, correctAnswer: "True", explanation: "It identifies which book is meant, so it takes no commas." },

  { id: "en-gram-c2-1", language: "english", category: "grammar", cefrLevel: "C2", type: "multiple_choice", question: "___ surprised me most was his honesty.", options: ["That", "Which", "What", "It"], correctAnswer: "What", explanation: "A what-cleft puts the spotlight on the following element." },
  { id: "en-gram-c2-2", language: "english", category: "grammar", cefrLevel: "C2", type: "multiple_choice", question: "Which is the most cautiously hedged claim?", options: ["The treatment works.", "The treatment may be effective.", "The treatment is clearly effective.", "The treatment cures the illness."], correctAnswer: "The treatment may be effective.", explanation: "'May be' hedges the claim; the others assert it outright." },
  { id: "en-gram-c2-3", language: "english", category: "grammar", cefrLevel: "C2", type: "true_false", question: "'It was Maria who solved it' emphasises Maria rather than the solving.", options: TF, correctAnswer: "True", explanation: "An it-cleft foregrounds the noun phrase it isolates." },

  // ===== vocabulary =====
  { id: "en-vocab-a1-1", language: "english", category: "vocabulary", cefrLevel: "A1", type: "multiple_choice", question: "Which word means the opposite of 'big'?", options: ["tall", "small", "long", "wide"], correctAnswer: "small", explanation: "'Small' is the direct opposite of 'big'." },
  { id: "en-vocab-a1-2", language: "english", category: "vocabulary", cefrLevel: "A1", type: "multiple_choice", question: "A person who teaches is a ___.", options: ["student", "teacher", "doctor", "driver"], correctAnswer: "teacher", explanation: "A teacher's job is to teach." },
  { id: "en-vocab-a1-3", language: "english", category: "vocabulary", cefrLevel: "A1", type: "true_false", question: "'Happy' and 'glad' have a similar meaning.", options: TF, correctAnswer: "True", explanation: "They are near-synonyms." },

  { id: "en-vocab-a2-1", language: "english", category: "vocabulary", cefrLevel: "A2", type: "multiple_choice", question: "Something that costs very little money is ___.", options: ["expensive", "cheap", "busy", "quiet"], correctAnswer: "cheap", explanation: "'Cheap' means low in price." },
  { id: "en-vocab-a2-2", language: "english", category: "vocabulary", cefrLevel: "A2", type: "multiple_choice", question: "If you take something and give it back later, you ___ it.", options: ["lend", "borrow", "buy", "sell"], correctAnswer: "borrow", explanation: "You borrow from someone; they lend to you." },
  { id: "en-vocab-a2-3", language: "english", category: "vocabulary", cefrLevel: "A2", type: "multiple_choice", question: "Choose the word closest in meaning to 'repair'.", options: ["break", "fix", "lose", "buy"], correctAnswer: "fix", explanation: "Both mean to make something work again." },

  { id: "en-vocab-b1-1", language: "english", category: "vocabulary", cefrLevel: "B1", type: "multiple_choice", question: "Something completely necessary is ___.", options: ["optional", "essential", "possible", "unusual"], correctAnswer: "essential", explanation: "'Essential' means it cannot be done without." },
  { id: "en-vocab-b1-2", language: "english", category: "vocabulary", cefrLevel: "B1", type: "multiple_choice", question: "A chance to do something good is an ___.", options: ["opportunity", "obligation", "argument", "instruction"], correctAnswer: "opportunity", explanation: "'Opportunity' means a favourable chance." },
  { id: "en-vocab-b1-3", language: "english", category: "vocabulary", cefrLevel: "B1", type: "true_false", question: "If someone is 'reliable', you can trust them to do what is needed.", options: TF, correctAnswer: "True", explanation: "That is the definition of reliable." },

  { id: "en-vocab-b2-1", language: "english", category: "vocabulary", cefrLevel: "B2", type: "multiple_choice", question: "Something certain to happen and impossible to avoid is ___.", options: ["avoidable", "inevitable", "unlikely", "optional"], correctAnswer: "inevitable", explanation: "'Inevitable' means unavoidable." },
  { id: "en-vocab-b2-2", language: "english", category: "vocabulary", cefrLevel: "B2", type: "multiple_choice", question: "Choose the closest meaning of 'reluctant'.", options: ["eager", "unwilling", "confident", "careless"], correctAnswer: "unwilling", explanation: "Reluctant means hesitant or unwilling." },
  { id: "en-vocab-b2-3", language: "english", category: "vocabulary", cefrLevel: "B2", type: "multiple_choice", question: "A study that is 'thorough' is ___.", options: ["quick and partial", "complete and detailed", "badly designed", "widely ignored"], correctAnswer: "complete and detailed", explanation: "Thorough means attentive to every detail." },

  { id: "en-vocab-c1-1", language: "english", category: "vocabulary", cefrLevel: "C1", type: "multiple_choice", question: "A statement with more than one possible meaning is ___.", options: ["explicit", "ambiguous", "coherent", "concise"], correctAnswer: "ambiguous", explanation: "Ambiguous means open to more than one interpretation." },
  { id: "en-vocab-c1-2", language: "english", category: "vocabulary", cefrLevel: "C1", type: "multiple_choice", question: "To weaken something gradually is to ___ it.", options: ["reinforce", "undermine", "establish", "sustain"], correctAnswer: "undermine", explanation: "To undermine is to erode something over time." },
  { id: "en-vocab-c1-3", language: "english", category: "vocabulary", cefrLevel: "C1", type: "true_false", question: "'Explicit' and 'implicit' mean roughly the same thing.", options: TF, correctAnswer: "False", explanation: "They are opposites: explicit is stated directly, implicit is implied." },

  { id: "en-vocab-c2-1", language: "english", category: "vocabulary", cefrLevel: "C2", type: "multiple_choice", question: "A connection described as 'tenuous' is ___.", options: ["very strong", "very weak", "newly formed", "widely accepted"], correctAnswer: "very weak", explanation: "Tenuous means slight and easily doubted." },
  { id: "en-vocab-c2-2", language: "english", category: "vocabulary", cefrLevel: "C2", type: "multiple_choice", question: "'He resigned, ostensibly for personal reasons' implies that ___.", options: ["the reason is certain", "the stated reason may not be the real one", "he did not resign", "the reason was personal"], correctAnswer: "the stated reason may not be the real one", explanation: "'Ostensibly' signals an apparent rather than actual reason." },
  { id: "en-vocab-c2-3", language: "english", category: "vocabulary", cefrLevel: "C2", type: "multiple_choice", question: "Something 'ubiquitous' is ___.", options: ["extremely rare", "found everywhere", "highly valuable", "poorly understood"], correctAnswer: "found everywhere", explanation: "Ubiquitous means seeming to be present everywhere at once." },

  // ===== everyday_english =====
  { id: "en-day-a1-1", language: "english", category: "everyday_english", cefrLevel: "A1", type: "multiple_choice", question: "Someone says 'Thank you.' What is the natural reply?", options: ["You're welcome.", "Yes, please.", "See you.", "I'm fine."], correctAnswer: "You're welcome.", explanation: "This is the standard response to thanks." },
  { id: "en-day-a1-2", language: "english", category: "everyday_english", cefrLevel: "A1", type: "multiple_choice", question: "In a shop, how do you ask the price?", options: ["How many is it?", "How much is it?", "What is it?", "Where is it?"], correctAnswer: "How much is it?", explanation: "'How much' asks about price or uncountable quantity." },
  { id: "en-day-a1-3", language: "english", category: "everyday_english", cefrLevel: "A1", type: "true_false", question: "'Good night' is used when arriving somewhere in the evening.", options: TF, correctAnswer: "False", explanation: "'Good night' is said when leaving or going to bed; use 'good evening' on arrival." },

  { id: "en-day-a2-1", language: "english", category: "everyday_english", cefrLevel: "A2", type: "multiple_choice", question: "You are lost. What do you say to a stranger?", options: ["Give me the station.", "Excuse me, could you tell me the way to the station?", "Where station?", "I want station now."], correctAnswer: "Excuse me, could you tell me the way to the station?", explanation: "Polite requests open with 'excuse me' and use 'could you'." },
  { id: "en-day-a2-2", language: "english", category: "everyday_english", cefrLevel: "A2", type: "multiple_choice", question: "A waiter asks 'Are you ready to order?' You need more time. Say:", options: ["No, go away.", "Could we have a few more minutes, please?", "I don't order.", "Yes, later."], correctAnswer: "Could we have a few more minutes, please?", explanation: "This politely asks for more time." },
  { id: "en-day-a2-3", language: "english", category: "everyday_english", cefrLevel: "A2", type: "multiple_choice", question: "Which is the polite way to refuse an offer of food?", options: ["No.", "No, thank you.", "I don't want.", "Bad food."], correctAnswer: "No, thank you.", explanation: "Adding 'thank you' softens the refusal." },

  { id: "en-day-b1-1", language: "english", category: "everyday_english", cefrLevel: "B1", type: "multiple_choice", question: "On the phone: 'Could I speak to Ms Lee?' She is unavailable. Reply:", options: ["She is not here. Bye.", "I'm afraid she's not available at the moment. Can I take a message?", "No Ms Lee.", "Call again."], correctAnswer: "I'm afraid she's not available at the moment. Can I take a message?", explanation: "'I'm afraid' softens bad news and offering to take a message is standard." },
  { id: "en-day-b1-2", language: "english", category: "everyday_english", cefrLevel: "B1", type: "multiple_choice", question: "What does 'It's not my cup of tea' mean?", options: ["I am thirsty.", "I don't particularly like it.", "It belongs to someone else.", "It is too hot."], correctAnswer: "I don't particularly like it.", explanation: "It is a mild idiom for something not to your taste." },
  { id: "en-day-b1-3", language: "english", category: "everyday_english", cefrLevel: "B1", type: "true_false", question: "'Would you mind opening the window?' — 'Not at all' means the person agrees.", options: TF, correctAnswer: "True", explanation: "'Not at all' means they do not object, so they will do it." },

  { id: "en-day-b2-1", language: "english", category: "everyday_english", cefrLevel: "B2", type: "multiple_choice", question: "In a meeting, how do you disagree diplomatically?", options: ["You're wrong.", "I see your point, but I'd argue that…", "That makes no sense.", "No."], correctAnswer: "I see your point, but I'd argue that…", explanation: "Acknowledging first keeps disagreement professional." },
  { id: "en-day-b2-2", language: "english", category: "everyday_english", cefrLevel: "B2", type: "multiple_choice", question: "'Let's play it by ear' means ___.", options: ["listen to music", "decide as we go rather than plan", "follow the written rules", "repeat what was said"], correctAnswer: "decide as we go rather than plan", explanation: "The idiom means to improvise rather than plan ahead." },
  { id: "en-day-b2-3", language: "english", category: "everyday_english", cefrLevel: "B2", type: "multiple_choice", question: "Your order arrived damaged. The most effective opening for a complaint email is:", options: ["This is unacceptable!!!", "I am writing regarding order #123, which arrived damaged on 3 May.", "Hi, problem.", "Why is your company so bad?"], correctAnswer: "I am writing regarding order #123, which arrived damaged on 3 May.", explanation: "A factual, specific opening gets complaints resolved faster than an emotional one." },

  { id: "en-day-c1-1", language: "english", category: "everyday_english", cefrLevel: "C1", type: "multiple_choice", question: "'I'll give you the benefit of the doubt' means you ___.", options: ["assume they are guilty", "choose to believe them despite uncertainty", "refuse to decide", "doubt everything they say"], correctAnswer: "choose to believe them despite uncertainty", explanation: "You resolve the uncertainty in their favour." },
  { id: "en-day-c1-2", language: "english", category: "everyday_english", cefrLevel: "C1", type: "multiple_choice", question: "Which sounds most natural in a formal email closing?", options: ["Bye now.", "I look forward to hearing from you.", "Write me back fast.", "Thanks a lot!!"], correctAnswer: "I look forward to hearing from you.", explanation: "It is the conventional formal sign-off before the closing salutation." },
  { id: "en-day-c1-3", language: "english", category: "everyday_english", cefrLevel: "C1", type: "true_false", question: "Saying 'with all due respect' usually signals that disagreement is coming.", options: TF, correctAnswer: "True", explanation: "It is a conventional softener placed before a contrary opinion." },

  { id: "en-day-c2-1", language: "english", category: "everyday_english", cefrLevel: "C2", type: "multiple_choice", question: "'That's a bold strategy' said flatly after a risky plan most likely conveys ___.", options: ["sincere admiration", "polite scepticism", "total agreement", "confusion"], correctAnswer: "polite scepticism", explanation: "Understatement of this kind is a common British way of signalling doubt." },
  { id: "en-day-c2-2", language: "english", category: "everyday_english", cefrLevel: "C2", type: "multiple_choice", question: "'To move the goalposts' in a negotiation means ___.", options: ["to reach agreement", "to change the requirements after the fact", "to postpone the meeting", "to split the difference"], correctAnswer: "to change the requirements after the fact", explanation: "The idiom describes unfairly altering the criteria mid-process." },
  { id: "en-day-c2-3", language: "english", category: "everyday_english", cefrLevel: "C2", type: "true_false", question: "'I'm not entirely convinced' is a stronger objection than 'I disagree'.", options: TF, correctAnswer: "False", explanation: "It is deliberately weaker — a hedged, more tentative form of disagreement." },
];

/** The full bank across every language. */
export const QUESTION_BANK: BankQuestion[] = [...ENGLISH_QUESTIONS, ...CHINESE_QUESTIONS];

const CEFR_ORDER: CefrLevel[] = ["A1", "A2", "B1", "B2", "C1", "C2"];

function levelDistance(a: CefrLevel, b: CefrLevel): number {
  return Math.abs(CEFR_ORDER.indexOf(a) - CEFR_ORDER.indexOf(b));
}

/** Fisher-Yates, with an injectable RNG so selection is testable. */
function shuffle<T>(items: T[], rng: () => number): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/**
 * Picks up to `count` curated questions for a bucket.
 *
 * Questions at the exact level come first; if that alone can't fill a quiz the
 * selection widens to the nearest levels rather than returning a short quiz.
 * Within a distance band the order is shuffled, so repeating a quiz at the same
 * level doesn't replay the same five questions.
 */
export function selectQuestions(
  language: TargetLanguage,
  category: string,
  level: CefrLevel,
  count: number,
  rng: () => number = Math.random,
): BankQuestion[] {
  const pool = QUESTION_BANK.filter(
    (q) => q.language === language && q.category === category,
  );

  const byDistance = new Map<number, BankQuestion[]>();
  for (const q of pool) {
    const d = levelDistance(q.cefrLevel, level);
    if (!byDistance.has(d)) byDistance.set(d, []);
    byDistance.get(d)!.push(q);
  }

  const selected: BankQuestion[] = [];
  for (const distance of [...byDistance.keys()].sort((a, b) => a - b)) {
    if (selected.length >= count) break;
    selected.push(...shuffle(byDistance.get(distance)!, rng));
  }
  return selected.slice(0, count);
}

export const QUESTION_BANK_SIZE = QUESTION_BANK.length;
