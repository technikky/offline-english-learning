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

  if (user.role === "admin") {
    document.getElementById("adminView").classList.remove("hidden");
    document.getElementById("adminView").style.display = "flex";
    document.getElementById("adminProfileName").textContent = user.displayName;
    document.getElementById("adminProfileRole").textContent = user.role;
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
    return;
  }

  document.getElementById("appView").classList.remove("hidden");
  document.getElementById("appView").style.display = "flex";
  document.getElementById("profileName").textContent = user.displayName;
  document.getElementById("profileRole").textContent = user.role;
  document.getElementById("profileEmail").textContent = user.email;
  renderAvatar();
  loadNotebook();
  loadStudentAnalytics();
  loadGrammarTopics();
  loadReadingPassages();
}

function showLoggedOut() {
  accessToken = null;
  currentConversationId = null;
  currentClassId = null;
  document.getElementById("appView").classList.add("hidden");
  document.getElementById("appView").style.display = "none";
  document.getElementById("teacherView").classList.add("hidden");
  document.getElementById("teacherView").style.display = "none";
  document.getElementById("adminView").classList.add("hidden");
  document.getElementById("adminView").style.display = "none";
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
async function speakAsAvatar(text) {
  const autoSpeak = document.getElementById("autoSpeakToggle");
  if (!autoSpeak || !autoSpeak.checked || !text || !text.trim()) return;

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
  input.disabled = true;
  document.getElementById("sendBtn").disabled = true;

  appendBubble("user", content);
  const assistantBubble = appendBubble("assistant", "");

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
      return;
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let displayedText = "";

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
    await speakAsAvatar(displayedText);
  } catch (err) {
    assistantBubble.textContent = "(error contacting the AI service)";
  } finally {
    input.disabled = false;
    document.getElementById("sendBtn").disabled = false;
    input.focus();
    if (currentConversationId) loadRecommendations(currentConversationId);
  }
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
  } catch (err) {
    resultEl.textContent = "Could not reach the backend.";
  }
}

document.getElementById("micBtn").addEventListener("click", toggleMicRecording);
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
    conversation: { btn: "tabConversationBtn", panel: "chatPanel" },
    grammar: { btn: "tabGrammarBtn", panel: "grammarPanel" },
    reading: { btn: "tabReadingBtn", panel: "readingPanel" },
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

    document.getElementById("readingPassageTitle").textContent = `${passage.title} (${passage.cefrLevel})`;
    document.getElementById("readingPassageContent").textContent = passage.content;
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
