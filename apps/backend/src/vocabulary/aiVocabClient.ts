const AI_SERVICE_URL = process.env.AI_SERVICE_URL ?? "http://127.0.0.1:8100";

export interface VocabularyExplainResult {
  definition: string;
  example: string;
  synonyms: string[];
  antonyms: string[];
  cefrLevel: string;
}

/** Object wrapper (matching aiExplainClient/languageToolClient) so tests can
 * swap these for fakes without needing a live AI service. */
export const aiVocabClient = {
  async explain(word: string, difficultyLevel: string): Promise<VocabularyExplainResult> {
    const res = await fetch(`${AI_SERVICE_URL}/v1/vocabulary/explain`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ word, difficultyLevel }),
    });
    if (!res.ok) throw new Error(`AI service returned ${res.status}`);
    return (await res.json()) as VocabularyExplainResult;
  },

  async embed(text: string): Promise<number[]> {
    const res = await fetch(`${AI_SERVICE_URL}/v1/embed`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });
    if (!res.ok) throw new Error(`AI service returned ${res.status}`);
    const data = (await res.json()) as { embedding: number[] };
    return data.embedding;
  },
};
