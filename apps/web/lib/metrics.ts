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
  topSaves: LeaderCategory
  topMinutes: LeaderCategory
}

interface GetLeadersOptions {
  seasonId?: number
  stageId?: number
  roundId?: number
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

  if (options.roundId) {
    searchParams.set("roundId", String(options.roundId))
  }

  searchParams.set("limit", String(options.limit ?? 10))

  const response = await apiFetch<DetailResponse<LeadersContract>>(
    `/api/v1/metrics/leaders?${searchParams.toString()}`,
    { next: { revalidate: 300 } },
  )

  return response.data
}

interface SquadPlayerRating {
  playerId: number
  averageRating: number
  appearances: number
}

export const getSquadRatingMap = async (teamId: number, seasonId: number): Promise<Map<number, number>> => {
  const response = await apiFetch<{ data: SquadPlayerRating[] }>(
    `/api/v1/metrics/squad-ratings?teamId=${teamId}&seasonId=${seasonId}`,
    { next: { revalidate: 300 } },
  )
  const ratingMap = new Map<number, number>()
  for (const entry of response.data) {
    ratingMap.set(entry.playerId, entry.averageRating)
  }
  return ratingMap
}
