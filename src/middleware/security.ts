import { Context, Next } from "@oak/oak"

/**
 * Security headers middleware
 * Adds security-related HTTP headers to all responses
 */
export async function securityHeadersMiddleware(ctx: Context, next: Next): Promise<void> {
  await next()

  // Content Security Policy - helps prevent XSS attacks
  // Note: This is a relatively permissive policy for a marketplace app with user content
  ctx.response.headers.set(
    "Content-Security-Policy",
    [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline'", // unsafe-inline needed for inline scripts in HTML templates
      "style-src 'self' 'unsafe-inline'", // unsafe-inline needed for Tailwind and inline styles
      "img-src 'self' data: https:", // Allow images from Supabase storage and data URIs
      "font-src 'self'",
      "connect-src 'self' https://*.supabase.co", // Allow API calls to Supabase
      "frame-ancestors 'none'", // Prevent clickjacking
      "base-uri 'self'",
      "form-action 'self'",
    ].join("; "),
  )

  // Prevent MIME type sniffing
  ctx.response.headers.set("X-Content-Type-Options", "nosniff")

  // Prevent clickjacking
  ctx.response.headers.set("X-Frame-Options", "DENY")

  // Enable browser XSS protection (for older browsers)
  ctx.response.headers.set("X-XSS-Protection", "1; mode=block")

  // Referrer policy - don't leak full URL when navigating away
  ctx.response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin")

  // Permissions policy - restrict access to sensitive features
  ctx.response.headers.set(
    "Permissions-Policy",
    "geolocation=(), microphone=(), camera=(), payment=()",
  )
}
