// Lightweight offline i18n layer (Chinese-support feature).
//
// The UI language is chosen on the login screen and persisted to localStorage.
// Static markup carries `data-i18n` (textContent), `data-i18n-ph` (placeholder)
// or `data-i18n-html` (innerHTML) attributes whose value is a dictionary key;
// applyI18n() fills them in. Dynamic strings in renderer.js call t(key, vars).
//
// The two supported languages: English ("en") and Simplified Chinese ("zh").
// The app is a language-learning tool, so the *target* language it teaches is
// still driven by the chosen mode (see uiLanguageForAi()): English mode teaches
// English, Chinese mode teaches Chinese.

const TRANSLATIONS = {
  en: {
    "app.title": "Offline AI Language Learning System",
    "auth.checking": "Checking backend…",
    "auth.email": "Email",
    "auth.password": "Password",
    "auth.login": "Log in",
    "auth.language": "Language",
    "lang.en": "English",
    "lang.zh": "中文 (Chinese)",

    "sidebar.name": "Name",
    "sidebar.role": "Role",
    "sidebar.email": "Email",
    "sidebar.logout": "Log out",
    "sidebar.newConversation": "New conversation",
    "sidebar.aiVoice": "AI partner voice",
    "voice.female": "Female voice",
    "voice.male": "Male voice",
    "sidebar.speakAloud": "Speak replies aloud",
    "sidebar.startConversation": "Start conversation",
    "sidebar.vocabNotebook": "Vocabulary notebook",
    "sidebar.lookupWord": "Look up a word…",
    "sidebar.add": "Add",

    "tab.conversation": "💬 Conversation",
    "tab.grammar": "📘 Grammar",
    "tab.reading": "📖 Reading",
    "tab.listening": "🎧 Listening",
    "tab.writing": "✍️ Writing",
    "tab.quiz": "❓ Quiz",
    "tab.history": "📜 History",

    "avatar.partner": "Your AI partner",
    "avatar.female": "Your AI partner (female voice)",
    "avatar.male": "Your AI partner (male voice)",
    "voice.start": "🎙️ Start hands-free voice chat",
    "voice.stop": "⏹️ Stop voice chat",
    "voice.yourTurn": "🎙️ Your turn — start speaking.",
    "voice.listening": "🎙️ Listening… just start speaking.",
    "voice.listeningYou": "🎤 Listening to you…",
    "voice.thinking": "💭 Thinking…",
    "voice.replying": "🔊 AI is replying…",
    "voice.busy": "⏳ AI is busy — one moment…",
    "composer.type": "Type a message and press Enter…",
    "composer.send": "Send",
    "chat.started": "New {scenario} conversation started. Say hello!",
    "chat.errorContacting": "(error contacting the AI service)",
    "chat.busy": "⏳ The AI is busy finishing another reply — please wait a moment and send again.",

    "err.backendUnreachable": "Could not reach the backend.",
    "err.startConversation": "Could not start conversation",
    "history.title": "Learning history",
    "history.refresh": "Refresh",
    "history.when": "When",
    "history.activity": "Activity",
    "history.detail": "Detail",
    "history.score": "Score",
  },
  zh: {
    "app.title": "离线 AI 语言学习系统",
    "auth.checking": "正在检查后端服务…",
    "auth.email": "邮箱",
    "auth.password": "密码",
    "auth.login": "登录",
    "auth.language": "语言",
    "lang.en": "English（英文）",
    "lang.zh": "中文",

    "sidebar.name": "姓名",
    "sidebar.role": "身份",
    "sidebar.email": "邮箱",
    "sidebar.logout": "退出登录",
    "sidebar.newConversation": "新建对话",
    "sidebar.aiVoice": "AI 伙伴语音",
    "voice.female": "女声",
    "voice.male": "男声",
    "sidebar.speakAloud": "朗读回复",
    "sidebar.startConversation": "开始对话",
    "sidebar.vocabNotebook": "生词本",
    "sidebar.lookupWord": "查一个词…",
    "sidebar.add": "添加",

    "tab.conversation": "💬 对话",
    "tab.grammar": "📘 语法",
    "tab.reading": "📖 阅读",
    "tab.listening": "🎧 听力",
    "tab.writing": "✍️ 写作",
    "tab.quiz": "❓ 测验",
    "tab.history": "📜 历史",

    "avatar.partner": "你的 AI 伙伴",
    "avatar.female": "你的 AI 伙伴（女声）",
    "avatar.male": "你的 AI 伙伴（男声）",
    "voice.start": "🎙️ 开始免手动语音对话",
    "voice.stop": "⏹️ 停止语音对话",
    "voice.yourTurn": "🎙️ 轮到你了——请开始说话。",
    "voice.listening": "🎙️ 正在聆听——直接开始说话即可。",
    "voice.listeningYou": "🎤 正在听你说…",
    "voice.thinking": "💭 思考中…",
    "voice.replying": "🔊 AI 正在回复…",
    "voice.busy": "⏳ AI 正忙——请稍候…",
    "composer.type": "输入消息后按回车发送…",
    "composer.send": "发送",
    "chat.started": "新的{scenario}对话已开始。快打个招呼吧！",
    "chat.errorContacting": "（无法连接 AI 服务）",
    "chat.busy": "⏳ AI 正在完成上一条回复——请稍候再发送。",

    "err.backendUnreachable": "无法连接后端服务。",
    "err.startConversation": "无法开始对话",
    "history.title": "学习历史",
    "history.refresh": "刷新",
    "history.when": "时间",
    "history.activity": "活动",
    "history.detail": "详情",
    "history.score": "分数",
  },
};

// Localized labels for the built-in conversation scenarios (the <select>).
const SCENARIO_LABELS_I18N = {
  en: {
    free_talk: "Free Talk", role_play: "Role Play", debate: "Debate Practice",
    travel: "Travel", airport: "Airport", restaurant: "Restaurant",
    business_meeting: "Business Meeting", job_interview: "Job Interview",
    shopping: "Shopping", technology: "Technology", sports: "Sports",
    movies: "Movies", daily_life: "Daily Life", hospital: "Hospital",
    hotel: "Hotel", school: "School", university: "University",
    coffee_shop: "Coffee Shop", emergency: "Emergency", family: "Family",
    culture: "Culture",
  },
  zh: {
    free_talk: "自由对话", role_play: "角色扮演", debate: "辩论练习",
    travel: "旅行", airport: "机场", restaurant: "餐厅",
    business_meeting: "商务会议", job_interview: "求职面试",
    shopping: "购物", technology: "科技", sports: "运动",
    movies: "电影", daily_life: "日常生活", hospital: "医院",
    hotel: "酒店", school: "学校", university: "大学",
    coffee_shop: "咖啡馆", emergency: "紧急情况", family: "家庭",
    culture: "文化",
  },
};

let _lang = localStorage.getItem("uiLang") || "en";

function getLang() {
  return _lang;
}

function setLang(lang) {
  _lang = TRANSLATIONS[lang] ? lang : "en";
  localStorage.setItem("uiLang", _lang);
  document.documentElement.setAttribute("lang", _lang === "zh" ? "zh-CN" : "en");
  applyI18n();
}

function t(key, vars) {
  const table = TRANSLATIONS[_lang] || TRANSLATIONS.en;
  let s = table[key] != null ? table[key] : (TRANSLATIONS.en[key] != null ? TRANSLATIONS.en[key] : key);
  if (vars) {
    for (const k of Object.keys(vars)) s = s.replace(new RegExp("\\{" + k + "\\}", "g"), vars[k]);
  }
  return s;
}

function scenarioLabel(value) {
  const table = SCENARIO_LABELS_I18N[_lang] || SCENARIO_LABELS_I18N.en;
  return table[value] || value;
}

// The instruction appended to the AI system prompt so the conversation partner
// speaks the language the student is learning in this mode.
function aiLanguageInstruction() {
  return _lang === "zh"
    ? "Always reply in Simplified Chinese (Mandarin). Keep replies natural and at a level appropriate for a Chinese learner."
    : "";
}

// Fill every [data-i18n*] element under `root` for the current language.
function applyI18n(root) {
  const scope = root || document;
  scope.querySelectorAll("[data-i18n]").forEach((el) => {
    el.textContent = t(el.getAttribute("data-i18n"));
  });
  scope.querySelectorAll("[data-i18n-ph]").forEach((el) => {
    el.setAttribute("placeholder", t(el.getAttribute("data-i18n-ph")));
  });
  scope.querySelectorAll("[data-i18n-html]").forEach((el) => {
    el.innerHTML = t(el.getAttribute("data-i18n-html"));
  });
  // Localize built-in scenario <option>s in place.
  const sel = document.getElementById("scenarioSelect");
  if (sel) {
    for (const opt of sel.options) {
      if (SCENARIO_LABELS_I18N.en[opt.value]) opt.textContent = scenarioLabel(opt.value);
    }
  }
}

window.i18n = { getLang, setLang, t, applyI18n, scenarioLabel, aiLanguageInstruction };
