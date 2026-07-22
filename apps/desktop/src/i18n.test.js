const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const {
  STRINGS,
  t,
  setLocale,
  getLocale,
  applyTranslations,
  DEFAULT_LOCALE,
} = require("./i18n");

// Stage 36: these guard the two ways a translation layer silently rots —
// a key added to one locale but not the other, and markup referencing a key
// that doesn't exist (which would render as a raw key like "btn.send").

test("every English key has a Chinese translation", () => {
  const missing = Object.keys(STRINGS.en).filter((k) => !(k in STRINGS.zh));
  assert.deepEqual(missing, [], `untranslated keys: ${missing.join(", ")}`);
});

test("Chinese has no keys that English lacks", () => {
  const orphans = Object.keys(STRINGS.zh).filter((k) => !(k in STRINGS.en));
  assert.deepEqual(orphans, [], `orphaned keys: ${orphans.join(", ")}`);
});

test("no Chinese string was left as its English source", () => {
  // A copy-paste that never got translated is worse than a missing key,
  // because the parity test above would still pass.
  const untranslated = Object.keys(STRINGS.en).filter(
    (k) => STRINGS.zh[k] === STRINGS.en[k] && !/^[\p{Emoji}\s\W]*$/u.test(STRINGS.en[k]),
  );
  assert.deepEqual(untranslated, [], `identical to English: ${untranslated.join(", ")}`);
});

test("translation falls back to English, then to the key", () => {
  setLocale("zh");
  assert.equal(t("btn.send"), STRINGS.zh["btn.send"]);
  // A key present only in English must fall back rather than vanish.
  STRINGS.en["test.onlyEnglish"] = "Only English";
  assert.equal(t("test.onlyEnglish"), "Only English");
  delete STRINGS.en["test.onlyEnglish"];
  // An entirely unknown key returns itself rather than undefined.
  assert.equal(t("nope.missing"), "nope.missing");
  setLocale(DEFAULT_LOCALE);
});

test("an unknown locale falls back to English", () => {
  setLocale("klingon");
  assert.equal(getLocale(), "en");
  assert.equal(t("btn.send"), STRINGS.en["btn.send"]);
});

test("every data-i18n key used in the markup exists in the string table", () => {
  const html = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
  const used = new Set();
  for (const m of html.matchAll(/data-i18n(?:-placeholder)?="([^"]+)"/g)) {
    used.add(m[1]);
  }
  assert.ok(used.size > 40, `expected substantial markup coverage, found ${used.size}`);
  const unknown = [...used].filter((k) => !(k in STRINGS.en));
  assert.deepEqual(unknown, [], `markup references unknown keys: ${unknown.join(", ")}`);
});

test("every t() key used in the renderer exists in the string table", () => {
  const js = fs.readFileSync(path.join(__dirname, "renderer.js"), "utf8");
  const used = new Set();
  for (const m of js.matchAll(/\bt\("([a-z]+\.[A-Za-z]+)"\)/g)) {
    used.add(m[1]);
  }
  const unknown = [...used].filter((k) => !(k in STRINGS.en));
  assert.deepEqual(unknown, [], `renderer references unknown keys: ${unknown.join(", ")}`);
});

test("applyTranslations actually rewrites tagged elements and placeholders", () => {
  // Minimal fake DOM: enough to prove the mechanism, without a browser.
  const textEl = { attrs: { "data-i18n": "btn.send" }, textContent: "Send" };
  const inputEl = {
    attrs: { "data-i18n-placeholder": "ph.typeMessage" },
    placeholder: "Type a message and press Enter…",
  };
  const make = (el) => ({
    getAttribute: (name) => el.attrs[name],
    set textContent(v) { el.textContent = v; },
    get textContent() { return el.textContent; },
    set placeholder(v) { el.placeholder = v; },
    get placeholder() { return el.placeholder; },
  });
  const root = {
    querySelectorAll: (sel) =>
      sel === "[data-i18n]" ? [make(textEl)] : [make(inputEl)],
  };

  setLocale("zh");
  applyTranslations(root);
  assert.equal(textEl.textContent, STRINGS.zh["btn.send"]);
  assert.equal(inputEl.placeholder, STRINGS.zh["ph.typeMessage"]);

  setLocale("en");
  applyTranslations(root);
  assert.equal(textEl.textContent, STRINGS.en["btn.send"]);
  assert.equal(inputEl.placeholder, STRINGS.en["ph.typeMessage"]);
});

// --- Stage 37: bundled CJK font ---

test("the CJK @font-face resolves to a path that will be packaged", () => {
  const html = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
  const m = html.match(/@font-face[\s\S]*?url\("([^"]+)"\)/);
  assert.ok(m, "no @font-face declaration found");

  const fontPath = path.join(__dirname, m[1]);
  // It must sit under src/, because electron-builder only packages dist/** and
  // src/** -- a font referenced from outside those works in development and
  // then vanishes from the installer, which is the exact failure this stage
  // exists to prevent. This holds whether or not the binary is present.
  assert.ok(
    !path.relative(__dirname, fontPath).startsWith(".."),
    "font must live under src/ to survive packaging",
  );

  // The binary itself is gitignored like other vendored assets, so a fresh
  // clone legitimately lacks it and the app falls back to system fonts. Assert
  // its validity only when it has actually been restored -- unlike a missing
  // speech model, a missing font degrades gracefully rather than breaking the
  // app, so this is a soft check by design.
  if (!fs.existsSync(fontPath)) {
    console.log(`    (font not restored - see fonts/README.md; app falls back to system fonts)`);
    return;
  }
  const head = fs.readFileSync(fontPath).subarray(0, 4);
  assert.deepEqual([...head], [0x00, 0x01, 0x00, 0x00], "not a valid TrueType file");
});

test("the OFL licence ships alongside the font", () => {
  // SIL OFL permits redistribution only if the licence accompanies the font,
  // so this file is committed even though the binary is gitignored.
  const licence = fs.readFileSync(path.join(__dirname, "fonts", "OFL.txt"), "utf8");
  assert.match(licence, /SIL Open Font License/i);
});

test("the font stack keeps system-ui first so Latin text is unaffected", () => {
  const html = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
  assert.match(
    html,
    /font-family:\s*system-ui,\s*"Noto Sans SC",\s*sans-serif/,
    "body stack should fall through to the CJK face per-glyph, not replace the UI face",
  );
});
