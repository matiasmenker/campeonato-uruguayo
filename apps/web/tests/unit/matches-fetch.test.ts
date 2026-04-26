import { describe, it, expect, vi, beforeEach } from "vitest"

const apiFetchMock = vi.fn()

vi.mock("@/lib/api", () => ({
  apiFetch: (path: string, init?: unknown) => apiFetchMock(path, init),
}))

import {
  getFixture,
  getFixtureEvents,
  getFixtureLineups,
  getFixturePlayerRatings,
  getFixturePlayerAssists,
  getFixturePlayerMinutesPlayed,
  getFixturePlayerSaves,
  getFixturePlayerStatsByType,
  getFixtures,
  STAT_TYPE_RATING,
} from "@/lib/matches"

const lastUrl = (): string => apiFetchMock.mock.calls[apiFetchMock.mock.calls.length - 1][0] as string

beforeEach(() => {
  apiFetchMock.mockReset()
})

describe("getFixture — Objective 2 (loads fixture detail)", () => {
  it("calls /api/v1/fixtures/:id", async () => {
    apiFetchMock.mockResolvedValue({ data: { id: 98 } })
    await getFixture(98)
    expect(lastUrl()).toBe("/api/v1/fixtures/98")
  })
})

describe("getFixtureEvents / Lineups / Stats — Objective 2 (sections handled where available)", () => {
  it("getFixtureEvents queries by fixture id", async () => {
    apiFetchMock.mockResolvedValue({ data: [] })
    await getFixtureEvents(98)
    expect(lastUrl()).toBe("/api/v1/fixtures/98/events?pageSize=100")
  })

  it("getFixtureLineups queries by fixture id", async () => {
    apiFetchMock.mockResolvedValue({ data: [] })
    await getFixtureLineups(98)
    expect(lastUrl()).toBe("/api/v1/fixtures/98/lineups?pageSize=100")
  })

  it("getFixturePlayerStatsByType uses the requested type id", async () => {
    apiFetchMock.mockResolvedValue({ data: [] })
    await getFixturePlayerStatsByType(98, STAT_TYPE_RATING)
    expect(lastUrl()).toBe(`/api/v1/fixtures/98/player-statistics?typeId=${STAT_TYPE_RATING}&pageSize=100`)
  })

  it("STAT_TYPE_RATING shortcut resolves to the rating type id", async () => {
    apiFetchMock.mockResolvedValue({ data: [] })
    await getFixturePlayerRatings(98)
    expect(lastUrl()).toContain("typeId=118")
  })

  it("assists / minutes / saves shortcuts use the documented stat type ids", async () => {
    apiFetchMock.mockResolvedValue({ data: [] })
    await getFixturePlayerAssists(98)
    expect(lastUrl()).toContain("typeId=79")
    apiFetchMock.mockResolvedValue({ data: [] })
    await getFixturePlayerMinutesPlayed(98)
    expect(lastUrl()).toContain("typeId=119")
    apiFetchMock.mockResolvedValue({ data: [] })
    await getFixturePlayerSaves(98)
    expect(lastUrl()).toContain("typeId=57")
  })
})

describe("Match details — Objective 2 (omits/safely handles unsupported sections)", () => {
  it("getFixtureEvents returns [] when the fixture has no events recorded", async () => {
    apiFetchMock.mockResolvedValue({ data: [] })
    expect(await getFixtureEvents(98)).toEqual([])
  })

  it("getFixtureLineups returns [] when no lineup is available", async () => {
    apiFetchMock.mockResolvedValue({ data: [] })
    expect(await getFixtureLineups(98)).toEqual([])
  })

  it("getFixturePlayerRatings returns [] when no per-player ratings exist", async () => {
    apiFetchMock.mockResolvedValue({ data: [] })
    expect(await getFixturePlayerRatings(98)).toEqual([])
  })
})

describe("getFixtures — Objective 4 (season + stage filtered fixture list)", () => {
  it("includes seasonId, stageId, roundId and pagination params", async () => {
    apiFetchMock.mockResolvedValue({
      data: [],
      pagination: { page: 1, pageSize: 100, totalItems: 0, totalPages: 0 },
    })
    await getFixtures({ seasonId: 23, stageId: 5, roundId: 7, page: 2, pageSize: 20 })
    const url = lastUrl()
    expect(url).toContain("seasonId=23")
    expect(url).toContain("stageId=5")
    expect(url).toContain("roundId=7")
    expect(url).toContain("page=2")
    expect(url).toContain("pageSize=20")
  })

  it("uses default pagination when not provided", async () => {
    apiFetchMock.mockResolvedValue({
      data: [],
      pagination: { page: 1, pageSize: 100, totalItems: 0, totalPages: 0 },
    })
    await getFixtures({})
    const url = lastUrl()
    expect(url).toContain("page=1")
    expect(url).toContain("pageSize=100")
  })
})
