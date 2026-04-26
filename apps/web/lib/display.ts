export const DASH = "—"
export const NO_DATA_LABEL = "No data"

export const displayInteger = (value: number | null | undefined): string =>
  value == null ? DASH : String(value)

export const displayMinutes = (value: number | null | undefined): string =>
  value == null ? DASH : new Intl.NumberFormat("en-GB").format(value)

export const displayRating = (value: number | null | undefined): string =>
  value == null || Number.isNaN(value) ? DASH : value.toFixed(2)

export const displayHeight = (cm: number | null | undefined): string =>
  cm == null ? DASH : `${cm} cm`

export const displayWeight = (kg: number | null | undefined): string =>
  kg == null ? DASH : `${kg} kg`

export const displayTeamLabel = (
  team: { name: string; shortCode: string | null } | null | undefined,
): string => {
  if (!team) return DASH
  return team.shortCode ?? team.name
}

export const displayAge = (
  dateOfBirth: string | null | undefined,
  now: Date = new Date(),
): string => {
  if (!dateOfBirth) return DASH
  const birth = new Date(dateOfBirth).getTime()
  if (Number.isNaN(birth)) return DASH
  const years = Math.floor((now.getTime() - birth) / (365.25 * 24 * 60 * 60 * 1000))
  return String(years)
}

export interface CareerRowDisplay {
  hasPlayed: boolean
  appearances: string
  goals: string
  assists: string
  minutes: string
  yellowCards: string
  redCards: string
  saves: string
  goalContributions: string
  avgRating: string
}

interface CareerRowAggregates {
  appearances: number
  avgRating: number | null
  totalMinutes: number | null
  goals: number
  assists: number
  saves: number
  yellowCards: number
  redCards: number
}

export const buildCareerRowDisplay = (
  aggregates: CareerRowAggregates | null,
): CareerRowDisplay => {
  const hasPlayed = aggregates !== null && aggregates.appearances > 0
  if (!hasPlayed || aggregates === null) {
    return {
      hasPlayed: false,
      appearances: DASH,
      goals: DASH,
      assists: DASH,
      minutes: DASH,
      yellowCards: DASH,
      redCards: DASH,
      saves: DASH,
      goalContributions: DASH,
      avgRating: DASH,
    }
  }
  return {
    hasPlayed: true,
    appearances: displayInteger(aggregates.appearances),
    goals: displayInteger(aggregates.goals),
    assists: displayInteger(aggregates.assists),
    minutes: displayMinutes(aggregates.totalMinutes),
    yellowCards: displayInteger(aggregates.yellowCards),
    redCards: displayInteger(aggregates.redCards),
    saves: displayInteger(aggregates.saves),
    goalContributions: displayInteger(aggregates.goals + aggregates.assists),
    avgRating: displayRating(aggregates.avgRating),
  }
}
