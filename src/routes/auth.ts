import { Router } from "@oak/oak"
import { getDatabase } from "../db/database.ts"
import { hashPassword, verifyPassword, generateSessionId } from "../utils/helpers.ts"

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

  const db = getDatabase()

  // Check if email already exists
  const existing = db.prepare("SELECT id FROM users WHERE email = ?").get<[number]>(email)
  if (existing) {
    ctx.response.status = 400
    ctx.response.body = { error: "E-postadressen används redan" }
    return
  }

  const passwordHash = await hashPassword(password)

  db.prepare(`
    INSERT INTO users (email, password_hash, name, phone, city)
    VALUES (?, ?, ?, ?, ?)
  `).run(email, passwordHash, name, phone || null, city || null)

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

  const db = getDatabase()

  const user = db.prepare(`
    SELECT id, password_hash FROM users WHERE email = ?
  `).get<[number, string]>(email)

  if (!user) {
    ctx.response.status = 401
    ctx.response.body = { error: "Felaktig e-post eller lösenord" }
    return
  }

  const [userId, passwordHash] = user
  const isValid = await verifyPassword(password, passwordHash)

  if (!isValid) {
    ctx.response.status = 401
    ctx.response.body = { error: "Felaktig e-post eller lösenord" }
    return
  }

  // Create session
  const sessionId = generateSessionId()
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days

  db.prepare(`
    INSERT INTO sessions (id, user_id, expires_at)
    VALUES (?, ?, ?)
  `).run(sessionId, userId, expiresAt)

  await ctx.cookies.set("session", sessionId, {
    httpOnly: true,
    secure: ctx.request.secure,
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60, // 7 days in seconds
  })

  ctx.response.body = { message: "Inloggad!" }
})

// Logout
router.post("/api/auth/logout", async (ctx) => {
  const sessionId = await ctx.cookies.get("session")

  if (sessionId) {
    const db = getDatabase()
    db.prepare("DELETE FROM sessions WHERE id = ?").run(sessionId)
    await ctx.cookies.delete("session")
  }

  ctx.response.body = { message: "Utloggad!" }
})

// Get current user
router.get("/api/auth/me", async (ctx) => {
  const sessionId = await ctx.cookies.get("session")

  if (!sessionId) {
    ctx.response.status = 401
    ctx.response.body = { error: "Inte inloggad" }
    return
  }

  const db = getDatabase()
  const user = db.prepare(`
    SELECT u.id, u.email, u.name, u.phone, u.city
    FROM users u
    JOIN sessions s ON s.user_id = u.id
    WHERE s.id = ? AND datetime(s.expires_at) > datetime('now')
  `).get<[number, string, string, string | null, string | null]>(sessionId)

  if (!user) {
    ctx.response.status = 401
    ctx.response.body = { error: "Session utgången" }
    return
  }

  ctx.response.body = {
    id: user[0],
    email: user[1],
    name: user[2],
    phone: user[3],
    city: user[4],
  }
})

// Delete account (GDPR - Right to be forgotten)
router.delete("/api/auth/account", async (ctx) => {
  const sessionId = await ctx.cookies.get("session")

  if (!sessionId) {
    ctx.response.status = 401
    ctx.response.body = { error: "Inte inloggad" }
    return
  }

  const db = getDatabase()
  const session = db.prepare(`
    SELECT user_id FROM sessions WHERE id = ? AND datetime(expires_at) > datetime('now')
  `).get<[number]>(sessionId)

  if (!session) {
    ctx.response.status = 401
    ctx.response.body = { error: "Session utgången" }
    return
  }

  const userId = session[0]

  // Delete all user data
  db.prepare("DELETE FROM images WHERE ad_id IN (SELECT id FROM ads WHERE user_id = ?)").run(userId)
  db.prepare("DELETE FROM ads WHERE user_id = ?").run(userId)
  db.prepare("DELETE FROM sessions WHERE user_id = ?").run(userId)
  db.prepare("DELETE FROM users WHERE id = ?").run(userId)

  await ctx.cookies.delete("session")

  ctx.response.body = { message: "Ditt konto och all data har raderats" }
})

export { router as authRouter }
