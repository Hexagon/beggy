import { assertEquals } from "./test_utils.ts"
import {
  checkFieldsForForbiddenWords,
  containsForbiddenWords,
  findForbiddenWords,
} from "./forbidden-words.ts"

Deno.test("findForbiddenWords - returns empty array for clean text", () => {
  assertEquals(findForbiddenWords("Normal text here"), [])
  assertEquals(findForbiddenWords(""), [])
})

Deno.test("findForbiddenWords - detects forbidden words", () => {
  const result = findForbiddenWords("Some fuck text")
  assertEquals(result.includes("fuck"), true)
})

Deno.test("findForbiddenWords - handles null/undefined", () => {
  assertEquals(findForbiddenWords(""), [])
})

Deno.test("checkFieldsForForbiddenWords - checks multiple fields", () => {
  const result = checkFieldsForForbiddenWords({
    title: "Normal title",
    description: "Clean description",
  })
  assertEquals(Object.keys(result).length, 0)
})

Deno.test("checkFieldsForForbiddenWords - reports fields with forbidden words", () => {
  const result = checkFieldsForForbiddenWords({
    title: "Shit product",
    description: "Nice item",
  })
  assertEquals("title" in result, true)
  assertEquals("description" in result, false)
})

Deno.test("containsForbiddenWords - returns boolean", () => {
  assertEquals(containsForbiddenWords({ title: "Clean" }), false)
  assertEquals(containsForbiddenWords({ title: "Fuck this" }), true)
})
