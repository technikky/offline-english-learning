import type { GrammarMistakeDto } from "@englishclass/types";
import { db } from "../db/client";
import { grammarMistakes } from "../db/schema";
import { languageToolClient } from "./languageToolClient";

/** Runs LanguageTool over a message's text and persists any detected
 * mistakes against it. Extracted from the conversation route so it can be
 * unit-tested (with a faked languageToolClient) without needing the
 * hijacked streaming response around it — see docs/08-stage5-plan.md. */
export async function checkAndPersistGrammar(
  messageId: number,
  content: string,
): Promise<GrammarMistakeDto[]> {
  const matches = await languageToolClient.check(content);

  return Promise.all(
    matches.map(async (match) => {
      const [row] = await db
        .insert(grammarMistakes)
        .values({
          messageId,
          originalText: match.originalText,
          correctedText: match.correctedText,
          ruleId: match.ruleId,
          ruleDescription: match.ruleDescription,
          category: match.category,
        })
        .returning();

      return {
        id: row.id,
        originalText: row.originalText,
        correctedText: row.correctedText,
        ruleId: row.ruleId,
        ruleDescription: row.ruleDescription,
        category: row.category,
        explanation: row.explanation,
        example: row.example,
      };
    }),
  );
}
