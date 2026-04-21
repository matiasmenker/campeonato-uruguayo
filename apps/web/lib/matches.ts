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

interface PlayerSummary {
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

export const getFixturePlayerRatings = async (id: number): Promise<FixturePlayerStat[]> => {
  const response = await apiFetch<ListResponse<FixturePlayerStat>>(
    `/api/v1/fixtures/${id}/player-statistics?typeId=${STAT_TYPE_RATING}&pageSize=100`
  )
  return response.data
}

export const STAT_TYPE_RATING = 118
