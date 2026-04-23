"use client"

import { useState, useMemo, useEffect, useCallback } from "react"
import useEmblaCarousel from "embla-carousel-react"
import { IconBallFootball, IconChevronLeft, IconChevronRight } from "@tabler/icons-react"
import { cn } from "@/lib/utils"
import HeroSelect from "@/components/hero-select"
import HeroTexture from "@/components/hero-texture"
import MatchCard from "@/components/match-card"
import { getMatchStatus } from "@/components/match-card"
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

const getRoundStatus = (fixtures: FixtureListItem[]) => {
  const liveCount     = fixtures.filter(f => getMatchStatus(f.state?.developerName ?? null, f.homeScore, f.awayScore) === "live").length
  const finishedCount = fixtures.filter(f => getMatchStatus(f.state?.developerName ?? null, f.homeScore, f.awayScore) === "finished").length
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
    <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">

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

  const activeGroup = roundGroups.find(g => g.round.id === effectiveRoundId) ?? null

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

      {/* Hero — title bottom-left, selectors top-right */}
      <div className="overflow-hidden rounded-2xl shadow-lg">
        <div className="relative min-h-52 bg-slate-900">
          <HeroTexture />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/5 to-black/40 pointer-events-none" />

          {/* Bottom — title left, selectors right */}
          <div className="absolute bottom-0 left-0 right-0 flex items-end justify-between gap-4 p-6">
            <div className="flex items-center gap-4">
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

            {(showSeasonSelector || showStageSelector) && (
              <div className="flex shrink-0 items-center gap-2">
                {showSeasonSelector && (
                  <HeroSelect
                    value={String(currentSeasonId ?? "")}
                    onValueChange={value => handleSeasonChange(Number(value))}
                    options={seasons}
                    isLoading={isFetching}
                    openUp
                  />
                )}
                {showStageSelector && (
                  <HeroSelect
                    value={String(effectiveStageId ?? "")}
                    onValueChange={value => handleStageChange(Number(value))}
                    options={stages}
                    isLoading={isFetching}
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
      {isFetching ? (
        <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
          <div className="flex items-center gap-2 px-14 py-3">
            {[...Array(10)].map((_, i) => (
              <div key={i} className="flex shrink-0 flex-col items-center gap-1.5 rounded-2xl border border-slate-100 px-4 py-2.5">
                <div className="h-3 w-12 animate-pulse rounded bg-slate-200" />
                <div className="h-2.5 w-10 animate-pulse rounded bg-slate-100" />
              </div>
            ))}
          </div>
        </div>
      ) : roundGroups.length > 0 ? (
        <RoundSelector
          roundGroups={roundGroups}
          effectiveRoundId={effectiveRoundId}
          onSelectRound={handleRoundSelect}
        />
      ) : null}

      {/* Cards grid */}
      {isFetching ? (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, index) => (
            <div key={index} className="relative h-[188px] overflow-hidden rounded-[28px] bg-slate-800">
              <div className="absolute inset-0 bg-gradient-to-br from-slate-700/60 to-transparent" />
              <div className="relative flex h-full flex-col justify-between p-4 sm:p-5">
                {/* Round badge */}
                <div className="h-5 w-20 animate-pulse rounded-full bg-slate-700" />
                {/* Teams + score */}
                <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
                  <div className="flex items-center gap-2">
                    <div className="h-11 w-11 shrink-0 animate-pulse rounded-full bg-slate-700" />
                    <div className="h-2.5 w-14 animate-pulse rounded bg-slate-700" />
                  </div>
                  <div className="flex h-12 min-w-[96px] animate-pulse items-center justify-center rounded-[22px] bg-slate-700/80" />
                  <div className="flex items-center justify-end gap-2">
                    <div className="h-2.5 w-14 animate-pulse rounded bg-slate-700" />
                    <div className="h-11 w-11 shrink-0 animate-pulse rounded-full bg-slate-700" />
                  </div>
                </div>
                {/* Status badge */}
                <div className="h-7 w-24 animate-pulse rounded-full bg-slate-700" />
              </div>
            </div>
          ))}
        </div>
      ) : activeGroup === null ? (
        <div className="flex h-36 items-center justify-center rounded-2xl border border-dashed border-slate-200 text-sm text-slate-400">
          No hay partidos disponibles
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {activeGroup.fixtures.map(fixture => (
            <MatchCard
              key={fixture.id}
              id={fixture.id}
              kickoffAt={fixture.kickoffAt}
              homeScore={fixture.homeScore}
              awayScore={fixture.awayScore}
              stateCode={fixture.state?.developerName ?? null}
              venueImagePath={fixture.venue?.imagePath ?? null}
              homeTeam={fixture.homeTeam}
              awayTeam={fixture.awayTeam}
              roundName={activeGroup.round.name}
            />
          ))}
        </div>
      )}

      </div>
    </div>
  )
}

export default MatchesBrowser
