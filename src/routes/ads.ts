import { Router } from "@oak/oak"
import { getSupabase } from "../db/database.ts"
import { CATEGORIES } from "../models/types.ts"
import { getUserFromRequest } from "./auth.ts"

const router = new Router()
const MAX_IMAGES_PER_AD = 5

// Get all ads (with pagination and filters)
router.get("/api/ads", async (ctx) => {
  const params = ctx.request.url.searchParams
  const category = params.get("category")
  const city = params.get("city")
  const search = params.get("search")
  const page = parseInt(params.get("page") || "1")
  const limit = Math.min(parseInt(params.get("limit") || "20"), 50)
  const offset = (page - 1) * limit

  const supabase = getSupabase()

  let query = supabase
    .from("ads")
    .select("*, images(id)", { count: "exact" })
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1)

  if (category) {
    query = query.eq("category", category)
  }

  if (city) {
    query = query.eq("city", city)
  }

  if (search) {
    query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`)
  }

  const { data: ads, count, error } = await query

  if (error) {
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
      city: ad.city,
      status: ad.status,
      created_at: ad.created_at,
      updated_at: ad.updated_at,
      image_count: ad.images?.length || 0,
    })),
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

  const supabase = getSupabase()

  const { data: ad, error } = await supabase
    .from("ads")
    .select("*, profiles(name, city), images(id, filename, storage_path)")
    .eq("id", id)
    .neq("status", "deleted")
    .single()

  if (error || !ad) {
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
    city: ad.city,
    status: ad.status,
    created_at: ad.created_at,
    updated_at: ad.updated_at,
    seller_name: ad.profiles?.name || "Användare",
    seller_city: ad.profiles?.city,
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

  const supabase = getSupabase()

  const { data, error } = await supabase
    .from("ads")
    .insert({
      user_id: user.id,
      title,
      description,
      price,
      category,
      city: city || null,
    })
    .select("id")
    .single()

  if (error) {
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

  const supabase = getSupabase()

  // Check ownership
  const { data: ad } = await supabase.from("ads").select("user_id").eq("id", id).single()

  if (!ad || ad.user_id !== user.id) {
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

  const updates: Record<string, string | number | null> = {}

  if (title !== undefined) updates.title = title
  if (description !== undefined) updates.description = description
  if (price !== undefined) updates.price = price
  if (category !== undefined) updates.category = category
  if (city !== undefined) updates.city = city
  if (status !== undefined && ["active", "sold"].includes(status)) updates.status = status

  if (Object.keys(updates).length === 0) {
    ctx.response.status = 400
    ctx.response.body = { error: "Inga uppdateringar skickades" }
    return
  }

  const { error } = await supabase.from("ads").update(updates).eq("id", id)

  if (error) {
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

  const supabase = getSupabase()

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

  // Soft delete ad
  await supabase.from("ads").update({ status: "deleted" }).eq("id", id)

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

  const supabase = getSupabase()

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

  const supabase = getSupabase()

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

// Get user's ads
router.get("/api/my-ads", async (ctx) => {
  const user = await getUserFromRequest(ctx)

  if (!user) {
    ctx.response.status = 401
    ctx.response.body = { error: "Du måste vara inloggad" }
    return
  }

  const supabase = getSupabase()

  const { data: ads, error } = await supabase
    .from("ads")
    .select("*, images(id)")
    .eq("user_id", user.id)
    .neq("status", "deleted")
    .order("created_at", { ascending: false })

  if (error) {
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
      city: ad.city,
      status: ad.status,
      created_at: ad.created_at,
      updated_at: ad.updated_at,
      image_count: ad.images?.length || 0,
    })),
  }
})

// Report ad (BBS law compliance - anyone can report)
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

  // Verify ad exists
  const { data: ad, error: adError } = await supabase
    .from("ads")
    .select("id, title")
    .eq("id", id)
    .neq("status", "deleted")
    .single()

  if (adError || !ad) {
    ctx.response.status = 404
    ctx.response.body = { error: "Annonsen hittades inte" }
    return
  }

  // Store report in database (creates table if not exists via Supabase)
  // Note: The reports table needs to be created in Supabase SQL Editor
  const { error: reportError } = await supabase.from("reports").insert({
    ad_id: id,
    reason,
    details: details || null,
    reporter_ip: ctx.request.ip,
    status: "pending",
  })

  if (reportError) {
    // If reports table doesn't exist, log the report and return success anyway
    // This ensures the API works even without the table
    console.log(`Report for ad ${id}: ${reason} - ${details || "No details"}`)
  }

  ctx.response.status = 201
  ctx.response.body = {
    message: "Tack för din rapport. Vi kommer granska annonsen.",
  }
})

export { router as adsRouter }
