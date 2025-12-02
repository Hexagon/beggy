// Beggy - Settings Page JavaScript

// State
// Note: window.currentUser is defined in utils.js as window.currentUser

// Initialize
document.addEventListener("DOMContentLoaded", () => {
  checkAuth()
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

  // Change password
  document.getElementById("changePasswordForm").addEventListener("submit", handleChangePassword)

  // Logout
  document.getElementById("logoutBtn").addEventListener("click", handleLogout)

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
  const settingsContainer = document.getElementById("settingsContainer")
  
  if (window.currentUser) {
    loginPrompt.classList.add("hidden")
    settingsContainer.classList.remove("hidden")
  } else {
    loginPrompt.classList.remove("hidden")
    settingsContainer.classList.add("hidden")
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

  // Validate password confirmation
  if (password !== confirmPassword) {
    showAlert("Lösenorden matchar inte", "error")
    return
  }

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
    updatePageDisplay()
    showAlert("Du har loggats ut", "success")
  } catch {
    showAlert("Något gick fel", "error")
  }
}

async function handleChangePassword(e) {
  e.preventDefault()
  const currentPassword = document.getElementById("currentPassword").value
  const newPassword = document.getElementById("newPassword").value
  const confirmNewPassword = document.getElementById("confirmNewPassword").value

  // Validate password confirmation
  if (newPassword !== confirmNewPassword) {
    showAlert("De nya lösenorden matchar inte", "error")
    return
  }

  if (newPassword.length < 8) {
    showAlert("Lösenordet måste vara minst 8 tecken", "error")
    return
  }

  try {
    const res = await fetch("/api/auth/change-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword, newPassword }),
    })

    const data = await res.json()

    if (res.ok) {
      document.getElementById("changePasswordForm").reset()
      showAlert("Lösenordet har uppdaterats!", "success")
    } else {
      showAlert(data.error, "error")
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
      window.currentUser = null
      updateAuthUI()
      showAlert("Ditt konto har raderats", "success")
      window.location.href = "/"
    } else {
      showAlert("Kunde inte radera konto", "error")
    }
  } catch {
    showAlert("Något gick fel", "error")
  }
}

// Utility functions (openModal, closeModal, escapeHtml, showAlert, etc.) are now in utils.js

// Make functions available globally for onclick handlers
window.openModal = openModal
window.closeModal = closeModal
window.exportMyData = exportMyData
window.deleteMyAccount = deleteMyAccount
