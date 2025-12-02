// ===== CONFIGURATION =====
const N8N_CHAT_URL = "http://localhost:5678/webhook/a92b422b-c7af-447e-99bd-00eef6366260";
const N8N_HISTORY_URL = "http://localhost:5678/webhook/805b513b-cbac-4e24-96e0-efdeb2717c0b";

// ===== DOM ELEMENTS =====
const chatContainer = document.getElementById('chat-container');
const userInput = document.getElementById('user-input');
const sendBtn = document.getElementById('send-btn');
const typingIndicator = document.getElementById('typing-indicator');
const historySidebar = document.getElementById('history-sidebar');
const sidebarOverlay = document.getElementById('sidebar-overlay');
const historyList = document.getElementById('history-list');

// ===== STATE =====
let currentSessionId = generateSessionId();

function generateSessionId() {
  return 'sess_' + Math.random().toString(36).substr(2, 9);
}

// ===== SIDEBAR FUNCTIONS =====
function toggleSidebar() {
  const isClosed = !historySidebar.classList.contains('open');
  
  if (isClosed) {
    historySidebar.classList.add('open');
    sidebarOverlay.classList.add('visible');
    loadChatHistory();
  } else {
    historySidebar.classList.remove('open');
    sidebarOverlay.classList.remove('visible');
  }
}

function startNewChat() {
  currentSessionId = generateSessionId();
  document.getElementById('current-session-label').innerText = 'New Session';
  chatContainer.innerHTML = '';
  appendMessage('ai', "Hi! New session started. What's on your mind?");
  toggleSidebar();
}

async function loadChatHistory() {
  historyList.innerHTML = '<div class="history-loading">Fetching history...</div>';

  try {
    const response = await fetch(N8N_HISTORY_URL, { method: 'GET' });

    if (!response.ok) {
      throw new Error(`Server error: ${response.status}`);
    }

    const text = await response.text();

    if (!text) {
      historyList.innerHTML = '<div class="history-loading">Feature coming soon</div>';
      return;
    }

    const sessions = JSON.parse(text);
    renderHistoryList(sessions);
  } catch (error) {
    console.error('History Error:', error);
    historyList.innerHTML = '<div class="history-loading">Feature coming soon</div>';
  }
}

function renderHistoryList(sessions) {
  historyList.innerHTML = '';
  
  if (sessions.length === 0) {
    historyList.innerHTML = '<div class="history-loading">No history found.</div>';
    return;
  }

  sessions.forEach(session => {
    const isActive = session.sessionId === currentSessionId;
    const btn = document.createElement('button');
    btn.className = `history-item ${isActive ? 'active' : ''}`;
    btn.innerHTML = `
      <span class="history-item-title">${session.title}</span>
      <span class="history-item-date">${session.date}</span>
    `;
    btn.onclick = () => loadSession(session.sessionId, session.title);
    historyList.appendChild(btn);
  });
}

async function loadSession(sessionId, title) {
  currentSessionId = sessionId;
  document.getElementById('current-session-label').innerText = title;
  toggleSidebar();

  chatContainer.innerHTML = `
    <div style="display: flex; height: 100%; flex-direction: column; align-items: center; justify-content: center; gap: 1rem;">
      <svg class="animate-spin" xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color: var(--cyan);">
        <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
      </svg>
      <p style="font-size: 0.875rem; color: var(--muted-foreground);">Restoring memory...</p>
    </div>`;

  try {
    const response = await fetch(`${N8N_SESSION_URL}?sessionId=${sessionId}`, {
      method: 'GET'
    });

    const historyArray = await response.json();
    chatContainer.innerHTML = '';

    if (!historyArray || historyArray.length === 0) {
      chatContainer.innerHTML = '<div style="text-align: center; color: var(--muted-foreground); margin-top: 2rem;">This conversation is empty.</div>';
      return;
    }

    historyArray.forEach(msg => {
      const sender = msg.type === 'human' || msg.id?.includes('HumanMessage') ? 'user' : 'ai';
      appendMessage(sender, msg.content);
    });
  } catch (error) {
    console.error('Load Error:', error);
    chatContainer.innerHTML = '<div style="text-align: center; color: var(--pink-accent); margin-top: 2rem;">Failed to load conversation.</div>';
  }
}

// ===== CHAT FUNCTIONS =====
function scrollToBottom() {
  chatContainer.scrollTop = chatContainer.scrollHeight;
}

function appendMessage(sender, text) {
  const isAi = sender === 'ai';
  const timestamp = new Date().toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit'
  });

  const avatarIcon = isAi 
    ? '<path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/>'
    : '<path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>';

  const msgHTML = `
    <div class="message-wrapper message-${isAi ? 'ai' : 'user'} animate-fade-in">
      <div class="message-content-wrapper">
        <div class="message-avatar avatar-${isAi ? 'ai' : 'user'}">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            ${avatarIcon}
          </svg>
        </div>
        <div class="message-bubble-wrapper">
          <div class="message-bubble message-bubble-${isAi ? 'ai' : 'user'}">
            ${text}
          </div>
          <span class="message-time">${timestamp}</span>
        </div>
      </div>
    </div>`;

  chatContainer.insertAdjacentHTML('beforeend', msgHTML);
  scrollToBottom();
}

async function sendMessage(text) {
  if (!text.trim()) return;
  
  appendMessage('user', text);
  userInput.value = '';
  typingIndicator.classList.add('visible');
  scrollToBottom();

  try {
    const response = await fetch(N8N_CHAT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: text,
        sessionId: currentSessionId
      })
    });
    
    const result = await response.json();
    typingIndicator.classList.remove('visible');

    const reply = result.output || result.text || "I didn't get a response.";
    appendMessage('ai', reply);
  } catch (e) {
    console.error(e);
    typingIndicator.classList.remove('visible');
    appendMessage('ai', 'Error connecting to AI.');
  }
}

// ===== AUTO-RESIZE TEXTAREA =====
userInput.addEventListener('input', function() {
  this.style.height = 'auto';
  this.style.height = Math.min(this.scrollHeight, 128) + 'px';
});

// ===== EVENT LISTENERS =====
sendBtn.addEventListener('click', () => sendMessage(userInput.value));
userInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    sendMessage(userInput.value);
  }
});

// ===== INITIALIZATION =====
document.getElementById('init-timestamp').innerText = new Date().toLocaleTimeString([], {
  hour: '2-digit',
  minute: '2-digit'
});


loadChatHistory();
