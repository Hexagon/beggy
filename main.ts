import { Application } from "@oak/oak"
import { router } from "./src/routes/mod.ts"
import { initDatabase } from "./src/db/database.ts"
import { errorMiddleware } from "./src/middleware/error.ts"

// Initialize Supabase
initDatabase()

const app = new Application()

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

const port = parseInt(Deno.env.get("PORT") || "8000")
console.log(`🛒 Beggy startar på http://localhost:${port}`)
app.listen({ port })
