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

    "common.create": "Create",
    "common.select": "Select",
    "common.active": "Active",
    "common.restore": "Restore",
    "common.delete": "Delete",
    "common.size": "Size",
    "common.status": "Status",
    "common.filename": "Filename",
    "common.created": "Created",

    "teacher.myClasses": "My classes",
    "teacher.newClassName": "New class name…",
    "teacher.convTopics": "Conversation topics",
    "teacher.convTopicsHint": "Custom topics appear in your students' conversation picker.",
    "teacher.topicTitle": "Topic title…",
    "teacher.topicPrompt": "AI role/instructions (e.g. You are a museum guide…)",
    "teacher.addTopic": "Add topic",
    "teacher.selectClass": "Select or create a class to get started.",
    "teacher.roster": "Roster",
    "teacher.rosterHint": "Click a student to view their progress.",
    "teacher.studentEmail": "Student email",
    "teacher.displayName": "Display name",
    "teacher.initialPassword": "Initial password",
    "teacher.addStudent": "Add student",
    "teacher.assignments": "Assignments",
    "teacher.title": "Title",
    "teacher.description": "Description",
    "teacher.grammarReview": "Grammar mistakes review",
    "teacher.colStudent": "Student",
    "teacher.colOriginal": "Original",
    "teacher.colCorrected": "Corrected",
    "teacher.colRule": "Rule",
    "teacher.reports": "Reports",
    "teacher.downloadCsv": "Download CSV",
    "teacher.downloadPdf": "Download PDF",

    "admin.console": "Admin console",
    "admin.systemHealth": "System health",
    "admin.refresh": "Refresh",
    "admin.serverConfig": "Server configuration",
    "admin.modelMgmt": "AI model management",
    "admin.modelMgmtHint": "Selecting a model writes the choice for the AI service to pick up on its next restart — it does not hot-swap the running model.",
    "admin.modelFile": "Model file",
    "admin.backupRestore": "Backup & restore",
    "admin.createBackup": "Create backup now",
    "admin.createAccount": "Create teacher / student account",
    "admin.role.teacher": "Teacher",
    "admin.role.student": "Student",

    "super.role": "Platform super-admin",
    "super.title": "Platform administration — Schools",
    "super.createSchool": "Create a school",
    "super.schoolName": "School name",
    "super.createSchoolBtn": "Create school",
    "super.schools": "Schools",
    "super.colSchool": "School",
    "super.colAdmins": "Admins",
    "super.colTeachers": "Teachers",
    "super.colStudents": "Students",
    "super.colAddAdmin": "Add admin",
    "super.adminEmail": "Admin email",
    "super.createAdmin": "Create admin",
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

    "common.create": "创建",
    "common.select": "选择",
    "common.active": "使用中",
    "common.restore": "恢复",
    "common.delete": "删除",
    "common.size": "大小",
    "common.status": "状态",
    "common.filename": "文件名",
    "common.created": "创建时间",

    "teacher.myClasses": "我的班级",
    "teacher.newClassName": "新班级名称…",
    "teacher.convTopics": "对话主题",
    "teacher.convTopicsHint": "自定义主题会出现在学生的对话选择器中。",
    "teacher.topicTitle": "主题标题…",
    "teacher.topicPrompt": "AI 角色/指令（例如：你是一名博物馆讲解员…）",
    "teacher.addTopic": "添加主题",
    "teacher.selectClass": "请选择或创建一个班级以开始。",
    "teacher.roster": "花名册",
    "teacher.rosterHint": "点击学生可查看其学习进度。",
    "teacher.studentEmail": "学生邮箱",
    "teacher.displayName": "显示名称",
    "teacher.initialPassword": "初始密码",
    "teacher.addStudent": "添加学生",
    "teacher.assignments": "作业",
    "teacher.title": "标题",
    "teacher.description": "描述",
    "teacher.grammarReview": "语法错误回顾",
    "teacher.colStudent": "学生",
    "teacher.colOriginal": "原句",
    "teacher.colCorrected": "更正",
    "teacher.colRule": "规则",
    "teacher.reports": "报告",
    "teacher.downloadCsv": "下载 CSV",
    "teacher.downloadPdf": "下载 PDF",

    "admin.console": "管理控制台",
    "admin.systemHealth": "系统状态",
    "admin.refresh": "刷新",
    "admin.serverConfig": "服务器配置",
    "admin.modelMgmt": "AI 模型管理",
    "admin.modelMgmtHint": "选择模型只是记录选项，供 AI 服务下次重启时使用——不会热切换正在运行的模型。",
    "admin.modelFile": "模型文件",
    "admin.backupRestore": "备份与恢复",
    "admin.createBackup": "立即创建备份",
    "admin.createAccount": "创建教师 / 学生账户",
    "admin.role.teacher": "教师",
    "admin.role.student": "学生",

    "super.role": "平台超级管理员",
    "super.title": "平台管理 — 学校",
    "super.createSchool": "创建学校",
    "super.schoolName": "学校名称",
    "super.createSchoolBtn": "创建学校",
    "super.schools": "学校",
    "super.colSchool": "学校",
    "super.colAdmins": "管理员",
    "super.colTeachers": "教师",
    "super.colStudents": "学生",
    "super.colAddAdmin": "添加管理员",
    "super.adminEmail": "管理员邮箱",
    "super.createAdmin": "创建管理员",
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
  // Localize built-in scenario <option>s in place (student picker + the
  // teacher's assignment scenario dropdown).
  for (const id of ["scenarioSelect", "assignmentScenario"]) {
    const sel = document.getElementById(id);
    if (!sel) continue;
    for (const opt of sel.options) {
      if (SCENARIO_LABELS_I18N.en[opt.value]) opt.textContent = scenarioLabel(opt.value);
    }
  }
}

window.i18n = { getLang, setLang, t, applyI18n, scenarioLabel, aiLanguageInstruction };
