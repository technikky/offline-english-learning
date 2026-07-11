const AI_SERVICE_URL = process.env.AI_SERVICE_URL ?? "http://127.0.0.1:8100";

/** Object wrapper (matching aiVocabClient/aiExplainClient/languageToolClient)
 * so tests can swap these for fakes without needing live Whisper/Piper models. */
export const aiSpeechClient = {
  async transcribe(audioBase64: string): Promise<string> {
    const res = await fetch(`${AI_SERVICE_URL}/v1/speech/transcribe`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ audioBase64 }),
    });
    if (!res.ok) throw new Error(`AI service returned ${res.status}`);
    const data = (await res.json()) as { transcript: string };
    return data.transcript;
  },

  async synthesize(text: string): Promise<string> {
    const res = await fetch(`${AI_SERVICE_URL}/v1/speech/synthesize`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });
    if (!res.ok) throw new Error(`AI service returned ${res.status}`);
    const data = (await res.json()) as { audioBase64: string };
    return data.audioBase64;
  },
};
