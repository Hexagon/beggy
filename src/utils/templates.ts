const templateCache = new Map<string, string>()

export interface TemplateData {
  // SEO metadata
  canonicalPath?: string
  ogType?: string
  ogTitle?: string
  ogDescription?: string
  ogImage?: string
  [key: string]: string | undefined
}

async function loadPartial(name: string): Promise<string> {
  const path = `${Deno.cwd()}/templates/partials/${name}`
  return await Deno.readTextFile(path)
}

async function processIncludes(content: string): Promise<string> {
  // Simple include syntax: {{> partial-name }}
  const includeRegex = /\{\{>\s*([a-z0-9-]+)\s*\}\}/g
  let result = content
  let match

  while ((match = includeRegex.exec(content)) !== null) {
    const partialName = match[1]
    const partialContent = await loadPartial(`${partialName}.html`)
    result = result.replace(match[0], partialContent)
  }

  return result
}

function substituteVariables(content: string, data: TemplateData): string {
  // Replace {{variable}} with values from data
  let result = content
  for (const [key, value] of Object.entries(data)) {
    const regex = new RegExp(`\\{\\{${key}\\}\\}`, "g")
    result = result.replace(regex, value || "")
  }
  return result
}

export async function renderTemplate(
  name: string,
  data: TemplateData = {},
): Promise<string> {
  // Load template (with caching in production)
  let content: string
  if (!Deno.env.get("DEV") && templateCache.has(name)) {
    content = templateCache.get(name)!
  } else {
    const path = `${Deno.cwd()}/templates/${name}`
    content = await Deno.readTextFile(path)

    // Process includes
    content = await processIncludes(content)

    // Cache in production
    if (!Deno.env.get("DEV")) {
      templateCache.set(name, content)
    }
  }

  // Set default SEO values
  const defaultData: TemplateData = {
    canonicalPath: data.canonicalPath || "/",
    ogType: data.ogType || "website",
    ogTitle: data.ogTitle || "Beggy - Köp och sälj begagnat",
    ogDescription: data.ogDescription ||
      "Beggy - En enkel svensk begagnatmarknad. Köp och sälj begagnat lokalt, helt gratis och utan avgifter.",
    ogImage: data.ogImage || "https://beggy.se/og-image.jpg",
    ...data,
  }

  // Substitute variables
  content = substituteVariables(content, defaultData)

  return content
}
