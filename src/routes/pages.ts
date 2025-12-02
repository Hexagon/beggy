import { Router } from "@oak/oak"
import { renderTemplate, TemplateData } from "../utils/templates.ts"

const router = new Router()

// Home page
router.get("/", async (ctx) => {
  const data: TemplateData = {
    canonicalPath: "/",
    ogType: "website",
    ogTitle: "Beggy - Köp och sälj begagnat",
    ogDescription:
      "Beggy - En enkel svensk begagnatmarknad. Köp och sälj begagnat lokalt, helt gratis och utan avgifter.",
    ogImage: "https://beggy.se/og-image.jpg",
  }
  ctx.response.type = "text/html"
  ctx.response.body = await renderTemplate("index.html", data)
})

// Create ad page
router.get("/ny-annons", async (ctx) => {
  const data: TemplateData = {
    canonicalPath: "/ny-annons",
    ogType: "website",
    ogTitle: "Skapa annons - Beggy",
    ogDescription: "Skapa en ny annons på Beggy - En enkel svensk begagnatmarknad. Helt gratis.",
    ogImage: "https://beggy.se/og-image.jpg",
  }
  ctx.response.type = "text/html"
  ctx.response.body = await renderTemplate("create-ad.html", data)
})

// Ad detail page
router.get("/annons/:id", async (ctx) => {
  const data: TemplateData = {
    canonicalPath: `/annons/${ctx.params.id}`,
    ogType: "product",
    ogTitle: "Annons - Beggy",
    ogDescription: "Se annons på Beggy - En enkel svensk begagnatmarknad.",
    ogImage: "https://beggy.se/og-image.jpg",
  }
  ctx.response.type = "text/html"
  ctx.response.body = await renderTemplate("ad.html", data)
})

// Edit ad page
router.get("/annons/:id/redigera", async (ctx) => {
  const data: TemplateData = {
    canonicalPath: `/annons/${ctx.params.id}/redigera`,
    ogType: "website",
    ogTitle: "Redigera annons - Beggy",
    ogDescription: "Redigera din annons på Beggy.",
    ogImage: "https://beggy.se/og-image.jpg",
  }
  ctx.response.type = "text/html"
  ctx.response.body = await renderTemplate("edit-ad.html", data)
})

// Legal pages
router.get("/villkor", async (ctx) => {
  const data: TemplateData = {
    canonicalPath: "/villkor",
    ogType: "website",
    ogTitle: "Användarvillkor - Beggy",
    ogDescription:
      "Beggys användarvillkor för köp och försäljning av begagnade varor. Gratis marknadsplats för privatpersoner.",
    ogImage: "https://beggy.se/og-image.jpg",
  }
  ctx.response.type = "text/html"
  ctx.response.body = await renderTemplate("terms.html", data)
})

router.get("/integritetspolicy", async (ctx) => {
  const data: TemplateData = {
    canonicalPath: "/integritetspolicy",
    ogType: "website",
    ogTitle: "Integritetspolicy - Beggy",
    ogDescription:
      "Läs Beggys integritetspolicy enligt GDPR. Vi skyddar dina personuppgifter. Du kan enkelt exportera eller radera all din data när som helst.",
    ogImage: "https://beggy.se/og-image.jpg",
  }
  ctx.response.type = "text/html"
  ctx.response.body = await renderTemplate("privacy.html", data)
})

router.get("/om", async (ctx) => {
  const data: TemplateData = {
    canonicalPath: "/om",
    ogType: "website",
    ogTitle: "Om Beggy - Gratis begagnatmarknad med öppen källkod",
    ogDescription:
      "Beggy är en gratis svensk begagnatmarknad med öppen källkod. Köp och sälj begagnat enkelt, reklamfritt och transparent.",
    ogImage: "https://beggy.se/og-image.jpg",
  }
  ctx.response.type = "text/html"
  ctx.response.body = await renderTemplate("about.html", data)
})

// User pages
router.get("/mina-annonser", async (ctx) => {
  const data: TemplateData = {
    canonicalPath: "/mina-annonser",
    ogType: "website",
    ogTitle: "Mina annonser - Beggy",
    ogDescription: "Hantera dina annonser på Beggy.",
    ogImage: "https://beggy.se/og-image.jpg",
  }
  ctx.response.type = "text/html"
  ctx.response.body = await renderTemplate("my-ads.html", data)
})

router.get("/meddelanden", async (ctx) => {
  const data: TemplateData = {
    canonicalPath: "/meddelanden",
    ogType: "website",
    ogTitle: "Meddelanden - Beggy",
    ogDescription: "Läs och skicka meddelanden på Beggy.",
    ogImage: "https://beggy.se/og-image.jpg",
  }
  ctx.response.type = "text/html"
  ctx.response.body = await renderTemplate("messages.html", data)
})

router.get("/installningar", async (ctx) => {
  const data: TemplateData = {
    canonicalPath: "/installningar",
    ogType: "website",
    ogTitle: "Inställningar - Beggy",
    ogDescription: "Hantera dina kontoinställningar på Beggy.",
    ogImage: "https://beggy.se/og-image.jpg",
  }
  ctx.response.type = "text/html"
  ctx.response.body = await renderTemplate("settings.html", data)
})

// Reset password page
router.get("/aterstall-losenord", async (ctx) => {
  const data: TemplateData = {
    canonicalPath: "/aterstall-losenord",
    ogType: "website",
    ogTitle: "Återställ lösenord - Beggy",
    ogDescription: "Återställ ditt lösenord på Beggy.",
    ogImage: "https://beggy.se/og-image.jpg",
  }
  ctx.response.type = "text/html"
  ctx.response.body = await renderTemplate("reset-password.html", data)
})

// Sitemap
router.get("/sitemap.xml", (ctx) => {
  ctx.response.type = "application/xml"
  ctx.response.body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://beggy.se/</loc>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>https://beggy.se/om</loc>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://beggy.se/villkor</loc>
    <changefreq>monthly</changefreq>
    <priority>0.5</priority>
  </url>
  <url>
    <loc>https://beggy.se/integritetspolicy</loc>
    <changefreq>monthly</changefreq>
    <priority>0.5</priority>
  </url>
  <url>
    <loc>https://beggy.se/ny-annons</loc>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>
</urlset>`
})

export { router as pagesRouter }
