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

interface TeamSummary {
  id: number
  name: string
  shortCode: string | null
  imagePath: string | null
}

interface SeasonSummary {
  id: number
  name: string
}

interface StageSummary {
  id: number
  name: string
}

interface RoundSummary {
  id: number
  name: string
}

interface VenueSummary {
  id: number
  name: string
  city: string | null
  imagePath: string | null
}

interface RefereeSummary {
  id: number
  name: string
  imagePath: string | null
}

interface FixtureStateSummary {
  id: number
  state: string
  name: string
  shortName: string
  developerName: string
}

export interface PlayerSummary {
  id: number
  name: string
  displayName: string | null
  imagePath: string | null
  positionId: number | null
}

export interface Fixture {
  id: number
  name: string | null
  kickoffAt: string | null
  resultInfo: string | null
  homeScore: number | null
  awayScore: number | null
  homeFormation: string | null
  awayFormation: string | null
  state: FixtureStateSummary | null
  season: SeasonSummary
  stage: StageSummary | null
  round: RoundSummary | null
  venue: VenueSummary | null
  referee: RefereeSummary | null
  homeTeam: TeamSummary | null
  awayTeam: TeamSummary | null
}

export interface FixtureEvent {
  id: number
  fixtureId: number
  player: PlayerSummary | null
  relatedPlayer: PlayerSummary | null  // for substitutions: the player going OUT
  typeId: number | null
  sortOrder: number | null
  minute: number | null
  extraMinute: number | null
  result: string | null
  info: string | null
  addition: string | null
}

export interface LineupPlayer {
  id: number
  fixtureId: number
  player: PlayerSummary
  team: TeamSummary | null
  teamResolution: "resolved" | "unresolved"
  position: string | null
  formationPosition: number | null
  typeId: number | null          // 11 = starter, 12 = bench
  formationField: string | null  // pitch coordinates "row:col" e.g. "2:2"
  jerseyNumber: number | null
}

export const getFixture = async (id: number): Promise<Fixture> => {
  const response = await apiFetch<DetailResponse<Fixture>>(`/api/v1/fixtures/${id}`)
  return response.data
}

export const getFixtureEvents = async (id: number): Promise<FixtureEvent[]> => {
  const response = await apiFetch<ListResponse<FixtureEvent>>(
    `/api/v1/fixtures/${id}/events?pageSize=100`
  )
  return response.data
}

export const getFixtureLineups = async (id: number): Promise<LineupPlayer[]> => {
  const response = await apiFetch<ListResponse<LineupPlayer>>(
    `/api/v1/fixtures/${id}/lineups?pageSize=100`
  )
  return response.data
}

export interface FixturePlayerStat {
  id: number
  fixtureId: number
  player: PlayerSummary
  typeId: number | null
  value: { normalizedValue: number | string | boolean | null }
}

export const STAT_TYPE_RATING         = 118
export const STAT_TYPE_ASSIST         = 79
export const STAT_TYPE_GOALS          = 52
export const STAT_TYPE_MINUTES_PLAYED = 119

export const getFixturePlayerStatsByType = async (id: number, typeId: number): Promise<FixturePlayerStat[]> => {
  const response = await apiFetch<ListResponse<FixturePlayerStat>>(
    `/api/v1/fixtures/${id}/player-statistics?typeId=${typeId}&pageSize=100`
  )
  return response.data
}

// Convenience wrappers
export const getFixturePlayerRatings      = (id: number) => getFixturePlayerStatsByType(id, STAT_TYPE_RATING)
export const getFixturePlayerAssists      = (id: number) => getFixturePlayerStatsByType(id, STAT_TYPE_ASSIST)
export const getFixturePlayerMinutesPlayed = (id: number) => getFixturePlayerStatsByType(id, STAT_TYPE_MINUTES_PLAYED)

export interface Round {
  id: number
  name: string
  isCurrent: boolean
}

export interface FixtureListItem {
  id: number
  kickoffAt: string | null
  resultInfo: string | null
  homeScore: number | null
  awayScore: number | null
  state: {
    id: number
    state: string
    name: string
    shortName: string
    developerName: string
  } | null
  season: { id: number; name: string; isCurrent: boolean }
  stage: { id: number; name: string; isCurrent: boolean } | null
  round: Round | null
  venue: { id: number; name: string; city: string | null; imagePath: string | null } | null
  homeTeam: { id: number; name: string; shortCode: string | null; imagePath: string | null } | null
  awayTeam: { id: number; name: string; shortCode: string | null; imagePath: string | null } | null
}

export interface FixtureListResponse {
  data: FixtureListItem[]
  pagination: {
    page: number
    pageSize: number
    totalItems: number
    totalPages: number
  }
}

export const getFixtures = async (params: {
  seasonId?: number
  stageId?: number
  roundId?: number
  page?: number
  pageSize?: number
}): Promise<FixtureListResponse> => {
  const query = new URLSearchParams()
  if (params.seasonId) query.set("seasonId", String(params.seasonId))
  if (params.stageId) query.set("stageId", String(params.stageId))
  if (params.roundId) query.set("roundId", String(params.roundId))
  query.set("page", String(params.page ?? 1))
  query.set("pageSize", String(params.pageSize ?? 100))
  return apiFetch<FixtureListResponse>(`/api/v1/fixtures?${query.toString()}`)
}
