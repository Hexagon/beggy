// Beggy - My Ads Page JavaScript

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
  const myAdsContainer = document.getElementById("myAdsContainer")
  const loadingState = document.getElementById("loadingState")
  
  if (window.currentUser) {
    loadingState.classList.add("hidden")
    loginPrompt.classList.add("hidden")
    myAdsContainer.classList.remove("hidden")
    loadMyAds()
  } else {
    loadingState.classList.add("hidden")
    loginPrompt.classList.remove("hidden")
    myAdsContainer.classList.add("hidden")
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

// My Ads
async function loadMyAds() {
  try {
    const res = await fetch("/api/my-ads")
    const data = await res.json()

    const list = document.getElementById("myAdsList")

    if (data.ads.length === 0) {
      list.innerHTML = "<p class='text-stone-500 py-8 text-center'>Du har inga annonser ännu.</p>"
      return
    }

    list.innerHTML = data.ads
      .map(
        (ad) => {
          const safeImageUrl = sanitizeUrl(ad.first_image_url)
          return `
      <div class="flex py-4 hover:bg-stone-50 transition-colors group">
        <div class="w-20 h-20 flex-shrink-0 rounded overflow-hidden bg-stone-200 mr-4">
          ${
            safeImageUrl
              ? `<img src="${safeImageUrl}" alt="${escapeHtml(ad.title)}" class="w-full h-full object-cover">`
              : '<div class="flex items-center justify-center h-full text-stone-400 text-2xl">📦</div>'
          }
        </div>
        <div class="flex-1 min-w-0 flex flex-col justify-between">
          <div class="flex justify-between items-start">
            <div>
              <a href="/annons/${ad.id}" class="text-lg font-semibold text-dark hover:text-primary no-underline mb-1 block">${escapeHtml(ad.title)}</a>
              <div class="text-base font-bold text-primary">${formatPrice(ad.price)}</div>
            </div>
            <div class="flex gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
              <a href="/annons/${ad.id}/redigera" class="px-3 py-1.5 text-sm bg-white text-stone-700 border border-stone-300 rounded hover:bg-stone-50 no-underline shadow-sm">Redigera</a>
              ${
                ad.state === "ok"
                  ? `<button class="px-3 py-1.5 text-sm bg-green-600 text-white rounded hover:bg-green-700 shadow-sm" onclick="markAsSold(${ad.id})">Markera såld</button>`
                  : ""
              }
              <button class="px-3 py-1.5 text-sm bg-white text-red-600 border border-red-200 rounded hover:bg-red-50 shadow-sm" onclick="deleteAd(${ad.id})">Ta bort</button>
            </div>
          </div>
          <div class="text-sm text-stone-500 mt-1 flex items-center gap-2">
            <span class="${ad.state === "sold" ? "text-green-600 font-bold bg-green-50 px-2 py-0.5 rounded" : ad.state === "expired" ? "text-yellow-600 bg-yellow-50 px-2 py-0.5 rounded" : "text-stone-600 bg-stone-100 px-2 py-0.5 rounded"}">${getStateLabel(ad.state)}</span>
            ${ad.expires_at ? `<span>• Utgår: ${formatDate(ad.expires_at)}</span>` : ""}
          </div>
        </div>
      </div>
    `
        }
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
      showAlert("Annons raderad", "success")
    }
  } catch {
    showAlert("Något gick fel", "error")
  }
}

// Utility functions (openModal, closeModal, escapeHtml, showAlert, etc.) are now in utils.js

// Make functions available globally for onclick handlers
window.markAsSold = markAsSold
window.deleteAd = deleteAd
