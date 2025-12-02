// Reset Password JavaScript

document.addEventListener("DOMContentLoaded", () => {
  // Get token from URL hash (Supabase adds it as #access_token=...)
  const hashParams = new URLSearchParams(window.location.hash.substring(1))
  const accessToken = hashParams.get("access_token")
  const errorCode = hashParams.get("error_code")
  const errorDescription = hashParams.get("error_description")

  const resetPasswordContainer = document.getElementById("resetPasswordContainer")
  const resetPasswordSuccess = document.getElementById("resetPasswordSuccess")
  const resetPasswordError = document.getElementById("resetPasswordError")

  // Check for errors in the URL
  if (errorCode || errorDescription) {
    resetPasswordContainer.classList.add("hidden")
    resetPasswordError.classList.remove("hidden")
    return
  }

  // Check if we have an access token
  if (!accessToken) {
    resetPasswordContainer.classList.add("hidden")
    resetPasswordError.classList.remove("hidden")
    return
  }

  // Handle form submission
  document.getElementById("resetPasswordForm").addEventListener("submit", async (e) => {
    e.preventDefault()

    const newPassword = document.getElementById("newPassword").value
    const confirmPassword = document.getElementById("confirmPassword").value

    if (newPassword !== confirmPassword) {
      showAlert("Lösenorden matchar inte", "error")
      return
    }

    if (newPassword.length < 8) {
      showAlert("Lösenordet måste vara minst 8 tecken", "error")
      return
    }

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accessToken, newPassword }),
      })

      const data = await res.json()

      if (res.ok) {
        resetPasswordContainer.classList.add("hidden")
        resetPasswordSuccess.classList.remove("hidden")
        // Clear the hash from the URL for security
        window.history.replaceState(null, "", window.location.pathname)
      } else {
        showAlert(data.error, "error")
      }
    } catch {
      showAlert("Något gick fel", "error")
    }
  })
})

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
