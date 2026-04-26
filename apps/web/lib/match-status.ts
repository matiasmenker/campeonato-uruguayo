export const LIVE_STATES = new Set([
  "INPLAY_1ST_HALF",
  "INPLAY_2ND_HALF",
  "HT",
  "INPLAY_ET",
  "INPLAY_ET_SECOND_HALF",
  "INPLAY_PENALTIES",
  "EXTRA_TIME_BREAK",
  "BREAK",
])

export const FINISHED_STATES = new Set(["FT", "AET", "FT_PEN", "AWARDED"])

export type MatchStatus = "live" | "finished" | "upcoming"

export const getMatchStatus = (stateCode: string | null): MatchStatus => {
  if (stateCode && LIVE_STATES.has(stateCode)) return "live"
  if (stateCode && FINISHED_STATES.has(stateCode)) return "finished"
  return "upcoming"
}

export const getLiveLabel = (stateCode: string | null): string => {
  if (stateCode === "HT") return "Half time"
  if (stateCode === "INPLAY_ET" || stateCode === "INPLAY_ET_SECOND_HALF") return "Extra time"
  if (stateCode === "INPLAY_PENALTIES") return "Penalties"
  if (stateCode === "EXTRA_TIME_BREAK") return "Break"
  return "Live"
}

export const formatMatchDay = (value: string | null): string => {
  if (!value) return "No date"
  const formatted = new Intl.DateTimeFormat("en-GB", {
    weekday: "long",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "America/Montevideo",
  }).format(new Date(value))
  return formatted.charAt(0).toUpperCase() + formatted.slice(1)
}

export const formatKickoffTime = (value: string | null): string => {
  if (!value) return "--:--"
  return new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "America/Montevideo",
  }).format(new Date(value))
}
