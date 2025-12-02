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

// Initialize common features
function initCommon() {
  initTextSizeToggle()
  initMobileMenu()
}

// Auto-initialize if DOM is already loaded
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initCommon)
} else {
  initCommon()
}
