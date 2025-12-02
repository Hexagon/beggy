// Beggy - Messages Page JavaScript

// State
let currentUser = null
let currentConversationId = null

// Initialize
document.addEventListener("DOMContentLoaded", () => {
  checkAuth()
  setupEventListeners()
  
  // Check for conversation ID in URL
  const urlParams = new URLSearchParams(window.location.search)
  const convId = urlParams.get("id")
  if (convId) {
    openChat(convId)
  }
})

// Mobile chat navigation
function closeChatOnMobile() {
  const chatColumn = document.getElementById("chatColumn")
  const conversationsColumn = document.getElementById("conversationsColumn")
  
  // Hide chat and show conversations on mobile
  if (window.innerWidth < 1024) {
    chatColumn.classList.add("hidden")
    chatColumn.classList.remove("flex")
    conversationsColumn.classList.remove("hidden")
  }
  
  // Update URL to remove conversation ID
  const url = new URL(window.location)
  url.searchParams.delete("id")
  window.history.pushState({}, "", url)
  
  currentConversationId = null
}

// Event Listeners
function setupEventListeners() {
  // Login
  document.getElementById("loginBtn").addEventListener("click", (e) => {
    e.preventDefault()
    openModal("loginModal")
  })

  document.getElementById("loginForm").addEventListener("submit", handleLogin)

  // Register
  document.getElementById("showRegister").addEventListener("click", (e) => {
    e.preventDefault()
    closeModal("loginModal")
    openModal("registerModal")
  })

  document.getElementById("showLogin").addEventListener("click", (e) => {
    e.preventDefault()
    closeModal("registerModal")
    openModal("loginModal")
  })

  document.getElementById("registerForm").addEventListener("submit", handleRegister)

  // Logout
  document.getElementById("logoutBtn").addEventListener("click", handleLogout)

  // Chat form
  document.getElementById("chatForm").addEventListener("submit", handleSendMessage)

  // Close modals on outside click
  window.addEventListener("click", (e) => {
    if (e.target.classList.contains("modal")) {
      e.target.classList.add("hidden")
      e.target.classList.remove("block")
    }
  })
}

// Auth functions
async function checkAuth() {
  try {
    const res = await fetch("/api/auth/me")
    if (res.ok) {
      currentUser = await res.json()
      updateAuthUI()
      document.getElementById("loginOverlay").classList.add("hidden")
      loadConversations()
    } else {
      document.getElementById("loginOverlay").classList.remove("hidden")
    }
  } catch {
    document.getElementById("loginOverlay").classList.remove("hidden")
  }
}

function updateAuthUI() {
  const loggedOutNav = document.querySelector(".nav:not(.nav-logged-in)")
  const loggedInNav = document.querySelector(".nav-logged-in")
  const loggedOutNavMobile = document.querySelector(".nav-mobile")
  const loggedInNavMobile = document.querySelector(".nav-mobile-logged-in")

  if (currentUser) {
    // Show logged-in navigation, hide logged-out navigation
    if (loggedOutNav) {
      loggedOutNav.classList.add("hidden")
      loggedOutNav.classList.add("md:hidden")
      loggedOutNav.classList.remove("md:flex")
    }
    if (loggedInNav) {
      loggedInNav.classList.remove("hidden")
      loggedInNav.classList.remove("md:hidden")
      loggedInNav.classList.add("md:flex")
    }
    
    if (loggedOutNavMobile) {
      loggedOutNavMobile.classList.add("hidden")
      loggedOutNavMobile.classList.remove("flex")
    }
    if (loggedInNavMobile) {
      loggedInNavMobile.classList.remove("hidden")
      loggedInNavMobile.classList.add("flex")
    }
  } else {
    // Show logged-out navigation, hide logged-in navigation
    if (loggedOutNav) {
      loggedOutNav.classList.remove("hidden")
      loggedOutNav.classList.remove("md:hidden")
      loggedOutNav.classList.add("md:flex")
    }
    if (loggedInNav) {
      loggedInNav.classList.add("hidden")
      loggedInNav.classList.add("md:hidden")
      loggedInNav.classList.remove("md:flex")
    }
    
    if (loggedOutNavMobile) {
      loggedOutNavMobile.classList.remove("hidden")
      loggedOutNavMobile.classList.add("flex")
    }
    if (loggedInNavMobile) {
      loggedInNavMobile.classList.add("hidden")
      loggedInNavMobile.classList.remove("flex")
    }
  }
}
      loggedInNavMobile.classList.add("hidden")
      loggedInNavMobile.classList.remove("flex")
    }
  }
}

async function handleLogin(e) {
  e.preventDefault()
  const email = document.getElementById("loginEmail").value
  const password = document.getElementById("loginPassword").value

  try {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    })

    const data = await res.json()

    if (res.ok) {
      closeModal("loginModal")
      document.getElementById("loginForm").reset()
      await checkAuth()
      showAlert("Välkommen tillbaka!", "success")
    } else {
      showAlert(data.error, "error")
    }
  } catch {
    showAlert("Något gick fel", "error")
  }
}

async function handleRegister(e) {
  e.preventDefault()
  const username = document.getElementById("regUsername").value
  const email = document.getElementById("regEmail").value
  const password = document.getElementById("regPassword").value

  try {
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, email, password }),
    })

    const data = await res.json()

    if (res.ok) {
      closeModal("registerModal")
      document.getElementById("registerForm").reset()
      openModal("loginModal")
      showAlert("Konto skapat! Logga in för att fortsätta.", "success")
    } else {
      showAlert(data.error, "error")
    }
  } catch {
    showAlert("Något gick fel", "error")
  }
}

async function handleLogout(e) {
  e.preventDefault()
  try {
    await fetch("/api/auth/logout", { method: "POST" })
    window.location.href = "/"
  } catch {
    showAlert("Något gick fel", "error")
  }
}

// Conversations
async function loadConversations() {
  try {
    const res = await fetch("/api/conversations")
    const data = await res.json()

    const list = document.getElementById("conversationsList")

    if (!data.conversations || data.conversations.length === 0) {
      list.innerHTML = "<p class='text-stone-500 text-center p-4'>Du har inga meddelanden ännu.</p>"
      return
    }

    list.innerHTML = data.conversations
      .map(
        (conv) => `
      <div 
        class="p-4 cursor-pointer hover:bg-stone-50 transition-colors ${currentConversationId == conv.id ? 'bg-stone-100 border-l-4 border-primary' : 'border-l-4 border-transparent'}" 
        onclick="openChat(${conv.id})"
      >
        <div class="flex justify-between items-start mb-1">
          <strong class="text-dark truncate pr-2">${escapeHtml(conv.ad_title)}</strong>
          <span class="text-xs text-stone-400 whitespace-nowrap">${conv.last_message_at ? formatRelativeTime(conv.last_message_at) : ''}</span>
        </div>
        <div class="text-sm text-stone-600 mb-1">
          ${conv.is_buyer ? "Säljare: " + escapeHtml(conv.seller_username) : "Köpare: " + escapeHtml(conv.buyer_username)}
        </div>
        <div class="flex justify-between items-center">
           <span class="text-xs text-stone-400">${conv.message_count} meddelande${conv.message_count !== 1 ? "n" : ""}</span>
           ${conv.expires_at ? `<span class="text-xs text-yellow-600" title="Utgår: ${formatDate(conv.expires_at)}">⚠️ Utgår</span>` : ""}
        </div>
      </div>
    `
      )
      .join("")
  } catch {
    showAlert("Kunde inte ladda meddelanden", "error")
  }
}

async function openChat(conversationId) {
  currentConversationId = conversationId
  
  // Update URL without reloading
  const url = new URL(window.location)
  url.searchParams.set("id", conversationId)
  window.history.pushState({}, "", url)

  // UI updates
  document.getElementById("chatEmptyState").classList.add("hidden")
  document.getElementById("chatContainer").classList.add("hidden")
  document.getElementById("chatLoading").classList.remove("hidden")
  
  // Mobile: Show chat column and hide conversations column
  const chatColumn = document.getElementById("chatColumn")
  const conversationsColumn = document.getElementById("conversationsColumn")
  chatColumn.classList.remove("hidden")
  chatColumn.classList.add("flex")
  if (window.innerWidth < 1024) { // lg breakpoint
    conversationsColumn.classList.add("hidden")
  }
  
  // Refresh list to update active state
  loadConversations()

  try {
    const res = await fetch(`/api/conversations/${conversationId}/messages`)
    const data = await res.json()

    document.getElementById("chatLoading").classList.add("hidden")
    document.getElementById("chatContainer").classList.remove("hidden")

    // Update header
    const header = document.getElementById("chatHeader")
    header.innerHTML = `
      <button
        id="mobileBackBtn"
        class="lg:hidden flex items-center gap-2 text-stone-600 hover:text-primary"
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5">
          <path stroke-linecap="round" stroke-linejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
        </svg>
        Tillbaka
      </button>
      <div>
        <h2 class="text-lg font-semibold text-dark">
            <a href="/annons/${data.conversation.ad_id}" class="hover:underline">${escapeHtml(data.conversation.ad_title)}</a>
        </h2>
        <p class="text-stone-500 text-sm">
          ${data.conversation.is_buyer ? "Säljare: " + escapeHtml(data.conversation.seller_username) : "Köpare: " + escapeHtml(data.conversation.buyer_username)}
        </p>
      </div>
      ${data.conversation.expires_at ? `<div class="text-xs text-yellow-600 bg-yellow-50 px-2 py-1 rounded border border-yellow-200">⚠️ Utgår: ${formatDate(data.conversation.expires_at)}</div>` : ""}
    `
    
    // Add back button handler
    const backBtn = document.getElementById("mobileBackBtn")
    if (backBtn) {
      backBtn.addEventListener("click", closeChatOnMobile)
    }

    // Update messages
    const messagesDiv = document.getElementById("chatMessages")
    if (data.messages.length === 0) {
      messagesDiv.innerHTML = '<p class="text-stone-400 text-center py-8">Inga meddelanden ännu. Skriv något för att starta konversationen!</p>'
    } else {
      messagesDiv.innerHTML = data.messages
        .map(
          (msg) => `
        <div class="flex flex-col ${msg.is_own ? "items-end" : "items-start"}">
          <div class="max-w-[80%] px-4 py-2 rounded-lg ${msg.is_own ? "bg-primary text-white rounded-br-none" : "bg-stone-100 text-dark rounded-bl-none"}">
            <p class="text-sm whitespace-pre-wrap">${escapeHtml(msg.content)}</p>
          </div>
          <span class="text-xs text-stone-400 mt-1 px-1">${formatDateTime(msg.created_at)}</span>
        </div>
      `
        )
        .join("")
      
      // Scroll to bottom
      messagesDiv.scrollTop = messagesDiv.scrollHeight
    }
  } catch {
    document.getElementById("chatLoading").classList.add("hidden")
    showAlert("Kunde inte ladda konversationen", "error")
  }
}

async function handleSendMessage(e) {
  e.preventDefault()

  const input = document.getElementById("chatInput")
  const content = input.value.trim()

  if (!content) return

  try {
    const res = await fetch(`/api/conversations/${currentConversationId}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content }),
    })

    const data = await res.json()

    if (res.ok) {
      input.value = ""
      // Reload messages (optimized: could just append, but reloading ensures sync)
      await openChat(currentConversationId)
    } else {
      showAlert(data.error, "error")
    }
  } catch {
    showAlert("Kunde inte skicka meddelande", "error")
  }
}

// Modal helpers
function openModal(id) {
  const modal = document.getElementById(id)
  modal.classList.remove("hidden")
  modal.classList.add("block")
}

function closeModal(id) {
  const modal = document.getElementById(id)
  modal.classList.add("hidden")
  modal.classList.remove("block")
}

// Utility functions
function escapeHtml(text) {
  if (!text) return ""
  const div = document.createElement("div")
  div.textContent = text
  return div.innerHTML
}

function formatDate(dateString) {
  return new Intl.DateTimeFormat("sv-SE", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(dateString))
}

function formatDateTime(dateString) {
  return new Intl.DateTimeFormat("sv-SE", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(dateString))
}

function formatRelativeTime(dateString) {
  const now = new Date()
  const date = new Date(dateString)
  const diffMs = now - date
  const diffSec = Math.floor(diffMs / 1000)
  const diffMin = Math.floor(diffSec / 60)
  const diffHour = Math.floor(diffMin / 60)
  const diffDay = Math.floor(diffHour / 24)

  if (diffMin < 1) return "just nu"
  if (diffMin < 60) return `${diffMin}m`
  if (diffHour < 24) return `${diffHour}h`
  if (diffDay < 7) return `${diffDay}d`
  return formatDate(dateString)
}

function showAlert(message, type) {
  // Remove existing alerts
  document.querySelectorAll(".alert").forEach((el) => el.remove())

  const alert = document.createElement("div")
  alert.className = `alert fixed top-20 right-5 z-[1001] min-w-[250px] p-4 rounded shadow-lg ${type === "success" ? "bg-green-100 text-green-800 border border-green-200" : "bg-red-100 text-red-800 border border-red-200"}`
  alert.textContent = message

  document.body.appendChild(alert)

  setTimeout(() => {
    alert.remove()
  }, 3000)
}

// Make functions available globally
window.openModal = openModal
window.closeModal = closeModal
window.openChat = openChat
