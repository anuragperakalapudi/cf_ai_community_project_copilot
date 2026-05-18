const API_URL = "https://backend.perakalapudianurag.workers.dev/api/chat";

const chatWindow = document.getElementById("chat-window");
const messageInput = document.getElementById("message-input");
const titleInput = document.getElementById("title-input");
const summaryInput = document.getElementById("summary-input");
const sendBtn = document.getElementById("send-btn");
const composerForm = document.getElementById("composer");
const statusPill = document.getElementById("status-pill");
const statusText = document.getElementById("status-text");
const newProjectBtn = document.getElementById("new-project");
const applySummaryBtn = document.getElementById("apply-summary");

let projectId = localStorage.getItem("projectId") || crypto.randomUUID();
localStorage.setItem("projectId", projectId);

let messages = [];

function nowTime() {
  const d = new Date();
  return d.getHours().toString().padStart(2, "0") + ":" + d.getMinutes().toString().padStart(2, "0");
}

function setStatus(mode) {
  const dot = statusPill.querySelector(".status-dot");
  if (!dot) return;
  dot.classList.remove("status-ready", "status-busy");
  if (mode === "busy") {
    dot.classList.add("status-busy");
    statusText.textContent = "Thinking...";
  } else {
    dot.classList.add("status-ready");
    statusText.textContent = "Ready";
  }
}

function buildMessageRow(msg) {
  const row = document.createElement("div");
  row.className = `message-row ${msg.role === "user" ? "user" : "assistant"}`;

  const bubble = document.createElement("div");
  bubble.className = `message-bubble ${msg.role}`;

  const meta = document.createElement("div");
  meta.className = "message-meta";

  const roleSpan = document.createElement("span");
  roleSpan.className = "message-role";
  roleSpan.textContent = msg.role === "user" ? "You" : "Copilot";

  const timeSpan = document.createElement("span");
  timeSpan.className = "message-time";
  timeSpan.textContent = msg.time || "";

  meta.appendChild(roleSpan);
  meta.appendChild(timeSpan);

  const body = document.createElement("div");
  if (msg.role === "assistant") {
    body.innerHTML = marked.parse(msg.content);
  } else {
    body.innerText = msg.content;
  }

  bubble.appendChild(meta);
  bubble.appendChild(body);
  row.appendChild(bubble);
  return row;
}

function renderEmptyState() {
  chatWindow.innerHTML = "";
  const empty = document.createElement("div");
  empty.className = "chat-window-empty";

  const p = document.createElement("p");
  p.textContent = "Describe your project to get a concrete plan with schedule, roles, tools and a rough budget.";

  const hint = document.createElement("span");
  hint.className = "empty-hint";
  hint.textContent = "Try: \"Trail renovation at Patapsco Park, 20 volunteers, one Saturday in June\"";

  empty.appendChild(p);
  empty.appendChild(hint);
  chatWindow.appendChild(empty);
}

function renderMessages() {
  chatWindow.innerHTML = "";
  if (!messages.length) {
    renderEmptyState();
    return;
  }
  const fragment = document.createDocumentFragment();
  messages.forEach((msg) => fragment.appendChild(buildMessageRow(msg)));
  chatWindow.appendChild(fragment);
  chatWindow.scrollTop = chatWindow.scrollHeight;
}

function appendMessage(msg) {
  const empty = chatWindow.querySelector(".chat-window-empty");
  if (empty) empty.remove();
  chatWindow.appendChild(buildMessageRow(msg));
  chatWindow.scrollTop = chatWindow.scrollHeight;
}

function addLocalMessage(role, content) {
  const msg = { role, content, time: nowTime() };
  messages.push(msg);
  appendMessage(msg);
}

async function sendMessage(text) {
  const trimmed = text.trim();
  if (!trimmed) return;

  addLocalMessage("user", trimmed);

  setStatus("busy");
  sendBtn.disabled = true;
  messageInput.disabled = true;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000);

  try {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        projectId,
        projectTitle: titleInput.value || "Untitled Project",
        message: trimmed,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();

    if (data.state && Array.isArray(data.state.history)) {
      // Merge backend history while preserving local timestamps
      messages = data.state.history.map((m, i) => ({
        role: m.role,
        content: m.content,
        time: messages[i]?.time || nowTime(),
      }));
      renderMessages();
    } else if (data.reply) {
      addLocalMessage("assistant", data.reply);
    }
  } catch (err) {
    clearTimeout(timeoutId);
    const reply =
      err.name === "AbortError"
        ? "This is taking longer than expected. Please try again."
        : "I hit an error talking to the backend. You can try again in a moment.";
    addLocalMessage("assistant", reply);
    console.error(err);
  } finally {
    setStatus("ready");
    sendBtn.disabled = false;
    messageInput.disabled = false;
    messageInput.focus();
  }
}

// Event wiring

composerForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const text = messageInput.value;
  messageInput.value = "";
  sendMessage(text);
});

messageInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    composerForm.dispatchEvent(new Event("submit"));
  }
});

newProjectBtn.addEventListener("click", () => {
  projectId = crypto.randomUUID();
  localStorage.setItem("projectId", projectId);
  messages = [];
  renderMessages();
});

applySummaryBtn.addEventListener("click", () => {
  const summary = summaryInput.value.trim();
  if (!summary) return;
  messageInput.value = summary;
  messageInput.focus();
});

// Delegated listener for all quick-prompt chips — auto-sends immediately
document.querySelector(".chips").addEventListener("click", (e) => {
  const btn = e.target.closest(".quick-prompt");
  if (!btn) return;
  const prompt = btn.getAttribute("data-prompt");
  if (!prompt) return;
  messageInput.value = "";
  sendMessage(prompt);
});

// Initial render
renderEmptyState();
setStatus("ready");
