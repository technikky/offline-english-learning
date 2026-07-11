const API_BASE = "http://127.0.0.1:4310";

let accessToken = null;

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
  document.getElementById("loginView").classList.add("hidden");
  document.getElementById("profileView").classList.remove("hidden");
  document.getElementById("profileName").textContent = user.displayName;
  document.getElementById("profileRole").textContent = user.role;
  document.getElementById("profileEmail").textContent = user.email;
}

function showLoggedOut() {
  accessToken = null;
  document.getElementById("profileView").classList.add("hidden");
  document.getElementById("loginView").classList.remove("hidden");
  document.getElementById("email").value = "";
  document.getElementById("password").value = "";
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

document.getElementById("loginBtn").addEventListener("click", login);
document.getElementById("logoutBtn").addEventListener("click", logout);
document.getElementById("password").addEventListener("keydown", (e) => {
  if (e.key === "Enter") login();
});

checkHealth();
setInterval(checkHealth, 5000);
