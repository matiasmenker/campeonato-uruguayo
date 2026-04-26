import { describe, it, expect } from "vitest"
import { computePlayerSeasonAggregates } from "@/lib/players"

describe("PlayerSeasonAggregates — Objective 6 (descriptive, not a fabricated statistical model)", () => {
  it("only exposes descriptive aggregates: counts, sums and an arithmetic mean", () => {
    const aggregates = computePlayerSeasonAggregates([], [], [], [])
    expect(Object.keys(aggregates).sort()).toEqual(
      [
        "appearances",
        "assists",
        "avgRating",
        "goals",
        "redCards",
        "saves",
        "totalMinutes",
        "yellowCards",
      ].sort(),
    )
  })

  it("does not expose any predictive, projected or modelled fields", () => {
    const aggregates = computePlayerSeasonAggregates([], [], [], []) as unknown as Record<string, unknown>
    const forbiddenKeys = [
      "predictedRating",
      "projectedRating",
      "expectedGoals",
      "xG",
      "xA",
      "rank",
      "percentile",
      "score",
      "model",
      "prediction",
    ]
    for (const key of forbiddenKeys) {
      expect(aggregates).not.toHaveProperty(key)
    }
  })
})
