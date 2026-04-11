import { apiFetch } from "@/lib/api"

interface DetailResponse<T> {
  data: T
}

interface LeagueSummary {
  id: number
  name: string
  shortCode: string | null
  imagePath: string | null
}

interface SeasonSummary {
  id: number
  name: string
  isCurrent: boolean
}

interface StageSummary {
  id: number
  name: string
  type: string | null
  isCurrent: boolean
}

interface RoundSummary {
  id: number
  name: string
  isCurrent: boolean
}

interface TeamSummary {
  id: number
  name: string
  shortCode: string | null
  imagePath: string | null
}

interface StandingContract {
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
  team: TeamSummary
}

interface DashboardFixtureSummary {
  id: number
  kickoffAt: string | null
  homeTeam: TeamSummary | null
  awayTeam: TeamSummary | null
  homeScore: number | null
  awayScore: number | null
  resultInfo: string | null
}

export interface DashboardOverview {
  league: LeagueSummary | null
  season: SeasonSummary | null
  currentStage: StageSummary | null
  currentRound: RoundSummary | null
  totalTeams: number
  totalPlayers: number
  totalFixtures: number
  completedFixtures: number
  upcomingFixtures: DashboardFixtureSummary[]
  recentResults: DashboardFixtureSummary[]
  standings: StandingContract[]
}

export const getDashboardOverview = async (): Promise<DashboardOverview> => {
  const response = await apiFetch<DetailResponse<DashboardOverview>>(
    "/api/v1/dashboard/overview"
  )

  return response.data
}
