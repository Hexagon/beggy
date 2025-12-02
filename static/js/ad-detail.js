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

  // Messages and Chat listeners removed (moved to dedicated page)

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
    
    // Check if user can contact seller (logged in, not own ad, and messages are enabled)
    const canContact = currentUser && currentUser.id !== ad.user_id && ad.state === "ok" && ad.allow_messages !== false
    const isOwner = currentUser && currentUser.id === ad.user_id
    
    // Only show "Logga in" or "Kontakta säljaren" button if on-site messages are enabled
    let contactButton = ""
    if (ad.allow_messages !== false) {
      if (canContact) {
        contactButton = `<button class="px-4 py-2 bg-primary text-white rounded hover:bg-primary-dark" onclick="startConversation(${ad.id})">Kontakta säljaren</button>`
      } else if (!currentUser && ad.state === "ok") {
        contactButton = `<button class="px-4 py-2 bg-stone-300 text-stone-500 rounded cursor-not-allowed" disabled>Logga in för att kontakta</button>`
      }
    }

    // Edit button for owner
    const editButton = isOwner 
      ? `<a href="/annons/${ad.id}/redigera" class="px-4 py-2 bg-amber-500 text-white rounded hover:bg-amber-600 no-underline inline-block">✏️ Redigera annons</a>`
      : ""

    // Build contact info section - only show enabled contact methods
    let contactInfo = ""
    if (ad.allow_messages !== false) {
      // On-site messages are enabled by default (allow_messages is true or undefined)
      contactInfo += `<p><span class="font-semibold">Meddelanden:</span> Aktiverat</p>`
    }
    if (ad.seller_contact_phone) {
      contactInfo += `<p><span class="font-semibold">Telefon:</span> ${escapeHtml(ad.seller_contact_phone)}</p>`
    }
    if (ad.seller_contact_email) {
      contactInfo += `<p><span class="font-semibold">E-post:</span> ${escapeHtml(ad.seller_contact_email)}</p>`
    }

    content.innerHTML = `
      <div class="flex items-start justify-between gap-4 mb-6">
        <h1 class="text-3xl font-bold">${escapeHtml(ad.title)}</h1>
        <!-- Share icons in title row -->
        <div class="flex gap-2 flex-shrink-0">
          <button class="p-2 text-stone-500 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors" onclick="shareToFacebook()" title="Dela på Facebook" aria-label="Dela på Facebook">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
          </button>
          <button class="p-2 text-stone-500 hover:text-black hover:bg-stone-100 rounded-full transition-colors" onclick="shareToX()" title="Dela på X" aria-label="Dela på X">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
          </button>
          <button class="p-2 text-stone-500 hover:text-primary hover:bg-amber-50 rounded-full transition-colors" onclick="copyAdLink()" title="Kopiera länk" aria-label="Kopiera länk">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
          </button>
        </div>
      </div>
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
            ${contactInfo}
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

// Conversation/Chat functions
async function startConversation(adId) {
  try {
    const res = await fetch(`/api/ads/${adId}/conversation`, {
      method: "POST",
    })

    const data = await res.json()

    if (res.ok) {
      // Redirect to the new messages page with the conversation selected
      window.location.href = `/meddelanden?id=${data.conversation_id}`
    } else {
      showAlert(data.error, "error")
    }
  } catch {
    showAlert("Något gick fel", "error")
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

// Share functions
function shareToFacebook() {
  const url = encodeURIComponent(window.location.href)
  window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`, "_blank", "width=600,height=400")
}

function shareToX() {
  const url = encodeURIComponent(window.location.href)
  const title = encodeURIComponent(document.title)
  window.open(`https://x.com/intent/tweet?url=${url}&text=${title}`, "_blank", "width=600,height=400")
}

async function copyAdLink() {
  try {
    await navigator.clipboard.writeText(window.location.href)
    showAlert("Länk kopierad!", "success")
  } catch {
    // Fallback for browsers that don't support clipboard API
    const textArea = document.createElement("textarea")
    textArea.value = window.location.href
    textArea.style.position = "fixed"
    textArea.style.left = "-9999px"
    document.body.appendChild(textArea)
    textArea.select()
    try {
      document.execCommand("copy")
      showAlert("Länk kopierad!", "success")
    } catch {
      showAlert("Kunde inte kopiera länken", "error")
    }
    document.body.removeChild(textArea)
  }
}

// Make functions available globally for onclick handlers
window.openModal = openModal
window.closeModal = closeModal
window.openReportModal = openReportModal
window.startConversation = startConversation
window.shareToFacebook = shareToFacebook
window.shareToX = shareToX
window.copyAdLink = copyAdLink
