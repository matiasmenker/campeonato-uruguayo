"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import { IconShield, IconChevronLeft, IconChevronRight } from "@tabler/icons-react"
import { cn } from "@/lib/utils"
import type { FixtureListItem, Round } from "@/lib/matches"
import type { Season } from "@/lib/seasons"

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

const formatTime = (value: string | null) => {
  if (!value) return "--:--"
  return new Intl.DateTimeFormat("es-UY", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "America/Montevideo",
  }).format(new Date(value))
}

const formatDateShort = (value: string | null) => {
  if (!value) return ""
  return new Intl.DateTimeFormat("es-UY", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    timeZone: "America/Montevideo",
  }).format(new Date(value))
}

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
      {formatTime(fixture.kickoffAt)}
    </span>
  )
}

const TeamCell = ({ team, align }: { team: FixtureListItem["homeTeam"]; align: "left" | "right" }) => {
  const name = team?.name ?? "Equipo"
  return (
    <div className={cn("flex min-w-0 flex-1 items-center gap-2.5", align === "right" && "flex-row-reverse")}>
      <div className="flex h-10 w-10 shrink-0 items-center justify-center">
        {team?.imagePath ? (
          <img src={team.imagePath} alt={name} className="h-8 w-8 object-contain" />
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
            {formatTime(fixture.kickoffAt)}
          </div>
        )}
        <StatusPill fixture={fixture} />
      </div>
      <TeamCell team={fixture.awayTeam} align="right" />
    </Link>
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
    for (const fixture of allFixtures) {
      if (fixture.stage && !map.has(fixture.stage.id)) {
        map.set(fixture.stage.id, fixture.stage)
      }
    }
    return Array.from(map.values()).sort((a, b) => a.id - b.id)
  }, [allFixtures])

  const defaultStageId = stages.find((s) => s.isCurrent)?.id ?? stages[stages.length - 1]?.id ?? null
  const [selectedStageId, setSelectedStageId] = useState<number | null>(defaultStageId)

  const stageFixtures = useMemo(
    () => (selectedStageId ? allFixtures.filter((f) => f.stage?.id === selectedStageId) : allFixtures),
    [allFixtures, selectedStageId]
  )

  const rounds = useMemo<Round[]>(() => {
    const map = new Map<number, Round>()
    for (const fixture of stageFixtures) {
      if (fixture.round && !map.has(fixture.round.id)) {
        map.set(fixture.round.id, fixture.round)
      }
    }
    return Array.from(map.values()).sort((a, b) => {
      const numA = parseInt(a.name, 10)
      const numB = parseInt(b.name, 10)
      if (!isNaN(numA) && !isNaN(numB)) return numA - numB
      return a.name.localeCompare(b.name)
    })
  }, [stageFixtures])

  const defaultRoundId = rounds.find((r) => r.isCurrent)?.id ?? rounds[rounds.length - 1]?.id ?? null
  const [selectedRoundId, setSelectedRoundId] = useState<number | null>(defaultRoundId)

  const roundIndex = rounds.findIndex((r) => r.id === selectedRoundId)
  const selectedRound = rounds[roundIndex] ?? null
  const previousRound = roundIndex > 0 ? rounds[roundIndex - 1] : null
  const nextRound = roundIndex < rounds.length - 1 ? rounds[roundIndex + 1] : null

  const displayFixtures = useMemo(
    () => (selectedRoundId ? stageFixtures.filter((f) => f.round?.id === selectedRoundId) : stageFixtures),
    [stageFixtures, selectedRoundId]
  )

  const firstKickoff = displayFixtures.find((f) => f.kickoffAt)?.kickoffAt ?? null

  const handleStageChange = (stageId: number) => {
    setSelectedStageId(stageId)
    const newStageFixtures = allFixtures.filter((f) => f.stage?.id === stageId)
    const newRoundMap = new Map<number, Round>()
    for (const fixture of newStageFixtures) {
      if (fixture.round && !newRoundMap.has(fixture.round.id)) {
        newRoundMap.set(fixture.round.id, fixture.round)
      }
    }
    const newRounds = Array.from(newRoundMap.values()).sort((a, b) => {
      const numA = parseInt(a.name, 10)
      const numB = parseInt(b.name, 10)
      if (!isNaN(numA) && !isNaN(numB)) return numA - numB
      return a.name.localeCompare(b.name)
    })
    const newDefault = newRounds.find((r) => r.isCurrent)?.id ?? newRounds[newRounds.length - 1]?.id ?? null
    setSelectedRoundId(newDefault)
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Season + Stage selector */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* Season pills */}
        {seasons.length > 1 && (
          <div className="flex gap-1">
            {seasons.map((season) => (
              <Link
                key={season.id}
                href={`/matches?seasonId=${season.id}`}
                className={cn(
                  "rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-colors",
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

        {/* Stage pills */}
        {stages.length > 1 && (
          <div className="flex gap-1">
            {stages.map((stage) => (
              <button
                key={stage.id}
                onClick={() => handleStageChange(stage.id)}
                className={cn(
                  "rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-colors",
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

      {/* Round navigator */}
      {rounds.length > 0 && (
        <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
          <div className="flex items-center gap-3 border-b border-slate-100 px-4 py-3">
            <button
              onClick={() => previousRound && setSelectedRoundId(previousRound.id)}
              disabled={!previousRound}
              className={cn(
                "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border transition",
                previousRound
                  ? "border-slate-200 text-slate-600 hover:bg-slate-50"
                  : "pointer-events-none border-slate-100 text-slate-200"
              )}
            >
              <IconChevronLeft size={15} />
            </button>

            <div className="flex flex-1 flex-col items-center">
              <span className="text-sm font-black text-slate-900">
                {selectedRound ? `Fecha ${selectedRound.name}` : "Sin fecha"}
              </span>
              {firstKickoff && (
                <span className="text-[11px] capitalize text-slate-400">
                  {formatDateShort(firstKickoff)}
                </span>
              )}
            </div>

            <button
              onClick={() => nextRound && setSelectedRoundId(nextRound.id)}
              disabled={!nextRound}
              className={cn(
                "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border transition",
                nextRound
                  ? "border-slate-200 text-slate-600 hover:bg-slate-50"
                  : "pointer-events-none border-slate-100 text-slate-200"
              )}
            >
              <IconChevronRight size={15} />
            </button>
          </div>

          {/* Match list */}
          {displayFixtures.length === 0 ? (
            <div className="flex h-32 items-center justify-center text-sm text-slate-400">
              No hay partidos disponibles
            </div>
          ) : (
            displayFixtures.map((fixture) => (
              <MatchRow key={fixture.id} fixture={fixture} />
            ))
          )}
        </div>
      )}

      {rounds.length === 0 && (
        <div className="flex h-36 items-center justify-center rounded-2xl border border-dashed border-slate-200 text-sm text-slate-400">
          No hay partidos disponibles
        </div>
      )}
    </div>
  )
}

export default MatchesBrowser
