// Beggy - Settings Page JavaScript

// State
let currentUser = null
let currentConversationId = null

// Initialize
document.addEventListener("DOMContentLoaded", () => {
  checkAuth()
  setupEventListeners()
})

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

  // Messages - only add listener if element exists (not present on all pages)
  const messagesBtn = document.getElementById("messagesBtn")
  if (messagesBtn) {
    messagesBtn.addEventListener("click", (e) => {
      e.preventDefault()
      loadConversations()
      openModal("conversationsModal")
    })
  }

  // Chat form - only add listener if element exists (not present on all pages)
  const chatForm = document.getElementById("chatForm")
  if (chatForm) {
    chatForm.addEventListener("submit", handleSendMessage)
  }

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
    }
  } catch {
    // Not logged in
  }
  updatePageDisplay()
}

function updateAuthUI() {
  const loggedOutNav = document.querySelector(".nav:not(.nav-logged-in)")
  const loggedInNav = document.querySelector(".nav-logged-in")

  if (currentUser) {
    loggedOutNav.classList.add("hidden")
    loggedOutNav.classList.remove("flex")
    loggedInNav.classList.remove("hidden")
    loggedInNav.classList.add("flex")
  } else {
    loggedOutNav.classList.remove("hidden")
    loggedOutNav.classList.add("flex")
    loggedInNav.classList.add("hidden")
    loggedInNav.classList.remove("flex")
  }
}

function updatePageDisplay() {
  const loginPrompt = document.getElementById("loginPrompt")
  const settingsContainer = document.getElementById("settingsContainer")
  
  if (currentUser) {
    loginPrompt.classList.add("hidden")
    settingsContainer.classList.remove("hidden")
  } else {
    loginPrompt.classList.remove("hidden")
    settingsContainer.classList.add("hidden")
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
    currentUser = null
    updateAuthUI()
    updatePageDisplay()
    showAlert("Du har loggats ut", "success")
  } catch {
    showAlert("Något gick fel", "error")
  }
}

// Account management (GDPR compliance)
async function exportMyData() {
  try {
    const res = await fetch("/api/auth/my-data")
    
    if (!res.ok) {
      showAlert("Kunde inte hämta data", "error")
      return
    }

    const data = await res.json()
    
    // Download as JSON file
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `beggy-data-export-${new Date().toISOString().split("T")[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    
    showAlert("Data exporterad!", "success")
  } catch {
    showAlert("Något gick fel", "error")
  }
}

async function deleteMyAccount() {
  if (!confirm("Är du HELT säker på att du vill radera ditt konto?\n\nAll din data, inklusive annonser och bilder, kommer att raderas permanent.")) {
    return
  }
  
  if (!confirm("Detta kan inte ångras. Vill du verkligen fortsätta?")) {
    return
  }

  try {
    const res = await fetch("/api/auth/account", { method: "DELETE" })

    if (res.ok) {
      currentUser = null
      updateAuthUI()
      showAlert("Ditt konto har raderats", "success")
      window.location.href = "/"
    } else {
      showAlert("Kunde inte radera konto", "error")
    }
  } catch {
    showAlert("Något gick fel", "error")
  }
}

// Conversation/Chat functions
async function loadConversations() {
  try {
    const res = await fetch("/api/conversations")
    const data = await res.json()

    const list = document.getElementById("conversationsList")

    if (!data.conversations || data.conversations.length === 0) {
      list.innerHTML = "<p class='text-gray-500'>Du har inga meddelanden ännu.</p>"
      return
    }

    list.innerHTML = data.conversations
      .map(
        (conv) => `
      <div class="flex justify-between items-center p-4 border-b border-gray-300 last:border-b-0 cursor-pointer hover:bg-gray-50" onclick="openChat(${conv.id})">
        <div class="flex-1">
          <strong>${escapeHtml(conv.ad_title)}</strong><br>
          <span class="text-gray-500 text-sm">
            ${conv.is_buyer ? "Med: " + escapeHtml(conv.seller_username) : "Från: " + escapeHtml(conv.buyer_username)}
          </span><br>
          <span class="text-xs text-gray-400">${conv.message_count} meddelande${conv.message_count !== 1 ? "n" : ""}</span>
          ${conv.expires_at ? `<br><span class="text-xs text-yellow-600">⚠️ Utgår: ${formatDate(conv.expires_at)}</span>` : ""}
        </div>
        <span class="text-gray-400">→</span>
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

  try {
    const res = await fetch(`/api/conversations/${conversationId}/messages`)
    const data = await res.json()

    // Update header
    const header = document.getElementById("chatHeader")
    header.innerHTML = `
      <h2 class="text-xl font-semibold">${escapeHtml(data.conversation.ad_title)}</h2>
      <p class="text-gray-500 text-sm">
        ${data.conversation.is_buyer ? "Säljare: " + escapeHtml(data.conversation.seller_username) : "Köpare: " + escapeHtml(data.conversation.buyer_username)}
        ${data.conversation.expires_at ? `<br><span class="text-yellow-600">⚠️ Konversationen utgår: ${formatDate(data.conversation.expires_at)}</span>` : ""}
      </p>
    `

    // Update messages
    const messagesDiv = document.getElementById("chatMessages")
    if (data.messages.length === 0) {
      messagesDiv.innerHTML = '<p class="text-gray-500 text-center">Inga meddelanden ännu. Skriv något!</p>'
    } else {
      messagesDiv.innerHTML = data.messages
        .map(
          (msg) => `
        <div class="mb-3 ${msg.is_own ? "text-right" : "text-left"}">
          <div class="inline-block max-w-[80%] p-3 rounded-lg ${msg.is_own ? "bg-primary text-white" : "bg-gray-200"}">
            <p class="text-sm">${escapeHtml(msg.content)}</p>
          </div>
          <p class="text-xs text-gray-400 mt-1">${msg.is_own ? "Du" : escapeHtml(msg.sender_username)} • ${formatDateTime(msg.created_at)}</p>
        </div>
      `
        )
        .join("")
      
      // Scroll to bottom
      messagesDiv.scrollTop = messagesDiv.scrollHeight
    }

    closeModal("conversationsModal")
    openModal("chatModal")
  } catch {
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
      // Reload messages
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
    month: "long",
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

function showAlert(message, type) {
  // Remove existing alerts
  document.querySelectorAll(".alert").forEach((el) => el.remove())

  const alert = document.createElement("div")
  alert.className = `alert fixed top-20 right-5 z-[1001] min-w-[250px] p-4 rounded ${type === "success" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`
  alert.textContent = message

  document.body.appendChild(alert)

  setTimeout(() => {
    alert.remove()
  }, 3000)
}

// Make functions available globally for onclick handlers
window.openModal = openModal
window.closeModal = closeModal
window.openChat = openChat
window.exportMyData = exportMyData
window.deleteMyAccount = deleteMyAccount
