import { assertEquals } from "@std/assert"

Deno.test("SQL injection protection - search parameter with wildcards is escaped", () => {
  // Test the escaping logic that should be used in ads.ts
  const maliciousSearch = "test%'; DROP TABLE ads; --"
  // Must escape backslash first, then other special chars
  const escapedSearch = maliciousSearch.replace(/\\/g, "\\\\").replace(/[%_]/g, "\\$&")

  // After escaping, wildcards should be escaped
  assertEquals(escapedSearch, "test\\%'; DROP TABLE ads; --")

  // Verify no unescaped wildcards remain (compatible check without lookbehind)
  // Count backslashes before each wildcard - should always be odd number
  const wildcardPattern = /\\*[%_]/g
  const matches = escapedSearch.match(wildcardPattern) || []
  for (const match of matches) {
    const backslashes = match.length - 1
    // If backslashes are even (including 0), the wildcard is unescaped
    assertEquals(backslashes % 2, 1, `Unescaped wildcard found in: ${match}`)
  }
})

Deno.test("SQL injection protection - search parameter with underscores is escaped", () => {
  const search = "test_value"
  const escapedSearch = search.replace(/\\/g, "\\\\").replace(/[%_]/g, "\\$&")

  assertEquals(escapedSearch, "test\\_value")
})

Deno.test("SQL injection protection - search parameter with backslashes is escaped", () => {
  const search = "test\\value"
  const escapedSearch = search.replace(/\\/g, "\\\\").replace(/[%_]/g, "\\$&")

  // Backslash should be escaped to double backslash
  assertEquals(escapedSearch, "test\\\\value")
})

Deno.test("SQL injection protection - combined backslash and wildcard escaping", () => {
  const search = "test\\%value"
  const escapedSearch = search.replace(/\\/g, "\\\\").replace(/[%_]/g, "\\$&")

  // Backslash escaped first, then wildcard
  assertEquals(escapedSearch, "test\\\\\\%value")
})

Deno.test("SQL injection protection - normal search text is preserved", () => {
  const search = "normal search text"
  const escapedSearch = search.replace(/\\/g, "\\\\").replace(/[%_]/g, "\\$&")

  assertEquals(escapedSearch, "normal search text")
})
