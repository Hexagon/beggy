// Beggy - Frontend JavaScript

// Constants
const DEFAULT_VIEW_MODE = "list"
const DEFAULT_SORT = "newest"

// State
let currentUser = null
let categories = []
let counties = []
let adjacentCounties = {}
let currentPage = 1
let currentCategory = ""
let currentCounty = ""
let includeAdjacent = false
let currentSearch = ""
let currentSort = DEFAULT_SORT
let viewMode = localStorage.getItem("viewMode") || DEFAULT_VIEW_MODE
let isBrowseMode = false

// DOM Elements
const adsGrid = document.getElementById("adsGrid")
const categoryGrid = document.getElementById("categoryGrid")
const categorySelect = document.getElementById("categorySelect")
const countySelect = document.getElementById("countySelect")
const includeAdjacentCheckbox = document.getElementById("includeAdjacentCheckbox")
const searchInput = document.getElementById("searchInput")
const pagination = document.getElementById("pagination")
const sortSelect = document.getElementById("sortSelect")
const landingSection = document.getElementById("landingSection")
const categoriesSection = document.getElementById("categoriesSection")
const adsSection = document.getElementById("adsSection")

// Initialize
document.addEventListener("DOMContentLoaded", () => {
  checkAuth()
  loadCategories()
  loadCounties()
  loadStateFromUrl()
  setupEventListeners()
  updateViewModeButtons()
  updateViewMode()
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

  // Sell buttons - navigate to create ad page
  document.getElementById("sellBtn").addEventListener("click", (e) => {
    e.preventDefault()
    window.location.href = "/ny-annons"
  })

  document.getElementById("sellBtn2").addEventListener("click", (e) => {
    e.preventDefault()
    window.location.href = "/ny-annons"
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

  // Browse ads button (landing page)
  const browseAdsBtn = document.getElementById("browseAdsBtn")
  if (browseAdsBtn) {
    browseAdsBtn.addEventListener("click", () => {
      showBrowseView()
    })
  }

  // Search
  document.getElementById("searchBtn").addEventListener("click", () => {
    currentSearch = searchInput.value
    currentPage = 1
    showBrowseView()
    loadAdsAndUpdateUrl()
  })

  searchInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      currentSearch = searchInput.value
      currentPage = 1
      showBrowseView()
      loadAdsAndUpdateUrl()
    }
  })

  // County filter (main filter)
  countySelect.addEventListener("change", () => {
    currentCounty = countySelect.value
    currentPage = 1
    showBrowseView()
    loadAdsAndUpdateUrl()
  })

  // Include adjacent counties checkbox
  includeAdjacentCheckbox.addEventListener("change", () => {
    includeAdjacent = includeAdjacentCheckbox.checked
    currentPage = 1
    loadAdsAndUpdateUrl()
  })

  // Category filter
  categorySelect.addEventListener("change", () => {
    currentCategory = categorySelect.value
    currentPage = 1
    loadAdsAndUpdateUrl()
  })

  // Sort select
  sortSelect.addEventListener("change", () => {
    currentSort = sortSelect.value
    currentPage = 1
    loadAdsAndUpdateUrl()
  })

  // Handle browser back/forward
  window.addEventListener("popstate", () => {
    loadStateFromUrl()
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

    // Populate category grid with "All Categories" button first
    const allCategoriesBtn = `
      <div class="category-btn bg-amber-100 p-4 rounded text-center cursor-pointer transition-all hover:-translate-y-0.5 hover:shadow-md" data-category="" onclick="clearCategoryFilter()">
        📋 Alla Kategorier
      </div>
    `
    categoryGrid.innerHTML = allCategoriesBtn + categories
      .map(
        (cat) => `
      <div class="category-btn bg-amber-75 p-4 rounded text-center cursor-pointer transition-all hover:-translate-y-0.5 hover:shadow-md" data-category="${cat}" onclick="filterByCategory('${cat}')">
        ${getCategoryIcon(cat)} ${cat}
      </div>
    `
      )
      .join("")

    // Populate category filter select
    const options = categories.map((cat) => `<option value="${cat}">${cat}</option>`).join("")
    categorySelect.innerHTML = '<option value="">Alla kategorier</option>' + options
    
    // Update category button styles to show current selection
    updateCategoryButtonStyles()
  } catch (err) {
    console.error("Failed to load categories:", err)
  }
}

function updateCategoryButtonStyles() {
  const buttons = document.querySelectorAll(".category-btn")
  buttons.forEach((btn) => {
    const btnCategory = btn.dataset.category
    const isSelected = btnCategory === currentCategory
    const isAllCategories = btnCategory === ""
    
    // Remove previous selection styling
    btn.classList.remove("ring-2", "ring-primary", "ring-offset-2", "bg-amber-100", "bg-amber-75")
    
    if (isSelected) {
      // Selected button gets prominent styling
      btn.classList.add("ring-2", "ring-primary", "ring-offset-2")
    }
    
    // Set base background color
    if (isAllCategories) {
      btn.classList.add("bg-amber-100")
    } else {
      btn.classList.add("bg-amber-75")
    }
  })
}

// Counties
async function loadCounties() {
  try {
    const res = await fetch("/api/counties")
    const data = await res.json()
    counties = data.counties
    adjacentCounties = data.adjacentCounties

    // Populate county filter select (escape HTML to prevent XSS)
    const options = counties.map((county) => `<option value="${escapeHtml(county)}">${escapeHtml(county)}</option>`).join("")
    countySelect.innerHTML = '<option value="">Alla län</option>' + options
  } catch (err) {
    console.error("Failed to load counties:", err)
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
  showBrowseView()
  loadAdsAndUpdateUrl()
  document.getElementById("adsTitle").textContent = category
  updateCategoryButtonStyles()
}

function clearCategoryFilter() {
  currentCategory = ""
  categorySelect.value = ""
  currentPage = 1
  loadAdsAndUpdateUrl()
  document.getElementById("adsTitle").textContent = "Senaste annonser"
  updateCategoryButtonStyles()
}

// URL State Management
function loadStateFromUrl() {
  const params = new URLSearchParams(window.location.search)
  
  currentSearch = params.get("search") || ""
  currentCategory = params.get("category") || ""
  currentCounty = params.get("county") || ""
  includeAdjacent = params.get("adjacent") === "true"
  currentSort = params.get("sort") || DEFAULT_SORT
  currentPage = parseInt(params.get("page"), 10) || 1
  
  // Update UI elements to reflect state
  searchInput.value = currentSearch
  categorySelect.value = currentCategory
  countySelect.value = currentCounty
  includeAdjacentCheckbox.checked = includeAdjacent
  sortSelect.value = currentSort
  
  updateViewMode()
  // Update category button styles if categories are already loaded
  updateCategoryButtonStyles()
  
  loadAds()
}

function updateUrl() {
  const params = new URLSearchParams()
  
  if (currentSearch) params.set("search", currentSearch)
  if (currentCategory) params.set("category", currentCategory)
  if (currentCounty) params.set("county", currentCounty)
  if (includeAdjacent) params.set("adjacent", "true")
  if (currentSort && currentSort !== DEFAULT_SORT) params.set("sort", currentSort)
  if (currentPage > 1) params.set("page", currentPage.toString())
  
  const queryString = params.toString()
  const newUrl = queryString ? `${window.location.pathname}?${queryString}` : window.location.pathname
  
  window.history.pushState({}, "", newUrl)
}

function loadAdsAndUpdateUrl() {
  updateUrl()
  loadAds()
}

// Ads
async function loadAds() {
  try {
    const params = new URLSearchParams({
      page: currentPage,
      limit: 20,
    })

    if (currentCounty) {
      params.append("county", currentCounty)
      if (includeAdjacent) params.append("includeAdjacent", "true")
    }
    if (currentCategory) params.append("category", currentCategory)
    if (currentSearch) params.append("search", currentSearch)
    if (currentSort) params.append("sort", currentSort)

    const res = await fetch(`/api/ads?${params}`)
    const data = await res.json()

    renderAds(data.ads)
    renderPagination(data.pagination)

    // Update title
    if (currentSearch) {
      document.getElementById("adsTitle").textContent = `Sökresultat för "${currentSearch}"`
    } else if (currentCounty) {
      const adjacentText = includeAdjacent ? " + angränsande" : ""
      document.getElementById("adsTitle").textContent = `Annonser i ${currentCounty}${adjacentText}`
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
    adsGrid.innerHTML = '<p class="text-stone-500 text-center py-8">Inga annonser hittades</p>'
    return
  }

  if (viewMode === "list") {
    // List view - default (no background per ad, subtle row divider)
    adsGrid.className = "ads-grid flex flex-col divide-y divide-stone-200"
    adsGrid.innerHTML = ads
      .map(
        (ad) => {
          const safeImageUrl = sanitizeUrl(ad.first_image_url)
          return `
      <div class="overflow-hidden cursor-pointer transition-all hover:bg-stone-100 flex py-3" onclick="openAdDetail(${ad.id})">
        ${
          safeImageUrl
            ? `<div class="w-24 h-24 flex-shrink-0 rounded overflow-hidden"><img src="${safeImageUrl}" alt="${escapeHtml(ad.title)}" class="w-full h-full object-cover"></div>`
            : '<div class="w-24 h-24 flex-shrink-0 bg-stone-200 rounded flex items-center justify-center text-stone-400 text-3xl">📦</div>'
        }
        <div class="p-3 flex-1 min-w-0">
          <div class="text-base font-semibold mb-1 whitespace-nowrap overflow-hidden text-ellipsis">${escapeHtml(ad.title)}</div>
          <div class="text-lg text-primary font-bold mb-1">${formatPrice(ad.price)}</div>
          <div class="text-sm text-stone-500">
            ${escapeHtml(ad.category)}${ad.county ? " • " + escapeHtml(ad.county) : ""} • ${formatRelativeTime(ad.created_at)}
          </div>
        </div>
      </div>
    `
        }
      )
      .join("")
  } else {
    // Gallery view (keep background per ad)
    adsGrid.className = "ads-grid grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5"
    adsGrid.innerHTML = ads
      .map(
        (ad) => {
          const safeImageUrl = sanitizeUrl(ad.first_image_url)
          return `
      <div class="bg-amber-50 rounded-lg overflow-hidden shadow-md cursor-pointer transition-transform hover:-translate-y-1" onclick="openAdDetail(${ad.id})">
        ${
          safeImageUrl
            ? `<div class="w-full h-44"><img src="${safeImageUrl}" alt="${escapeHtml(ad.title)}" class="w-full h-full object-cover"></div>`
            : '<div class="w-full h-44 bg-stone-200 flex items-center justify-center text-stone-400 text-5xl">📦</div>'
        }
        <div class="p-4">
          <div class="text-lg font-semibold mb-1 whitespace-nowrap overflow-hidden text-ellipsis">${escapeHtml(ad.title)}</div>
          <div class="text-xl text-primary font-bold mb-1">${formatPrice(ad.price)}</div>
          <div class="text-sm text-stone-500">
            ${escapeHtml(ad.category)}${ad.county ? " • " + escapeHtml(ad.county) : ""} • ${formatRelativeTime(ad.created_at)}
          </div>
        </div>
      </div>
    `
        }
      )
      .join("")
  }
}

function renderPagination(p) {
  if (p.pages <= 1) {
    pagination.innerHTML = ""
    return
  }

  let html = ""

  if (p.page > 1) {
    html += `<button class="px-4 py-2.5 border border-stone-300 bg-amber-50 cursor-pointer rounded hover:bg-amber-100" onclick="goToPage(${p.page - 1})">« Föregående</button>`
  }

  for (let i = 1; i <= p.pages; i++) {
    if (i === 1 || i === p.pages || (i >= p.page - 2 && i <= p.page + 2)) {
      html += `<button class="px-4 py-2.5 border cursor-pointer rounded ${i === p.page ? "bg-primary text-white border-primary" : "border-stone-300 bg-amber-50 hover:bg-amber-100"}" onclick="goToPage(${i})">${i}</button>`
    } else if (i === p.page - 3 || i === p.page + 3) {
      html += "<span class='px-2'>...</span>"
    }
  }

  if (p.page < p.pages) {
    html += `<button class="px-4 py-2.5 border border-stone-300 bg-amber-50 cursor-pointer rounded hover:bg-amber-100" onclick="goToPage(${p.page + 1})">Nästa »</button>`
  }

  pagination.innerHTML = html
}

function goToPage(page) {
  currentPage = page
  loadAdsAndUpdateUrl()
  window.scrollTo(0, 0)
}

// Ad Detail - Navigate to ad page
function openAdDetail(id) {
  window.location.href = `/annons/${id}`
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

function formatRelativeTime(dateString) {
  const now = new Date()
  const date = new Date(dateString)
  const diffMs = now - date
  const diffSec = Math.floor(diffMs / 1000)
  const diffMin = Math.floor(diffSec / 60)
  const diffHour = Math.floor(diffMin / 60)
  const diffDay = Math.floor(diffHour / 24)

  if (diffMin < 1) return "just nu"
  if (diffMin < 60) return `${diffMin} minut${diffMin === 1 ? "" : "er"} sedan`
  if (diffHour < 24) return `${diffHour} timm${diffHour === 1 ? "e" : "ar"} sedan`
  if (diffDay < 7) return `${diffDay} dag${diffDay === 1 ? "" : "ar"} sedan`
  return formatDate(dateString)
}

function setViewMode(mode) {
  viewMode = mode
  localStorage.setItem("viewMode", mode)
  updateViewModeButtons()
  loadAds()
}

function updateViewModeButtons() {
  const listBtn = document.getElementById("listViewBtn")
  const galleryBtn = document.getElementById("galleryViewBtn")
  
  if (viewMode === "list") {
    listBtn.className = "px-3 py-1 rounded text-sm bg-primary text-white"
    galleryBtn.className = "px-3 py-1 rounded text-sm bg-stone-200 text-stone-700 hover:bg-stone-300"
  } else {
    listBtn.className = "px-3 py-1 rounded text-sm bg-stone-200 text-stone-700 hover:bg-stone-300"
    galleryBtn.className = "px-3 py-1 rounded text-sm bg-primary text-white"
  }
}

// Landing/Browse view management
function updateViewMode() {
  // Check if any filters are active (state variables are populated from URL params in loadStateFromUrl)
  const hasFilters = currentSearch || currentCategory || currentCounty
  
  if (hasFilters || isBrowseMode) {
    showBrowseView()
  } else {
    showLandingView()
  }
}

function showLandingView() {
  isBrowseMode = false
  if (landingSection) landingSection.classList.remove("hidden")
  if (categoriesSection) categoriesSection.classList.add("hidden")
  if (adsSection) adsSection.classList.add("hidden")
}

function showBrowseView() {
  isBrowseMode = true
  if (landingSection) landingSection.classList.add("hidden")
  if (categoriesSection) categoriesSection.classList.remove("hidden")
  if (adsSection) adsSection.classList.remove("hidden")
  loadAds()
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
window.clearCategoryFilter = clearCategoryFilter
window.openAdDetail = openAdDetail
window.goToPage = goToPage
window.openModal = openModal
window.closeModal = closeModal
window.openReportModal = openReportModal
window.startConversation = startConversation
window.openChat = openChat
window.setViewMode = setViewMode
window.showBrowseView = showBrowseView

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
