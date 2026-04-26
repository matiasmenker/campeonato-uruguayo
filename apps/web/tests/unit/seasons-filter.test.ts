import { describe, it, expect } from "vitest"
import { filterMainStages, type Stage } from "@/lib/seasons"

const stage = (name: string, id = 1): Stage => ({
  id,
  name,
  type: null,
  isCurrent: false,
  season: { id: 1, name: "2026", isCurrent: true },
})

describe("filterMainStages — knockout exclusion (Objective 4)", () => {
  it("keeps the league-table stages of the Uruguayan tournament", () => {
    const input = [
      stage("Apertura", 1),
      stage("Clausura", 2),
      stage("Intermediate Round", 3),
      stage("Intermediate Round - Final", 4),
      stage("Championship - Finals", 5),
      stage("Championship - Semi-Finals", 6),
    ]
    expect(filterMainStages(input).map((s) => s.id)).toEqual([1, 2, 3, 4, 5, 6])
  })

  it("excludes generic knockout-style stages that are not league tables", () => {
    const input = [
      stage("Apertura", 1),
      stage("Round of 16", 2),
      stage("Quarter-finals", 3),
      stage("Group Stage", 4),
      stage("Play-off", 5),
    ]
    expect(filterMainStages(input).map((s) => s.id)).toEqual([1])
  })

  it("matches stage names case-insensitively", () => {
    const input = [stage("APERTURA", 1), stage("clausura", 2)]
    expect(filterMainStages(input).map((s) => s.id)).toEqual([1, 2])
  })

  it("trims surrounding whitespace before matching", () => {
    const input = [stage("  Apertura  ", 1), stage("\tClausura\n", 2)]
    expect(filterMainStages(input).map((s) => s.id)).toEqual([1, 2])
  })

  it("returns an empty array when no stage matches — not a crash", () => {
    expect(filterMainStages([stage("Friendly", 9)])).toEqual([])
  })

  it("handles an empty list safely", () => {
    expect(filterMainStages([])).toEqual([])
  })
})
