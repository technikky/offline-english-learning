const LANGUAGE_TOOL_URL = process.env.LANGUAGE_TOOL_URL ?? "http://127.0.0.1:8081";

export interface GrammarMatch {
  originalText: string;
  correctedText: string;
  ruleId: string;
  ruleDescription: string;
  category: string;
}

interface LanguageToolResponse {
  matches: Array<{
    offset: number;
    length: number;
    replacements: Array<{ value: string }>;
    rule: {
      id: string;
      description: string;
      category: { name: string };
    };
  }>;
}

/** Wrapped in an object (rather than a bare exported function) so tests can
 * swap `languageToolClient.check` for a fake without needing a live Java
 * process — see docs/08-stage5-plan.md. */
export const languageToolClient = {
  async check(text: string): Promise<GrammarMatch[]> {
    const res = await fetch(`${LANGUAGE_TOOL_URL}/v2/check`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ language: "en-US", text }),
    });

    if (!res.ok) return [];

    const data = (await res.json()) as LanguageToolResponse;

    return data.matches
      .filter((match) => match.replacements.length > 0)
      .map((match) => ({
        originalText: text.slice(match.offset, match.offset + match.length),
        correctedText: match.replacements[0].value,
        ruleId: match.rule.id,
        ruleDescription: match.rule.description,
        category: match.rule.category.name,
      }));
  },
};
