const AI_SERVICE_URL = process.env.AI_SERVICE_URL ?? "http://127.0.0.1:8100";

export interface GrammarExerciseResult {
  question: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
}

// Object wrapper (matching aiVocabClient/languageToolClient) so tests can
// swap this for a fake without needing a live AI service.
export const aiExerciseClient = {
  async generate(
    topicTitle: string,
    topicExplanation: string,
    difficultyLevel: string,
    exerciseType: "multiple_choice" | "fill_blank",
  ): Promise<GrammarExerciseResult> {
    const res = await fetch(`${AI_SERVICE_URL}/v1/grammar/exercise`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        topicTitle,
        topicExplanation,
        difficultyLevel,
        exerciseType,
      }),
    });
    if (!res.ok) throw new Error(`AI service returned ${res.status}`);
    return (await res.json()) as GrammarExerciseResult;
  },
};
