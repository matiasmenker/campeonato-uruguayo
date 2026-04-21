import { apiFetch } from "@/lib/api"

export interface SeasonLeague {
  id: number
  name: string
  shortCode: string
  imagePath: string | null
}

export interface Season {
  id: number
  name: string
  isCurrent: boolean
  startingAt: string
  endingAt: string
  league: SeasonLeague
}

export interface Stage {
  id: number
  name: string
  type: string | null
  isCurrent: boolean
  season: {
    id: number
    name: string
    isCurrent: boolean
  }
}

interface ListResponse<T> {
  data: T[]
}

export const getSeasons = async (): Promise<Season[]> => {
  const response = await apiFetch<ListResponse<Season>>("/api/v1/seasons")
  return response.data
}

export const getStages = async (seasonId?: number): Promise<Stage[]> => {
  const query = seasonId ? `?seasonId=${seasonId}` : ""
  const response = await apiFetch<ListResponse<Stage>>(`/api/v1/stages${query}`)
  return response.data
}
