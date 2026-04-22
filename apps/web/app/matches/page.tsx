import Link from "next/link"
import { IconBallFootball, IconShield, IconChevronLeft, IconChevronRight } from "@tabler/icons-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { getFixtures, type FixtureListItem, type Round } from "@/lib/matches"
import { getSeasons, type Season } from "@/lib/seasons"
import { cn } from "@/lib/utils"

export const dynamic = "force-dynamic"

interface StageSummary {
  id: number
  name: string
  isCurrent: boolean
}

const LIVE_STATES = new Set([
  "INPLAY_1ST_HALF",
  "INPLAY_2ND_HALF",
  "HT",
  "INPLAY_ET",
  "INPLAY_ET_SECOND_HALF",
  "INPLAY_PENALTIES",
  "EXTRA_TIME_BREAK",
  "BREAK",
])

const FINISHED_STATES = new Set(["FT", "AET", "FT_PEN", "AWARDED"])

const getMatchStatus = (fixture: FixtureListItem) => {
  const stateCode = fixture.state?.developerName ?? ""
  if (LIVE_STATES.has(stateCode)) return "live" as const
  if (FINISHED_STATES.has(stateCode)) return "finished" as const
  if (fixture.homeScore !== null && fixture.awayScore !== null) return "finished" as const
  return "upcoming" as const
}

const formatKickoffTime = (value: string | null) => {
  if (!value) return "--:--"
  return new Intl.DateTimeFormat("es-UY", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "America/Montevideo",
  }).format(new Date(value))
}

const formatKickoffDateShort = (value: string | null) => {
  if (!value) return ""
  return new Intl.DateTimeFormat("es-UY", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    timeZone: "America/Montevideo",
  }).format(new Date(value))
}

const HeroBackground = () => (
  <svg className="absolute inset-0 h-full w-full" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice">
    <defs>
      <linearGradient id="matchesBase" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#0a1628" />
        <stop offset="40%" stopColor="#0d2a1a" />
        <stop offset="75%" stopColor="#0f4a2a" />
        <stop offset="100%" stopColor="#0a3320" />
      </linearGradient>
      <radialGradient id="matchesGA" cx="80%" cy="15%" r="45%">
        <stop offset="0%" stopColor="#22c55e" stopOpacity="0.18" />
        <stop offset="100%" stopColor="#22c55e" stopOpacity="0" />
      </radialGradient>
      <radialGradient id="matchesGB" cx="20%" cy="70%" r="50%">
        <stop offset="0%" stopColor="#16a34a" stopOpacity="0.12" />
        <stop offset="100%" stopColor="#16a34a" stopOpacity="0" />
      </radialGradient>
      <pattern id="matchesDots" x="0" y="0" width="18" height="18" patternUnits="userSpaceOnUse">
        <circle cx="9" cy="9" r="0.8" fill="rgba(134,239,172,0.08)" />
      </pattern>
    </defs>
    <rect width="100%" height="100%" fill="url(#matchesBase)" />
    <rect width="100%" height="100%" fill="url(#matchesGA)" />
    <rect width="100%" height="100%" fill="url(#matchesGB)" />
    <rect width="100%" height="100%" fill="url(#matchesDots)" />
    <circle cx="-5%" cy="110%" r="65%" fill="none" stroke="rgba(34,197,94,0.07)" strokeWidth="1.5" />
    <circle cx="-5%" cy="110%" r="48%" fill="none" stroke="rgba(34,197,94,0.05)" strokeWidth="1" />
    <circle cx="108%" cy="-8%" r="48%" fill="none" stroke="rgba(134,239,172,0.06)" strokeWidth="1" />
  </svg>
)

const StatusPill = ({ fixture }: { fixture: FixtureListItem }) => {
  const status = getMatchStatus(fixture)
  const stateCode = fixture.state?.developerName ?? null

  if (status === "live") {
    const label =
      stateCode === "HT" ? "Entretiempo"
      : stateCode === "INPLAY_ET" || stateCode === "INPLAY_ET_SECOND_HALF" ? "Prórroga"
      : stateCode === "INPLAY_PENALTIES" ? "Penales"
      : "En vivo"
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-red-200 bg-red-50 px-2.5 py-1 text-[11px] font-semibold text-red-600">
        <span className="relative flex h-1.5 w-1.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-red-500" />
        </span>
        {label}
      </span>
    )
  }

  if (status === "finished") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
        Finalizado
      </span>
    )
  }

  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-semibold text-slate-500">
      <span className="h-1.5 w-1.5 rounded-full bg-slate-300" />
      {formatKickoffTime(fixture.kickoffAt)}
    </span>
  )
}

const TeamCell = ({ team, align }: { team: FixtureListItem["homeTeam"]; align: "left" | "right" }) => {
  const name = team?.name ?? "Equipo"
  const imagePath = team?.imagePath ?? null
  return (
    <div className={cn("flex min-w-0 flex-1 items-center gap-2.5", align === "right" && "flex-row-reverse")}>
      <div className="flex h-10 w-10 shrink-0 items-center justify-center">
        {imagePath ? (
          <img src={imagePath} alt={name} className="h-8 w-8 object-contain" />
        ) : (
          <IconShield size={24} className="text-slate-300" />
        )}
      </div>
      <p className={cn("min-w-0 truncate text-sm font-semibold text-slate-800", align === "right" && "text-right")}>
        {name}
      </p>
    </div>
  )
}

const MatchRow = ({ fixture }: { fixture: FixtureListItem }) => {
  const status = getMatchStatus(fixture)
  const showScore = status === "finished" || status === "live"

  return (
    <Link
      href={`/matches/${fixture.id}`}
      className="group flex items-center gap-3 border-b border-slate-100 px-4 py-3 transition-colors last:border-0 hover:bg-slate-50 sm:px-5"
    >
      <TeamCell team={fixture.homeTeam} align="left" />

      <div className="flex w-36 shrink-0 flex-col items-center gap-1 sm:w-44">
        {showScore ? (
          <div className="flex items-center gap-2 text-slate-900">
            <span className="text-xl font-black tabular-nums">{fixture.homeScore ?? 0}</span>
            <span className="text-sm font-medium text-slate-300">–</span>
            <span className="text-xl font-black tabular-nums">{fixture.awayScore ?? 0}</span>
          </div>
        ) : (
          <div className="text-base font-black tracking-tight text-slate-700">
            {formatKickoffTime(fixture.kickoffAt)}
          </div>
        )}
        <StatusPill fixture={fixture} />
      </div>

      <TeamCell team={fixture.awayTeam} align="right" />
    </Link>
  )
}

interface MatchesPageProps {
  searchParams: Promise<{ seasonId?: string; stageId?: string; roundId?: string }>
}

const MatchesPage = async ({ searchParams }: MatchesPageProps) => {
  const { seasonId: seasonIdParam, stageId: stageIdParam, roundId: roundIdParam } = await searchParams

  const [seasonsResult, fixturesResult] = await Promise.allSettled([
    getSeasons(),
    getFixtures({
      seasonId: seasonIdParam ? Number(seasonIdParam) : undefined,
      pageSize: 200,
    }),
  ])

  const seasons: Season[] = seasonsResult.status === "fulfilled" ? seasonsResult.value : []
  const currentSeason = seasons.find((season) => season.isCurrent) ?? seasons[0] ?? null
  const selectedSeasonId = seasonIdParam ? Number(seasonIdParam) : (currentSeason?.id ?? null)
  const selectedSeason = seasons.find((season) => season.id === selectedSeasonId) ?? currentSeason

  let allFixtures: FixtureListItem[] = []
  let errorMessage: string | null = null

  if (fixturesResult.status === "fulfilled") {
    allFixtures = fixturesResult.value.data
  } else {
    errorMessage = "No se pudieron cargar los partidos."
  }

  if (!seasonIdParam && selectedSeasonId && fixturesResult.status === "fulfilled") {
    const refetched = await getFixtures({ seasonId: selectedSeasonId, pageSize: 200 }).catch(() => null)
    if (refetched) allFixtures = refetched.data
  }

  // Extract stages from fixtures
  const stageMap = new Map<number, StageSummary>()
  for (const fixture of allFixtures) {
    if (fixture.stage && !stageMap.has(fixture.stage.id)) {
      stageMap.set(fixture.stage.id, fixture.stage)
    }
  }
  const stages = Array.from(stageMap.values()).sort((stageA, stageB) => stageA.id - stageB.id)
  const currentStage = stages.find((stage) => stage.isCurrent) ?? stages[stages.length - 1] ?? null
  const selectedStageId = stageIdParam ? Number(stageIdParam) : (currentStage?.id ?? null)
  const selectedStage = stages.find((stage) => stage.id === selectedStageId) ?? currentStage

  // Fixtures for the selected stage
  const stageFixtures = selectedStageId
    ? allFixtures.filter((fixture) => fixture.stage?.id === selectedStageId)
    : allFixtures

  // Extract rounds for this stage
  const roundMap = new Map<number, Round>()
  for (const fixture of stageFixtures) {
    if (fixture.round && !roundMap.has(fixture.round.id)) {
      roundMap.set(fixture.round.id, fixture.round)
    }
  }
  const rounds = Array.from(roundMap.values()).sort((roundA, roundB) => {
    const numA = parseInt(roundA.name, 10)
    const numB = parseInt(roundB.name, 10)
    if (!isNaN(numA) && !isNaN(numB)) return numA - numB
    return roundA.name.localeCompare(roundB.name)
  })

  const currentRound = rounds.find((round) => round.isCurrent) ?? rounds[rounds.length - 1] ?? null
  const selectedRoundId = roundIdParam ? Number(roundIdParam) : (currentRound?.id ?? null)
  const selectedRound = rounds.find((round) => round.id === selectedRoundId) ?? currentRound

  const roundIndex = rounds.findIndex((round) => round.id === selectedRoundId)
  const previousRound = roundIndex > 0 ? rounds[roundIndex - 1] : null
  const nextRound = roundIndex < rounds.length - 1 ? rounds[roundIndex + 1] : null

  const displayFixtures = selectedRoundId
    ? stageFixtures.filter((fixture) => fixture.round?.id === selectedRoundId)
    : stageFixtures

  const buildUrl = (params: { seasonId?: number | null; stageId?: number | null; roundId?: number | null }) => {
    const query = new URLSearchParams()
    const season = params.seasonId !== undefined ? params.seasonId : selectedSeasonId
    const stage = params.stageId !== undefined ? params.stageId : selectedStageId
    const round = params.roundId !== undefined ? params.roundId : null
    if (season) query.set("seasonId", String(season))
    if (stage) query.set("stageId", String(stage))
    if (round) query.set("roundId", String(round))
    return `/matches?${query.toString()}`
  }

  // Group display fixtures by date for the header
  const firstKickoff = displayFixtures.find((fixture) => fixture.kickoffAt)?.kickoffAt ?? null

  return (
    <main className="min-h-svh bg-[linear-gradient(180deg,#f8fafc_0%,#f8fafc_48%,#eef2f7_100%)]">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-6 py-8 sm:px-8 lg:px-10">

        {/* Hero */}
        <div className="overflow-hidden rounded-2xl shadow-lg">
          <div className="relative min-h-44 bg-slate-900">
            <HeroBackground />
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/60" />

            {seasons.length > 1 && (
              <div className="absolute right-5 top-5 flex items-center gap-2">
                {seasons.map((season) => (
                  <Link
                    key={season.id}
                    href={buildUrl({ seasonId: season.id, stageId: null, roundId: null })}
                    className={cn(
                      "rounded-xl px-3 py-1.5 text-xs font-semibold transition-colors",
                      season.id === selectedSeasonId
                        ? "bg-white/20 text-white backdrop-blur-sm"
                        : "text-white/60 hover:text-white/90"
                    )}
                  >
                    {season.name}
                  </Link>
                ))}
              </div>
            )}

            <div className="absolute bottom-0 left-0 right-0 flex items-end gap-5 p-6">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-sm ring-1 ring-white/20">
                <IconBallFootball size={32} className="text-white/70" />
              </div>
              <div className="flex flex-col gap-1 pb-1">
                <h1 className="text-3xl font-black text-white leading-none drop-shadow">Partidos</h1>
                <p className="text-sm text-white/70">
                  Primera División
                  {selectedSeason ? <span className="font-semibold text-white/90"> · {selectedSeason.name}</span> : null}
                </p>
              </div>
            </div>
          </div>
        </div>

        {errorMessage ? (
          <Alert className="border-amber-300 bg-amber-50 text-amber-950">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{errorMessage}</AlertDescription>
          </Alert>
        ) : (
          <>
            {/* Stage tabs */}
            {stages.length > 1 && (
              <div className="flex gap-1 rounded-2xl border border-slate-200/80 bg-white p-1 shadow-sm">
                {stages.map((stage) => (
                  <Link
                    key={stage.id}
                    href={buildUrl({ stageId: stage.id, roundId: null })}
                    className={cn(
                      "flex-1 rounded-xl py-2 text-center text-sm font-semibold transition-colors",
                      stage.id === selectedStageId
                        ? "bg-slate-900 text-white shadow-sm"
                        : "text-slate-500 hover:text-slate-800"
                    )}
                  >
                    {stage.name}
                  </Link>
                ))}
              </div>
            )}

            {/* Round navigator */}
            {rounds.length > 0 && (
              <div className="flex items-center gap-3">
                <Link
                  href={previousRound ? buildUrl({ roundId: previousRound.id }) : "#"}
                  aria-disabled={!previousRound}
                  className={cn(
                    "flex h-9 w-9 shrink-0 items-center justify-center rounded-full border bg-white shadow-xs transition",
                    previousRound
                      ? "border-slate-200 text-slate-600 hover:bg-slate-50 hover:shadow-sm"
                      : "pointer-events-none border-slate-100 text-slate-200"
                  )}
                >
                  <IconChevronLeft size={16} />
                </Link>

                <div className="flex flex-1 flex-col items-center gap-0.5">
                  <span className="text-base font-black text-slate-900">
                    {selectedRound ? `Fecha ${selectedRound.name}` : "Sin fecha"}
                  </span>
                  {firstKickoff && (
                    <span className="text-xs capitalize text-slate-400">
                      {formatKickoffDateShort(firstKickoff)}
                    </span>
                  )}
                </div>

                <Link
                  href={nextRound ? buildUrl({ roundId: nextRound.id }) : "#"}
                  aria-disabled={!nextRound}
                  className={cn(
                    "flex h-9 w-9 shrink-0 items-center justify-center rounded-full border bg-white shadow-xs transition",
                    nextRound
                      ? "border-slate-200 text-slate-600 hover:bg-slate-50 hover:shadow-sm"
                      : "pointer-events-none border-slate-100 text-slate-200"
                  )}
                >
                  <IconChevronRight size={16} />
                </Link>
              </div>
            )}

            {/* Match list */}
            {displayFixtures.length === 0 ? (
              <div className="flex h-36 items-center justify-center rounded-2xl border border-dashed border-slate-200 text-sm text-slate-400">
                No hay partidos disponibles
              </div>
            ) : (
              <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
                {displayFixtures.map((fixture) => (
                  <MatchRow key={fixture.id} fixture={fixture} />
                ))}
              </div>
            )}
          </>
        )}

      </div>
    </main>
  )
}

export default MatchesPage
