import { Application } from "@oak/oak"
import { getEnv, setupEnv } from "@cross/env"
import { router } from "./src/routes/mod.ts"
import { initDatabase } from "./src/db/database.ts"
import { errorMiddleware } from "./src/middleware/error.ts"
import { securityHeadersMiddleware } from "./src/middleware/security.ts"
import { rateLimitMiddleware } from "./src/middleware/ratelimit.ts"

// Load environment variables from .env file
await setupEnv({ dotEnv: { enabled: true } })

// Initialize Supabase
initDatabase(
  getEnv("SUPABASE_URL"),
  getEnv("SUPABASE_ANON_KEY"),
  getEnv("SUPABASE_SERVICE_ROLE_KEY"),
)

const app = new Application()

// Security headers middleware (first, so they apply to all responses)
app.use(securityHeadersMiddleware)

// Rate limiting middleware (100 requests per minute per IP)
app.use(rateLimitMiddleware(100, 60 * 1000))

// Error handling middleware
app.use(errorMiddleware)

// Static files
app.use(async (ctx, next) => {
  try {
    await ctx.send({
      root: `${Deno.cwd()}/static`,
      index: "index.html",
    })
  } catch {
    await next()
  }
})

// Routes
app.use(router.routes())
app.use(router.allowedMethods())

const port = parseInt(getEnv("PORT") || "8000")
console.log(`🛒 Beggy startar på http://localhost:${port}`)
app.listen({ port })
