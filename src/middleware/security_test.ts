import { assertEquals, assertExists } from "@std/assert"
import { securityHeadersMiddleware } from "./security.ts"
import { Context } from "@oak/oak"

// Mock context for testing
function createMockContext(): Context {
  return {
    response: {
      headers: new Headers(),
    },
  } as Context
}

Deno.test("Security headers - CSP header is set", async () => {
  const ctx = createMockContext()
  const next = () => Promise.resolve()

  await securityHeadersMiddleware(ctx, next)

  const csp = ctx.response.headers.get("Content-Security-Policy")
  assertExists(csp)
  assertEquals(csp?.includes("default-src 'self'"), true)
})

Deno.test("Security headers - X-Frame-Options is set to DENY", async () => {
  const ctx = createMockContext()
  const next = () => Promise.resolve()

  await securityHeadersMiddleware(ctx, next)

  assertEquals(ctx.response.headers.get("X-Frame-Options"), "DENY")
})

Deno.test("Security headers - X-Content-Type-Options is set to nosniff", async () => {
  const ctx = createMockContext()
  const next = () => Promise.resolve()

  await securityHeadersMiddleware(ctx, next)

  assertEquals(ctx.response.headers.get("X-Content-Type-Options"), "nosniff")
})

Deno.test("Security headers - X-XSS-Protection is set", async () => {
  const ctx = createMockContext()
  const next = () => Promise.resolve()

  await securityHeadersMiddleware(ctx, next)

  assertEquals(ctx.response.headers.get("X-XSS-Protection"), "1; mode=block")
})

Deno.test("Security headers - Referrer-Policy is set", async () => {
  const ctx = createMockContext()
  const next = () => Promise.resolve()

  await securityHeadersMiddleware(ctx, next)

  assertEquals(ctx.response.headers.get("Referrer-Policy"), "strict-origin-when-cross-origin")
})

Deno.test("Security headers - Permissions-Policy restricts sensitive features", async () => {
  const ctx = createMockContext()
  const next = () => Promise.resolve()

  await securityHeadersMiddleware(ctx, next)

  const policy = ctx.response.headers.get("Permissions-Policy")
  assertExists(policy)
  assertEquals(policy?.includes("geolocation=()"), true)
  assertEquals(policy?.includes("microphone=()"), true)
})
