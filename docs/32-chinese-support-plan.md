# Chinese Language Support + 3D Avatar

Adds a second learning language (Chinese) selectable at the login screen, full
Chinese localization of the interface, a Chinese-speaking AI conversation
partner, and a real-time 3D avatar for free conversation.

## 1. Language selection & i18n

- **New `apps/desktop/src/i18n.js`** — an offline i18n layer with `en` and `zh`
  dictionaries, `getLang()/setLang()` (persisted to `localStorage`), `t(key,vars)`,
  localized scenario labels, and `applyI18n()` which fills every element carrying
  a `data-i18n` (textContent), `data-i18n-ph` (placeholder) or `data-i18n-html`
  (innerHTML) attribute.
- **Login screen** gains a Language selector (English / 中文). Choosing a language
  re-renders the whole UI live and is remembered across sessions.
- **`index.html`** marks the primary student-facing UI with `data-i18n*`
  attributes: title, login form, sidebar (profile labels, new-conversation, voice
  selector, speak-aloud, start button, notebook), the 7 module tabs, the
  conversation avatar name / voice bar / composer, and the built-in scenario
  `<select>` options.
- **`renderer.js`** applies i18n on boot and uses `t()` for dynamic strings
  (conversation-started banner, voice-mode statuses, error messages).

The framework is additive: any remaining string becomes localizable by adding a
`data-i18n` attribute + a dictionary key — no code change.

## 2. Chinese-speaking AI partner

When the UI language is Chinese, the conversation partner replies in Simplified
Chinese (the vendored Qwen models are multilingual). Threaded end-to-end without
disturbing the scenario/pedagogy prompt:

- desktop sends `language` on each chat message;
- backend (`SendMessageRequest.language`) turns `"zh"` into a `languageInstruction`
  and passes it via `requestAiChatStream`;
- AI service (`ChatRequest.languageInstruction`) **appends** it to the system
  prompt in `_stream_chat` (append, not replace, so the scenario is preserved).

## 3. Real-time 3D avatar (free conversation)

- **Vendored Three.js r128** (`apps/desktop/src/vendor/three.min.js`, UMD global)
  — fully offline, no CDN.
- **New `apps/desktop/src/avatar3d.js`** builds a stylized 3D head (`female` /
  `male` variants mirroring the two Piper voices) that gently idles and
  **lip-syncs** (jaw opens/closes) while the AI speaks. `renderAvatar()` mounts
  it into the avatar holder; `speakAsAvatar()` drives `setSpeaking(true/false)`.
- Degrades gracefully: if WebGL/THREE is unavailable, `mount()` returns false and
  the previous flat SVG avatar is used instead.
- The module is glTF-ready — `buildHead()` can be swapped for a `GLTFLoader`
  load of a photorealistic rigged `.glb` head later without touching callers.

### Note on "lifelike" models

A truly photorealistic rigged human model can't be generated or reliably vendored
offline (asset size + licensing), so this ships a stylized procedural 3D model as
a real upgrade over the 2D SVG, with the loader path ready for a photoreal `.glb`
drop-in.

## 4. Verification

- Loaded the UI over HTTP in a browser: English↔Chinese toggling confirmed for
  the title, login, tabs, scenarios and buttons; `THREE` r128 present; the 3D
  avatar mounts for both female and male (168×168 canvas) and accepts
  voice/speaking changes without error.
- `packages/types`, backend and desktop all build clean; backend **99** tests and
  AI service **47** pytest pass; `node --check` passes on the new/edited JS.
