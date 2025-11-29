// Forbidden words filter - words that are not allowed in user-facing content
// This list includes Swedish and English profanity and offensive terms

const FORBIDDEN_WORDS: string[] = [
  // Swedish offensive terms
  "hora",
  "fitta",
  "kuk",
  "bög",
  "neger",
  "blansen",
  "jävla",
  "fan",
  // English offensive terms
  "fuck",
  "shit",
  "bitch",
  "nigger",
  "faggot",
  "cunt",
  "whore",
  "slut",
  // Scam-related terms
  "nigeriabrev",
  "pengatvätt",
]

/**
 * Check if text contains any forbidden words
 * @param text The text to check
 * @returns Array of forbidden words found, empty array if none
 */
export function findForbiddenWords(text: string): string[] {
  if (!text) return []

  const lowerText = text.toLowerCase()
  const found: string[] = []

  for (const word of FORBIDDEN_WORDS) {
    // Use word boundaries to avoid false positives
    const regex = new RegExp(`\\b${word}\\b`, "i")
    if (regex.test(lowerText)) {
      found.push(word)
    }
  }

  return found
}

/**
 * Check if any of the provided fields contain forbidden words
 * @param fields Object with field names and values to check
 * @returns Object with field names and found forbidden words
 */
export function checkFieldsForForbiddenWords(
  fields: Record<string, string | undefined>,
): Record<string, string[]> {
  const results: Record<string, string[]> = {}

  for (const [field, value] of Object.entries(fields)) {
    if (value) {
      const found = findForbiddenWords(value)
      if (found.length > 0) {
        results[field] = found
      }
    }
  }

  return results
}

/**
 * Returns true if any forbidden words are found in the fields
 */
export function containsForbiddenWords(fields: Record<string, string | undefined>): boolean {
  return Object.keys(checkFieldsForForbiddenWords(fields)).length > 0
}
