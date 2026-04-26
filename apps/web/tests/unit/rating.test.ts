import { describe, it, expect } from "vitest"
import { getRatingColors, getRatingFill, getRatingText } from "@/lib/rating"

describe("getRatingColors", () => {
  it("returns elite tier (blue) for ratings >= 9.0", () => {
    expect(getRatingColors(9.0).fill).toBe("#2563eb")
    expect(getRatingColors(9.5).fill).toBe("#2563eb")
    expect(getRatingColors(10).fill).toBe("#2563eb")
  })

  it("returns excellent tier (light blue) for 8.0 <= rating < 9.0", () => {
    expect(getRatingColors(8.0).fill).toBe("#38bdf8")
    expect(getRatingColors(8.9).fill).toBe("#38bdf8")
  })

  it("returns good tier (green) for 7.0 <= rating < 8.0", () => {
    expect(getRatingColors(7.0).fill).toBe("#16a34a")
    expect(getRatingColors(7.9).fill).toBe("#16a34a")
  })

  it("returns above-average tier (yellow) for 6.5 <= rating < 7.0", () => {
    expect(getRatingColors(6.5).fill).toBe("#ca8a04")
    expect(getRatingColors(6.9).fill).toBe("#ca8a04")
  })

  it("returns average tier (orange) for 6.0 <= rating < 6.5", () => {
    expect(getRatingColors(6.0).fill).toBe("#ea580c")
    expect(getRatingColors(6.4).fill).toBe("#ea580c")
  })

  it("returns below-average tier (dark red) for 5.0 <= rating < 6.0", () => {
    expect(getRatingColors(5.0).fill).toBe("#b91c1c")
    expect(getRatingColors(5.9).fill).toBe("#b91c1c")
  })

  it("returns poor tier (red) for ratings < 5.0", () => {
    expect(getRatingColors(4.9).fill).toBe("#dc2626")
    expect(getRatingColors(0).fill).toBe("#dc2626")
  })

  it("rounds rating to one decimal before classifying (5.95 → 6.0)", () => {
    expect(getRatingColors(5.95).fill).toBe("#ea580c")
  })

  it("getRatingFill returns the fill color of getRatingColors", () => {
    expect(getRatingFill(7.5)).toBe(getRatingColors(7.5).fill)
  })

  it("getRatingText returns the text color of getRatingColors", () => {
    expect(getRatingText(7.5)).toBe(getRatingColors(7.5).text)
  })
})
