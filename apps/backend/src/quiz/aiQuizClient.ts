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
  ): Promise<GeneratedQuizQuestion[]> {
    const res = await fetch(`${AI_SERVICE_URL}/v1/quiz/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ category, difficultyLevel }),
    });
    if (!res.ok) throw new Error(`AI service returned ${res.status}`);
    const data = (await res.json()) as { questions: GeneratedQuizQuestion[] };
    return data.questions;
  },
};

export const QUIZ_CATEGORIES = ["grammar", "vocabulary", "everyday_english"] as const;

export function isValidQuizCategory(value: string): boolean {
  return (QUIZ_CATEGORIES as readonly string[]).includes(value);
}
