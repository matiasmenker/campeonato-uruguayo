"use client"

import { useState, useMemo, useEffect, useCallback } from "react"
import useEmblaCarousel from "embla-carousel-react"
import Link from "next/link"
import { IconChevronLeft, IconChevronRight, IconShield } from "@tabler/icons-react"
import { cn } from "@/lib/utils"
import type { FixtureListItem } from "@/lib/matches"
import type { Season } from "@/lib/seasons"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface StageSummary {
  id: number
  name: string
  isCurrent: boolean
}

interface RoundSummary {
  id: number
  name: string
  isCurrent: boolean
}

interface RoundGroup {
  round: RoundSummary
  fixtures: FixtureListItem[]
}

// ---------------------------------------------------------------------------
// sessionStorage — persist season + stage + round so back button restores state
// ---------------------------------------------------------------------------

const SEASON_STORAGE_KEY = "matches:season"
const stageKey = (seasonId: number) => `matches:stage:${seasonId}`
const roundKey = (seasonId: number) => `matches:round:${seasonId}`

const storageGet = (key: string): number | null => {
  try {
    const raw = sessionStorage.getItem(key)
    return raw !== null ? Number(raw) : null
  } catch { return null }
}
const storageSet = (key: string, value: number) => {
  try { sessionStorage.setItem(key, String(value)) } catch {}
}
const storageDel = (key: string) => {
  try { sessionStorage.removeItem(key) } catch {}
}

// ---------------------------------------------------------------------------
// Status helpers
// ---------------------------------------------------------------------------

const LIVE_STATES = new Set([
  "INPLAY_1ST_HALF", "INPLAY_2ND_HALF", "HT", "INPLAY_ET",
  "INPLAY_ET_SECOND_HALF", "INPLAY_PENALTIES", "EXTRA_TIME_BREAK", "BREAK",
])
const FINISHED_STATES = new Set(["FT", "AET", "FT_PEN", "AWARDED"])

const getMatchStatus = (fixture: FixtureListItem) => {
  const code = fixture.state?.developerName ?? ""
  if (LIVE_STATES.has(code)) return "live" as const
  if (FINISHED_STATES.has(code)) return "finished" as const
  if (fixture.homeScore !== null && fixture.awayScore !== null) return "finished" as const
  return "upcoming" as const
}

const formatKickoffTime = (value: string | null) => {
  if (!value) return "--:--"
  return new Intl.DateTimeFormat("es-UY", {
    hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "America/Montevideo",
  }).format(new Date(value))
}

// "Domingo 24 de marzo" — same style as the home carousel
const formatRoundDate = (value: string | null) => {
  if (!value) return ""
  const formatted = new Intl.DateTimeFormat("es-UY", {
    weekday: "long", day: "numeric", month: "long", timeZone: "America/Montevideo",
  }).format(new Date(value))
  return formatted.charAt(0).toUpperCase() + formatted.slice(1)
}

const formatMatchDay = (value: string | null) => {
  if (!value) return "Sin fecha"
  const formatted = new Intl.DateTimeFormat("es-UY", {
    weekday: "long", day: "2-digit", month: "2-digit", year: "numeric", timeZone: "America/Montevideo",
  }).format(new Date(value))
  return formatted.charAt(0).toUpperCase() + formatted.slice(1)
}

const getLiveLabel = (code: string | null) => {
  if (code === "HT") return "Entretiempo"
  if (code === "INPLAY_ET" || code === "INPLAY_ET_SECOND_HALF") return "Prórroga"
  if (code === "INPLAY_PENALTIES") return "Penales"
  return "En vivo"
}

const getRoundStatus = (fixtures: FixtureListItem[]) => {
  const liveCount     = fixtures.filter(f => getMatchStatus(f) === "live").length
  const finishedCount = fixtures.filter(f => getMatchStatus(f) === "finished").length
  if (liveCount > 0) {
    return { label: "En vivo",    dotClass: "bg-red-500 animate-pulse", textClass: "text-red-500" }
  }
  if (finishedCount === fixtures.length && fixtures.length > 0) {
    return { label: "Finalizado", dotClass: "bg-emerald-500",           textClass: "text-emerald-600" }
  }
  if (finishedCount > 0) {
    return { label: "En curso",   dotClass: "bg-amber-400",             textClass: "text-amber-600" }
  }
  return              { label: "Por jugar", dotClass: "bg-slate-300",        textClass: "text-slate-400" }
}

// ---------------------------------------------------------------------------
// Match card — dark venue card, same aesthetic as the home carousel
// ---------------------------------------------------------------------------

const MatchCard = ({ fixture }: { fixture: FixtureListItem }) => {
  const status    = getMatchStatus(fixture)
  const showScore = status === "finished" || status === "live"
  const code      = fixture.state?.developerName ?? null
  const backgroundImage = fixture.venue?.imagePath ? `url("${fixture.venue.imagePath}")` : undefined

  const badge = (() => {
    if (status === "live") {
      return {
        isLive: true,
        dotClass: "bg-red-500",
        label: getLiveLabel(code),
        textClass: "text-red-200",
        wrapperClass: "border-red-400/20 bg-red-500/16 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]",
      }
    }
    if (status === "finished") {
      return {
        isLive: false,
        dotClass: "bg-emerald-400",
        label: "Finalizado",
        textClass: "text-emerald-100",
        wrapperClass: "border-emerald-400/20 bg-emerald-500/14 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]",
      }
    }
    // Time shown in score panel — badge says "Por jugar" to avoid repetition
    return {
      isLive: false,
      dotClass: "bg-white/40",
      label: "Por jugar",
      textClass: "text-white/75",
      wrapperClass: "border-white/12 bg-white/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]",
    }
  })()

  return (
    <Link href={`/matches/${fixture.id}`} className="block">
      <article className="group relative h-[172px] overflow-hidden rounded-[24px] bg-slate-900 cursor-pointer">
        <div
          className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-105"
          style={{ backgroundImage, backgroundColor: "#0f172a" }}
        />
        <div
          className="absolute inset-0"
          style={{
            background: backgroundImage
              ? "linear-gradient(145deg, rgba(2,6,23,0.84) 0%, rgba(15,23,42,0.54) 42%, rgba(6,95,70,0.42) 100%)"
              : "linear-gradient(145deg, #0f172a 0%, #123528 50%, #0b1b16 100%)",
          }}
        />
        <div className="relative flex h-full flex-col justify-between p-4">
          <div className="flex justify-end">
            <span className="text-[11px] font-medium text-white/60">
              {formatMatchDay(fixture.kickoffAt)}
            </span>
          </div>

          <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2">
            <div className="flex min-w-0 items-center gap-2.5">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center">
                {fixture.homeTeam?.imagePath
                  ? <img src={fixture.homeTeam.imagePath} alt={fixture.homeTeam.name} className="h-9 w-9 object-contain drop-shadow-sm" />
                  : <IconShield className="h-9 w-9 text-white/80" />
                }
              </div>
              <p className="min-w-0 truncate text-[13px] font-semibold text-white">
                {fixture.homeTeam?.name ?? "Equipo"}
              </p>
            </div>

            <div className="flex min-w-[88px] flex-col items-center rounded-[18px] border border-white/10 bg-black/20 px-4 py-2 text-center backdrop-blur-sm">
              {showScore ? (
                <div className="flex items-center gap-2.5 text-white">
                  <span className="text-2xl leading-none font-black tabular-nums">{fixture.homeScore ?? 0}</span>
                  <span className="text-sm leading-none font-medium text-white/35">—</span>
                  <span className="text-2xl leading-none font-black tabular-nums">{fixture.awayScore ?? 0}</span>
                </div>
              ) : (
                <div className="text-2xl leading-none font-black tracking-tight text-white">
                  {formatKickoffTime(fixture.kickoffAt)}
                </div>
              )}
            </div>

            <div className="flex min-w-0 flex-row-reverse items-center gap-2.5">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center">
                {fixture.awayTeam?.imagePath
                  ? <img src={fixture.awayTeam.imagePath} alt={fixture.awayTeam.name} className="h-9 w-9 object-contain drop-shadow-sm" />
                  : <IconShield className="h-9 w-9 text-white/80" />
                }
              </div>
              <p className="min-w-0 truncate text-right text-[13px] font-semibold text-white">
                {fixture.awayTeam?.name ?? "Equipo"}
              </p>
            </div>
          </div>

          <div>
            <div className={cn(
              "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 backdrop-blur-sm",
              badge.wrapperClass
            )}>
              <span className="relative flex h-2 w-2">
                {badge.isLive && (
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
                )}
                <span className={cn("relative inline-flex h-2 w-2 rounded-full", badge.dotClass)} />
              </span>
              <span className={cn("text-[11px] font-semibold", badge.textClass)}>
                {badge.label}
              </span>
            </div>
          </div>
        </div>
      </article>
    </Link>
  )
}

// ---------------------------------------------------------------------------
// Round carousel — Embla + outside arrows + gradient fades
// ---------------------------------------------------------------------------

interface RoundSelectorProps {
  roundGroups: RoundGroup[]
  effectiveRoundId: number | null
  onSelectRound: (id: number) => void
}

const RoundSelector = ({ roundGroups, effectiveRoundId, onSelectRound }: RoundSelectorProps) => {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: "center",
    dragFree: true,
    loop: false,
    containScroll: "keepSnaps",
  })

  const [canScrollPrev, setCanScrollPrev] = useState(false)
  const [canScrollNext, setCanScrollNext] = useState(false)

  useEffect(() => {
    if (!emblaApi) return
    const update = () => {
      setCanScrollPrev(emblaApi.canScrollPrev())
      setCanScrollNext(emblaApi.canScrollNext())
    }
    emblaApi.on("init", update)
    emblaApi.on("scroll", update)
    update()
    return () => { emblaApi.off("init", update).off("scroll", update) }
  }, [emblaApi])

  // Auto-scroll to the active pill whenever the selection changes
  useEffect(() => {
    if (!emblaApi || effectiveRoundId === null) return
    const index = roundGroups.findIndex(g => g.round.id === effectiveRoundId)
    if (index >= 0) emblaApi.scrollTo(index)
  }, [emblaApi, effectiveRoundId, roundGroups])

  return (
    <div className="relative">
      {/* Outside arrows — positioned identically to the home carousel */}
      <button
        onClick={() => emblaApi?.scrollPrev()}
        disabled={!canScrollPrev}
        className={cn(
          "absolute top-1/2 left-0 z-20 hidden h-8 w-8 -translate-x-[calc(100%+10px)] -translate-y-1/2 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-xs transition-[opacity,box-shadow,background-color] hover:bg-slate-50 hover:text-slate-900 hover:shadow-sm sm:flex",
          !canScrollPrev && "pointer-events-none opacity-30"
        )}
        aria-label="Fechas anteriores"
      >
        <IconChevronLeft size={15} />
      </button>

      <button
        onClick={() => emblaApi?.scrollNext()}
        disabled={!canScrollNext}
        className={cn(
          "absolute top-1/2 right-0 z-20 hidden h-8 w-8 -translate-y-1/2 translate-x-[calc(100%+10px)] items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-xs transition-[opacity,box-shadow,background-color] hover:bg-slate-50 hover:text-slate-900 hover:shadow-sm sm:flex",
          !canScrollNext && "pointer-events-none opacity-30"
        )}
        aria-label="Fechas siguientes"
      >
        <IconChevronRight size={15} />
      </button>

      {/* Gradient fades — from-white because the card background is white */}
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-10 bg-gradient-to-r from-white to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-10 bg-gradient-to-l from-white to-transparent" />

      <div ref={emblaRef} className="overflow-hidden">
        <div className="flex -ml-2 px-5">
          {roundGroups.map(group => {
            const roundStatus = getRoundStatus(group.fixtures)
            const isActive    = group.round.id === effectiveRoundId
            return (
              <div key={group.round.id} className="flex-none pl-2">
                <button
                  onClick={() => onSelectRound(group.round.id)}
                  className={cn(
                    "flex flex-col items-center gap-1 rounded-2xl border px-4 py-2.5 transition-all duration-150",
                    isActive
                      ? "border-slate-900 bg-slate-900 shadow-md"
                      : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                  )}
                >
                  <span className={cn(
                    "whitespace-nowrap text-xs font-black",
                    isActive ? "text-white" : "text-slate-800"
                  )}>
                    Fecha {group.round.name}
                  </span>
                  <div className="flex items-center gap-1">
                    <span className={cn("h-1.5 w-1.5 rounded-full", roundStatus.dotClass)} />
                    <span className={cn(
                      "whitespace-nowrap text-[10px] font-semibold",
                      isActive ? "text-white/65" : roundStatus.textClass
                    )}>
                      {roundStatus.label}
                    </span>
                  </div>
                </button>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const buildRoundGroups = (fixtures: FixtureListItem[]): RoundGroup[] => {
  const map = new Map<number, RoundGroup>()
  for (const fixture of fixtures) {
    if (!fixture.round) continue
    const existing = map.get(fixture.round.id)
    if (existing) {
      existing.fixtures.push(fixture)
    } else {
      map.set(fixture.round.id, { round: fixture.round, fixtures: [fixture] })
    }
  }
  return Array.from(map.values()).sort((a, b) => {
    const numA = parseInt(a.round.name, 10)
    const numB = parseInt(b.round.name, 10)
    if (!isNaN(numA) && !isNaN(numB)) return numA - numB
    return a.round.name.localeCompare(b.round.name)
  })
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

interface MatchesBrowserProps {
  seasons: Season[]
  initialSeasonId: number | null
  initialFixtures: FixtureListItem[]
}

const MatchesBrowser = ({ seasons, initialSeasonId, initialFixtures }: MatchesBrowserProps) => {
  // Season + fixtures are managed entirely client-side to survive navigation.
  // On mount we restore from sessionStorage; if the saved season differs from the
  // server-provided initial, we fetch the correct fixtures via /api/fixtures.
  // This guarantees pressing browser back always returns to the last selected season.
  const [currentSeasonId, setCurrentSeasonId] = useState<number | null>(initialSeasonId)
  const [currentFixtures, setCurrentFixtures] = useState<FixtureListItem[]>(initialFixtures)
  const [isFetching, setIsFetching] = useState(false)
  const [selectedStageId, setSelectedStageId] = useState<number | null>(null)
  const [selectedRoundId, setSelectedRoundId] = useState<number | null>(null)

  useEffect(() => {
    const savedSeasonId = storageGet(SEASON_STORAGE_KEY)
    const targetSeasonId =
      savedSeasonId !== null && seasons.some(s => s.id === savedSeasonId)
        ? savedSeasonId
        : initialSeasonId

    if (targetSeasonId !== null) {
      const savedStage = storageGet(stageKey(targetSeasonId))
      const savedRound = storageGet(roundKey(targetSeasonId))
      if (savedStage !== null) setSelectedStageId(savedStage)
      if (savedRound !== null) setSelectedRoundId(savedRound)

      if (targetSeasonId !== initialSeasonId) {
        setCurrentSeasonId(targetSeasonId)
        setIsFetching(true)
        fetch(`/api/fixtures?seasonId=${targetSeasonId}`)
          .then(r => r.json())
          .then((data: FixtureListItem[]) => setCurrentFixtures(data))
          .catch(() => {})
          .finally(() => setIsFetching(false))
      }

      // Always persist so the next mount can restore it
      storageSet(SEASON_STORAGE_KEY, targetSeasonId)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleSeasonChange = useCallback(async (seasonId: number) => {
    if (seasonId === currentSeasonId) return
    setCurrentSeasonId(seasonId)
    storageSet(SEASON_STORAGE_KEY, seasonId)

    // Restore stored stage/round for this season (or reset to null so defaults apply)
    const savedStage = storageGet(stageKey(seasonId))
    const savedRound = storageGet(roundKey(seasonId))
    setSelectedStageId(savedStage)
    setSelectedRoundId(savedRound)

    setIsFetching(true)
    try {
      const response = await fetch(`/api/fixtures?seasonId=${seasonId}`)
      const data: FixtureListItem[] = await response.json()
      setCurrentFixtures(data)
    } catch {
      // Keep current fixtures on error
    } finally {
      setIsFetching(false)
    }
  }, [currentSeasonId])

  // Derive valid stages — filter stages with fewer than 5 fixtures (playoffs, finals, etc.)
  const stages = useMemo<StageSummary[]>(() => {
    const stageMap   = new Map<number, StageSummary>()
    const roundCount = new Map<number, number>()
    for (const fixture of currentFixtures) {
      if (!fixture.stage) continue
      if (!stageMap.has(fixture.stage.id)) stageMap.set(fixture.stage.id, fixture.stage)
      if (fixture.round) roundCount.set(fixture.stage.id, (roundCount.get(fixture.stage.id) ?? 0) + 1)
    }
    return Array.from(stageMap.values())
      .filter(stage => (roundCount.get(stage.id) ?? 0) >= 5)
      .sort((a, b) => a.id - b.id)
  }, [currentFixtures])

  // Resolve pattern: if stored selection is no longer valid, fall back gracefully
  const defaultStageId   = stages.find(s => s.isCurrent)?.id ?? stages[0]?.id ?? null
  const effectiveStageId = stages.some(s => s.id === selectedStageId) ? selectedStageId : defaultStageId

  const stageFixtures = useMemo(
    () => effectiveStageId ? currentFixtures.filter(f => f.stage?.id === effectiveStageId) : currentFixtures,
    [currentFixtures, effectiveStageId]
  )

  const roundGroups = useMemo(() => buildRoundGroups(stageFixtures), [stageFixtures])

  const defaultRoundId =
    roundGroups.find(g => g.round.isCurrent)?.round.id ??
    roundGroups[roundGroups.length - 1]?.round.id ??
    null
  const effectiveRoundId = roundGroups.some(g => g.round.id === selectedRoundId)
    ? selectedRoundId
    : defaultRoundId

  const activeGroup  = roundGroups.find(g => g.round.id === effectiveRoundId) ?? null
  const activeIndex  = roundGroups.findIndex(g => g.round.id === effectiveRoundId)
  const roundStatus  = activeGroup ? getRoundStatus(activeGroup.fixtures) : null
  const firstKickoff = activeGroup?.fixtures.find(f => f.kickoffAt)?.kickoffAt ?? null

  const handleStageChange = (stageId: number) => {
    setSelectedStageId(stageId)
    setSelectedRoundId(null)
    if (currentSeasonId !== null) {
      storageSet(stageKey(currentSeasonId), stageId)
      storageDel(roundKey(currentSeasonId))
    }
  }

  const handleRoundSelect = (roundId: number) => {
    setSelectedRoundId(roundId)
    if (currentSeasonId !== null) {
      storageSet(roundKey(currentSeasonId), roundId)
    }
  }

  const goToPrev = () => {
    const previousId = roundGroups[activeIndex - 1]?.round.id
    if (previousId !== undefined) handleRoundSelect(previousId)
  }
  const goToNext = () => {
    const nextId = roundGroups[activeIndex + 1]?.round.id
    if (nextId !== undefined) handleRoundSelect(nextId)
  }

  const showSeasonSelector = seasons.length > 1
  const showStageSelector  = stages.length >= 1

  return (
    <div className="flex flex-col gap-4">

      {/* Season + stage selectors — floating outside the card */}
      {(showSeasonSelector || showStageSelector) && (
        <div className="flex flex-wrap items-center justify-between gap-3">
          {showSeasonSelector && (
            <div className="flex gap-1.5">
              {seasons.map(season => (
                <button
                  key={season.id}
                  onClick={() => handleSeasonChange(season.id)}
                  disabled={isFetching}
                  className={cn(
                    "rounded-full border px-3.5 py-1.5 text-xs font-bold transition-colors disabled:opacity-60",
                    season.id === currentSeasonId
                      ? "border-slate-800 bg-slate-800 text-white"
                      : "border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:text-slate-800"
                  )}
                >
                  {season.name}
                </button>
              ))}
            </div>
          )}

          {showStageSelector && (
            <div className="flex gap-1.5">
              {stages.map(stage => (
                <button
                  key={stage.id}
                  onClick={() => handleStageChange(stage.id)}
                  className={cn(
                    "rounded-full border px-3.5 py-1.5 text-xs font-bold transition-colors",
                    stage.id === effectiveStageId
                      ? "border-slate-800 bg-slate-800 text-white"
                      : "border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:text-slate-800"
                  )}
                >
                  {stage.name}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Round carousel — standalone card, separated from the round content */}
      {roundGroups.length > 0 && (
        <div className="rounded-2xl border border-slate-200/80 bg-white py-4 shadow-sm">
          <RoundSelector
            roundGroups={roundGroups}
            effectiveRoundId={effectiveRoundId}
            onSelectRound={handleRoundSelect}
          />
        </div>
      )}

      {/* Round header + cards — own card, no overflow-hidden for outside arrows */}
      <div className="rounded-2xl border border-slate-200/80 bg-white shadow-sm">
        {activeGroup === null ? (
          <div className="flex h-36 items-center justify-center text-sm text-slate-400">
            No hay partidos disponibles
          </div>
        ) : (
          <>
            {/* Round header — centred title + date + status */}
            <div className="px-5 py-10">
              <div className="flex items-center gap-4">
                <button
                  onClick={goToPrev}
                  disabled={activeIndex === 0}
                  aria-label="Fecha anterior"
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 shadow-xs transition-colors hover:bg-slate-50 disabled:pointer-events-none disabled:opacity-30"
                >
                  <IconChevronLeft size={16} />
                </button>

                <div className="flex-1 text-center">
                  <h2 className="text-2xl font-black leading-tight text-slate-900">
                    Fecha {activeGroup.round.name}
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    {formatRoundDate(firstKickoff)}
                  </p>
                  {roundStatus && (
                    <div className="mt-2 flex items-center justify-center gap-1.5">
                      <span className={cn("h-1.5 w-1.5 rounded-full", roundStatus.dotClass)} />
                      <span className={cn("text-xs font-semibold", roundStatus.textClass)}>
                        {roundStatus.label}
                      </span>
                    </div>
                  )}
                </div>

                <button
                  onClick={goToNext}
                  disabled={activeIndex === roundGroups.length - 1}
                  aria-label="Siguiente fecha"
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 shadow-xs transition-colors hover:bg-slate-50 disabled:pointer-events-none disabled:opacity-30"
                >
                  <IconChevronRight size={16} />
                </button>
              </div>
            </div>

            {/* Cards grid */}
            <div className="grid grid-cols-1 gap-3 px-5 pb-5 sm:grid-cols-2">
              {activeGroup.fixtures.map(fixture => (
                <MatchCard key={fixture.id} fixture={fixture} />
              ))}
            </div>
          </>
        )}
      </div>

    </div>
  )
}

export default MatchesBrowser
