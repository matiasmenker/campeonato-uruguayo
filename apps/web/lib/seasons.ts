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

interface FixtureTeam {
  id: number
  name: string
  shortCode: string | null
  imagePath: string | null
}

interface ChampionshipFixture {
  homeScore: number | null
  awayScore: number | null
  resultInfo: string | null
  homeTeam: FixtureTeam
  awayTeam: FixtureTeam
}

export interface SeasonChampion {
  team: FixtureTeam
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

// Resolves the season champion from Championship Finals fixtures.
// Parses resultInfo ("{TeamName} won after ...") to find the decisive match winner.
// Falls back to aggregate score if resultInfo is unavailable.
export const getSeasonChampion = async (championshipFinalsStageId: number): Promise<SeasonChampion | null> => {
  const response = await apiFetch<ListResponse<ChampionshipFixture>>(
    `/api/v1/fixtures?stageId=${championshipFinalsStageId}&limit=20`
  )
  const fixtures = response.data
  if (fixtures.length === 0) return null

  // Try to find the winner from resultInfo: "{TeamName} won after ..."
  for (const fixture of fixtures) {
    if (!fixture.resultInfo) continue
    const match = fixture.resultInfo.match(/^(.+?) won after/i)
    if (!match) continue
    const winnerName = match[1].trim()
    if (fixture.homeTeam.name === winnerName) return { team: fixture.homeTeam }
    if (fixture.awayTeam.name === winnerName) return { team: fixture.awayTeam }
  }

  // Fallback: aggregate score across all legs
  const aggregates: Record<number, { team: FixtureTeam; goals: number }> = {}
  for (const fixture of fixtures) {
    const homeGoals = fixture.homeScore ?? 0
    const awayGoals = fixture.awayScore ?? 0
    const homeId = fixture.homeTeam.id
    const awayId = fixture.awayTeam.id
    if (!aggregates[homeId]) aggregates[homeId] = { team: fixture.homeTeam, goals: 0 }
    if (!aggregates[awayId]) aggregates[awayId] = { team: fixture.awayTeam, goals: 0 }
    aggregates[homeId].goals += homeGoals
    aggregates[awayId].goals += awayGoals
  }

  const sorted = Object.values(aggregates).sort((firstTeam, secondTeam) => secondTeam.goals - firstTeam.goals)
  return sorted[0] ? { team: sorted[0].team } : null
}
