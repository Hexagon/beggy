/**
 * Master configuration for Beggy.
 * Contains counties, categories, and subcategories with slugs and display names.
 */

export interface County {
  slug: string
  name: string
}

export interface SubCategory {
  slug: string
  name: string
}

export interface Category {
  slug: string
  name: string
  icon: string
  subcategories?: SubCategory[]
}

/**
 * Swedish counties (län) with slugs for URL-safe identifiers.
 */
export const COUNTIES_CONFIG: County[] = [
  { slug: "blekinge", name: "Blekinge" },
  { slug: "dalarna", name: "Dalarna" },
  { slug: "gotland", name: "Gotland" },
  { slug: "gavleborg", name: "Gävleborg" },
  { slug: "halland", name: "Halland" },
  { slug: "jamtland", name: "Jämtland" },
  { slug: "jonkoping", name: "Jönköping" },
  { slug: "kalmar", name: "Kalmar" },
  { slug: "kronoberg", name: "Kronoberg" },
  { slug: "norrbotten", name: "Norrbotten" },
  { slug: "skane", name: "Skåne" },
  { slug: "stockholm", name: "Stockholm" },
  { slug: "sodermanland", name: "Södermanland" },
  { slug: "uppsala", name: "Uppsala" },
  { slug: "varmland", name: "Värmland" },
  { slug: "vasterbotten", name: "Västerbotten" },
  { slug: "vasternorrland", name: "Västernorrland" },
  { slug: "vastmanland", name: "Västmanland" },
  { slug: "vastra-gotaland", name: "Västra Götaland" },
  { slug: "orebro", name: "Örebro" },
  { slug: "ostergotland", name: "Östergötland" },
]

/**
 * Categories with slugs and optional subcategories.
 * Subcategories are currently only implemented for "Fordon".
 */
export const CATEGORIES_CONFIG: Category[] = [
  {
    slug: "fordon",
    name: "Fordon",
    icon: "🚗",
    subcategories: [
      { slug: "bilar", name: "Bilar" },
      { slug: "motorcyklar", name: "Motorcyklar" },
      { slug: "mopeder", name: "Mopeder" },
      { slug: "cyklar", name: "Cyklar" },
      { slug: "batar", name: "Båtar" },
      { slug: "husvagnar", name: "Husvagnar & Husbilar" },
      { slug: "lastbilar", name: "Lastbilar & Bussar" },
      { slug: "bildelar", name: "Bildelar & Tillbehör" },
      { slug: "ovriga-fordon", name: "Övriga fordon" },
    ],
  },
  { slug: "elektronik", name: "Elektronik", icon: "📱" },
  { slug: "mobler", name: "Möbler", icon: "🛋️" },
  { slug: "klader", name: "Kläder", icon: "👕" },
  { slug: "sport-fritid", name: "Sport & Fritid", icon: "⚽" },
  { slug: "hem-hushall", name: "Hem & Hushåll", icon: "🏠" },
  { slug: "barn-baby", name: "Barn & Baby", icon: "👶" },
  { slug: "djur", name: "Djur", icon: "🐕" },
  { slug: "hobby", name: "Hobby", icon: "🎨" },
  { slug: "ovrigt", name: "Övrigt", icon: "📦" },
]

/**
 * Adjacent counties mapping (which counties border each other).
 * Uses slugs as keys for consistency.
 */
export const ADJACENT_COUNTIES_CONFIG: Record<string, string[]> = {
  blekinge: ["skane", "kronoberg", "kalmar"],
  dalarna: ["gavleborg", "vasternorrland", "jamtland", "varmland", "orebro", "vastmanland"],
  gotland: [], // Island - no adjacent counties
  gavleborg: ["dalarna", "vasternorrland", "jamtland", "uppsala", "vastmanland"],
  halland: ["skane", "vastra-gotaland", "jonkoping", "kronoberg"],
  jamtland: ["vasternorrland", "vasterbotten", "dalarna", "gavleborg", "varmland"],
  jonkoping: ["halland", "vastra-gotaland", "ostergotland", "kalmar", "kronoberg"],
  kalmar: ["blekinge", "kronoberg", "jonkoping", "ostergotland"],
  kronoberg: ["blekinge", "skane", "halland", "jonkoping", "kalmar"],
  norrbotten: ["vasterbotten"],
  skane: ["blekinge", "kronoberg", "halland"],
  stockholm: ["uppsala", "sodermanland"],
  sodermanland: ["stockholm", "uppsala", "vastmanland", "orebro", "ostergotland"],
  uppsala: ["stockholm", "sodermanland", "vastmanland", "gavleborg"],
  varmland: ["dalarna", "orebro", "vastra-gotaland", "jamtland"],
  vasterbotten: ["norrbotten", "vasternorrland", "jamtland"],
  vasternorrland: ["vasterbotten", "jamtland", "gavleborg", "dalarna"],
  vastmanland: ["uppsala", "gavleborg", "dalarna", "orebro", "sodermanland"],
  "vastra-gotaland": ["halland", "jonkoping", "ostergotland", "orebro", "varmland"],
  orebro: ["varmland", "dalarna", "vastmanland", "sodermanland", "ostergotland", "vastra-gotaland"],
  ostergotland: ["sodermanland", "orebro", "vastra-gotaland", "jonkoping", "kalmar"],
}

// Helper functions for lookups

/**
 * Get category by slug.
 */
export function getCategoryBySlug(slug: string): Category | undefined {
  return CATEGORIES_CONFIG.find((c) => c.slug === slug)
}

/**
 * Get category by name (for backwards compatibility).
 */
export function getCategoryByName(name: string): Category | undefined {
  return CATEGORIES_CONFIG.find((c) => c.name === name)
}

/**
 * Get subcategory by slug within a category.
 */
export function getSubcategoryBySlug(categorySlug: string, subcategorySlug: string): SubCategory | undefined {
  const category = getCategoryBySlug(categorySlug)
  return category?.subcategories?.find((s) => s.slug === subcategorySlug)
}

/**
 * Get county by slug.
 */
export function getCountyBySlug(slug: string): County | undefined {
  return COUNTIES_CONFIG.find((c) => c.slug === slug)
}

/**
 * Get county by name (for backwards compatibility).
 */
export function getCountyByName(name: string): County | undefined {
  return COUNTIES_CONFIG.find((c) => c.name === name)
}

/**
 * Get adjacent county slugs for a given county slug.
 */
export function getAdjacentCountySlugs(slug: string): string[] {
  return ADJACENT_COUNTIES_CONFIG[slug] || []
}

