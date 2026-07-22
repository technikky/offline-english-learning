# Stage 32 Implementation Plan — English content depth

## Objective

Raise the ceiling on how far a learner can actually get in English. The platform's machinery (path, SRS, placement, tone scoring) was well ahead of its *content*: a learner could exhaust an entire CEFR level in one sitting, the C1 unit was incomplete, and **C2 did not exist at all** — so the "advanced" end of "beginner to advanced" was unreachable by construction.

## The gap, measured

Before this stage:

| module | A1 | A2 | B1 | B2 | C1 | C2 | total |
|---|---|---|---|---|---|---|---|
| grammar | 2 | 2 | 2 | 2 | 1 | **0** | 9 |
| reading | 1 | 1 | 1 | 1 | 1 | **0** | 5 |
| listening | 1 | 1 | 1 | 1 | **0** | **0** | 4 |
| writing | 1 | 1 | 1 | 1 | **0** | **0** | 4 |

Three distinct problems: **C2 was entirely absent**, **C1 was incomplete** (no listening, no writing), and **every level had exactly one reading passage**, so there was nothing to move on to within a level.

## After

| module | A1 | A2 | B1 | B2 | C1 | C2 | total |
|---|---|---|---|---|---|---|---|
| grammar | 2 | 2 | 3 | 2 | 2 | 2 | **13** |
| reading | 2 | 2 | 2 | 2 | 2 | 1 | **11** |
| listening | 1 | 1 | 2 | 1 | 1 | 1 | **7** |
| writing | 1 | 1 | 1 | 2 | 1 | 1 | **7** |

**38 items, up from 22.** Every CEFR level A1–C2 now has content in every content module.

## What was authored

**Grammar (+4)** — chosen to fill genuine syllabus gaps rather than pad counts:
- **B1 Gerunds and Infinitives** — a conspicuous absence; verb complementation is a core B1 point, including the meaning-changing pairs (*stop smoking* / *stop to smoke*).
- **C1 Inversion for Emphasis** — the formal fronted-negative structure.
- **C2 Cleft Sentences** — controlling emphasis without changing words.
- **C2 Hedging and Nuanced Modality** — arguably the single most important C2 skill for academic and professional writing: knowing how strongly to state a claim.

**Reading (+6)** — a second passage at A1, A2, B1, B2 and C1, plus the first C2 text. The new C1/C2 pieces are deliberately argumentative rather than descriptive ("The Language of Machines", "The Paradox of Choice"), since what distinguishes reading at that level is following a developed argument, not decoding vocabulary.

**Listening (+3)** — a second B1 clip (a public announcement, a distinct register from conversation), a C1 interview with turn-taking and hedged speech, and a C2 conference-talk opening with concessive, self-qualifying discourse.

**Writing (+3)** — a B2 formal complaint (transactional register), a C1 balanced argument (discuss-both-views, the standard C1 exam task), and a C2 critical review, whose grammar focus deliberately reuses the two new C2 grammar points.

## Course changes

The English course is now **`English: A1 to C2` — 6 units, 50 lessons** (was 5 units, 33). The new content was wired in, `unit-c1` was completed to all six lesson types, and a new **`unit-c2` ("Mastery")** was added. Every unit of every course now covers all six lesson types.

Because the curriculum is a read-time overlay (Stage 27), all of this counts retroactively: a student who already read a passage sees it ticked off in the expanded path with no migration.

## Testing procedure

New `curriculum/contentCoverage.test.ts` (5) turns the content-depth goals into assertions that fail if content regresses:
- every English content module has content at **every** CEFR level A1–C2;
- the English path runs **one unit per level, A1 through C2**;
- every unit of **every** course (English and Chinese) covers all six lesson types;
- **no level is a dead end** — A1–C1 each have at least two reading passages;
- content ids stay unique within each module.

Full suites: **backend 166 tests passing** (+5), AI service 80 pytest passing; backend `tsc` clean; types build clean.

## Still outstanding

A seeded CEFR-graded vocabulary wordlist remains the largest English content gap — `commonWords.ts` is still a 75-word stoplist, so vocabulary recommendations stay a crude heuristic and the SRS notebook has nothing to seed from. Listening remains the thinnest module (7 items), and quiz questions are still generated rather than curated.

## Git

- Commit: `Stage 32: English content depth`
- Tag: `v1.20.0`
- CHANGELOG entry added.
