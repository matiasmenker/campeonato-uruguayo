import { describe, it, expect } from "vitest"
import { parseSportMonksDate } from "../src/sync/shared.js"

describe("parseSportMonksDate", () => {
  it("returns null for null input", () => {
    expect(parseSportMonksDate(null)).toBeNull()
  })

  it("returns null for undefined input", () => {
    expect(parseSportMonksDate(undefined)).toBeNull()
  })

  it("returns null for empty string", () => {
    expect(parseSportMonksDate("")).toBeNull()
  })

  it("parses SportMonks UTC format as UTC regardless of host timezone", () => {
    const result = parseSportMonksDate("2026-04-25 18:30:00")
    expect(result).not.toBeNull()
    expect(result!.toISOString()).toBe("2026-04-25T18:30:00.000Z")
  })

  it("preserves UTC time across known kickoff samples", () => {
    expect(parseSportMonksDate("2026-04-25 00:00:00")!.toISOString()).toBe(
      "2026-04-25T00:00:00.000Z"
    )
    expect(parseSportMonksDate("2026-04-25 23:59:59")!.toISOString()).toBe(
      "2026-04-25T23:59:59.000Z"
    )
  })

  it("accepts already-ISO formatted dates", () => {
    const iso = "2026-04-25T18:30:00Z"
    expect(parseSportMonksDate(iso)!.toISOString()).toBe("2026-04-25T18:30:00.000Z")
  })

  it("returns null for invalid input", () => {
    expect(parseSportMonksDate("not a date")).toBeNull()
    expect(parseSportMonksDate("2026-13-99 25:99:99")).toBeNull()
  })
})
