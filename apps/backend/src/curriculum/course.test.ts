import { test } from "node:test";
import assert from "node:assert/strict";
import { ALL_SCENARIOS } from "@englishclass/types";
import { COURSES, CHINESE_COURSE, lessonId } from "./course";
import { getGrammarTopic } from "../grammar/curriculum";
import { getReadingPassage } from "../reading/passages";
import { getListeningClip } from "../listening/clips";
import { getWritingPrompt } from "../writing/prompts";
import { QUIZ_CATEGORIES } from "../quiz/aiQuizClient";

// The whole point of these tests: the curriculum references content by id, so
// a typo or a removed passage must fail here rather than ship a dead lesson.
// They run over every language's course, so the Chinese path is guarded too.

test("every lesson in every course references content that actually exists", () => {
  for (const [language, course] of Object.entries(COURSES)) {
    for (const unit of course.units) {
      for (const lesson of unit.lessons) {
        const where = `${language} / ${unit.id} / ${lesson.type} / ${lesson.refId}`;
        switch (lesson.type) {
          case "grammar":
            assert.ok(getGrammarTopic(lesson.refId), `missing grammar topic: ${where}`);
            break;
          case "reading":
            assert.ok(getReadingPassage(lesson.refId), `missing reading passage: ${where}`);
            break;
          case "listening":
            assert.ok(getListeningClip(lesson.refId), `missing listening clip: ${where}`);
            break;
          case "writing":
            assert.ok(getWritingPrompt(lesson.refId), `missing writing prompt: ${where}`);
            break;
          case "conversation":
            assert.ok(
              (ALL_SCENARIOS as string[]).includes(lesson.refId),
              `unknown scenario: ${where}`,
            );
            break;
          case "quiz":
            assert.ok(
              (QUIZ_CATEGORIES as readonly string[]).includes(lesson.refId),
              `unknown quiz category: ${where}`,
            );
            break;
          default:
            assert.fail(`unknown lesson type: ${where}`);
        }
      }
    }
  }
});

test("lesson ids are unique within each course", () => {
  for (const [language, course] of Object.entries(COURSES)) {
    const ids = new Set<string>();
    for (const unit of course.units) {
      for (const lesson of unit.lessons) {
        const id = lessonId(unit.id, lesson);
        assert.ok(!ids.has(id), `duplicate lesson id in ${language}: ${id}`);
        ids.add(id);
      }
    }
  }
});

test("units are ordered by ascending CEFR level with unique, non-empty units", () => {
  const order = ["A1", "A2", "B1", "B2", "C1", "C2"];
  for (const [language, course] of Object.entries(COURSES)) {
    const unitIds = new Set<string>();
    let prev = -1;
    for (const unit of course.units) {
      const idx = order.indexOf(unit.level);
      assert.ok(idx >= 0, `invalid level in ${language}: ${unit.level}`);
      assert.ok(idx >= prev, `units out of CEFR order in ${language}`);
      prev = idx;
      assert.ok(!unitIds.has(unit.id), `duplicate unit id: ${unit.id}`);
      unitIds.add(unit.id);
      assert.ok(unit.lessons.length > 0, `empty unit: ${unit.id}`);
    }
  }
});

test("the Chinese course only references Chinese content", () => {
  for (const unit of CHINESE_COURSE.units) {
    for (const lesson of unit.lessons) {
      if (lesson.type === "grammar") {
        const topic = getGrammarTopic(lesson.refId)!;
        assert.equal(topic.language, "chinese", `English grammar topic in Chinese course: ${lesson.refId}`);
      }
      if (lesson.type === "reading") {
        const passage = getReadingPassage(lesson.refId)!;
        assert.equal(passage.language, "chinese", `English passage in Chinese course: ${lesson.refId}`);
      }
    }
  }
});
