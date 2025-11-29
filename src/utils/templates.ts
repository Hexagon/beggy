const templateCache = new Map<string, string>()

export async function renderTemplate(name: string): Promise<string> {
  // Check cache first (in production)
  if (!Deno.env.get("DEV") && templateCache.has(name)) {
    return templateCache.get(name)!
  }

  const path = `${Deno.cwd()}/templates/${name}`
  const content = await Deno.readTextFile(path)

  // Cache in production
  if (!Deno.env.get("DEV")) {
    templateCache.set(name, content)
  }

  return content
}
