import { apiFetch } from "@/lib/api"

export interface StandingTeam {
  id: number
  name: string
  shortCode: string | null
  imagePath: string | null
}

export interface StandingSeason {
  id: number
  name: string
  isCurrent: boolean
}

export interface StandingStage {
  id: number
  name: string
  type: string | null
  isCurrent: boolean
}

export interface StandingEntry {
  id: number
  position: number
  points: number
  played: number
  won: number
  draw: number
  lost: number
  goalsFor: number
  goalsAgainst: number
  goalDifference: number
  season: StandingSeason
  stage: StandingStage
  team: StandingTeam
  createdAt: string
  updatedAt: string
}

interface StandingsResponse {
  data: StandingEntry[]
  pagination: {
    page: number
    pageSize: number
    totalItems: number
    totalPages: number
  }
}

export const getStandings = async (params?: { seasonId?: number; stageId?: number }): Promise<StandingEntry[]> => {
  const searchParams = new URLSearchParams()
  if (params?.seasonId) searchParams.set("seasonId", String(params.seasonId))
  if (params?.stageId) searchParams.set("stageId", String(params.stageId))
  const query = searchParams.toString()
  const response = await apiFetch<StandingsResponse>(`/api/v1/standings${query ? `?${query}` : ""}`, {
    next: { revalidate: 300 },
  })
  return response.data
}
