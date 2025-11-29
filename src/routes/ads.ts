import { Router } from "@oak/oak"
import { getAuthenticatedSupabase, getSupabase } from "../db/database.ts"
import { ADJACENT_COUNTIES, CATEGORIES, COUNTIES } from "../models/types.ts"
import { getUserFromRequest } from "./auth.ts"
import { containsForbiddenWords } from "../utils/forbidden-words.ts"

const router = new Router()
const MAX_IMAGES_PER_AD = 5
const AD_EXPIRY_DAYS = 30

// Get all ads (with pagination and filters)
router.get("/api/ads", async (ctx) => {
  const params = ctx.request.url.searchParams
  const category = params.get("category")
  const county = params.get("county")
  const includeAdjacent = params.get("includeAdjacent") === "true"
  const search = params.get("search")
  const sort = params.get("sort") || "newest"
  const page = parseInt(params.get("page") || "1")
  const limit = Math.min(parseInt(params.get("limit") || "20"), 50)
  const offset = (page - 1) * limit

  const supabase = getSupabase()

  // Determine sort order
  let sortColumn = "created_at"
  let ascending = false
  switch (sort) {
    case "oldest":
      sortColumn = "created_at"
      ascending = true
      break
    case "price_asc":
      sortColumn = "price"
      ascending = true
      break
    case "price_desc":
      sortColumn = "price"
      ascending = false
      break
    case "newest":
    default:
      sortColumn = "created_at"
      ascending = false
      break
  }

  let query = supabase
    .from("ads")
    .select("*, images(id, storage_path)", { count: "exact" })
    .eq("state", "ok")
    .order(sortColumn, { ascending })
    .range(offset, offset + limit - 1)

  if (category) {
    query = query.eq("category", category)
  }

  if (county) {
    if (includeAdjacent) {
      // Include selected county and its adjacent counties
      const adjacentCounties = ADJACENT_COUNTIES[county] || []
      const allCounties = [county, ...adjacentCounties]
      query = query.in("county", allCounties)
    } else {
      query = query.eq("county", county)
    }
  }

  if (search) {
    query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`)
  }

  const { data: ads, count, error } = await query

  if (error) {
    console.error("Get ads error:", error.message, error.code)
    ctx.response.status = 500
    ctx.response.body = { error: "Kunde inte hämta annonser" }
    return
  }

  ctx.response.body = {
    ads: (ads || []).map((ad) => {
      // Get first image URL if exists
      const firstImage = ad.images && ad.images.length > 0 ? ad.images[0] : null
      const firstImageUrl = firstImage
        ? supabase.storage.from("ad-images").getPublicUrl(firstImage.storage_path).data.publicUrl
        : null

      return {
        id: ad.id,
        user_id: ad.user_id,
        title: ad.title,
        description: ad.description,
        price: ad.price,
        category: ad.category,
        county: ad.county,
        state: ad.state,
        created_at: ad.created_at,
        updated_at: ad.updated_at,
        expires_at: ad.expires_at,
        image_count: ad.images?.length || 0,
        first_image_url: firstImageUrl,
      }
    }),
    pagination: {
      page,
      limit,
      total: count || 0,
      pages: Math.ceil((count || 0) / limit),
    },
  }
})

// Get single ad
router.get("/api/ads/:id", async (ctx) => {
  const id = parseInt(ctx.params.id)
  const user = await getUserFromRequest(ctx)

  const supabase = getSupabase()

  const { data: ad, error } = await supabase
    .from("ads")
    .select(
      "*, profiles(username), images(id, filename, storage_path)",
    )
    .eq("id", id)
    .single()

  if (error || !ad) {
    ctx.response.status = 404
    ctx.response.body = { error: "Annonsen hittades inte" }
    return
  }

  // Only show ads that are "ok" or owned by the current user
  const isOwner = user?.id === ad.user_id
  if (ad.state !== "ok" && !isOwner) {
    ctx.response.status = 404
    ctx.response.body = { error: "Annonsen hittades inte" }
    return
  }

  ctx.response.body = {
    id: ad.id,
    user_id: ad.user_id,
    title: ad.title,
    description: ad.description,
    price: ad.price,
    category: ad.category,
    county: ad.county,
    state: ad.state,
    created_at: ad.created_at,
    updated_at: ad.updated_at,
    expires_at: ad.expires_at,
    seller_username: ad.profiles?.username || "Användare",
    seller_contact_phone: ad.contact_phone,
    seller_contact_email: ad.contact_email,
    images: (ad.images || []).map((
      img: { id: number; filename: string; storage_path: string },
    ) => ({
      id: img.id,
      filename: img.filename,
      url: supabase.storage.from("ad-images").getPublicUrl(img.storage_path).data.publicUrl,
    })),
  }
})

// Create ad
router.post("/api/ads", async (ctx) => {
  const user = await getUserFromRequest(ctx)

  if (!user) {
    ctx.response.status = 401
    ctx.response.body = { error: "Du måste vara inloggad för att skapa annonser" }
    return
  }

  const body = await ctx.request.body.json()
  const { title, description, price, category, county, contact_phone, contact_email } = body

  if (!title || !description || price === undefined || !category || !county) {
    ctx.response.status = 400
    ctx.response.body = { error: "Titel, beskrivning, pris, kategori och län krävs" }
    return
  }

  if (!CATEGORIES.includes(category)) {
    ctx.response.status = 400
    ctx.response.body = { error: "Ogiltig kategori" }
    return
  }

  if (!COUNTIES.includes(county)) {
    ctx.response.status = 400
    ctx.response.body = { error: "Ogiltigt län" }
    return
  }

  if (typeof price !== "number" || price < 0) {
    ctx.response.status = 400
    ctx.response.body = { error: "Ogiltigt pris" }
    return
  }

  // Check for forbidden words
  if (containsForbiddenWords({ title, description })) {
    ctx.response.status = 400
    ctx.response.body = { error: "Annonsen innehåller otillåtna ord. Vänligen ändra texten." }
    return
  }

  const supabase = getAuthenticatedSupabase(user.accessToken)

  // Calculate expiry date (30 days from now)
  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + AD_EXPIRY_DAYS)

  const { data, error } = await supabase
    .from("ads")
    .insert({
      user_id: user.id,
      title,
      description,
      price,
      category,
      county,
      contact_phone: contact_phone || null,
      contact_email: contact_email || null,
      state: "ok",
      expires_at: expiresAt.toISOString(),
    })
    .select("id")
    .single()

  if (error) {
    console.error("Create ad error:", error.message, error.code)
    ctx.response.status = 500
    ctx.response.body = { error: "Kunde inte skapa annons" }
    return
  }

  ctx.response.status = 201
  ctx.response.body = {
    message: "Annons skapad!",
    id: data.id,
  }
})

// Update ad
router.put("/api/ads/:id", async (ctx) => {
  const id = parseInt(ctx.params.id)
  const user = await getUserFromRequest(ctx)

  if (!user) {
    ctx.response.status = 401
    ctx.response.body = { error: "Du måste vara inloggad" }
    return
  }

  const supabase = getAuthenticatedSupabase(user.accessToken)

  // Check ownership
  const { data: ad } = await supabase.from("ads").select("user_id").eq("id", id).single()

  if (!ad || ad.user_id !== user.id) {
    ctx.response.status = 403
    ctx.response.body = { error: "Du kan bara redigera dina egna annonser" }
    return
  }

  const body = await ctx.request.body.json()
  const { title, description, price, category, county, contact_phone, contact_email, state } = body

  if (category && !CATEGORIES.includes(category)) {
    ctx.response.status = 400
    ctx.response.body = { error: "Ogiltig kategori" }
    return
  }

  if (county && !COUNTIES.includes(county)) {
    ctx.response.status = 400
    ctx.response.body = { error: "Ogiltigt län" }
    return
  }

  // Check for forbidden words in updated content
  if (containsForbiddenWords({ title, description })) {
    ctx.response.status = 400
    ctx.response.body = { error: "Annonsen innehåller otillåtna ord. Vänligen ändra texten." }
    return
  }

  const updates: Record<string, string | number | null> = {}

  if (title !== undefined) updates.title = title
  if (description !== undefined) updates.description = description
  if (price !== undefined) updates.price = price
  if (category !== undefined) updates.category = category
  if (county !== undefined) updates.county = county
  if (contact_phone !== undefined) updates.contact_phone = contact_phone || null
  if (contact_email !== undefined) updates.contact_email = contact_email || null
  // User can only change state to "ok" or "sold"
  if (state !== undefined && ["ok", "sold"].includes(state)) updates.state = state

  if (Object.keys(updates).length === 0) {
    ctx.response.status = 400
    ctx.response.body = { error: "Inga uppdateringar skickades" }
    return
  }

  const { error } = await supabase.from("ads").update(updates).eq("id", id)

  if (error) {
    console.error("Update ad error:", error.message, error.code)
    ctx.response.status = 500
    ctx.response.body = { error: "Kunde inte uppdatera annons" }
    return
  }

  ctx.response.body = { message: "Annons uppdaterad!" }
})

// Delete ad
router.delete("/api/ads/:id", async (ctx) => {
  const id = parseInt(ctx.params.id)
  const user = await getUserFromRequest(ctx)

  if (!user) {
    ctx.response.status = 401
    ctx.response.body = { error: "Du måste vara inloggad" }
    return
  }

  const supabase = getAuthenticatedSupabase(user.accessToken)

  // Check ownership
  const { data: ad } = await supabase.from("ads").select("user_id").eq("id", id).single()

  if (!ad || ad.user_id !== user.id) {
    ctx.response.status = 403
    ctx.response.body = { error: "Du kan bara radera dina egna annonser" }
    return
  }

  // Get and delete images from storage
  const { data: images } = await supabase.from("images").select("storage_path").eq("ad_id", id)

  if (images && images.length > 0) {
    const paths = images.map((img) => img.storage_path)
    await supabase.storage.from("ad-images").remove(paths)
  }

  // Delete images from database
  await supabase.from("images").delete().eq("ad_id", id)

  // Soft delete ad (conversations will be set to expire in 90 days via DB trigger)
  await supabase.from("ads").update({ state: "deleted" }).eq("id", id)

  ctx.response.body = { message: "Annons raderad!" }
})

// Upload images
router.post("/api/ads/:id/images", async (ctx) => {
  const id = parseInt(ctx.params.id)
  const user = await getUserFromRequest(ctx)

  if (!user) {
    ctx.response.status = 401
    ctx.response.body = { error: "Du måste vara inloggad" }
    return
  }

  const supabase = getAuthenticatedSupabase(user.accessToken)

  // Check ownership
  const { data: ad } = await supabase.from("ads").select("user_id").eq("id", id).single()

  if (!ad || ad.user_id !== user.id) {
    ctx.response.status = 403
    ctx.response.body = { error: "Du kan bara ladda upp bilder till dina egna annonser" }
    return
  }

  // Check current image count
  const { count: currentCount } = await supabase
    .from("images")
    .select("*", { count: "exact", head: true })
    .eq("ad_id", id)

  if ((currentCount || 0) >= MAX_IMAGES_PER_AD) {
    ctx.response.status = 400
    ctx.response.body = { error: `Max ${MAX_IMAGES_PER_AD} bilder per annons` }
    return
  }

  const body = ctx.request.body
  const formData = await body.formData()
  const uploadedFiles: string[] = []

  for (const [_, value] of formData) {
    if (value instanceof File) {
      if ((currentCount || 0) + uploadedFiles.length >= MAX_IMAGES_PER_AD) {
        break
      }

      // Validate file type
      if (!value.type.startsWith("image/")) {
        continue
      }

      // Generate unique filename
      const ext = value.name.split(".").pop() || "jpg"
      const filename = `${id}_${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`
      const storagePath = `${user.id}/${filename}`

      // Upload to Supabase Storage
      const arrayBuffer = await value.arrayBuffer()
      const { error: uploadError } = await supabase.storage
        .from("ad-images")
        .upload(storagePath, new Uint8Array(arrayBuffer), {
          contentType: value.type,
        })

      if (uploadError) {
        console.error("Upload error:", uploadError)
        continue
      }

      // Save to database
      await supabase.from("images").insert({
        ad_id: id,
        filename,
        storage_path: storagePath,
      })

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
  const user = await getUserFromRequest(ctx)

  if (!user) {
    ctx.response.status = 401
    ctx.response.body = { error: "Du måste vara inloggad" }
    return
  }

  const supabase = getAuthenticatedSupabase(user.accessToken)

  // Get image and check ownership
  const { data: image } = await supabase
    .from("images")
    .select("storage_path, ads(user_id)")
    .eq("id", imageId)
    .single()

  // deno-lint-ignore no-explicit-any
  const adData = image?.ads as any
  const adOwner = Array.isArray(adData) ? adData[0]?.user_id : adData?.user_id
  if (!image || adOwner !== user.id) {
    ctx.response.status = 403
    ctx.response.body = { error: "Du kan bara radera dina egna bilder" }
    return
  }

  // Delete from storage
  await supabase.storage.from("ad-images").remove([image.storage_path])

  // Delete from database
  await supabase.from("images").delete().eq("id", imageId)

  ctx.response.body = { message: "Bild raderad!" }
})

// Get categories
router.get("/api/categories", (ctx) => {
  ctx.response.body = { categories: CATEGORIES }
})

// Get counties
router.get("/api/counties", (ctx) => {
  ctx.response.body = { counties: COUNTIES, adjacentCounties: ADJACENT_COUNTIES }
})

// Get user's ads
router.get("/api/my-ads", async (ctx) => {
  const user = await getUserFromRequest(ctx)

  if (!user) {
    ctx.response.status = 401
    ctx.response.body = { error: "Du måste vara inloggad" }
    return
  }

  const supabase = getAuthenticatedSupabase(user.accessToken)

  const { data: ads, error } = await supabase
    .from("ads")
    .select("*, images(id)")
    .eq("user_id", user.id)
    .neq("state", "deleted")
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Get my ads error:", error.message, error.code)
    ctx.response.status = 500
    ctx.response.body = { error: "Kunde inte hämta annonser" }
    return
  }

  ctx.response.body = {
    ads: (ads || []).map((ad) => ({
      id: ad.id,
      user_id: ad.user_id,
      title: ad.title,
      description: ad.description,
      price: ad.price,
      category: ad.category,
      county: ad.county,
      state: ad.state,
      created_at: ad.created_at,
      updated_at: ad.updated_at,
      expires_at: ad.expires_at,
      image_count: ad.images?.length || 0,
    })),
  }
})

// Report ad (BBS law compliance - anyone can report)
// Note: IP is no longer stored as it's not necessary for the report function
router.post("/api/ads/:id/report", async (ctx) => {
  const id = parseInt(ctx.params.id)
  const body = await ctx.request.body.json()
  const { reason, details } = body

  if (!reason) {
    ctx.response.status = 400
    ctx.response.body = { error: "Ange en anledning till rapporten" }
    return
  }

  const validReasons = [
    "illegal_content",
    "fraud",
    "spam",
    "offensive",
    "wrong_category",
    "other",
  ]

  if (!validReasons.includes(reason)) {
    ctx.response.status = 400
    ctx.response.body = { error: "Ogiltig anledning" }
    return
  }

  const supabase = getSupabase()

  // Verify ad exists and is visible
  const { data: ad, error: adError } = await supabase
    .from("ads")
    .select("id, title")
    .eq("id", id)
    .eq("state", "ok")
    .single()

  if (adError || !ad) {
    ctx.response.status = 404
    ctx.response.body = { error: "Annonsen hittades inte" }
    return
  }

  // Store report in database (without IP - not needed)
  const { error: reportError } = await supabase.from("reports").insert({
    ad_id: id,
    reason,
    details: details || null,
    status: "pending",
  })

  if (reportError) {
    // If reports table doesn't exist, log the report (without sensitive details)
    // This ensures the API works even without the table
    console.log(`Report received for ad ${id}: ${reason}`)
  }

  ctx.response.status = 201
  ctx.response.body = {
    message: "Tack för din rapport. Vi kommer granska annonsen.",
  }
})

export { router as adsRouter }
