import { Router } from "@oak/oak"
import { getSupabase } from "../db/database.ts"

const router = new Router()

// Register
router.post("/api/auth/register", async (ctx) => {
  const body = await ctx.request.body.json()
  const { email, password, name, phone, city } = body

  if (!email || !password || !name) {
    ctx.response.status = 400
    ctx.response.body = { error: "E-post, lösenord och namn krävs" }
    return
  }

  if (password.length < 8) {
    ctx.response.status = 400
    ctx.response.body = { error: "Lösenordet måste vara minst 8 tecken" }
    return
  }

  const supabase = getSupabase()

  // Create user with Supabase Auth
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        name,
        phone: phone || null,
        city: city || null,
      },
    },
  })

  if (authError) {
    ctx.response.status = 400
    ctx.response.body = { error: authError.message }
    return
  }

  // Update profile with additional info
  if (authData.user) {
    await supabase.from("profiles").upsert({
      id: authData.user.id,
      email,
      name,
      phone: phone || null,
      city: city || null,
    })
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
    name: profile?.name || "Användare",
    phone: profile?.phone,
    city: profile?.city,
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
