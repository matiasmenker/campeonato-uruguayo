import { describe, it, expect, vi, beforeEach } from "vitest"

const apiFetchMock = vi.fn()

vi.mock("@/lib/api", () => ({
  apiFetch: (path: string, init?: unknown) => apiFetchMock(path, init),
}))

import {
  getPlayer,
  getPlayerSquadMemberships,
  getPlayerStatsByType,
  getPlayerSeasonEvents,
  getPlayerTeamFixtures,
} from "@/lib/players"

const lastUrl = (): string => apiFetchMock.mock.calls[apiFetchMock.mock.calls.length - 1][0] as string

beforeEach(() => {
  apiFetchMock.mockReset()
})

describe("getPlayer — Objective 1 (loads player data)", () => {
  it("calls /api/v1/players/:id", async () => {
    apiFetchMock.mockResolvedValue({ data: { id: 1622, name: "X" } })
    await getPlayer(1622)
    expect(lastUrl()).toBe("/api/v1/players/1622")
  })
})

describe("getPlayerSquadMemberships — Objective 1 (membership context)", () => {
  it("queries by playerId", async () => {
    apiFetchMock.mockResolvedValue({ data: [] })
    await getPlayerSquadMemberships(1622)
    expect(lastUrl()).toContain("playerId=1622")
  })

  it("returns empty array when no memberships exist (missing data is not fabricated)", async () => {
    apiFetchMock.mockResolvedValue({ data: [] })
    const result = await getPlayerSquadMemberships(99999)
    expect(result).toEqual([])
  })
})

describe("getPlayerStatsByType — Objective 1 (season + stage aware stats)", () => {
  it("includes playerId, typeId and seasonId in the URL", async () => {
    apiFetchMock.mockResolvedValue({ data: [] })
    await getPlayerStatsByType(1622, 118, 23)
    const url = lastUrl()
    expect(url).toContain("playerId=1622")
    expect(url).toContain("typeId=118")
    expect(url).toContain("seasonId=23")
  })

  it("appends stageId only when provided", async () => {
    apiFetchMock.mockResolvedValue({ data: [] })
    await getPlayerStatsByType(1622, 118, 23, 5)
    expect(lastUrl()).toContain("stageId=5")
  })

  it("omits stageId when not provided", async () => {
    apiFetchMock.mockResolvedValue({ data: [] })
    await getPlayerStatsByType(1622, 118, 23)
    expect(lastUrl()).not.toContain("stageId")
  })
})

describe("getPlayerSeasonEvents — Objective 1 (season-aware events)", () => {
  it("includes playerId and seasonId", async () => {
    apiFetchMock.mockResolvedValue({ data: [] })
    await getPlayerSeasonEvents(1622, 23)
    const url = lastUrl()
    expect(url).toContain("playerId=1622")
    expect(url).toContain("seasonId=23")
  })

  it("appends stageId when provided", async () => {
    apiFetchMock.mockResolvedValue({ data: [] })
    await getPlayerSeasonEvents(1622, 23, 9)
    expect(lastUrl()).toContain("stageId=9")
  })
})

describe("getPlayerTeamFixtures — Objective 1 (season-aware fixtures)", () => {
  it("queries by teamId and seasonId, sorted by kickoffAt asc", async () => {
    apiFetchMock.mockResolvedValue({ data: [] })
    await getPlayerTeamFixtures(14, 23)
    const url = lastUrl()
    expect(url).toContain("teamId=14")
    expect(url).toContain("seasonId=23")
    expect(url).toContain("sort=kickoffAt")
    expect(url).toContain("order=asc")
  })

  it("filters out fixtures without scores (no fabrication of unfinished games)", async () => {
    apiFetchMock.mockResolvedValue({
      data: [
        { id: 1, kickoffAt: null, homeScore: 1, awayScore: 0, round: null, homeTeam: null, awayTeam: null },
        { id: 2, kickoffAt: null, homeScore: null, awayScore: 0, round: null, homeTeam: null, awayTeam: null },
        { id: 3, kickoffAt: null, homeScore: 1, awayScore: null, round: null, homeTeam: null, awayTeam: null },
        { id: 4, kickoffAt: null, homeScore: null, awayScore: null, round: null, homeTeam: null, awayTeam: null },
      ],
    })
    const result = await getPlayerTeamFixtures(14, 23)
    expect(result.map((f) => f.id)).toEqual([1])
  })
})
