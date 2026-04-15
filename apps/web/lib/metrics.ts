import { apiFetch } from "@/lib/api"
import type { TeamSummary } from "@/lib/dashboard"

interface DetailResponse<T> {
  data: T
}

interface PlayerSummary {
  id: number
  name: string
  displayName: string | null
  imagePath: string | null
  positionId: number | null
}

export interface LeaderEntry {
  player: PlayerSummary
  team: TeamSummary | null
  value: number
}

interface StatTypeSummary {
  id: number
  name: string
  developerName: string | null
}

export interface LeaderCategory {
  category: string
  statType: StatTypeSummary | null
  leaders: LeaderEntry[]
}

export interface LeadersContract {
  topRated: LeaderCategory
  topScorers: LeaderCategory
  topAssists: LeaderCategory
  topYellowCards: LeaderCategory
  topRedCards: LeaderCategory
}

interface GetLeadersOptions {
  seasonId?: number
  stageId?: number
  limit?: number
}

export const getLeaders = async (
  options: GetLeadersOptions = {}
): Promise<LeadersContract> => {
  const searchParams = new URLSearchParams()

  if (options.seasonId) {
    searchParams.set("seasonId", String(options.seasonId))
  }

  if (options.stageId) {
    searchParams.set("stageId", String(options.stageId))
  }

  searchParams.set("limit", String(options.limit ?? 6))

  const response = await apiFetch<DetailResponse<LeadersContract>>(
    `/api/v1/metrics/leaders?${searchParams.toString()}`
  )

  return response.data
}
