// Beggy - Shared Frontend Utilities
// This module provides common utility functions used across all pages

/**
 * Escape HTML special characters to prevent XSS attacks.
 * @param {string} text - The text to escape
 * @returns {string} - The escaped text
 */
export function escapeHtml(text) {
  if (!text) return ""
  const div = document.createElement("div")
  div.textContent = text
  return div.innerHTML
}

/**
 * Sanitize a URL to only allow http(s) protocols.
 * @param {string} url - The URL to sanitize
 * @returns {string} - The sanitized URL or empty string if invalid
 */
export function sanitizeUrl(url) {
  if (!url) return ""
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

/**
 * Format a price in Swedish kronor.
 * @param {number} price - The price to format
 * @returns {string} - The formatted price
 */
export function formatPrice(price) {
  return new Intl.NumberFormat("sv-SE", {
    style: "currency",
    currency: "SEK",
    minimumFractionDigits: 0,
  }).format(price)
}

/**
 * Format a date in Swedish format.
 * @param {string} dateString - The date string to format
 * @returns {string} - The formatted date
 */
export function formatDate(dateString) {
  return new Intl.DateTimeFormat("sv-SE", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(dateString))
}

/**
 * Format a date with time in Swedish format.
 * @param {string} dateString - The date string to format
 * @returns {string} - The formatted date and time
 */
export function formatDateTime(dateString) {
  return new Intl.DateTimeFormat("sv-SE", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(dateString))
}

/**
 * Format a relative time (e.g., "5 minutes ago").
 * @param {string} dateString - The date string to format
 * @returns {string} - The relative time
 */
export function formatRelativeTime(dateString) {
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

/**
 * Show an alert message.
 * @param {string} message - The message to show
 * @param {string} type - The type of alert ("success" or "error")
 */
export function showAlert(message, type) {
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

/**
 * Open a modal by ID.
 * @param {string} id - The modal element ID
 */
export function openModal(id) {
  const modal = document.getElementById(id)
  if (modal) {
    modal.classList.remove("hidden")
    modal.classList.add("block")
  }
}

/**
 * Close a modal by ID.
 * @param {string} id - The modal element ID
 */
export function closeModal(id) {
  const modal = document.getElementById(id)
  if (modal) {
    modal.classList.add("hidden")
    modal.classList.remove("block")
  }
}

/**
 * Update authentication UI based on current user state.
 * @param {object|null} currentUser - The current user object or null
 */
export function updateAuthUI(currentUser) {
  const loggedOutNav = document.querySelector(".nav:not(.nav-logged-in)")
  const loggedInNav = document.querySelector(".nav-logged-in")

  if (currentUser) {
    loggedOutNav?.classList.add("hidden")
    loggedOutNav?.classList.remove("flex")
    loggedInNav?.classList.remove("hidden")
    loggedInNav?.classList.add("flex")
  } else {
    loggedOutNav?.classList.remove("hidden")
    loggedOutNav?.classList.add("flex")
    loggedInNav?.classList.add("hidden")
    loggedInNav?.classList.remove("flex")
  }
}

/**
 * Check if the user is authenticated.
 * @returns {Promise<object|null>} - The user object or null
 */
export async function checkAuth() {
  try {
    const res = await fetch("/api/auth/me")
    if (res.ok) {
      return await res.json()
    }
  } catch {
    // Not logged in
  }
  return null
}

/**
 * Handle login form submission.
 * @param {Event} e - The form submit event
 * @param {Function} onSuccess - Callback on successful login
 */
export async function handleLogin(e, onSuccess) {
  e.preventDefault()
  const email = document.getElementById("loginEmail")?.value
  const password = document.getElementById("loginPassword")?.value

  try {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    })

    const data = await res.json()

    if (res.ok) {
      closeModal("loginModal")
      document.getElementById("loginForm")?.reset()
      showAlert("Välkommen tillbaka!", "success")
      if (onSuccess) onSuccess()
    } else {
      showAlert(data.error, "error")
    }
  } catch {
    showAlert("Något gick fel", "error")
  }
}

/**
 * Handle register form submission.
 * @param {Event} e - The form submit event
 */
export async function handleRegister(e) {
  e.preventDefault()
  const username = document.getElementById("regUsername")?.value
  const email = document.getElementById("regEmail")?.value
  const password = document.getElementById("regPassword")?.value

  try {
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, email, password }),
    })

    const data = await res.json()

    if (res.ok) {
      closeModal("registerModal")
      document.getElementById("registerForm")?.reset()
      openModal("loginModal")
      showAlert("Konto skapat! Logga in för att fortsätta.", "success")
    } else {
      showAlert(data.error, "error")
    }
  } catch {
    showAlert("Något gick fel", "error")
  }
}

/**
 * Handle logout.
 * @param {Event} e - The click event
 * @param {Function} onSuccess - Callback on successful logout
 */
export async function handleLogout(e, onSuccess) {
  e.preventDefault()
  try {
    await fetch("/api/auth/logout", { method: "POST" })
    showAlert("Du har loggats ut", "success")
    if (onSuccess) onSuccess()
  } catch {
    showAlert("Något gick fel", "error")
  }
}

/**
 * Set up common modal event listeners.
 */
export function setupModalListeners() {
  // Close modals on outside click
  window.addEventListener("click", (e) => {
    if (e.target.classList?.contains("modal")) {
      e.target.classList.add("hidden")
      e.target.classList.remove("block")
    }
  })
}

/**
 * Set up common auth event listeners.
 * @param {Function} checkAuthCallback - Callback to re-check auth after login
 */
export function setupAuthListeners(checkAuthCallback) {
  // Login button
  document.getElementById("loginBtn")?.addEventListener("click", (e) => {
    e.preventDefault()
    openModal("loginModal")
  })

  // Login form
  document.getElementById("loginForm")?.addEventListener("submit", (e) => {
    handleLogin(e, checkAuthCallback)
  })

  // Show register link
  document.getElementById("showRegister")?.addEventListener("click", (e) => {
    e.preventDefault()
    closeModal("loginModal")
    openModal("registerModal")
  })

  // Show login link
  document.getElementById("showLogin")?.addEventListener("click", (e) => {
    e.preventDefault()
    closeModal("registerModal")
    openModal("loginModal")
  })

  // Register form
  document.getElementById("registerForm")?.addEventListener("submit", handleRegister)

  // Logout button
  document.getElementById("logoutBtn")?.addEventListener("click", (e) => {
    handleLogout(e, checkAuthCallback)
  })
}

// Make common functions globally available for onclick handlers in HTML
window.openModal = openModal
window.closeModal = closeModal
