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
import { getStageGroup, STAGE_GROUP_LABELS, STAGE_GROUP_ORDER, type StageGroup } from "@/lib/stage-groups"


interface StageSummary {
  id: number
  name: string
  isCurrent: boolean
}

interface StageGroupOption {
  group: StageGroup
  label: string
  stageIds: number[]
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

const getRoundStatus = (fixtures: FixtureListItem[]) => {
  const liveCount     = fixtures.filter(f => getMatchStatus(f.state?.developerName ?? null, f.homeScore, f.awayScore, f.kickoffAt ?? null) === "live").length
  const finishedCount = fixtures.filter(f => getMatchStatus(f.state?.developerName ?? null, f.homeScore, f.awayScore, f.kickoffAt ?? null) === "finished").length
  if (liveCount > 0) {
    return { label: "Live",        dotClass: "bg-red-500 animate-pulse", textClass: "text-red-500" }
  }
  if (finishedCount === fixtures.length && fixtures.length > 0) {
    return { label: "Finished",    dotClass: "bg-emerald-500",           textClass: "text-emerald-600" }
  }
  if (finishedCount > 0) {
    return { label: "In progress", dotClass: "bg-amber-400",             textClass: "text-amber-600" }
  }
  return              { label: "Upcoming",  dotClass: "bg-slate-300",    textClass: "text-slate-400" }
}

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

  useEffect(() => {
    if (!emblaApi || effectiveRoundId === null) return
    const index = roundGroups.findIndex(g => g.round.id === effectiveRoundId)
    if (index >= 0) emblaApi.scrollTo(index)
  }, [emblaApi, effectiveRoundId, roundGroups])

  return (
    <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">

      <button
        onClick={() => emblaApi?.scrollPrev()}
        disabled={!canScrollPrev}
        className={cn(
          "absolute top-1/2 left-3 z-20 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border border-slate-200/60 bg-white/60 text-slate-600 shadow-xs backdrop-blur-sm transition-[opacity,background-color] hover:bg-white/80 hover:text-slate-900",
          !canScrollPrev && "pointer-events-none opacity-30"
        )}
        aria-label="Previous rounds"
      >
        <IconChevronLeft size={15} />
      </button>

      <button
        onClick={() => emblaApi?.scrollNext()}
        disabled={!canScrollNext}
        className={cn(
          "absolute top-1/2 right-3 z-20 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border border-slate-200/60 bg-white/60 text-slate-600 shadow-xs backdrop-blur-sm transition-[opacity,background-color] hover:bg-white/80 hover:text-slate-900",
          !canScrollNext && "pointer-events-none opacity-30"
        )}
        aria-label="Next rounds"
      >
        <IconChevronRight size={15} />
      </button>

      {canScrollPrev && (
        <div className="pointer-events-none absolute left-0 top-0 bottom-0 z-10 w-16 bg-gradient-to-r from-white via-white/70 to-transparent" />
      )}
      {canScrollNext && (
        <div className="pointer-events-none absolute right-0 top-0 bottom-0 z-10 w-16 bg-gradient-to-l from-white via-white/70 to-transparent" />
      )}

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
                    {group.round.id < 0 ? group.round.name : `Round ${group.round.name}`}
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

const synthesizeRoundFromStage = (stage: { id: number; name: string; isCurrent: boolean }): RoundSummary => {
  const cleanName = stage.name.replace(/^championship\s*-\s*/i, "").trim()
  return { id: -stage.id, name: cleanName || stage.name, isCurrent: stage.isCurrent }
}

const buildRoundGroups = (fixtures: FixtureListItem[]): RoundGroup[] => {
  const map = new Map<number, RoundGroup>()
  for (const fixture of fixtures) {
    const round = fixture.round ?? (fixture.stage ? synthesizeRoundFromStage(fixture.stage) : null)
    if (!round) continue
    const existing = map.get(round.id)
    if (existing) {
      existing.fixtures.push(fixture)
    } else {
      map.set(round.id, { round, fixtures: [fixture] })
    }
  }
  return Array.from(map.values()).sort((a, b) => {
    const numA = parseInt(a.round.name, 10)
    const numB = parseInt(b.round.name, 10)
    if (!isNaN(numA) && !isNaN(numB)) return numA - numB
    if (!isNaN(numA)) return -1
    if (!isNaN(numB)) return 1
    return a.round.name.localeCompare(b.round.name)
  })
}

interface MatchesBrowserProps {
  seasons: Season[]
  initialSeasonId: number | null
  initialFixtures: FixtureListItem[]
}

const MatchesBrowser = ({ seasons, initialSeasonId, initialFixtures }: MatchesBrowserProps) => {
  const [currentSeasonId, setCurrentSeasonId] = useState<number | null>(initialSeasonId)
  const [currentFixtures, setCurrentFixtures] = useState<FixtureListItem[]>(initialFixtures)
  const [isFetching, setIsFetching] = useState(false)
  const [selectedStageId, setSelectedStageId] = useState<number | null>(null)
  const [selectedRoundId, setSelectedRoundId] = useState<number | null>(null)

  useEffect(() => {
    if (initialSeasonId === null) return
    const savedStage = storageGet(stageKey(initialSeasonId))
    const savedRound = storageGet(roundKey(initialSeasonId))
    if (savedStage !== null) setSelectedStageId(savedStage)
    if (savedRound !== null) setSelectedRoundId(savedRound)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleSeasonChange = useCallback(async (seasonId: number) => {
    if (seasonId === currentSeasonId) return
    setCurrentSeasonId(seasonId)

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
    } finally {
      setIsFetching(false)
    }
  }, [currentSeasonId])

  const stageGroupOptions = useMemo<StageGroupOption[]>(() => {
    const buckets = new Map<StageGroup, { stageIds: Set<number>; isCurrent: boolean }>()
    for (const fixture of currentFixtures) {
      if (!fixture.stage) continue
      const group = getStageGroup(fixture.stage.name)
      if (!group) continue
      const existing = buckets.get(group) ?? { stageIds: new Set<number>(), isCurrent: false }
      existing.stageIds.add(fixture.stage.id)
      if (fixture.stage.isCurrent) existing.isCurrent = true
      buckets.set(group, existing)
    }
    return STAGE_GROUP_ORDER.map((group) => ({
      group,
      label: STAGE_GROUP_LABELS[group],
      stageIds: Array.from(buckets.get(group)?.stageIds ?? []),
      isCurrent: buckets.get(group)?.isCurrent ?? false,
    }))
  }, [currentFixtures])

  const availableGroups = stageGroupOptions.filter((option) => option.stageIds.length > 0)
  const selectedGroupFromStage = stageGroupOptions.find((option) => option.stageIds.includes(selectedStageId ?? -1))
  const effectiveGroup =
    selectedGroupFromStage && selectedGroupFromStage.stageIds.length > 0
      ? selectedGroupFromStage
      : availableGroups.find((option) => option.isCurrent) ?? availableGroups[0] ?? null
  const effectiveStageId = effectiveGroup?.stageIds[0] ?? null
  const effectiveGroupStageIdSet = useMemo(
    () => new Set(effectiveGroup?.stageIds ?? []),
    [effectiveGroup]
  )

  const stageFixtures = useMemo(
    () =>
      effectiveGroup
        ? currentFixtures.filter((fixture) => fixture.stage && effectiveGroupStageIdSet.has(fixture.stage.id))
        : currentFixtures,
    [currentFixtures, effectiveGroup, effectiveGroupStageIdSet]
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

  const handleGroupChange = (groupKey: string) => {
    const option = stageGroupOptions.find((entry) => entry.group === groupKey)
    if (!option || option.stageIds.length === 0) return
    const nextStageId = option.stageIds[0]
    setSelectedStageId(nextStageId)
    setSelectedRoundId(null)
    if (currentSeasonId !== null) {
      storageSet(stageKey(currentSeasonId), nextStageId)
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
  const showStageSelector  = stageGroupOptions.length >= 1

  const selectedSeason = seasons.find(s => s.id === currentSeasonId) ?? null
  const stageSelectOptions = stageGroupOptions.map((option) => ({
    id: option.group,
    name: option.label,
    disabled: option.stageIds.length === 0,
  }))
  const stageSelectValue = effectiveGroup?.group ?? availableGroups[0]?.group ?? stageGroupOptions[0]?.group ?? ""

  return (
    <div className="flex flex-col gap-6">

      <div className="overflow-hidden rounded-2xl shadow-lg">
        <div className="relative min-h-52 bg-slate-900">
          <HeroTexture />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/5 to-black/40 pointer-events-none" />

          <div className="absolute bottom-0 left-0 right-0 flex items-end justify-between gap-4 p-6">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-sm ring-1 ring-white/20">
                <IconBallFootball size={28} className="text-white/80" />
              </div>
              <div className="flex flex-col gap-0.5">
                <h1 className="text-3xl font-black text-white leading-none drop-shadow">Matches</h1>
                <p className="text-sm text-white/65">
                  {effectiveGroup?.label ?? "First Division"}
                  {selectedSeason && ` ${selectedSeason.name}`}
                </p>
              </div>
            </div>

            {(showSeasonSelector || showStageSelector) && (
              <div className="flex shrink-0 items-center gap-2">
                {showStageSelector && (
                  <HeroSelect
                    value={stageSelectValue}
                    onValueChange={handleGroupChange}
                    options={stageSelectOptions}
                    isLoading={isFetching}
                    openUp
                  />
                )}
                {showSeasonSelector && (
                  <HeroSelect
                    value={String(currentSeasonId ?? "")}
                    onValueChange={value => handleSeasonChange(Number(value))}
                    options={seasons}
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

      {isFetching ? (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, index) => (
            <div key={index} className="relative h-[188px] overflow-hidden rounded-[28px] border border-slate-200/80 bg-slate-100">
              <div className="relative flex h-full flex-col justify-between p-4 sm:p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="h-5 w-20 animate-pulse rounded-full bg-slate-200" />
                  <div className="h-3 w-16 animate-pulse rounded bg-slate-200" />
                </div>
                <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2">
                  <div className="flex items-center gap-3">
                    <div className="h-11 w-11 shrink-0 animate-pulse rounded-full bg-slate-200" />
                    <div className="h-2.5 w-14 animate-pulse rounded bg-slate-200" />
                  </div>
                  <div className="flex min-w-[96px] animate-pulse items-center justify-center rounded-[22px] border border-slate-200 bg-white/80 py-5" />
                  <div className="flex items-center justify-end gap-3">
                    <div className="h-2.5 w-14 animate-pulse rounded bg-slate-200" />
                    <div className="h-11 w-11 shrink-0 animate-pulse rounded-full bg-slate-200" />
                  </div>
                </div>
                <div className="h-7 w-24 animate-pulse rounded-full bg-slate-200" />
              </div>
            </div>
          ))}
        </div>
      ) : activeGroup === null ? (
        <div className="flex h-36 items-center justify-center rounded-2xl border border-dashed border-slate-200 text-sm text-slate-400">
          No matches available
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
