// Beggy - Common JavaScript utilities for all pages

// Text Size Accessibility
function initTextSizeToggle() {
  const textSizeToggle = document.getElementById("textSizeToggle")
  
  const isLargeText = localStorage.getItem("textSize") === "large"
  
  if (isLargeText) {
    document.body.classList.add("text-large")
    updateTextSizeToggleIcon(true)
  }
  
  const toggleHandler = () => {
    const isCurrentlyLarge = document.body.classList.contains("text-large")
    
    if (isCurrentlyLarge) {
      document.body.classList.remove("text-large")
      localStorage.setItem("textSize", "normal")
      updateTextSizeToggleIcon(false)
    } else {
      document.body.classList.add("text-large")
      localStorage.setItem("textSize", "large")
      updateTextSizeToggleIcon(true)
    }
  }
  
  if (textSizeToggle) {
    textSizeToggle.addEventListener("click", toggleHandler)
  }
}

function updateTextSizeToggleIcon(isLarge) {
  const textSizeToggle = document.getElementById("textSizeToggle")
  
  const updateButton = (btn) => {
    if (!btn) return
    
    if (isLarge) {
      btn.innerHTML = '<span class="text-lg font-bold">A</span><span class="text-sm">-</span>'
      btn.title = "Minska textstorlek"
      btn.setAttribute("aria-label", "Minska textstorlek")
    } else {
      btn.innerHTML = '<span class="text-lg font-bold">A</span><span class="text-sm">+</span>'
      btn.title = "Öka textstorlek"
      btn.setAttribute("aria-label", "Öka textstorlek")
    }
  }
  
  updateButton(textSizeToggle)
}

// Mobile Menu
function initMobileMenu() {
  const mobileMenuToggle = document.getElementById("mobileMenuToggle")
  const mobileMenu = document.getElementById("mobileMenu")
  
  if (!mobileMenuToggle || !mobileMenu) return
  
  mobileMenuToggle.addEventListener("click", () => {
    mobileMenu.classList.toggle("hidden")
  })
  
  // Setup mobile menu button listeners
  const loginBtnMobile = document.getElementById("loginBtnMobile")
  const logoutBtnMobile = document.getElementById("logoutBtnMobile")
  
  if (loginBtnMobile) {
    loginBtnMobile.addEventListener("click", (e) => {
      e.preventDefault()
      mobileMenu.classList.add("hidden")
      // Try to call openModal if it exists (from pages with auth modals)
      if (typeof openModal === "function") {
        openModal("loginModal")
      }
    })
  }
  
  if (logoutBtnMobile) {
    logoutBtnMobile.addEventListener("click", (e) => {
      e.preventDefault()
      mobileMenu.classList.add("hidden")
      // Try to call handleLogout if it exists
      if (typeof handleLogout === "function") {
        handleLogout(e)
      }
    })
  }
  
  // Close mobile menu when clicking links
  const mobileLinks = mobileMenu.querySelectorAll("a:not([id*='loginBtn']):not([id*='logoutBtn'])")
  mobileLinks.forEach(link => {
    link.addEventListener("click", () => {
      mobileMenu.classList.add("hidden")
    })
  })
}

// Update auth UI - set body class based on login state
function updateAuthUICommon() {
  // This function is called from app.js and other page-specific JS
  // It checks the current user state and updates the body class
  // The CSS rules handle showing/hiding elements based on this class
}

// Messages badge (unread count) shown in header on all pages
async function updateMessagesBadge() {
  try {
    const res = await fetch("/api/conversations")
    if (!res.ok) {
      const b = document.getElementById("messagesBadge")
      const bm = document.getElementById("messagesBadgeMobile")
      if (b) b.classList.add("hidden")
      if (bm) bm.classList.add("hidden")
      return
    }
    const data = await res.json()
    const count = (data.conversations || []).reduce((sum, c) => sum + (c.unread_count || 0), 0)
    const badge = document.getElementById("messagesBadge")
    const badgeMobile = document.getElementById("messagesBadgeMobile")
    if (badge) {
      if (count > 0) {
        badge.textContent = String(count)
        badge.classList.remove("hidden")
      } else {
        badge.classList.add("hidden")
      }
    }
    if (badgeMobile) {
      if (count > 0) {
        badgeMobile.textContent = String(count)
        badgeMobile.classList.remove("hidden")
      } else {
        badgeMobile.classList.add("hidden")
      }
    }
  } catch {
    const b = document.getElementById("messagesBadge")
    const bm = document.getElementById("messagesBadgeMobile")
    if (b) b.classList.add("hidden")
    if (bm) bm.classList.add("hidden")
  }
}

// Initialize common features
function initCommon() {
  initTextSizeToggle()
  initMobileMenu()
  // Always try to update the messages badge on load
  updateMessagesBadge()
}

// Auto-initialize if DOM is already loaded
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initCommon)
} else {
  initCommon()
}

// Expose badge updater for other scripts to call after actions
window.updateMessagesBadge = updateMessagesBadge
