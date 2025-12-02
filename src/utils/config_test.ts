import { assertEquals } from "./test_utils.ts"
import {
  ADJACENT_COUNTIES_CONFIG,
  CATEGORIES_CONFIG,
  COUNTIES_CONFIG,
  getAdjacentCountySlugs,
  getCategoryByName,
  getCategoryBySlug,
  getCountyByName,
  getCountyBySlug,
  getSubcategoryBySlug,
} from "../config.ts"

Deno.test("CATEGORIES_CONFIG - has correct structure", () => {
  for (const category of CATEGORIES_CONFIG) {
    assertEquals(typeof category.slug, "string", "slug should be a string")
    assertEquals(typeof category.name, "string", "name should be a string")
    assertEquals(typeof category.icon, "string", "icon should be a string")
    // Subcategories are optional
    if (category.subcategories) {
      assertEquals(Array.isArray(category.subcategories), true, "subcategories should be an array")
      for (const sub of category.subcategories) {
        assertEquals(typeof sub.slug, "string", "subcategory slug should be a string")
        assertEquals(typeof sub.name, "string", "subcategory name should be a string")
      }
    }
  }
})

Deno.test("COUNTIES_CONFIG - has correct structure", () => {
  for (const county of COUNTIES_CONFIG) {
    assertEquals(typeof county.slug, "string", "slug should be a string")
    assertEquals(typeof county.name, "string", "name should be a string")
  }
})

Deno.test("getCategoryBySlug - returns correct category", () => {
  const fordon = getCategoryBySlug("fordon")
  assertEquals(fordon?.name, "Fordon")
  assertEquals(fordon?.icon, "🚗")

  const nonExistent = getCategoryBySlug("does-not-exist")
  assertEquals(nonExistent, undefined)
})

Deno.test("getCategoryByName - returns correct category", () => {
  const elektronik = getCategoryByName("Elektronik")
  assertEquals(elektronik?.slug, "elektronik")
  assertEquals(elektronik?.icon, "📱")
})

Deno.test("getSubcategoryBySlug - returns correct subcategory for Fordon", () => {
  const bilar = getSubcategoryBySlug("fordon", "bilar")
  assertEquals(bilar?.name, "Bilar")

  const cyklar = getSubcategoryBySlug("fordon", "cyklar")
  assertEquals(cyklar?.name, "Cyklar")

  // Non-existent subcategory
  const nonExistent = getSubcategoryBySlug("fordon", "does-not-exist")
  assertEquals(nonExistent, undefined)

  // Non-existent category
  const noCategory = getSubcategoryBySlug("does-not-exist", "bilar")
  assertEquals(noCategory, undefined)

  // Category without subcategories
  const noSubcats = getSubcategoryBySlug("elektronik", "bilar")
  assertEquals(noSubcats, undefined)
})

Deno.test("getCountyBySlug - returns correct county", () => {
  const stockholm = getCountyBySlug("stockholm")
  assertEquals(stockholm?.name, "Stockholm")

  const skane = getCountyBySlug("skane")
  assertEquals(skane?.name, "Skåne")
})

Deno.test("getCountyByName - returns correct county", () => {
  const vastraGotaland = getCountyByName("Västra Götaland")
  assertEquals(vastraGotaland?.slug, "vastra-gotaland")
})

Deno.test("getAdjacentCountySlugs - returns adjacent counties", () => {
  const stockholmAdjacent = getAdjacentCountySlugs("stockholm")
  assertEquals(stockholmAdjacent.includes("uppsala"), true)
  assertEquals(stockholmAdjacent.includes("sodermanland"), true)

  const gotlandAdjacent = getAdjacentCountySlugs("gotland")
  assertEquals(gotlandAdjacent.length, 0) // Island - no adjacent

  const nonExistent = getAdjacentCountySlugs("does-not-exist")
  assertEquals(nonExistent.length, 0)
})

Deno.test("All category slugs are URL-safe", () => {
  const urlSafePattern = /^[a-z0-9-]+$/
  for (const category of CATEGORIES_CONFIG) {
    assertEquals(
      urlSafePattern.test(category.slug),
      true,
      `Category slug "${category.slug}" should be URL-safe`,
    )
    if (category.subcategories) {
      for (const sub of category.subcategories) {
        assertEquals(
          urlSafePattern.test(sub.slug),
          true,
          `Subcategory slug "${sub.slug}" should be URL-safe`,
        )
      }
    }
  }
})

Deno.test("All county slugs are URL-safe", () => {
  const urlSafePattern = /^[a-z0-9-]+$/
  for (const county of COUNTIES_CONFIG) {
    assertEquals(
      urlSafePattern.test(county.slug),
      true,
      `County slug "${county.slug}" should be URL-safe`,
    )
  }
})

Deno.test("ADJACENT_COUNTIES_CONFIG keys match county slugs", () => {
  const countySlugs = new Set(COUNTIES_CONFIG.map((c) => c.slug))
  for (const slug of Object.keys(ADJACENT_COUNTIES_CONFIG)) {
    assertEquals(
      countySlugs.has(slug),
      true,
      `Adjacent county key "${slug}" should exist in COUNTIES_CONFIG`,
    )
  }
})
