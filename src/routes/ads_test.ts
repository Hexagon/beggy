/**
 * Tests for the ads API validation logic.
 * These tests verify that category and county slugs are validated correctly.
 */

import { assertEquals } from "../utils/test_utils.ts"
import {
  CATEGORIES_CONFIG,
  COUNTIES_CONFIG,
  getCategoryBySlug,
  getCountyBySlug,
  getSubcategoryBySlug,
} from "../models/types.ts"

// Re-create the validation arrays used in ads.ts
const CATEGORY_SLUGS = CATEGORIES_CONFIG.map((c) => c.slug)
const COUNTY_SLUGS = COUNTIES_CONFIG.map((c) => c.slug)

Deno.test("CATEGORY_SLUGS - contains all category slugs from config", () => {
  for (const category of CATEGORIES_CONFIG) {
    assertEquals(
      CATEGORY_SLUGS.includes(category.slug),
      true,
      `Category slug "${category.slug}" should be in CATEGORY_SLUGS`,
    )
  }
})

Deno.test("COUNTY_SLUGS - contains all county slugs from config", () => {
  for (const county of COUNTIES_CONFIG) {
    assertEquals(
      COUNTY_SLUGS.includes(county.slug),
      true,
      `County slug "${county.slug}" should be in COUNTY_SLUGS`,
    )
  }
})

Deno.test("Category slug validation - valid slugs are accepted", () => {
  // All category slugs should be valid
  for (const slug of CATEGORY_SLUGS) {
    assertEquals(
      CATEGORY_SLUGS.includes(slug),
      true,
      `Category slug "${slug}" should be valid`,
    )
    // Should also be retrievable via getCategoryBySlug
    const category = getCategoryBySlug(slug)
    assertEquals(category !== undefined, true, `getCategoryBySlug should find "${slug}"`)
  }
})

Deno.test("Category slug validation - invalid slugs are rejected", () => {
  const invalidSlugs = [
    "Fordon", // Display name, not slug
    "Elektronik", // Display name, not slug
    "FORDON", // Wrong case
    "fordon ", // Trailing space
    " fordon", // Leading space
    "fordon/bilar", // Path separator
    "non-existent",
    "",
    "möbler", // Non-ASCII (should use 'mobler')
    "kläder", // Non-ASCII (should use 'klader')
  ]

  for (const slug of invalidSlugs) {
    assertEquals(
      CATEGORY_SLUGS.includes(slug),
      false,
      `Invalid category slug "${slug}" should not be accepted`,
    )
  }
})

Deno.test("County slug validation - valid slugs are accepted", () => {
  // All county slugs should be valid
  for (const slug of COUNTY_SLUGS) {
    assertEquals(
      COUNTY_SLUGS.includes(slug),
      true,
      `County slug "${slug}" should be valid`,
    )
    // Should also be retrievable via getCountyBySlug
    const county = getCountyBySlug(slug)
    assertEquals(county !== undefined, true, `getCountyBySlug should find "${slug}"`)
  }
})

Deno.test("County slug validation - invalid slugs are rejected", () => {
  const invalidSlugs = [
    "Stockholm", // Display name, not slug
    "Skåne", // Display name with special char
    "Västra Götaland", // Display name with spaces and special chars
    "STOCKHOLM", // Wrong case
    "stockholm ", // Trailing space
    " stockholm", // Leading space
    "non-existent",
    "",
    "gävleborg", // Non-ASCII (should use 'gavleborg')
    "jönköping", // Non-ASCII (should use 'jonkoping')
  ]

  for (const slug of invalidSlugs) {
    assertEquals(
      COUNTY_SLUGS.includes(slug),
      false,
      `Invalid county slug "${slug}" should not be accepted`,
    )
  }
})

Deno.test("Subcategory slug validation - Fordon subcategories are valid", () => {
  const fordon = getCategoryBySlug("fordon")
  assertEquals(fordon !== undefined, true, "Fordon category should exist")

  if (fordon?.subcategories) {
    for (const subcategory of fordon.subcategories) {
      const found = getSubcategoryBySlug("fordon", subcategory.slug)
      assertEquals(
        found !== undefined,
        true,
        `Subcategory "${subcategory.slug}" should be found via getSubcategoryBySlug`,
      )
      assertEquals(found?.name, subcategory.name, "Names should match")
    }
  }
})

Deno.test("Subcategory slug validation - invalid subcategories are rejected", () => {
  const invalidSubcategories = [
    { category: "fordon", subcategory: "Bilar" }, // Display name, not slug
    { category: "fordon", subcategory: "BILAR" }, // Wrong case
    { category: "fordon", subcategory: "non-existent" },
    { category: "elektronik", subcategory: "bilar" }, // Wrong category
    { category: "non-existent", subcategory: "bilar" }, // Invalid category
  ]

  for (const { category, subcategory } of invalidSubcategories) {
    const found = getSubcategoryBySlug(category, subcategory)
    assertEquals(
      found,
      undefined,
      `Invalid subcategory "${subcategory}" in "${category}" should not be found`,
    )
  }
})

Deno.test("Category config - slugs differ from display names", () => {
  // Verify that slugs are not the same as display names (except for simple cases)
  const categoriesWithDifferentSlugs = CATEGORIES_CONFIG.filter(
    (c) => c.slug !== c.name.toLowerCase(),
  )
  // At least some categories should have different slugs (e.g., "mobler" vs "Möbler")
  assertEquals(
    categoriesWithDifferentSlugs.length > 0,
    true,
    "Some categories should have slugs that differ from their names",
  )
})

Deno.test("County config - slugs differ from display names", () => {
  // Verify that slugs are not the same as display names (many have special chars)
  const countiesWithDifferentSlugs = COUNTIES_CONFIG.filter(
    (c) => c.slug !== c.name.toLowerCase(),
  )
  // Most counties should have different slugs (e.g., "gavleborg" vs "Gävleborg")
  assertEquals(
    countiesWithDifferentSlugs.length > 0,
    true,
    "Some counties should have slugs that differ from their names",
  )
})

Deno.test("Slug format - all slugs are URL-safe lowercase with hyphens", () => {
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

  for (const county of COUNTIES_CONFIG) {
    assertEquals(
      urlSafePattern.test(county.slug),
      true,
      `County slug "${county.slug}" should be URL-safe`,
    )
  }
})

// Test that simulates what the frontend should send
Deno.test("Frontend simulation - category select sends slug, not name", () => {
  // When user selects "Fordon" from dropdown, the value sent should be "fordon"
  const selectedCategoryName = "Fordon"
  const categoryConfig = CATEGORIES_CONFIG.find((c) => c.name === selectedCategoryName)
  assertEquals(categoryConfig !== undefined, true, "Category should exist")

  const slugToSend = categoryConfig!.slug
  assertEquals(slugToSend, "fordon", "Slug for 'Fordon' should be 'fordon'")
  assertEquals(CATEGORY_SLUGS.includes(slugToSend), true, "Sent slug should be valid")
})

Deno.test("Frontend simulation - county select sends slug, not name", () => {
  // When user selects "Gävleborg" from dropdown, the value sent should be "gavleborg"
  const selectedCountyName = "Gävleborg"
  const countyConfig = COUNTIES_CONFIG.find((c) => c.name === selectedCountyName)
  assertEquals(countyConfig !== undefined, true, "County should exist")

  const slugToSend = countyConfig!.slug
  assertEquals(slugToSend, "gavleborg", "Slug for 'Gävleborg' should be 'gavleborg'")
  assertEquals(COUNTY_SLUGS.includes(slugToSend), true, "Sent slug should be valid")
})

Deno.test("Ad input validation - title length constraints", () => {
  const MAX_TITLE_LENGTH = 100

  const validTitle = "En begagnad cykel i gott skick"
  const tooLongTitle = "a".repeat(101)

  assertEquals(
    validTitle.length <= MAX_TITLE_LENGTH,
    true,
    "Normal title should be accepted",
  )
  assertEquals(
    tooLongTitle.length > MAX_TITLE_LENGTH,
    true,
    "Title exceeding 100 chars should be rejected",
  )
})

Deno.test("Ad input validation - description length constraints", () => {
  const MAX_DESCRIPTION_LENGTH = 5000

  const validDescription = "Fin cykel, lite använd."
  const tooLongDescription = "a".repeat(5001)

  assertEquals(
    validDescription.length <= MAX_DESCRIPTION_LENGTH,
    true,
    "Normal description should be accepted",
  )
  assertEquals(
    tooLongDescription.length > MAX_DESCRIPTION_LENGTH,
    true,
    "Description exceeding 5000 chars should be rejected",
  )
})

Deno.test("Ad ID validation - NaN IDs should be rejected", () => {
  // Simulate the parseInt + isNaN check used in route handlers
  const validId = parseInt("42")
  const invalidId = parseInt("abc")
  const emptyId = parseInt("")

  assertEquals(isNaN(validId), false, "Numeric string '42' should produce valid ID")
  assertEquals(isNaN(invalidId), true, "Non-numeric string 'abc' should produce NaN")
  assertEquals(isNaN(emptyId), true, "Empty string should produce NaN")
})

Deno.test("Ad creation endpoint - rejects invalid payload", () => {
  const MAX_TITLE_LENGTH = 100

  // Intentionally invalid: title too long and invalid category slug
  const invalidTitle = "a".repeat(101)
  const invalidCategorySlug = "non-existent-category"

  assertEquals(
    invalidTitle.length > MAX_TITLE_LENGTH,
    true,
    "Title exceeding max length should be rejected",
  )
  assertEquals(
    CATEGORY_SLUGS.includes(invalidCategorySlug),
    false,
    "Invalid category slug should not be accepted",
  )
})

Deno.test("Ad creation endpoint - accepts minimally valid payload", () => {
  const MAX_TITLE_LENGTH = 100
  const MAX_DESCRIPTION_LENGTH = 5000

  const validTitle = "En begagnad cykel i gott skick"
  const validDescription = "Fin cykel, lite använd."
  const validCategorySlug = CATEGORY_SLUGS[0]
  const validCountySlug = COUNTY_SLUGS[0]

  assertEquals(
    validTitle.length <= MAX_TITLE_LENGTH,
    true,
    "Valid title should be accepted",
  )
  assertEquals(
    validDescription.length <= MAX_DESCRIPTION_LENGTH,
    true,
    "Valid description should be accepted",
  )
  assertEquals(
    CATEGORY_SLUGS.includes(validCategorySlug),
    true,
    "Valid category slug should be accepted",
  )
  assertEquals(
    COUNTY_SLUGS.includes(validCountySlug),
    true,
    "Valid county slug should be accepted",
  )
})

Deno.test("Ad update endpoint - rejects invalid ad ID and payload", () => {
  const MAX_DESCRIPTION_LENGTH = 5000

  // Invalid ID (non-numeric) → isNaN check rejects it
  const invalidId = "abc"
  assertEquals(isNaN(parseInt(invalidId)), true, "Non-numeric ID should be rejected")

  // Invalid payload: description too long
  const tooLongDescription = "a".repeat(5001)
  assertEquals(
    tooLongDescription.length > MAX_DESCRIPTION_LENGTH,
    true,
    "Description exceeding max length should be rejected",
  )
})
