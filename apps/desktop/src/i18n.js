// Stage 36: interface translation.
//
// The interface language is deliberately SEPARATE from the language being
// learned. A Chinese speaker studying English wants a Chinese interface and an
// English target language; a English speaker studying Chinese wants the
// reverse. Tying the two together would make the app unusable for exactly the
// schools it is built for.
//
// Strings live client-side rather than being fetched, because this is an
// offline desktop app: no round trip, and translation works before the backend
// is even reachable.
//
// Coverage is the STUDENT-facing interface. The teacher, admin and super-admin
// consoles remain English (staff are a small, trained audience) -- see
// docs/43-stage36-plan.md. Anything without a translation falls back to the
// English string, never to a raw key.

const STRINGS = {
  en: {
    // --- shell / sidebar ---
    "nav.logout": "Log out",
    "sidebar.imLearning": "I'm learning",
    "sidebar.interfaceLanguage": "Interface language",
    "sidebar.myLevel": "My level",
    "sidebar.newConversation": "New conversation",
    "sidebar.vocabularyNotebook": "Vocabulary notebook",
    "sidebar.myProgress": "My progress",
    "sidebar.pronunciationPractice": "Pronunciation practice",
    "sidebar.aiPartnerVoice": "AI partner voice",
    "sidebar.speakRepliesAloud": "Speak replies aloud",

    // --- buttons ---
    "btn.takePlacementTest": "Take placement test",
    "btn.retakePlacementTest": "Retake placement test",
    "btn.startConversation": "Start conversation",
    "btn.add": "Add",
    "btn.listen": "🔊 Listen",
    "btn.record": "🎤 Record",
    "btn.send": "Send",
    "btn.voiceMode": "🎙️ Start hands-free voice chat",
    "btn.backToTopics": "← Back to topics",
    "btn.newExercise": "New exercise",
    "btn.backToPassages": "← Back to passages",
    "btn.listenToPassage": "🔊 Listen to passage",
    "btn.showPinyin": "Show pinyin",
    "btn.hidePinyin": "Hide pinyin",
    "btn.showTranslation": "Show translation",
    "btn.hideTranslation": "Hide translation",
    "btn.submitAnswers": "Submit answers",
    "btn.backToClips": "← Back to clips",
    "btn.play": "▶ Play",
    "btn.showTranscript": "Show transcript",
    "btn.playSentence": "🔊 Play sentence",
    "btn.check": "Check",
    "btn.nextSentence": "Next sentence →",
    "btn.backToPrompts": "← Back to prompts",
    "btn.getAiFeedback": "Get AI feedback",
    "btn.generateQuiz": "Generate quiz",
    "btn.submitQuiz": "Submit quiz",
    "btn.newQuiz": "New quiz",
    "btn.refresh": "Refresh",
    "btn.startReview": "Start review",
    "btn.showAnswer": "Show answer",
    "btn.addToDeck": "Add to deck",
    "btn.close": "Close",

    // --- tabs ---
    "tab.path": "🗺️ Path",
    "tab.conversation": "💬 Conversation",
    "tab.grammar": "📘 Grammar",
    "tab.reading": "📖 Reading",
    "tab.listening": "🎧 Listening",
    "tab.writing": "✍️ Writing",
    "tab.quiz": "❓ Quiz",
    "tab.review": "🔁 Review",
    "tab.history": "📜 History",

    // --- section headings ---
    "heading.practice": "Practice",
    "heading.summary": "Summary",
    "heading.keyVocabulary": "Key vocabulary",
    "heading.comprehensionCheck": "Comprehension check",
    "heading.audio": "Audio",
    "heading.dictationPractice": "Dictation practice",
    "heading.overallFeedback": "Overall feedback",
    "heading.strengths": "Strengths",
    "heading.suggestions": "Suggestions",
    "heading.grammarIssues": "Grammar & spelling issues",
    "heading.modelAnswer": "Model answer",
    "heading.generateQuiz": "Generate a quiz",
    "heading.recentQuizzes": "Recent quizzes",
    "heading.learningHistory": "Learning history",
    "heading.vocabularyReview": "Vocabulary review",
    "heading.starterWordPack": "Starter word pack",
    "heading.placementTest": "Placement test",
    "heading.learningPath": "Learning path",

    // --- placeholders ---
    "ph.lookUpWord": "Look up a word…",
    "ph.practicePhrase": "Type a phrase to practice…",
    "ph.typeMessage": "Type a message and press Enter…",
    "ph.typeHeardSentence": "Type the sentence you heard…",
    "ph.writeResponse": "Write your response here…",

    // --- review ratings ---
    "review.again": "Again",
    "review.hard": "Hard",
    "review.good": "Good",
    "review.easy": "Easy",

    // --- descriptive copy ---
    "copy.pathIntro":
      "A step-by-step route from beginner to advanced. Finish an activity in its own module and it's ticked off here automatically.",
    "copy.reviewIntro":
      "Spaced repetition brings each saved word back just before you'd forget it. Rate how well you remembered — that sets when you'll see it next.",
    "copy.seedIntro":
      "Add a set of core words for a level straight into your review deck, so you have something to practise from day one.",
    "copy.placementIntro":
      "Answer a few short questions. The test adapts to you — it gets harder when you're right and easier when you're not — so it only takes a minute to find your level.",
    "copy.allCaughtUp":
      "🎉 All caught up — no more cards due right now. Come back later, or save more words from the Vocabulary notebook.",
    "copy.notAssessed": "Not assessed yet",
    "copy.levelHintUnassessed":
      "Take a 1-minute test so your practice starts at the right level.",
    "copy.levelHintAssessed": "Your lessons and conversations start at this level.",
    "copy.learningEnglish": "Your lessons, reading and AI conversations are in English.",
    "copy.learningChinese":
      "Your lessons, reading and AI conversations are in Mandarin Chinese.",
    "copy.startHere": "START HERE",
    "copy.words": "words",
    "copy.characters": "characters",
  },

  zh: {
    // --- shell / sidebar ---
    "nav.logout": "退出登录",
    "sidebar.imLearning": "我在学",
    "sidebar.interfaceLanguage": "界面语言",
    "sidebar.myLevel": "我的水平",
    "sidebar.newConversation": "新建对话",
    "sidebar.vocabularyNotebook": "生词本",
    "sidebar.myProgress": "我的进度",
    "sidebar.pronunciationPractice": "发音练习",
    "sidebar.aiPartnerVoice": "AI 伙伴的声音",
    "sidebar.speakRepliesAloud": "朗读回复",

    // --- buttons ---
    "btn.takePlacementTest": "参加水平测试",
    "btn.retakePlacementTest": "重新测试",
    "btn.startConversation": "开始对话",
    "btn.add": "添加",
    "btn.listen": "🔊 听",
    "btn.record": "🎤 录音",
    "btn.send": "发送",
    "btn.voiceMode": "🎙️ 开始免提语音对话",
    "btn.backToTopics": "← 返回语法点",
    "btn.newExercise": "换一题",
    "btn.backToPassages": "← 返回阅读列表",
    "btn.listenToPassage": "🔊 朗读课文",
    "btn.showPinyin": "显示拼音",
    "btn.hidePinyin": "隐藏拼音",
    "btn.showTranslation": "显示翻译",
    "btn.hideTranslation": "隐藏翻译",
    "btn.submitAnswers": "提交答案",
    "btn.backToClips": "← 返回听力列表",
    "btn.play": "▶ 播放",
    "btn.showTranscript": "显示原文",
    "btn.playSentence": "🔊 播放句子",
    "btn.check": "检查",
    "btn.nextSentence": "下一句 →",
    "btn.backToPrompts": "← 返回写作题目",
    "btn.getAiFeedback": "获取 AI 反馈",
    "btn.generateQuiz": "生成测验",
    "btn.submitQuiz": "提交测验",
    "btn.newQuiz": "新测验",
    "btn.refresh": "刷新",
    "btn.startReview": "开始复习",
    "btn.showAnswer": "显示答案",
    "btn.addToDeck": "加入复习",
    "btn.close": "关闭",

    // --- tabs ---
    "tab.path": "🗺️ 学习路径",
    "tab.conversation": "💬 对话",
    "tab.grammar": "📘 语法",
    "tab.reading": "📖 阅读",
    "tab.listening": "🎧 听力",
    "tab.writing": "✍️ 写作",
    "tab.quiz": "❓ 测验",
    "tab.review": "🔁 复习",
    "tab.history": "📜 记录",

    // --- section headings ---
    "heading.practice": "练习",
    "heading.summary": "内容概要",
    "heading.keyVocabulary": "重点词汇",
    "heading.comprehensionCheck": "理解检测",
    "heading.audio": "音频",
    "heading.dictationPractice": "听写练习",
    "heading.overallFeedback": "总体评价",
    "heading.strengths": "优点",
    "heading.suggestions": "改进建议",
    "heading.grammarIssues": "语法与拼写问题",
    "heading.modelAnswer": "参考范文",
    "heading.generateQuiz": "生成测验",
    "heading.recentQuizzes": "最近的测验",
    "heading.learningHistory": "学习记录",
    "heading.vocabularyReview": "词汇复习",
    "heading.starterWordPack": "入门词包",
    "heading.placementTest": "水平测试",
    "heading.learningPath": "学习路径",

    // --- placeholders ---
    "ph.lookUpWord": "查一个词…",
    "ph.practicePhrase": "输入要练习的句子…",
    "ph.typeMessage": "输入内容，按回车发送…",
    "ph.typeHeardSentence": "输入你听到的句子…",
    "ph.writeResponse": "在这里写你的回答…",

    // --- review ratings ---
    "review.again": "重来",
    "review.hard": "较难",
    "review.good": "记得",
    "review.easy": "很容易",

    // --- descriptive copy ---
    "copy.pathIntro":
      "一条从入门到高级的学习路线。在各个模块中完成练习后，这里会自动打勾。",
    "copy.reviewIntro":
      "间隔重复会在你快要忘记之前，把生词再次推送给你。根据记忆情况评分，系统据此安排下次复习时间。",
    "copy.seedIntro": "把某个等级的核心词一次加入复习卡片，让你从第一天就有内容可练。",
    "copy.placementIntro":
      "回答几道简短的题目。测试会根据你的作答自动调整难度——答对变难，答错变易——一分钟即可确定你的水平。",
    "copy.allCaughtUp": "🎉 全部完成——目前没有到期的卡片。稍后再来，或从生词本添加更多词语。",
    "copy.notAssessed": "尚未测试",
    "copy.levelHintUnassessed": "花一分钟做个测试，让练习从合适的等级开始。",
    "copy.levelHintAssessed": "你的课程和对话将从这个等级开始。",
    "copy.learningEnglish": "你的课程、阅读和 AI 对话使用英语。",
    "copy.learningChinese": "你的课程、阅读和 AI 对话使用普通话。",
    "copy.startHere": "从这里开始",
    "copy.words": "词",
    "copy.characters": "字",
  },
};

const DEFAULT_LOCALE = "en";
let currentLocale = DEFAULT_LOCALE;

/** Translates a key, falling back to English and then to the key itself. */
function t(key) {
  const table = STRINGS[currentLocale] || STRINGS[DEFAULT_LOCALE];
  return table[key] ?? STRINGS[DEFAULT_LOCALE][key] ?? key;
}

function getLocale() {
  return currentLocale;
}

function setLocale(locale) {
  currentLocale = STRINGS[locale] ? locale : DEFAULT_LOCALE;
}

/**
 * Applies translations to every element tagged with data-i18n (text content)
 * or data-i18n-placeholder (input placeholder) under `root`.
 *
 * Marking up the DOM rather than rebuilding it keeps this non-invasive: the
 * existing markup and all element ids are untouched, so no other code changes.
 */
function applyTranslations(root = document) {
  for (const el of root.querySelectorAll("[data-i18n]")) {
    el.textContent = t(el.getAttribute("data-i18n"));
  }
  for (const el of root.querySelectorAll("[data-i18n-placeholder]")) {
    el.placeholder = t(el.getAttribute("data-i18n-placeholder"));
  }
}

// Exposed for the test runner (node) as well as the browser/Electron renderer.
if (typeof module !== "undefined" && module.exports) {
  module.exports = { STRINGS, t, getLocale, setLocale, applyTranslations, DEFAULT_LOCALE };
}
