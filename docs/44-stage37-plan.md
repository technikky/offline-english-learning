# Stage 37 Implementation Plan — Bundled CJK font

## Objective

Remove the last dependency on the host machine for Chinese rendering. Chinese displayed correctly on Windows via Microsoft YaHei, so the app *worked* — but this platform is meant to be installed on whatever machines a school has, including minimal or non-Windows images where no CJK font is guaranteed. On such a machine the entire Chinese side of the app renders as tofu boxes (□□□): the interface, the wordlist, the reading passages, everything.

For a project whose defining constraint is "all required resources must exist locally", relying on a system font was the last unexamined external dependency.

## The font

**Noto Sans SC**, the **variable** build (`[wght]` 100–900), 17 MB, from `google/fonts`.

The variable font was chosen over separate static weights deliberately: one file covers every weight, and bold becomes a real weight rather than a synthesised "faux bold" — which looks noticeably bad on Chinese characters, where thickening strokes muddies dense glyphs.

### Verified coverage, not assumed

The font was parsed directly (a minimal sfnt/cmap reader; `fonttools` is not available in this environment) to confirm it maps **30,890 codepoints**, covering every category the app actually renders:

| checked | result |
|---|---|
| UI strings (tabs, sidebar, buttons) | OK |
| HSK 1–2 and HSK 5–6 wordlist entries | OK |
| 成语 (不言而喻, 归根结底, 举足轻重, 潜移默化) | OK |
| C2 reading passage text | OK |
| **pinyin diacritics** (ǎ ě ǐ ǒ ǔ ǚ) | OK |
| Latin, digits, CJK punctuation （）。！？— | OK |

Pinyin coverage matters as much as the hanzi: the app shows pinyin in grammar examples, wordlist definitions and reading scaffolding, and a font missing tone marks would break all of it.

## Where it lives, and why not `offline-sdk/`

Every other vendored asset lives in `offline-sdk/`. This one does not, for a concrete reason: **electron-builder only packages `dist/**` and `src/**`** (`apps/desktop/package.json` → `build.files`). A font referenced from `offline-sdk/` would work in development and then be **missing from the packaged installer** — precisely the failure this stage exists to prevent. The runtime copy therefore lives at `apps/desktop/src/fonts/`, and a test asserts the `@font-face` URL resolves under `src/`.

## Licensing

Noto Sans SC is **SIL Open Font License 1.1**, which permits redistribution — including bundled inside an application — **provided the licence text accompanies the font**. So `fonts/OFL.txt` is **committed to git** even though the 17 MB binary is gitignored like every other vendored blob. The licensing travels with the source whether or not the font has been restored, and a test asserts the licence file is present and is actually the OFL.

## How it is applied

```css
font-family: system-ui, "Noto Sans SC", sans-serif;
```

`system-ui` stays **first** on purpose. Font fallback is per-glyph, so Latin interface text keeps the native UI face (which looks better for chrome) while any CJK glyph the system font lacks falls through to Noto Sans SC. Chinese reading passages set the CJK face first outright, for proper typography in long-form text.

If the font file is absent, the stack simply falls back to system fonts — the same behaviour as before this stage.

## Testing procedure

Three tests added to the desktop suite:

- **The `@font-face` URL resolves to a path under `src/`** — the packaging rule above, asserted whether or not the binary is present.
- **The OFL licence ships alongside the font** and is genuinely the OFL.
- **The font stack keeps `system-ui` first**, so a future edit cannot silently replace the Latin UI face with the CJK one.

The font-validity check (TrueType signature) is **deliberately soft**: the binary is gitignored, so a fresh clone legitimately lacks it, and the suite skips with an explanatory line rather than failing. This differs from the Stage 29 check that hard-asserts the speech models exist, and the distinction is principled — a missing model breaks speech entirely, whereas a missing font degrades gracefully to system rendering. Verified both ways: the suite passes with the font present (full validation) and absent (skip).

Full suites: **desktop 11 tests passing** (+3), backend 197 passing, AI service 80 pytest passing; backend `tsc` clean.

## Honest limitations

- **17 MB added to the installer.** Small next to the ~500 MB of vendored models, but not nothing.
- **Simplified Chinese only.** Traditional characters (繁體) fall back to system fonts; the app teaches simplified, so this matches the content, but a Traditional variant would need Noto Sans TC.
- The font is gitignored, so a fresh clone renders via system fonts until it is restored per `fonts/README.md`.

## Git

- Commit: `Stage 37: Bundled CJK font`
- Tag: `v1.25.0`
- CHANGELOG entry added.
