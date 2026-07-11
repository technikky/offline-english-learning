const AI_SERVICE_URL = process.env.AI_SERVICE_URL ?? "http://127.0.0.1:8100";

export interface ReadingComprehensionResult {
  summary: string;
  vocabularyWords: string[];
  questions: { question: string; options: string[]; correctAnswer: string }[];
}

// Object wrapper (matching aiVocabClient/aiExerciseClient) so tests can swap
// this for a fake without needing a live AI service.
export const aiReadingClient = {
  async generateComprehension(
    passageContent: string,
    cefrLevel: string,
  ): Promise<ReadingComprehensionResult> {
    const res = await fetch(`${AI_SERVICE_URL}/v1/reading/comprehension`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ passageContent, cefrLevel }),
    });
    if (!res.ok) throw new Error(`AI service returned ${res.status}`);
    return (await res.json()) as ReadingComprehensionResult;
  },
};
