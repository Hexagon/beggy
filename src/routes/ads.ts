import { Router } from "@oak/oak"
import { getAuthenticatedSupabase, getSupabase } from "../db/database.ts"
import {
  ADJACENT_COUNTIES_CONFIG,
  CATEGORIES_CONFIG,
  COUNTIES_CONFIG,
  getAdjacentCountySlugs,
  getCategoryBySlug,
  getCountyBySlug,
  getSubcategoryBySlug,
} from "../models/types.ts"
import { getUserFromRequest } from "./auth.ts"
import { containsForbiddenWords } from "../utils/forbidden-words.ts"

// Helper arrays of valid slugs
const CATEGORY_SLUGS = CATEGORIES_CONFIG.map((c) => c.slug)
const COUNTY_SLUGS = COUNTIES_CONFIG.map((c) => c.slug)

const router = new Router()
const MAX_IMAGES_PER_AD = 5
const AD_EXPIRY_DAYS = 30

// Get all ads (with pagination and filters)
router.get("/api/ads", async (ctx) => {
  const params = ctx.request.url.searchParams
  const category = params.get("category")
  const subcategory = params.get("subcategory")
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

  if (subcategory) {
    query = query.eq("subcategory", subcategory)
  }

  if (county) {
    if (includeAdjacent) {
      // Include selected county and its adjacent counties (using slugs)
      const adjacentCountySlugs = getAdjacentCountySlugs(county)
      const allCountySlugs = [county, ...adjacentCountySlugs]
      query = query.in("county", allCountySlugs)
    } else {
      query = query.eq("county", county)
    }
  }

  if (search) {
    // Escape special characters in search to prevent SQL injection
    // In PostgREST pattern matching: % is wildcard, _ matches single char, \ is escape
    // Must escape backslash first to prevent double-escaping
    const escapedSearch = search.replace(/\\/g, "\\\\").replace(/[%_]/g, "\\$&")
    query = query.or(`title.ilike.%${escapedSearch}%,description.ilike.%${escapedSearch}%`)
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

      // Get display names from slugs
      const categoryConfig = getCategoryBySlug(ad.category)
      const countyConfig = getCountyBySlug(ad.county)
      const subcategoryConfig = ad.subcategory
        ? getSubcategoryBySlug(ad.category, ad.subcategory)
        : null

      return {
        id: ad.id,
        user_id: ad.user_id,
        title: ad.title,
        description: ad.description,
        price: ad.price,
        category: ad.category, // slug
        category_name: categoryConfig?.name || ad.category, // display name
        subcategory: ad.subcategory, // slug
        subcategory_name: subcategoryConfig?.name || ad.subcategory, // display name
        county: ad.county, // slug
        county_name: countyConfig?.name || ad.county, // display name
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

  // Get display names from slugs
  const categoryConfig = getCategoryBySlug(ad.category)
  const countyConfig = getCountyBySlug(ad.county)
  const subcategoryConfig = ad.subcategory
    ? getSubcategoryBySlug(ad.category, ad.subcategory)
    : null

  ctx.response.body = {
    id: ad.id,
    user_id: ad.user_id,
    title: ad.title,
    description: ad.description,
    price: ad.price,
    category: ad.category, // slug
    category_name: categoryConfig?.name || ad.category, // display name
    subcategory: ad.subcategory, // slug
    subcategory_name: subcategoryConfig?.name || ad.subcategory, // display name
    county: ad.county, // slug
    county_name: countyConfig?.name || ad.county, // display name
    state: ad.state,
    allow_messages: ad.allow_messages !== false, // default to true for backwards compatibility
    created_at: ad.created_at,
    updated_at: ad.updated_at,
    expires_at: ad.expires_at,
    seller_username: ad.profiles?.username || "Användare",
    seller_contact_phone: ad.contact_phone,
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
  const {
    title,
    description,
    price,
    category,
    subcategory,
    county,
    contact_phone,
    allow_messages,
  } = body

  if (!title || !description || price === undefined || !category || !county) {
    ctx.response.status = 400
    ctx.response.body = { error: "Titel, beskrivning, pris, kategori och län krävs" }
    return
  }

  // Validate category slug
  if (!CATEGORY_SLUGS.includes(category)) {
    ctx.response.status = 400
    ctx.response.body = { error: "Ogiltig kategori" }
    return
  }

  // Validate subcategory slug if provided
  if (subcategory) {
    const subcategoryConfig = getSubcategoryBySlug(category, subcategory)
    if (!subcategoryConfig) {
      ctx.response.status = 400
      ctx.response.body = { error: "Ogiltig underkategori" }
      return
    }
  }

  // Validate county slug
  if (!COUNTY_SLUGS.includes(county)) {
    ctx.response.status = 400
    ctx.response.body = { error: "Ogiltigt län" }
    return
  }

  if (typeof price !== "number" || price < 0) {
    ctx.response.status = 400
    ctx.response.body = { error: "Ogiltigt pris" }
    return
  }

  // Trim whitespace from contact fields
  const trimmedPhone = typeof contact_phone === "string" ? contact_phone.trim() : null

  // Validate that at least one contact method is enabled
  const hasMessages = allow_messages !== false // default to true
  const hasPhone = !!trimmedPhone

  if (!hasMessages && !hasPhone) {
    ctx.response.status = 400
    ctx.response.body = {
      error: "Du måste välja minst ett kontaktsätt (meddelanden eller telefon)",
    }
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
      category, // slug
      subcategory: subcategory || null, // slug
      county, // slug
      contact_phone: trimmedPhone || null,
      allow_messages: allow_messages !== false, // default to true
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
  const {
    title,
    description,
    price,
    category,
    subcategory,
    county,
    contact_phone,
    allow_messages,
    state,
  } = body

  // Validate category slug if provided
  if (category && !CATEGORY_SLUGS.includes(category)) {
    ctx.response.status = 400
    ctx.response.body = { error: "Ogiltig kategori" }
    return
  }

  // Validate county slug if provided
  if (county && !COUNTY_SLUGS.includes(county)) {
    ctx.response.status = 400
    ctx.response.body = { error: "Ogiltigt län" }
    return
  }

  // Validate subcategory slug if provided (requires category context)
  if (subcategory && category) {
    const subcategoryConfig = getSubcategoryBySlug(category, subcategory)
    if (!subcategoryConfig) {
      ctx.response.status = 400
      ctx.response.body = { error: "Ogiltig underkategori" }
      return
    }
  }

  // Trim whitespace from contact fields
  const trimmedPhone = typeof contact_phone === "string" ? contact_phone.trim() : contact_phone

  // Validate that at least one contact method is enabled when updating contact settings
  if (allow_messages !== undefined || contact_phone !== undefined) {
    const hasMessages = allow_messages !== false // default to true if not specified
    const hasPhone = !!trimmedPhone

    if (!hasMessages && !hasPhone) {
      ctx.response.status = 400
      ctx.response.body = {
        error: "Du måste välja minst ett kontaktsätt (meddelanden eller telefon)",
      }
      return
    }
  }

  // Check for forbidden words in updated content
  if (containsForbiddenWords({ title, description })) {
    ctx.response.status = 400
    ctx.response.body = { error: "Annonsen innehåller otillåtna ord. Vänligen ändra texten." }
    return
  }

  const updates: Record<string, string | number | boolean | null> = {}

  if (title !== undefined) updates.title = title
  if (description !== undefined) updates.description = description
  if (price !== undefined) updates.price = price
  if (category !== undefined) updates.category = category // slug
  if (subcategory !== undefined) updates.subcategory = subcategory || null // slug
  if (county !== undefined) updates.county = county // slug
  if (contact_phone !== undefined) updates.contact_phone = trimmedPhone || null
  if (allow_messages !== undefined) updates.allow_messages = allow_messages
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

// Mark ad as unsold (set state back to 'ok')
router.put("/api/ads/:id/unsold", async (ctx) => {
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
    ctx.response.body = { error: "Du kan bara uppdatera dina egna annonser" }
    return
  }

  const { error } = await supabase.from("ads").update({ state: "ok" }).eq("id", id)
  if (error) {
    console.error("Unsold ad error:", error.message, error.code)
    ctx.response.status = 500
    ctx.response.body = { error: "Kunde inte markera som osåld" }
    return
  }

  ctx.response.body = { message: "Annons markerad som osåld" }
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

// Get categories (with full config including subcategories)
router.get("/api/categories", (ctx) => {
  ctx.response.body = {
    // Only return the config with slugs - frontend should use slugs
    categoriesConfig: CATEGORIES_CONFIG,
  }
})

// Get counties (with full config including slugs)
router.get("/api/counties", (ctx) => {
  ctx.response.body = {
    // Only return the config with slugs - frontend should use slugs
    countiesConfig: COUNTIES_CONFIG,
    adjacentCountiesConfig: ADJACENT_COUNTIES_CONFIG,
  }
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
    .neq("state", "reported")
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Get my ads error:", error.message, error.code)
    ctx.response.status = 500
    ctx.response.body = { error: "Kunde inte hämta annonser" }
    return
  }

  ctx.response.body = {
    ads: (ads || []).map((ad) => {
      // Get display names from slugs
      const categoryConfig = getCategoryBySlug(ad.category)
      const countyConfig = getCountyBySlug(ad.county)
      const subcategoryConfig = ad.subcategory
        ? getSubcategoryBySlug(ad.category, ad.subcategory)
        : null

      return {
        id: ad.id,
        user_id: ad.user_id,
        title: ad.title,
        description: ad.description,
        price: ad.price,
        category: ad.category, // slug
        category_name: categoryConfig?.name || ad.category, // display name
        subcategory: ad.subcategory, // slug
        subcategory_name: subcategoryConfig?.name || ad.subcategory, // display name
        county: ad.county, // slug
        county_name: countyConfig?.name || ad.county, // display name
        state: ad.state,
        created_at: ad.created_at,
        updated_at: ad.updated_at,
        expires_at: ad.expires_at,
        image_count: ad.images?.length || 0,
      }
    }),
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

  // Hide the ad while reported
  await supabase.from("ads").update({ state: "reported" }).eq("id", id)

  ctx.response.status = 201
  ctx.response.body = {
    message: "Tack för din rapport. Vi kommer granska annonsen.",
  }
})

export { router as adsRouter }
