import { describe, it, expect } from "vitest"
import {
  computePlayerSeasonAggregates,
  EVENT_TYPE_GOAL,
  EVENT_TYPE_GOAL_PENALTY,
  EVENT_TYPE_YELLOW,
  EVENT_TYPE_YELLOW_RED,
  EVENT_TYPE_RED,
  type PlayerStatEntry,
  type PlayerEventEntry,
} from "@/lib/players"

const ratingStat = (fixtureId: number, value: number | string | null): PlayerStatEntry => ({
  id: fixtureId,
  fixtureId,
  typeId: 118,
  value: { normalizedValue: value },
})

const minuteStat = (fixtureId: number, minutes: number | null): PlayerStatEntry => ({
  id: fixtureId,
  fixtureId,
  typeId: 119,
  value: { normalizedValue: minutes },
})

const event = (fixtureId: number, typeId: number): PlayerEventEntry => ({
  id: fixtureId * 100 + typeId,
  fixtureId,
  typeId,
  minute: 30,
})

describe("computePlayerSeasonAggregates — performance score (Objective 5)", () => {
  it("returns the arithmetic mean of available provider ratings", () => {
    const result = computePlayerSeasonAggregates(
      [ratingStat(1, 7.0), ratingStat(2, 8.0), ratingStat(3, 9.0)],
      [],
      [],
      [],
    )
    expect(result.avgRating).toBe(8.0)
  })

  it("rounds the mean to two decimals", () => {
    const result = computePlayerSeasonAggregates(
      [ratingStat(1, 7.345), ratingStat(2, 7.345), ratingStat(3, 7.345)],
      [],
      [],
      [],
    )
    expect(result.avgRating).toBe(7.35)
  })

  it("is deterministic for the same input", () => {
    const ratings = [ratingStat(1, 6.7), ratingStat(2, 7.4), ratingStat(3, 8.1)]
    const a = computePlayerSeasonAggregates(ratings, [], [], [])
    const b = computePlayerSeasonAggregates(ratings, [], [], [])
    expect(a.avgRating).toBe(b.avgRating)
  })

  it("returns null (not zero) when no rating data is available", () => {
    const result = computePlayerSeasonAggregates([], [], [], [])
    expect(result.avgRating).toBeNull()
  })

  it("ignores non-numeric rating values without crashing", () => {
    const result = computePlayerSeasonAggregates(
      [ratingStat(1, 7.0), ratingStat(2, "n/a"), ratingStat(3, null), ratingStat(4, 9.0)],
      [],
      [],
      [],
    )
    expect(result.avgRating).toBe(8.0)
  })
})

describe("computePlayerSeasonAggregates — missing data (Objective 1, 6)", () => {
  it("returns totalMinutes = null when no minute data is available", () => {
    const result = computePlayerSeasonAggregates([], [], [], [])
    expect(result.totalMinutes).toBeNull()
  })

  it("does not silently turn missing minutes into zero appearances", () => {
    const result = computePlayerSeasonAggregates([], [], [], [])
    expect(result.appearances).toBe(0)
    expect(result.totalMinutes).toBeNull()
  })

  it("counts a fixture as an appearance only when minutes > 0", () => {
    const result = computePlayerSeasonAggregates(
      [],
      [minuteStat(1, 90), minuteStat(2, 0), minuteStat(3, 45)],
      [],
      [],
    )
    expect(result.appearances).toBe(2)
    expect(result.totalMinutes).toBe(135)
  })
})

describe("computePlayerSeasonAggregates — events (Objective 1)", () => {
  it("counts goals from regular and penalty events", () => {
    const result = computePlayerSeasonAggregates(
      [],
      [],
      [],
      [event(1, EVENT_TYPE_GOAL), event(2, EVENT_TYPE_GOAL_PENALTY), event(3, EVENT_TYPE_GOAL)],
    )
    expect(result.goals).toBe(3)
  })

  it("counts yellow cards and red cards (including yellow-red) separately", () => {
    const result = computePlayerSeasonAggregates(
      [],
      [],
      [],
      [
        event(1, EVENT_TYPE_YELLOW),
        event(2, EVENT_TYPE_YELLOW),
        event(3, EVENT_TYPE_RED),
        event(4, EVENT_TYPE_YELLOW_RED),
      ],
    )
    expect(result.yellowCards).toBe(2)
    expect(result.redCards).toBe(2)
  })

  it("handles an empty event list without throwing", () => {
    const result = computePlayerSeasonAggregates([], [], [], [])
    expect(result.goals).toBe(0)
    expect(result.yellowCards).toBe(0)
    expect(result.redCards).toBe(0)
  })
})
