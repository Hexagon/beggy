function assertEquals<T>(actual: T, expected: T, msg?: string): void {
  if (actual !== expected) {
    throw new Error(msg || `Expected ${expected}, but got ${actual}`)
  }
}
import { ADJACENT_COUNTIES, CATEGORIES, COUNTIES } from "./types.ts"

Deno.test("CATEGORIES - contains expected categories", () => {
  assertEquals(CATEGORIES.length, 10)
  assertEquals(CATEGORIES.includes("Fordon"), true)
  assertEquals(CATEGORIES.includes("Elektronik"), true)
  assertEquals(CATEGORIES.includes("Övrigt"), true)
})

Deno.test("COUNTIES - contains all Swedish counties", () => {
  assertEquals(COUNTIES.length, 21)
  assertEquals(COUNTIES.includes("Stockholm"), true)
  assertEquals(COUNTIES.includes("Skåne"), true)
  assertEquals(COUNTIES.includes("Västra Götaland"), true)
})

Deno.test("ADJACENT_COUNTIES - has entries for all counties", () => {
  for (const county of COUNTIES) {
    assertEquals(county in ADJACENT_COUNTIES, true)
  }
})

Deno.test("ADJACENT_COUNTIES - relationships are symmetrical", () => {
  for (const [county, adjacent] of Object.entries(ADJACENT_COUNTIES)) {
    for (const adj of adjacent) {
      const reverseAdjacent = ADJACENT_COUNTIES[adj] || []
      assertEquals(
        reverseAdjacent.includes(county),
        true,
        `${adj} should list ${county} as adjacent`,
      )
    }
  }
})
