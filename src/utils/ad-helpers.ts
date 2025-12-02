import { SupabaseClient } from "@supabase/supabase-js"
import { getCategoryBySlug, getCountyBySlug, getSubcategoryBySlug } from "../models/types.ts"

/**
 * Helper functions for working with ads
 */

interface AdImage {
  id: number
  storage_path: string
  filename?: string
}

interface RawAd {
  id: number
  user_id: string
  title: string
  description: string
  price: number
  category: string
  subcategory?: string | null
  county: string
  state: string
  allow_messages?: boolean
  created_at: string
  updated_at: string
  expires_at: string
  images?: AdImage[]
  seller_contact_phone?: string | null
}

interface EnrichedAd {
  id: number
  user_id: string
  title: string
  description: string
  price: number
  category: string
  category_name: string
  subcategory?: string | null
  subcategory_name?: string | null
  county: string
  county_name: string
  state: string
  allow_messages: boolean
  created_at: string
  updated_at: string
  expires_at: string
  seller_contact_phone?: string | null
}

/**
 * Enriches an ad with display names for category, subcategory, and county
 */
export function enrichAdWithDisplayNames(ad: RawAd): EnrichedAd {
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
    category: ad.category,
    category_name: categoryConfig?.name || ad.category,
    subcategory: ad.subcategory,
    subcategory_name: subcategoryConfig?.name || ad.subcategory,
    county: ad.county,
    county_name: countyConfig?.name || ad.county,
    state: ad.state,
    allow_messages: ad.allow_messages !== false,
    created_at: ad.created_at,
    updated_at: ad.updated_at,
    expires_at: ad.expires_at,
    seller_contact_phone: ad.seller_contact_phone,
  }
}

/**
 * Gets the public URL for an image from storage
 */
export function getImagePublicUrl(supabase: SupabaseClient, storagePath: string): string {
  return supabase.storage.from("ad-images").getPublicUrl(storagePath).data.publicUrl
}

/**
 * Gets the first image URL from an array of images
 */
export function getFirstImageUrl(supabase: SupabaseClient, images?: AdImage[]): string | null {
  if (!images || images.length === 0) return null
  return getImagePublicUrl(supabase, images[0].storage_path)
}
