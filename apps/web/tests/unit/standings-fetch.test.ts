import { describe, it, expect, vi, beforeEach } from "vitest"

const apiFetchMock = vi.fn()

vi.mock("@/lib/api", () => ({
  apiFetch: (path: string, init?: unknown) => apiFetchMock(path, init),
}))

import { getStandings } from "@/lib/standings"

const lastUrl = (): string => apiFetchMock.mock.calls[apiFetchMock.mock.calls.length - 1][0] as string

beforeEach(() => {
  apiFetchMock.mockReset()
})

describe("getStandings — Objective 4 (renders standings by selected season and stage)", () => {
  it("calls /api/v1/standings with no query when no params provided", async () => {
    apiFetchMock.mockResolvedValue({ data: [], pagination: { page: 1, pageSize: 0, totalItems: 0, totalPages: 0 } })
    await getStandings()
    expect(lastUrl()).toBe("/api/v1/standings")
  })

  it("appends seasonId when provided", async () => {
    apiFetchMock.mockResolvedValue({ data: [], pagination: { page: 1, pageSize: 0, totalItems: 0, totalPages: 0 } })
    await getStandings({ seasonId: 23 })
    expect(lastUrl()).toContain("seasonId=23")
  })

  it("appends stageId when provided", async () => {
    apiFetchMock.mockResolvedValue({ data: [], pagination: { page: 1, pageSize: 0, totalItems: 0, totalPages: 0 } })
    await getStandings({ stageId: 5 })
    expect(lastUrl()).toContain("stageId=5")
  })

  it("appends both seasonId and stageId when provided", async () => {
    apiFetchMock.mockResolvedValue({ data: [], pagination: { page: 1, pageSize: 0, totalItems: 0, totalPages: 0 } })
    await getStandings({ seasonId: 23, stageId: 5 })
    const url = lastUrl()
    expect(url).toContain("seasonId=23")
    expect(url).toContain("stageId=5")
  })
})

describe("getStandings — Objective 4 (handles empty/missing standings safely)", () => {
  it("returns an empty array when the API has no standings for the season", async () => {
    apiFetchMock.mockResolvedValue({ data: [], pagination: { page: 1, pageSize: 0, totalItems: 0, totalPages: 0 } })
    const result = await getStandings({ seasonId: 99999 })
    expect(result).toEqual([])
  })

  it("does not throw when the response is empty (no fabrication of synthetic rows)", async () => {
    apiFetchMock.mockResolvedValue({ data: [], pagination: { page: 1, pageSize: 0, totalItems: 0, totalPages: 0 } })
    await expect(getStandings({ seasonId: 99999, stageId: 9999 })).resolves.toEqual([])
  })
})
