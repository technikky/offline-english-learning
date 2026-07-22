# Stage 36 Implementation Plan — Interface translation (i18n)

## Objective

Make the interface itself available in Chinese. Every UI string was hardcoded English, which matters directly for the schools this platform targets: a Chinese-speaking student learning English had to navigate an entirely English interface to do so.

## The central design decision: interface language ≠ target language

These are **two independent settings**, and conflating them would make the app unusable for its main audience:

| user | interface | learning |
|---|---|---|
| Chinese student in a Chinese school studying English | **中文** | English |
| English speaker studying Mandarin | **English** | Chinese |

So `users.ui_locale` (`'en' | 'zh'`) is a separate column from `users.target_language`, with its own `GET`/`PUT /me/locale`. A test asserts the two are genuinely orthogonal in both directions: changing the interface must not change what the student is learning, and vice versa.

## Approach: attribute markup, not a rewrite

Strings live **client-side** in `apps/desktop/src/i18n.js` rather than being fetched — this is an offline desktop app, so there is no round trip and translation works before the backend is even reachable.

The DOM is **tagged rather than rebuilt**: elements carry `data-i18n="key"` (text) or `data-i18n-placeholder="key"` (inputs), and `applyTranslations()` walks the tree and substitutes. This kept the change non-invasive — all existing markup structure and every element id is untouched, so no other renderer code needed to change. 73 attributes were added by script, scoped strictly to the student view.

Strings generated in JavaScript rather than markup (level hints, "START HERE", word/character labels, pinyin toggle captions) go through `t(key)`.

**Fallback is English, never a raw key**: an untranslated key falls back to the English string, and only a completely unknown key returns itself. A half-finished translation degrades to English rather than showing `btn.send` to a student.

## Scope: student interface only

The **student-facing interface is translated** — navigation tabs, sidebar sections, every button and input placeholder, panel headings, review ratings, and the descriptive copy for the path, review, starter pack and placement test.

The **teacher, admin and super-admin consoles remain English**. This is a deliberate scope decision, not an oversight: staff are a small, trained audience, whereas students are the many. Extending coverage is adding keys and attributes — the infrastructure is language-agnostic and a third locale needs only a new block in `STRINGS`.

## Testing procedure

`apps/desktop/src/i18n.test.js` (8) guards the ways a translation layer silently rots:

- **Key parity in both directions** — every English key has a Chinese translation, and Chinese has no orphans.
- **No Chinese string left as its English source.** A copy-paste that never got translated would pass a parity check; this catches it (ignoring emoji-only strings).
- **Fallback chain** — a key present only in English falls back rather than vanishing; an unknown key returns itself; an unknown locale falls back to English.
- **Every `data-i18n` key used in the markup exists** in the string table, so no element can render a raw key. Also asserts substantial coverage (>40 keys) so the check can't pass vacuously.
- **Every `t()` key used in the renderer exists.**
- **`applyTranslations()` actually rewrites text and placeholders**, verified against a minimal fake DOM — this proves the *mechanism*, not just the data.

Backend (`routes/language.test.ts`, +4): the interface defaults to English; the locale persists; **the two settings are orthogonal in both directions**; an unknown locale gives 400.

A `test` script was added to `apps/desktop/package.json`, which previously had none.

Full suites: **backend 197 tests passing** (+4), **desktop 8 tests passing** (new), AI service 80 pytest passing; backend `tsc` clean; types build clean.

## Honest limitations

- **Staff consoles are untranslated**, as above.
- Translations are my own; they read naturally to me but have not been reviewed by a native speaker, which is what I would want before a classroom deployment.
- **Content is not translated, by design** — a reading passage is the material being learned, not interface furniture.
- No CJK font is bundled. Chinese renders via system fonts, which is fine on the Windows machines this targets but not guaranteed everywhere.

## Git

- Commit: `Stage 36: Interface translation (i18n)`
- Tag: `v1.24.0`
- CHANGELOG entry added.
