import { describe, it, expect } from "vitest"
import { resolvePlayerImageUrl, PLAYER_PLACEHOLDER_URL } from "@/lib/player"

describe("resolvePlayerImageUrl — missing data (Objective 1)", () => {
  it("returns the placeholder when imagePath is null", () => {
    expect(resolvePlayerImageUrl(null)).toBe(PLAYER_PLACEHOLDER_URL)
  })

  it("returns the placeholder when imagePath is undefined", () => {
    expect(resolvePlayerImageUrl(undefined)).toBe(PLAYER_PLACEHOLDER_URL)
  })

  it("returns the placeholder when the path itself points to a placeholder asset", () => {
    expect(
      resolvePlayerImageUrl("https://cdn.sportmonks.com/images/soccer/placeholder.png"),
    ).toBe(PLAYER_PLACEHOLDER_URL)
  })

  it("returns the original path when a real image is provided", () => {
    const real = "https://cdn.sportmonks.com/images/soccer/players/12/345.png"
    expect(resolvePlayerImageUrl(real)).toBe(real)
  })

  it("does not fabricate a URL for empty strings — falls back to placeholder", () => {
    expect(resolvePlayerImageUrl("")).toBe(PLAYER_PLACEHOLDER_URL)
  })
})
