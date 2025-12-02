// Beggy - Frontend JavaScript

// Constants
const DEFAULT_VIEW_MODE = "list"
const DEFAULT_SORT = "newest"

// State
// Note: currentUser is defined in utils.js as window.currentUser
let categoriesConfig = [] // Config with slug and name
let countiesConfig = [] // Config with slug and name
let adjacentCountiesConfig = {} // Adjacent counties by slug
let currentPage = 1
let currentCategory = "" // slug
let currentSubcategory = "" // slug
let currentCounty = "" // slug
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
const includeAdjacentCheckboxMobile = document.getElementById("includeAdjacentCheckboxMobile")
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
  
  // Force mute all videos (browser policy often requires this for autoplay)
  document.querySelectorAll("video").forEach(v => v.muted = true)

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

  // Forgot password
  document.getElementById("showForgotPassword").addEventListener("click", (e) => {
    e.preventDefault()
    closeModal("loginModal")
    openModal("forgotPasswordModal")
  })

  document.getElementById("backToLogin").addEventListener("click", (e) => {
    e.preventDefault()
    closeModal("forgotPasswordModal")
    openModal("loginModal")
  })

  document.getElementById("forgotPasswordForm").addEventListener("submit", handleForgotPassword)

  // Logout - element may be hidden by CSS when logged out, but event listener still works
  const logoutBtn = document.getElementById("logoutBtn")
  if (logoutBtn) {
    logoutBtn.addEventListener("click", handleLogout)
  }

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
    if (includeAdjacentCheckboxMobile) {
      includeAdjacentCheckboxMobile.checked = includeAdjacent
    }
    currentPage = 1
    loadAdsAndUpdateUrl()
  })
  
  // Mobile adjacent checkbox
  if (includeAdjacentCheckboxMobile) {
    includeAdjacentCheckboxMobile.addEventListener("change", () => {
      includeAdjacent = includeAdjacentCheckboxMobile.checked
      includeAdjacentCheckbox.checked = includeAdjacent
      currentPage = 1
      loadAdsAndUpdateUrl()
    })
  }

  // Category filter
  categorySelect.addEventListener("change", () => {
    const value = categorySelect.value
    // Handle "category:subcategory" format for subcategories
    if (value.includes(":")) {
      const [cat, sub] = value.split(":")
      currentCategory = cat
      currentSubcategory = sub
    } else {
      currentCategory = value
      currentSubcategory = ""
    }
    currentPage = 1
    showBrowseView()
    loadAdsAndUpdateUrl()
    renderCategoryGrid()
    updateCategoryButtonStyles()
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

// Auth functions are now in utils.js

async function handleForgotPassword(e) {
  e.preventDefault()
  const email = document.getElementById("forgotPasswordEmail").value

  try {
    const res = await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    })

    const data = await res.json()

    if (res.ok) {
      closeModal("forgotPasswordModal")
      document.getElementById("forgotPasswordForm").reset()
      showAlert(data.message, "success")
    } else {
      showAlert(data.error, "error")
    }
  } catch {
    showAlert("Något gick fel", "error")
  }
}

// Categories
async function loadCategories() {
  try {
    const res = await fetch("/api/categories")
    const data = await res.json()
    categoriesConfig = data.categoriesConfig || []

    // Build category select dropdown:
    // - "Alla kategorier" first
    // - For categories with subcategories: show "Alla <category>" + each subcategory (with indentation)
    // - For categories without subcategories: show the category itself
    let selectHtml = '<option value="">Alla kategorier</option>'
    
    categoriesConfig.forEach((cat) => {
      if (cat.subcategories && cat.subcategories.length > 0) {
        // Category has subcategories
        selectHtml += `<option value="${escapeHtml(cat.slug)}">Alla ${escapeHtml(cat.name)}</option>`
        cat.subcategories.forEach((sub) => {
          // Use special value format for subcategories: "category:subcategory"
          selectHtml += `<option value="${escapeHtml(cat.slug)}:${escapeHtml(sub.slug)}">  ${escapeHtml(sub.name)}</option>`
        })
      } else {
        // Category without subcategories
        selectHtml += `<option value="${escapeHtml(cat.slug)}">${escapeHtml(cat.name)}</option>`
      }
    })
    
    categorySelect.innerHTML = selectHtml
    
    // Render category grid based on current state
    renderCategoryGrid()
  } catch (err) {
    console.error("Failed to load categories:", err)
  }
}

function renderCategoryGrid() {
  let gridHtml = ""
  
  // Check if we're viewing a specific category with subcategories
  const selectedCategory = categoriesConfig.find(c => c.slug === currentCategory)
  const isViewingCategoryWithSubs = selectedCategory && selectedCategory.subcategories && selectedCategory.subcategories.length > 0
  
  if (isViewingCategoryWithSubs) {
    // Show "Alla kategorier" button to go back
    gridHtml += `
      <div class="category-btn px-3 py-2 rounded text-center cursor-pointer transition-all text-sm text-stone-600 hover:text-primary hover:bg-stone-100" data-category="" data-subcategory="" onclick="clearCategoryFilter()">
        📋 Alla kategorier
      </div>
    `
    
    // Show "Alla <category>" button
    gridHtml += `
      <div class="category-btn px-3 py-2 rounded text-center cursor-pointer transition-all text-sm text-stone-600 hover:text-primary hover:bg-stone-100" data-category="${escapeHtml(selectedCategory.slug)}" data-subcategory="" onclick="filterByCategory('${escapeHtml(selectedCategory.slug)}')">
        ${selectedCategory.icon || '📦'} Alla ${escapeHtml(selectedCategory.name)}
      </div>
    `
    
    // Show all subcategories
    selectedCategory.subcategories.forEach((sub) => {
      gridHtml += `
        <div class="category-btn px-3 py-2 rounded text-center cursor-pointer transition-all text-sm text-stone-600 hover:text-primary hover:bg-stone-100" data-category="${escapeHtml(selectedCategory.slug)}" data-subcategory="${escapeHtml(sub.slug)}" onclick="filterBySubcategory('${escapeHtml(selectedCategory.slug)}', '${escapeHtml(sub.slug)}')">
          ${selectedCategory.icon || '📦'} ${escapeHtml(sub.name)}
        </div>
      `
    })
  } else {
    // Show all main categories (default view)
    categoriesConfig.forEach((cat) => {
      gridHtml += `
        <div class="category-btn px-3 py-2 rounded text-center cursor-pointer transition-all text-sm text-stone-600 hover:text-primary hover:bg-stone-100" data-category="${escapeHtml(cat.slug)}" data-subcategory="" onclick="filterByCategory('${escapeHtml(cat.slug)}')">
          ${cat.icon || '📦'} ${escapeHtml(cat.name)}
        </div>
      `
    })
  }
  
  categoryGrid.innerHTML = gridHtml
  
  // Update category button styles to show current selection
  updateCategoryButtonStyles()
}

function updateCategoryButtonStyles() {
  const buttons = document.querySelectorAll(".category-btn")
  buttons.forEach((btn) => {
    const btnCategory = btn.dataset.category
    const btnSubcategory = btn.dataset.subcategory || ""
    const isSelected = btnCategory === currentCategory && btnSubcategory === currentSubcategory
    
    // Remove previous selection styling
    btn.classList.remove("text-primary", "font-semibold", "bg-stone-100")
    
    if (isSelected) {
      // Selected button gets subtle highlight
      btn.classList.add("text-primary", "font-semibold", "bg-stone-100")
    }
  })
}

// Counties
async function loadCounties() {
  try {
    const res = await fetch("/api/counties")
    const data = await res.json()
    countiesConfig = data.countiesConfig || []
    adjacentCountiesConfig = data.adjacentCountiesConfig || {}

    // Populate county filter select (value is slug, display is name)
    const options = countiesConfig.map((county) => `<option value="${escapeHtml(county.slug)}">${escapeHtml(county.name)}</option>`).join("")
    countySelect.innerHTML = '<option value="">Alla län</option>' + options
  } catch (err) {
    console.error("Failed to load counties:", err)
  }
}

function getCategoryIcon(categorySlug) {
  const cat = categoriesConfig.find(c => c.slug === categorySlug)
  return cat?.icon || "📦"
}

function getCategoryName(categorySlug) {
  const cat = categoriesConfig.find(c => c.slug === categorySlug)
  return cat?.name || categorySlug
}

function getSubcategoryName(categorySlug, subcategorySlug) {
  const cat = categoriesConfig.find(c => c.slug === categorySlug)
  const sub = cat?.subcategories?.find(s => s.slug === subcategorySlug)
  return sub?.name || subcategorySlug
}

function getCountyName(countySlug) {
  const county = countiesConfig.find(c => c.slug === countySlug)
  return county?.name || countySlug
}

function filterByCategory(categorySlug) {
  currentCategory = categorySlug
  currentSubcategory = ""
  categorySelect.value = categorySlug
  currentPage = 1
  showBrowseView()
  loadAdsAndUpdateUrl()
  // Display "Alla <category>" for categories with subcategories
  const cat = categoriesConfig.find(c => c.slug === categorySlug)
  if (cat?.subcategories && cat.subcategories.length > 0) {
    document.getElementById("adsTitle").textContent = `Alla ${getCategoryName(categorySlug)}`
  } else {
    document.getElementById("adsTitle").textContent = getCategoryName(categorySlug)
  }
  renderCategoryGrid()
  updateCategoryButtonStyles()
}

function filterBySubcategory(categorySlug, subcategorySlug) {
  currentCategory = categorySlug
  currentSubcategory = subcategorySlug
  categorySelect.value = `${categorySlug}:${subcategorySlug}`
  currentPage = 1
  showBrowseView()
  loadAdsAndUpdateUrl()
  // Display the subcategory name
  document.getElementById("adsTitle").textContent = getSubcategoryName(categorySlug, subcategorySlug)
  renderCategoryGrid()
  updateCategoryButtonStyles()
}

function clearCategoryFilter() {
  currentCategory = ""
  currentSubcategory = ""
  categorySelect.value = ""
  currentPage = 1
  loadAdsAndUpdateUrl()
  document.getElementById("adsTitle").textContent = "Senaste annonser"
  renderCategoryGrid()
  updateCategoryButtonStyles()
}

// URL State Management
function loadStateFromUrl() {
  const params = new URLSearchParams(window.location.search)
  
  currentSearch = params.get("search") || ""
  currentCategory = params.get("category") || ""
  currentSubcategory = params.get("subcategory") || ""
  currentCounty = params.get("county") || ""
  includeAdjacent = params.get("adjacent") === "true"
  currentSort = params.get("sort") || DEFAULT_SORT
  currentPage = parseInt(params.get("page"), 10) || 1
  
  // Update UI elements to reflect state
  searchInput.value = currentSearch
  // Set category select value (format: "category" or "category:subcategory")
  if (currentSubcategory) {
    categorySelect.value = `${currentCategory}:${currentSubcategory}`
  } else {
    categorySelect.value = currentCategory
  }
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
  if (currentSubcategory) params.set("subcategory", currentSubcategory)
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
    if (currentSubcategory) params.append("subcategory", currentSubcategory)
    if (currentSearch) params.append("search", currentSearch)
    if (currentSort) params.append("sort", currentSort)

    const res = await fetch(`/api/ads?${params}`)
    const data = await res.json()

    renderAds(data.ads)
    renderPagination(data.pagination)

    // Update title - use display names, not slugs
    if (currentSearch) {
      document.getElementById("adsTitle").textContent = `Sökresultat för "${currentSearch}"`
    } else if (currentCounty) {
      const adjacentText = includeAdjacent ? " + angränsande" : ""
      document.getElementById("adsTitle").textContent = `Annonser i ${getCountyName(currentCounty)}${adjacentText}`
    } else if (currentSubcategory) {
      document.getElementById("adsTitle").textContent = getSubcategoryName(currentCategory, currentSubcategory)
    } else if (currentCategory) {
      const cat = categoriesConfig.find(c => c.slug === currentCategory)
      if (cat?.subcategories && cat.subcategories.length > 0) {
        document.getElementById("adsTitle").textContent = `Alla ${getCategoryName(currentCategory)}`
      } else {
        document.getElementById("adsTitle").textContent = getCategoryName(currentCategory)
      }
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
          // Use display names from API (_name fields), fallback to slug
          const categoryDisplay = ad.category_name || ad.category
          const countyDisplay = ad.county_name || ad.county
          return `
      <div class="overflow-hidden cursor-pointer transition-all hover:bg-stone-100 flex py-2" onclick="openAdDetail(${ad.id})">
        ${
          safeImageUrl
            ? `<div class="w-24 h-24 flex-shrink-0 rounded overflow-hidden"><img src="${safeImageUrl}" alt="${escapeHtml(ad.title)}" class="w-full h-full object-cover"></div>`
            : '<div class="w-24 h-24 flex-shrink-0 bg-stone-200 rounded flex items-center justify-center text-stone-400 text-3xl">📦</div>'
        }
        <div class="p-3 flex-1 min-w-0">
          <div class="text-base font-semibold mb-1 whitespace-nowrap overflow-hidden text-ellipsis">${escapeHtml(ad.title)}</div>
          <div class="text-lg text-primary font-bold mb-1">${formatPrice(ad.price)}</div>
          <div class="text-sm text-stone-500">
            ${escapeHtml(categoryDisplay)}${countyDisplay ? " • " + escapeHtml(countyDisplay) : ""} • ${formatRelativeTime(ad.created_at)}
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
          // Use display names from API (_name fields), fallback to slug
          const categoryDisplay = ad.category_name || ad.category
          const countyDisplay = ad.county_name || ad.county
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
            ${escapeHtml(categoryDisplay)}${countyDisplay ? " • " + escapeHtml(countyDisplay) : ""} • ${formatRelativeTime(ad.created_at)}
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

// Modal and utility functions are now in utils.js

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
  const hasFilters = currentSearch || currentCategory || currentSubcategory || currentCounty
  
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

// showAlert is now in utils.js

// Make functions available globally for onclick handlers
window.filterByCategory = filterByCategory
window.filterBySubcategory = filterBySubcategory
window.clearCategoryFilter = clearCategoryFilter
window.openAdDetail = openAdDetail
window.goToPage = goToPage
window.openModal = openModal
window.closeModal = closeModal
window.openReportModal = openReportModal
window.startConversation = startConversation
window.setViewMode = setViewMode
window.showBrowseView = showBrowseView

// Conversation/Chat functions
// Note: Most chat logic is now in messages.js for the dedicated messages page.
// app.js only handles starting a new conversation from an ad.

async function startConversation(adId) {
  try {
    const res = await fetch(`/api/ads/${adId}/conversation`, {
      method: "POST",
    })

    const data = await res.json()

    if (res.ok) {
      // Redirect to messages page with the new conversation open
      window.location.href = `/meddelanden?id=${data.conversation_id}`
    } else {
      showAlert(data.error, "error")
    }
  } catch {
    showAlert("Något gick fel", "error")
  }
}

// formatDateTime is now in utils.js
