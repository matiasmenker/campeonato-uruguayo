"use client"

import { useState, useMemo, useEffect, useCallback } from "react"
import useEmblaCarousel from "embla-carousel-react"
import Link from "next/link"
import { IconBallFootball, IconChevronLeft, IconChevronRight, IconShield } from "@tabler/icons-react"
import { cn } from "@/lib/utils"
import HeroSelect from "@/components/hero-select"
import type { FixtureListItem } from "@/lib/matches"
import type { Season } from "@/lib/seasons"

// ---------------------------------------------------------------------------
// Hero background — same green palette as the matches page
// ---------------------------------------------------------------------------

const HeroBackground = () => (
  <svg className="absolute inset-0 h-full w-full" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice">
    <defs>
      <linearGradient id="matchesBase" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%"   stopColor="#062b12" />
        <stop offset="35%"  stopColor="#0a4020" />
        <stop offset="70%"  stopColor="#0e5628" />
        <stop offset="100%" stopColor="#0a3d1c" />
      </linearGradient>
      <radialGradient id="matchesGA" cx="78%" cy="18%" r="52%">
        <stop offset="0%" stopColor="#4ade80" stopOpacity="0.32" />
        <stop offset="100%" stopColor="#4ade80" stopOpacity="0" />
      </radialGradient>
      <radialGradient id="matchesGB" cx="18%" cy="75%" r="55%">
        <stop offset="0%" stopColor="#22c55e" stopOpacity="0.26" />
        <stop offset="100%" stopColor="#22c55e" stopOpacity="0" />
      </radialGradient>
      <radialGradient id="matchesGC" cx="50%" cy="45%" r="45%">
        <stop offset="0%" stopColor="#16a34a" stopOpacity="0.14" />
        <stop offset="100%" stopColor="#16a34a" stopOpacity="0" />
      </radialGradient>
      <pattern id="matchesDots" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
        <circle cx="10" cy="10" r="1" fill="rgba(134,239,172,0.14)" />
      </pattern>
    </defs>
    <rect width="100%" height="100%" fill="url(#matchesBase)" />
    <rect width="100%" height="100%" fill="url(#matchesGA)" />
    <rect width="100%" height="100%" fill="url(#matchesGB)" />
    <rect width="100%" height="100%" fill="url(#matchesGC)" />
    <rect width="100%" height="100%" fill="url(#matchesDots)" />
    <circle cx="-5%" cy="108%" r="62%" fill="none" stroke="rgba(74,222,128,0.1)" strokeWidth="1.5" />
    <circle cx="-5%" cy="108%" r="46%" fill="none" stroke="rgba(74,222,128,0.07)" strokeWidth="1" />
    <circle cx="106%" cy="-6%" r="46%" fill="none" stroke="rgba(134,239,172,0.08)" strokeWidth="1" />
  </svg>
)

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
      <article className="group relative h-[132px] overflow-hidden rounded-[18px] bg-slate-900 cursor-pointer">
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
        <div className="relative flex h-full flex-col justify-between p-3.5">
          <div className="flex justify-end">
            <span className="text-[10px] font-medium text-white/60">
              {formatMatchDay(fixture.kickoffAt)}
            </span>
          </div>

          <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2">
            <div className="flex min-w-0 items-center gap-2">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center">
                {fixture.homeTeam?.imagePath
                  ? <img src={fixture.homeTeam.imagePath} alt={fixture.homeTeam.name} className="h-7 w-7 object-contain drop-shadow-sm" />
                  : <IconShield className="h-7 w-7 text-white/80" />
                }
              </div>
              <p className="min-w-0 truncate text-[12px] font-semibold text-white">
                {fixture.homeTeam?.name ?? "Equipo"}
              </p>
            </div>

            <div className="flex min-w-[76px] flex-col items-center rounded-[14px] border border-white/10 bg-black/20 px-3 py-1.5 text-center backdrop-blur-sm">
              {showScore ? (
                <div className="flex items-center gap-2 text-white">
                  <span className="text-xl leading-none font-black tabular-nums">{fixture.homeScore ?? 0}</span>
                  <span className="text-xs leading-none font-medium text-white/35">—</span>
                  <span className="text-xl leading-none font-black tabular-nums">{fixture.awayScore ?? 0}</span>
                </div>
              ) : (
                <div className="text-xl leading-none font-black tracking-tight text-white">
                  {formatKickoffTime(fixture.kickoffAt)}
                </div>
              )}
            </div>

            <div className="flex min-w-0 flex-row-reverse items-center gap-2">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center">
                {fixture.awayTeam?.imagePath
                  ? <img src={fixture.awayTeam.imagePath} alt={fixture.awayTeam.name} className="h-7 w-7 object-contain drop-shadow-sm" />
                  : <IconShield className="h-7 w-7 text-white/80" />
                }
              </div>
              <p className="min-w-0 truncate text-right text-[12px] font-semibold text-white">
                {fixture.awayTeam?.name ?? "Equipo"}
              </p>
            </div>
          </div>

          <div>
            <div className={cn(
              "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 backdrop-blur-sm",
              badge.wrapperClass
            )}>
              <span className="relative flex h-1.5 w-1.5">
                {badge.isLive && (
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
                )}
                <span className={cn("relative inline-flex h-1.5 w-1.5 rounded-full", badge.dotClass)} />
              </span>
              <span className={cn("text-[10px] font-semibold", badge.textClass)}>
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
    // Outer card: position:relative so arrows can be absolute inside it.
    // No overflow-hidden here — only the embla viewport clips the pills.
    <div className="relative rounded-2xl border border-slate-200/80 bg-white shadow-sm">

      {/* Left arrow — frosted glass so pills scrolling behind are partially visible */}
      <button
        onClick={() => emblaApi?.scrollPrev()}
        disabled={!canScrollPrev}
        className={cn(
          "absolute top-1/2 left-3 z-20 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border border-slate-200/60 bg-white/60 text-slate-600 shadow-xs backdrop-blur-sm transition-[opacity,background-color] hover:bg-white/80 hover:text-slate-900",
          !canScrollPrev && "pointer-events-none opacity-30"
        )}
        aria-label="Fechas anteriores"
      >
        <IconChevronLeft size={15} />
      </button>

      {/* Right arrow — frosted glass */}
      <button
        onClick={() => emblaApi?.scrollNext()}
        disabled={!canScrollNext}
        className={cn(
          "absolute top-1/2 right-3 z-20 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border border-slate-200/60 bg-white/60 text-slate-600 shadow-xs backdrop-blur-sm transition-[opacity,background-color] hover:bg-white/80 hover:text-slate-900",
          !canScrollNext && "pointer-events-none opacity-30"
        )}
        aria-label="Fechas siguientes"
      >
        <IconChevronRight size={15} />
      </button>

      {/* Gradient fades — pointer-events-none so they don't block arrow clicks */}
      {canScrollPrev && (
        <div className="pointer-events-none absolute left-0 top-0 bottom-0 z-10 w-16 bg-gradient-to-r from-white via-white/70 to-transparent" />
      )}
      {canScrollNext && (
        <div className="pointer-events-none absolute right-0 top-0 bottom-0 z-10 w-16 bg-gradient-to-l from-white via-white/70 to-transparent" />
      )}

      {/* Embla viewport is inset mx-14 (56 px each side) so its overflow-hidden
          boundary sits 12 px past the arrow buttons (which end at ~44 px).
          Pills are clipped at the viewport edge — they can never reach the arrows. */}
      <div ref={emblaRef} className="mx-14 overflow-hidden py-3">
        <div className="flex -ml-2 px-2">
          {roundGroups.map(group => {
            const roundStatus = getRoundStatus(group.fixtures)
            const isActive    = group.round.id === effectiveRoundId
            return (
              <div key={group.round.id} className="flex-none pl-2">
                <button
                  onClick={() => onSelectRound(group.round.id)}
                  className={cn(
                    "cursor-pointer flex flex-col items-center gap-1 rounded-2xl border px-4 py-2.5 transition-all duration-150",
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

  const showSeasonSelector = seasons.length > 1
  const showStageSelector  = stages.length >= 1

  const selectedSeason = seasons.find(s => s.id === currentSeasonId) ?? null

  return (
    <div className="flex flex-col gap-6">

      {/* Hero — title + selectors */}
      <div className="overflow-hidden rounded-2xl shadow-lg">
        <div className="relative min-h-52 bg-slate-900">
          <HeroBackground />
          <div className="absolute inset-0 bg-gradient-to-b from-black/5 via-black/15 to-black/60" />

          <div className="absolute bottom-0 left-0 right-0 p-6">
            {/* Title */}
            <div className="mb-4 flex items-center gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-sm ring-1 ring-white/20">
                <IconBallFootball size={28} className="text-white/80" />
              </div>
              <div className="flex flex-col gap-0.5">
                <h1 className="text-3xl font-black text-white leading-none drop-shadow">Partidos</h1>
                <p className="text-sm text-white/65">
                  Primera División
                  {selectedSeason && (
                    <span className="font-semibold text-white/85"> · {selectedSeason.name}</span>
                  )}
                </p>
              </div>
            </div>

            {/* Selectors — side by side */}
            {(showSeasonSelector || showStageSelector) && (
              <div className="flex items-center gap-2">
                {showSeasonSelector && (
                  <HeroSelect
                    value={String(currentSeasonId ?? "")}
                    onValueChange={value => handleSeasonChange(Number(value))}
                    options={seasons}
                    disabled={isFetching}
                    openUp
                  />
                )}
                {showStageSelector && (
                  <HeroSelect
                    value={String(effectiveStageId ?? "")}
                    onValueChange={value => handleStageChange(Number(value))}
                    options={stages}
                    disabled={isFetching}
                    openUp
                  />
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3">

      {/* Round carousel */}
      {roundGroups.length > 0 && (
        <RoundSelector
          roundGroups={roundGroups}
          effectiveRoundId={effectiveRoundId}
          onSelectRound={handleRoundSelect}
        />
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
            <div className="px-5 py-10 text-center">
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
    </div>
  )
}

export default MatchesBrowser
