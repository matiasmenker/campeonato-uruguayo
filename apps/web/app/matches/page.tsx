import Link from "next/link"
import { IconBallFootball, IconShield, IconChevronLeft, IconChevronRight } from "@tabler/icons-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { getFixtures, type FixtureListItem, type Round } from "@/lib/matches"
import { getSeasons, type Season } from "@/lib/seasons"
import { cn } from "@/lib/utils"

export const dynamic = "force-dynamic"

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

const formatKickoffDate = (value: string | null) => {
  if (!value) return "Sin fecha"
  return new Intl.DateTimeFormat("es-UY", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    timeZone: "America/Montevideo",
  }).format(new Date(value))
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

interface RoundGroup {
  round: Round | null
  fixtures: FixtureListItem[]
}

const groupByRound = (fixtures: FixtureListItem[]): RoundGroup[] => {
  const map = new Map<number | null, RoundGroup>()
  for (const fixture of fixtures) {
    const roundId = fixture.round?.id ?? null
    if (!map.has(roundId)) {
      map.set(roundId, { round: fixture.round, fixtures: [] })
    }
    map.get(roundId)!.fixtures.push(fixture)
  }
  const groups = Array.from(map.values())
  return groups.sort((groupA, groupB) => {
    const nameA = groupA.round?.name ?? ""
    const nameB = groupB.round?.name ?? ""
    const numA = parseInt(nameA, 10)
    const numB = parseInt(nameB, 10)
    if (!isNaN(numA) && !isNaN(numB)) return numB - numA
    return nameB.localeCompare(nameA)
  })
}

interface MatchesPageProps {
  searchParams: Promise<{ seasonId?: string; roundId?: string }>
}

const MatchesPage = async ({ searchParams }: MatchesPageProps) => {
  const { seasonId: seasonIdParam, roundId: roundIdParam } = await searchParams

  const [seasonsResult, fixturesResult] = await Promise.allSettled([
    getSeasons(),
    getFixtures({
      seasonId: seasonIdParam ? Number(seasonIdParam) : undefined,
      roundId: roundIdParam ? Number(roundIdParam) : undefined,
      pageSize: 100,
    }),
  ])

  const seasons: Season[] = seasonsResult.status === "fulfilled" ? seasonsResult.value : []
  const currentSeason = seasons.find((season) => season.isCurrent) ?? seasons[0] ?? null
  const selectedSeasonId = seasonIdParam ? Number(seasonIdParam) : (currentSeason?.id ?? null)
  const selectedSeason = seasons.find((season) => season.id === selectedSeasonId) ?? currentSeason

  let fixtures: FixtureListItem[] = []
  let errorMessage: string | null = null

  if (fixturesResult.status === "fulfilled") {
    fixtures = fixturesResult.value.data
  } else {
    errorMessage = "No se pudieron cargar los partidos."
  }

  // If no season filter was applied but we resolved a current season, re-fetch filtered
  // (only if the initial fetch had no seasonId param)
  if (!seasonIdParam && selectedSeasonId && fixturesResult.status === "fulfilled") {
    const filtered = await getFixtures({
      seasonId: selectedSeasonId,
      roundId: roundIdParam ? Number(roundIdParam) : undefined,
      pageSize: 100,
    }).catch(() => null)
    if (filtered) fixtures = filtered.data
  }

  // Build round list from the full-season fixtures (without round filter) for the selector
  const allRounds: Round[] = []
  const seenRoundIds = new Set<number>()
  for (const fixture of fixtures) {
    if (fixture.round && !seenRoundIds.has(fixture.round.id)) {
      seenRoundIds.add(fixture.round.id)
      allRounds.push(fixture.round)
    }
  }
  allRounds.sort((roundA, roundB) => {
    const numA = parseInt(roundA.name, 10)
    const numB = parseInt(roundB.name, 10)
    if (!isNaN(numA) && !isNaN(numB)) return numB - numA
    return roundB.name.localeCompare(roundA.name)
  })

  const selectedRoundId = roundIdParam ? Number(roundIdParam) : null
  const filteredFixtures = selectedRoundId
    ? fixtures.filter((fixture) => fixture.round?.id === selectedRoundId)
    : fixtures

  const roundGroups = groupByRound(filteredFixtures)

  const buildUrl = (params: { seasonId?: number | null; roundId?: number | null }) => {
    const query = new URLSearchParams()
    const season = params.seasonId ?? selectedSeasonId
    const round = params.roundId !== undefined ? params.roundId : selectedRoundId
    if (season) query.set("seasonId", String(season))
    if (round) query.set("roundId", String(round))
    return `/matches?${query.toString()}`
  }

  // Pagination for rounds nav
  const currentRoundIndex = selectedRoundId
    ? allRounds.findIndex((round) => round.id === selectedRoundId)
    : -1
  const previousRound = currentRoundIndex > 0 ? allRounds[currentRoundIndex - 1] : null
  const nextRound = currentRoundIndex < allRounds.length - 1 ? allRounds[currentRoundIndex + 1] : null

  return (
    <main className="min-h-svh bg-[linear-gradient(180deg,#f8fafc_0%,#f8fafc_48%,#eef2f7_100%)]">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-6 py-8 sm:px-8 lg:px-10">

        {/* Hero */}
        <div className="overflow-hidden rounded-2xl shadow-lg">
          <div className="relative min-h-44 bg-slate-900">
            <HeroBackground />
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/60" />

            {/* Season selector — top right */}
            {seasons.length > 1 && (
              <div className="absolute right-5 top-5 flex items-center gap-2">
                {seasons.map((season) => (
                  <Link
                    key={season.id}
                    href={buildUrl({ seasonId: season.id, roundId: null })}
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

            {/* Title — bottom left */}
            <div className="absolute bottom-0 left-0 right-0 flex items-end gap-5 p-6">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-sm ring-1 ring-white/20">
                <IconBallFootball size={32} className="text-white/70" />
              </div>
              <div className="flex flex-col gap-1 pb-1">
                <h1 className="text-3xl font-black text-white leading-none drop-shadow">Partidos</h1>
                <p className="text-sm text-white/70">
                  Primera División
                  {selectedSeason ? (
                    <span className="font-semibold text-white/90"> · {selectedSeason.name}</span>
                  ) : null}
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
            {/* Round filter bar */}
            {allRounds.length > 0 && (
              <div className="flex items-center gap-2">
                {/* Prev round */}
                {previousRound ? (
                  <Link
                    href={buildUrl({ roundId: previousRound.id })}
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-xs transition hover:bg-slate-50 hover:shadow-sm"
                    aria-label="Fecha anterior"
                  >
                    <IconChevronLeft size={15} />
                  </Link>
                ) : (
                  <div className="h-8 w-8 shrink-0" />
                )}

                {/* Round chips — scrollable */}
                <div className="flex min-w-0 flex-1 gap-1.5 overflow-x-auto pb-0.5 scrollbar-none">
                  <Link
                    href={buildUrl({ roundId: null })}
                    className={cn(
                      "shrink-0 rounded-full border px-3 py-1 text-xs font-semibold transition-colors",
                      selectedRoundId === null
                        ? "border-slate-800 bg-slate-800 text-white"
                        : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-800"
                    )}
                  >
                    Todas
                  </Link>
                  {allRounds.map((round) => (
                    <Link
                      key={round.id}
                      href={buildUrl({ roundId: round.id })}
                      className={cn(
                        "shrink-0 rounded-full border px-3 py-1 text-xs font-semibold transition-colors",
                        round.id === selectedRoundId
                          ? "border-slate-800 bg-slate-800 text-white"
                          : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-800"
                      )}
                    >
                      Fecha {round.name}
                    </Link>
                  ))}
                </div>

                {/* Next round */}
                {nextRound ? (
                  <Link
                    href={buildUrl({ roundId: nextRound.id })}
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-xs transition hover:bg-slate-50 hover:shadow-sm"
                    aria-label="Siguiente fecha"
                  >
                    <IconChevronRight size={15} />
                  </Link>
                ) : (
                  <div className="h-8 w-8 shrink-0" />
                )}
              </div>
            )}

            {/* Match groups */}
            {filteredFixtures.length === 0 ? (
              <div className="flex h-36 items-center justify-center rounded-2xl border border-dashed border-slate-200 text-sm text-slate-400">
                No hay partidos disponibles
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {roundGroups.map((group) => (
                  <section key={group.round?.id ?? "no-round"}>
                    {/* Round header */}
                    <div className="mb-2 flex items-center justify-between px-1">
                      <h2 className="text-sm font-bold text-slate-700">
                        {group.round ? `Fecha ${group.round.name}` : "Sin fecha"}
                      </h2>
                      {group.fixtures[0]?.kickoffAt && (
                        <span className="text-xs capitalize text-slate-400">
                          {formatKickoffDate(group.fixtures[0].kickoffAt)}
                        </span>
                      )}
                    </div>

                    {/* Match list */}
                    <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
                      {group.fixtures.map((fixture) => (
                        <MatchRow key={fixture.id} fixture={fixture} />
                      ))}
                    </div>
                  </section>
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
