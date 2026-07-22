const AI_SERVICE_URL = process.env.AI_SERVICE_URL ?? "http://127.0.0.1:8100";

export interface AiChatMessage {
  role: "user" | "assistant";
  content: string;
}

/** Returns the raw streaming fetch Response; the caller forwards its body
 * to the client while also parsing it to capture the final assistant text. */
export function requestAiChatStream(
  messages: AiChatMessage[],
  scenario: string,
  difficultyLevel: string,
  customPrompt?: string | null,
  targetLanguage: string = "english",
): Promise<Response> {
  return fetch(`${AI_SERVICE_URL}/v1/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      messages,
      scenario,
      difficultyLevel,
      customPrompt: customPrompt ?? null,
      // Stage 28: makes the AI partner converse in the student's target language.
      targetLanguage,
    }),
  });
}
