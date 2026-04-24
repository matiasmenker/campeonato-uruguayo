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

const LEADER_CATEGORIES: Array<keyof LeadersContract> = [
  "topRated",
  "topScorers",
  "topAssists",
  "topMinutes",
  "topYellowCards",
  "topSaves",
]

const mergeLeaderContracts = (payloads: LeadersContract[], limit: number): LeadersContract => {
  const merged = {} as LeadersContract
  for (const category of LEADER_CATEGORIES) {
    const byPlayer = new Map<number, { entry: LeaderEntry; samples: number }>()
    for (const payload of payloads) {
      const list = payload[category]?.leaders ?? []
      for (const entry of list) {
        const prev = byPlayer.get(entry.player.id)
        if (!prev) {
          byPlayer.set(entry.player.id, { entry: { ...entry }, samples: 1 })
        } else if (category === "topRated") {
          const combined = (prev.entry.value * prev.samples + entry.value) / (prev.samples + 1)
          byPlayer.set(entry.player.id, {
            entry: { ...entry, value: Math.round(combined * 100) / 100 },
            samples: prev.samples + 1,
          })
        } else {
          byPlayer.set(entry.player.id, {
            entry: { ...entry, value: prev.entry.value + entry.value },
            samples: prev.samples + 1,
          })
        }
      }
    }
    const sorted = Array.from(byPlayer.values())
      .map((item) => item.entry)
      .sort((first, second) => second.value - first.value)
      .slice(0, limit)
    const firstPayloadCategory = payloads.find((payload) => payload[category])?.[category]
    merged[category] = {
      category,
      statType: firstPayloadCategory?.statType ?? null,
      leaders: sorted,
    }
  }
  return merged
}

export const getLeadersForStages = async (opts: {
  seasonId: number
  stageIds: number[]
  limit?: number
}): Promise<LeadersContract> => {
  const limit = opts.limit ?? 10
  if (opts.stageIds.length === 0) {
    return getLeaders({ seasonId: opts.seasonId, limit })
  }
  if (opts.stageIds.length === 1) {
    return getLeaders({ seasonId: opts.seasonId, stageId: opts.stageIds[0], limit })
  }
  const perStage = await Promise.all(
    opts.stageIds.map((stageId) => getLeaders({ seasonId: opts.seasonId, stageId, limit: Math.max(limit, 20) }))
  )
  return mergeLeaderContracts(perStage, limit)
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
