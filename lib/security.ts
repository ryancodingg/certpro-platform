import { timingSafeEqual } from "node:crypto"

export function timingSafeSecretMatches(expected: string | undefined, provided: string | null) {
  if (!expected || !provided) return false
  const expectedBytes = Buffer.from(expected)
  const providedBytes = Buffer.from(provided)
  return expectedBytes.length === providedBytes.length && timingSafeEqual(expectedBytes, providedBytes)
}
