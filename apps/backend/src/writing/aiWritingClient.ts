const AI_SERVICE_URL = process.env.AI_SERVICE_URL ?? "http://127.0.0.1:8100";

export interface WritingAnalysisResult {
  overall: string;
  grammarScore: number;
  vocabularyScore: number;
  coherenceScore: number;
  strengths: string[];
  improvements: string[];
  modelAnswer: string;
}

// Object wrapper (matching the other AI clients) so tests can swap this for a
// fake without needing a live model.
export const aiWritingClient = {
  async analyze(
    prompt: string,
    studentText: string,
    difficultyLevel: string,
    targetLanguage: string = "english",
  ): Promise<WritingAnalysisResult> {
    const res = await fetch(`${AI_SERVICE_URL}/v1/writing/analyze`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt, studentText, difficultyLevel, targetLanguage }),
    });
    if (!res.ok) throw new Error(`AI service returned ${res.status}`);
    return (await res.json()) as WritingAnalysisResult;
  },
};
