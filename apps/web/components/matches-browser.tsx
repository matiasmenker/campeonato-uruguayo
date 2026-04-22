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

const formatTime = (value: string | null) => {
  if (!value) return "--:--"
  return new Intl.DateTimeFormat("es-UY", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "America/Montevideo" }).format(new Date(value))
}

const formatDateShort = (value: string | null) => {
  if (!value) return ""
  const d = new Intl.DateTimeFormat("es-UY", { weekday: "short", day: "2-digit", month: "short", timeZone: "America/Montevideo" }).format(new Date(value))
  return d.charAt(0).toUpperCase() + d.slice(1)
}

const StatusPill = ({ fixture }: { fixture: FixtureListItem }) => {
  const status = getMatchStatus(fixture)
  const code = fixture.state?.developerName ?? null
  if (status === "live") {
    const label = code === "HT" ? "Entretiempo" : code === "INPLAY_ET" || code === "INPLAY_ET_SECOND_HALF" ? "Prórroga" : code === "INPLAY_PENALTIES" ? "Penales" : "En vivo"
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
  if (status === "finished") return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />FT
    </span>
  )
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-semibold text-slate-500">
      <span className="h-1.5 w-1.5 rounded-full bg-slate-300" />{formatTime(fixture.kickoffAt)}
    </span>
  )
}

const TeamCell = ({ team, align }: { team: FixtureListItem["homeTeam"]; align: "left" | "right" }) => (
  <div className={cn("flex min-w-0 flex-1 items-center gap-2.5", align === "right" && "flex-row-reverse")}>
    <div className="flex h-9 w-9 shrink-0 items-center justify-center">
      {team?.imagePath
        ? <img src={team.imagePath} alt={team.name} className="h-7 w-7 object-contain" />
        : <IconShield size={20} className="text-slate-300" />}
    </div>
    <p className={cn("min-w-0 truncate text-sm font-semibold text-slate-800", align === "right" && "text-right")}>
      {team?.name ?? "Equipo"}
    </p>
  </div>
)

const MatchRow = ({ fixture }: { fixture: FixtureListItem }) => {
  const status = getMatchStatus(fixture)
  const showScore = status === "finished" || status === "live"
  return (
    <Link href={`/matches/${fixture.id}`} className="flex items-center gap-3 border-b border-slate-100 px-4 py-3 transition-colors last:border-0 hover:bg-slate-50 sm:px-5">
      <TeamCell team={fixture.homeTeam} align="left" />
      <div className="flex w-32 shrink-0 flex-col items-center gap-1 sm:w-40">
        {showScore ? (
          <div className="flex items-center gap-2">
            <span className="text-xl font-black tabular-nums text-slate-900">{fixture.homeScore ?? 0}</span>
            <span className="text-sm font-medium text-slate-300">–</span>
            <span className="text-xl font-black tabular-nums text-slate-900">{fixture.awayScore ?? 0}</span>
          </div>
        ) : (
          <div className="text-base font-black tracking-tight text-slate-700">{formatTime(fixture.kickoffAt)}</div>
        )}
        <StatusPill fixture={fixture} />
      </div>
      <TeamCell team={fixture.awayTeam} align="right" />
    </Link>
  )
}

const RoundSummaryRow = ({ fixtures }: { fixtures: FixtureListItem[] }) => {
  const finished = fixtures.filter(f => getMatchStatus(f) === "finished")
  const upcoming = fixtures.filter(f => getMatchStatus(f) === "upcoming")
  const live     = fixtures.filter(f => getMatchStatus(f) === "live")
  return (
    <div className="flex items-center gap-2 text-xs text-slate-400">
      {live.length > 0 && <span className="font-semibold text-red-500">{live.length} en vivo</span>}
      {finished.length > 0 && <span>{finished.length} finalizado{finished.length > 1 ? "s" : ""}</span>}
      {upcoming.length > 0 && <span>{upcoming.length} por jugar</span>}
    </div>
  )
}

interface RoundAccordionProps {
  round: Round
  fixtures: FixtureListItem[]
  defaultOpen?: boolean
}

const RoundAccordion = ({ round, fixtures, defaultOpen = false }: RoundAccordionProps) => {
  const [open, setOpen] = useState(defaultOpen)
  const firstKickoff = fixtures.find(f => f.kickoffAt)?.kickoffAt ?? null

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
      <button
        onClick={() => setOpen(v => !v)}
        className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left transition-colors hover:bg-slate-50"
      >
        <div className="flex items-center gap-3">
          <span className="text-sm font-black text-slate-900">Fecha {round.name}</span>
          {firstKickoff && (
            <span className="text-xs text-slate-400">{formatDateShort(firstKickoff)}</span>
          )}
        </div>
        <div className="flex items-center gap-3">
          {!open && <RoundSummaryRow fixtures={fixtures} />}
          <IconChevronDown
            size={16}
            className={cn("shrink-0 text-slate-400 transition-transform duration-200", open && "rotate-180")}
          />
        </div>
      </button>

      {open && (
        <div className="border-t border-slate-100">
          {fixtures.map(fixture => <MatchRow key={fixture.id} fixture={fixture} />)}
        </div>
      )}
    </div>
  )
}

interface MatchesBrowserProps {
  seasons: Season[]
  selectedSeasonId: number | null
  allFixtures: FixtureListItem[]
}

const MatchesBrowser = ({ seasons, selectedSeasonId, allFixtures }: MatchesBrowserProps) => {
  const stages = useMemo<StageSummary[]>(() => {
    const map = new Map<number, StageSummary>()
    for (const f of allFixtures) {
      if (f.stage && !map.has(f.stage.id)) map.set(f.stage.id, f.stage)
    }
    return Array.from(map.values()).sort((a, b) => a.id - b.id)
  }, [allFixtures])

  const defaultStageId = stages.find(s => s.isCurrent)?.id ?? stages[stages.length - 1]?.id ?? null
  const [selectedStageId, setSelectedStageId] = useState<number | null>(defaultStageId)

  const stageFixtures = useMemo(
    () => selectedStageId ? allFixtures.filter(f => f.stage?.id === selectedStageId) : allFixtures,
    [allFixtures, selectedStageId]
  )

  const roundGroups = useMemo(() => {
    const map = new Map<number, { round: Round; fixtures: FixtureListItem[] }>()
    for (const fixture of stageFixtures) {
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
  }, [stageFixtures])

  const currentRoundId = roundGroups.find(g => g.round.isCurrent)?.round.id
    ?? roundGroups[roundGroups.length - 1]?.round.id
    ?? null

  // Split into current/upcoming and past
  const currentIndex = roundGroups.findIndex(g => g.round.id === currentRoundId)
  const activeGroups = currentIndex >= 0 ? roundGroups.slice(currentIndex) : roundGroups.slice(-1)
  const pastGroups   = currentIndex > 0  ? roundGroups.slice(0, currentIndex).reverse() : []

  return (
    <div className="flex flex-col gap-4">

      {/* Season + Stage selectors */}
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

        {stages.length > 1 && (
          <div className="flex gap-1.5">
            {stages.map(stage => (
              <button
                key={stage.id}
                onClick={() => setSelectedStageId(stage.id)}
                className={cn(
                  "rounded-full border px-3.5 py-1.5 text-xs font-bold transition-colors",
                  stage.id === selectedStageId
                    ? "border-emerald-600 bg-emerald-600 text-white"
                    : "border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:text-slate-800"
                )}
              >
                {stage.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {roundGroups.length === 0 ? (
        <div className="flex h-36 items-center justify-center rounded-2xl border border-dashed border-slate-200 text-sm text-slate-400">
          No hay partidos disponibles
        </div>
      ) : (
        <>
          {/* Active / upcoming rounds */}
          {activeGroups.map(group => (
            <RoundAccordion
              key={group.round.id}
              round={group.round}
              fixtures={group.fixtures}
              defaultOpen={group.round.id === currentRoundId}
            />
          ))}

          {/* Past rounds */}
          {pastGroups.length > 0 && (
            <div className="flex flex-col gap-3">
              <p className="px-1 text-xs font-semibold uppercase tracking-wider text-slate-400">Fechas anteriores</p>
              {pastGroups.map(group => (
                <RoundAccordion
                  key={group.round.id}
                  round={group.round}
                  fixtures={group.fixtures}
                  defaultOpen={false}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default MatchesBrowser
