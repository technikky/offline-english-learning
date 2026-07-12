# Stage 23 Implementation Plan — Instructor-added conversation topics

## Objective

Let users registered as **instructors (teachers)** add their own conversation topics, which then appear in their school's students' conversation picker alongside the 21 built-in scenarios — per the brief's "a function for users registered as instructors to add new conversation topics."

## 1. Coexistence with built-in scenarios

Built-in scenarios are a fixed dictionary keyed by scenario id (`free_talk`, `restaurant`, …) with prompts baked into the AI service. Rather than disturb that, a custom topic is addressed by a **`custom:<id>`** scenario value:

- New `custom_topics` table: `id, teacherId, schoolId, title, prompt, createdAt`.
- `apps/backend/src/conversations/customTopics.ts` — helpers: `isCustomScenario`, `parseCustomTopicId`, `customScenarioValue`, `getCustomTopic`, `getUserSchoolId`, `listAccessibleCustomTopics(schoolId)`, `isTopicAccessible`, `listOwnTopics`.

## 2. Threading the teacher's prompt into the AI

Instead of hardcoding, the teacher's `prompt` is threaded through the chat request as an optional override:

- AI service `build_system_prompt(scenario, difficulty_level, custom_prompt=None)` uses `custom_prompt` when non-empty, else the built-in `SCENARIO_PROMPTS` lookup. `ChatRequest` gained `customPrompt`; `_stream_chat` passes it through.
- Backend `requestAiChatStream(messages, scenario, difficultyLevel, customPrompt?)` sends `customPrompt`.
- The conversation **messages** route resolves the custom prompt (via `getCustomTopic`) when the conversation's scenario is `custom:<id>` and passes it down. The built-in scenario dictionary is untouched.

## 3. Routes

- `GET /topics` (any authenticated user) — built-in `ALL_SCENARIOS` + the school's accessible custom topics, as `ConversationTopicOption[]` (`{ value, label, isCustom }`).
- `GET /teacher/topics`, `POST /teacher/topics` (title + prompt required; inherits the teacher's `schoolId`), `DELETE /teacher/topics/:id` (own topics only → 404 otherwise) — all `requireRole("teacher")`.
- Conversation **create** accepts `custom:<id>` (validated via `parseCustomTopicId` + `isTopicAccessible` against the user's `schoolId`) or a built-in `isValidScenario` value; anything else → 400.

## 4. Tenant scoping

Custom topics are scoped by `schoolId` (reusing Stage 20 tenancy): a student only sees / can start topics from their own school; a bogus or another school's `custom:<id>` yields 400. Verified with a two-school test.

## 5. Desktop

- **Student**: the "New conversation" topic `<select>` is now populated at login from `GET /topics` (`loadConversationTopics`), so custom topics appear under a "School topics" optgroup below the built-ins. Falls back to the static built-in options if the request fails.
- **Teacher**: a new **Conversation topics** panel in the teacher sidebar — lists the teacher's own topics with delete buttons, and a title + instructions form to add one (`loadTeacherTopics` / `createTeacherTopic` / `deleteTeacherTopic`).

## 6. Verification

- Unit tests (`topics.test.ts`, 4): teacher-create appears in a same-school student's `/topics` (built-ins still present); student can start `custom:<id>` but a bogus id → 400; a student in another school sees no custom topics and is denied; teacher deletes only their own topic (second delete → 404), students get 403 on create.
- AI-service pytest (2 new): a non-empty `custom_prompt` overrides the built-in scenario text; a blank one falls back to the built-in.
- Live (full stack): teacher created "At the Space Station" → student's `/topics` returned 22 options incl. `custom:1` + `free_talk`; student started `custom:1` (201) but `custom:99999` → 400; teacher delete → ok then 404; student create → 403.
