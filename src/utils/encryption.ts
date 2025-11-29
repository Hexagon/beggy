// End-to-end encryption utilities for chat messages
// Uses Web Crypto API (SubtleCrypto) which is available in Deno

/**
 * Generate a random encryption key for a conversation
 * This key should be derived from both participants' keys
 */
export async function generateConversationKey(): Promise<CryptoKey> {
  return await crypto.subtle.generateKey({ name: "AES-GCM", length: 256 }, true, [
    "encrypt",
    "decrypt",
  ])
}

/**
 * Export a CryptoKey to a base64 string for storage
 */
export async function exportKey(key: CryptoKey): Promise<string> {
  const exported = await crypto.subtle.exportKey("raw", key)
  return btoa(String.fromCharCode(...new Uint8Array(exported)))
}

/**
 * Import a base64 string back to a CryptoKey
 */
export async function importKey(keyString: string): Promise<CryptoKey> {
  const keyData = Uint8Array.from(atob(keyString), (c) => c.charCodeAt(0))
  return await crypto.subtle.importKey("raw", keyData, { name: "AES-GCM", length: 256 }, true, [
    "encrypt",
    "decrypt",
  ])
}

/**
 * Encrypt a message with AES-GCM
 * Returns the encrypted content and IV as base64 strings
 */
export async function encryptMessage(
  message: string,
  key: CryptoKey,
): Promise<{ encrypted: string; iv: string }> {
  const encoder = new TextEncoder()
  const data = encoder.encode(message)

  // Generate random IV for each message
  const iv = crypto.getRandomValues(new Uint8Array(12))

  const encrypted = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, data)

  return {
    encrypted: btoa(String.fromCharCode(...new Uint8Array(encrypted))),
    iv: btoa(String.fromCharCode(...iv)),
  }
}

/**
 * Decrypt a message with AES-GCM
 */
export async function decryptMessage(
  encryptedContent: string,
  ivString: string,
  key: CryptoKey,
): Promise<string> {
  const encrypted = Uint8Array.from(atob(encryptedContent), (c) => c.charCodeAt(0))
  const iv = Uint8Array.from(atob(ivString), (c) => c.charCodeAt(0))

  const decrypted = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, encrypted)

  const decoder = new TextDecoder()
  return decoder.decode(decrypted)
}

/**
 * Derive a shared conversation key from buyer and seller IDs
 * This creates a deterministic key for a specific conversation
 */
export async function deriveConversationKey(
  conversationId: number,
  secret: string,
): Promise<CryptoKey> {
  const encoder = new TextEncoder()
  const data = encoder.encode(`${conversationId}:${secret}`)

  // First hash the combined data
  const hashBuffer = await crypto.subtle.digest("SHA-256", data)

  // Import the hash as an AES key
  return await crypto.subtle.importKey("raw", hashBuffer, { name: "AES-GCM", length: 256 }, false, [
    "encrypt",
    "decrypt",
  ])
}
