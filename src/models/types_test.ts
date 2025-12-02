import { assertEquals } from "../utils/test_utils.ts"
import {
  ADJACENT_COUNTIES,
  ADJACENT_COUNTIES_CONFIG,
  CATEGORIES,
  CATEGORIES_CONFIG,
  COUNTIES,
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

// Legacy compatibility tests
Deno.test("Legacy CATEGORIES - maintains backwards compatibility", () => {
  assertEquals(CATEGORIES.length, 10)
  assertEquals(CATEGORIES.includes("Fordon"), true)
  assertEquals(CATEGORIES.includes("Elektronik"), true)
  assertEquals(CATEGORIES.includes("Övrigt"), true)
})

Deno.test("Legacy COUNTIES - maintains backwards compatibility", () => {
  assertEquals(COUNTIES.length, 21)
  assertEquals(COUNTIES.includes("Stockholm"), true)
  assertEquals(COUNTIES.includes("Skåne"), true)
  assertEquals(COUNTIES.includes("Västra Götaland"), true)
})

Deno.test("Legacy ADJACENT_COUNTIES - maintains backwards compatibility", () => {
  for (const county of COUNTIES) {
    assertEquals(county in ADJACENT_COUNTIES, true)
  }
})

Deno.test("getCategoryByName - finds category by name", () => {
  const fordon = getCategoryByName("Fordon")
  assertEquals(fordon?.slug, "fordon")

  const notFound = getCategoryByName("NonExistent")
  assertEquals(notFound, undefined)
})

Deno.test("getCountyByName - finds county by name", () => {
  const stockholm = getCountyByName("Stockholm")
  assertEquals(stockholm?.slug, "stockholm")

  const notFound = getCountyByName("NonExistent")
  assertEquals(notFound, undefined)
})
