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
