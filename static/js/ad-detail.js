// Beggy - Ad Detail Page JavaScript

// State
let currentUser = null
let currentAdId = null
let currentReportAdId = null
let currentConversationId = null

// Initialize
document.addEventListener("DOMContentLoaded", () => {
  // Get ad ID from URL
  const pathParts = window.location.pathname.split("/")
  currentAdId = parseInt(pathParts[pathParts.length - 1])
  
  if (!currentAdId || isNaN(currentAdId)) {
    document.getElementById("adDetailContent").innerHTML = '<p class="text-red-500 text-center py-8">Ogiltig annons-ID</p>'
    return
  }

  checkAuth()
  loadAdDetail()
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

  // My ads
  document.getElementById("myAdsBtn").addEventListener("click", (e) => {
    e.preventDefault()
    loadMyAds()
    openModal("myAdsModal")
  })

  // Messages
  document.getElementById("messagesBtn").addEventListener("click", (e) => {
    e.preventDefault()
    loadConversations()
    openModal("conversationsModal")
  })

  // Chat form
  document.getElementById("chatForm").addEventListener("submit", handleSendMessage)

  // Report ad
  document.getElementById("reportForm").addEventListener("submit", handleReportAd)

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
      loadAdDetail() // Reload to show contact button
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
    loadAdDetail() // Reload to hide contact button
    showAlert("Du har loggats ut", "success")
  } catch {
    showAlert("Något gick fel", "error")
  }
}

// Load Ad Detail
async function loadAdDetail() {
  try {
    const res = await fetch(`/api/ads/${currentAdId}`)
    
    if (!res.ok) {
      document.getElementById("adDetailContent").innerHTML = '<p class="text-red-500 text-center py-8">Annonsen hittades inte</p>'
      return
    }

    const ad = await res.json()
    
    // Update page title
    document.title = `${ad.title} - Beggy`

    const content = document.getElementById("adDetailContent")
    
    // Check if user can contact seller (logged in and not own ad)
    const canContact = currentUser && currentUser.id !== ad.user_id && ad.state === "ok"
    const isOwner = currentUser && currentUser.id === ad.user_id
    
    // Only show "Logga in" button if NOT logged in
    let contactButton = ""
    if (canContact) {
      contactButton = `<button class="px-4 py-2 bg-primary text-white rounded hover:bg-primary-dark" onclick="startConversation(${ad.id})">Kontakta säljaren</button>`
    } else if (!currentUser && ad.state === "ok") {
      contactButton = `<button class="px-4 py-2 bg-stone-300 text-stone-500 rounded cursor-not-allowed" disabled>Logga in för att kontakta</button>`
    }

    // Edit button for owner
    const editButton = isOwner 
      ? `<a href="/annons/${ad.id}/redigera" class="px-4 py-2 bg-amber-500 text-white rounded hover:bg-amber-600 no-underline inline-block">✏️ Redigera annons</a>`
      : ""

    content.innerHTML = `
      <h1 class="text-3xl font-bold mb-6">${escapeHtml(ad.title)}</h1>
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <!-- Left column: Image -->
        <div>
          ${
            ad.images && ad.images.length > 0
              ? `<div class="flex gap-2.5 flex-wrap">
              ${ad.images.map((img) => {
                const safeUrl = sanitizeUrl(img.url)
                return safeUrl ? `<img src="${safeUrl}" alt="Bild" class="max-w-full rounded-lg shadow-sm">` : ""
              }).join("")}
            </div>`
              : `<div class="bg-stone-100 rounded-lg h-64 flex items-center justify-center text-stone-400">Ingen bild</div>`
          }
        </div>
        <!-- Right column: Basic info -->
        <div>
          <div class="text-4xl text-primary font-bold mb-6">${formatPrice(ad.price)}</div>
          <div class="space-y-3 text-stone-600">
            <p><span class="font-semibold">Kategori:</span> ${escapeHtml(ad.category)}</p>
            ${ad.county ? `<p><span class="font-semibold">Län:</span> ${escapeHtml(ad.county)}</p>` : ""}
            <p><span class="font-semibold">Säljare:</span> ${escapeHtml(ad.seller_username)}</p>
            ${ad.seller_contact_phone ? `<p><span class="font-semibold">Telefon:</span> ${escapeHtml(ad.seller_contact_phone)}</p>` : ""}
            ${ad.seller_contact_email ? `<p><span class="font-semibold">E-post:</span> ${escapeHtml(ad.seller_contact_email)}</p>` : ""}
            <p><span class="font-semibold">Publicerad:</span> ${formatDate(ad.created_at)}</p>
            ${ad.state !== "ok" ? `<p><span class="text-amber-600 font-bold">Status: ${getStateLabel(ad.state)}</span></p>` : ""}
          </div>
          <div class="ad-actions flex gap-2.5 flex-wrap mt-6 pt-4 border-t border-stone-200">
            ${contactButton}
            ${editButton}
            <button class="px-4 py-2 border border-stone-300 rounded hover:bg-stone-100" onclick="openReportModal(${ad.id})">⚠️ Rapportera annons</button>
          </div>
        </div>
      </div>
      <!-- Description below -->
      <div class="border-t border-stone-200 pt-6">
        <h2 class="text-xl font-semibold mb-4">Beskrivning</h2>
        <div class="leading-relaxed whitespace-pre-wrap text-lg text-stone-700">${escapeHtml(ad.description)}</div>
      </div>
    `
  } catch (err) {
    document.getElementById("adDetailContent").innerHTML = '<p class="text-red-500 text-center py-8">Kunde inte ladda annonsen</p>'
  }
}

function getStateLabel(state) {
  const labels = {
    ok: "Aktiv",
    sold: "Såld",
    expired: "Utgången",
    reported: "Under granskning",
    deleted: "Borttagen"
  }
  return labels[state] || state
}

// Report ad (BBS law compliance)
function openReportModal(adId) {
  currentReportAdId = adId
  openModal("reportModal")
}

async function handleReportAd(e) {
  e.preventDefault()
  
  const reason = document.getElementById("reportReason").value
  const details = document.getElementById("reportDetails").value

  if (!reason) {
    showAlert("Välj en anledning", "error")
    return
  }

  try {
    const res = await fetch(`/api/ads/${currentReportAdId}/report`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason, details }),
    })

    const data = await res.json()

    if (res.ok) {
      closeModal("reportModal")
      document.getElementById("reportForm").reset()
      showAlert(data.message, "success")
    } else {
      showAlert(data.error, "error")
    }
  } catch {
    showAlert("Något gick fel", "error")
  }
}

// My Ads
async function loadMyAds() {
  try {
    const res = await fetch("/api/my-ads")
    const data = await res.json()

    const list = document.getElementById("myAdsList")

    if (data.ads.length === 0) {
      list.innerHTML = "<p class='text-gray-500'>Du har inga annonser ännu.</p>"
      return
    }

    list.innerHTML = data.ads
      .map(
        (ad) => `
      <div class="flex justify-between items-center p-4 border-b border-gray-300 last:border-b-0">
        <div class="flex-1">
          <a href="/annons/${ad.id}" class="text-primary font-semibold">${escapeHtml(ad.title)}</a><br>
          <span class="${ad.state === "sold" ? "text-green-600 font-bold" : ad.state === "expired" ? "text-yellow-600" : "text-primary"}">${getStateLabel(ad.state)}</span>
          • ${formatPrice(ad.price)}
          ${ad.expires_at ? `<br><span class="text-xs text-gray-400">Utgår: ${formatDate(ad.expires_at)}</span>` : ""}
        </div>
        <div class="flex gap-2.5">
          <a href="/annons/${ad.id}/redigera" class="px-2.5 py-1 text-sm bg-yellow-500 text-white rounded hover:bg-yellow-600 no-underline">Redigera</a>
          ${
            ad.state === "ok"
              ? `<button class="px-2.5 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700" onclick="markAsSold(${ad.id})">Markera såld</button>`
              : ""
          }
          <button class="px-2.5 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700" onclick="deleteAd(${ad.id})">Radera</button>
        </div>
      </div>
    `
      )
      .join("")
  } catch {
    showAlert("Kunde inte ladda annonser", "error")
  }
}

async function markAsSold(id) {
  try {
    const res = await fetch(`/api/ads/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ state: "sold" }),
    })

    if (res.ok) {
      loadMyAds()
      if (id === currentAdId) loadAdDetail()
      showAlert("Annons markerad som såld", "success")
    }
  } catch {
    showAlert("Något gick fel", "error")
  }
}

async function deleteAd(id) {
  if (!confirm("Är du säker på att du vill radera denna annons?")) return

  try {
    const res = await fetch(`/api/ads/${id}`, { method: "DELETE" })

    if (res.ok) {
      loadMyAds()
      if (id === currentAdId) {
        window.location.href = "/"
      }
      showAlert("Annons raderad", "success")
    }
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
      closeModal("myAdsModal")
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

async function startConversation(adId) {
  try {
    const res = await fetch(`/api/ads/${adId}/conversation`, {
      method: "POST",
    })

    const data = await res.json()

    if (res.ok) {
      await openChat(data.conversation_id)
    } else {
      showAlert(data.error, "error")
    }
  } catch {
    showAlert("Något gick fel", "error")
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

function sanitizeUrl(url) {
  if (!url) return ""
  // Only allow http(s) URLs and encode the result
  try {
    const parsed = new URL(url)
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return ""
    }
    return encodeURI(decodeURI(url))
  } catch {
    return ""
  }
}

function formatPrice(price) {
  return new Intl.NumberFormat("sv-SE", {
    style: "currency",
    currency: "SEK",
    minimumFractionDigits: 0,
  }).format(price)
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
window.openReportModal = openReportModal
window.startConversation = startConversation
window.openChat = openChat
window.markAsSold = markAsSold
window.deleteAd = deleteAd
window.exportMyData = exportMyData
window.deleteMyAccount = deleteMyAccount
