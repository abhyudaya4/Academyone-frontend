// ===============================
// 🚀 CONFIGURATION (IMPORTANT)
// ===============================

// BACKEND ROUTE THAT PROXIES TO N8N
// Change this before going live!
const BACKEND_CHAT_URL = "https://academyone-backend.onrender.com/api/chat/chatbot";

// If later you integrate history in backend, set here


// ===============================
// 🌐 DOM ELEMENTS
// ===============================
const chatContainer = document.getElementById('chat-container');
const userInput = document.getElementById('user-input');
const sendBtn = document.getElementById('send-btn');
const typingIndicator = document.getElementById('typing-indicator');
const historySidebar = document.getElementById('history-sidebar');
const sidebarOverlay = document.getElementById('sidebar-overlay');
const historyList = document.getElementById('history-list');


// ===============================
// 🧠 SESSION STATE
// ===============================
let currentSessionId = generateSessionId();

function generateSessionId() {
  return 'sess_' + Math.random().toString(36).substring(2, 10);
}


// ===============================
// 📚 SIDEBAR FUNCTIONS
// ===============================
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

// ===============================
// 💬 CHAT FUNCTIONS
// ===============================
function scrollToBottom() {
  chatContainer.scrollTop = chatContainer.scrollHeight;
}

function appendMessage(sender, text) {
  const isAi = sender === 'ai';
  const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  // 1. Process Text: If AI, parse Markdown. If User, escape HTML to prevent errors.
  let formattedContent;
  if (isAi) {
    // Parse Markdown -> Sanitize HTML -> Return safe HTML
    const rawHtml = marked.parse(text);
    formattedContent = DOMPurify.sanitize(rawHtml);
  } else {
    // For user, simply replace newlines with <br> and escape HTML logic
    formattedContent = text.replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\n/g, "<br>");
  }

  const avatarIcon = isAi
    ? '<path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/>'
    : '<path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>';

  // 2. Build HTML
  // Added 'markdown-content' class specifically to AI bubbles
  const msgHTML = `
    <div class="message-wrapper message-${isAi ? 'ai' : 'user'} animate-fade-in">
      <div class="message-content-wrapper">
        <div class="message-avatar avatar-${isAi ? 'ai' : 'user'}">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            ${avatarIcon}
          </svg>
        </div>
        <div class="message-bubble-wrapper">
          <div class="message-bubble message-bubble-${isAi ? 'ai' : 'user'} ${isAi ? 'markdown-content' : ''}">
            ${formattedContent}
          </div>
          <span class="message-time">${timestamp}</span>
        </div>
      </div>
    </div>`;

  chatContainer.insertAdjacentHTML('beforeend', msgHTML);

  // 3. Highlight Code Blocks (Only for AI)
  if (isAi) {
    const lastMessage = chatContainer.lastElementChild;
    const codeBlocks = lastMessage.querySelectorAll('pre code');
    codeBlocks.forEach((block) => {
      hljs.highlightElement(block);
    });
  }

  scrollToBottom();
}


// ===============================
// 🚀 SEND MESSAGE VIA BACKEND
// ===============================
async function sendMessage(text) {
  if (!text.trim()) return;

  appendMessage('user', text);
  userInput.value = '';
  typingIndicator.classList.add('visible');
  scrollToBottom();

  try {
    const token = localStorage.getItem("token")
    const response = await fetch(BACKEND_CHAT_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json","Authorization": `Bearer ${token}` },
      body: JSON.stringify({
        message: text,
        sessionId: currentSessionId
      })
    });

    const result = await response.json();
    typingIndicator.classList.remove('visible');

    const reply = result.reply || result.output || result.text ;
    appendMessage('ai', reply);

  } catch (error) {
    console.error("Chat Error:", error);
    typingIndicator.classList.remove('visible');
    appendMessage('ai', "⚠ Error connecting to server.");
  }
}


// ===============================
// 📝 AUTO-RESIZE TEXTAREA
// ===============================
userInput.addEventListener('input', function () {
  this.style.height = 'auto';
  this.style.height = Math.min(this.scrollHeight, 128) + 'px';
});


// ===============================
// 🎯 EVENT LISTENERS
// ===============================
sendBtn.addEventListener('click', () => sendMessage(userInput.value));

userInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    sendMessage(userInput.value);
  }
});


// ===============================
// 🟢 INIT
// ===============================
document.getElementById('init-timestamp').innerText = new Date().toLocaleTimeString([], {
  hour: '2-digit',
  minute: '2-digit'
});

// loadChatHistory();
