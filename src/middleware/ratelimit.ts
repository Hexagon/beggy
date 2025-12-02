import { Context, Next } from "@oak/oak"

/**
 * Simple in-memory rate limiter
 * For production, consider using Redis or a dedicated rate limiting service
 */

interface RateLimitEntry {
  count: number
  resetTime: number
}

const rateLimitStore = new Map<string, RateLimitEntry>()

// Cleanup old entries every 5 minutes
setInterval(() => {
  const now = Date.now()
  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.resetTime < now) {
      rateLimitStore.delete(key)
    }
  }
}, 5 * 60 * 1000)

/**
 * Rate limiting middleware
 * Limits requests per IP address
 */
export function rateLimitMiddleware(
  maxRequests: number = 100,
  windowMs: number = 60 * 1000, // 1 minute
) {
  return async (ctx: Context, next: Next): Promise<void> => {
    // Get client IP
    const ip = ctx.request.ip || "unknown"

    // Skip rate limiting for unknown IPs (shouldn't happen in production)
    if (ip === "unknown") {
      await next()
      return
    }

    const now = Date.now()
    const key = `rate_limit:${ip}`

    let entry = rateLimitStore.get(key)

    // Create or reset entry if expired
    if (!entry || entry.resetTime < now) {
      entry = {
        count: 0,
        resetTime: now + windowMs,
      }
      rateLimitStore.set(key, entry)
    }

    // Increment request count
    entry.count++

    // Set rate limit headers
    ctx.response.headers.set("X-RateLimit-Limit", maxRequests.toString())
    ctx.response.headers.set(
      "X-RateLimit-Remaining",
      Math.max(0, maxRequests - entry.count).toString(),
    )
    ctx.response.headers.set(
      "X-RateLimit-Reset",
      Math.ceil(entry.resetTime / 1000).toString(),
    )

    // Check if rate limit exceeded
    if (entry.count > maxRequests) {
      ctx.response.status = 429
      ctx.response.headers.set("Retry-After", Math.ceil((entry.resetTime - now) / 1000).toString())
      ctx.response.body = {
        error: "För många förfrågningar. Försök igen senare.",
      }
      return
    }

    await next()
  }
}
