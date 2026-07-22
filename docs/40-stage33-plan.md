# Stage 33 Implementation Plan — Curated CEFR vocabulary wordlist

## Objective

Close the largest remaining content gap. The only "wordlist" in the system was `commonWords.ts` — a **75-word stoplist** — which left two things weak and one opportunity unused:

1. **Vocabulary recommendations were a crude heuristic**: "7+ letters and not a stopword". That flags any long word regardless of whether it is worth learning — *restaurant* and *yesterday* scored the same as *inevitable*.
2. **The spaced-repetition notebook (Stage 25) had nothing to seed from.** A learner only ever got cards for words they happened to look up, so the single most effective retention mechanism in the platform sat idle until they went hunting for words themselves.
3. Every vocabulary definition came from a **1.5B model**, even for completely ordinary words.

## The list

`vocabulary/wordlist.ts` — **160 curated entries**, each with an authored definition, a natural example, synonyms and antonyms:

| A1 | A2 | B1 | B2 | C1 | C2 | total |
|---|---|---|---|---|---|---|
| 30 | 30 | 30 | 30 | 25 | 15 | **160** |

It is deliberately a *core* list, not a dictionary: high-frequency, high-utility words a learner actually needs at each level. Extending it is appending to the array.

## Three payoffs

### 1. Curated words skip the LLM entirely

`lookupOrCreateVocabulary()` now checks the wordlist first. A hit uses the authored definition — **instant, and far more reliable than a 1.5B model's guess** — with the AI remaining the fallback for anything outside the list. The embedding is still generated either way, since similar-word search depends on it.

### 2. Recommendations are CEFR-graded, not length-guessed

`isWorthRecommending(word, studentLevel)` now asks the list directly: a word is worth recommending if it is graded **at or above** the student's level. Words graded below are skipped as already-known; words absent from the list fall back to the old length heuristic so genuinely rare vocabulary is still surfaced.

`rankCandidates()` then orders them so graded words (which carry an authored definition) come before ungraded guesses, and within those, words closest to the student's own level come first — so a B1 learner is offered a B2 word before a C2 one.

### 3. The SRS deck can be seeded

New `POST /vocabulary/notebook/seed` adds a level's starter pack straight into the notebook, where the Stage 25 scheduler makes every new card **due immediately**. A learner now has something to practise on day one instead of an empty deck. Seeding is idempotent — words already saved are skipped and reported, not duplicated — and capped at 30 per call.

New `GET /vocabulary/wordlist?level=` browses the list, marking which words the student has already saved.

## Desktop UI

A **"Starter word pack"** panel in the Review tab: pick a level and a size (5/10/20), press *Add to deck*, and the review badge and notebook refresh immediately.

## Testing procedure

- **List integrity** (`vocabulary/wordlist.test.ts`, 10): every CEFR level covered; words unique and lowercase; **every entry's example actually contains the word** (allowing inflections) and has a real definition; case-insensitive lookup.
- **Grading behaviour** — the point of having the list: a word *below* the student's level is not recommended; at/above is; the length fallback still catches ungraded words; stopwords are never recommended; graded words rank ahead of ungraded ones nearest-level-first; and a long ordinary word (*restaurant*) no longer outranks genuinely useful vocabulary (*significant*).
- **Routes** (`routes/vocabulary.test.ts`, +4): the wordlist is browsable per level and marks saved words; seeding fills the deck and those cards are **immediately due**; re-seeding skips duplicates and adds different words; an invalid level gives 400; and a curated word is defined **without calling the LLM** (the fake AI client would have returned a placeholder definition — the authored one wins).

Full suites: **backend 180 tests passing** (+14), AI service 80 pytest passing; backend `tsc` clean; types build clean; `renderer.js` passes `node --check`.

## Honest limitations

- 160 words is a solid core, not comprehensive coverage — a full CEFR-graded lexicon runs to several thousand. The structure makes growth cheap, but the current list will not cover most words a learner meets in the wild; those still fall through to the AI path.
- Grading is editorial judgement, not derived from a frequency corpus. A word's assigned level is defensible but not empirically validated.
- The list is **English only**. Chinese still has no HSK vocabulary seed, so Chinese learners get neither the seeding nor the improved recommendations.

## Git

- Commit: `Stage 33: Curated CEFR vocabulary wordlist`
- Tag: `v1.21.0`
- CHANGELOG entry added.
