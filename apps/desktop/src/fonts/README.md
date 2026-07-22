# Bundled CJK font (vendored, binary gitignored)

`NotoSansSC-VF.ttf` — **Noto Sans SC**, Google's Simplified Chinese sans-serif.

## Why it is bundled

Chinese renders correctly on Windows through system fonts (Microsoft YaHei),
so the app *worked* without this. But the platform is meant to be installed on
whatever machines a school has, including minimal or non-Windows images where
no CJK font is guaranteed — and there the entire Chinese side of the app would
render as tofu boxes (□□□). Bundling removes that dependency.

## Why it lives here and not in `offline-sdk/`

Every other vendored asset lives in `offline-sdk/`, but electron-builder only
packages `dist/**` and `src/**` (see `apps/desktop/package.json` → `build.files`).
A font referenced from `offline-sdk/` would work in development and then be
missing from the packaged installer — the exact failure this stage exists to
prevent. So the runtime copy lives inside the app's `src/`.

## Which file

The **variable** font (`[wght]` axis, 100–900) rather than separate static
weights: one file covers every weight, and bold is a real weight rather than a
synthesised "faux bold", which looks noticeably bad on Chinese characters.

Verified coverage: 30,890 codepoints, including the full HSK 1–6 vocabulary
used by the app, 成语, and **pinyin diacritics** (ǎ ě ǐ ǒ ǔ ǚ), which the app
displays throughout.

## Licence

**SIL Open Font License 1.1** — see `OFL.txt` in this directory. The licence
permits redistribution (including bundled inside an application) provided the
licence text accompanies the font. `OFL.txt` is therefore **committed to git**
even though the font binary is not, so the licensing travels with the source.

## Restoring the font

The `.ttf` is gitignored like the other large vendored binaries, so a fresh
clone will not have it. The app degrades gracefully — the CSS font stack falls
back to system fonts — but to restore it:

```
curl -L -o apps/desktop/src/fonts/NotoSansSC-VF.ttf \
  "https://github.com/google/fonts/raw/main/ofl/notosanssc/NotoSansSC%5Bwght%5D.ttf"
```

(~17 MB.) The licence, if ever needed again:

```
curl -L -o apps/desktop/src/fonts/OFL.txt \
  https://raw.githubusercontent.com/google/fonts/main/ofl/notosanssc/OFL.txt
```

## How it is applied

`src/index.html` declares an `@font-face` for the file and puts it in the font
stack **after** `system-ui`:

```css
font-family: system-ui, "Noto Sans SC", sans-serif;
```

Font fallback is per-glyph, so Latin text keeps the native UI face (which looks
better for interface chrome) while any CJK glyph the system font lacks comes
from Noto Sans SC. Chinese reading passages set the CJK face first outright,
for proper typography in long-form text.
