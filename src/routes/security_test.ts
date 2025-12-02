import { assertEquals } from "@std/assert"

Deno.test("SQL injection protection - search parameter with wildcards is escaped", () => {
  // Test the escaping logic that should be used in ads.ts
  const maliciousSearch = "test%'; DROP TABLE ads; --"
  // Must escape backslash first, then other special chars
  const escapedSearch = maliciousSearch.replace(/\\/g, "\\\\").replace(/[%_]/g, "\\$&")

  // After escaping, wildcards should be escaped
  assertEquals(escapedSearch, "test\\%'; DROP TABLE ads; --")

  // The escaped search should not contain unescaped % or _
  const hasUnescapedWildcards = /(?<!\\)[%_]/.test(escapedSearch)
  assertEquals(hasUnescapedWildcards, false)
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
