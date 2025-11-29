// Beggy - Edit Ad Page JavaScript

// State
let currentUser = null
let currentAdId = null
let currentAd = null
let categories = []
let counties = []
let selectedImages = []
let existingImages = []
let currentConversationId = null
const MAX_IMAGES = 5

// DOM Elements
const adCategorySelect = document.getElementById("adCategory")
const adCountySelect = document.getElementById("adCounty")
const imageInput = document.getElementById("adImages")
const imagePreviewContainer = document.getElementById("imagePreviewContainer")
const existingImagesContainer = document.getElementById("existingImagesContainer")

// Initialize
document.addEventListener("DOMContentLoaded", () => {
  // Get ad ID from URL
  const pathParts = window.location.pathname.split("/")
  currentAdId = parseInt(pathParts[2]) // /annons/:id/redigera
  
  if (!currentAdId || isNaN(currentAdId)) {
    showError("Ogiltig annons-ID")
    return
  }

  // Update back link
  document.getElementById("backLink").href = `/annons/${currentAdId}`

  checkAuth()
  loadCategories()
  loadCounties()
  setupEventListeners()
})

function showError(message) {
  document.getElementById("loadingContainer").classList.add("hidden")
  document.getElementById("editAdContainer").classList.add("hidden")
  document.getElementById("loginPrompt").classList.add("hidden")
  document.getElementById("errorContainer").classList.remove("hidden")
  document.getElementById("errorMessage").textContent = message
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

  // Edit ad form
  document.getElementById("editAdForm").addEventListener("submit", handleEditAd)

  // Image preview
  imageInput.addEventListener("change", handleImageSelect)

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
      loadAdForEdit()
    } else {
      // Not logged in
      document.getElementById("loadingContainer").classList.add("hidden")
      document.getElementById("loginPrompt").classList.remove("hidden")
    }
  } catch {
    // Not logged in
    document.getElementById("loadingContainer").classList.add("hidden")
    document.getElementById("loginPrompt").classList.remove("hidden")
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
    window.location.href = "/"
  } catch {
    showAlert("Något gick fel", "error")
  }
}

// Load Ad for Editing
async function loadAdForEdit() {
  try {
    const res = await fetch(`/api/ads/${currentAdId}`)
    
    if (!res.ok) {
      showError("Annonsen hittades inte")
      return
    }

    const ad = await res.json()
    
    // Check ownership
    if (ad.user_id !== currentUser.id) {
      showError("Du har inte behörighet att redigera denna annons")
      return
    }

    currentAd = ad
    existingImages = ad.images || []

    // Update page title
    document.title = `Redigera: ${ad.title} - Beggy`

    // Show edit form
    document.getElementById("loadingContainer").classList.add("hidden")
    document.getElementById("editAdContainer").classList.remove("hidden")

    // Populate form (wait for categories/counties to load)
    setTimeout(() => populateForm(ad), 100)
  } catch (err) {
    showError("Kunde inte ladda annonsen")
  }
}

function populateForm(ad) {
  document.getElementById("adTitle").value = ad.title || ""
  document.getElementById("adPrice").value = ad.price || 0
  document.getElementById("adDescription").value = ad.description || ""
  document.getElementById("adContactPhone").value = ad.seller_contact_phone || ""
  document.getElementById("adContactEmail").value = ad.seller_contact_email || ""
  
  // Set category (may need to wait for options to load)
  if (adCategorySelect.options.length > 1) {
    adCategorySelect.value = ad.category || ""
  } else {
    setTimeout(() => { adCategorySelect.value = ad.category || "" }, 200)
  }
  
  // Set county
  if (adCountySelect.options.length > 1) {
    adCountySelect.value = ad.county || ""
  } else {
    setTimeout(() => { adCountySelect.value = ad.county || "" }, 200)
  }

  // Show existing images
  renderExistingImages()
  updateImageHelpText()
}

function renderExistingImages() {
  if (existingImages.length === 0) {
    document.getElementById("existingImagesSection").classList.add("hidden")
    return
  }

  document.getElementById("existingImagesSection").classList.remove("hidden")
  existingImagesContainer.innerHTML = existingImages
    .map((img) => `
      <div class="relative">
        <img src="${img.url}" alt="Bild" class="w-20 h-20 object-cover rounded">
        <button type="button" onclick="deleteExistingImage(${img.id})" class="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 text-xs hover:bg-red-600">&times;</button>
      </div>
    `)
    .join("")
}

async function deleteExistingImage(imageId) {
  if (!confirm("Är du säker på att du vill radera denna bild?")) return

  try {
    const res = await fetch(`/api/images/${imageId}`, { method: "DELETE" })

    if (res.ok) {
      existingImages = existingImages.filter(img => img.id !== imageId)
      renderExistingImages()
      updateImageHelpText()
      showAlert("Bild raderad", "success")
    } else {
      showAlert("Kunde inte radera bilden", "error")
    }
  } catch {
    showAlert("Något gick fel", "error")
  }
}

function updateImageHelpText() {
  const remainingSlots = MAX_IMAGES - existingImages.length
  const helpText = document.getElementById("imageHelpText")
  
  if (remainingSlots <= 0) {
    helpText.textContent = "Max antal bilder uppnått. Radera en befintlig bild för att lägga till fler."
    imageInput.disabled = true
  } else {
    helpText.textContent = `Välj upp till ${remainingSlots} nya bild${remainingSlots !== 1 ? "er" : ""}.`
    imageInput.disabled = false
  }
}

// Categories
async function loadCategories() {
  try {
    const res = await fetch("/api/categories")
    const data = await res.json()
    categories = data.categories

    // Populate category select
    const options = categories.map((cat) => `<option value="${cat}">${cat}</option>`).join("")
    adCategorySelect.innerHTML = '<option value="">Välj kategori</option>' + options
    
    // Set current value if ad is loaded
    if (currentAd) {
      adCategorySelect.value = currentAd.category || ""
    }
  } catch (err) {
    console.error("Failed to load categories:", err)
  }
}

// Counties
async function loadCounties() {
  try {
    const res = await fetch("/api/counties")
    const data = await res.json()
    counties = data.counties

    // Populate county select (escape HTML to prevent XSS)
    const options = counties.map((county) => `<option value="${escapeHtml(county)}">${escapeHtml(county)}</option>`).join("")
    adCountySelect.innerHTML = '<option value="">Välj län</option>' + options
    
    // Set current value if ad is loaded
    if (currentAd) {
      adCountySelect.value = currentAd.county || ""
    }
  } catch (err) {
    console.error("Failed to load counties:", err)
  }
}

// Image handling
function handleImageSelect(e) {
  const files = Array.from(e.target.files)
  const remainingSlots = MAX_IMAGES - existingImages.length
  
  // Limit to remaining slots
  if (files.length > remainingSlots) {
    showAlert(`Du kan max lägga till ${remainingSlots} nya bild${remainingSlots !== 1 ? "er" : ""}`, "error")
    e.target.value = ""
    return
  }
  
  selectedImages = files.slice(0, remainingSlots)
  
  // Show preview
  imagePreviewContainer.innerHTML = ""
  selectedImages.forEach((file, index) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const preview = document.createElement("div")
      preview.className = "relative"
      preview.innerHTML = `
        <img src="${e.target.result}" alt="Preview" class="w-20 h-20 object-cover rounded">
        <button type="button" onclick="removeNewImage(${index})" class="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 text-xs hover:bg-red-600">&times;</button>
      `
      imagePreviewContainer.appendChild(preview)
    }
    reader.readAsDataURL(file)
  })
}

function removeNewImage(index) {
  selectedImages.splice(index, 1)
  
  // Update file input
  const dataTransfer = new DataTransfer()
  selectedImages.forEach(file => dataTransfer.items.add(file))
  imageInput.files = dataTransfer.files
  
  // Refresh preview
  handleImageSelect({ target: imageInput })
}

// Edit Ad
async function handleEditAd(e) {
  e.preventDefault()

  const updates = {
    title: document.getElementById("adTitle").value,
    category: document.getElementById("adCategory").value,
    price: parseInt(document.getElementById("adPrice").value),
    county: document.getElementById("adCounty").value,
    description: document.getElementById("adDescription").value,
    contact_phone: document.getElementById("adContactPhone").value || null,
    contact_email: document.getElementById("adContactEmail").value || null,
  }

  try {
    // Update ad details
    const res = await fetch(`/api/ads/${currentAdId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    })

    const data = await res.json()

    if (!res.ok) {
      showAlert(data.error, "error")
      return
    }

    // Upload new images if any
    if (selectedImages.length > 0) {
      const formData = new FormData()
      selectedImages.forEach(file => formData.append("images", file))

      const imgRes = await fetch(`/api/ads/${currentAdId}/images`, {
        method: "POST",
        body: formData,
      })

      if (!imgRes.ok) {
        showAlert("Annons uppdaterad men bilderna kunde inte laddas upp", "error")
        return
      }
    }

    showAlert("Annons uppdaterad!", "success")
    
    // Redirect to the ad page
    setTimeout(() => {
      window.location.href = `/annons/${currentAdId}`
    }, 1000)
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
window.removeNewImage = removeNewImage
window.deleteExistingImage = deleteExistingImage
window.openChat = openChat
window.markAsSold = markAsSold
window.deleteAd = deleteAd
window.exportMyData = exportMyData
window.deleteMyAccount = deleteMyAccount
