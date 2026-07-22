import type { CefrLevel, LessonType, TargetLanguage } from "@englishclass/types";

// Stage 27: the structured learning path. A single curated course that
// sequences the existing practice modules into an ordered A1->C1 route. Each
// lesson points at content that already exists (a grammar topic, reading
// passage, listening clip, writing prompt, conversation scenario, or quiz
// category) by id -- the curriculum is a pure overlay, adding *ordering and
// progression* on top of the modules without duplicating their content.
//
// Curated/static for the same reason as the grammar curriculum and passages
// (Stages 14/15): the learning sequence is a pedagogical decision that should
// be reliable and deliberate. Referenced ids are validated against the real
// content modules by course.test.ts, so a typo or a removed passage fails the
// build rather than shipping a broken path. Adding a unit/lesson is just
// appending here (and, ideally, adding the referenced content).

export interface CourseLesson {
  type: LessonType;
  /** Content id / scenario / quiz category the lesson opens. */
  refId: string;
  title: string;
}

export interface CourseUnit {
  id: string;
  level: CefrLevel;
  title: string;
  lessons: CourseLesson[];
}

export interface Course {
  title: string;
  units: CourseUnit[];
}

export const ENGLISH_COURSE: Course = {
  title: "English: A1 to C1",
  units: [
    {
      id: "unit-a1",
      level: "A1",
      title: "Everyday Basics",
      lessons: [
        { type: "grammar", refId: "present-tense", title: "Present Simple Tense" },
        { type: "grammar", refId: "past-tense", title: "Past Simple Tense" },
        { type: "reading", refId: "a-day-at-the-park", title: "Read: A Day at the Park" },
        { type: "listening", refId: "listen-morning-routine", title: "Listen: A Morning Routine" },
        { type: "writing", refId: "write-my-family", title: "Write: My Family" },
        { type: "conversation", refId: "daily_life", title: "Talk: Daily Life" },
        { type: "quiz", refId: "grammar", title: "Quiz: Grammar" },
      ],
    },
    {
      id: "unit-a2",
      level: "A2",
      title: "Getting Around",
      lessons: [
        { type: "grammar", refId: "articles", title: "Articles: a, an, the" },
        { type: "grammar", refId: "prepositions", title: "Prepositions" },
        { type: "reading", refId: "the-new-neighbor", title: "Read: The New Neighbor" },
        { type: "listening", refId: "listen-weekend-plans", title: "Listen: Weekend Plans" },
        { type: "writing", refId: "write-a-memorable-trip", title: "Write: A Memorable Trip" },
        { type: "conversation", refId: "shopping", title: "Talk: Shopping" },
        { type: "quiz", refId: "everyday_english", title: "Quiz: Everyday English" },
      ],
    },
    {
      id: "unit-b1",
      level: "B1",
      title: "Expressing Yourself",
      lessons: [
        { type: "grammar", refId: "present-perfect", title: "Present Perfect Tense" },
        { type: "grammar", refId: "passive-voice", title: "The Passive Voice" },
        { type: "reading", refId: "working-from-home", title: "Read: Working from Home" },
        { type: "listening", refId: "listen-office-meeting", title: "Listen: An Office Meeting" },
        { type: "writing", refId: "write-technology-opinion", title: "Write: Technology Opinion" },
        { type: "conversation", refId: "business_meeting", title: "Talk: Business Meeting" },
        { type: "quiz", refId: "vocabulary", title: "Quiz: Vocabulary" },
      ],
    },
    {
      id: "unit-b2",
      level: "B2",
      title: "Nuance & Argument",
      lessons: [
        { type: "grammar", refId: "conditionals", title: "Conditionals" },
        { type: "grammar", refId: "modal-verbs", title: "Modal Verbs" },
        { type: "reading", refId: "the-power-of-habits", title: "Read: The Power of Habits" },
        { type: "listening", refId: "listen-climate-report", title: "Listen: A Climate Report" },
        { type: "writing", refId: "write-environment-essay", title: "Write: Environment Essay" },
        { type: "conversation", refId: "debate", title: "Talk: Debate Practice" },
        { type: "quiz", refId: "grammar", title: "Quiz: Grammar" },
      ],
    },
    {
      id: "unit-c1",
      level: "C1",
      title: "Mastery",
      // C1 listening/writing content isn't authored yet (see docs/34-stage27-plan.md);
      // the unit uses the C1 content that does exist. Adding C1 clips/prompts later
      // and appending lessons here extends the path with no other change.
      lessons: [
        { type: "grammar", refId: "relative-clauses", title: "Relative Clauses" },
        { type: "reading", refId: "the-ethics-of-artificial-intelligence", title: "Read: The Ethics of AI" },
        { type: "conversation", refId: "culture", title: "Talk: Culture" },
        { type: "quiz", refId: "vocabulary", title: "Quiz: Vocabulary" },
      ],
    },
  ],
};

// Stage 28: the Mandarin Chinese path. Units are labelled with both the
// Chinese lesson name and an English gloss. Levels stay on the CEFR scale
// internally (the UI shows the HSK equivalent for Chinese learners).
//
// Stage 29 added listening (the zh_CN Piper voice is now vendored) and Stage 31
// added Chinese writing prompts and Chinese quiz categories, so every unit now
// covers all six lesson types. HSK 5-6 content is still to be written.
export const CHINESE_COURSE: Course = {
  title: "中文 Chinese: HSK 1 to HSK 4",
  units: [
    {
      id: "unit-zh-a1",
      level: "A1",
      title: "日常生活 Everyday Life",
      lessons: [
        { type: "grammar", refId: "zh-basic-sentence", title: "Basic Sentence Order (主谓宾)" },
        { type: "grammar", refId: "zh-questions-ma", title: "Yes/No Questions with 吗" },
        { type: "reading", refId: "zh-read-my-day", title: "Read: 我的一天 (My Day)" },
        {
          type: "listening",
          refId: "zh-listen-introduction",
          title: "Listen: 自我介绍 (Introducing Yourself)",
        },
        { type: "conversation", refId: "daily_life", title: "Talk: Daily Life" },
        { type: "writing", refId: "zh-write-my-family", title: "Write: 我的家 (My Family)" },
        { type: "quiz", refId: "characters", title: "Quiz: Characters 汉字" },
      ],
    },
    {
      id: "unit-zh-a2",
      level: "A2",
      title: "出去吃饭 Eating Out",
      lessons: [
        { type: "grammar", refId: "zh-measure-words", title: "Measure Words (量词)" },
        { type: "grammar", refId: "zh-le-particle", title: "The Particle 了" },
        {
          type: "reading",
          refId: "zh-read-at-the-restaurant",
          title: "Read: 在饭馆 (At the Restaurant)",
        },
        {
          type: "listening",
          refId: "zh-listen-directions",
          title: "Listen: 问路 (Asking for Directions)",
        },
        { type: "conversation", refId: "restaurant", title: "Talk: Restaurant" },
        { type: "writing", refId: "zh-write-my-weekend", title: "Write: 我的周末 (My Weekend)" },
        { type: "quiz", refId: "everyday_chinese", title: "Quiz: Everyday Chinese" },
      ],
    },
    {
      id: "unit-zh-b1",
      level: "B1",
      title: "学习与表达 Study & Expression",
      lessons: [
        { type: "grammar", refId: "zh-ba-construction", title: "The 把 Construction" },
        { type: "grammar", refId: "zh-comparisons-bi", title: "Comparisons with 比" },
        {
          type: "reading",
          refId: "zh-read-learning-chinese",
          title: "Read: 学中文难吗？(Is Chinese Hard?)",
        },
        {
          type: "listening",
          refId: "zh-listen-spring-festival",
          title: "Listen: 春节 (Spring Festival)",
        },
        { type: "conversation", refId: "free_talk", title: "Talk: Free Conversation" },
        { type: "writing", refId: "zh-write-my-city", title: "Write: 我住的城市 (My City)" },
        { type: "quiz", refId: "grammar", title: "Quiz: Grammar 语法" },
      ],
    },
    {
      id: "unit-zh-b2",
      level: "B2",
      title: "进阶表达 Advanced Expression",
      lessons: [
        { type: "grammar", refId: "zh-complement-degree", title: "Degree Complements with 得" },
        {
          type: "reading",
          refId: "zh-read-phones-and-life",
          title: "Read: 手机改变了生活 (Phones Changed Life)",
        },
        {
          type: "listening",
          refId: "zh-listen-recycling",
          title: "Listen: 垃圾分类 (Waste Sorting)",
        },
        { type: "conversation", refId: "debate", title: "Talk: Debate Practice" },
        {
          type: "writing",
          refId: "zh-write-learning-opinion",
          title: "Write: 学外语的看法 (Views on Language Learning)",
        },
        { type: "quiz", refId: "vocabulary", title: "Quiz: Vocabulary 词汇" },
      ],
    },
  ],
};

export const COURSES: Record<TargetLanguage, Course> = {
  english: ENGLISH_COURSE,
  chinese: CHINESE_COURSE,
};

export function getCourse(language: TargetLanguage = "english"): Course {
  return COURSES[language] ?? ENGLISH_COURSE;
}

/** Stable, unique lesson id within the course. */
export function lessonId(unitId: string, lesson: CourseLesson): string {
  return `${unitId}:${lesson.type}:${lesson.refId}`;
}
