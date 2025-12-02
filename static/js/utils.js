// Beggy - Shared JavaScript utilities
// This module contains common functions used across multiple pages

// ===========================
// Authentication Functions
// ===========================

// Make currentUser globally accessible
window.currentUser = null

// Getter/setter for currentUser to keep window.currentUser in sync
function getCurrentUser() {
  return window.currentUser
}

function setCurrentUser(user) {
  window.currentUser = user
}

async function checkAuth() {
  try {
    const res = await fetch("/api/auth/me")
    if (res.ok) {
      window.currentUser = await res.json()
    }
  } catch {
    // Not logged in - currentUser remains null
  }
  // Always update UI after checking auth
  updateAuthUI()
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
  const confirmPassword = document.getElementById("regConfirmPassword").value
  const acceptTerms = document.getElementById("regAcceptTerms").checked

  // Validate password confirmation
  if (password !== confirmPassword) {
    showAlert("Lösenorden matchar inte", "error")
    return
  }

  // Validate terms acceptance
  if (!acceptTerms) {
    showAlert("Du måste godkänna integritetspolicyn och användarvillkoren", "error")
    return
  }

  try {
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, email, password, acceptTerms }),
    })

    const data = await res.json()

    if (res.ok) {
      closeModal("registerModal")
      document.getElementById("registerForm").reset()
      openModal("registerSuccessModal")
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
    showAlert("Du har loggats ut", "success")
  } catch {
    showAlert("Något gick fel", "error")
  }
}

// ===========================
// Modal Functions
// ===========================

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

// ===========================
// HTML & URL Utility Functions
// ===========================

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

// ===========================
// Formatting Functions
// ===========================

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

// ===========================
// Alert/Notification Functions
// ===========================

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

// ===========================
// Ad State Functions
// ===========================

function getStateLabel(state) {
  switch (state) {
    case "ok":
      return "Aktiv"
    case "sold":
      return "Såld"
    case "inactive":
      return "Inaktiv"
    default:
      return state
  }
}

// Make functions globally available for onclick handlers in HTML
window.openModal = openModal
window.closeModal = closeModal
