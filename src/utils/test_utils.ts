/**
 * Simple assertion utilities for tests.
 * Using inline implementation to avoid external dependencies.
 */

export function assertEquals<T>(actual: T, expected: T, msg?: string): void {
  const actualStr = JSON.stringify(actual)
  const expectedStr = JSON.stringify(expected)
  if (actualStr !== expectedStr) {
    throw new Error(msg || `Expected ${expectedStr}, but got ${actualStr}`)
  }
}
