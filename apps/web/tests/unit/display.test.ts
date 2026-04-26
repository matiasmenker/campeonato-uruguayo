import { describe, it, expect } from "vitest"
import {
  DASH,
  displayInteger,
  displayMinutes,
  displayRating,
  displayHeight,
  displayWeight,
  displayTeamLabel,
  displayAge,
  buildCareerRowDisplay,
} from "@/lib/display"

describe("displayInteger — Objective 1 (missing → dash, never zero)", () => {
  it("renders the dash when value is null", () => {
    expect(displayInteger(null)).toBe(DASH)
  })
  it("renders the dash when value is undefined", () => {
    expect(displayInteger(undefined)).toBe(DASH)
  })
  it("renders zero as '0' (a real recorded zero is not a missing value)", () => {
    expect(displayInteger(0)).toBe("0")
  })
  it("renders a positive integer as its string form", () => {
    expect(displayInteger(7)).toBe("7")
  })
})

describe("displayMinutes — Objective 1 / 6 (missing minutes → dash, real values formatted)", () => {
  it("renders the dash when minutes are missing", () => {
    expect(displayMinutes(null)).toBe(DASH)
  })
  it("formats the value with the en-GB thousands separator", () => {
    expect(displayMinutes(1530)).toBe("1,530")
  })
})

describe("displayRating — Objective 5 (rating rendered to 2dp; null → dash, never 0.00)", () => {
  it("renders the dash when avgRating is null", () => {
    expect(displayRating(null)).toBe(DASH)
  })
  it("renders the dash when avgRating is NaN", () => {
    expect(displayRating(Number.NaN)).toBe(DASH)
  })
  it("formats a numeric rating to two decimals", () => {
    expect(displayRating(7.42)).toBe("7.42")
    expect(displayRating(8)).toBe("8.00")
    expect(displayRating(9.1)).toBe("9.10")
  })
})

describe("displayHeight / displayWeight — Objective 1 (player physical attributes)", () => {
  it("renders height with cm suffix when provided", () => {
    expect(displayHeight(178)).toBe("178 cm")
  })
  it("renders dash when height is missing", () => {
    expect(displayHeight(null)).toBe(DASH)
  })
  it("renders weight with kg suffix when provided", () => {
    expect(displayWeight(72)).toBe("72 kg")
  })
  it("renders dash when weight is missing", () => {
    expect(displayWeight(null)).toBe(DASH)
  })
})

describe("displayTeamLabel — Objective 1 (team fallback)", () => {
  it("renders the dash when team is null", () => {
    expect(displayTeamLabel(null)).toBe(DASH)
  })
  it("prefers shortCode when available", () => {
    expect(displayTeamLabel({ name: "Peñarol", shortCode: "PEÑ" })).toBe("PEÑ")
  })
  it("falls back to name when shortCode is null", () => {
    expect(displayTeamLabel({ name: "Peñarol", shortCode: null })).toBe("Peñarol")
  })
})

describe("displayAge — Objective 1 (player age)", () => {
  it("renders the dash when dateOfBirth is missing", () => {
    expect(displayAge(null)).toBe(DASH)
  })
  it("renders the dash for an invalid date string", () => {
    expect(displayAge("not-a-date")).toBe(DASH)
  })
  it("computes the age in whole years from a valid date", () => {
    expect(displayAge("1995-06-12T00:00:00Z", new Date("2026-04-26T00:00:00Z"))).toBe("30")
  })
})

describe("buildCareerRowDisplay — Objective 6 (multi-season comparison)", () => {
  it("returns dashes for every numeric column when aggregates is null", () => {
    const row = buildCareerRowDisplay(null)
    expect(row.hasPlayed).toBe(false)
    expect(row.appearances).toBe(DASH)
    expect(row.goals).toBe(DASH)
    expect(row.assists).toBe(DASH)
    expect(row.minutes).toBe(DASH)
    expect(row.yellowCards).toBe(DASH)
    expect(row.redCards).toBe(DASH)
    expect(row.saves).toBe(DASH)
    expect(row.goalContributions).toBe(DASH)
    expect(row.avgRating).toBe(DASH)
  })

  it("returns dashes when aggregates exist but appearances are zero (player did not play)", () => {
    const row = buildCareerRowDisplay({
      appearances: 0,
      avgRating: null,
      totalMinutes: null,
      goals: 0,
      assists: 0,
      saves: 0,
      yellowCards: 0,
      redCards: 0,
    })
    expect(row.hasPlayed).toBe(false)
    expect(row.appearances).toBe(DASH)
    expect(row.goals).toBe(DASH)
  })

  it("renders populated values when the player has appearances", () => {
    const row = buildCareerRowDisplay({
      appearances: 18,
      avgRating: 7.42,
      totalMinutes: 1530,
      goals: 5,
      assists: 3,
      saves: 0,
      yellowCards: 4,
      redCards: 1,
    })
    expect(row.hasPlayed).toBe(true)
    expect(row.appearances).toBe("18")
    expect(row.goals).toBe("5")
    expect(row.assists).toBe("3")
    expect(row.minutes).toBe("1,530")
    expect(row.yellowCards).toBe("4")
    expect(row.redCards).toBe("1")
    expect(row.goalContributions).toBe("8")
    expect(row.avgRating).toBe("7.42")
  })

  it("renders the dash for avgRating when no rating data was recorded — never 0.00", () => {
    const row = buildCareerRowDisplay({
      appearances: 5,
      avgRating: null,
      totalMinutes: 450,
      goals: 0,
      assists: 0,
      saves: 0,
      yellowCards: 0,
      redCards: 0,
    })
    expect(row.avgRating).toBe(DASH)
    expect(row.avgRating).not.toBe("0.00")
  })

  it("renders the dash for minutes when totalMinutes is null — never 0", () => {
    const row = buildCareerRowDisplay({
      appearances: 1,
      avgRating: 7,
      totalMinutes: null,
      goals: 0,
      assists: 0,
      saves: 0,
      yellowCards: 0,
      redCards: 0,
    })
    expect(row.minutes).toBe(DASH)
  })
})
