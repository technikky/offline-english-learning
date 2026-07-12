// Shared word-level similarity scoring, used by both pronunciation scoring
// (Stage 9) and listening dictation (Stage 17). Extracted so the two don't
// each carry their own copy of the Levenshtein logic.

export function normalizeWords(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9'\s]/g, "")
    .split(/\s+/)
    .filter((w) => w.length > 0);
}

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

/** 0-100 word-level similarity of `attempt` against `target` (case- and
 * punctuation-insensitive). 100 = identical word sequences. */
export function scoreTextSimilarity(target: string, attempt: string): number {
  const targetWords = normalizeWords(target);
  const attemptWords = normalizeWords(attempt);

  if (targetWords.length === 0) return 0;

  const distance = wordLevenshteinDistance(targetWords, attemptWords);
  const maxLength = Math.max(targetWords.length, attemptWords.length);
  return Math.max(0, Math.round((1 - distance / maxLength) * 100));
}
