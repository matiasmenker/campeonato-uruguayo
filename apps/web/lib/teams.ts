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

export interface Team {
  id: number
  name: string
  shortCode: string | null
  imagePath: string | null
}

interface TeamSeason {
  id: number
  name: string
  isCurrent: boolean
}

interface TeamStage {
  id: number
  name: string
  type: string | null
  isCurrent: boolean
}

interface TeamRound {
  id: number
  name: string
  isCurrent: boolean
}

interface TeamState {
  id: number
  state: string
  name: string
  shortName: string
  developerName: string
}

export interface TeamVenue {
  id: number
  name: string
  city: string | null
  capacity: number | null
  imagePath: string | null
}

export interface TeamFixture {
  id: number
  kickoffAt: string | null
  resultInfo: string | null
  homeScore: number | null
  awayScore: number | null
  state: TeamState | null
  season: TeamSeason
  stage: TeamStage | null
  round: TeamRound | null
  venue: TeamVenue | null
  homeTeam: Team | null
  awayTeam: Team | null
}

export interface SquadMember {
  id: number
  player: {
    id: number
    name: string
    displayName: string | null
    imagePath: string | null
    positionId: number | null
    dateOfBirth: string | null
    height: number | null
    nationality: { name: string; imageUrl: string | null } | null
  }
  positionId: number | null
  shirtNumber: number | null
  isLoan: boolean
}

export interface TeamCoach {
  id: number
  name: string
  imagePath: string | null
  isCurrent: boolean
}

interface CoachApiPayload {
  id: number
  name: string
  imagePath: string | null
  assignments?: Array<{
    team?: { id: number } | null
    season?: { id: number; isCurrent: boolean } | null
  }>
}

export const getTeam = async (id: number): Promise<Team> => {
  const response = await apiFetch<DetailResponse<Team>>(`/api/v1/teams/${id}`, {
    next: { revalidate: 86400 },
  })
  return response.data
}

export const getTeams = async (seasonId?: number): Promise<Team[]> => {
  const params = new URLSearchParams({ pageSize: "100" })
  if (seasonId) params.set("seasonId", String(seasonId))
  const response = await apiFetch<ListResponse<Team>>(`/api/v1/teams?${params}`, {
    next: { revalidate: 86400 },
  })
  return response.data
}

export const getTeamFixtures = async (teamId: number, seasonId: number, limit = 15): Promise<TeamFixture[]> => {
  const response = await apiFetch<ListResponse<TeamFixture>>(
    `/api/v1/fixtures?teamId=${teamId}&seasonId=${seasonId}&limit=${limit}&sort=kickoffAt&order=desc`,
    { next: { revalidate: 300 } },
  )
  return response.data
}

export const getTeamSquad = async (teamId: number, seasonId: number): Promise<SquadMember[]> => {
  const response = await apiFetch<ListResponse<SquadMember>>(
    `/api/v1/squad-memberships?teamId=${teamId}&seasonId=${seasonId}&pageSize=100`,
    { next: { revalidate: 300 } },
  )
  return response.data
}

export const getTeamCoaches = async (teamId: number, seasonId: number): Promise<TeamCoach[]> => {
  const response = await apiFetch<ListResponse<CoachApiPayload>>(
    `/api/v1/coaches?teamId=${teamId}&seasonId=${seasonId}&pageSize=20`,
    { next: { revalidate: 300 } },
  )
  return response.data.map((coach) => {
    const matchingAssignment = coach.assignments?.find(
      (assignment) => assignment.team?.id === teamId && assignment.season?.id === seasonId
    )
    return {
      id: coach.id,
      name: coach.name,
      imagePath: coach.imagePath,
      isCurrent: matchingAssignment?.season?.isCurrent ?? false,
    }
  })
}

export const getTeamVenue = async (teamId: number, seasonId: number): Promise<TeamVenue | null> => {
  const params = new URLSearchParams({
    teamId: String(teamId),
    seasonId: String(seasonId),
    limit: "5",
    sort: "kickoffAt",
    order: "desc",
  })
  const response = await apiFetch<ListResponse<TeamFixture>>(
    `/api/v1/fixtures?${params}`,
    { next: { revalidate: 86400 } },
  )
  return response.data.find((fixture) => fixture.venue !== null)?.venue ?? null
}
