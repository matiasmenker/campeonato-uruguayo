import { describe, it, expect } from "vitest"
import {
  getMatchStatus,
  getLiveLabel,
  formatMatchDay,
  formatKickoffTime,
} from "@/lib/match-status"

describe("getMatchStatus", () => {
  it("returns 'live' for in-play states", () => {
    expect(getMatchStatus("INPLAY_1ST_HALF")).toBe("live")
    expect(getMatchStatus("INPLAY_2ND_HALF")).toBe("live")
    expect(getMatchStatus("HT")).toBe("live")
    expect(getMatchStatus("INPLAY_ET")).toBe("live")
    expect(getMatchStatus("INPLAY_PENALTIES")).toBe("live")
    expect(getMatchStatus("BREAK")).toBe("live")
  })

  it("returns 'finished' for finished states", () => {
    expect(getMatchStatus("FT")).toBe("finished")
    expect(getMatchStatus("AET")).toBe("finished")
    expect(getMatchStatus("FT_PEN")).toBe("finished")
    expect(getMatchStatus("AWARDED")).toBe("finished")
  })

  it("returns 'upcoming' for not-started state", () => {
    expect(getMatchStatus("NS")).toBe("upcoming")
  })

  it("returns 'upcoming' for null state", () => {
    expect(getMatchStatus(null)).toBe("upcoming")
  })

  it("returns 'upcoming' for unknown state codes", () => {
    expect(getMatchStatus("POSTPONED")).toBe("upcoming")
    expect(getMatchStatus("RANDOM")).toBe("upcoming")
  })
})

describe("getLiveLabel", () => {
  it("returns 'Half time' for HT state", () => {
    expect(getLiveLabel("HT")).toBe("Half time")
  })

  it("returns 'Extra time' for ET states", () => {
    expect(getLiveLabel("INPLAY_ET")).toBe("Extra time")
    expect(getLiveLabel("INPLAY_ET_SECOND_HALF")).toBe("Extra time")
  })

  it("returns 'Penalties' for penalty shootout state", () => {
    expect(getLiveLabel("INPLAY_PENALTIES")).toBe("Penalties")
  })

  it("returns 'Break' for break state", () => {
    expect(getLiveLabel("EXTRA_TIME_BREAK")).toBe("Break")
  })

  it("returns 'Live' for default in-play state", () => {
    expect(getLiveLabel("INPLAY_1ST_HALF")).toBe("Live")
    expect(getLiveLabel("INPLAY_2ND_HALF")).toBe("Live")
  })
})

describe("formatMatchDay", () => {
  it("returns 'No date' when value is null", () => {
    expect(formatMatchDay(null)).toBe("No date")
  })

  it("formats UTC date in Montevideo timezone (UTC-3)", () => {
    const result = formatMatchDay("2026-04-25T18:30:00.000Z")
    expect(result).toContain("25/04/2026")
  })

  it("rolls back day when UTC time is past midnight UYT", () => {
    const result = formatMatchDay("2026-04-26T01:00:00.000Z")
    expect(result).toContain("25/04/2026")
  })

  it("capitalizes the weekday name", () => {
    const result = formatMatchDay("2026-04-25T18:30:00.000Z")
    expect(result.charAt(0)).toBe(result.charAt(0).toUpperCase())
  })
})

describe("formatKickoffTime", () => {
  it("returns '--:--' when value is null", () => {
    expect(formatKickoffTime(null)).toBe("--:--")
  })

  it("formats UTC kickoff in Montevideo timezone", () => {
    expect(formatKickoffTime("2026-04-25T18:30:00.000Z")).toBe("15:30")
  })

  it("uses 24-hour format", () => {
    expect(formatKickoffTime("2026-04-25T22:00:00.000Z")).toBe("19:00")
    expect(formatKickoffTime("2026-04-25T00:00:00.000Z")).toBe("21:00")
  })
})
