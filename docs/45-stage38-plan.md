# Stage 38 Implementation Plan — Curated quiz question bank

## Objective

Quizzes were the **last module still generated entirely by the LLM on every request**. That carried three costs:

1. **A several-second wait** before a quiz appeared, on a CPU-bound 1.5B model.
2. **Quality that varied run to run** — the same category and level could produce a sharp question or a vague one.
3. **Occasionally malformed output** — most damagingly, a stem whose four options contain no correct answer. In an assessment that is worse than useless: the student is marked wrong whatever they choose.

It was also the last place where an unavailable AI service meant a **502 and no quiz at all**.

## Approach: curated first, AI as fallback

Exactly the pattern proven by the Stage 33 vocabulary wordlist — and the same reasoning. Authored content is reliable and instant; the model is kept for what it is actually good at, which here is covering gaps.

`quiz/questionBank.ts` (English) and `chinese/questionBank.ts` (Chinese): **126 questions**, 3 per `(language, category, CEFR level)` bucket across all 42 buckets:

| language | categories | levels | questions |
|---|---|---|---|
| English | grammar, vocabulary, everyday_english | A1–C2 | 54 |
| Chinese | grammar, vocabulary, everyday_chinese, **characters** | A1–C2 | 72 |

`characters` has no English counterpart — it tests 汉字 directly: radicals (氵 water, 忄 heart, 讠 speech, 钅 metal), visually confusable pairs (日/目, 买/卖, 在/再, 幸/辛), the 的/得/地 distinction, and character↔pinyin matching.

### Selection widens by level rather than returning a short quiz

`selectQuestions()` takes exact-level questions first, then widens to the nearest levels until the quiz is full. Three per bucket plus one level of widening means **every one of the 42 buckets fills a complete 5-question quiz from curated content**, while staying within one level of the target — verified by a test that iterates every bucket.

The consequence is that **the AI is never called on the happy path**: quizzes are instant and always well-formed, and a test asserts zero calls to the client for a covered bucket.

Within a distance band the order is shuffled (Fisher-Yates with an injectable RNG, so selection stays testable), because a student re-taking a quiz should not replay the same five items.

## Behavioural change worth noting

**An AI failure no longer breaks quiz generation.** Previously an unavailable model returned 502; now curated questions serve the quiz and the AI is consulted only for a shortfall — with a 502 remaining only in the impossible case where the bank yields nothing *and* generation fails.

## Testing procedure

`quiz/questionBank.test.ts` (8) asserts the well-formedness the AI could not guarantee:

- **`correctAnswer` is always among the options** — precisely the AI failure mode that motivated this stage — plus no duplicate options, exactly 4 options for multiple choice, and exactly True/False for true-false.
- Unique ids; every question belongs to a **valid category for its language**.
- **Every bucket fills a whole quiz from curated content alone.**
- Selection never mixes languages or categories; prefers the exact level and never strays more than one level away; and repeated quizzes surface more than five distinct questions.

`routes/quiz.test.ts` (+3, 1 rewritten):

- A covered bucket is served **entirely from the bank, with zero AI calls**.
- **An AI failure no longer breaks generation** — 200 with five questions, where this was previously a 502.
- Curated questions grade correctly end to end.
- The pre-existing grading test was **rewritten rather than deleted**: it previously hardcoded the AI fake's two answers. It now reads the stored answers from `quizInstances.questionsJson` — which additionally proves the answers really are held server-side and never sent to the client — then answers three of five correctly in upper case, checking partial scoring (60), case-insensitive grading, answer/explanation reveal, and progress aggregation.

Full suites: **backend 208 tests passing** (+11), desktop 11 passing, AI service 80 pytest passing; backend `tsc` clean.

## Honest limitations

- **3 questions per bucket** is enough to fill any single quiz, but a student who takes the same bucket repeatedly will start seeing repeats after a couple of attempts. Growing the bank is appending to the array.
- Level assignment is editorial judgement, as with the wordlist.
- The AI path still exists and is still unvalidated — if a future category has no curated coverage, it will serve model output with the old reliability caveats.

## Git

- Commit: `Stage 38: Curated quiz question bank`
- Tag: `v1.26.0`
- CHANGELOG entry added.
