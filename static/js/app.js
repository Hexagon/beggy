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
      e.target.style.display = "none"
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
    loggedOutNav.style.display = "none"
    loggedInNav.style.display = "flex"
  } else {
    loggedOutNav.style.display = "flex"
    loggedInNav.style.display = "none"
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
  const name = document.getElementById("regName").value
  const email = document.getElementById("regEmail").value
  const password = document.getElementById("regPassword").value
  const phone = document.getElementById("regPhone").value
  const city = document.getElementById("regCity").value

  try {
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password, phone, city }),
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
      <div class="category-item" onclick="filterByCategory('${cat}')">
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
    adsGrid.innerHTML = '<p class="no-results">Inga annonser hittades</p>'
    return
  }

  adsGrid.innerHTML = ads
    .map(
      (ad) => `
    <div class="ad-card" onclick="openAdDetail(${ad.id})">
      ${
        ad.image_count > 0
          ? '<div class="ad-no-image">📷</div>'
          : '<div class="ad-no-image">📦</div>'
      }
      <div class="ad-info">
        <div class="ad-title">${escapeHtml(ad.title)}</div>
        <div class="ad-price">${formatPrice(ad.price)}</div>
        <div class="ad-meta">
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
    html += `<button onclick="goToPage(${p.page - 1})">« Föregående</button>`
  }

  for (let i = 1; i <= p.pages; i++) {
    if (i === 1 || i === p.pages || (i >= p.page - 2 && i <= p.page + 2)) {
      html += `<button class="${i === p.page ? "active" : ""}" onclick="goToPage(${i})">${i}</button>`
    } else if (i === p.page - 3 || i === p.page + 3) {
      html += "<span>...</span>"
    }
  }

  if (p.page < p.pages) {
    html += `<button onclick="goToPage(${p.page + 1})">Nästa »</button>`
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
    content.innerHTML = `
      <h2>${escapeHtml(ad.title)}</h2>
      ${
        ad.images && ad.images.length > 0
          ? `<div class="ad-detail-images">
          ${ad.images.map((img) => `<img src="${img.url}" alt="Bild">`).join("")}
        </div>`
          : ""
      }
      <div class="ad-detail-price">${formatPrice(ad.price)}</div>
      <div class="ad-detail-meta">
        <strong>Kategori:</strong> ${escapeHtml(ad.category)}<br>
        ${ad.city ? `<strong>Ort:</strong> ${escapeHtml(ad.city)}<br>` : ""}
        <strong>Publicerad:</strong> ${formatDate(ad.created_at)}
      </div>
      <hr style="margin: 20px 0;">
      <div class="ad-detail-description">${escapeHtml(ad.description)}</div>
      <div class="seller-info">
        <strong>Säljare:</strong> ${escapeHtml(ad.seller_name)}
        ${ad.seller_city ? ` • ${escapeHtml(ad.seller_city)}` : ""}
      </div>
    `

    openModal("adDetailModal")
  } catch (err) {
    showAlert("Kunde inte ladda annonsen", "error")
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
      list.innerHTML = "<p>Du har inga annonser ännu.</p>"
      return
    }

    list.innerHTML = data.ads
      .map(
        (ad) => `
      <div class="my-ad-item">
        <div class="my-ad-info">
          <strong>${escapeHtml(ad.title)}</strong><br>
          <span class="status-${ad.status}">${ad.status === "sold" ? "Såld" : "Aktiv"}</span>
          • ${formatPrice(ad.price)}
        </div>
        <div class="my-ad-actions">
          ${
            ad.status === "active"
              ? `<button class="btn btn-secondary" onclick="markAsSold(${ad.id})">Markera såld</button>`
              : ""
          }
          <button class="btn btn-danger" onclick="deleteAd(${ad.id})">Radera</button>
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
      body: JSON.stringify({ status: "sold" }),
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

// Modal helpers
function openModal(id) {
  document.getElementById(id).style.display = "block"
}

function closeModal(id) {
  document.getElementById(id).style.display = "none"
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
  alert.className = `alert alert-${type}`
  alert.textContent = message
  alert.style.position = "fixed"
  alert.style.top = "80px"
  alert.style.right = "20px"
  alert.style.zIndex = "1001"
  alert.style.minWidth = "250px"

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
