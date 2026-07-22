# Stage 31 Implementation Plan — Chinese writing prompts & quiz categories

## Objective

Close the last two English-only modules for Chinese learners. After Stage 30, a Chinese student had grammar, reading, listening, conversation and tone-scored pronunciation — but **Writing** still served English prompts, and **Quiz** still offered "Everyday English" as a category. Both now follow the learner's language, which means **every Chinese course unit covers all six lesson types**.

## Writing

### Curated Chinese prompts

`chinese/prompts.ts` adds four scaffolded prompts (A1–B2: 我的家, 我的周末, 我住的城市, 学外语的看法), each with target vocabulary given as 汉字 + pinyin + gloss, a Chinese-specific grammar focus (measure words, 了, 比, 得), and hints written bilingually so a beginner can act on them.

### A third latent English-only bug

Following the same pattern as Stages 29 and 30, adding Chinese exposed another place where the code silently assumed English:

**`countWords()` splits on whitespace — and Chinese is written without spaces**, so an entire Chinese essay counted as **1 word**. Every Chinese submission would have looked hopelessly short of its length target, and the stored `wordCount` would have been meaningless.

Fixed with `countWritingUnits(text, language)`: English keeps word counting; Chinese counts **characters (字数)**, which is how Chinese writing length is conventionally measured. Punctuation is excluded. Chinese prompt targets are expressed in characters and are deliberately smaller than the English word targets, because a character carries more than a word does. The desktop live counter mirrors this and relabels itself "characters".

### LanguageTool is skipped for Chinese

The vendored LanguageTool is an **English rule set**. Running it over 汉字 produces noise rather than corrections, so it is now skipped entirely for Chinese and those submissions get the LLM analysis only. (The existing "degrade gracefully if LanguageTool is down" path already handles an empty mistake list, so nothing else changed.)

### Chinese-specific writing feedback

`_build_chinese_writing_analysis_prompt()` is deliberately not a translation of the English one. It targets the mistakes Chinese learners actually make — wrong or missing measure words, confusing 的/得/地, misplaced 了, time/place before the verb, overusing 是, and homophone character errors. **Feedback is written in English** so a beginner can read it, while the model answer is returned **in Chinese**. The marker format (`OVERALL:`/`GRAMMAR:`/…) is preserved exactly, since the response parser is marker-based.

## Quiz

Categories are now per language:

| | categories |
|---|---|
| English | `grammar`, `vocabulary`, `everyday_english` |
| Chinese | `grammar`, `vocabulary`, `everyday_chinese`, **`characters`** |

`everyday_english` is meaningless to a Chinese learner, and Chinese needs a category English has no equivalent of: **`characters`**, testing 汉字 meaning, radicals (部首), visually-similar characters, and character↔pinyin matching.

Validation is scoped to the learner's language (`isValidQuizCategory(value, language)`), so a Chinese learner requesting `everyday_english` gets a 400. Generation is language-aware too: the Chinese quiz writer produces questions in simplified characters **with pinyin appended**, while keeping `True`/`False` in English so the marker-based parser can still match answers. New `GET /quiz/categories` drives the dropdown instead of hardcoded markup.

## Course completeness

Writing and quiz lessons were added to all four Chinese units. The new "every Chinese unit covers all six lesson types" test then failed on the B2 unit, which had no reading or listening content — so rather than weaken the assertion, **two new B2 items were authored**: a reading passage (手机改变了生活, with pinyin and translation) and a listening clip (垃圾分类). The Chinese course is now complete across HSK 1–4.

## Testing procedure

- **Backend** (`writing/chineseWriting.test.ts`, 9): documents that the English word counter collapses Chinese to one "word"; Chinese counts characters excluding punctuation; English counting is unchanged; prompts list per language; lookup stays language-agnostic; Chinese targets are character-scale. Plus quiz categories differ per language, validation is language-scoped (`everyday_english` invalid for Chinese, `characters` invalid for English), and an unknown language falls back to English.
- **Reference integrity** (`curriculum/course.test.ts`): quiz categories are now validated **per language**; the Chinese-content guard extends to listening clips and writing prompts; and a new test asserts every Chinese unit covers all six lesson types.
- **AI service** (`tests/test_chinese_quiz_writing.py`, 9): English quiz/writing prompts are unchanged and remain the default; the Chinese quiz is in simplified characters with pinyin and keeps TRUE/FALSE parseable; Chinese grammar guidance targets measure words rather than articles; `characters` exists only for Chinese; Chinese writing feedback targets Chinese mistakes, is written in English with a Chinese model answer, **keeps every response marker**, and includes both the level and the student's text.
- Full suites: **backend 161 tests passing** (+9), **AI service 80 pytest passing** (+9); backend `tsc` clean; types build clean; `renderer.js` passes `node --check`.

## Still outstanding for Chinese

An HSK vocabulary seed, CJK font bundling (renders fine on Windows via system fonts), UI translation (i18n), and HSK 5–6 content. Tone scoring remains whole-phrase rather than per-syllable, and its thresholds are still calibrated on synthesized rather than real learner audio (see docs/37-stage30-plan.md).

## Git

- Commit: `Stage 31: Chinese writing prompts and quiz categories`
- Tag: `v1.19.0`
- CHANGELOG entry added.
