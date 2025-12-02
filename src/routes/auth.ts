import { Router } from "@oak/oak"
import { getAuthenticatedSupabase, getSupabase } from "../db/database.ts"
import { containsForbiddenWords } from "../utils/forbidden-words.ts"

const router = new Router()

// Register
router.post("/api/auth/register", async (ctx) => {
  const body = await ctx.request.body.json()
  const { email, password, username } = body

  if (!email || !password || !username) {
    ctx.response.status = 400
    ctx.response.body = { error: "E-post, lösenord och användarnamn krävs" }
    return
  }

  if (password.length < 8) {
    ctx.response.status = 400
    ctx.response.body = { error: "Lösenordet måste vara minst 8 tecken" }
    return
  }

  // Check username for forbidden words
  if (containsForbiddenWords({ username })) {
    ctx.response.status = 400
    ctx.response.body = { error: "Användarnamnet innehåller otillåtna ord." }
    return
  }

  const supabase = getSupabase()

  // Check if user already exists by email
  const { data: existingProfile } = await supabase
    .from("profiles")
    .select("id")
    .eq("email", email)
    .maybeSingle()

  if (existingProfile) {
    ctx.response.status = 400
    ctx.response.body = { error: "En användare med denna e-postadress finns redan." }
    return
  }

  // Check if username is already taken
  const { data: existingUsername } = await supabase
    .from("profiles")
    .select("id")
    .eq("username", username)
    .maybeSingle()

  if (existingUsername) {
    ctx.response.status = 400
    ctx.response.body = { error: "Användarnamnet är redan taget." }
    return
  }

  // Create user with Supabase Auth
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        username,
      },
    },
  })

  if (authError) {
    console.error("Auth signup error:", authError.message, authError.status)
    ctx.response.status = 400
    ctx.response.body = { error: authError.message }
    return
  }

  // Update profile with additional info using the new session
  if (authData.user && authData.session) {
    const authSupabase = getAuthenticatedSupabase(authData.session.access_token)
    const { error: profileError } = await authSupabase.from("profiles").upsert({
      id: authData.user.id,
      email,
      username,
    })
    if (profileError) {
      console.error("Profile upsert error:", profileError.message, profileError.code)
    }
  }

  ctx.response.status = 201
  ctx.response.body = { message: "Konto skapat! Kolla din e-post för att bekräfta kontot." }
})

// Login
router.post("/api/auth/login", async (ctx) => {
  const body = await ctx.request.body.json()
  const { email, password } = body

  if (!email || !password) {
    ctx.response.status = 400
    ctx.response.body = { error: "E-post och lösenord krävs" }
    return
  }

  const supabase = getSupabase()

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    console.error("Login error:", error.message, error.status)
    ctx.response.status = 401
    ctx.response.body = { error: "Felaktig e-post eller lösenord" }
    return
  }

  // Check if profile exists (user may have deleted their account)
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", data.user.id)
    .maybeSingle()

  if (profileError || !profile) {
    console.error("Profile check error:", profileError?.message)
    // Sign out the auth session since profile doesn't exist
    await supabase.auth.signOut()
    ctx.response.status = 401
    ctx.response.body = { error: "Kontot har raderats" }
    return
  }

  // Set session token as cookie
  await ctx.cookies.set("access_token", data.session.access_token, {
    httpOnly: true,
    secure: ctx.request.secure,
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60, // 7 days
  })

  await ctx.cookies.set("refresh_token", data.session.refresh_token, {
    httpOnly: true,
    secure: ctx.request.secure,
    sameSite: "lax",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  })

  ctx.response.body = { message: "Inloggad!" }
})

// Logout
router.post("/api/auth/logout", async (ctx) => {
  const accessToken = await ctx.cookies.get("access_token")

  if (accessToken) {
    const supabase = getSupabase()
    await supabase.auth.signOut()
  }

  await ctx.cookies.delete("access_token")
  await ctx.cookies.delete("refresh_token")

  ctx.response.body = { message: "Utloggad!" }
})

// Forgot password - send reset email
router.post("/api/auth/forgot-password", async (ctx) => {
  const body = await ctx.request.body.json()
  const { email } = body

  if (!email) {
    ctx.response.status = 400
    ctx.response.body = { error: "E-post krävs" }
    return
  }

  const supabase = getSupabase()

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${ctx.request.url.origin}/aterstall-losenord`,
  })

  if (error) {
    console.error("Forgot password error:", error.message, error.status)
    // Don't reveal if email exists or not for security
    ctx.response.body = {
      message: "Om e-postadressen finns i vårt system kommer du få ett återställningsmail.",
    }
    return
  }

  ctx.response.body = {
    message: "Om e-postadressen finns i vårt system kommer du få ett återställningsmail.",
  }
})

// Reset password - update password with token
router.post("/api/auth/reset-password", async (ctx) => {
  const body = await ctx.request.body.json()
  const { accessToken, newPassword } = body

  if (!accessToken || !newPassword) {
    ctx.response.status = 400
    ctx.response.body = { error: "Åtkomsttoken och nytt lösenord krävs" }
    return
  }

  if (newPassword.length < 8) {
    ctx.response.status = 400
    ctx.response.body = { error: "Lösenordet måste vara minst 8 tecken" }
    return
  }

  const supabase = getAuthenticatedSupabase(accessToken)

  // Verify the user exists and get their ID
  const { data: userData, error: userError } = await supabase.auth.getUser()

  if (userError || !userData.user) {
    console.error("Reset password user validation error:", userError?.message)
    ctx.response.status = 400
    ctx.response.body = { error: "Kunde inte uppdatera lösenordet. Länken kan ha gått ut." }
    return
  }

  // Check if profile exists (user may have deleted their account)
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", userData.user.id)
    .maybeSingle()

  if (profileError || !profile) {
    console.error("Profile check error during password reset:", profileError?.message)
    ctx.response.status = 400
    ctx.response.body = { error: "Kontot har raderats. Länken kan ha gått ut." }
    return
  }

  const { error } = await supabase.auth.updateUser({
    password: newPassword,
  })

  if (error) {
    console.error("Reset password error:", error.message, error.status)
    ctx.response.status = 400
    ctx.response.body = { error: "Kunde inte uppdatera lösenordet. Länken kan ha gått ut." }
    return
  }

  ctx.response.body = { message: "Lösenordet har uppdaterats!" }
})

// Get current user
router.get("/api/auth/me", async (ctx) => {
  const accessToken = await ctx.cookies.get("access_token")

  if (!accessToken) {
    ctx.response.status = 401
    ctx.response.body = { error: "Inte inloggad" }
    return
  }

  const supabase = getSupabase()

  const { data: userData, error: userError } = await supabase.auth.getUser(accessToken)

  if (userError || !userData.user) {
    if (userError) {
      console.error("Get current user error:", userError.message, userError.status)
    }
    ctx.response.status = 401
    ctx.response.body = { error: "Session utgången" }
    return
  }

  // Get profile data
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userData.user.id)
    .single()

  ctx.response.body = {
    id: userData.user.id,
    email: userData.user.email,
    username: profile?.username || "Användare",
  }
})

// Export user data (GDPR - Article 20 Data Portability)
router.get("/api/auth/my-data", async (ctx) => {
  const accessToken = await ctx.cookies.get("access_token")

  if (!accessToken) {
    ctx.response.status = 401
    ctx.response.body = { error: "Inte inloggad" }
    return
  }

  const supabase = getSupabase()

  const { data: userData, error: userError } = await supabase.auth.getUser(accessToken)

  if (userError || !userData.user) {
    if (userError) {
      console.error("Get user data export error:", userError.message, userError.status)
    }
    ctx.response.status = 401
    ctx.response.body = { error: "Session utgången" }
    return
  }

  const userId = userData.user.id
  const authSupabase = getAuthenticatedSupabase(accessToken)

  // Get profile data
  const { data: profile } = await authSupabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single()

  // Get all ads with images
  const { data: ads } = await authSupabase
    .from("ads")
    .select("*, images(id, filename, storage_path, created_at)")
    .eq("user_id", userId)
    .neq("state", "deleted")

  // Get all conversations (as buyer or seller)
  const { data: conversations } = await authSupabase
    .from("conversations")
    .select("*, messages(id, sender_id, created_at)")
    .or(`buyer_id.eq.${userId},seller_id.eq.${userId}`)

  // Build image URLs
  const adsWithImageUrls = (ads || []).map((ad) => ({
    id: ad.id,
    title: ad.title,
    description: ad.description,
    price: ad.price,
    category: ad.category,
    county: ad.county,
    state: ad.state,
    created_at: ad.created_at,
    updated_at: ad.updated_at,
    expires_at: ad.expires_at,
    // deno-lint-ignore no-explicit-any
    images: (ad.images || []).map((img: any) => ({
      id: img.id,
      filename: img.filename,
      url: authSupabase.storage.from("ad-images").getPublicUrl(img.storage_path).data.publicUrl,
      created_at: img.created_at,
    })),
  }))

  // Return all user data in GDPR-compliant format
  ctx.response.body = {
    export_date: new Date().toISOString(),
    user: {
      id: userId,
      email: userData.user.email,
      username: profile?.username,
      created_at: profile?.created_at,
      updated_at: profile?.updated_at,
    },
    ads: adsWithImageUrls,
    conversations: conversations || [],
    metadata: {
      format: "JSON",
      version: "1.0",
      description: "GDPR Article 20 Data Export - All personal data associated with this account",
    },
  }
})

// Delete account (GDPR - Right to be forgotten)
router.delete("/api/auth/account", async (ctx) => {
  const accessToken = await ctx.cookies.get("access_token")

  if (!accessToken) {
    ctx.response.status = 401
    ctx.response.body = { error: "Inte inloggad" }
    return
  }

  const supabase = getSupabase()

  const { data: userData, error: userError } = await supabase.auth.getUser(accessToken)

  if (userError || !userData.user) {
    if (userError) {
      console.error("Delete account get user error:", userError.message, userError.status)
    }
    ctx.response.status = 401
    ctx.response.body = { error: "Session utgången" }
    return
  }

  const userId = userData.user.id
  const authSupabase = getAuthenticatedSupabase(accessToken)

  // Delete user's images
  const { data: userAds } = await authSupabase.from("ads").select("id").eq("user_id", userId)

  if (userAds) {
    for (const ad of userAds) {
      // Get images for this ad
      const { data: images } = await authSupabase.from("images").select("storage_path").eq(
        "ad_id",
        ad.id,
      )

      // Delete from storage
      if (images && images.length > 0) {
        const paths = images.map((img) => img.storage_path)
        await authSupabase.storage.from("ad-images").remove(paths)
      }
    }
  }

  // Delete ads (cascade will delete images records)
  await authSupabase.from("ads").delete().eq("user_id", userId)

  // Delete profile
  await authSupabase.from("profiles").delete().eq("id", userId)

  // Note: Deleting from auth.users requires admin privileges
  // The user should be deleted via Supabase dashboard or a server-side admin function
  await supabase.auth.signOut()

  await ctx.cookies.delete("access_token")
  await ctx.cookies.delete("refresh_token")

  ctx.response.body = { message: "Ditt konto och all data har raderats" }
})

// Helper function to get user from request
export async function getUserFromRequest(
  ctx: { cookies: { get: (name: string) => Promise<string | undefined> } },
): Promise<{ id: string; email: string; accessToken: string } | null> {
  const accessToken = await ctx.cookies.get("access_token")

  if (!accessToken) {
    return null
  }

  const supabase = getSupabase()
  const { data: userData, error } = await supabase.auth.getUser(accessToken)

  if (error || !userData.user) {
    return null
  }

  return {
    id: userData.user.id,
    email: userData.user.email || "",
    accessToken,
  }
}

export { router as authRouter }
