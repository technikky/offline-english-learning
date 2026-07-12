import { normalizeWords, scoreTextSimilarity } from "./textSimilarity";

export interface PronunciationScore {
  accuracyScore: number;
  feedback: string;
}

/** Word-level similarity as a proxy for "how close was the spoken attempt to
 * the target phrase," not a phoneme-level pronunciation scorer (that's a
 * different, more specialized model; see docs/12-stage9-plan.md). */
export function scorePronunciation(targetPhrase: string, transcript: string): PronunciationScore {
  if (normalizeWords(targetPhrase).length === 0) {
    return { accuracyScore: 0, feedback: "No target phrase to compare against." };
  }

  const accuracyScore = scoreTextSimilarity(targetPhrase, transcript);

  let feedback: string;
  if (accuracyScore >= 95) {
    feedback = "Excellent! Your pronunciation matched the target phrase closely.";
  } else if (accuracyScore >= 75) {
    feedback = "Good attempt — a few words differed from the target phrase.";
  } else if (accuracyScore >= 50) {
    feedback = "Some words were unclear or different. Try speaking a bit slower and clearer.";
  } else {
    feedback = "The recording didn't match the target phrase well. Try again in a quiet room.";
  }

  return { accuracyScore, feedback };
}
