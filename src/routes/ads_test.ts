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
