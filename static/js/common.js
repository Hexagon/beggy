// Beggy - Common JavaScript utilities for all pages

// Text Size Accessibility
function initTextSizeToggle() {
  const textSizeToggle = document.getElementById("textSizeToggle")
  const textSizeToggle2 = document.getElementById("textSizeToggle2")
  
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
  
  if (textSizeToggle2) {
    textSizeToggle2.addEventListener("click", toggleHandler)
  }
}

function updateTextSizeToggleIcon(isLarge) {
  const textSizeToggle = document.getElementById("textSizeToggle")
  const textSizeToggle2 = document.getElementById("textSizeToggle2")
  
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
  updateButton(textSizeToggle2)
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
  const sellBtnMobile = document.getElementById("sellBtnMobile")
  const sellBtn2Mobile = document.getElementById("sellBtn2Mobile")
  
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
  
  if (sellBtnMobile) {
    sellBtnMobile.addEventListener("click", (e) => {
      e.preventDefault()
      window.location.href = "/ny-annons"
    })
  }
  
  if (sellBtn2Mobile) {
    sellBtn2Mobile.addEventListener("click", (e) => {
      e.preventDefault()
      window.location.href = "/ny-annons"
    })
  }
  
  // Close mobile menu when clicking links (except sell button which navigates)
  const mobileLinks = mobileMenu.querySelectorAll("a:not([id*='sellBtn'])")
  mobileLinks.forEach(link => {
    link.addEventListener("click", () => {
      if (!link.id.includes("loginBtn")) {
        mobileMenu.classList.add("hidden")
      }
    })
  })
}

// Update auth UI for mobile and desktop
function updateAuthUICommon() {
  const loggedOutNavMobile = document.querySelector(".nav-mobile")
  const loggedInNavMobile = document.querySelector(".nav-mobile-logged-in")
  
  // Check if user is logged in by checking if logged-in nav is visible
  const loggedInNav = document.querySelector(".nav-logged-in")
  const isLoggedIn = loggedInNav && !loggedInNav.classList.contains("hidden")
  
  if (isLoggedIn) {
    if (loggedOutNavMobile) {
      loggedOutNavMobile.classList.add("hidden")
      loggedOutNavMobile.classList.remove("flex")
    }
    if (loggedInNavMobile) {
      loggedInNavMobile.classList.remove("hidden")
      loggedInNavMobile.classList.add("flex")
    }
  } else {
    if (loggedOutNavMobile) {
      loggedOutNavMobile.classList.remove("hidden")
      loggedOutNavMobile.classList.add("flex")
    }
    if (loggedInNavMobile) {
      loggedInNavMobile.classList.add("hidden")
      loggedInNavMobile.classList.remove("flex")
    }
  }
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
