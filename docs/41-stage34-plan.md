# Stage 34 Implementation Plan — HSK vocabulary wordlist

## Objective

Close the last major asymmetry between the two languages. Stage 33 gave English learners a curated CEFR wordlist, which unlocked three things: LLM-free definitions, CEFR-graded recommendations, and SRS deck seeding. **Chinese learners got none of them** — and, as it turned out, were getting no vocabulary recommendations at all.

## The list

`chinese/wordlist.ts` — **120 curated HSK-graded entries**, mapped onto the platform's internal CEFR scale (A1=HSK1 … C2=HSK6):

| A1/HSK1 | A2/HSK2 | B1/HSK3 | B2/HSK4 | C1/HSK5 | C2/HSK6 | total |
|---|---|---|---|---|---|---|
| 25 | 25 | 25 | 20 | 15 | 10 | **120** |

Entries are 词 (words), not single characters, except where the single character genuinely *is* the everyday word (吃, 看, 家). The C2 band deliberately includes 成语 (四字成语 such as 不言而喻, 归根结底, 举足轻重), since idiom is what actually separates advanced Mandarin from merely correct Mandarin.

**Pinyin is carried inline** at the front of each definition (`nǔlì — to work hard`), and every example is written as `中文。(Pīnyīn.) — English.` This is the same convention as the Chinese grammar curriculum, and it means entries survive being stored in the `vocabulary` table **with no pinyin column and no migration**.

## The fourth latent English-only bug

Wiring Chinese in exposed another function that silently assumed English — the fourth in this family (after the tokenizer and sentence splitter in Stage 29, and the word counter in Stage 31):

**`extractCandidateWords()` matched candidates with `/[a-z']+/g`, which matches _nothing_ in 汉字.** Chinese learners therefore received **zero vocabulary recommendations, ever** — silently, with no error.

Demonstrated on a realistic AI reply, `我觉得这个问题很重要。我们应该努力解决，而不是放弃。`:

- before: `null` — no candidates at all
- after: 觉得(A2), 问题(A2), 努力(B1), 应该(B1), 重要(B1), 解决(B2), 放弃(B2)

The fix uses **dictionary matching against the curated HSK list**, longest-word-first so 影响力 is preferred over the 影响 inside it. Chinese has no whitespace to split on, so the curated list *is* the segmenter for the words we care about. Two related rules changed with it:

- The **English stoplist** (`COMMON_WORDS`, latin-only) is no longer consulted for Chinese, where it is meaningless.
- The **length fallback** does not apply to Chinese: a long run of characters is not evidence of a word worth learning, so an ungraded Chinese string is never recommended. Chinese candidates come only from the curated list.

## Reused with no new plumbing

Because Stage 33 built the integrations generically, all three now work for Chinese by making the catalog language-aware:

1. **LLM-free definitions** — `lookupOrCreateVocabulary()` already consulted `getWordlistEntry()`, which now searches both lists. Looking up 努力 returns the authored `nǔlì — to work hard` instead of a 1.5B model's guess.
2. **Graded recommendations** — `isWorthRecommending(word, level, language)`.
3. **SRS seeding** — `POST /vocabulary/notebook/seed` seeds from the learner's own language list.

Lookups stay **language-agnostic** (the Stage 28 rule): hanzi and latin cannot collide, so `getWordlistEntry` searches every catalog and only *listing* takes a language argument.

## Desktop UI

The "Starter word pack" level dropdown now relabels itself with HSK bands for Chinese learners (`HSK 1 — Beginner`), consistent with level labelling everywhere else, and the confirmation message uses the same label.

## Testing procedure

- **List integrity** (`chinese/wordlist.test.ts`, 8): every level covered; every entry is hanzi, tagged `chinese`, carries a pinyin gloss, and has an example containing both the word and pinyin; the two language lists never leak into each other; lookup is language-agnostic.
- **The extraction fix**: Chinese words below the learner's level are not recommended; at/above are; an unknown Chinese string is **never** recommended by length; and the English stoplist does not suppress Chinese words.
- **Routes** (`routes/vocabulary.test.ts`, +3): the wordlist served follows the learner's language; a Chinese learner seeds their deck with Chinese words that are immediately due; and a curated Chinese word is defined **without calling the LLM**.

Full suites: **backend 191 tests passing** (+11), AI service 80 pytest passing; backend `tsc` clean; types build clean; `renderer.js` passes `node --check`.

## Honest limitations

- 120 words is a core list. Real HSK 1–6 runs to roughly 5,000 words; this covers the highest-utility slice per band.
- Levels are my mapping of HSK onto CEFR, which is conventional but approximate — HSK 4 and B2 are not exactly equivalent.
- Dictionary-matching segmentation only finds words **already in the list**. A proper segmenter (jieba) would find the rest, but would mean vendoring a Python wheel; the curated list covers the words the platform can actually teach.

## Git

- Commit: `Stage 34: HSK vocabulary wordlist`
- Tag: `v1.22.0`
- CHANGELOG entry added.
