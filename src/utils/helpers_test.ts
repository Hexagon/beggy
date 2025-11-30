import { assertEquals } from "./test_utils.ts"
import { formatDate, formatPrice, sanitizeHtml } from "./helpers.ts"

Deno.test("sanitizeHtml - escapes HTML characters", () => {
  assertEquals(
    sanitizeHtml("<script>alert('xss')</script>"),
    "&lt;script&gt;alert(&#039;xss&#039;)&lt;/script&gt;",
  )
  assertEquals(sanitizeHtml('Hello "World"'), "Hello &quot;World&quot;")
  assertEquals(sanitizeHtml("Tom & Jerry"), "Tom &amp; Jerry")
  assertEquals(sanitizeHtml("Normal text"), "Normal text")
  assertEquals(sanitizeHtml(""), "")
})

Deno.test("formatPrice - formats SEK currency", () => {
  assertEquals(formatPrice(1000), "1\u00a0000\u00a0kr")
  assertEquals(formatPrice(0), "0\u00a0kr")
  assertEquals(formatPrice(999999), "999\u00a0999\u00a0kr")
})

Deno.test("formatDate - formats Swedish dates", () => {
  assertEquals(formatDate("2024-01-15"), "15 januari 2024")
  assertEquals(formatDate("2024-12-31"), "31 december 2024")
})
