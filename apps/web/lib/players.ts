import { apiFetch } from "@/lib/api"

interface ListResponse<T> {
  data: T[]
  pagination: {
    page: number
    pageSize: number
    totalItems: number
    totalPages: number
  }
}

interface DetailResponse<T> {
  data: T
}

export interface PlayerCountry {
  id: number
  name: string
  imageUrl: string | null
}

export interface PlayerDetail {
  id: number
  name: string
  commonName: string | null
  displayName: string | null
  imagePath: string | null
  positionId: number | null
  detailedPositionId: number | null
  dateOfBirth: string | null
  height: number | null
  weight: number | null
  country: PlayerCountry | null
}

export interface PlayerMembershipTeam {
  id: number
  name: string
  imagePath: string | null
}

export interface PlayerMembershipSeason {
  id: number
  name: string
  isCurrent: boolean
}

export interface PlayerMembership {
  id: number
  team: PlayerMembershipTeam
  season: PlayerMembershipSeason
  positionId: number | null
  shirtNumber: number | null
  isLoan: boolean
}

export interface PlayerStatEntry {
  id: number
  fixtureId: number
  typeId: number | null
  value: { normalizedValue: number | string | boolean | null }
}

export interface PlayerEventEntry {
  id: number
  fixtureId: number
  typeId: number | null
  minute: number | null
}

export const STAT_TYPE_RATING = 118
export const STAT_TYPE_MINUTES = 119
export const STAT_TYPE_ASSISTS = 79

export const EVENT_TYPE_GOAL = 14
export const EVENT_TYPE_GOAL_OWN = 15
export const EVENT_TYPE_GOAL_PENALTY = 16
export const EVENT_TYPE_YELLOW = 19
export const EVENT_TYPE_RED = 20
export const EVENT_TYPE_YELLOW_RED = 21

export const POSITION_LABELS: Record<number, string> = {
  24: "Goalkeeper",
  25: "Defender",
  26: "Midfielder",
  27: "Forward",
}

export const POSITION_CODES: Record<number, string> = {
  24: "GK",
  25: "DF",
  26: "MF",
  27: "FW",
}

export const POSITION_COLORS: Record<number, { badge: string; text: string }> = {
  24: { badge: "bg-amber-100 text-amber-700 border-amber-200", text: "text-amber-600" },
  25: { badge: "bg-blue-100 text-blue-700 border-blue-200", text: "text-blue-600" },
  26: { badge: "bg-emerald-100 text-emerald-700 border-emerald-200", text: "text-emerald-600" },
  27: { badge: "bg-red-100 text-red-700 border-red-200", text: "text-red-600" },
}

export const getPlayer = async (id: number): Promise<PlayerDetail> => {
  const response = await apiFetch<DetailResponse<PlayerDetail>>(`/api/v1/players/${id}`, {
    next: { revalidate: 86400 },
  })
  return response.data
}

export const getPlayerSquadMemberships = async (playerId: number): Promise<PlayerMembership[]> => {
  const response = await apiFetch<ListResponse<PlayerMembership>>(
    `/api/v1/squad-memberships?playerId=${playerId}&pageSize=20`,
    { next: { revalidate: 3600 } },
  )
  return response.data
}

export const getPlayerStatsByType = async (
  playerId: number,
  typeId: number,
  seasonId: number,
): Promise<PlayerStatEntry[]> => {
  const params = new URLSearchParams({
    playerId: String(playerId),
    typeId: String(typeId),
    seasonId: String(seasonId),
    pageSize: "500",
  })
  const response = await apiFetch<ListResponse<PlayerStatEntry>>(
    `/api/v1/fixture-player-statistics?${params.toString()}`,
    { next: { revalidate: 300 } },
  )
  return response.data
}

export const getPlayerSeasonEvents = async (
  playerId: number,
  seasonId: number,
): Promise<PlayerEventEntry[]> => {
  const params = new URLSearchParams({
    playerId: String(playerId),
    seasonId: String(seasonId),
    pageSize: "500",
  })
  const response = await apiFetch<ListResponse<PlayerEventEntry>>(
    `/api/v1/events?${params.toString()}`,
    { next: { revalidate: 300 } },
  )
  return response.data
}

export interface PlayerSeasonAggregates {
  appearances: number
  avgRating: number | null
  totalMinutes: number | null
  goals: number
  assists: number
  yellowCards: number
  redCards: number
}

export const computePlayerSeasonAggregates = (
  ratingStats: PlayerStatEntry[],
  minuteStats: PlayerStatEntry[],
  assistStats: PlayerStatEntry[],
  events: PlayerEventEntry[],
): PlayerSeasonAggregates => {
  const appearanceFixtureIds = new Set<number>()
  for (const stat of minuteStats) {
    const value = typeof stat.value.normalizedValue === "number" ? stat.value.normalizedValue : null
    if (value !== null && value > 0) appearanceFixtureIds.add(stat.fixtureId)
  }

  const ratingValues = ratingStats
    .map((stat) => stat.value.normalizedValue)
    .filter((value): value is number => typeof value === "number")
  const avgRating =
    ratingValues.length > 0
      ? Math.round((ratingValues.reduce((sum, value) => sum + value, 0) / ratingValues.length) * 100) / 100
      : null

  const totalMinutesSum = minuteStats.reduce((sum, stat) => {
    const value = typeof stat.value.normalizedValue === "number" ? stat.value.normalizedValue : 0
    return sum + value
  }, 0)
  const totalMinutes = totalMinutesSum > 0 ? totalMinutesSum : null

  const assistSum = assistStats.reduce((sum, stat) => {
    const value = typeof stat.value.normalizedValue === "number" ? stat.value.normalizedValue : 0
    return sum + value
  }, 0)

  const goals = events.filter(
    (event) => event.typeId === EVENT_TYPE_GOAL || event.typeId === EVENT_TYPE_GOAL_PENALTY,
  ).length
  const yellowCards = events.filter((event) => event.typeId === EVENT_TYPE_YELLOW).length
  const redCards = events.filter(
    (event) => event.typeId === EVENT_TYPE_RED || event.typeId === EVENT_TYPE_YELLOW_RED,
  ).length

  return {
    appearances: appearanceFixtureIds.size,
    avgRating,
    totalMinutes,
    goals,
    assists: assistSum,
    yellowCards,
    redCards,
  }
}
