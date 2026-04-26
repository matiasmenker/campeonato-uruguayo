import { describe, it, expect, vi, beforeEach } from "vitest"

const apiFetchMock = vi.fn()

vi.mock("@/lib/api", () => ({
  apiFetch: (path: string, init?: unknown) => apiFetchMock(path, init),
}))

import {
  getTeam,
  getTeams,
  getTeamSquad,
  getTeamCoaches,
  getTeamFixtures,
  getTeamVenue,
} from "@/lib/teams"

const lastUrl = (): string => apiFetchMock.mock.calls[apiFetchMock.mock.calls.length - 1][0] as string

beforeEach(() => {
  apiFetchMock.mockReset()
})

describe("getTeam — Objective 3 (loads team)", () => {
  it("calls /api/v1/teams/:id", async () => {
    apiFetchMock.mockResolvedValue({ data: { id: 14, name: "Peñarol", shortCode: "PEÑ", imagePath: null } })
    await getTeam(14)
    expect(lastUrl()).toBe("/api/v1/teams/14")
  })
})

describe("getTeams — Objective 3 (season-aware team list)", () => {
  it("does not include seasonId when omitted", async () => {
    apiFetchMock.mockResolvedValue({ data: [] })
    await getTeams()
    expect(lastUrl()).not.toContain("seasonId")
  })

  it("includes seasonId when provided", async () => {
    apiFetchMock.mockResolvedValue({ data: [] })
    await getTeams(23)
    expect(lastUrl()).toContain("seasonId=23")
  })
})

describe("getTeamSquad — Objective 3 (squad resolved by team and season)", () => {
  it("queries by both teamId and seasonId", async () => {
    apiFetchMock.mockResolvedValue({ data: [] })
    await getTeamSquad(14, 23)
    const url = lastUrl()
    expect(url).toContain("teamId=14")
    expect(url).toContain("seasonId=23")
  })

  it("returns an empty array when the API has no squad records (handles missing safely)", async () => {
    apiFetchMock.mockResolvedValue({ data: [] })
    const result = await getTeamSquad(14, 23)
    expect(result).toEqual([])
  })
})

describe("getTeamCoaches — Objective 3 (no fabrication of historical coach data)", () => {
  it("marks the first coach as isCurrent: true only when the season is the current one", async () => {
    apiFetchMock.mockResolvedValue({
      data: [
        {
          id: 1,
          name: "Coach A",
          imagePath: null,
          assignments: [{ team: { id: 14 }, season: { id: 23, isCurrent: true } }],
        },
        {
          id: 2,
          name: "Coach B",
          imagePath: null,
          assignments: [{ team: { id: 14 }, season: { id: 23, isCurrent: true } }],
        },
      ],
    })
    const coaches = await getTeamCoaches(14, 23)
    expect(coaches.map((c) => ({ id: c.id, isCurrent: c.isCurrent }))).toEqual([
      { id: 1, isCurrent: true },
      { id: 2, isCurrent: false },
    ])
  })

  it("does NOT fabricate a current coach when looking at a historical season", async () => {
    apiFetchMock.mockResolvedValue({
      data: [
        {
          id: 1,
          name: "Coach Past",
          imagePath: null,
          assignments: [{ team: { id: 14 }, season: { id: 19, isCurrent: false } }],
        },
        {
          id: 2,
          name: "Coach Past 2",
          imagePath: null,
          assignments: [{ team: { id: 14 }, season: { id: 19, isCurrent: false } }],
        },
      ],
    })
    const coaches = await getTeamCoaches(14, 19)
    expect(coaches.every((c) => c.isCurrent === false)).toBe(true)
  })

  it("does NOT mark isCurrent when assignment is for a different team", async () => {
    apiFetchMock.mockResolvedValue({
      data: [
        {
          id: 1,
          name: "Coach Other",
          imagePath: null,
          assignments: [{ team: { id: 99 }, season: { id: 23, isCurrent: true } }],
        },
      ],
    })
    const coaches = await getTeamCoaches(14, 23)
    expect(coaches[0].isCurrent).toBe(false)
  })

  it("returns empty array when the team has no coach records (missing data is not fabricated)", async () => {
    apiFetchMock.mockResolvedValue({ data: [] })
    const coaches = await getTeamCoaches(14, 23)
    expect(coaches).toEqual([])
  })
})

describe("getTeamFixtures — Objective 3 (team fixtures sorted desc by kickoff)", () => {
  it("queries by teamId and seasonId, ordered by kickoffAt desc", async () => {
    apiFetchMock.mockResolvedValue({ data: [] })
    await getTeamFixtures(14, 23, 10)
    const url = lastUrl()
    expect(url).toContain("teamId=14")
    expect(url).toContain("seasonId=23")
    expect(url).toContain("limit=10")
    expect(url).toContain("sort=kickoffAt")
    expect(url).toContain("order=desc")
  })
})

describe("getTeamVenue — Objective 3 (venue resolved from recent fixtures)", () => {
  it("returns null when no fixture has a venue (no fabrication)", async () => {
    apiFetchMock.mockResolvedValue({ data: [{ venue: null }, { venue: null }] })
    const venue = await getTeamVenue(14, 23)
    expect(venue).toBeNull()
  })

  it("returns the first non-null venue from recent fixtures", async () => {
    const realVenue = { id: 7, name: "Campeón del Siglo", city: "Montevideo", capacity: 40000, imagePath: null }
    apiFetchMock.mockResolvedValue({ data: [{ venue: null }, { venue: realVenue }, { venue: null }] })
    const venue = await getTeamVenue(14, 23)
    expect(venue).toEqual(realVenue)
  })
})
