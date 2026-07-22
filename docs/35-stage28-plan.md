# Stage 28 Implementation Plan — Chinese as a target language

## Objective

Make the platform teach **Mandarin Chinese**, not only English — the first stage of the "Tier 2" work from the platform gap analysis. Until now every layer was English-only: content, catalogs, the curriculum path, and the AI conversation partner.

This stage deliberately covers everything that needs **no new vendored assets**. Chinese *listening* and *pronunciation* are blocked on new speech models (a multilingual Whisper and a Chinese Piper voice) and are therefore explicitly out of scope here — see "Deferred" below.

## The key asset: the bundled model already speaks Chinese

The vendored LLM is **Qwen** (Qwen2.5-1.5B by default, Qwen3-8B optional) — a Chinese-native model family. So Chinese conversation, and later Chinese exercise/comprehension generation, are a **prompting change, not a new model**. That is what makes this stage cheap.

## Design decisions

### 1. CEFR stays the internal scale; HSK is a label

Rather than introduce a parallel proficiency scale (which would touch every level-typed field in the platform), Chinese reuses the existing **CEFR bands internally** and simply *displays* the HSK equivalent (`A1→HSK 1` … `C2→HSK 6`, see `HSK_LABELS`/`levelLabel` in the types package). Placement, difficulty estimation, curriculum ordering and progress all keep working untouched.

### 2. Globally unique content ids across languages

Chinese content ids are prefixed (`zh-`, `zh-read-`). Because ids are unique across languages, **lookups stay language-agnostic** (`getGrammarTopic`/`getReadingPassage` search every catalog) and only *listing* takes a language argument. This kept the change to four call sites instead of threading a language parameter through every module.

### 3. Content is curated, with pinyin built in

`chinese/grammar.ts` (7 topics, A1–B2) and `chinese/passages.ts` (3 passages, A1–B1) are authored, matching the rationale for the English curriculum and passages (Stages 14/15). Grammar examples carry pinyin and an English gloss **inline** (`我喝茶。(Wǒ hē chá.) — I drink tea.`), which needed no new rendering. Reading passages carry separate `pinyin` and `translation` fields revealed by toggles — for a passage, inline pinyin after every sentence would be unreadable, and a learner who can't yet read hanzi is otherwise stuck.

### 4. Target language lives on the user

`users.target_language` (`'english' | 'chinese'`, default `'english'`, additive migration with a constant default so existing rows need no backfill). `getTargetLanguage()` is the single accessor used by the content catalogs, the curriculum path and the conversation route.

## Architecture changes

- **Types**: `TargetLanguage`, `TARGET_LANGUAGE_LABELS`, `HSK_LABELS`, `levelLabel()`; `UserProfile.targetLanguage`; optional `language`/`pinyin`/`translation` on reading passages and `language` on grammar topics (all additive).
- **Routes**: `GET`/`PUT /me/language`. Unknown language → 400.
- **Language-aware listings**: `/grammar/topics`, `/reading/passages`, plus grammar and reading progress, now serve the learner's language.
- **Curriculum**: `COURSES` keyed by language; `getCourse(language)`; `buildCurriculum(..., language)`. `GET /curriculum` returns the Chinese path (`中文 Chinese: HSK 1 to HSK 4`, 4 units) for Chinese learners.
- **Conversation**: `targetLanguage` flows backend → AI service → `build_system_prompt`. For Chinese, `build_chinese_language_instructions()` puts the language directive *first* so it dominates the English-authored scenario text, requires simplified characters plus pinyin and a gloss on every line, pitches vocabulary at the matching HSK band, and forbids replying only in English. Teacher-authored custom topics still apply.
- **Desktop UI**: an "I'm learning" selector in the sidebar (switching reloads every content view); HSK level labels throughout the path and reading for Chinese learners; pinyin/translation toggles on passages; slightly larger type/leading for Chinese text.

## Deferred (and why)

| Item | Blocker |
|---|---|
| Chinese **listening** | Needs a Chinese Piper voice (`zh_CN-huayan-medium`, ~60 MB) to synthesise clips |
| Chinese **pronunciation / speech input** | Bundled Whisper is `ggml-tiny.en` — **English-only**; needs a multilingual `base`/`small` (~150 MB/500 MB) |
| Chinese **writing prompts & quizzes** | Prompt/category content is still English-specific; straightforward follow-up |
| Chinese **vocabulary seed** (HSK wordlists) | Content authoring; the notebook already works for Chinese via AI lookup |
| **CJK font bundling** | Renders fine on Windows via system fonts; bundling Noto Sans SC guarantees it elsewhere |
| **UI translation (i18n)** | Interface language is a separate concern from the studied language; the UI stays English for now |

The C1/C2 end of the Chinese path is also unbuilt — the course currently runs HSK 1–4 (A1–B2).

## Testing procedure

- **Backend** (`routes/language.test.ts`, 5): English is the default; switching to Chinese persists and reads back; an unknown language → 400; the **grammar topic list** flips catalogs with the setting; the **curriculum path** flips to the Chinese course.
- **Reference integrity** (`curriculum/course.test.ts`, now 4): the existing guards run over **every** language's course, plus a new test asserting the Chinese course only references content actually tagged `language: "chinese"` — so an English passage can never leak into the Chinese path.
- **AI service** (`tests/test_target_language.py`, 6): English is unchanged and is the default; explicit English is identical to the default; Chinese switches the tutor to Mandarin with simplified characters and pinyin; CEFR→HSK mapping including an unknown-level fallback; a teacher custom topic still survives in Chinese mode.
- Full suites: **backend 139 tests passing** (+6), **AI service 53 pytest passing** (+6); backend `tsc` clean; types build clean; `renderer.js` passes `node --check`.

## Git

- Commit: `Stage 28: Chinese as a target language`
- Tag: `v1.16.0`
- CHANGELOG entry added.
