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
  title: "English: A1 to C2",
  units: [
    {
      id: "unit-a1",
      level: "A1",
      title: "Everyday Basics",
      lessons: [
        { type: "grammar", refId: "present-tense", title: "Present Simple Tense" },
        { type: "grammar", refId: "past-tense", title: "Past Simple Tense" },
        { type: "reading", refId: "a-day-at-the-park", title: "Read: A Day at the Park" },
        { type: "reading", refId: "the-lost-key", title: "Read: The Lost Key" },
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
        { type: "reading", refId: "the-morning-market", title: "Read: The Morning Market" },
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
        { type: "grammar", refId: "gerunds-infinitives", title: "Gerunds and Infinitives" },
        { type: "reading", refId: "working-from-home", title: "Read: Working from Home" },
        { type: "reading", refId: "learning-to-cook", title: "Read: Learning to Cook" },
        { type: "listening", refId: "listen-office-meeting", title: "Listen: An Office Meeting" },
        {
          type: "listening",
          refId: "listen-library-announcement",
          title: "Listen: A Library Announcement",
        },
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
        { type: "reading", refId: "the-value-of-boredom", title: "Read: The Value of Boredom" },
        { type: "listening", refId: "listen-climate-report", title: "Listen: A Climate Report" },
        { type: "writing", refId: "write-environment-essay", title: "Write: Environment Essay" },
        { type: "writing", refId: "write-a-formal-complaint", title: "Write: A Formal Complaint" },
        { type: "conversation", refId: "debate", title: "Talk: Debate Practice" },
        { type: "quiz", refId: "grammar", title: "Quiz: Grammar" },
      ],
    },
    {
      id: "unit-c1",
      level: "C1",
      title: "Precision and Register",
      // Stage 32 completed this unit: C1 listening and writing content now exist,
      // so it covers all six lesson types like every other unit.
      lessons: [
        { type: "grammar", refId: "relative-clauses", title: "Relative Clauses" },
        { type: "grammar", refId: "inversion", title: "Inversion for Emphasis" },
        {
          type: "reading",
          refId: "the-ethics-of-artificial-intelligence",
          title: "Read: The Ethics of AI",
        },
        {
          type: "reading",
          refId: "the-language-of-machines",
          title: "Read: The Language of Machines",
        },
        {
          type: "listening",
          refId: "listen-research-interview",
          title: "Listen: An Interview With a Researcher",
        },
        {
          type: "writing",
          refId: "write-a-balanced-argument",
          title: "Write: A Balanced Argument",
        },
        { type: "conversation", refId: "culture", title: "Talk: Culture" },
        { type: "quiz", refId: "vocabulary", title: "Quiz: Vocabulary" },
      ],
    },
    {
      // Stage 32: the top of the ladder. Until now the English path stopped at
      // C1, which capped how far a learner could actually be taken.
      id: "unit-c2",
      level: "C2",
      title: "Mastery",
      lessons: [
        { type: "grammar", refId: "cleft-sentences", title: "Cleft Sentences" },
        { type: "grammar", refId: "hedging-and-nuance", title: "Hedging and Nuanced Modality" },
        {
          type: "reading",
          refId: "the-paradox-of-choice",
          title: "Read: The Paradox of Choice",
        },
        {
          type: "listening",
          refId: "listen-conference-talk",
          title: "Listen: Opening of a Conference Talk",
        },
        { type: "writing", refId: "write-a-critical-review", title: "Write: A Critical Review" },
        { type: "conversation", refId: "debate", title: "Talk: Debate Practice" },
        { type: "quiz", refId: "vocabulary", title: "Quiz: Vocabulary" },
      ],
    },
  ],
};

// Stage 28: the Mandarin Chinese path. Units are labelled with both the
// Chinese lesson name and an English gloss. Levels stay on the CEFR scale
// internally (the UI shows the HSK equivalent for Chinese learners).
//
// Stage 29 added listening (the zh_CN Piper voice is now vendored), Stage 31
// added Chinese writing prompts and quiz categories, and Stage 35 built out
// HSK 5-6 -- so the Chinese path now spans HSK 1-6 with all six lesson types
// in every unit, matching the English A1-C2 ladder.
export const CHINESE_COURSE: Course = {
  title: "中文 Chinese: HSK 1 to HSK 6",
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
        { type: "grammar", refId: "zh-bei-passive", title: "The 被 Passive" },
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
    {
      // Stage 35: HSK 5. Until now the Chinese path stopped at HSK 4, which
      // capped a Chinese learner two whole bands below where the English path
      // reaches -- the same ceiling problem Stage 32 fixed for English.
      id: "unit-zh-c1",
      level: "C1",
      title: "分析与论证 Analysis & Argument",
      lessons: [
        {
          type: "grammar",
          refId: "zh-potential-complements",
          title: "Resultative and Potential Complements",
        },
        { type: "grammar", refId: "zh-formal-connectives", title: "Formal Connectives (书面语)" },
        {
          type: "reading",
          refId: "zh-read-ai-and-work",
          title: "Read: 人工智能与工作 (AI and Work)",
        },
        {
          type: "listening",
          refId: "zh-listen-city-interview",
          title: "Listen: 城市交通访谈 (Urban Transport Interview)",
        },
        {
          type: "writing",
          refId: "zh-write-technology-argument",
          title: "Write: 科技与生活 (Technology and Life)",
        },
        { type: "conversation", refId: "debate", title: "Talk: Debate Practice" },
        { type: "quiz", refId: "grammar", title: "Quiz: Grammar 语法" },
      ],
    },
    {
      // Stage 35: HSK 6 -- the top of the Chinese ladder. Idiom and register
      // control are what actually separate advanced Mandarin from merely
      // correct Mandarin, so both grammar points target exactly that.
      id: "unit-zh-c2",
      level: "C2",
      title: "语言的精通 Mastery of Register",
      lessons: [
        { type: "grammar", refId: "zh-chengyu", title: "成语: Four-Character Idioms" },
        {
          type: "grammar",
          refId: "zh-literary-register",
          title: "书面语 and 口语: Controlling Register",
        },
        {
          type: "reading",
          refId: "zh-read-language-and-thought",
          title: "Read: 语言与思维 (Language and Thought)",
        },
        {
          type: "listening",
          refId: "zh-listen-lecture-opening",
          title: "Listen: 讲座开场 (Opening of a Lecture)",
        },
        {
          type: "writing",
          refId: "zh-write-critical-commentary",
          title: "Write: 评论文章 (A Critical Commentary)",
        },
        { type: "conversation", refId: "culture", title: "Talk: Culture" },
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
