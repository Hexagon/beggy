const templateCache = new Map<string, string>()

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

export async function renderTemplate(name: string): Promise<string> {
  // Check cache first (in production)
  if (!Deno.env.get("DEV") && templateCache.has(name)) {
    return templateCache.get(name)!
  }

  const path = `${Deno.cwd()}/templates/${name}`
  let content = await Deno.readTextFile(path)

  // Process includes
  content = await processIncludes(content)

  // Cache in production
  if (!Deno.env.get("DEV")) {
    templateCache.set(name, content)
  }

  return content
}
