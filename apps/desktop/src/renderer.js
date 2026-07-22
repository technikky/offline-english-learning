const API_BASE = "http://127.0.0.1:4310";

// Friendly display names for CEFR levels (Stage 13) -- mirrors
// packages/types' CEFR_LABELS; duplicated here since this plain script tag
// isn't bundled against the shared types package.
const CEFR_LABELS = {
  A1: "Beginner",
  A2: "Elementary",
  B1: "Intermediate",
  B2: "Upper Intermediate",
  C1: "Advanced",
  C2: "Native-like",
};

function formatCefrLevel(level) {
  return CEFR_LABELS[level] ? `${level} — ${CEFR_LABELS[level]}` : level;
}

let accessToken = null;
let currentConversationId = null;
let currentClassId = null;

async function checkHealth() {
  const el = document.getElementById("status");
  try {
    const res = await fetch(`${API_BASE}/health`);
    const data = await res.json();
    el.textContent = `Backend OK — db connected: ${data.dbConnected} (${data.timestamp})`;
    el.className = "status ok";
  } catch (err) {
    el.textContent = "Backend unreachable — is start-dev running?";
    el.className = "status fail";
  }
}

function showLoggedIn(user) {
  document.getElementById("authScreen").classList.add("hidden");

  if (user.role === "super_admin") {
    document.getElementById("superAdminView").classList.remove("hidden");
    document.getElementById("superAdminView").style.display = "flex";
    document.getElementById("superAdminName").textContent = user.displayName;
    loadSchools();
    return;
  }

  if (user.role === "admin") {
    document.getElementById("adminView").classList.remove("hidden");
    document.getElementById("adminView").style.display = "flex";
    document.getElementById("adminProfileName").textContent = user.displayName;
    document.getElementById("adminProfileRole").textContent =
      user.schoolName ? `admin — ${user.schoolName}` : user.role;
    loadSystemHealth();
    loadServerConfig();
    loadAiModels();
    loadBackups();
    return;
  }

  if (user.role === "teacher") {
    document.getElementById("teacherView").classList.remove("hidden");
    document.getElementById("teacherView").style.display = "flex";
    document.getElementById("teacherProfileName").textContent = user.displayName;
    document.getElementById("teacherProfileRole").textContent = user.role;
    loadClasses();
    loadTeacherTopics();
    return;
  }

  document.getElementById("appView").classList.remove("hidden");
  document.getElementById("appView").style.display = "flex";
  document.getElementById("profileName").textContent = user.displayName;
  document.getElementById("profileRole").textContent = user.role;
  document.getElementById("profileEmail").textContent = user.email;
  renderAvatar();
  loadTargetLanguage();
  loadQuizCategories();
  loadConversationTopics();
  loadNotebook();
  loadStudentAnalytics();
  loadGrammarTopics();
  loadReadingPassages();
  loadListeningClips();
  loadWritingPrompts();
  loadQuizProgress();
  loadLearningHistory();
  refreshReviewBadge();
  loadPlacementStatus();
}

function showLoggedOut() {
  if (voiceMode.active) stopVoiceMode();
  accessToken = null;
  currentConversationId = null;
  currentClassId = null;
  document.getElementById("voiceModeBar").classList.add("hidden");
  document.getElementById("appView").classList.add("hidden");
  document.getElementById("appView").style.display = "none";
  document.getElementById("teacherView").classList.add("hidden");
  document.getElementById("teacherView").style.display = "none";
  document.getElementById("adminView").classList.add("hidden");
  document.getElementById("adminView").style.display = "none";
  document.getElementById("superAdminView").classList.add("hidden");
  document.getElementById("superAdminView").style.display = "none";
  document.getElementById("authScreen").classList.remove("hidden");
  document.getElementById("email").value = "";
  document.getElementById("password").value = "";
  document.getElementById("chatLog").innerHTML = "";
  document.getElementById("messageInput").disabled = true;
  document.getElementById("sendBtn").disabled = true;
  document.getElementById("notebookList").innerHTML = "";
  const wordsToLearn = document.getElementById("wordsToLearn");
  wordsToLearn.innerHTML = "";
  wordsToLearn.classList.add("hidden");
  document.getElementById("classList").innerHTML = "";
  document.getElementById("classDetail").classList.add("hidden");
  document.getElementById("noClassSelected").classList.remove("hidden");
  document.getElementById("studentAnalyticsPanel").innerHTML = "Loading…";
  document.getElementById("teacherStudentAnalyticsPanel").innerHTML = "";
  document.getElementById("pronunciationTarget").value = "";
  document.getElementById("pronunciationResult").classList.add("hidden");
  document.getElementById("pronunciationResult").innerHTML = "";
  document.getElementById("systemHealthTable").innerHTML = "";
  document.getElementById("serverConfigTable").innerHTML = "";
  document.getElementById("aiModelsBody").innerHTML = "";
  document.getElementById("backupsBody").innerHTML = "";
  document.getElementById("createUserError").textContent = "";
  document.getElementById("createUserSuccess").textContent = "";
  document.getElementById("grammarTopicList").innerHTML = "";
  document.getElementById("grammarLessonDetail").classList.add("hidden");
  document.getElementById("grammarExerciseArea").innerHTML = "";
  document.getElementById("readingPassageList").innerHTML = "";
  document.getElementById("readingPassageDetail").classList.add("hidden");
  document.getElementById("readingQuestions").innerHTML = "";
  document.getElementById("readingResult").innerHTML = "";
  document.getElementById("listeningClipList").innerHTML = "";
  document.getElementById("listeningClipDetail").classList.add("hidden");
  document.getElementById("listeningQuestions").innerHTML = "";
  document.getElementById("listeningResult").innerHTML = "";
  document.getElementById("dictationResult").innerHTML = "";
  document.getElementById("writingPromptList").innerHTML = "";
  document.getElementById("writingPromptDetail").classList.add("hidden");
  document.getElementById("writingTextarea").value = "";
  document.getElementById("writingFeedback").classList.add("hidden");
  document.getElementById("quizQuestions").innerHTML = "";
  document.getElementById("quizProgress").innerHTML = "";
  document.getElementById("quizResultSummary").innerHTML = "";
  document.getElementById("quizActive").classList.add("hidden");
  document.getElementById("quizSetup").classList.remove("hidden");
  document.getElementById("historyBody").innerHTML = "";
  document.getElementById("historySummary").innerHTML = "";
  showChatTab();
}

async function login() {
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;
  const errorEl = document.getElementById("loginError");
  errorEl.textContent = "";

  try {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      errorEl.textContent = body.error || "Login failed";
      return;
    }

    const data = await res.json();
    accessToken = data.accessToken;
    showLoggedIn(data.user);
  } catch (err) {
    errorEl.textContent = "Could not reach the backend.";
  }
}

function logout() {
  showLoggedOut();
}

function appendBubble(role, text) {
  const log = document.getElementById("chatLog");
  const bubble = document.createElement("div");
  bubble.className = `bubble ${role}`;
  bubble.textContent = text;
  log.appendChild(bubble);
  log.scrollTop = log.scrollHeight;
  return bubble;
}

async function explainMistake(mistakeId, box) {
  box.textContent = "Explaining…";
  try {
    const res = await fetch(`${API_BASE}/grammar/explain`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ mistakeId }),
    });

    if (!res.ok) {
      box.textContent = "Could not get an explanation.";
      return;
    }

    const data = await res.json();
    box.innerHTML = "";
    const explanation = document.createElement("div");
    explanation.textContent = data.explanation;
    box.appendChild(explanation);
    if (data.example) {
      const example = document.createElement("div");
      example.className = "example";
      example.textContent = data.example;
      box.appendChild(example);
    }
  } catch (err) {
    box.textContent = "Could not reach the AI service.";
  }
}

function renderCorrections(mistakes) {
  if (!mistakes || mistakes.length === 0) return null;

  const container = document.createElement("div");
  container.className = "corrections";

  for (const mistake of mistakes) {
    const item = document.createElement("div");
    item.className = "correction-item";

    const row = document.createElement("div");
    row.className = "correction-row";

    const text = document.createElement("span");
    text.className = "correction-text";
    text.innerHTML =
      `<span class="strike">${mistake.originalText}</span>` +
      `<span class="arrow">→</span>` +
      `<span class="fix">${mistake.correctedText}</span>`;

    const explainBtn = document.createElement("button");
    explainBtn.className = "explain-btn";
    explainBtn.textContent = "Explain";

    row.appendChild(text);
    row.appendChild(explainBtn);
    item.appendChild(row);

    const explanationBox = document.createElement("div");
    explanationBox.className = "hidden explanation-box";

    if (mistake.explanation) {
      explanationBox.classList.remove("hidden");
      const explanation = document.createElement("div");
      explanation.textContent = mistake.explanation;
      explanationBox.appendChild(explanation);
      if (mistake.example) {
        const example = document.createElement("div");
        example.className = "example";
        example.textContent = mistake.example;
        explanationBox.appendChild(example);
      }
    }

    explainBtn.addEventListener("click", () => {
      const isHidden = explanationBox.classList.contains("hidden");
      explanationBox.classList.toggle("hidden");
      if (isHidden && !mistake.explanation) {
        explainMistake(mistake.id, explanationBox);
      }
    });

    item.appendChild(explanationBox);
    container.appendChild(item);
  }

  return container;
}

function renderNotebookDetail(vocab) {
  const box = document.createElement("div");
  box.className = "notebook-detail";

  const def = document.createElement("div");
  def.textContent = vocab.definition;
  box.appendChild(def);

  if (vocab.example) {
    const example = document.createElement("div");
    example.className = "example";
    example.textContent = vocab.example;
    box.appendChild(example);
  }

  if (vocab.synonyms && vocab.synonyms.length > 0) {
    const synonyms = document.createElement("div");
    synonyms.className = "synonyms";
    synonyms.textContent = `Synonyms: ${vocab.synonyms.join(", ")}`;
    box.appendChild(synonyms);
  }

  if (vocab.antonyms && vocab.antonyms.length > 0) {
    const antonyms = document.createElement("div");
    antonyms.textContent = `Antonyms: ${vocab.antonyms.join(", ")}`;
    box.appendChild(antonyms);
  }

  return box;
}

function renderNotebookItem(entry) {
  const item = document.createElement("div");
  item.className = "notebook-item";

  const row = document.createElement("div");
  row.className = "notebook-item-row";

  const wordSpan = document.createElement("span");
  wordSpan.innerHTML =
    `<span class="word">${entry.vocabulary.word}</span>` +
    `<span class="cefr">${entry.vocabulary.cefrLevel}</span>`;

  const removeBtn = document.createElement("button");
  removeBtn.className = "remove-btn";
  removeBtn.textContent = "Remove";
  removeBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    removeFromNotebook(entry.id);
  });

  row.appendChild(wordSpan);
  row.appendChild(removeBtn);
  item.appendChild(row);

  const detail = renderNotebookDetail(entry.vocabulary);
  detail.classList.add("hidden");
  item.appendChild(detail);

  item.addEventListener("click", () => {
    detail.classList.toggle("hidden");
  });

  return item;
}

async function loadNotebook() {
  try {
    const res = await fetch(`${API_BASE}/vocabulary/notebook`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!res.ok) return;

    const entries = await res.json();
    const list = document.getElementById("notebookList");
    list.innerHTML = "";
    for (const entry of entries) {
      list.appendChild(renderNotebookItem(entry));
    }
  } catch (err) {
    // silently ignore; the notebook is a convenience panel, not core flow
  }
}

// Rebuilds the "New conversation" topic dropdown from the backend so that
// custom topics a teacher has added for the school appear alongside the
// built-in scenarios. Falls back silently to the hardcoded <option>s in
// index.html if the request fails.
async function loadConversationTopics() {
  const select = document.getElementById("scenarioSelect");
  if (!select) return;
  try {
    const res = await fetch(`${API_BASE}/topics`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!res.ok) return;

    const options = await res.json();
    if (!Array.isArray(options) || options.length === 0) return;

    const previous = select.value;
    select.innerHTML = "";
    let customGroup = null;
    for (const opt of options) {
      const el = document.createElement("option");
      el.value = opt.value;
      el.textContent = opt.label;
      if (opt.isCustom) {
        if (!customGroup) {
          customGroup = document.createElement("optgroup");
          customGroup.label = "School topics";
          select.appendChild(customGroup);
        }
        customGroup.appendChild(el);
      } else {
        select.appendChild(el);
      }
    }
    // Preserve the user's selection across refreshes when still available.
    if (previous && [...select.options].some((o) => o.value === previous)) {
      select.value = previous;
    }
  } catch (err) {
    // The dropdown already has built-in options; a failed refresh is non-fatal.
  }
}

async function addWordToNotebook(word, errorEl) {
  try {
    const res = await fetch(`${API_BASE}/vocabulary/notebook`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ word }),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      if (errorEl) errorEl.textContent = body.error || "Could not add word";
      return;
    }

    await loadNotebook();
    refreshReviewBadge(); // a newly-saved word is due immediately
  } catch (err) {
    if (errorEl) errorEl.textContent = "Could not reach the backend.";
  }
}

async function removeFromNotebook(entryId) {
  try {
    await fetch(`${API_BASE}/vocabulary/notebook/${entryId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    await loadNotebook();
    refreshReviewBadge();
  } catch (err) {
    // ignore; list will just look stale until next reload
  }
}

async function loadRecommendations(conversationId) {
  const container = document.getElementById("wordsToLearn");
  try {
    const res = await fetch(
      `${API_BASE}/vocabulary/recommendations?conversationId=${conversationId}`,
      { headers: { Authorization: `Bearer ${accessToken}` } },
    );
    if (!res.ok) return;

    const data = await res.json();
    if (!data.words || data.words.length === 0) return;

    container.innerHTML = "";
    const label = document.createElement("span");
    label.className = "label";
    label.textContent = "Words to learn:";
    container.appendChild(label);

    for (const word of data.words) {
      const chip = document.createElement("span");
      chip.className = "word-chip";

      const text = document.createElement("span");
      text.textContent = word.word;
      chip.appendChild(text);

      const addBtn = document.createElement("button");
      addBtn.textContent = "+ Add";
      addBtn.addEventListener("click", async () => {
        addBtn.disabled = true;
        addBtn.textContent = "Added";
        await addWordToNotebook(word.word, null);
      });
      chip.appendChild(addBtn);

      container.appendChild(chip);
    }

    container.classList.remove("hidden");
  } catch (err) {
    // recommendations are a nice-to-have; fail silently
  }
}

// ---- AI conversation avatar + voice (Stage 16) ----
// Inline SVGs (no external assets — the app is fully offline). Each has an
// `.avatar-mouth` element the CSS animates while the avatar is "speaking".
const AVATAR_SVGS = {
  female: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" aria-label="Female AI avatar">
    <circle cx="50" cy="50" r="48" fill="#312e81"/>
    <path d="M22 52 Q20 20 50 18 Q80 20 78 52 L78 74 Q78 60 68 58 L32 58 Q22 60 22 74 Z" fill="#7c3f2e"/>
    <circle cx="50" cy="50" r="24" fill="#f2c9a0"/>
    <circle cx="42" cy="48" r="3" fill="#1f2937"/>
    <circle cx="58" cy="48" r="3" fill="#1f2937"/>
    <ellipse class="avatar-mouth" cx="50" cy="60" rx="6" ry="3" fill="#a83f52"/>
    <path d="M26 50 Q24 30 50 28 Q76 30 74 50 Q70 40 50 40 Q30 40 26 50 Z" fill="#7c3f2e"/>
    <circle cx="30" cy="60" r="3.5" fill="#f2c9a0"/>
    <circle cx="70" cy="60" r="3.5" fill="#f2c9a0"/>
  </svg>`,
  male: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" aria-label="Male AI avatar">
    <circle cx="50" cy="50" r="48" fill="#312e81"/>
    <rect x="30" y="70" width="40" height="20" rx="6" fill="#1e293b"/>
    <circle cx="50" cy="50" r="24" fill="#f2c9a0"/>
    <path d="M28 44 Q26 24 50 24 Q74 24 72 44 Q72 34 50 34 Q28 34 28 44 Z" fill="#3b2417"/>
    <circle cx="42" cy="48" r="3" fill="#1f2937"/>
    <circle cx="58" cy="48" r="3" fill="#1f2937"/>
    <ellipse class="avatar-mouth" cx="50" cy="61" rx="6" ry="2.5" fill="#a83f52"/>
    <path d="M40 66 Q50 72 60 66" stroke="#c98d63" stroke-width="2" fill="none"/>
  </svg>`,
};

function getSelectedVoice() {
  const el = document.getElementById("voiceSelect");
  return el && el.value === "male" ? "male" : "female";
}

function renderAvatar() {
  const voice = getSelectedVoice();
  const holder = document.getElementById("avatarHolder");
  holder.innerHTML = AVATAR_SVGS[voice];
  document.getElementById("avatarName").textContent =
    voice === "male" ? "Your AI partner (male voice)" : "Your AI partner (female voice)";
}

// Speaks the given text in the selected voice and animates the avatar's mouth
// for the duration of playback. No-op (silent) if "Speak replies aloud" is off.
async function speakAsAvatar(text, force = false) {
  const autoSpeak = document.getElementById("autoSpeakToggle");
  // Voice mode (force) always speaks; text mode respects the toggle.
  if ((!force && (!autoSpeak || !autoSpeak.checked)) || !text || !text.trim()) return;

  const holder = document.getElementById("avatarHolder");
  try {
    const res = await fetch(`${API_BASE}/speech/synthesize`, {
      method: "POST",
      headers: authHeaders({ "Content-Type": "application/json" }),
      body: JSON.stringify({ text, voice: getSelectedVoice() }),
    });
    if (!res.ok) return;
    const data = await res.json();
    holder.classList.add("speaking");
    await playBase64Wav(data.audioBase64);
  } catch (err) {
    // speaking is a non-critical enhancement; the text reply is already shown
  } finally {
    holder.classList.remove("speaking");
  }
}

async function startConversation() {
  if (voiceMode.active) stopVoiceMode();
  const scenario = document.getElementById("scenarioSelect").value;
  const errorEl = document.getElementById("conversationError");
  errorEl.textContent = "";

  try {
    const res = await fetch(`${API_BASE}/conversations`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ scenario }),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      errorEl.textContent = body.error || "Could not start conversation";
      return;
    }

    const conversation = await res.json();
    currentConversationId = conversation.id;
    document.getElementById("chatLog").innerHTML = "";
    document.getElementById("messageInput").disabled = false;
    document.getElementById("sendBtn").disabled = false;
    const wordsToLearn = document.getElementById("wordsToLearn");
    wordsToLearn.innerHTML = "";
    wordsToLearn.classList.add("hidden");
    document.getElementById("voiceModeBar").classList.remove("hidden");
    appendBubble("assistant", `New ${scenario.replace("_", " ")} conversation started. Say hello!`);
  } catch (err) {
    errorEl.textContent = "Could not reach the backend.";
  }
}

async function sendMessage() {
  const input = document.getElementById("messageInput");
  const content = input.value.trim();
  if (!content || !currentConversationId) return;
  input.value = "";
  await sendMessageContent(content);
  input.focus();
}

/** Sends one user turn, streams + renders the AI reply, speaks it, and returns
 * the reply text. Shared by the typed composer and hands-free voice mode
 * (Stage 21). `forceSpeak` makes the avatar always talk (used by voice mode). */
async function sendMessageContent(content, { forceSpeak = false } = {}) {
  if (!content || !currentConversationId) return "";

  document.getElementById("messageInput").disabled = true;
  document.getElementById("sendBtn").disabled = true;

  appendBubble("user", content);
  const assistantBubble = appendBubble("assistant", "");
  let displayedText = "";

  try {
    const res = await fetch(`${API_BASE}/conversations/${currentConversationId}/messages`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ content }),
    });

    if (!res.ok || !res.body) {
      assistantBubble.textContent = "(error contacting the AI service)";
      return "";
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      let newlineIndex;
      while ((newlineIndex = buffer.indexOf("\n")) >= 0) {
        const line = buffer.slice(0, newlineIndex);
        buffer = buffer.slice(newlineIndex + 1);
        if (!line.trim()) continue;

        try {
          const parsed = JSON.parse(line);
          if (parsed.grammarMistakes) {
            const corrections = renderCorrections(parsed.grammarMistakes);
            if (corrections) {
              document.getElementById("chatLog").insertBefore(corrections, assistantBubble);
            }
          } else if (parsed.token) {
            displayedText += parsed.token;
            assistantBubble.textContent = displayedText;
            document.getElementById("chatLog").scrollTop = document.getElementById("chatLog").scrollHeight;
          }
        } catch {
          // ignore malformed line
        }
      }
    }

    // Let the AI avatar "conduct" the conversation by speaking its reply
    // aloud in the selected voice (Stage 16). Non-blocking failures only.
    await speakAsAvatar(displayedText, forceSpeak);
  } catch (err) {
    assistantBubble.textContent = "(error contacting the AI service)";
  } finally {
    document.getElementById("messageInput").disabled = false;
    document.getElementById("sendBtn").disabled = false;
    if (currentConversationId) loadRecommendations(currentConversationId);
  }
  return displayedText;
}

function authHeaders(extra) {
  return { Authorization: `Bearer ${accessToken}`, ...(extra || {}) };
}

async function loadClasses() {
  try {
    const res = await fetch(`${API_BASE}/teacher/classes`, { headers: authHeaders() });
    if (!res.ok) return;
    const classesList = await res.json();

    const container = document.getElementById("classList");
    container.innerHTML = "";
    for (const cls of classesList) {
      const item = document.createElement("div");
      item.className = "class-list-item" + (cls.id === currentClassId ? " active" : "");
      item.textContent = cls.name;
      item.addEventListener("click", () => selectClass(cls.id));
      container.appendChild(item);
    }
  } catch (err) {
    // class list is not critical path; fail silently
  }
}

async function createClass() {
  const input = document.getElementById("newClassNameInput");
  const errorEl = document.getElementById("createClassError");
  errorEl.textContent = "";
  const name = input.value.trim();
  if (!name) return;

  try {
    const res = await fetch(`${API_BASE}/teacher/classes`, {
      method: "POST",
      headers: authHeaders({ "Content-Type": "application/json" }),
      body: JSON.stringify({ name }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      errorEl.textContent = body.error || "Could not create class";
      return;
    }
    input.value = "";
    await loadClasses();
  } catch (err) {
    errorEl.textContent = "Could not reach the backend.";
  }
}

// --- Teacher custom conversation topics (Stage 23) ---
async function loadTeacherTopics() {
  const container = document.getElementById("teacherTopicList");
  if (!container) return;
  try {
    const res = await fetch(`${API_BASE}/teacher/topics`, { headers: authHeaders() });
    if (!res.ok) return;
    const topics = await res.json();
    container.innerHTML = "";
    if (topics.length === 0) {
      container.innerHTML = '<div style="font-size:12px;opacity:0.7">No custom topics yet.</div>';
      return;
    }
    for (const topic of topics) {
      const item = document.createElement("div");
      item.className = "class-list-item";
      item.style.display = "flex";
      item.style.justifyContent = "space-between";
      item.style.alignItems = "center";
      item.style.gap = "8px";

      const label = document.createElement("span");
      label.textContent = topic.title;
      label.title = topic.prompt;
      item.appendChild(label);

      const del = document.createElement("button");
      del.className = "secondary";
      del.textContent = "Delete";
      del.style.padding = "2px 8px";
      del.addEventListener("click", () => deleteTeacherTopic(topic.id));
      item.appendChild(del);

      container.appendChild(item);
    }
  } catch (err) {
    // non-critical panel; fail silently
  }
}

async function createTeacherTopic() {
  const titleInput = document.getElementById("newTopicTitle");
  const promptInput = document.getElementById("newTopicPrompt");
  const errorEl = document.getElementById("createTopicError");
  errorEl.textContent = "";
  const title = titleInput.value.trim();
  const prompt = promptInput.value.trim();
  if (!title || !prompt) {
    errorEl.textContent = "Title and instructions are both required.";
    return;
  }
  try {
    const res = await fetch(`${API_BASE}/teacher/topics`, {
      method: "POST",
      headers: authHeaders({ "Content-Type": "application/json" }),
      body: JSON.stringify({ title, prompt }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      errorEl.textContent = body.error || "Could not add topic";
      return;
    }
    titleInput.value = "";
    promptInput.value = "";
    await loadTeacherTopics();
  } catch (err) {
    errorEl.textContent = "Could not reach the backend.";
  }
}

async function deleteTeacherTopic(id) {
  try {
    const res = await fetch(`${API_BASE}/teacher/topics/${id}`, {
      method: "DELETE",
      headers: authHeaders(),
    });
    if (res.ok) await loadTeacherTopics();
  } catch (err) {
    // fail silently
  }
}

function renderRoster(students) {
  const body = document.getElementById("rosterBody");
  body.innerHTML = "";
  for (const student of students) {
    const row = document.createElement("tr");
    row.style.cursor = "pointer";
    row.innerHTML = `<td>${student.displayName}</td><td>${student.email}</td>`;
    row.addEventListener("click", () => loadTeacherStudentAnalytics(student.id));
    body.appendChild(row);
  }
}

function renderAnalytics(container, data) {
  container.innerHTML = "";

  const stats = document.createElement("div");
  stats.className = "analytics-stats";
  const statEntries = [
    ["Level", formatCefrLevel(data.estimatedLevel)],
    ["Conversations", data.totalConversations],
    ["Messages", data.totalMessages],
    ["Practice (min, est.)", data.estimatedPracticeMinutes],
  ];
  for (const [label, value] of statEntries) {
    const box = document.createElement("div");
    box.className = "analytics-stat";
    box.innerHTML = `<span class="value">${value}</span><span class="label">${label}</span>`;
    stats.appendChild(box);
  }
  container.appendChild(stats);

  const freqLabel = document.createElement("div");
  freqLabel.style.fontSize = "12px";
  freqLabel.style.opacity = "0.75";
  freqLabel.textContent = "Practice frequency (last 30 days):";
  container.appendChild(freqLabel);

  const freqBars = document.createElement("div");
  freqBars.className = "freq-bars";
  const maxCount = Math.max(1, ...data.practiceFrequency.map((p) => p.count));
  if (data.practiceFrequency.length === 0) {
    const empty = document.createElement("div");
    empty.style.fontSize = "12px";
    empty.style.opacity = "0.6";
    empty.textContent = "No activity yet.";
    freqBars.appendChild(empty);
  } else {
    for (const point of data.practiceFrequency) {
      const bar = document.createElement("div");
      bar.className = "freq-bar";
      bar.style.height = `${(point.count / maxCount) * 100}%`;
      bar.title = `${point.date}: ${point.count}`;
      freqBars.appendChild(bar);
    }
  }
  container.appendChild(freqBars);

  const weaknessLabel = document.createElement("div");
  weaknessLabel.style.fontSize = "12px";
  weaknessLabel.style.opacity = "0.75";
  weaknessLabel.textContent = "Grammar weaknesses:";
  container.appendChild(weaknessLabel);

  if (data.grammarWeaknesses.length === 0) {
    const empty = document.createElement("div");
    empty.style.fontSize = "12px";
    empty.style.opacity = "0.6";
    empty.textContent = "No mistakes recorded yet.";
    container.appendChild(empty);
  } else {
    const maxWeakness = Math.max(...data.grammarWeaknesses.map((w) => w.count));
    for (const weakness of data.grammarWeaknesses) {
      const row = document.createElement("div");
      row.className = "weakness-row";
      row.innerHTML = `<span>${weakness.category}</span><span>${weakness.count}</span>`;
      container.appendChild(row);

      const barBg = document.createElement("div");
      barBg.className = "weakness-bar-bg";
      const barFill = document.createElement("div");
      barFill.className = "weakness-bar-fill";
      barFill.style.width = `${(weakness.count / maxWeakness) * 100}%`;
      barBg.appendChild(barFill);
      container.appendChild(barBg);
    }
  }

  const vocabLabel = document.createElement("div");
  vocabLabel.style.fontSize = "12px";
  vocabLabel.style.opacity = "0.75";
  vocabLabel.style.marginTop = "8px";
  const totalVocab =
    data.vocabularyGrowth.length > 0
      ? data.vocabularyGrowth[data.vocabularyGrowth.length - 1].cumulativeCount
      : 0;
  vocabLabel.textContent = `Vocabulary notebook size: ${totalVocab}`;
  container.appendChild(vocabLabel);
}

async function loadStudentAnalytics() {
  const container = document.getElementById("studentAnalyticsPanel");
  try {
    const res = await fetch(`${API_BASE}/analytics/me`, { headers: authHeaders() });
    if (!res.ok) {
      container.textContent = "Could not load progress.";
      return;
    }
    renderAnalytics(container, await res.json());
  } catch (err) {
    container.textContent = "Could not reach the backend.";
  }
}

async function loadTeacherStudentAnalytics(studentId) {
  const container = document.getElementById("teacherStudentAnalyticsPanel");
  container.classList.remove("hidden");
  container.innerHTML = "Loading…";
  try {
    const res = await fetch(`${API_BASE}/analytics/students/${studentId}`, {
      headers: authHeaders(),
    });
    if (!res.ok) {
      container.textContent = "Could not load this student's progress.";
      return;
    }
    const data = await res.json();
    const heading = document.createElement("h4");
    heading.textContent = `${data.displayName}'s progress`;
    container.innerHTML = "";
    container.appendChild(heading);
    const body = document.createElement("div");
    container.appendChild(body);
    renderAnalytics(body, data);
  } catch (err) {
    container.textContent = "Could not reach the backend.";
  }
}

function renderAssignments(assignmentsList) {
  const container = document.getElementById("assignmentsList");
  container.innerHTML = "";
  for (const assignment of assignmentsList) {
    const box = document.createElement("div");
    box.style.marginBottom = "10px";

    const title = document.createElement("div");
    title.innerHTML = `<strong>${assignment.title}</strong> — ${assignment.scenario.replace("_", " ")} (due ${assignment.dueDate})`;
    box.appendChild(title);

    const desc = document.createElement("div");
    desc.style.fontSize = "12px";
    desc.style.opacity = "0.8";
    desc.textContent = assignment.description;
    box.appendChild(desc);

    const badges = document.createElement("div");
    badges.style.marginTop = "4px";
    for (const entry of assignment.completion) {
      const badge = document.createElement("span");
      badge.className = "badge " + (entry.completed ? "done" : "pending");
      badge.textContent = `${entry.displayName}: ${entry.completed ? "done" : "pending"}`;
      badge.style.marginRight = "6px";
      badges.appendChild(badge);
    }
    box.appendChild(badges);

    container.appendChild(box);
  }
}

function renderMistakes(mistakes) {
  const body = document.getElementById("mistakesBody");
  body.innerHTML = "";
  for (const mistake of mistakes) {
    const row = document.createElement("tr");
    row.innerHTML =
      `<td>${mistake.studentName}</td>` +
      `<td>${mistake.originalText}</td>` +
      `<td>${mistake.correctedText}</td>` +
      `<td>${mistake.ruleDescription}</td>`;
    body.appendChild(row);
  }
}

async function selectClass(classId) {
  currentClassId = classId;
  await loadClasses();

  document.getElementById("noClassSelected").classList.add("hidden");
  document.getElementById("classDetail").classList.remove("hidden");
  const analyticsPanel = document.getElementById("teacherStudentAnalyticsPanel");
  analyticsPanel.classList.add("hidden");
  analyticsPanel.innerHTML = "";

  try {
    const [detailRes, assignmentsRes, mistakesRes] = await Promise.all([
      fetch(`${API_BASE}/teacher/classes/${classId}`, { headers: authHeaders() }),
      fetch(`${API_BASE}/teacher/classes/${classId}/assignments`, { headers: authHeaders() }),
      fetch(`${API_BASE}/teacher/classes/${classId}/mistakes`, { headers: authHeaders() }),
    ]);

    if (detailRes.ok) {
      const detail = await detailRes.json();
      document.getElementById("classDetailName").textContent = detail.name;
      renderRoster(detail.students);
    }
    if (assignmentsRes.ok) {
      renderAssignments(await assignmentsRes.json());
    }
    if (mistakesRes.ok) {
      renderMistakes(await mistakesRes.json());
    }
  } catch (err) {
    // leave whatever partial state loaded; user can retry by reselecting
  }
}

async function addStudent() {
  const email = document.getElementById("newStudentEmail").value.trim();
  const displayName = document.getElementById("newStudentName").value.trim();
  const password = document.getElementById("newStudentPassword").value;
  const errorEl = document.getElementById("addStudentError");
  errorEl.textContent = "";

  if (!email || !displayName || !password) {
    errorEl.textContent = "Email, name and password are all required.";
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/teacher/classes/${currentClassId}/students`, {
      method: "POST",
      headers: authHeaders({ "Content-Type": "application/json" }),
      body: JSON.stringify({ email, displayName, password }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      errorEl.textContent = body.error || "Could not add student";
      return;
    }
    document.getElementById("newStudentEmail").value = "";
    document.getElementById("newStudentName").value = "";
    document.getElementById("newStudentPassword").value = "";
    await selectClass(currentClassId);
  } catch (err) {
    errorEl.textContent = "Could not reach the backend.";
  }
}

async function createAssignment() {
  const title = document.getElementById("assignmentTitle").value.trim();
  const description = document.getElementById("assignmentDescription").value.trim();
  const scenario = document.getElementById("assignmentScenario").value;
  const dueDate = document.getElementById("assignmentDueDate").value;
  const errorEl = document.getElementById("createAssignmentError");
  errorEl.textContent = "";

  if (!title || !description || !dueDate) {
    errorEl.textContent = "Title, description and due date are all required.";
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/teacher/classes/${currentClassId}/assignments`, {
      method: "POST",
      headers: authHeaders({ "Content-Type": "application/json" }),
      body: JSON.stringify({ title, description, scenario, dueDate }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      errorEl.textContent = body.error || "Could not create assignment";
      return;
    }
    document.getElementById("assignmentTitle").value = "";
    document.getElementById("assignmentDescription").value = "";
    document.getElementById("assignmentDueDate").value = "";
    await selectClass(currentClassId);
  } catch (err) {
    errorEl.textContent = "Could not reach the backend.";
  }
}

async function downloadReport(format) {
  try {
    const res = await fetch(`${API_BASE}/teacher/classes/${currentClassId}/report.${format}`, {
      headers: authHeaders(),
    });
    if (!res.ok) return;

    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `class-report.${format}`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  } catch (err) {
    // download failures aren't fatal to the session; user can retry
  }
}

document.getElementById("teacherLogoutBtn").addEventListener("click", logout);
document.getElementById("createClassBtn").addEventListener("click", createClass);
document.getElementById("newClassNameInput").addEventListener("keydown", (e) => {
  if (e.key === "Enter") createClass();
});
document.getElementById("createTopicBtn").addEventListener("click", createTeacherTopic);
document.getElementById("addStudentBtn").addEventListener("click", addStudent);
document.getElementById("createAssignmentBtn").addEventListener("click", createAssignment);
document.getElementById("downloadCsvBtn").addEventListener("click", () => downloadReport("csv"));
document.getElementById("downloadPdfBtn").addEventListener("click", () => downloadReport("pdf"));

// ---- Speech recording + WAV encoding ----
// MediaRecorder produces webm/opus (or whatever the browser's default is),
// not WAV at a guaranteed sample rate, so recordings are decoded via the
// Web Audio API and re-encoded as PCM WAV in-browser before being sent —
// the AI service resamples server-side regardless (see docs/12-stage9-plan.md),
// but sending a real WAV container keeps the backend contract simple either way.
let activeRecorder = null;
let activeStream = null;

function audioBufferToWav(audioBuffer) {
  const sampleRate = audioBuffer.sampleRate;
  const channelData = audioBuffer.getChannelData(0);
  const length = channelData.length;

  const buffer = new ArrayBuffer(44 + length * 2);
  const view = new DataView(buffer);

  function writeString(offset, str) {
    for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i));
  }

  writeString(0, "RIFF");
  view.setUint32(4, 36 + length * 2, true);
  writeString(8, "WAVE");
  writeString(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeString(36, "data");
  view.setUint32(40, length * 2, true);

  let offset = 44;
  for (let i = 0; i < length; i++) {
    const sample = Math.max(-1, Math.min(1, channelData[i]));
    view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true);
    offset += 2;
  }

  return buffer;
}

function arrayBufferToBase64(buffer) {
  let binary = "";
  const bytes = new Uint8Array(buffer);
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode.apply(null, bytes.subarray(i, i + chunkSize));
  }
  return btoa(binary);
}

async function startRecording() {
  activeStream = await navigator.mediaDevices.getUserMedia({ audio: true });
  const chunks = [];
  activeRecorder = new MediaRecorder(activeStream);
  activeRecorder.ondataavailable = (e) => chunks.push(e.data);
  activeRecorder._chunks = chunks;
  activeRecorder.start();
}

function stopRecording() {
  return new Promise((resolve, reject) => {
    if (!activeRecorder) {
      reject(new Error("Not recording"));
      return;
    }
    activeRecorder.onstop = async () => {
      activeStream.getTracks().forEach((t) => t.stop());
      try {
        const blob = new Blob(activeRecorder._chunks, { type: activeRecorder.mimeType });
        const arrayBuffer = await blob.arrayBuffer();
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        const audioCtx = new AudioContextClass();
        const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
        const wavBuffer = audioBufferToWav(audioBuffer);
        resolve(arrayBufferToBase64(wavBuffer));
      } catch (err) {
        reject(err);
      } finally {
        activeRecorder = null;
        activeStream = null;
      }
    };
    activeRecorder.stop();
  });
}

async function playBase64Wav(audioBase64) {
  const audio = new Audio(`data:audio/wav;base64,${audioBase64}`);
  await audio.play();
  // Resolve when playback finishes so callers can, e.g., stop an avatar's
  // speaking animation at the right time.
  await new Promise((resolve) => {
    audio.addEventListener("ended", resolve, { once: true });
    audio.addEventListener("error", resolve, { once: true });
  });
}

// ---- Mic button in the conversation composer ----
let micRecording = false;

async function toggleMicRecording() {
  const micBtn = document.getElementById("micBtn");
  const input = document.getElementById("messageInput");

  if (!micRecording) {
    try {
      await startRecording();
      micRecording = true;
      micBtn.classList.add("recording");
      micBtn.textContent = "⏹";
    } catch (err) {
      alert("Could not access the microphone.");
    }
    return;
  }

  micRecording = false;
  micBtn.classList.remove("recording");
  micBtn.textContent = "🎤";
  input.placeholder = "Transcribing…";

  try {
    const audioBase64 = await stopRecording();
    const res = await fetch(`${API_BASE}/speech/transcribe`, {
      method: "POST",
      headers: authHeaders({ "Content-Type": "application/json" }),
      body: JSON.stringify({ audioBase64 }),
    });
    if (res.ok) {
      const data = await res.json();
      input.value = data.transcript;
    }
  } catch (err) {
    // recording/transcription failures are recoverable; the student can retry
  } finally {
    input.placeholder = "Type a message and press Enter…";
  }
}

// ---- Hands-free voice conversation mode (Stage 21) ----
// A continuous listen -> transcribe -> reply -> speak -> listen loop driven by
// simple voice-activity detection (RMS on the mic stream): the student just
// talks, pauses, and the AI answers aloud — no Send button, like a real call.
const voiceMode = {
  active: false,
  stream: null,
  audioCtx: null,
  analyser: null,
  data: null,
  recorder: null,
  chunks: [],
  state: "idle", // idle | listening | recording | processing | speaking
  lastLoudAt: 0,
  speechStartAt: 0,
  pollId: null,
};

const VAD_RMS_THRESHOLD = 0.045; // speech vs. background
const VAD_SILENCE_MS = 1200; // trailing silence that ends an utterance
const VAD_MIN_SPEECH_MS = 400; // ignore ultra-short blips

function setVoiceStatus(text) {
  document.getElementById("voiceModeStatus").textContent = text;
}

async function toggleVoiceMode() {
  if (voiceMode.active) {
    stopVoiceMode();
    return;
  }
  if (!currentConversationId) return;
  try {
    voiceMode.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  } catch (err) {
    alert("Could not access the microphone.");
    return;
  }
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  voiceMode.audioCtx = new AudioContextClass();
  const source = voiceMode.audioCtx.createMediaStreamSource(voiceMode.stream);
  voiceMode.analyser = voiceMode.audioCtx.createAnalyser();
  voiceMode.analyser.fftSize = 1024;
  voiceMode.data = new Uint8Array(voiceMode.analyser.fftSize);
  source.connect(voiceMode.analyser);

  voiceMode.active = true;
  voiceMode.state = "listening";
  const btn = document.getElementById("voiceModeBtn");
  btn.classList.add("active");
  btn.textContent = "⏹ Stop voice chat";
  document.getElementById("micBtn").disabled = true;
  document.getElementById("messageInput").disabled = true;
  document.getElementById("sendBtn").disabled = true;
  setVoiceStatus("🎙️ Listening… just start speaking.");
  voiceMode.pollId = setInterval(voiceTick, 60);
}

function stopVoiceMode() {
  voiceMode.active = false;
  if (voiceMode.pollId) clearInterval(voiceMode.pollId);
  voiceMode.pollId = null;
  try {
    if (voiceMode.recorder && voiceMode.recorder.state === "recording") voiceMode.recorder.stop();
  } catch (err) {
    /* ignore */
  }
  if (voiceMode.stream) voiceMode.stream.getTracks().forEach((t) => t.stop());
  if (voiceMode.audioCtx) voiceMode.audioCtx.close().catch(() => {});
  voiceMode.stream = null;
  voiceMode.audioCtx = null;
  voiceMode.recorder = null;
  voiceMode.state = "idle";
  const btn = document.getElementById("voiceModeBtn");
  btn.classList.remove("active");
  btn.textContent = "🎙️ Start hands-free voice chat";
  document.getElementById("micBtn").disabled = false;
  if (currentConversationId) {
    document.getElementById("messageInput").disabled = false;
    document.getElementById("sendBtn").disabled = false;
  }
  setVoiceStatus("");
}

function currentRms() {
  voiceMode.analyser.getByteTimeDomainData(voiceMode.data);
  let sumSq = 0;
  for (let i = 0; i < voiceMode.data.length; i++) {
    const v = (voiceMode.data[i] - 128) / 128;
    sumSq += v * v;
  }
  return Math.sqrt(sumSq / voiceMode.data.length);
}

function voiceTick() {
  if (!voiceMode.active) return;
  // Only the listening/recording states watch the mic; while the AI is being
  // transcribed or is speaking, we ignore input so we don't record ourselves.
  if (voiceMode.state !== "listening" && voiceMode.state !== "recording") return;

  const rms = currentRms();
  const now = Date.now();

  if (voiceMode.state === "listening") {
    if (rms > VAD_RMS_THRESHOLD) {
      // Speech started — begin capturing this utterance.
      voiceMode.chunks = [];
      voiceMode.recorder = new MediaRecorder(voiceMode.stream);
      voiceMode.recorder.ondataavailable = (e) => voiceMode.chunks.push(e.data);
      voiceMode.recorder.onstop = () => finishUtterance();
      voiceMode.recorder.start();
      voiceMode.state = "recording";
      voiceMode.speechStartAt = now;
      voiceMode.lastLoudAt = now;
      setVoiceStatus("🎤 Listening to you…");
    }
    return;
  }

  // state === "recording"
  if (rms > VAD_RMS_THRESHOLD) {
    voiceMode.lastLoudAt = now;
  } else if (
    now - voiceMode.lastLoudAt > VAD_SILENCE_MS &&
    now - voiceMode.speechStartAt > VAD_MIN_SPEECH_MS
  ) {
    voiceMode.state = "processing";
    setVoiceStatus("💭 Thinking…");
    if (voiceMode.recorder && voiceMode.recorder.state === "recording") {
      voiceMode.recorder.stop();
    }
  }
}

async function finishUtterance() {
  if (!voiceMode.active) return;
  let audioBase64;
  try {
    const blob = new Blob(voiceMode.chunks, { type: voiceMode.recorder.mimeType });
    const arrayBuffer = await blob.arrayBuffer();
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    const decodeCtx = new AudioContextClass();
    const audioBuffer = await decodeCtx.decodeAudioData(arrayBuffer);
    decodeCtx.close().catch(() => {});
    audioBase64 = arrayBufferToBase64(audioBufferToWav(audioBuffer));
  } catch (err) {
    resumeListening();
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/speech/transcribe`, {
      method: "POST",
      headers: authHeaders({ "Content-Type": "application/json" }),
      body: JSON.stringify({ audioBase64 }),
    });
    const transcript = res.ok ? (await res.json()).transcript.trim() : "";
    if (!voiceMode.active) return;

    // Ignore empty/noise transcriptions and just keep listening.
    if (!transcript || transcript.length < 2) {
      resumeListening();
      return;
    }

    voiceMode.state = "speaking";
    setVoiceStatus("🔊 AI is replying…");
    await sendMessageContent(transcript, { forceSpeak: true });
    if (!voiceMode.active) return;
    resumeListening();
  } catch (err) {
    if (voiceMode.active) resumeListening();
  }
}

function resumeListening() {
  if (!voiceMode.active) return;
  voiceMode.state = "listening";
  setVoiceStatus("🎙️ Your turn — start speaking.");
}

// ---- Pronunciation practice panel ----
let pronunciationRecording = false;

async function listenToTargetPhrase() {
  const phrase = document.getElementById("pronunciationTarget").value.trim();
  const errorEl = document.getElementById("pronunciationError");
  errorEl.textContent = "";
  if (!phrase) {
    errorEl.textContent = "Type a phrase first.";
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/speech/synthesize`, {
      method: "POST",
      headers: authHeaders({ "Content-Type": "application/json" }),
      body: JSON.stringify({ text: phrase, voice: getSelectedVoice() }),
    });
    if (!res.ok) {
      errorEl.textContent = "Could not synthesize speech.";
      return;
    }
    const data = await res.json();
    await playBase64Wav(data.audioBase64);
  } catch (err) {
    errorEl.textContent = "Could not reach the backend.";
  }
}

async function togglePronunciationRecording() {
  const recordBtn = document.getElementById("pronunciationRecordBtn");
  const errorEl = document.getElementById("pronunciationError");
  const resultEl = document.getElementById("pronunciationResult");
  errorEl.textContent = "";

  const phrase = document.getElementById("pronunciationTarget").value.trim();
  if (!pronunciationRecording && !phrase) {
    errorEl.textContent = "Type a phrase to practice first.";
    return;
  }

  if (!pronunciationRecording) {
    try {
      await startRecording();
      pronunciationRecording = true;
      recordBtn.classList.add("recording");
      recordBtn.textContent = "⏹ Stop";
    } catch (err) {
      errorEl.textContent = "Could not access the microphone.";
    }
    return;
  }

  pronunciationRecording = false;
  recordBtn.classList.remove("recording");
  recordBtn.textContent = "🎤 Record";
  resultEl.classList.remove("hidden");
  resultEl.textContent = "Scoring…";

  try {
    const audioBase64 = await stopRecording();
    const res = await fetch(`${API_BASE}/pronunciation/practice`, {
      method: "POST",
      headers: authHeaders({ "Content-Type": "application/json" }),
      body: JSON.stringify({ targetPhrase: phrase, audioBase64 }),
    });
    if (!res.ok) {
      resultEl.textContent = "Could not score this attempt.";
      return;
    }
    const data = await res.json();
    resultEl.innerHTML = "";
    const score = document.createElement("div");
    score.className = "score";
    score.textContent = `${data.accuracyScore}%`;
    const transcript = document.createElement("div");
    transcript.textContent = `You said: "${data.transcript}"`;
    const feedback = document.createElement("div");
    feedback.textContent = data.feedback;
    resultEl.appendChild(score);
    resultEl.appendChild(transcript);
    resultEl.appendChild(feedback);

    // Stage 30: for Mandarin, tone is scored separately from whether the right
    // words were recognised — you can say the correct syllable with the wrong
    // tone and mean a different word entirely.
    if (data.tone) {
      const toneBox = document.createElement("div");
      toneBox.className = "tone-result";
      if (data.tone.confident) {
        const toneScore = document.createElement("div");
        toneScore.className = "score";
        toneScore.textContent = `Tone: ${data.tone.toneScore}%`;
        toneBox.appendChild(toneScore);
      }
      const toneFeedback = document.createElement("div");
      toneFeedback.textContent = data.tone.feedback;
      toneBox.appendChild(toneFeedback);
      resultEl.appendChild(toneBox);
    }
  } catch (err) {
    resultEl.textContent = "Could not reach the backend.";
  }
}

document.getElementById("micBtn").addEventListener("click", toggleMicRecording);
document.getElementById("voiceModeBtn").addEventListener("click", toggleVoiceMode);
document.getElementById("pronunciationListenBtn").addEventListener("click", listenToTargetPhrase);
document
  .getElementById("pronunciationRecordBtn")
  .addEventListener("click", togglePronunciationRecording);

document.getElementById("loginBtn").addEventListener("click", login);
document.getElementById("logoutBtn").addEventListener("click", logout);
document.getElementById("password").addEventListener("keydown", (e) => {
  if (e.key === "Enter") login();
});
document.getElementById("startConversationBtn").addEventListener("click", startConversation);
document.getElementById("voiceSelect").addEventListener("change", renderAvatar);
document.getElementById("sendBtn").addEventListener("click", sendMessage);
document.getElementById("messageInput").addEventListener("keydown", (e) => {
  if (e.key === "Enter") sendMessage();
});
document.getElementById("notebookAddBtn").addEventListener("click", async () => {
  const input = document.getElementById("notebookWordInput");
  const errorEl = document.getElementById("notebookError");
  errorEl.textContent = "";
  const word = input.value.trim();
  if (!word) return;

  input.disabled = true;
  await addWordToNotebook(word, errorEl);
  input.disabled = false;
  input.value = "";
  input.focus();
});
document.getElementById("notebookWordInput").addEventListener("keydown", (e) => {
  if (e.key === "Enter") document.getElementById("notebookAddBtn").click();
});

// --- Grammar Learning Module (Stage 14) ---

let currentGrammarTopicId = null;
let currentGrammarExercise = null; // { exerciseType, question, options, explanation, correctAnswer }

const GRAMMAR_LEVEL_LABELS = {
  beginner: "Beginner",
  intermediate: "Intermediate",
  advanced: "Advanced",
};

function showMainTab(tabName) {
  const tabs = {
    path: { btn: "tabPathBtn", panel: "pathPanel" },
    conversation: { btn: "tabConversationBtn", panel: "chatPanel" },
    grammar: { btn: "tabGrammarBtn", panel: "grammarPanel" },
    reading: { btn: "tabReadingBtn", panel: "readingPanel" },
    listening: { btn: "tabListeningBtn", panel: "listeningPanel" },
    writing: { btn: "tabWritingBtn", panel: "writingPanel" },
    quiz: { btn: "tabQuizBtn", panel: "quizPanel" },
    review: { btn: "tabReviewBtn", panel: "reviewPanel" },
    history: { btn: "tabHistoryBtn", panel: "historyPanel" },
  };
  for (const [name, ids] of Object.entries(tabs)) {
    const isActive = name === tabName;
    document.getElementById(ids.btn).classList.toggle("active", isActive);
    document.getElementById(ids.panel).classList.toggle("hidden", !isActive);
  }
}

function showChatTab() {
  showMainTab("conversation");
}

function showGrammarTab() {
  showMainTab("grammar");
}

function showReadingTab() {
  showMainTab("reading");
}

function showListeningTab() {
  showMainTab("listening");
}

function showWritingTab() {
  showMainTab("writing");
}

function showQuizTab() {
  showMainTab("quiz");
}

function showHistoryTab() {
  showMainTab("history");
  loadLearningHistory();
}

function showReviewTab() {
  showMainTab("review");
  resetReviewSession();
  loadReviewStats();
}

async function loadGrammarTopics() {
  const container = document.getElementById("grammarTopicList");
  try {
    const [topicsRes, progressRes] = await Promise.all([
      fetch(`${API_BASE}/grammar/topics`, { headers: authHeaders() }),
      fetch(`${API_BASE}/grammar/progress`, { headers: authHeaders() }),
    ]);
    if (!topicsRes.ok) return;
    const topics = await topicsRes.json();
    const progress = progressRes.ok ? await progressRes.json() : { topics: [] };
    const progressByTopic = new Map(progress.topics.map((t) => [t.topicId, t]));

    container.innerHTML = "";
    for (const topic of topics) {
      const p = progressByTopic.get(topic.id);
      const accuracy = p ? p.accuracy : 0;
      const card = document.createElement("div");
      card.className = "grammar-topic-card";
      card.innerHTML = `
        <span class="badge">${GRAMMAR_LEVEL_LABELS[topic.level] || topic.level}</span>
        <h4>${topic.title}</h4>
        <div style="font-size: 12px; opacity: 0.75">${topic.cefrLevel}${
          p && p.attempts > 0 ? ` · ${p.attempts} attempt${p.attempts === 1 ? "" : "s"}, ${accuracy}% correct` : " · not started"
        }</div>
        <div class="topic-progress-bar"><div class="topic-progress-fill" style="width: ${accuracy}%"></div></div>
      `;
      card.addEventListener("click", () => openGrammarTopic(topic.id));
      container.appendChild(card);
    }
  } catch (err) {
    container.innerHTML = "Could not reach the backend.";
  }
}

async function openGrammarTopic(topicId) {
  try {
    const res = await fetch(`${API_BASE}/grammar/topics/${topicId}`, { headers: authHeaders() });
    if (!res.ok) return;
    const topic = await res.json();

    currentGrammarTopicId = topicId;
    document.getElementById("grammarTopicList").classList.add("hidden");
    document.getElementById("grammarLessonDetail").classList.remove("hidden");
    document.getElementById("grammarLessonTitle").textContent = `${topic.title} (${topic.cefrLevel})`;
    document.getElementById("grammarLessonExplanation").textContent = topic.explanation;

    const examplesList = document.getElementById("grammarLessonExamples");
    examplesList.innerHTML = "";
    for (const example of topic.examples) {
      const li = document.createElement("li");
      li.textContent = example;
      examplesList.appendChild(li);
    }

    document.getElementById("grammarExerciseArea").innerHTML = "";
    document.getElementById("grammarExerciseError").textContent = "";
    currentGrammarExercise = null;
  } catch (err) {
    // topic list stays visible; nothing to show
  }
}

function closeGrammarTopic() {
  document.getElementById("grammarTopicList").classList.remove("hidden");
  document.getElementById("grammarLessonDetail").classList.add("hidden");
  currentGrammarTopicId = null;
  loadGrammarTopics();
}

async function generateGrammarExercise() {
  const errorEl = document.getElementById("grammarExerciseError");
  const area = document.getElementById("grammarExerciseArea");
  errorEl.textContent = "";
  area.innerHTML = "Generating a new exercise…";

  const exerciseType = document.getElementById("grammarExerciseType").value;

  try {
    const res = await fetch(`${API_BASE}/grammar/topics/${currentGrammarTopicId}/exercise`, {
      method: "POST",
      headers: authHeaders({ "Content-Type": "application/json" }),
      body: JSON.stringify({ exerciseType }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      area.innerHTML = "";
      errorEl.textContent = body.error || "Could not generate an exercise";
      return;
    }
    currentGrammarExercise = await res.json();
    renderGrammarExercise();
  } catch (err) {
    area.innerHTML = "";
    errorEl.textContent = "Could not reach the backend.";
  }
}

function renderGrammarExercise() {
  const area = document.getElementById("grammarExerciseArea");
  const exercise = currentGrammarExercise;
  area.innerHTML = "";

  const questionEl = document.createElement("p");
  questionEl.textContent = exercise.question;
  area.appendChild(questionEl);

  if (exercise.exerciseType === "multiple_choice") {
    for (const option of exercise.options) {
      const btn = document.createElement("button");
      btn.className = "grammar-exercise-option";
      btn.textContent = option;
      btn.addEventListener("click", () => submitGrammarExercise(option, btn));
      area.appendChild(btn);
    }
  } else {
    const input = document.createElement("input");
    input.type = "text";
    input.placeholder = "Type the missing word or phrase…";
    input.id = "grammarFillBlankInput";
    const submitBtn = document.createElement("button");
    submitBtn.textContent = "Submit";
    submitBtn.addEventListener("click", () => submitGrammarExercise(input.value, submitBtn));
    area.appendChild(input);
    area.appendChild(submitBtn);
  }
}

async function submitGrammarExercise(studentAnswer, clickedButton) {
  const exercise = currentGrammarExercise;
  if (!exercise || !studentAnswer || !studentAnswer.trim()) return;

  try {
    const res = await fetch(
      `${API_BASE}/grammar/topics/${currentGrammarTopicId}/exercise/submit`,
      {
        method: "POST",
        headers: authHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify({
          exerciseType: exercise.exerciseType,
          question: exercise.question,
          correctAnswer: exercise.correctAnswer,
          studentAnswer,
        }),
      },
    );
    if (!res.ok) return;
    const result = await res.json();

    document
      .querySelectorAll(".grammar-exercise-option")
      .forEach((btn) => (btn.disabled = true));
    if (clickedButton && clickedButton.classList.contains("grammar-exercise-option")) {
      clickedButton.classList.add(result.isCorrect ? "correct" : "incorrect");
    }

    const feedback = document.createElement("p");
    feedback.textContent = result.isCorrect
      ? `Correct! ${exercise.explanation}`
      : `Not quite. The correct answer was "${result.correctAnswer}". ${exercise.explanation}`;
    document.getElementById("grammarExerciseArea").appendChild(feedback);
  } catch (err) {
    document.getElementById("grammarExerciseError").textContent = "Could not reach the backend.";
  }
}

document.getElementById("tabConversationBtn").addEventListener("click", showChatTab);
document.getElementById("tabGrammarBtn").addEventListener("click", showGrammarTab);
document.getElementById("grammarBackBtn").addEventListener("click", closeGrammarTopic);
document.getElementById("grammarNewExerciseBtn").addEventListener("click", generateGrammarExercise);

// --- Reading Module (Stage 15) ---

let currentReadingPassageId = null;
let currentReadingQuestions = [];

async function loadReadingPassages() {
  const container = document.getElementById("readingPassageList");
  try {
    const [passagesRes, progressRes] = await Promise.all([
      fetch(`${API_BASE}/reading/passages`, { headers: authHeaders() }),
      fetch(`${API_BASE}/reading/progress`, { headers: authHeaders() }),
    ]);
    if (!passagesRes.ok) return;
    const passages = await passagesRes.json();
    const progress = progressRes.ok ? await progressRes.json() : { passages: [] };
    const progressByPassage = new Map(progress.passages.map((p) => [p.passageId, p]));

    container.innerHTML = "";
    for (const passage of passages) {
      const p = progressByPassage.get(passage.id);
      const card = document.createElement("div");
      card.className = "grammar-topic-card";
      card.innerHTML = `
        <span class="badge">${passage.cefrLevel}</span>
        <h4>${passage.title}</h4>
        <div style="font-size: 12px; opacity: 0.75">${passage.estimatedReadingMinutes} min read${
          p ? ` · best score ${p.bestScore}%` : " · not read yet"
        }</div>
        <div class="topic-progress-bar"><div class="topic-progress-fill" style="width: ${p ? p.bestScore : 0}%"></div></div>
      `;
      card.addEventListener("click", () => openReadingPassage(passage.id));
      container.appendChild(card);
    }
  } catch (err) {
    container.innerHTML = "Could not reach the backend.";
  }
}

async function openReadingPassage(passageId) {
  const listEl = document.getElementById("readingPassageList");
  const detailEl = document.getElementById("readingPassageDetail");
  listEl.classList.add("hidden");
  detailEl.classList.remove("hidden");
  document.getElementById("readingPassageTitle").textContent = "Loading…";
  document.getElementById("readingPassageContent").textContent = "";
  document.getElementById("readingPassageSummary").textContent = "";
  document.getElementById("readingVocabList").innerHTML = "";
  document.getElementById("readingQuestions").innerHTML = "";
  document.getElementById("readingResult").innerHTML = "";

  try {
    const res = await fetch(`${API_BASE}/reading/passages/${passageId}`, {
      headers: authHeaders(),
    });
    if (!res.ok) {
      document.getElementById("readingPassageTitle").textContent = "Could not load this passage.";
      return;
    }
    const passage = await res.json();
    currentReadingPassageId = passageId;
    currentReadingQuestions = passage.questions;

    document.getElementById("readingPassageTitle").textContent =
      `${passage.title} (${levelLabel(passage.cefrLevel)})`;
    document.getElementById("readingPassageContent").textContent = passage.content;
    renderReadingScaffold(passage);
    document.getElementById("readingPassageSummary").textContent = passage.summary;

    const vocabList = document.getElementById("readingVocabList");
    for (const word of passage.vocabularyWords) {
      const chip = document.createElement("span");
      chip.className = "reading-vocab-chip";
      chip.textContent = word;
      chip.title = "Click to add to your vocabulary notebook";
      chip.addEventListener("click", async () => {
        await addWordToNotebook(word, document.getElementById("readingResult"));
      });
      vocabList.appendChild(chip);
    }

    const questionsEl = document.getElementById("readingQuestions");
    passage.questions.forEach((q, index) => {
      const block = document.createElement("div");
      block.className = "reading-question";
      const questionText = document.createElement("p");
      questionText.textContent = `${index + 1}. ${q.question}`;
      block.appendChild(questionText);
      for (const option of q.options) {
        const label = document.createElement("label");
        label.style.display = "block";
        const input = document.createElement("input");
        input.type = "radio";
        input.name = `readingQuestion${index}`;
        input.value = option;
        label.appendChild(input);
        label.appendChild(document.createTextNode(" " + option));
        block.appendChild(label);
      }
      questionsEl.appendChild(block);
    });
  } catch (err) {
    document.getElementById("readingPassageTitle").textContent = "Could not reach the backend.";
  }
}

function closeReadingPassage() {
  document.getElementById("readingPassageList").classList.remove("hidden");
  document.getElementById("readingPassageDetail").classList.add("hidden");
  currentReadingPassageId = null;
  loadReadingPassages();
}

async function listenToReadingPassage() {
  const content = document.getElementById("readingPassageContent").textContent;
  if (!content) return;
  try {
    const res = await fetch(`${API_BASE}/speech/synthesize`, {
      method: "POST",
      headers: authHeaders({ "Content-Type": "application/json" }),
      body: JSON.stringify({ text: content, voice: getSelectedVoice() }),
    });
    if (!res.ok) return;
    const data = await res.json();
    await playBase64Wav(data.audioBase64);
  } catch (err) {
    // non-critical path; fail silently
  }
}

async function submitReadingAnswers() {
  const resultEl = document.getElementById("readingResult");
  resultEl.textContent = "";

  const answers = currentReadingQuestions.map((_, index) => {
    const selected = document.querySelector(`input[name="readingQuestion${index}"]:checked`);
    return selected ? selected.value : "";
  });

  try {
    const res = await fetch(`${API_BASE}/reading/passages/${currentReadingPassageId}/submit`, {
      method: "POST",
      headers: authHeaders({ "Content-Type": "application/json" }),
      body: JSON.stringify({ answers }),
    });
    if (!res.ok) {
      resultEl.textContent = "Could not submit answers.";
      return;
    }
    const result = await res.json();
    resultEl.textContent = `Score: ${result.score}% (${result.correctCount}/${result.totalQuestions} correct)`;
  } catch (err) {
    resultEl.textContent = "Could not reach the backend.";
  }
}

document.getElementById("tabReadingBtn").addEventListener("click", showReadingTab);
document.getElementById("readingBackBtn").addEventListener("click", closeReadingPassage);
document.getElementById("readingListenBtn").addEventListener("click", listenToReadingPassage);
document.getElementById("readingSubmitBtn").addEventListener("click", submitReadingAnswers);

// --- Listening Module (Stage 17) ---

let currentListeningClip = null; // full detail object
let currentDictationIndex = 0;
let listeningAudio = null; // the currently-playing HTMLAudioElement

async function loadListeningClips() {
  const container = document.getElementById("listeningClipList");
  try {
    const [clipsRes, progressRes] = await Promise.all([
      fetch(`${API_BASE}/listening/clips`, { headers: authHeaders() }),
      fetch(`${API_BASE}/listening/progress`, { headers: authHeaders() }),
    ]);
    if (!clipsRes.ok) return;
    const clips = await clipsRes.json();
    const progress = progressRes.ok ? await progressRes.json() : { clips: [] };
    const progressByClip = new Map(progress.clips.map((c) => [c.clipId, c]));

    container.innerHTML = "";
    for (const clip of clips) {
      const p = progressByClip.get(clip.id);
      const card = document.createElement("div");
      card.className = "grammar-topic-card";
      card.innerHTML = `
        <span class="badge">${clip.cefrLevel}</span>
        <h4>${clip.title}</h4>
        <div style="font-size: 12px; opacity: 0.75">~${clip.estimatedSeconds}s${
          p ? ` · best score ${p.bestScore}%` : " · not started"
        }</div>
        <div class="topic-progress-bar"><div class="topic-progress-fill" style="width: ${p ? p.bestScore : 0}%"></div></div>
      `;
      card.addEventListener("click", () => openListeningClip(clip.id));
      container.appendChild(card);
    }
  } catch (err) {
    container.innerHTML = "Could not reach the backend.";
  }
}

function stopListeningAudio() {
  if (listeningAudio) {
    listeningAudio.pause();
    listeningAudio = null;
  }
}

async function synthesizeToAudio(text) {
  const res = await fetch(`${API_BASE}/speech/synthesize`, {
    method: "POST",
    headers: authHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify({ text, voice: getSelectedVoice() }),
  });
  if (!res.ok) throw new Error("synthesize failed");
  const data = await res.json();
  return new Audio(`data:audio/wav;base64,${data.audioBase64}`);
}

async function openListeningClip(clipId) {
  const listEl = document.getElementById("listeningClipList");
  const detailEl = document.getElementById("listeningClipDetail");
  listEl.classList.add("hidden");
  detailEl.classList.remove("hidden");
  document.getElementById("listeningClipTitle").textContent = "Loading…";
  document.getElementById("listeningQuestions").innerHTML = "";
  document.getElementById("listeningResult").innerHTML = "";
  document.getElementById("dictationResult").innerHTML = "";
  document.getElementById("dictationInput").value = "";
  const transcriptEl = document.getElementById("listeningTranscript");
  transcriptEl.classList.add("hidden");
  document.getElementById("listeningToggleTranscriptBtn").textContent = "Show transcript";

  try {
    const res = await fetch(`${API_BASE}/listening/clips/${clipId}`, { headers: authHeaders() });
    if (!res.ok) {
      document.getElementById("listeningClipTitle").textContent = "Could not load this clip.";
      return;
    }
    const clip = await res.json();
    currentListeningClip = clip;
    currentDictationIndex = 0;

    document.getElementById("listeningClipTitle").textContent = `${clip.title} (${clip.cefrLevel})`;
    transcriptEl.textContent = clip.transcript;

    const questionsEl = document.getElementById("listeningQuestions");
    clip.questions.forEach((q, index) => {
      const block = document.createElement("div");
      block.className = "reading-question";
      const questionText = document.createElement("p");
      questionText.textContent = `${index + 1}. ${q.question}`;
      block.appendChild(questionText);
      for (const option of q.options) {
        const label = document.createElement("label");
        label.style.display = "block";
        const input = document.createElement("input");
        input.type = "radio";
        input.name = `listeningQuestion${index}`;
        input.value = option;
        label.appendChild(input);
        label.appendChild(document.createTextNode(" " + option));
        block.appendChild(label);
      }
      questionsEl.appendChild(block);
    });

    updateDictationProgress();
  } catch (err) {
    document.getElementById("listeningClipTitle").textContent = "Could not reach the backend.";
  }
}

function closeListeningClip() {
  stopListeningAudio();
  document.getElementById("listeningClipList").classList.remove("hidden");
  document.getElementById("listeningClipDetail").classList.add("hidden");
  currentListeningClip = null;
  loadListeningClips();
}

async function playListeningClip() {
  if (!currentListeningClip) return;
  stopListeningAudio();
  try {
    listeningAudio = await synthesizeToAudio(currentListeningClip.transcript);
    listeningAudio.playbackRate = parseFloat(document.getElementById("listeningSpeed").value);
    listeningAudio.loop = document.getElementById("listeningLoop").checked;
    await listeningAudio.play();
  } catch (err) {
    // non-critical
  }
}

function toggleListeningTranscript() {
  const el = document.getElementById("listeningTranscript");
  const btn = document.getElementById("listeningToggleTranscriptBtn");
  const hidden = el.classList.toggle("hidden");
  btn.textContent = hidden ? "Show transcript" : "Hide transcript";
}

async function submitListeningAnswers() {
  if (!currentListeningClip) return;
  const resultEl = document.getElementById("listeningResult");
  resultEl.textContent = "";
  const answers = currentListeningClip.questions.map((_, index) => {
    const sel = document.querySelector(`input[name="listeningQuestion${index}"]:checked`);
    return sel ? sel.value : "";
  });
  try {
    const res = await fetch(`${API_BASE}/listening/clips/${currentListeningClip.id}/submit`, {
      method: "POST",
      headers: authHeaders({ "Content-Type": "application/json" }),
      body: JSON.stringify({ answers }),
    });
    if (!res.ok) {
      resultEl.textContent = "Could not submit answers.";
      return;
    }
    const result = await res.json();
    resultEl.textContent = `Score: ${result.score}% (${result.correctCount}/${result.totalQuestions} correct)`;
  } catch (err) {
    resultEl.textContent = "Could not reach the backend.";
  }
}

function updateDictationProgress() {
  const total = currentListeningClip ? currentListeningClip.sentences.length : 0;
  document.getElementById("dictationProgress").textContent =
    total > 0 ? `Sentence ${currentDictationIndex + 1} of ${total}` : "";
}

async function playDictationSentence() {
  if (!currentListeningClip) return;
  const sentence = currentListeningClip.sentences[currentDictationIndex];
  if (!sentence) return;
  stopListeningAudio();
  try {
    listeningAudio = await synthesizeToAudio(sentence);
    await listeningAudio.play();
  } catch (err) {
    // non-critical
  }
}

async function checkDictation() {
  if (!currentListeningClip) return;
  const target = currentListeningClip.sentences[currentDictationIndex];
  const attempt = document.getElementById("dictationInput").value;
  const resultEl = document.getElementById("dictationResult");
  if (!attempt.trim()) return;
  try {
    const res = await fetch(`${API_BASE}/listening/dictation/check`, {
      method: "POST",
      headers: authHeaders({ "Content-Type": "application/json" }),
      body: JSON.stringify({ target, attempt }),
    });
    if (!res.ok) return;
    const data = await res.json();
    resultEl.innerHTML = `Accuracy: ${data.score}%<br><span style="opacity:0.75">Correct: ${target}</span>`;
  } catch (err) {
    resultEl.textContent = "Could not reach the backend.";
  }
}

function nextDictationSentence() {
  if (!currentListeningClip) return;
  if (currentDictationIndex < currentListeningClip.sentences.length - 1) {
    currentDictationIndex++;
  } else {
    currentDictationIndex = 0;
  }
  document.getElementById("dictationInput").value = "";
  document.getElementById("dictationResult").innerHTML = "";
  updateDictationProgress();
}

document.getElementById("tabListeningBtn").addEventListener("click", showListeningTab);
document.getElementById("listeningBackBtn").addEventListener("click", closeListeningClip);
document.getElementById("listeningPlayBtn").addEventListener("click", playListeningClip);
document.getElementById("listeningToggleTranscriptBtn").addEventListener("click", toggleListeningTranscript);
document.getElementById("listeningSubmitBtn").addEventListener("click", submitListeningAnswers);
document.getElementById("dictationPlayBtn").addEventListener("click", playDictationSentence);
document.getElementById("dictationCheckBtn").addEventListener("click", checkDictation);
document.getElementById("dictationNextBtn").addEventListener("click", nextDictationSentence);

// --- Writing Module (Stage 18) ---

let currentWritingPromptId = null;

async function loadWritingPrompts() {
  const container = document.getElementById("writingPromptList");
  try {
    const [promptsRes, progressRes] = await Promise.all([
      fetch(`${API_BASE}/writing/prompts`, { headers: authHeaders() }),
      fetch(`${API_BASE}/writing/progress`, { headers: authHeaders() }),
    ]);
    if (!promptsRes.ok) return;
    const prompts = await promptsRes.json();
    const progress = progressRes.ok ? await progressRes.json() : { submissions: [] };
    const countByPrompt = new Map();
    for (const s of progress.submissions) {
      countByPrompt.set(s.promptId, (countByPrompt.get(s.promptId) || 0) + 1);
    }

    container.innerHTML = "";
    for (const prompt of prompts) {
      const count = countByPrompt.get(prompt.id) || 0;
      const card = document.createElement("div");
      card.className = "grammar-topic-card";
      card.innerHTML = `
        <span class="badge">${prompt.cefrLevel}</span>
        <h4>${prompt.title}</h4>
        <div style="font-size: 12px; opacity: 0.75">${prompt.wordCountTarget} ${writingUnitLabel()}${
          count > 0 ? ` · ${count} submission${count === 1 ? "" : "s"}` : " · not started"
        }</div>
      `;
      card.addEventListener("click", () => openWritingPrompt(prompt.id));
      container.appendChild(card);
    }
  } catch (err) {
    container.innerHTML = "Could not reach the backend.";
  }
}

async function openWritingPrompt(promptId) {
  const listEl = document.getElementById("writingPromptList");
  const detailEl = document.getElementById("writingPromptDetail");
  listEl.classList.add("hidden");
  detailEl.classList.remove("hidden");
  document.getElementById("writingFeedback").classList.add("hidden");
  document.getElementById("writingTextarea").value = "";
  document.getElementById("writingError").textContent = "";
  document.getElementById("writingSubmitStatus").textContent = "";
  updateWritingWordCount();

  try {
    const res = await fetch(`${API_BASE}/writing/prompts/${promptId}`, { headers: authHeaders() });
    if (!res.ok) return;
    const p = await res.json();
    currentWritingPromptId = promptId;

    document.getElementById("writingPromptTitle").textContent = `${p.title} (${p.cefrLevel})`;
    document.getElementById("writingPromptText").textContent = p.prompt;
    document.getElementById("writingGrammarFocus").textContent = p.grammarFocus;
    document.getElementById("writingTargetVocab").textContent = p.targetVocabulary.join(", ");
    document.getElementById("writingWordTarget").textContent =
      `${p.wordCountTarget} ${writingUnitLabel()}`;
    const hints = document.getElementById("writingHints");
    hints.innerHTML = "";
    for (const hint of p.hints) {
      const li = document.createElement("li");
      li.textContent = hint;
      hints.appendChild(li);
    }
  } catch (err) {
    // detail load failed; list stays
  }
}

function closeWritingPrompt() {
  document.getElementById("writingPromptList").classList.remove("hidden");
  document.getElementById("writingPromptDetail").classList.add("hidden");
  currentWritingPromptId = null;
  loadWritingPrompts();
}

// Chinese is written without spaces, so length is counted in characters (字数)
// — splitting on whitespace would show "1 word" for a whole Chinese essay.
function countWritingUnitsClient(text) {
  if (currentTargetLanguage === "chinese") {
    return Array.from(text).filter((ch) => /[一-鿿㐀-䶿]/.test(ch)).length;
  }
  return text ? text.split(/\s+/).filter((w) => w.length > 0).length : 0;
}

function writingUnitLabel() {
  return currentTargetLanguage === "chinese" ? "characters" : "words";
}

function updateWritingWordCount() {
  const text = document.getElementById("writingTextarea").value.trim();
  const count = countWritingUnitsClient(text);
  document.getElementById("writingLiveWordCount").textContent =
    `(${count} ${writingUnitLabel()})`;
}

function renderList(elId, items) {
  const el = document.getElementById(elId);
  el.innerHTML = "";
  for (const item of items) {
    const li = document.createElement("li");
    li.textContent = item;
    el.appendChild(li);
  }
}

async function submitWriting() {
  if (!currentWritingPromptId) return;
  const text = document.getElementById("writingTextarea").value.trim();
  const errorEl = document.getElementById("writingError");
  const statusEl = document.getElementById("writingSubmitStatus");
  errorEl.textContent = "";
  if (!text) {
    errorEl.textContent = "Write something first.";
    return;
  }

  const btn = document.getElementById("writingSubmitBtn");
  btn.disabled = true;
  statusEl.textContent = "Analyzing your writing… (this can take a moment)";

  try {
    const res = await fetch(`${API_BASE}/writing/prompts/${currentWritingPromptId}/submit`, {
      method: "POST",
      headers: authHeaders({ "Content-Type": "application/json" }),
      body: JSON.stringify({ text }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      errorEl.textContent = body.error || "Could not analyze your writing.";
      return;
    }
    const fb = await res.json();

    document.getElementById("wfOverall").textContent = fb.overall;
    document.getElementById("wfGrammar").textContent = `${fb.grammarScore}%`;
    document.getElementById("wfVocab").textContent = `${fb.vocabularyScore}%`;
    document.getElementById("wfCoherence").textContent = `${fb.coherenceScore}%`;
    document.getElementById("wfWordCount").textContent = String(fb.wordCount);
    renderList("wfStrengths", fb.strengths);
    renderList("wfImprovements", fb.improvements);

    const mistakesEl = document.getElementById("wfMistakes");
    mistakesEl.innerHTML = "";
    if (fb.mistakes.length === 0) {
      mistakesEl.textContent = "No grammar or spelling issues detected. Well done!";
    } else {
      for (const m of fb.mistakes) {
        const div = document.createElement("div");
        div.className = "correction-item";
        div.innerHTML = `<span class="strike">${m.originalText}</span><span class="arrow">→</span><span class="fix">${m.correctedText}</span> <span style="opacity:0.65;font-size:12px">(${m.category})</span>`;
        mistakesEl.appendChild(div);
      }
    }
    document.getElementById("wfModel").textContent = fb.modelAnswer;
    document.getElementById("writingFeedback").classList.remove("hidden");
    statusEl.textContent = "Feedback ready.";
  } catch (err) {
    errorEl.textContent = "Could not reach the backend.";
  } finally {
    btn.disabled = false;
  }
}

document.getElementById("tabWritingBtn").addEventListener("click", showWritingTab);
document.getElementById("writingBackBtn").addEventListener("click", closeWritingPrompt);
document.getElementById("writingTextarea").addEventListener("input", updateWritingWordCount);
document.getElementById("writingSubmitBtn").addEventListener("click", submitWriting);

// --- Quiz Generator (Stage 19) ---

let currentQuiz = null; // { quizId, questions: [{type, question, options}] }
let quizGraded = false;

const QUIZ_CATEGORY_LABELS = {
  grammar: "Grammar",
  vocabulary: "Vocabulary",
  everyday_english: "Everyday English",
  // Stage 31: Chinese-only categories.
  everyday_chinese: "Everyday Chinese",
  characters: "Characters 汉字",
};

async function loadQuizProgress() {
  const el = document.getElementById("quizProgress");
  try {
    const res = await fetch(`${API_BASE}/quiz/progress`, { headers: authHeaders() });
    if (!res.ok) return;
    const p = await res.json();
    if (p.recent.length === 0) {
      el.innerHTML = "<p style='opacity:0.7;font-size:13px'>No quizzes taken yet.</p>";
      return;
    }
    el.innerHTML = `<p style="font-size:13px">Average score: <strong>${p.averageScore}%</strong> over ${p.totalQuizzes} quiz${p.totalQuizzes === 1 ? "" : "zes"}.</p>`;
    const list = document.createElement("div");
    for (const q of p.recent.slice(0, 8)) {
      const row = document.createElement("div");
      row.style.fontSize = "12px";
      row.style.opacity = "0.85";
      row.textContent = `${QUIZ_CATEGORY_LABELS[q.category] || q.category} (${q.difficultyLevel}) — ${q.score}%`;
      list.appendChild(row);
    }
    el.appendChild(list);
  } catch (err) {
    // non-critical
  }
}

async function generateQuiz() {
  const category = document.getElementById("quizCategory").value;
  const difficultyLevel = document.getElementById("quizDifficulty").value;
  const statusEl = document.getElementById("quizGenStatus");
  const errorEl = document.getElementById("quizError");
  errorEl.textContent = "";
  const btn = document.getElementById("quizGenerateBtn");
  btn.disabled = true;
  statusEl.textContent = "Generating your quiz… (this can take a moment)";

  try {
    const res = await fetch(`${API_BASE}/quiz/generate`, {
      method: "POST",
      headers: authHeaders({ "Content-Type": "application/json" }),
      body: JSON.stringify({ category, difficultyLevel }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      errorEl.textContent = body.error || "Could not generate a quiz.";
      return;
    }
    currentQuiz = await res.json();
    quizGraded = false;
    renderQuiz();
  } catch (err) {
    errorEl.textContent = "Could not reach the backend.";
  } finally {
    btn.disabled = false;
    statusEl.textContent = "";
  }
}

function renderQuiz() {
  document.getElementById("quizSetup").classList.add("hidden");
  document.getElementById("quizActive").classList.remove("hidden");
  document.getElementById("quizResultSummary").innerHTML = "";
  document.getElementById("quizNewBtn").classList.add("hidden");
  document.getElementById("quizSubmitBtn").classList.remove("hidden");
  document.getElementById("quizSubmitBtn").disabled = false;
  document.getElementById("quizActiveTitle").textContent =
    `${QUIZ_CATEGORY_LABELS[currentQuiz.category] || currentQuiz.category} Quiz (${currentQuiz.difficultyLevel})`;

  const container = document.getElementById("quizQuestions");
  container.innerHTML = "";
  currentQuiz.questions.forEach((q, index) => {
    const block = document.createElement("div");
    block.className = "quiz-question";
    block.id = `quizQ${index}`;
    const qText = document.createElement("p");
    qText.textContent = `${index + 1}. ${q.question}`;
    block.appendChild(qText);
    for (const option of q.options) {
      const label = document.createElement("label");
      label.style.display = "block";
      const input = document.createElement("input");
      input.type = "radio";
      input.name = `quizQuestion${index}`;
      input.value = option;
      label.appendChild(input);
      label.appendChild(document.createTextNode(" " + option));
      block.appendChild(label);
    }
    container.appendChild(block);
  });
}

async function submitQuiz() {
  if (!currentQuiz || quizGraded) return;
  const answers = currentQuiz.questions.map((_, index) => {
    const sel = document.querySelector(`input[name="quizQuestion${index}"]:checked`);
    return sel ? sel.value : "";
  });

  try {
    const res = await fetch(`${API_BASE}/quiz/${currentQuiz.quizId}/submit`, {
      method: "POST",
      headers: authHeaders({ "Content-Type": "application/json" }),
      body: JSON.stringify({ answers }),
    });
    if (!res.ok) return;
    const result = await res.json();
    quizGraded = true;

    result.results.forEach((r, index) => {
      const block = document.getElementById(`quizQ${index}`);
      block.classList.add(r.isCorrect ? "correct" : "incorrect");
      block.querySelectorAll("input").forEach((input) => (input.disabled = true));
      const explain = document.createElement("div");
      explain.className = "quiz-explanation";
      explain.textContent = r.isCorrect
        ? `✓ Correct. ${r.explanation}`
        : `✗ Correct answer: ${r.correctAnswer}. ${r.explanation}`;
      block.appendChild(explain);
    });

    document.getElementById("quizResultSummary").innerHTML =
      `<h3>Score: ${result.score}% (${result.correctCount}/${result.totalQuestions})</h3>`;
    document.getElementById("quizSubmitBtn").classList.add("hidden");
    document.getElementById("quizNewBtn").classList.remove("hidden");
    loadQuizProgress();
  } catch (err) {
    document.getElementById("quizError").textContent = "Could not reach the backend.";
  }
}

function newQuiz() {
  currentQuiz = null;
  quizGraded = false;
  document.getElementById("quizActive").classList.add("hidden");
  document.getElementById("quizSetup").classList.remove("hidden");
  document.getElementById("quizQuestions").innerHTML = "";
  document.getElementById("quizResultSummary").innerHTML = "";
  loadQuizProgress();
}

document.getElementById("tabQuizBtn").addEventListener("click", showQuizTab);
document.getElementById("quizGenerateBtn").addEventListener("click", generateQuiz);
document.getElementById("quizSubmitBtn").addEventListener("click", submitQuiz);
document.getElementById("quizNewBtn").addEventListener("click", newQuiz);

// --- Learning History (Stage 22) ---

const HISTORY_TYPE_ICONS = {
  conversation: "💬",
  grammar: "📘",
  reading: "📖",
  listening: "🎧",
  writing: "✍️",
  quiz: "❓",
  pronunciation: "🗣️",
};

async function loadLearningHistory() {
  const body = document.getElementById("historyBody");
  const summary = document.getElementById("historySummary");
  try {
    const res = await fetch(`${API_BASE}/history`, { headers: authHeaders() });
    if (!res.ok) return;
    const data = await res.json();
    summary.textContent =
      data.totalActivities === 0
        ? "No activity yet — try any of the practice modules and your history will appear here."
        : `${data.totalActivities} activities · average score ${data.averageScore}%`;
    body.innerHTML = "";
    for (const e of data.entries) {
      const row = document.createElement("tr");
      const icon = HISTORY_TYPE_ICONS[e.type] || "•";
      const when = e.createdAt.replace("T", " ").slice(0, 16);
      const score = e.score !== null && e.score !== undefined ? `${e.score}%` : "—";
      row.innerHTML = `<td style="white-space:nowrap;opacity:0.8">${when}</td><td>${icon} ${e.title}</td><td style="opacity:0.8">${e.detail || ""}</td><td>${score}</td>`;
      body.appendChild(row);
    }
  } catch (err) {
    body.innerHTML = "<tr><td colspan='4'>Could not reach the backend.</td></tr>";
  }
}

document.getElementById("tabHistoryBtn").addEventListener("click", showHistoryTab);
document.getElementById("historyRefreshBtn").addEventListener("click", loadLearningHistory);

// --- Vocabulary spaced-repetition review (Stage 25) ---

let reviewQueue = []; // NotebookEntryDto[] currently being worked through
let reviewIndex = 0;
let reviewCompleted = 0;

// Updates the little count on the Review tab so a student can see at a glance
// how many words are waiting, without opening the tab. Silent on failure — the
// badge is a convenience, not core flow.
async function refreshReviewBadge() {
  const badge = document.getElementById("reviewDueBadge");
  if (!badge) return;
  try {
    const res = await fetch(`${API_BASE}/vocabulary/review/stats`, { headers: authHeaders() });
    if (!res.ok) return;
    const stats = await res.json();
    if (stats.due > 0) {
      badge.textContent = String(stats.due);
      badge.classList.remove("hidden");
    } else {
      badge.classList.add("hidden");
    }
  } catch (err) {
    // ignore
  }
}

async function loadReviewStats() {
  const el = document.getElementById("reviewStats");
  const startBtn = document.getElementById("reviewStartBtn");
  try {
    const res = await fetch(`${API_BASE}/vocabulary/review/stats`, { headers: authHeaders() });
    if (!res.ok) return;
    const stats = await res.json();
    el.textContent =
      `${stats.due} due now · ${stats.learning} still learning · ` +
      `${stats.mature} mastered · ${stats.total} words total`;
    startBtn.disabled = stats.due === 0;
    startBtn.textContent = stats.due > 0 ? `Start review (${stats.due})` : "Nothing due right now";
  } catch (err) {
    el.textContent = "Could not load review stats.";
  }
}

function resetReviewSession() {
  reviewQueue = [];
  reviewIndex = 0;
  reviewCompleted = 0;
  document.getElementById("reviewCardArea").classList.add("hidden");
  document.getElementById("reviewDone").classList.add("hidden");
}

async function startReviewSession() {
  try {
    const res = await fetch(`${API_BASE}/vocabulary/review/queue?limit=50`, {
      headers: authHeaders(),
    });
    if (!res.ok) return;
    const data = await res.json();
    reviewQueue = data.cards || [];
    reviewIndex = 0;
    reviewCompleted = 0;
    if (reviewQueue.length === 0) {
      document.getElementById("reviewDone").classList.remove("hidden");
      document.getElementById("reviewCardArea").classList.add("hidden");
      return;
    }
    document.getElementById("reviewDone").classList.add("hidden");
    document.getElementById("reviewCardArea").classList.remove("hidden");
    renderReviewCard();
  } catch (err) {
    document.getElementById("reviewStats").textContent = "Could not start review.";
  }
}

function renderReviewCard() {
  const entry = reviewQueue[reviewIndex];
  const vocab = entry.vocabulary;

  document.getElementById("reviewProgress").textContent =
    `Card ${reviewIndex + 1} of ${reviewQueue.length}`;
  document.getElementById("reviewWord").textContent = vocab.word;
  document.getElementById("reviewCefr").textContent = vocab.cefrLevel;

  // Reset to the "prompt" side: word shown, answer hidden until the student
  // commits to recalling it (the core of active-recall practice).
  const answer = document.getElementById("reviewAnswer");
  answer.innerHTML = "";
  const def = document.createElement("div");
  def.textContent = vocab.definition;
  answer.appendChild(def);
  if (vocab.example) {
    const ex = document.createElement("div");
    ex.className = "example";
    ex.textContent = vocab.example;
    answer.appendChild(ex);
  }
  if (vocab.synonyms && vocab.synonyms.length > 0) {
    const syn = document.createElement("div");
    syn.style.marginTop = "6px";
    syn.textContent = `Synonyms: ${vocab.synonyms.join(", ")}`;
    answer.appendChild(syn);
  }
  answer.classList.add("hidden");
  document.getElementById("reviewShowBtn").classList.remove("hidden");
  document.getElementById("reviewRatingRow").classList.add("hidden");
}

function revealReviewAnswer() {
  document.getElementById("reviewAnswer").classList.remove("hidden");
  document.getElementById("reviewShowBtn").classList.add("hidden");
  document.getElementById("reviewRatingRow").classList.remove("hidden");
}

async function gradeReviewCard(rating) {
  const entry = reviewQueue[reviewIndex];
  if (!entry) return;
  try {
    const res = await fetch(`${API_BASE}/vocabulary/review/${entry.id}`, {
      method: "POST",
      headers: authHeaders({ "Content-Type": "application/json" }),
      body: JSON.stringify({ rating }),
    });
    if (!res.ok) return;
  } catch (err) {
    return; // leave the card in place so the student can retry
  }

  reviewCompleted += 1;
  reviewIndex += 1;
  if (reviewIndex >= reviewQueue.length) {
    document.getElementById("reviewCardArea").classList.add("hidden");
    document.getElementById("reviewDone").classList.remove("hidden");
    loadReviewStats();
    refreshReviewBadge();
  } else {
    renderReviewCard();
  }
}

// Stage 33: seed the review deck from the curated CEFR wordlist, so a new
// learner has cards to practise before they've looked anything up themselves.
async function seedStarterPack() {
  const level = document.getElementById("seedLevelSelect").value;
  const count = Number(document.getElementById("seedCountSelect").value);
  const resultEl = document.getElementById("seedResult");
  const button = document.getElementById("seedBtn");

  button.disabled = true;
  resultEl.textContent = "Adding words…";
  try {
    const res = await fetch(`${API_BASE}/vocabulary/notebook/seed`, {
      method: "POST",
      headers: authHeaders({ "Content-Type": "application/json" }),
      body: JSON.stringify({ level, count }),
    });
    if (!res.ok) {
      resultEl.textContent = "Could not add the starter pack.";
      return;
    }
    const data = await res.json();
    resultEl.textContent =
      data.added > 0
        ? `Added ${data.added} ${level} word${data.added === 1 ? "" : "s"} to your review deck.`
        : `You already have every ${level} word in this pack.`;
    loadReviewStats();
    refreshReviewBadge();
    loadNotebook();
  } catch (err) {
    resultEl.textContent = "Could not reach the backend.";
  } finally {
    button.disabled = false;
  }
}

document.getElementById("seedBtn").addEventListener("click", seedStarterPack);
document.getElementById("tabReviewBtn").addEventListener("click", showReviewTab);
document.getElementById("reviewStartBtn").addEventListener("click", startReviewSession);
document.getElementById("reviewShowBtn").addEventListener("click", revealReviewAnswer);
for (const btn of document.querySelectorAll(".review-rate-btn")) {
  btn.addEventListener("click", () => gradeReviewCard(btn.dataset.rating));
}

// --- CEFR placement test (Stage 26) ---

const CEFR_LEVEL_LABELS = {
  A1: "Beginner",
  A2: "Elementary",
  B1: "Intermediate",
  B2: "Upper-intermediate",
  C1: "Advanced",
  C2: "Proficient",
};

let placementSessionId = null;
let currentPlacementBlock = null;

async function loadPlacementStatus() {
  const valueEl = document.getElementById("placementLevelValue");
  const hintEl = document.getElementById("placementLevelHint");
  const startBtn = document.getElementById("placementStartBtn");
  try {
    const res = await fetch(`${API_BASE}/placement/status`, { headers: authHeaders() });
    if (!res.ok) return;
    const status = await res.json();
    if (status.placementLevel) {
      const label = CEFR_LEVEL_LABELS[status.placementLevel] || "";
      valueEl.textContent = `${status.placementLevel} · ${label}`;
      hintEl.textContent = "Your lessons and conversations start at this level.";
      startBtn.textContent = "Retake placement test";
    } else {
      valueEl.textContent = "Not assessed yet";
      hintEl.textContent = "Take a 1-minute test so your practice starts at the right level.";
      startBtn.textContent = "Take placement test";
    }
  } catch (err) {
    // sidebar convenience; ignore failures
  }
}

function openPlacementModal() {
  document.getElementById("placementError").textContent = "";
  document.getElementById("placementResult").classList.add("hidden");
  document.getElementById("placementResult").innerHTML = "";
  document.getElementById("placementQuestions").innerHTML = "";
  document.getElementById("placementProgress").textContent = "";
  document.getElementById("placementSubmitBtn").classList.remove("hidden");
  document.getElementById("placementModal").classList.remove("hidden");
}

function closePlacementModal() {
  document.getElementById("placementModal").classList.add("hidden");
  placementSessionId = null;
}

function renderPlacementBlock(block) {
  placementSessionId = block.sessionId;
  currentPlacementBlock = block;
  document.getElementById("placementProgress").textContent =
    `Section ${block.blockNumber} · level ${block.level}`;
  const container = document.getElementById("placementQuestions");
  container.innerHTML = "";
  block.items.forEach((item, i) => {
    const wrap = document.createElement("div");
    wrap.className = "placement-item";
    const q = document.createElement("div");
    q.className = "q";
    q.textContent = `${i + 1}. ${item.question}`;
    wrap.appendChild(q);
    for (const option of item.options) {
      const label = document.createElement("label");
      label.className = "placement-option";
      const radio = document.createElement("input");
      radio.type = "radio";
      radio.name = `placement-${item.id}`;
      radio.value = option;
      label.appendChild(radio);
      label.appendChild(document.createTextNode(option));
      wrap.appendChild(label);
    }
    container.appendChild(wrap);
  });
}

async function startPlacementTest() {
  openPlacementModal();
  try {
    const res = await fetch(`${API_BASE}/placement/start`, {
      method: "POST",
      headers: authHeaders(),
    });
    if (!res.ok) {
      document.getElementById("placementError").textContent = "Could not start the test.";
      return;
    }
    renderPlacementBlock(await res.json());
  } catch (err) {
    document.getElementById("placementError").textContent = "Could not reach the backend.";
  }
}

function collectPlacementAnswers(block) {
  const answers = {};
  for (const item of block.items) {
    const chosen = document.querySelector(`input[name="placement-${item.id}"]:checked`);
    if (chosen) answers[item.id] = chosen.value;
  }
  return answers;
}

async function submitPlacementAnswers() {
  if (!placementSessionId || !currentPlacementBlock) return;
  const errorEl = document.getElementById("placementError");
  const answers = collectPlacementAnswers(currentPlacementBlock);
  if (Object.keys(answers).length < currentPlacementBlock.items.length) {
    errorEl.textContent = "Please answer every question before continuing.";
    return;
  }
  errorEl.textContent = "";

  try {
    const res = await fetch(`${API_BASE}/placement/${placementSessionId}/answer`, {
      method: "POST",
      headers: authHeaders({ "Content-Type": "application/json" }),
      body: JSON.stringify({ answers }),
    });
    if (!res.ok) {
      errorEl.textContent = "Could not submit answers.";
      return;
    }
    const body = await res.json();
    if (body.complete) {
      showPlacementResult(body.resultLevel);
    } else {
      currentPlacementBlock = body.block;
      renderPlacementBlock(body.block);
    }
  } catch (err) {
    errorEl.textContent = "Could not reach the backend.";
  }
}

function showPlacementResult(level) {
  document.getElementById("placementQuestions").innerHTML = "";
  document.getElementById("placementProgress").textContent = "";
  document.getElementById("placementSubmitBtn").classList.add("hidden");
  const label = CEFR_LEVEL_LABELS[level] || "";
  const resultEl = document.getElementById("placementResult");
  resultEl.innerHTML =
    `<p>Your assessed level is</p>` +
    `<div class="placement-result-level">${level} · ${label}</div>` +
    `<p style="opacity:0.85">Your conversations and practice will now start here. ` +
    `You can retake the test any time.</p>`;
  resultEl.classList.remove("hidden");
  loadPlacementStatus();
}

document.getElementById("placementStartBtn").addEventListener("click", startPlacementTest);
document.getElementById("placementSubmitBtn").addEventListener("click", submitPlacementAnswers);
document.getElementById("placementCloseBtn").addEventListener("click", closePlacementModal);

// --- Structured learning path (Stage 27) ---

const LESSON_TYPE_LABELS = {
  grammar: "Grammar",
  reading: "Reading",
  listening: "Listening",
  writing: "Writing",
  conversation: "Talk",
  quiz: "Quiz",
};

function showPathTab() {
  showMainTab("path");
  loadCurriculum();
}

// Clicking a lesson takes the student straight to that activity in its own
// module, rather than making them hunt for it in the relevant tab.
function openLesson(lesson) {
  switch (lesson.type) {
    case "grammar":
      showGrammarTab();
      openGrammarTopic(lesson.refId);
      break;
    case "reading":
      showReadingTab();
      openReadingPassage(lesson.refId);
      break;
    case "listening":
      showListeningTab();
      openListeningClip(lesson.refId);
      break;
    case "writing":
      showWritingTab();
      openWritingPrompt(lesson.refId);
      break;
    case "quiz": {
      showQuizTab();
      const select = document.getElementById("quizCategory");
      if (select) select.value = lesson.refId;
      break;
    }
    case "conversation": {
      showChatTab();
      const select = document.getElementById("scenarioSelect");
      if (select) select.value = lesson.refId;
      break;
    }
    default:
      break;
  }
}

function renderPathLesson(lesson) {
  const row = document.createElement("div");
  row.className = lesson.completed ? "path-lesson done" : "path-lesson";

  const check = document.createElement("span");
  check.className = "path-lesson-check";
  check.textContent = lesson.completed ? "✓" : "○";

  const title = document.createElement("span");
  title.className = "path-lesson-title";
  title.textContent = lesson.title;

  const type = document.createElement("span");
  type.className = "path-lesson-type";
  type.textContent = LESSON_TYPE_LABELS[lesson.type] || lesson.type;

  row.appendChild(check);
  row.appendChild(title);
  row.appendChild(type);
  row.addEventListener("click", () => openLesson(lesson));
  return row;
}

function renderPathUnit(unit, recommendedUnitId) {
  const box = document.createElement("div");
  box.className = "panel path-unit" + (unit.id === recommendedUnitId ? " is-recommended" : "");

  const header = document.createElement("div");
  header.className = "path-unit-header";

  const level = document.createElement("span");
  level.className = "path-level-badge";
  level.textContent = levelLabel(unit.level);

  const title = document.createElement("span");
  title.className = "path-unit-title";
  title.textContent = unit.title;

  header.appendChild(level);
  header.appendChild(title);

  if (unit.id === recommendedUnitId) {
    const rec = document.createElement("span");
    rec.className = "path-recommended";
    rec.textContent = "START HERE";
    header.appendChild(rec);
  }

  const count = document.createElement("span");
  count.className = "path-unit-count";
  count.textContent = `${unit.completedCount}/${unit.totalCount}`;
  header.appendChild(count);

  box.appendChild(header);
  for (const lesson of unit.lessons) {
    box.appendChild(renderPathLesson(lesson));
  }
  return box;
}

async function loadCurriculum() {
  const container = document.getElementById("pathUnits");
  const summary = document.getElementById("pathSummary");
  try {
    const res = await fetch(`${API_BASE}/curriculum`, { headers: authHeaders() });
    if (!res.ok) {
      summary.textContent = "Could not load your learning path.";
      return;
    }
    const data = await res.json();

    document.getElementById("pathTitle").textContent = data.courseTitle;
    const pct = data.totalLessons > 0
      ? Math.round((data.completedLessons / data.totalLessons) * 100)
      : 0;
    const placedText = data.placementLevel
      ? `Placed at ${data.placementLevel}.`
      : "Take the placement test to start at the right level.";
    summary.textContent =
      `${data.completedLessons} of ${data.totalLessons} steps complete (${pct}%). ${placedText}`;
    document.getElementById("pathProgressFill").style.width = `${pct}%`;

    container.innerHTML = "";
    for (const unit of data.units) {
      container.appendChild(renderPathUnit(unit, data.recommendedUnitId));
    }
  } catch (err) {
    summary.textContent = "Could not reach the backend.";
  }
}

document.getElementById("tabPathBtn").addEventListener("click", showPathTab);

// Chinese passages ship with pinyin and a translation. Both stay hidden
// behind toggles so the learner tries the characters first, but can always
// fall back — without that, a beginner who can't read hanzi is simply stuck.
function renderReadingScaffold(passage) {
  const scaffold = document.getElementById("readingScaffold");
  const pinyinEl = document.getElementById("readingPinyin");
  const translationEl = document.getElementById("readingTranslation");
  const pinyinBtn = document.getElementById("readingPinyinBtn");
  const translationBtn = document.getElementById("readingTranslationBtn");

  const hasPinyin = Boolean(passage.pinyin);
  const hasTranslation = Boolean(passage.translation);
  if (!hasPinyin && !hasTranslation) {
    scaffold.classList.add("hidden");
    return;
  }

  pinyinEl.textContent = passage.pinyin || "";
  translationEl.textContent = passage.translation || "";
  // Reset to hidden each time a passage is opened.
  pinyinEl.classList.add("hidden");
  translationEl.classList.add("hidden");
  pinyinBtn.textContent = "Show pinyin";
  translationBtn.textContent = "Show translation";
  pinyinBtn.classList.toggle("hidden", !hasPinyin);
  translationBtn.classList.toggle("hidden", !hasTranslation);
  scaffold.classList.remove("hidden");
}

function toggleReadingScaffoldSection(elId, btnId, showLabel, hideLabel) {
  const el = document.getElementById(elId);
  const btn = document.getElementById(btnId);
  const nowHidden = el.classList.toggle("hidden");
  btn.textContent = nowHidden ? showLabel : hideLabel;
}

document.getElementById("readingPinyinBtn").addEventListener("click", () => {
  toggleReadingScaffoldSection("readingPinyin", "readingPinyinBtn", "Show pinyin", "Hide pinyin");
});
document.getElementById("readingTranslationBtn").addEventListener("click", () => {
  toggleReadingScaffoldSection(
    "readingTranslation",
    "readingTranslationBtn",
    "Show translation",
    "Hide translation",
  );
});

// --- Target language: English or Chinese (Stage 28) ---

let currentTargetLanguage = "english";

const HSK_LABELS = {
  A1: "HSK 1",
  A2: "HSK 2",
  B1: "HSK 3",
  B2: "HSK 4",
  C1: "HSK 5",
  C2: "HSK 6",
};

// CEFR stays the internal scale for every language; Chinese learners just see
// the equivalent HSK band, which is the scale they'll actually recognise.
function levelLabel(cefrLevel) {
  if (currentTargetLanguage === "chinese" && HSK_LABELS[cefrLevel]) {
    return HSK_LABELS[cefrLevel];
  }
  return cefrLevel;
}

function applyTargetLanguageToUi() {
  const isChinese = currentTargetLanguage === "chinese";
  document.body.classList.toggle("lang-chinese", isChinese);
  const hint = document.getElementById("targetLanguageHint");
  if (hint) {
    hint.textContent = isChinese
      ? "Your lessons, reading and AI conversations are in Mandarin Chinese."
      : "Your lessons, reading and AI conversations are in English.";
  }
}

// The category list depends on the language being learned, so it's fetched
// rather than hardcoded in the markup.
async function loadQuizCategories() {
  const select = document.getElementById("quizCategory");
  if (!select) return;
  try {
    const res = await fetch(`${API_BASE}/quiz/categories`, { headers: authHeaders() });
    if (!res.ok) return;
    const { categories } = await res.json();
    if (!Array.isArray(categories) || categories.length === 0) return;
    const previous = select.value;
    select.innerHTML = "";
    for (const category of categories) {
      const option = document.createElement("option");
      option.value = category;
      option.textContent = QUIZ_CATEGORY_LABELS[category] || category;
      select.appendChild(option);
    }
    if (categories.includes(previous)) select.value = previous;
  } catch (err) {
    // keep whatever options are already in the markup
  }
}

async function loadTargetLanguage() {
  try {
    const res = await fetch(`${API_BASE}/me/language`, { headers: authHeaders() });
    if (!res.ok) return;
    const data = await res.json();
    currentTargetLanguage = data.targetLanguage || "english";
    const select = document.getElementById("targetLanguageSelect");
    if (select) select.value = currentTargetLanguage;
    applyTargetLanguageToUi();
  } catch (err) {
    // sidebar convenience; ignore
  }
}

// Switching language changes which content catalogs the backend serves, so
// every content view has to be reloaded.
async function changeTargetLanguage(language) {
  try {
    const res = await fetch(`${API_BASE}/me/language`, {
      method: "PUT",
      headers: authHeaders({ "Content-Type": "application/json" }),
      body: JSON.stringify({ targetLanguage: language }),
    });
    if (!res.ok) return;
    currentTargetLanguage = language;
    applyTargetLanguageToUi();

    loadGrammarTopics();
    loadReadingPassages();
    loadListeningClips();
    loadWritingPrompts();
    loadQuizCategories();
    loadPlacementStatus();
    if (!document.getElementById("pathPanel").classList.contains("hidden")) {
      loadCurriculum();
    }
  } catch (err) {
    // ignore; the select will be re-synced on next login
  }
}

document.getElementById("targetLanguageSelect").addEventListener("change", (e) => {
  changeTargetLanguage(e.target.value);
});

// --- Platform super-admin: school management (Stage 20) ---

let addAdminSchoolId = null;

async function loadSchools() {
  const body = document.getElementById("schoolsBody");
  try {
    const res = await fetch(`${API_BASE}/schools`, { headers: authHeaders() });
    if (!res.ok) return;
    const schools = await res.json();
    body.innerHTML = "";
    if (schools.length === 0) {
      body.innerHTML = "<tr><td colspan='5'>No schools yet. Create one above.</td></tr>";
      return;
    }
    for (const s of schools) {
      const row = document.createElement("tr");
      row.innerHTML = `<td>${s.name}</td><td>${s.adminCount}</td><td>${s.teacherCount}</td><td>${s.studentCount}</td>`;
      const actionCell = document.createElement("td");
      const btn = document.createElement("button");
      btn.textContent = "+ Admin";
      btn.addEventListener("click", () => openAddSchoolAdmin(s.id, s.name));
      actionCell.appendChild(btn);
      row.appendChild(actionCell);
      body.appendChild(row);
    }
  } catch (err) {
    body.innerHTML = "<tr><td colspan='5'>Could not reach the backend.</td></tr>";
  }
}

async function createSchool() {
  const input = document.getElementById("newSchoolName");
  const errorEl = document.getElementById("createSchoolError");
  errorEl.textContent = "";
  const name = input.value.trim();
  if (!name) return;
  try {
    const res = await fetch(`${API_BASE}/schools`, {
      method: "POST",
      headers: authHeaders({ "Content-Type": "application/json" }),
      body: JSON.stringify({ name }),
    });
    if (!res.ok) {
      const b = await res.json().catch(() => ({}));
      errorEl.textContent = b.error || "Could not create school";
      return;
    }
    input.value = "";
    await loadSchools();
  } catch (err) {
    errorEl.textContent = "Could not reach the backend.";
  }
}

function openAddSchoolAdmin(schoolId, schoolName) {
  addAdminSchoolId = schoolId;
  document.getElementById("addSchoolAdminPanel").classList.remove("hidden");
  document.getElementById("addAdminSchoolName").textContent = schoolName;
  document.getElementById("createSchoolAdminError").textContent = "";
  document.getElementById("createSchoolAdminSuccess").textContent = "";
}

async function createSchoolAdmin() {
  if (!addAdminSchoolId) return;
  const email = document.getElementById("newSchoolAdminEmail").value.trim();
  const displayName = document.getElementById("newSchoolAdminName").value.trim();
  const password = document.getElementById("newSchoolAdminPassword").value;
  const errorEl = document.getElementById("createSchoolAdminError");
  const successEl = document.getElementById("createSchoolAdminSuccess");
  errorEl.textContent = "";
  successEl.textContent = "";
  try {
    const res = await fetch(`${API_BASE}/schools/${addAdminSchoolId}/admins`, {
      method: "POST",
      headers: authHeaders({ "Content-Type": "application/json" }),
      body: JSON.stringify({ email, displayName, password }),
    });
    if (!res.ok) {
      const b = await res.json().catch(() => ({}));
      errorEl.textContent = b.error || "Could not create admin";
      return;
    }
    document.getElementById("newSchoolAdminEmail").value = "";
    document.getElementById("newSchoolAdminName").value = "";
    document.getElementById("newSchoolAdminPassword").value = "";
    successEl.textContent = `Created admin ${email}.`;
    await loadSchools();
  } catch (err) {
    errorEl.textContent = "Could not reach the backend.";
  }
}

document.getElementById("superAdminLogoutBtn").addEventListener("click", logout);
document.getElementById("createSchoolBtn").addEventListener("click", createSchool);
document.getElementById("createSchoolAdminBtn").addEventListener("click", createSchoolAdmin);

// --- Admin console (Stage 12) ---

function fmtBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

async function loadSystemHealth() {
  const table = document.getElementById("systemHealthTable");
  table.innerHTML = "<tr><td colspan='2'>Loading…</td></tr>";
  try {
    const res = await fetch(`${API_BASE}/admin/system-health`, { headers: authHeaders() });
    if (!res.ok) return;
    const data = await res.json();

    const rows = [
      ["Backend DB", data.backend.dbConnected],
      ["Backend uptime", `${data.backend.uptimeSeconds}s`],
      ["AI service", data.aiService.reachable],
      ["AI model loaded", data.aiService.modelLoaded ?? "—"],
      ["AI model path", data.aiService.modelPath ?? "—"],
      ["AI thread count", data.aiService.threadCount ?? "—"],
      ["LanguageTool", data.languageTool.reachable],
    ];

    table.innerHTML = "";
    for (const [label, value] of rows) {
      const tr = document.createElement("tr");
      const badge =
        typeof value === "boolean"
          ? `<span class="badge ${value ? "ok" : "down"}">${value ? "OK" : "unreachable"}</span>`
          : value;
      tr.innerHTML = `<td>${label}</td><td>${badge}</td>`;
      table.appendChild(tr);
    }
  } catch (err) {
    table.innerHTML = "<tr><td colspan='2'>Could not reach the backend.</td></tr>";
  }
}

async function loadServerConfig() {
  const table = document.getElementById("serverConfigTable");
  try {
    const res = await fetch(`${API_BASE}/admin/config`, { headers: authHeaders() });
    if (!res.ok) return;
    const data = await res.json();
    table.innerHTML = "";
    for (const [label, value] of [
      ["Host", data.host],
      ["Port", data.port],
      ["TLS enabled", data.tlsEnabled],
      ["Auth rate limit", `${data.rateLimitPerMinute}/minute`],
      ["Database file", data.dbPath],
    ]) {
      const tr = document.createElement("tr");
      tr.innerHTML = `<td>${label}</td><td>${value}</td>`;
      table.appendChild(tr);
    }
  } catch (err) {
    table.innerHTML = "<tr><td colspan='2'>Could not reach the backend.</td></tr>";
  }
}

async function loadAiModels() {
  const body = document.getElementById("aiModelsBody");
  try {
    const res = await fetch(`${API_BASE}/admin/ai-models`, { headers: authHeaders() });
    if (!res.ok) return;
    const models = await res.json();
    body.innerHTML = "";
    for (const model of models) {
      const row = document.createElement("tr");
      const statusCell = model.isActive
        ? `<span class="badge ok">active</span>`
        : `<button data-filename="${model.filename}" class="select-model-btn">Select</button>`;
      row.innerHTML = `<td>${model.filename}</td><td>${fmtBytes(model.sizeBytes)}</td><td>${
        model.isActive ? "active" : ""
      }</td><td>${model.isActive ? "" : statusCell}</td>`;
      body.appendChild(row);
    }
    body.querySelectorAll(".select-model-btn").forEach((btn) => {
      btn.addEventListener("click", () => selectAiModel(btn.dataset.filename));
    });
  } catch (err) {
    body.innerHTML = "<tr><td colspan='4'>Could not reach the backend.</td></tr>";
  }
}

async function selectAiModel(filename) {
  const errorEl = document.getElementById("aiModelSelectError");
  errorEl.textContent = "";
  try {
    const res = await fetch(`${API_BASE}/admin/ai-models/select`, {
      method: "POST",
      headers: authHeaders({ "Content-Type": "application/json" }),
      body: JSON.stringify({ filename }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      errorEl.textContent = body.error || "Could not select model";
      return;
    }
    errorEl.textContent = "";
    await loadAiModels();
  } catch (err) {
    errorEl.textContent = "Could not reach the backend.";
  }
}

async function loadBackups() {
  const body = document.getElementById("backupsBody");
  try {
    const res = await fetch(`${API_BASE}/admin/backups`, { headers: authHeaders() });
    if (!res.ok) return;
    const backups = await res.json();
    body.innerHTML = "";
    for (const backup of backups) {
      const row = document.createElement("tr");
      row.innerHTML = `<td>${backup.filename}</td><td>${fmtBytes(backup.sizeBytes)}</td><td>${new Date(
        backup.createdAt,
      ).toLocaleString()}</td><td><button data-filename="${backup.filename}" class="restore-backup-btn">Restore</button></td>`;
      body.appendChild(row);
    }
    body.querySelectorAll(".restore-backup-btn").forEach((btn) => {
      btn.addEventListener("click", () => restoreBackup(btn.dataset.filename));
    });
  } catch (err) {
    body.innerHTML = "<tr><td colspan='4'>Could not reach the backend.</td></tr>";
  }
}

async function createBackupNow() {
  const errorEl = document.getElementById("backupError");
  errorEl.textContent = "";
  try {
    const res = await fetch(`${API_BASE}/admin/backups`, {
      method: "POST",
      headers: authHeaders(),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      errorEl.textContent = body.error || "Could not create backup";
      return;
    }
    await loadBackups();
  } catch (err) {
    errorEl.textContent = "Could not reach the backend.";
  }
}

async function restoreBackup(filename) {
  const errorEl = document.getElementById("backupError");
  errorEl.textContent = "";
  if (!confirm(`Restore "${filename}"? This overwrites all data added since that backup.`)) {
    return;
  }
  try {
    const res = await fetch(
      `${API_BASE}/admin/backups/${encodeURIComponent(filename)}/restore`,
      { method: "POST", headers: authHeaders() },
    );
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      errorEl.textContent = body.error || "Could not restore backup";
      return;
    }
    errorEl.textContent = "Restored. Some cached data may be stale until you log in again.";
  } catch (err) {
    errorEl.textContent = "Could not reach the backend.";
  }
}

async function createAccount() {
  const email = document.getElementById("newUserEmail").value.trim();
  const displayName = document.getElementById("newUserName").value.trim();
  const password = document.getElementById("newUserPassword").value;
  const role = document.getElementById("newUserRole").value;
  const errorEl = document.getElementById("createUserError");
  const successEl = document.getElementById("createUserSuccess");
  errorEl.textContent = "";
  successEl.textContent = "";

  try {
    const res = await fetch(`${API_BASE}/admin/users`, {
      method: "POST",
      headers: authHeaders({ "Content-Type": "application/json" }),
      body: JSON.stringify({ email, displayName, password, role }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      errorEl.textContent = body.error || "Could not create account";
      return;
    }
    document.getElementById("newUserEmail").value = "";
    document.getElementById("newUserName").value = "";
    document.getElementById("newUserPassword").value = "";
    successEl.textContent = `Created ${role} account for ${email}.`;
  } catch (err) {
    errorEl.textContent = "Could not reach the backend.";
  }
}

document.getElementById("adminLogoutBtn").addEventListener("click", logout);
document.getElementById("refreshHealthBtn").addEventListener("click", loadSystemHealth);
document.getElementById("createBackupBtn").addEventListener("click", createBackupNow);
document.getElementById("createUserBtn").addEventListener("click", createAccount);

checkHealth();
setInterval(checkHealth, 5000);
