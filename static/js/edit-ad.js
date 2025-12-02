// Beggy - Edit Ad Page JavaScript

// State
let currentUser = null
let currentAdId = null
let currentAd = null
let categoriesConfig = [] // Config with slug and name
let countiesConfig = [] // Config with slug and name
let selectedImages = []
let existingImages = []
const MAX_IMAGES = 5

// Promise resolvers for coordinating async loading
let categoriesLoaded = null
let countiesLoaded = null
const categoriesReadyPromise = new Promise(resolve => { categoriesLoaded = resolve })
const countiesReadyPromise = new Promise(resolve => { countiesLoaded = resolve })

// DOM Elements
const adCategorySelect = document.getElementById("adCategory")
const adSubcategorySelect = document.getElementById("adSubcategory")
const subcategoryContainer = document.getElementById("subcategoryContainer")
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
  if (currentUser) {
    // User is logged in - set body class
    document.body.classList.add("user-logged-in")
    document.body.classList.remove("user-logged-out")
  } else {
    // User is logged out - set body class
    document.body.classList.add("user-logged-out")
    document.body.classList.remove("user-logged-in")
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

    // Populate form (will wait for categories/counties to load)
    await populateForm(ad)
  } catch (err) {
    showError("Kunde inte ladda annonsen")
  }
}

async function populateForm(ad) {
  document.getElementById("adTitle").value = ad.title || ""
  document.getElementById("adPrice").value = ad.price || 0
  document.getElementById("adDescription").value = ad.description || ""
  
  // Set contact method checkboxes and inputs
  const allowMessages = ad.allow_messages !== false // default to true
  document.getElementById("adAllowMessages").checked = allowMessages
  
  const hasPhone = !!ad.seller_contact_phone
  document.getElementById("adUsePhone").checked = hasPhone
  document.getElementById("adContactPhone").value = ad.seller_contact_phone || ""
  document.getElementById("adContactPhone").disabled = !hasPhone
  
  // Wait for categories and counties to be loaded before setting values
  await Promise.all([categoriesReadyPromise, countiesReadyPromise])
  
  // Set category (options should now be loaded)
  adCategorySelect.value = ad.category || ""
  handleCategoryChange()
  // Set subcategory after category change handler populates the subcategory options
  if (ad.subcategory && adSubcategorySelect) {
    adSubcategorySelect.value = ad.subcategory
  }
  
  // Set county (options should now be loaded)
  adCountySelect.value = ad.county || ""

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
    categoriesConfig = data.categoriesConfig || []

    // Populate category select (value is slug, display is name)
    const options = categoriesConfig.map((cat) => `<option value="${escapeHtml(cat.slug)}">${escapeHtml(cat.name)}</option>`).join("")
    adCategorySelect.innerHTML = '<option value="">Välj kategori</option>' + options
    
    // Add change handler for category to show subcategories
    adCategorySelect.addEventListener("change", handleCategoryChange)
    
    // Signal that categories are ready (populateForm will set the values)
    if (categoriesLoaded) categoriesLoaded()
  } catch (err) {
    console.error("Failed to load categories:", err)
    if (categoriesLoaded) categoriesLoaded() // Resolve even on error to prevent deadlock
  }
}

// Handle category change to show/hide subcategories
function handleCategoryChange() {
  const selectedCategorySlug = adCategorySelect.value
  const categoryConfig = categoriesConfig.find(c => c.slug === selectedCategorySlug)
  
  if (categoryConfig && categoryConfig.subcategories && categoryConfig.subcategories.length > 0) {
    // Show subcategory container and populate options (value is slug, display is name)
    subcategoryContainer.classList.remove("hidden")
    const options = categoryConfig.subcategories.map(
      sub => `<option value="${escapeHtml(sub.slug)}">${escapeHtml(sub.name)}</option>`
    ).join("")
    adSubcategorySelect.innerHTML = '<option value="">Välj underkategori (valfritt)</option>' + options
  } else {
    // Hide subcategory container
    subcategoryContainer.classList.add("hidden")
    adSubcategorySelect.value = ""
  }
}

// Counties
async function loadCounties() {
  try {
    const res = await fetch("/api/counties")
    const data = await res.json()
    countiesConfig = data.countiesConfig || []

    // Populate county select (value is slug, display is name)
    const options = countiesConfig.map((county) => `<option value="${escapeHtml(county.slug)}">${escapeHtml(county.name)}</option>`).join("")
    adCountySelect.innerHTML = '<option value="">Välj län</option>' + options
    
    // Signal that counties are ready (populateForm will set the values)
    if (countiesLoaded) countiesLoaded()
  } catch (err) {
    console.error("Failed to load counties:", err)
    if (countiesLoaded) countiesLoaded() // Resolve even on error to prevent deadlock
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

// Toggle phone input based on checkbox
function togglePhoneInput() {
  const checkbox = document.getElementById("adUsePhone")
  const input = document.getElementById("adContactPhone")
  input.disabled = !checkbox.checked
  if (!checkbox.checked) {
    input.value = ""
  }
}

// Edit Ad
async function handleEditAd(e) {
  e.preventDefault()

  const allowMessages = document.getElementById("adAllowMessages").checked
  const usePhone = document.getElementById("adUsePhone").checked
  const contactPhoneRaw = usePhone ? document.getElementById("adContactPhone").value.trim() : null
  const contactPhone = contactPhoneRaw || null

  // Validate at least one contact method
  if (!allowMessages && !contactPhone) {
    showAlert("Du måste välja minst ett kontaktsätt", "error")
    return
  }

  // Validate phone number if enabled
  if (usePhone && !contactPhone) {
    showAlert("Ange ett telefonnummer eller avmarkera telefon", "error")
    return
  }

  const subcategory = document.getElementById("adSubcategory")?.value || null

  const updates = {
    title: document.getElementById("adTitle").value,
    category: document.getElementById("adCategory").value,
    subcategory: subcategory,
    price: parseInt(document.getElementById("adPrice").value),
    county: document.getElementById("adCounty").value,
    description: document.getElementById("adDescription").value,
    allow_messages: allowMessages,
    contact_phone: contactPhone,
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
window.togglePhoneInput = togglePhoneInput
