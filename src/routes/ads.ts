import { Router } from "@oak/oak"
import { getDatabase } from "../db/database.ts"
import { CATEGORIES } from "../models/types.ts"

const router = new Router()
const MAX_IMAGES_PER_AD = 5

// Get all ads (with pagination and filters)
router.get("/api/ads", (ctx) => {
  const params = ctx.request.url.searchParams
  const category = params.get("category")
  const city = params.get("city")
  const search = params.get("search")
  const page = parseInt(params.get("page") || "1")
  const limit = Math.min(parseInt(params.get("limit") || "20"), 50)
  const offset = (page - 1) * limit

  const db = getDatabase()

  let sql = `
    SELECT a.*, COUNT(i.id) as image_count
    FROM ads a
    LEFT JOIN images i ON i.ad_id = a.id
    WHERE a.status = 'active'
  `
  const args: (string | number)[] = []

  if (category) {
    sql += " AND a.category = ?"
    args.push(category)
  }

  if (city) {
    sql += " AND a.city = ?"
    args.push(city)
  }

  if (search) {
    sql += " AND (a.title LIKE ? OR a.description LIKE ?)"
    args.push(`%${search}%`, `%${search}%`)
  }

  sql += " GROUP BY a.id ORDER BY a.created_at DESC LIMIT ? OFFSET ?"
  args.push(limit, offset)

  const ads = db.prepare(sql).all<
    [number, number, string, string, number, string, string | null, string, string, string, number]
  >(...args)

  // Get total count for pagination
  let countSql = "SELECT COUNT(*) FROM ads WHERE status = 'active'"
  const countArgs: (string | number)[] = []

  if (category) {
    countSql += " AND category = ?"
    countArgs.push(category)
  }
  if (city) {
    countSql += " AND city = ?"
    countArgs.push(city)
  }
  if (search) {
    countSql += " AND (title LIKE ? OR description LIKE ?)"
    countArgs.push(`%${search}%`, `%${search}%`)
  }

  const totalResult = db.prepare(countSql).get<[number]>(...countArgs)
  const total = totalResult ? totalResult[0] : 0

  ctx.response.body = {
    ads: ads.map((row) => ({
      id: row[0],
      user_id: row[1],
      title: row[2],
      description: row[3],
      price: row[4],
      category: row[5],
      city: row[6],
      status: row[7],
      created_at: row[8],
      updated_at: row[9],
      image_count: row[10],
    })),
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  }
})

// Get single ad
router.get("/api/ads/:id", (ctx) => {
  const id = parseInt(ctx.params.id)

  const db = getDatabase()

  const ad = db.prepare(`
    SELECT a.*, u.name as seller_name, u.city as seller_city
    FROM ads a
    JOIN users u ON u.id = a.user_id
    WHERE a.id = ? AND a.status != 'deleted'
  `).get<[number, number, string, string, number, string, string | null, string, string, string, string, string | null]>(
    id
  )

  if (!ad) {
    ctx.response.status = 404
    ctx.response.body = { error: "Annonsen hittades inte" }
    return
  }

  const images = db.prepare("SELECT id, filename FROM images WHERE ad_id = ?").all<[number, string]>(id)

  ctx.response.body = {
    id: ad[0],
    user_id: ad[1],
    title: ad[2],
    description: ad[3],
    price: ad[4],
    category: ad[5],
    city: ad[6],
    status: ad[7],
    created_at: ad[8],
    updated_at: ad[9],
    seller_name: ad[10],
    seller_city: ad[11],
    images: images.map((img) => ({
      id: img[0],
      filename: img[1],
      url: `/uploads/${img[1]}`,
    })),
  }
})

// Create ad
router.post("/api/ads", async (ctx) => {
  const sessionId = await ctx.cookies.get("session")

  if (!sessionId) {
    ctx.response.status = 401
    ctx.response.body = { error: "Du måste vara inloggad för att skapa annonser" }
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
  const body = await ctx.request.body.json()
  const { title, description, price, category, city } = body

  if (!title || !description || price === undefined || !category) {
    ctx.response.status = 400
    ctx.response.body = { error: "Titel, beskrivning, pris och kategori krävs" }
    return
  }

  if (!CATEGORIES.includes(category)) {
    ctx.response.status = 400
    ctx.response.body = { error: "Ogiltig kategori" }
    return
  }

  if (typeof price !== "number" || price < 0) {
    ctx.response.status = 400
    ctx.response.body = { error: "Ogiltigt pris" }
    return
  }

  const result = db.prepare(`
    INSERT INTO ads (user_id, title, description, price, category, city)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(userId, title, description, price, category, city || null)

  ctx.response.status = 201
  ctx.response.body = {
    message: "Annons skapad!",
    id: result,
  }
})

// Update ad
router.put("/api/ads/:id", async (ctx) => {
  const id = parseInt(ctx.params.id)
  const sessionId = await ctx.cookies.get("session")

  if (!sessionId) {
    ctx.response.status = 401
    ctx.response.body = { error: "Du måste vara inloggad" }
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

  // Check ownership
  const ad = db.prepare("SELECT user_id FROM ads WHERE id = ?").get<[number]>(id)
  if (!ad || ad[0] !== userId) {
    ctx.response.status = 403
    ctx.response.body = { error: "Du kan bara redigera dina egna annonser" }
    return
  }

  const body = await ctx.request.body.json()
  const { title, description, price, category, city, status } = body

  if (category && !CATEGORIES.includes(category)) {
    ctx.response.status = 400
    ctx.response.body = { error: "Ogiltig kategori" }
    return
  }

  const updates: string[] = []
  const args: (string | number)[] = []

  if (title !== undefined) {
    updates.push("title = ?")
    args.push(title)
  }
  if (description !== undefined) {
    updates.push("description = ?")
    args.push(description)
  }
  if (price !== undefined) {
    updates.push("price = ?")
    args.push(price)
  }
  if (category !== undefined) {
    updates.push("category = ?")
    args.push(category)
  }
  if (city !== undefined) {
    updates.push("city = ?")
    args.push(city)
  }
  if (status !== undefined && ["active", "sold"].includes(status)) {
    updates.push("status = ?")
    args.push(status)
  }

  if (updates.length === 0) {
    ctx.response.status = 400
    ctx.response.body = { error: "Inga uppdateringar skickades" }
    return
  }

  updates.push("updated_at = datetime('now')")
  args.push(id)

  db.prepare(`UPDATE ads SET ${updates.join(", ")} WHERE id = ?`).run(...args)

  ctx.response.body = { message: "Annons uppdaterad!" }
})

// Delete ad
router.delete("/api/ads/:id", async (ctx) => {
  const id = parseInt(ctx.params.id)
  const sessionId = await ctx.cookies.get("session")

  if (!sessionId) {
    ctx.response.status = 401
    ctx.response.body = { error: "Du måste vara inloggad" }
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

  // Check ownership
  const ad = db.prepare("SELECT user_id FROM ads WHERE id = ?").get<[number]>(id)
  if (!ad || ad[0] !== userId) {
    ctx.response.status = 403
    ctx.response.body = { error: "Du kan bara radera dina egna annonser" }
    return
  }

  // Delete images
  db.prepare("DELETE FROM images WHERE ad_id = ?").run(id)

  // Soft delete ad
  db.prepare("UPDATE ads SET status = 'deleted', updated_at = datetime('now') WHERE id = ?").run(id)

  ctx.response.body = { message: "Annons raderad!" }
})

// Upload images
router.post("/api/ads/:id/images", async (ctx) => {
  const id = parseInt(ctx.params.id)
  const sessionId = await ctx.cookies.get("session")

  if (!sessionId) {
    ctx.response.status = 401
    ctx.response.body = { error: "Du måste vara inloggad" }
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

  // Check ownership
  const ad = db.prepare("SELECT user_id FROM ads WHERE id = ?").get<[number]>(id)
  if (!ad || ad[0] !== userId) {
    ctx.response.status = 403
    ctx.response.body = { error: "Du kan bara ladda upp bilder till dina egna annonser" }
    return
  }

  // Check current image count
  const imageCountResult = db.prepare("SELECT COUNT(*) FROM images WHERE ad_id = ?").get<[number]>(id)
  const currentCount = imageCountResult ? imageCountResult[0] : 0

  if (currentCount >= MAX_IMAGES_PER_AD) {
    ctx.response.status = 400
    ctx.response.body = { error: `Max ${MAX_IMAGES_PER_AD} bilder per annons` }
    return
  }

  const body = ctx.request.body
  const formData = await body.formData()
  const uploadedFiles: string[] = []

  // Ensure uploads directory exists
  try {
    await Deno.mkdir("./static/uploads", { recursive: true })
  } catch {
    // Directory might already exist
  }

  for (const [_, value] of formData) {
    if (value instanceof File) {
      if (currentCount + uploadedFiles.length >= MAX_IMAGES_PER_AD) {
        break
      }

      // Validate file type
      if (!value.type.startsWith("image/")) {
        continue
      }

      // Generate unique filename
      const ext = value.name.split(".").pop() || "jpg"
      const filename = `${id}_${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`

      // Save file
      const arrayBuffer = await value.arrayBuffer()
      await Deno.writeFile(`./static/uploads/${filename}`, new Uint8Array(arrayBuffer))

      // Save to database
      db.prepare("INSERT INTO images (ad_id, filename) VALUES (?, ?)").run(id, filename)

      uploadedFiles.push(filename)
    }
  }

  ctx.response.body = {
    message: `${uploadedFiles.length} bild(er) uppladdade`,
    files: uploadedFiles,
  }
})

// Delete image
router.delete("/api/images/:id", async (ctx) => {
  const imageId = parseInt(ctx.params.id)
  const sessionId = await ctx.cookies.get("session")

  if (!sessionId) {
    ctx.response.status = 401
    ctx.response.body = { error: "Du måste vara inloggad" }
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

  // Check ownership
  const image = db.prepare(`
    SELECT i.filename, a.user_id 
    FROM images i 
    JOIN ads a ON a.id = i.ad_id 
    WHERE i.id = ?
  `).get<[string, number]>(imageId)

  if (!image || image[1] !== userId) {
    ctx.response.status = 403
    ctx.response.body = { error: "Du kan bara radera dina egna bilder" }
    return
  }

  // Delete file
  try {
    await Deno.remove(`./static/uploads/${image[0]}`)
  } catch {
    // File might not exist
  }

  // Delete from database
  db.prepare("DELETE FROM images WHERE id = ?").run(imageId)

  ctx.response.body = { message: "Bild raderad!" }
})

// Get categories
router.get("/api/categories", (ctx) => {
  ctx.response.body = { categories: CATEGORIES }
})

// Get user's ads
router.get("/api/my-ads", async (ctx) => {
  const sessionId = await ctx.cookies.get("session")

  if (!sessionId) {
    ctx.response.status = 401
    ctx.response.body = { error: "Du måste vara inloggad" }
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

  const ads = db.prepare(`
    SELECT a.*, COUNT(i.id) as image_count
    FROM ads a
    LEFT JOIN images i ON i.ad_id = a.id
    WHERE a.user_id = ? AND a.status != 'deleted'
    GROUP BY a.id
    ORDER BY a.created_at DESC
  `).all<
    [number, number, string, string, number, string, string | null, string, string, string, number]
  >(userId)

  ctx.response.body = {
    ads: ads.map((row) => ({
      id: row[0],
      user_id: row[1],
      title: row[2],
      description: row[3],
      price: row[4],
      category: row[5],
      city: row[6],
      status: row[7],
      created_at: row[8],
      updated_at: row[9],
      image_count: row[10],
    })),
  }
})

export { router as adsRouter }
