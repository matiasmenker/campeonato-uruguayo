"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import { IconShield, IconChevronDown } from "@tabler/icons-react"
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

const formatDateShort = (value: string | null) => {
  if (!value) return ""
  const formatted = new Intl.DateTimeFormat("es-UY", {
    weekday: "short", day: "2-digit", month: "short", timeZone: "America/Montevideo",
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

const getStatusBadge = (fixture: FixtureListItem) => {
  const status = getMatchStatus(fixture)
  const code = fixture.state?.developerName ?? null

  if (status === "live") {
    return {
      isLive: true,
      dotClassName: "bg-red-500",
      label: getLiveLabel(code),
      textClassName: "text-red-200",
      wrapperClassName: "border-red-400/20 bg-red-500/16 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]",
    }
  }

  if (status === "finished") {
    return {
      isLive: false,
      dotClassName: "bg-emerald-400",
      label: "Finalizado",
      textClassName: "text-emerald-100",
      wrapperClassName: "border-emerald-400/20 bg-emerald-500/14 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]",
    }
  }

  return {
    isLive: false,
    dotClassName: "bg-white/45",
    label: formatKickoffTime(fixture.kickoffAt),
    textClassName: "text-white/80",
    wrapperClassName: "border-white/12 bg-white/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]",
  }
}

const MatchCard = ({ fixture }: { fixture: FixtureListItem }) => {
  const status = getMatchStatus(fixture)
  const badge = getStatusBadge(fixture)
  const showScore = status === "finished" || status === "live"
  const backgroundImage = fixture.venue?.imagePath ? `url("${fixture.venue.imagePath}")` : undefined

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
          {/* Date */}
          <div className="flex justify-end">
            <span className="text-[11px] font-medium text-white/65">
              {formatMatchDay(fixture.kickoffAt)}
            </span>
          </div>

          {/* Teams + score */}
          <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2">
            <div className="flex min-w-0 items-center gap-2.5">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center">
                {fixture.homeTeam?.imagePath
                  ? <img src={fixture.homeTeam.imagePath} alt={fixture.homeTeam.name} className="h-9 w-9 object-contain drop-shadow-sm" />
                  : <IconShield className="h-9 w-9 text-white/80 drop-shadow-sm" />
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
                  : <IconShield className="h-9 w-9 text-white/80 drop-shadow-sm" />
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
              badge.wrapperClassName
            )}>
              <span className="relative flex h-2 w-2">
                {badge.isLive && (
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
                )}
                <span className={cn("relative inline-flex h-2 w-2 rounded-full", badge.dotClassName)} />
              </span>
              <span className={cn("text-[11px] font-semibold", badge.textClassName)}>
                {badge.label}
              </span>
            </div>
          </div>
        </div>
      </article>
    </Link>
  )
}

const RoundSummaryBadges = ({ fixtures }: { fixtures: FixtureListItem[] }) => {
  const finished = fixtures.filter(f => getMatchStatus(f) === "finished").length
  const live     = fixtures.filter(f => getMatchStatus(f) === "live").length
  const upcoming = fixtures.filter(f => getMatchStatus(f) === "upcoming").length
  return (
    <div className="flex items-center gap-2 text-xs">
      {live > 0 && (
        <span className="flex items-center gap-1 font-semibold text-red-500">
          <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" />{live} en vivo
        </span>
      )}
      {finished > 0 && <span className="text-slate-400">{finished} finalizado{finished > 1 ? "s" : ""}</span>}
      {upcoming > 0 && <span className="text-slate-400">{upcoming} por jugar</span>}
    </div>
  )
}

const RoundAccordion = ({ group, defaultOpen = false }: { group: RoundGroup; defaultOpen?: boolean }) => {
  const [open, setOpen] = useState(defaultOpen)
  const firstKickoff = group.fixtures.find(f => f.kickoffAt)?.kickoffAt ?? null

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
      <button
        onClick={() => setOpen(v => !v)}
        className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left transition-colors hover:bg-slate-50"
      >
        <div className="flex items-center gap-3 min-w-0">
          <span className="text-sm font-black text-slate-900 shrink-0">Fecha {group.round.name}</span>
          {firstKickoff && (
            <span className="text-xs text-slate-400 truncate">{formatDateShort(firstKickoff)}</span>
          )}
        </div>
        <div className="flex items-center gap-3 shrink-0">
          {!open && <RoundSummaryBadges fixtures={group.fixtures} />}
          <IconChevronDown
            size={16}
            className={cn("text-slate-400 transition-transform duration-200", open && "rotate-180")}
          />
        </div>
      </button>

      {open && (
        <div className="border-t border-slate-100 p-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {group.fixtures.map(fixture => <MatchCard key={fixture.id} fixture={fixture} />)}
        </div>
      )}
    </div>
  )
}

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

interface MatchesBrowserProps {
  seasons: Season[]
  selectedSeasonId: number | null
  allFixtures: FixtureListItem[]
}

const MatchesBrowser = ({ seasons, selectedSeasonId, allFixtures }: MatchesBrowserProps) => {
  const stages = useMemo<StageSummary[]>(() => {
    const map = new Map<number, StageSummary>()
    const roundedFixtureCount = new Map<number, number>()
    for (const fixture of allFixtures) {
      if (!fixture.stage) continue
      if (!map.has(fixture.stage.id)) map.set(fixture.stage.id, fixture.stage)
      if (fixture.round) roundedFixtureCount.set(fixture.stage.id, (roundedFixtureCount.get(fixture.stage.id) ?? 0) + 1)
    }
    return Array.from(map.values())
      .filter(stage => (roundedFixtureCount.get(stage.id) ?? 0) >= 5)
      .sort((a, b) => a.id - b.id)
  }, [allFixtures])

  const defaultStageId = stages.find(s => s.isCurrent)?.id ?? stages[0]?.id ?? null
  const [selectedStageId, setSelectedStageId] = useState<number | null>(defaultStageId)

  const stageFixtures = useMemo(
    () => selectedStageId ? allFixtures.filter(f => f.stage?.id === selectedStageId) : allFixtures,
    [allFixtures, selectedStageId]
  )

  const roundGroups = useMemo(() => buildRoundGroups(stageFixtures), [stageFixtures])

  const currentGroupIndex = roundGroups.findIndex(g => g.round.isCurrent)
  const splitIndex = currentGroupIndex >= 0 ? currentGroupIndex : roundGroups.length - 1

  const activeGroups = roundGroups.slice(splitIndex)
  const pastGroups   = roundGroups.slice(0, splitIndex).reverse()

  return (
    <div className="flex flex-col gap-4">

      {/* Selectors row */}
      <div className="flex flex-wrap items-center justify-between gap-3">

        {/* Season selector */}
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

        {/* Stage selector — always show when there's at least one */}
        {stages.length >= 1 && (
          <div className="flex gap-1.5">
            {stages.map(stage => (
              <button
                key={stage.id}
                onClick={() => setSelectedStageId(stage.id)}
                className={cn(
                  "rounded-full border px-3.5 py-1.5 text-xs font-bold transition-colors",
                  stage.id === selectedStageId
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

      {/* Matches */}
      {roundGroups.length === 0 ? (
        <div className="flex h-36 items-center justify-center rounded-2xl border border-dashed border-slate-200 text-sm text-slate-400">
          No hay partidos disponibles
        </div>
      ) : (
        <>
          {activeGroups.map((group, index) => (
            <RoundAccordion
              key={group.round.id}
              group={group}
              defaultOpen={index === 0}
            />
          ))}

          {pastGroups.length > 0 && (
            <div className="flex flex-col gap-3">
              <p className="px-1 text-xs font-semibold uppercase tracking-wider text-slate-400">
                Fechas anteriores
              </p>
              {pastGroups.map(group => (
                <RoundAccordion key={group.round.id} group={group} defaultOpen={false} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default MatchesBrowser
