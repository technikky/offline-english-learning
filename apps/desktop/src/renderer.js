const BACKEND_URL = "http://127.0.0.1:4310/health";

async function checkHealth() {
  const el = document.getElementById("status");
  try {
    const res = await fetch(BACKEND_URL);
    const data = await res.json();
    el.textContent = `Backend OK — db connected: ${data.dbConnected} (${data.timestamp})`;
    el.className = "status ok";
  } catch (err) {
    el.textContent = "Backend unreachable — is start-dev running?";
    el.className = "status fail";
  }
}

checkHealth();
setInterval(checkHealth, 5000);
