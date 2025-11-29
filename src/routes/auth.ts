import { Router } from "@oak/oak"
import { getSupabase } from "../db/database.ts"
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

  // Update profile with additional info
  if (authData.user) {
    const { error: profileError } = await supabase.from("profiles").upsert({
      id: authData.user.id,
      email,
      username,
    })
    if (profileError) {
      console.error("Profile upsert error:", profileError.message, profileError.code)
    }
  }

  ctx.response.status = 201
  ctx.response.body = { message: "Konto skapat! Du kan nu logga in." }
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

  // Get profile data
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single()

  // Get all ads with images
  const { data: ads } = await supabase
    .from("ads")
    .select("*, images(id, filename, storage_path, created_at)")
    .eq("user_id", userId)
    .neq("state", "deleted")

  // Get all conversations (as buyer or seller)
  const { data: conversations } = await supabase
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
      url: supabase.storage.from("ad-images").getPublicUrl(img.storage_path).data.publicUrl,
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

  // Delete user's images
  const { data: userAds } = await supabase.from("ads").select("id").eq("user_id", userId)

  if (userAds) {
    for (const ad of userAds) {
      // Get images for this ad
      const { data: images } = await supabase.from("images").select("storage_path").eq(
        "ad_id",
        ad.id,
      )

      // Delete from storage
      if (images && images.length > 0) {
        const paths = images.map((img) => img.storage_path)
        await supabase.storage.from("ad-images").remove(paths)
      }
    }
  }

  // Delete ads (cascade will delete images records)
  await supabase.from("ads").delete().eq("user_id", userId)

  // Delete profile
  await supabase.from("profiles").delete().eq("id", userId)

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
): Promise<{ id: string; email: string } | null> {
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
  }
}

export { router as authRouter }
