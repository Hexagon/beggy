// Beggy - Frontend JavaScript

// State
let currentUser = null
let categories = []
let currentPage = 1
let currentCategory = ""
let currentSearch = ""

// DOM Elements
const adsGrid = document.getElementById("adsGrid")
const categoryGrid = document.getElementById("categoryGrid")
const categorySelect = document.getElementById("categorySelect")
const adCategorySelect = document.getElementById("adCategory")
const searchInput = document.getElementById("searchInput")
const pagination = document.getElementById("pagination")

// Initialize
document.addEventListener("DOMContentLoaded", () => {
  checkAuth()
  loadCategories()
  loadAds()
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

  // Sell buttons
  document.getElementById("sellBtn").addEventListener("click", (e) => {
    e.preventDefault()
    if (!currentUser) {
      openModal("loginModal")
    } else {
      openModal("createAdModal")
    }
  })

  document.getElementById("sellBtn2").addEventListener("click", (e) => {
    e.preventDefault()
    openModal("createAdModal")
  })

  // Create ad
  document.getElementById("createAdForm").addEventListener("submit", handleCreateAd)

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

  // Search
  document.getElementById("searchBtn").addEventListener("click", () => {
    currentSearch = searchInput.value
    currentPage = 1
    loadAds()
  })

  searchInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      currentSearch = searchInput.value
      currentPage = 1
      loadAds()
    }
  })

  // Category filter
  categorySelect.addEventListener("change", () => {
    currentCategory = categorySelect.value
    currentPage = 1
    loadAds()
  })

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
  const city = document.getElementById("regCity").value
  const contact_phone = document.getElementById("regContactPhone").value
  const contact_email = document.getElementById("regContactEmail").value

  try {
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, email, password, city, contact_phone, contact_email }),
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
    showAlert("Du har loggats ut", "success")
  } catch {
    showAlert("Något gick fel", "error")
  }
}

// Categories
async function loadCategories() {
  try {
    const res = await fetch("/api/categories")
    const data = await res.json()
    categories = data.categories

    // Populate category grid
    categoryGrid.innerHTML = categories
      .map(
        (cat) => `
      <div class="bg-white p-4 rounded text-center cursor-pointer transition-all hover:-translate-y-0.5 hover:shadow-md" onclick="filterByCategory('${cat}')">
        ${getCategoryIcon(cat)} ${cat}
      </div>
    `
      )
      .join("")

    // Populate selects
    const options = categories.map((cat) => `<option value="${cat}">${cat}</option>`).join("")
    categorySelect.innerHTML = '<option value="">Alla kategorier</option>' + options
    adCategorySelect.innerHTML = '<option value="">Välj kategori</option>' + options
  } catch (err) {
    console.error("Failed to load categories:", err)
  }
}

function getCategoryIcon(category) {
  const icons = {
    Fordon: "🚗",
    Elektronik: "📱",
    Möbler: "🛋️",
    Kläder: "👕",
    "Sport & Fritid": "⚽",
    "Hem & Hushåll": "🏠",
    "Barn & Baby": "👶",
    Djur: "🐕",
    Hobby: "🎨",
    Övrigt: "📦",
  }
  return icons[category] || "📦"
}

function filterByCategory(category) {
  currentCategory = category
  categorySelect.value = category
  currentPage = 1
  loadAds()
  document.getElementById("adsTitle").textContent = category
}

// Ads
async function loadAds() {
  try {
    const params = new URLSearchParams({
      page: currentPage,
      limit: 20,
    })

    if (currentCategory) params.append("category", currentCategory)
    if (currentSearch) params.append("search", currentSearch)

    const res = await fetch(`/api/ads?${params}`)
    const data = await res.json()

    renderAds(data.ads)
    renderPagination(data.pagination)

    // Update title
    if (currentSearch) {
      document.getElementById("adsTitle").textContent = `Sökresultat för "${currentSearch}"`
    } else if (currentCategory) {
      document.getElementById("adsTitle").textContent = currentCategory
    } else {
      document.getElementById("adsTitle").textContent = "Senaste annonser"
    }
  } catch (err) {
    console.error("Failed to load ads:", err)
  }
}

function renderAds(ads) {
  if (ads.length === 0) {
    adsGrid.innerHTML = '<p class="text-gray-500 text-center py-8">Inga annonser hittades</p>'
    return
  }

  adsGrid.innerHTML = ads
    .map(
      (ad) => `
    <div class="bg-white rounded-lg overflow-hidden shadow-md cursor-pointer transition-transform hover:-translate-y-1" onclick="openAdDetail(${ad.id})">
      ${
        ad.image_count > 0
          ? `<div class="w-full h-44 bg-gradient-to-br from-blue-100 to-blue-50 flex items-center justify-center text-primary text-3xl">📷 ${ad.image_count} bild${ad.image_count > 1 ? "er" : ""}</div>`
          : '<div class="w-full h-44 bg-gray-300 flex items-center justify-center text-gray-500 text-5xl">📦</div>'
      }
      <div class="p-4">
        <div class="text-lg font-semibold mb-1 whitespace-nowrap overflow-hidden text-ellipsis">${escapeHtml(ad.title)}</div>
        <div class="text-xl text-primary font-bold mb-1">${formatPrice(ad.price)}</div>
        <div class="text-sm text-gray-500">
          ${escapeHtml(ad.category)}${ad.city ? " • " + escapeHtml(ad.city) : ""}
        </div>
      </div>
    </div>
  `
    )
    .join("")
}

function renderPagination(p) {
  if (p.pages <= 1) {
    pagination.innerHTML = ""
    return
  }

  let html = ""

  if (p.page > 1) {
    html += `<button class="px-4 py-2.5 border border-gray-300 bg-white cursor-pointer rounded hover:bg-gray-100" onclick="goToPage(${p.page - 1})">« Föregående</button>`
  }

  for (let i = 1; i <= p.pages; i++) {
    if (i === 1 || i === p.pages || (i >= p.page - 2 && i <= p.page + 2)) {
      html += `<button class="px-4 py-2.5 border cursor-pointer rounded ${i === p.page ? "bg-primary text-white border-primary" : "border-gray-300 bg-white hover:bg-gray-100"}" onclick="goToPage(${i})">${i}</button>`
    } else if (i === p.page - 3 || i === p.page + 3) {
      html += "<span class='px-2'>...</span>"
    }
  }

  if (p.page < p.pages) {
    html += `<button class="px-4 py-2.5 border border-gray-300 bg-white cursor-pointer rounded hover:bg-gray-100" onclick="goToPage(${p.page + 1})">Nästa »</button>`
  }

  pagination.innerHTML = html
}

function goToPage(page) {
  currentPage = page
  loadAds()
  window.scrollTo(0, 0)
}

// Ad Detail
async function openAdDetail(id) {
  try {
    const res = await fetch(`/api/ads/${id}`)
    const ad = await res.json()

    const content = document.getElementById("adDetailContent")
    
    // Build contact info section with warning
    let contactInfo = ""
    if (ad.seller_contact_phone || ad.seller_contact_email) {
      contactInfo = `
        <div class="bg-yellow-50 border border-yellow-300 rounded p-3 mt-3 text-sm">
          <strong>Kontaktuppgifter (publika):</strong><br>
          ${ad.seller_contact_phone ? `📞 ${escapeHtml(ad.seller_contact_phone)}<br>` : ""}
          ${ad.seller_contact_email ? `✉️ ${escapeHtml(ad.seller_contact_email)}` : ""}
        </div>
      `
    }

    // Check if user can contact seller (logged in and not own ad)
    const canContact = currentUser && currentUser.id !== ad.user_id && ad.state === "ok"
    const contactButton = canContact 
      ? `<button class="px-4 py-2 bg-primary text-white rounded hover:bg-primary-dark" onclick="startConversation(${ad.id})">💬 Kontakta säljaren</button>`
      : (currentUser && currentUser.id === ad.user_id ? "" : `<button class="px-4 py-2 bg-gray-300 text-gray-500 rounded cursor-not-allowed" disabled>Logga in för att kontakta</button>`)

    content.innerHTML = `
      <h2 class="text-xl font-semibold mb-4">${escapeHtml(ad.title)}</h2>
      ${
        ad.images && ad.images.length > 0
          ? `<div class="flex gap-2.5 mb-5 flex-wrap">
          ${ad.images.map((img) => `<img src="${img.url}" alt="Bild" class="max-w-full max-h-72 rounded">`).join("")}
        </div>`
          : ""
      }
      <div class="text-2xl text-primary font-bold mb-4">${formatPrice(ad.price)}</div>
      <div class="text-gray-500 mb-4">
        <strong>Kategori:</strong> ${escapeHtml(ad.category)}<br>
        ${ad.city ? `<strong>Ort:</strong> ${escapeHtml(ad.city)}<br>` : ""}
        <strong>Publicerad:</strong> ${formatDate(ad.created_at)}
        ${ad.state !== "ok" ? `<br><span class="text-yellow-600 font-bold">Status: ${getStateLabel(ad.state)}</span>` : ""}
      </div>
      <hr class="my-5">
      <div class="leading-relaxed whitespace-pre-wrap">${escapeHtml(ad.description)}</div>
      <div class="bg-gray-100 p-4 rounded mt-5">
        <strong>Säljare:</strong> ${escapeHtml(ad.seller_username)}
        ${ad.seller_city ? ` • ${escapeHtml(ad.seller_city)}` : ""}
        ${contactInfo}
      </div>
      <div class="ad-actions flex gap-2.5 flex-wrap" style="margin-top: 20px; padding-top: 15px; border-top: 1px solid #ddd;">
        ${contactButton}
        <button class="px-4 py-2 border border-gray-300 rounded hover:bg-gray-100" onclick="openReportModal(${ad.id})">⚠️ Rapportera annons</button>
      </div>
    `

    openModal("adDetailModal")
  } catch (err) {
    showAlert("Kunde inte ladda annonsen", "error")
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
let currentReportAdId = null

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

// Create Ad
async function handleCreateAd(e) {
  e.preventDefault()

  const ad = {
    title: document.getElementById("adTitle").value,
    category: document.getElementById("adCategory").value,
    price: parseInt(document.getElementById("adPrice").value),
    city: document.getElementById("adCity").value,
    description: document.getElementById("adDescription").value,
  }

  try {
    const res = await fetch("/api/ads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(ad),
    })

    const data = await res.json()

    if (res.ok) {
      closeModal("createAdModal")
      document.getElementById("createAdForm").reset()
      showAlert("Annons skapad!", "success")
      loadAds()
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
          <strong>${escapeHtml(ad.title)}</strong><br>
          <span class="${ad.state === "sold" ? "text-green-600 font-bold" : ad.state === "expired" ? "text-yellow-600" : "text-primary"}">${getStateLabel(ad.state)}</span>
          • ${formatPrice(ad.price)}
          ${ad.expires_at ? `<br><span class="text-xs text-gray-400">Utgår: ${formatDate(ad.expires_at)}</span>` : ""}
        </div>
        <div class="flex gap-2.5">
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
      loadAds()
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
      loadAds()
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
      closeModal("accountModal")
      showAlert("Ditt konto har raderats", "success")
    } else {
      showAlert("Kunde inte radera konto", "error")
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
window.filterByCategory = filterByCategory
window.openAdDetail = openAdDetail
window.goToPage = goToPage
window.markAsSold = markAsSold
window.deleteAd = deleteAd
window.openModal = openModal
window.closeModal = closeModal
window.openReportModal = openReportModal
window.exportMyData = exportMyData
window.deleteMyAccount = deleteMyAccount
window.startConversation = startConversation
window.openChat = openChat

// Conversation/Chat functions
let currentConversationId = null

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
      closeModal("adDetailModal")
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

function formatDateTime(dateString) {
  return new Intl.DateTimeFormat("sv-SE", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(dateString))
}
