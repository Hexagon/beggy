import { Router } from "@oak/oak"
import { renderTemplate } from "../utils/templates.ts"

const router = new Router()

// Home page
router.get("/", async (ctx) => {
  ctx.response.type = "text/html"
  ctx.response.body = await renderTemplate("index.html")
})

// Legal pages
router.get("/villkor", async (ctx) => {
  ctx.response.type = "text/html"
  ctx.response.body = await renderTemplate("terms.html")
})

router.get("/integritetspolicy", async (ctx) => {
  ctx.response.type = "text/html"
  ctx.response.body = await renderTemplate("privacy.html")
})

router.get("/om", async (ctx) => {
  ctx.response.type = "text/html"
  ctx.response.body = await renderTemplate("about.html")
})

export { router as pagesRouter }
