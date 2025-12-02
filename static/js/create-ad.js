// Beggy - Create Ad Page JavaScript

// State
// Note: currentUser is defined in utils.js as window.currentUser
let categoriesConfig = [] // Config with slug and name
let countiesConfig = [] // Config with slug and name
let selectedImages = []

// DOM Elements
const adCategorySelect = document.getElementById("adCategory")
const adSubcategorySelect = document.getElementById("adSubcategory")
const subcategoryContainer = document.getElementById("subcategoryContainer")
const adCountySelect = document.getElementById("adCounty")
const imageInput = document.getElementById("adImages")
const imagePreviewContainer = document.getElementById("imagePreviewContainer")

// Initialize
document.addEventListener("DOMContentLoaded", () => {
  checkAuth()
  loadCategories()
  loadCounties()
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

  // Create ad
  document.getElementById("createAdForm").addEventListener("submit", handleCreateAd)

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

// Auth functions - custom implementations that manage page display
async function checkAuth() {
  try {
    const res = await fetch("/api/auth/me")
    if (res.ok) {
      window.currentUser = await res.json()
      updateAuthUI()
    }
  } catch {
    // Not logged in
  }
  updatePageDisplay()
}

function updateAuthUI() {
  if (window.currentUser) {
    // User is logged in - set body class
    document.body.classList.add("user-logged-in")
    document.body.classList.remove("user-logged-out")
  } else {
    // User is logged out - set body class
    document.body.classList.add("user-logged-out")
    document.body.classList.remove("user-logged-in")
  }
}

function updatePageDisplay() {
  const loginPrompt = document.getElementById("loginPrompt")
  const createAdContainer = document.getElementById("createAdContainer")
  
  if (window.currentUser) {
    loginPrompt.classList.add("hidden")
    createAdContainer.classList.remove("hidden")
  } else {
    loginPrompt.classList.remove("hidden")
    createAdContainer.classList.add("hidden")
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
    window.currentUser = null
    updateAuthUI()
    updatePageDisplay()
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
    categoriesConfig = data.categoriesConfig || []

    // Populate category select (value is slug, display is name)
    const options = categoriesConfig.map((cat) => `<option value="${escapeHtml(cat.slug)}">${escapeHtml(cat.name)}</option>`).join("")
    adCategorySelect.innerHTML = '<option value="">Välj kategori</option>' + options
    
    // Add change handler for category to show subcategories
    adCategorySelect.addEventListener("change", handleCategoryChange)
  } catch (err) {
    console.error("Failed to load categories:", err)
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
  } catch (err) {
    console.error("Failed to load counties:", err)
  }
}

// Image handling
function handleImageSelect(e) {
  const files = Array.from(e.target.files)
  
  // Limit to 5 images
  if (files.length > 5) {
    showAlert("Du kan max välja 5 bilder", "error")
    e.target.value = ""
    return
  }
  
  selectedImages = files.slice(0, 5)
  
  // Show preview
  imagePreviewContainer.innerHTML = ""
  selectedImages.forEach((file, index) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const preview = document.createElement("div")
      preview.className = "relative"
      preview.innerHTML = `
        <img src="${e.target.result}" alt="Preview" class="w-20 h-20 object-cover rounded">
        <button type="button" onclick="removeImage(${index})" class="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 text-xs hover:bg-red-600">&times;</button>
      `
      imagePreviewContainer.appendChild(preview)
    }
    reader.readAsDataURL(file)
  })
}

function removeImage(index) {
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

// Create Ad
async function handleCreateAd(e) {
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

  const ad = {
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
    // First create the ad
    const res = await fetch("/api/ads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(ad),
    })

    const data = await res.json()

    if (!res.ok) {
      showAlert(data.error, "error")
      return
    }

    const adId = data.id

    // Upload images if any
    if (selectedImages.length > 0) {
      const formData = new FormData()
      selectedImages.forEach(file => formData.append("images", file))

      const imgRes = await fetch(`/api/ads/${adId}/images`, {
        method: "POST",
        body: formData,
      })

      if (!imgRes.ok) {
        showAlert("Annons skapad men bilderna kunde inte laddas upp", "error")
      }
    }

    showAlert("Annons skapad!", "success")
    
    // Redirect to the ad page
    setTimeout(() => {
      window.location.href = `/annons/${adId}`
    }, 1000)
  } catch {
    showAlert("Något gick fel", "error")
  }
}

// Modal and utility functions are now in utils.js

// Make functions available globally for onclick handlers
window.removeImage = removeImage
window.togglePhoneInput = togglePhoneInput
