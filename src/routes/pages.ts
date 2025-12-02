import { Router } from "@oak/oak"
import { renderTemplate } from "../utils/templates.ts"

const router = new Router()

// Home page
router.get("/", async (ctx) => {
  ctx.response.type = "text/html"
  ctx.response.body = await renderTemplate("index.html")
})

// Create ad page
router.get("/ny-annons", async (ctx) => {
  ctx.response.type = "text/html"
  ctx.response.body = await renderTemplate("create-ad.html")
})

// Ad detail page
router.get("/annons/:id", async (ctx) => {
  ctx.response.type = "text/html"
  ctx.response.body = await renderTemplate("ad.html")
})

// Edit ad page
router.get("/annons/:id/redigera", async (ctx) => {
  ctx.response.type = "text/html"
  ctx.response.body = await renderTemplate("edit-ad.html")
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

// User pages
router.get("/mina-annonser", async (ctx) => {
  ctx.response.type = "text/html"
  ctx.response.body = await renderTemplate("my-ads.html")
})

router.get("/meddelanden", async (ctx) => {
  ctx.response.type = "text/html"
  ctx.response.body = await renderTemplate("messages.html")
})

router.get("/installningar", async (ctx) => {
  ctx.response.type = "text/html"
  ctx.response.body = await renderTemplate("settings.html")
})

router.get("/installningar", async (ctx) => {
  ctx.response.type = "text/html"
  ctx.response.body = await renderTemplate("settings.html")
})

export { router as pagesRouter }
