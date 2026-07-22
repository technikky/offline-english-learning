const AI_SERVICE_URL = process.env.AI_SERVICE_URL ?? "http://127.0.0.1:8100";

export interface GeneratedQuizQuestion {
  type: "multiple_choice" | "true_false";
  question: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
}

// Object-wrapped (swappable in tests) client for the AI quiz generator.
export const aiQuizClient = {
  async generate(
    category: string,
    difficultyLevel: string,
    targetLanguage: string = "english",
  ): Promise<GeneratedQuizQuestion[]> {
    const res = await fetch(`${AI_SERVICE_URL}/v1/quiz/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ category, difficultyLevel, targetLanguage }),
    });
    if (!res.ok) throw new Error(`AI service returned ${res.status}`);
    const data = (await res.json()) as { questions: GeneratedQuizQuestion[] };
    return data.questions;
  },
};

// Stage 31: quiz categories differ per language. "everyday_english" makes no
// sense for a Chinese learner, and Chinese has a category English doesn't need
// at all -- character/radical knowledge.
export const QUIZ_CATEGORIES = ["grammar", "vocabulary", "everyday_english"] as const;

export const CHINESE_QUIZ_CATEGORIES = [
  "grammar",
  "vocabulary",
  "everyday_chinese",
  "characters",
] as const;

export const QUIZ_CATEGORIES_BY_LANGUAGE: Record<string, readonly string[]> = {
  english: QUIZ_CATEGORIES,
  chinese: CHINESE_QUIZ_CATEGORIES,
};

export function listQuizCategories(language: string = "english"): readonly string[] {
  return QUIZ_CATEGORIES_BY_LANGUAGE[language] ?? QUIZ_CATEGORIES;
}

export function isValidQuizCategory(value: string, language: string = "english"): boolean {
  return listQuizCategories(language).includes(value);
}
