const API_BASE = "http://127.0.0.1:4310";

let accessToken = null;
let currentConversationId = null;

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
  document.getElementById("appView").classList.remove("hidden");
  document.getElementById("appView").style.display = "flex";
  document.getElementById("profileName").textContent = user.displayName;
  document.getElementById("profileRole").textContent = user.role;
  document.getElementById("profileEmail").textContent = user.email;
}

function showLoggedOut() {
  accessToken = null;
  currentConversationId = null;
  document.getElementById("appView").classList.add("hidden");
  document.getElementById("appView").style.display = "none";
  document.getElementById("authScreen").classList.remove("hidden");
  document.getElementById("email").value = "";
  document.getElementById("password").value = "";
  document.getElementById("chatLog").innerHTML = "";
  document.getElementById("messageInput").disabled = true;
  document.getElementById("sendBtn").disabled = true;
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
  } catch (err) {
    assistantBubble.textContent = "(error contacting the AI service)";
  } finally {
    input.disabled = false;
    document.getElementById("sendBtn").disabled = false;
    input.focus();
  }
}

document.getElementById("loginBtn").addEventListener("click", login);
document.getElementById("logoutBtn").addEventListener("click", logout);
document.getElementById("password").addEventListener("keydown", (e) => {
  if (e.key === "Enter") login();
});
document.getElementById("startConversationBtn").addEventListener("click", startConversation);
document.getElementById("sendBtn").addEventListener("click", sendMessage);
document.getElementById("messageInput").addEventListener("keydown", (e) => {
  if (e.key === "Enter") sendMessage();
});

checkHealth();
setInterval(checkHealth, 5000);
