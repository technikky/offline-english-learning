# Stage 35 Implementation Plan — HSK 5–6 course units

## Objective

Remove the last structural ceiling in the platform. Stage 32 fixed exactly this problem for English (the path stopped at C1); Chinese had the same flaw, worse — **the Chinese path stopped at HSK 4 (B2), two whole bands below where the English path reached.** A Chinese learner literally could not be taken to an advanced level, however well they did.

Stage 34 had already built the HSK 5–6 *vocabulary*, so the wordlist covered C1/C2 while grammar, reading, listening and writing were all zero there. That gap is what this stage closes.

## The gap, measured

Before:

| Chinese module | A1 | A2 | B1 | B2 | C1 | C2 |
|---|---|---|---|---|---|---|
| grammar | 2 | 2 | 2 | **1** | **0** | **0** |
| reading | 1 | 1 | 1 | 1 | **0** | **0** |
| listening | 1 | 1 | 1 | 1 | **0** | **0** |
| writing | 1 | 1 | 1 | 1 | **0** | **0** |
| wordlist | 25 | 25 | 25 | 20 | 15 | 10 |

After: **2 / 1 / 1 / 1 at every level A1–C2**, and the course runs **HSK 1 to HSK 6, 6 units, 42 lessons**, every unit covering all six lesson types — matching the English A1–C2 ladder.

## What was authored

**Grammar (+5)** — chosen for what genuinely distinguishes advanced Mandarin, not just harder words:

- **B2 · The 被 Passive** — completes B2, which had only one grammar point. Includes the traditional "unfortunate event" connotation and the spoken 让/叫 alternatives.
- **C1 · Resultative and Potential Complements** — 看得懂 / 看不懂. Critically, the distinction from 能: 我不能看 means *not permitted*, 我看不懂 means *lacking the ability*. Getting this right is a clear marker of advanced control.
- **C1 · Formal Connectives (书面语)** — 由于 for 因为, 然而 for 但是, 因此/从而 for 所以, plus paired 不仅…而且…. This is what makes an essay read as written Chinese rather than transcribed speech.
- **C2 · 成语** — four-character idioms as single lexical units, *including the discipline of using them sparingly*: one or two per paragraph, and only where the register is certain.
- **C2 · 书面语 vs 口语 register** — 之/者/若/已/均/与 versus their spoken equivalents. Mixing registers is the most common thing that marks otherwise-fluent writing as non-native; the skill is consistency, not vocabulary.

**Reading (+2)**, **listening (+2)**, **writing (+2)** — all argumentative rather than descriptive, because at HSK 5–6 the difficulty is following and building an argument, not decoding characters. The C2 reading (语言与思维) deliberately closes on a reflexive point about observation being shaped by its instrument; the C2 listening is an academic lecture opening full of concessive self-qualification.

### One deliberate decision: no pinyin at C1/C2

The HSK 5–6 reading passages carry a **translation but no pinyin**, unlike the HSK 1–4 set. At this level a learner reads characters directly, and full-passage romanisation sustains exactly the crutch they need to drop. The reader already hides the pinyin toggle when the field is absent, so this degrades cleanly with no UI change.

## Course changes

Two new units, both with all six lesson types:

- **`unit-zh-c1` — 分析与论证 (Analysis & Argument)**
- **`unit-zh-c2` — 语言的精通 (Mastery of Register)**

The 被 passive was also added to `unit-zh-b2`. The course title becomes `中文 Chinese: HSK 1 to HSK 6`.

Because the curriculum is a read-time overlay (Stage 27), existing Chinese progress ticks off in the expanded path with no migration.

## Testing procedure

`curriculum/contentCoverage.test.ts` gains two assertions that lock in parity with English:

- **Chinese has content at every CEFR level in every content module** — this is the test that would have failed before this stage.
- **The Chinese path runs one unit per band, HSK 1 through HSK 6.**

The pre-existing guards then cover the rest automatically: every unit of *every* course covers all six lesson types, and every lesson's `refId` resolves against the real content modules (so a typo in the new units fails the suite rather than shipping a dead lesson).

Full suites: **backend 193 tests passing** (+2), AI service 80 pytest passing; backend `tsc` clean; types build clean.

## Honest limitations

- One reading / listening / writing item per Chinese level, versus two reading passages per level in English. Chinese is now *complete* but still thinner than English — a learner can exhaust an HSK band's reading in one sitting.
- The HSK→CEFR mapping remains conventional but approximate.
- Chinese quiz questions are still AI-generated rather than curated, as in English.

## Git

- Commit: `Stage 35: HSK 5-6 course units`
- Tag: `v1.23.0`
- CHANGELOG entry added.
