import { describe, it, expect } from "vitest"
import { parseFormationField, parseFormationRows } from "@/lib/formation"

describe("parseFormationField", () => {
  it("parses 'row:col' string into numeric coordinates", () => {
    expect(parseFormationField("3:2")).toEqual({ row: 3, col: 2 })
  })

  it("handles single-digit values", () => {
    expect(parseFormationField("1:1")).toEqual({ row: 1, col: 1 })
  })

  it("handles two-digit values", () => {
    expect(parseFormationField("12:5")).toEqual({ row: 12, col: 5 })
  })

  it("returns NaN for missing component (empty side of separator)", () => {
    expect(parseFormationField("3:").row).toBe(3)
    expect(Number.isNaN(parseFormationField("3:").col)).toBe(true)
    expect(Number.isNaN(parseFormationField(":4").row)).toBe(true)
  })

  it("returns NaN for non-numeric input (not crash)", () => {
    const result = parseFormationField("abc:def")
    expect(Number.isNaN(result.row)).toBe(true)
    expect(Number.isNaN(result.col)).toBe(true)
  })
})

describe("parseFormationRows", () => {
  it("parses '4-3-3' into [4, 3, 3]", () => {
    expect(parseFormationRows("4-3-3")).toEqual([4, 3, 3])
  })

  it("parses '4-2-3-1' into [4, 2, 3, 1]", () => {
    expect(parseFormationRows("4-2-3-1")).toEqual([4, 2, 3, 1])
  })

  it("parses '5-3-2' into [5, 3, 2]", () => {
    expect(parseFormationRows("5-3-2")).toEqual([5, 3, 2])
  })

  it("returns empty array for null", () => {
    expect(parseFormationRows(null)).toEqual([])
  })

  it("returns empty array for undefined", () => {
    expect(parseFormationRows(undefined)).toEqual([])
  })

  it("returns empty array for empty string", () => {
    expect(parseFormationRows("")).toEqual([])
  })

  it("filters out zero values (keeps only positive integers)", () => {
    expect(parseFormationRows("4-0-3")).toEqual([4, 3])
  })

  it("filters out non-numeric segments", () => {
    expect(parseFormationRows("4-abc-3")).toEqual([4, 3])
  })
})
