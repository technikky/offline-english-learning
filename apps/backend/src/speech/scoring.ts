function normalizeWords(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9'\s]/g, "")
    .split(/\s+/)
    .filter((w) => w.length > 0);
}

/** Word-level Levenshtein distance — a proxy for "how close was the spoken
 * attempt to the target phrase," not a phoneme-level pronunciation scorer
 * (that's a different, more specialized model; see docs/12-stage9-plan.md). */
function wordLevenshteinDistance(a: string[], b: string[]): number {
  const rows = a.length + 1;
  const cols = b.length + 1;
  const dp: number[][] = Array.from({ length: rows }, () => new Array(cols).fill(0));

  for (let i = 0; i < rows; i++) dp[i][0] = i;
  for (let j = 0; j < cols; j++) dp[0][j] = j;

  for (let i = 1; i < rows; i++) {
    for (let j = 1; j < cols; j++) {
      if (a[i - 1] === b[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
      }
    }
  }

  return dp[rows - 1][cols - 1];
}

export interface PronunciationScore {
  accuracyScore: number;
  feedback: string;
}

export function scorePronunciation(targetPhrase: string, transcript: string): PronunciationScore {
  const targetWords = normalizeWords(targetPhrase);
  const transcriptWords = normalizeWords(transcript);

  if (targetWords.length === 0) {
    return { accuracyScore: 0, feedback: "No target phrase to compare against." };
  }

  const distance = wordLevenshteinDistance(targetWords, transcriptWords);
  const maxLength = Math.max(targetWords.length, transcriptWords.length);
  const accuracyScore = Math.round((1 - distance / maxLength) * 100);

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

  return { accuracyScore: Math.max(0, accuracyScore), feedback };
}
