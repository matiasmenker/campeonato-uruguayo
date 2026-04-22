"use client"

import { useState, useMemo, useEffect, useRef } from "react"
import Link from "next/link"
import { IconShield } from "@tabler/icons-react"
import { cn } from "@/lib/utils"
import type { FixtureListItem, Round } from "@/lib/matches"
import type { Season } from "@/lib/seasons"

interface StageSummary {
  id: number
  name: string
  isCurrent: boolean
}

interface RoundGroup {
  round: Round
  fixtures: FixtureListItem[]
}

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

// "Domingo 24 de marzo" — same style as the home carousel date label
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
  const live     = fixtures.filter(f => getMatchStatus(f) === "live").length
  const finished = fixtures.filter(f => getMatchStatus(f) === "finished").length

  if (live > 0) {
    return { label: "En vivo",    dotClass: "bg-red-500 animate-pulse", textClass: "text-red-500" }
  }
  if (finished === fixtures.length && fixtures.length > 0) {
    return { label: "Finalizado", dotClass: "bg-emerald-500",           textClass: "text-emerald-600" }
  }
  if (finished > 0) {
    return { label: "En curso",   dotClass: "bg-amber-400",             textClass: "text-amber-600" }
  }
  return       { label: "Por jugar", dotClass: "bg-slate-300",              textClass: "text-slate-400" }
}

// ---------------------------------------------------------------------------
// Dark venue card — same aesthetic as the home carousel
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
    // Upcoming — the time is already shown in the score panel, badge says "Por jugar"
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
          {/* Date shown on the card */}
          <div className="flex justify-end">
            <span className="text-[11px] font-medium text-white/60">
              {formatMatchDay(fixture.kickoffAt)}
            </span>
          </div>

          {/* Teams + score / time */}
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

          {/* Status badge */}
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
  selectedSeasonId: number | null
  allFixtures: FixtureListItem[]
}

const MatchesBrowser = ({ seasons, selectedSeasonId, allFixtures }: MatchesBrowserProps) => {
  // Both start as null — resolved below using the "effective" pattern so they
  // automatically fall back to sensible defaults when the season changes.
  const [selectedStageId, setSelectedStageId] = useState<number | null>(null)
  const [selectedRoundId, setSelectedRoundId] = useState<number | null>(null)

  // Derive valid stages (≥5 round-based fixtures filters out playoff/finals)
  const stages = useMemo<StageSummary[]>(() => {
    const stageMap   = new Map<number, StageSummary>()
    const roundCount = new Map<number, number>()
    for (const fixture of allFixtures) {
      if (!fixture.stage) continue
      if (!stageMap.has(fixture.stage.id)) stageMap.set(fixture.stage.id, fixture.stage)
      if (fixture.round) roundCount.set(fixture.stage.id, (roundCount.get(fixture.stage.id) ?? 0) + 1)
    }
    return Array.from(stageMap.values())
      .filter(stage => (roundCount.get(stage.id) ?? 0) >= 5)
      .sort((a, b) => a.id - b.id)
  }, [allFixtures])

  // If the stored selection is invalid (e.g. after a season switch) fall back to current/first
  const defaultStageId    = stages.find(s => s.isCurrent)?.id ?? stages[0]?.id ?? null
  const effectiveStageId  = stages.some(s => s.id === selectedStageId) ? selectedStageId : defaultStageId

  const stageFixtures = useMemo(
    () => effectiveStageId ? allFixtures.filter(f => f.stage?.id === effectiveStageId) : allFixtures,
    [allFixtures, effectiveStageId]
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

  // Auto-scroll the round selector carousel so the active pill is centred
  const roundSelectorRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const container = roundSelectorRef.current
    if (!container || effectiveRoundId === null) return
    const pill = container.querySelector<HTMLElement>(`[data-round-id="${effectiveRoundId}"]`)
    if (!pill) return
    const targetLeft = pill.offsetLeft - (container.clientWidth - pill.offsetWidth) / 2
    container.scrollTo({ left: targetLeft, behavior: "smooth" })
  }, [effectiveRoundId])

  const goToPrev = () => {
    const prevId = roundGroups[activeIndex - 1]?.round.id
    if (prevId !== undefined) setSelectedRoundId(prevId)
  }
  const goToNext = () => {
    const nextId = roundGroups[activeIndex + 1]?.round.id
    if (nextId !== undefined) setSelectedRoundId(nextId)
  }

  const firstKickoff = activeGroup?.fixtures.find(f => f.kickoffAt)?.kickoffAt ?? null

  return (
    <div className="flex flex-col gap-5">

      {/* Season + stage selectors */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {seasons.length > 1 && (
          <div className="flex gap-1.5">
            {seasons.map(season => (
              <Link
                key={season.id}
                href={`/matches?seasonId=${season.id}`}
                className={cn(
                  "rounded-full border px-3.5 py-1.5 text-xs font-bold transition-colors",
                  season.id === selectedSeasonId
                    ? "border-slate-800 bg-slate-800 text-white"
                    : "border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:text-slate-800"
                )}
              >
                {season.name}
              </Link>
            ))}
          </div>
        )}

        {stages.length >= 1 && (
          <div className="flex gap-1.5">
            {stages.map(stage => (
              <button
                key={stage.id}
                onClick={() => {
                  setSelectedStageId(stage.id)
                  setSelectedRoundId(null) // let the resolver pick the right default for this stage
                }}
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

      {/* Round carousel — auto-scrolls to the active pill */}
      {roundGroups.length > 0 && (
        <div className="relative">
          {/* Gradient edge fades to give carousel depth */}
          <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-10 bg-gradient-to-r from-[#f8fafc] to-transparent" />
          <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-10 bg-gradient-to-l from-[#f8fafc] to-transparent" />

          <div
            ref={roundSelectorRef}
            className="flex gap-2 overflow-x-auto px-5 pb-1"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" } as React.CSSProperties}
          >
            {roundGroups.map(group => {
              const roundStatus = getRoundStatus(group.fixtures)
              const isActive    = group.round.id === effectiveRoundId
              return (
                <button
                  key={group.round.id}
                  data-round-id={group.round.id}
                  onClick={() => setSelectedRoundId(group.round.id)}
                  className={cn(
                    "flex shrink-0 flex-col items-center gap-1 rounded-2xl border px-4 py-2.5 transition-all duration-150",
                    isActive
                      ? "border-slate-900 bg-slate-900 shadow-md"
                      : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                  )}
                >
                  <span className={cn(
                    "text-xs font-black",
                    isActive ? "text-white" : "text-slate-800"
                  )}>
                    Fecha {group.round.name}
                  </span>
                  <div className="flex items-center gap-1">
                    <span className={cn("h-1.5 w-1.5 rounded-full", roundStatus.dotClass)} />
                    <span className={cn(
                      "text-[10px] font-semibold",
                      isActive ? "text-white/65" : roundStatus.textClass
                    )}>
                      {roundStatus.label}
                    </span>
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Active round */}
      {activeGroup === null ? (
        <div className="flex h-36 items-center justify-center rounded-2xl border border-dashed border-slate-200 text-sm text-slate-400">
          No hay partidos disponibles
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {/* Round header */}
          <div className="flex items-start justify-between gap-4 px-0.5">
            <div>
              <h2 className="text-xl font-black leading-tight text-slate-900">
                Fecha {activeGroup.round.name}
              </h2>
              <p className="mt-0.5 text-sm text-slate-500">
                {formatRoundDate(firstKickoff)}
                {" · "}
                {activeGroup.fixtures.length} partido{activeGroup.fixtures.length !== 1 ? "s" : ""}
              </p>
            </div>

            {/* Prev / Next round navigation */}
            <div className="flex shrink-0 items-center gap-1.5 pt-0.5">
              <button
                onClick={goToPrev}
                disabled={activeIndex === 0}
                aria-label="Fecha anterior"
                className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 transition-colors hover:bg-slate-50 disabled:pointer-events-none disabled:opacity-30"
              >
                <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                  <path d="M8 2.5L4.5 6.5 8 10.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
              <button
                onClick={goToNext}
                disabled={activeIndex === roundGroups.length - 1}
                aria-label="Siguiente fecha"
                className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 transition-colors hover:bg-slate-50 disabled:pointer-events-none disabled:opacity-30"
              >
                <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                  <path d="M5 2.5L8.5 6.5 5 10.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>
          </div>

          {/* Match cards grid */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {activeGroup.fixtures.map(fixture => (
              <MatchCard key={fixture.id} fixture={fixture} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default MatchesBrowser
