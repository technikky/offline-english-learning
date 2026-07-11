const AI_SERVICE_URL = process.env.AI_SERVICE_URL ?? "http://127.0.0.1:8100";

export interface ExplainResult {
  explanation: string;
  example: string;
}

/** Object wrapper (matching languageToolClient's pattern) so tests can swap
 * `aiExplainClient.explain` for a fake without needing a live AI service. */
export const aiExplainClient = {
  async explain(
    originalText: string,
    correctedText: string,
    ruleDescription: string,
    difficultyLevel: string,
  ): Promise<ExplainResult> {
    const res = await fetch(`${AI_SERVICE_URL}/v1/grammar/explain`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        originalText,
        correctedText,
        ruleDescription,
        difficultyLevel,
      }),
    });

    if (!res.ok) {
      throw new Error(`AI service returned ${res.status}`);
    }

    return (await res.json()) as ExplainResult;
  },
};
