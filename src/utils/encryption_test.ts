function assertEquals<T>(actual: T, expected: T, msg?: string): void {
  if (actual !== expected) {
    throw new Error(msg || `Expected ${expected}, but got ${actual}`)
  }
}
import {
  decryptMessage,
  deriveConversationKey,
  encryptMessage,
  exportKey,
  generateConversationKey,
  importKey,
} from "./encryption.ts"

Deno.test("generateConversationKey - creates valid key", async () => {
  const key = await generateConversationKey()
  assertEquals(key.algorithm.name, "AES-GCM")
  assertEquals(key.extractable, true)
  assertEquals(key.usages.includes("encrypt"), true)
  assertEquals(key.usages.includes("decrypt"), true)
})

Deno.test("exportKey/importKey - round trip works", async () => {
  const originalKey = await generateConversationKey()
  const exported = await exportKey(originalKey)
  assertEquals(typeof exported, "string")
  assertEquals(exported.length > 0, true)

  const imported = await importKey(exported)
  assertEquals(imported.algorithm.name, "AES-GCM")
})

Deno.test("encryptMessage/decryptMessage - encrypts and decrypts correctly", async () => {
  const key = await generateConversationKey()
  const originalMessage = "Hello, World!"

  const { encrypted, iv } = await encryptMessage(originalMessage, key)
  assertEquals(typeof encrypted, "string")
  assertEquals(typeof iv, "string")

  const decrypted = await decryptMessage(encrypted, iv, key)
  assertEquals(decrypted, originalMessage)
})

Deno.test("encryptMessage - produces different ciphertext each time", async () => {
  const key = await generateConversationKey()
  const message = "Same message"

  const result1 = await encryptMessage(message, key)
  const result2 = await encryptMessage(message, key)

  // Different IVs should produce different ciphertext
  assertEquals(result1.iv !== result2.iv, true)
})

Deno.test("deriveConversationKey - derives deterministic key", async () => {
  const key1 = await deriveConversationKey(123, "secret123")
  const key2 = await deriveConversationKey(123, "secret123")

  // Same inputs should derive equivalent keys (test by encrypting/decrypting)
  const testMsg = "test"
  const { encrypted, iv } = await encryptMessage(testMsg, key1)
  const decrypted = await decryptMessage(encrypted, iv, key2)
  assertEquals(decrypted, testMsg)
})
