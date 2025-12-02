import { assertEquals } from "../utils/test_utils.ts"
import {
  ADJACENT_COUNTIES_CONFIG,
  CATEGORIES_CONFIG,
  COUNTIES_CONFIG,
  getCategoryByName,
  getCategoryBySlug,
  getCountyByName,
  getCountyBySlug,
  getSubcategoryBySlug,
} from "./types.ts"

Deno.test("CATEGORIES_CONFIG - contains expected categories with slugs", () => {
  assertEquals(CATEGORIES_CONFIG.length, 10)

  const fordon = getCategoryBySlug("fordon")
  assertEquals(fordon?.name, "Fordon")
  assertEquals(fordon?.icon, "🚗")

  const elektronik = getCategoryBySlug("elektronik")
  assertEquals(elektronik?.name, "Elektronik")
})

Deno.test("CATEGORIES_CONFIG - Fordon has subcategories", () => {
  const fordon = getCategoryBySlug("fordon")
  assertEquals(fordon?.subcategories !== undefined, true)
  assertEquals((fordon?.subcategories?.length || 0) > 0, true)

  const bilar = getSubcategoryBySlug("fordon", "bilar")
  assertEquals(bilar?.name, "Bilar")

  const motorcyklar = getSubcategoryBySlug("fordon", "motorcyklar")
  assertEquals(motorcyklar?.name, "Motorcyklar")
})

Deno.test("COUNTIES_CONFIG - contains all Swedish counties with slugs", () => {
  assertEquals(COUNTIES_CONFIG.length, 21)

  const stockholm = getCountyBySlug("stockholm")
  assertEquals(stockholm?.name, "Stockholm")

  const skane = getCountyBySlug("skane")
  assertEquals(skane?.name, "Skåne")

  const vastraGotaland = getCountyBySlug("vastra-gotaland")
  assertEquals(vastraGotaland?.name, "Västra Götaland")
})

Deno.test("ADJACENT_COUNTIES_CONFIG - has entries for all counties", () => {
  for (const county of COUNTIES_CONFIG) {
    assertEquals(county.slug in ADJACENT_COUNTIES_CONFIG, true)
  }
})

Deno.test("ADJACENT_COUNTIES_CONFIG - relationships are symmetrical", () => {
  for (const [countySlug, adjacentSlugs] of Object.entries(ADJACENT_COUNTIES_CONFIG)) {
    for (const adjSlug of adjacentSlugs) {
      const reverseAdjacent = ADJACENT_COUNTIES_CONFIG[adjSlug] || []
      assertEquals(
        reverseAdjacent.includes(countySlug),
        true,
        `${adjSlug} should list ${countySlug} as adjacent`,
      )
    }
  }
})

Deno.test("getCategoryBySlug - finds category by slug", () => {
  const fordon = getCategoryBySlug("fordon")
  assertEquals(fordon?.name, "Fordon")

  const notFound = getCategoryBySlug("nonexistent")
  assertEquals(notFound, undefined)
})

Deno.test("getCategoryByName - finds category by name", () => {
  const fordon = getCategoryByName("Fordon")
  assertEquals(fordon?.slug, "fordon")

  const notFound = getCategoryByName("NonExistent")
  assertEquals(notFound, undefined)
})

Deno.test("getCountyBySlug - finds county by slug", () => {
  const stockholm = getCountyBySlug("stockholm")
  assertEquals(stockholm?.name, "Stockholm")

  const notFound = getCountyBySlug("nonexistent")
  assertEquals(notFound, undefined)
})

Deno.test("getCountyByName - finds county by name", () => {
  const stockholm = getCountyByName("Stockholm")
  assertEquals(stockholm?.slug, "stockholm")

  const notFound = getCountyByName("NonExistent")
  assertEquals(notFound, undefined)
})
