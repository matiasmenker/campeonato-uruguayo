"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import { IconShield, IconChevronDown, IconChevronLeft, IconChevronRight } from "@tabler/icons-react"
import { cn } from "@/lib/utils"
import type { FixtureListItem, Round } from "@/lib/matches"
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
  return new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "America/Montevideo",
  }).format(new Date(value))
}

const formatDateShort = (value: string | null) => {
  if (!value) return ""
  const formatted = new Intl.DateTimeFormat("en-GB", {
    weekday: "short", day: "2-digit", month: "short", timeZone: "America/Montevideo",
  }).format(new Date(value))
  return formatted.charAt(0).toUpperCase() + formatted.slice(1)
}

const formatMatchDay = (value: string | null) => {
  if (!value) return "No date"
  const formatted = new Intl.DateTimeFormat("en-GB", {
    weekday: "long", day: "2-digit", month: "2-digit", year: "numeric", timeZone: "America/Montevideo",
  }).format(new Date(value))
  return formatted.charAt(0).toUpperCase() + formatted.slice(1)
}

const getLiveLabel = (code: string | null) => {
  if (code === "HT") return "Half time"
  if (code === "INPLAY_ET" || code === "INPLAY_ET_SECOND_HALF") return "Extra time"
  if (code === "INPLAY_PENALTIES") return "Penalties"
  return "Live"
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
      wrapperClassName: "border-red-400/20 bg-red-500/16",
    }
  }
  if (status === "finished") {
    return {
      isLive: false,
      dotClassName: "bg-emerald-400",
      label: "Finished",
      textClassName: "text-emerald-100",
      wrapperClassName: "border-emerald-400/20 bg-emerald-500/14",
    }
  }
  return {
    isLive: false,
    dotClassName: "bg-white/45",
    label: formatKickoffTime(fixture.kickoffAt),
    textClassName: "text-white/80",
    wrapperClassName: "border-white/12 bg-white/10",
  }
}

interface RoundGroup {
  round: Round
  fixtures: FixtureListItem[]
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
const DarkMatchCard = ({ fixture, compact = false }: { fixture: FixtureListItem; compact?: boolean }) => {
  const status = getMatchStatus(fixture)
  const badge = getStatusBadge(fixture)
  const showScore = status === "finished" || status === "live"
  const backgroundImage = fixture.venue?.imagePath ? `url("${fixture.venue.imagePath}")` : undefined

  return (
    <Link href={`/matches/${fixture.id}`} className="block">
      <article
        className={cn(
          "group relative overflow-hidden bg-slate-900 cursor-pointer",
          compact ? "h-[148px] rounded-[20px]" : "h-[172px] rounded-[24px]"
        )}
      >
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
        <div className={cn("relative flex h-full flex-col justify-between", compact ? "p-3.5" : "p-4")}>
          <div className="flex justify-end">
            <span className="text-[11px] font-medium text-white/60">
              {formatMatchDay(fixture.kickoffAt)}
            </span>
          </div>

          <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2">
            <div className="flex min-w-0 items-center gap-2">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center">
                {fixture.homeTeam?.imagePath
                  ? <img src={fixture.homeTeam.imagePath} alt={fixture.homeTeam.name} className="h-8 w-8 object-contain drop-shadow-sm" />
                  : <IconShield className="h-8 w-8 text-white/80" />
                }
              </div>
              <p className="min-w-0 truncate text-[12px] font-semibold text-white">
                {fixture.homeTeam?.name ?? "Team"}
              </p>
            </div>

            <div className="flex min-w-[80px] flex-col items-center rounded-[16px] border border-white/10 bg-black/20 px-3.5 py-1.5 text-center backdrop-blur-sm">
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
              <div className="flex h-10 w-10 shrink-0 items-center justify-center">
                {fixture.awayTeam?.imagePath
                  ? <img src={fixture.awayTeam.imagePath} alt={fixture.awayTeam.name} className="h-8 w-8 object-contain drop-shadow-sm" />
                  : <IconShield className="h-8 w-8 text-white/80" />
                }
              </div>
              <p className="min-w-0 truncate text-right text-[12px] font-semibold text-white">
                {fixture.awayTeam?.name ?? "Team"}
              </p>
            </div>
          </div>

          <div>
            <div className={cn(
              "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 backdrop-blur-sm",
              badge.wrapperClassName
            )}>
              <span className="relative flex h-1.5 w-1.5">
                {badge.isLive && (
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
                )}
                <span className={cn("relative inline-flex h-1.5 w-1.5 rounded-full", badge.dotClassName)} />
              </span>
              <span className={cn("text-[10px] font-semibold", badge.textClassName)}>
                {badge.label}
              </span>
            </div>
          </div>
        </div>
      </article>
    </Link>
  )
}

const ProposalA = ({ roundGroups }: { roundGroups: RoundGroup[] }) => {
  const currentIndex = roundGroups.findIndex(g => g.round.isCurrent)
  const [activeIndex, setActiveIndex] = useState(currentIndex >= 0 ? currentIndex : roundGroups.length - 1)

  const active = roundGroups[activeIndex]

  return (
    <div className="flex flex-col gap-5">
      
      <div className="relative">
        <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {roundGroups.map((group, index) => {
            const finished = group.fixtures.filter(f => getMatchStatus(f) === "finished").length
            const live     = group.fixtures.filter(f => getMatchStatus(f) === "live").length
            const allDone  = finished === group.fixtures.length && group.fixtures.length > 0
            return (
              <button
                key={group.round.id}
                onClick={() => setActiveIndex(index)}
                className={cn(
                  "flex shrink-0 flex-col items-center rounded-2xl border px-4 py-2.5 text-left transition-all",
                  index === activeIndex
                    ? "border-slate-900 bg-slate-900 text-white shadow-lg"
                    : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                )}
              >
                <span className={cn(
                  "text-xs font-black",
                  index === activeIndex ? "text-white" : "text-slate-800"
                )}>
                  F{group.round.name}
                </span>
                {live > 0 ? (
                  <span className="mt-0.5 flex items-center gap-1 text-[10px] font-semibold text-red-500">
                    <span className="h-1 w-1 rounded-full bg-red-500 animate-pulse" />live
                  </span>
                ) : allDone ? (
                  <span className="mt-0.5 text-[10px] font-medium text-emerald-600">✓</span>
                ) : (
                  <span className={cn(
                    "mt-0.5 text-[10px]",
                    index === activeIndex ? "text-white/60" : "text-slate-400"
                  )}>
                    {group.fixtures.length} matches
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      
      {active && (
        <>
          <div className="flex items-center justify-between">
            <button
              onClick={() => setActiveIndex(i => Math.max(0, i - 1))}
              disabled={activeIndex === 0}
              className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 transition-colors hover:bg-slate-50 disabled:opacity-30"
            >
              <IconChevronLeft size={15} />
            </button>
            <div className="text-center">
              <p className="text-sm font-black text-slate-900">Round {active.round.name}</p>
              <p className="text-xs text-slate-400">
                {formatDateShort(active.fixtures.find(f => f.kickoffAt)?.kickoffAt ?? null)}
              </p>
            </div>
            <button
              onClick={() => setActiveIndex(i => Math.min(roundGroups.length - 1, i + 1))}
              disabled={activeIndex === roundGroups.length - 1}
              className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 transition-colors hover:bg-slate-50 disabled:opacity-30"
            >
              <IconChevronRight size={15} />
            </button>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {active.fixtures.map(fixture => (
              <DarkMatchCard key={fixture.id} fixture={fixture} />
            ))}
          </div>
        </>
      )}
    </div>
  )
}

const CompactMatchRow = ({ fixture }: { fixture: FixtureListItem }) => {
  const status = getMatchStatus(fixture)
  const showScore = status === "finished" || status === "live"
  const isLive = status === "live"

  return (
    <Link
      href={`/matches/${fixture.id}`}
      className="flex items-center gap-3 rounded-xl bg-slate-900/5 px-4 py-3 transition-colors hover:bg-slate-900/10 border border-slate-100"
    >
      <div className="flex min-w-0 flex-1 items-center gap-2.5">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center">
          {fixture.homeTeam?.imagePath
            ? <img src={fixture.homeTeam.imagePath} alt={fixture.homeTeam.name} className="h-6 w-6 object-contain" />
            : <IconShield size={16} className="text-slate-300" />
          }
        </div>
        <p className="min-w-0 truncate text-sm font-semibold text-slate-800">
          {fixture.homeTeam?.name ?? "Team"}
        </p>
      </div>

      <div className="w-24 shrink-0 text-center">
        {showScore ? (
          <span className="text-base font-black tabular-nums text-slate-900">
            {fixture.homeScore ?? 0} — {fixture.awayScore ?? 0}
          </span>
        ) : (
          <span className="text-sm font-bold text-slate-500">{formatKickoffTime(fixture.kickoffAt)}</span>
        )}
        {isLive && (
          <div className="mt-0.5 flex items-center justify-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" />
            <span className="text-[10px] font-semibold text-red-500">Live</span>
          </div>
        )}
        {status === "finished" && (
          <div className="mt-0.5 flex items-center justify-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            <span className="text-[10px] font-medium text-emerald-600">Finished</span>
          </div>
        )}
      </div>

      <div className="flex min-w-0 flex-1 flex-row-reverse items-center gap-2.5">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center">
          {fixture.awayTeam?.imagePath
            ? <img src={fixture.awayTeam.imagePath} alt={fixture.awayTeam.name} className="h-6 w-6 object-contain" />
            : <IconShield size={16} className="text-slate-300" />
          }
        </div>
        <p className="min-w-0 truncate text-right text-sm font-semibold text-slate-800">
          {fixture.awayTeam?.name ?? "Team"}
        </p>
      </div>
    </Link>
  )
}

const ProposalB = ({ roundGroups }: { roundGroups: RoundGroup[] }) => {
  const currentIndex = roundGroups.findIndex(g => g.round.isCurrent)
  const splitIndex = currentIndex >= 0 ? currentIndex : roundGroups.length - 1

  const activeGroups = roundGroups.slice(splitIndex)
  const pastGroups   = roundGroups.slice(0, splitIndex).reverse()

  const RoundSection = ({ group }: { group: RoundGroup }) => {
    const finished = group.fixtures.filter(f => getMatchStatus(f) === "finished").length
    const live     = group.fixtures.filter(f => getMatchStatus(f) === "live").length
    const upcoming = group.fixtures.filter(f => getMatchStatus(f) === "upcoming").length
    const firstKickoff = group.fixtures.find(f => f.kickoffAt)?.kickoffAt ?? null

    return (
      <div>
        <div className="mb-2 flex items-center justify-between gap-3 px-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-black text-slate-900">Round {group.round.name}</span>
            {firstKickoff && (
              <span className="text-xs text-slate-400">{formatDateShort(firstKickoff)}</span>
            )}
          </div>
          <div className="flex items-center gap-2 text-xs">
            {live > 0 && <span className="flex items-center gap-1 font-semibold text-red-500"><span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" />{live} live</span>}
            {finished > 0 && <span className="text-slate-400">{finished} finished</span>}
            {upcoming > 0 && <span className="text-slate-400">{upcoming} upcoming</span>}
          </div>
        </div>
        <div className="flex flex-col gap-1.5">
          {group.fixtures.map(fixture => (
            <CompactMatchRow key={fixture.id} fixture={fixture} />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      {activeGroups.map(group => <RoundSection key={group.round.id} group={group} />)}
      {pastGroups.length > 0 && (
        <>
          <div className="flex items-center gap-3">
            <div className="flex-1 border-t border-dashed border-slate-200" />
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Past rounds</span>
            <div className="flex-1 border-t border-dashed border-slate-200" />
          </div>
          {pastGroups.map(group => <RoundSection key={group.round.id} group={group} />)}
        </>
      )}
    </div>
  )
}

const ProposalC = ({ roundGroups }: { roundGroups: RoundGroup[] }) => {
  const [openRounds, setOpenRounds] = useState<Set<number>>(() => {
    const currentIndex = roundGroups.findIndex(g => g.round.isCurrent)
    const defaultIndex = currentIndex >= 0 ? currentIndex : roundGroups.length - 1
    return new Set(roundGroups.slice(defaultIndex).map(g => g.round.id))
  })

  const toggle = (roundId: number) =>
    setOpenRounds(prev => {
      const next = new Set(prev)
      if (next.has(roundId)) next.delete(roundId)
      else next.add(roundId)
      return next
    })

  const currentIndex = roundGroups.findIndex(g => g.round.isCurrent)
  const splitIndex = currentIndex >= 0 ? currentIndex : roundGroups.length - 1
  const activeGroups = roundGroups.slice(splitIndex)
  const pastGroups   = roundGroups.slice(0, splitIndex).reverse()

  const TimelineRound = ({ group, isPast = false }: { group: RoundGroup; isPast?: boolean }) => {
    const isOpen = openRounds.has(group.round.id)
    const finished = group.fixtures.filter(f => getMatchStatus(f) === "finished").length
    const live     = group.fixtures.filter(f => getMatchStatus(f) === "live").length
    const allDone  = finished === group.fixtures.length && group.fixtures.length > 0
    const firstKickoff = group.fixtures.find(f => f.kickoffAt)?.kickoffAt ?? null

    return (
      <div className="flex gap-4">
        
        <div className="flex flex-col items-center">
          <div className={cn(
            "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 text-[11px] font-black transition-colors",
            live > 0
              ? "border-red-400 bg-red-50 text-red-600"
              : allDone
              ? "border-emerald-400 bg-emerald-50 text-emerald-700"
              : isPast
              ? "border-slate-200 bg-white text-slate-400"
              : "border-slate-800 bg-slate-900 text-white"
          )}>
            {group.round.name}
          </div>
          {isOpen && (
            <div className={cn(
              "mt-1 flex-1 w-0.5 rounded-full",
              isPast ? "bg-slate-100" : "bg-slate-200"
            )} />
          )}
        </div>

        
        <div className="min-w-0 flex-1 pb-4">
          <button
            onClick={() => toggle(group.round.id)}
            className="mb-3 flex w-full items-center justify-between gap-3 text-left"
          >
            <div className="flex items-center gap-2">
              <span className={cn(
                "text-sm font-black",
                isPast ? "text-slate-500" : "text-slate-900"
              )}>
                Round {group.round.name}
              </span>
              {firstKickoff && (
                <span className="text-xs text-slate-400">{formatDateShort(firstKickoff)}</span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {live > 0 && (
                <span className="flex items-center gap-1 text-xs font-semibold text-red-500">
                  <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" />live
                </span>
              )}
              {!isOpen && allDone && (
                <span className="flex items-center gap-1 text-xs text-emerald-600 font-semibold">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />Finished
                </span>
              )}
              <IconChevronDown
                size={14}
                className={cn("text-slate-400 transition-transform duration-200", isOpen && "rotate-180")}
              />
            </div>
          </button>

          {isOpen && (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {group.fixtures.map(fixture => (
                <DarkMatchCard key={fixture.id} fixture={fixture} compact />
              ))}
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col">
      {activeGroups.map(group => (
        <TimelineRound key={group.round.id} group={group} />
      ))}
      {pastGroups.length > 0 && (
        <>
          <p className="mb-4 px-12 text-xs font-semibold uppercase tracking-wider text-slate-400">
            Past rounds
          </p>
          {pastGroups.map(group => (
            <TimelineRound key={group.round.id} group={group} isPast />
          ))}
        </>
      )}
    </div>
  )
}

const ProposalHeader = ({ letter, title, description }: { letter: string; title: string; description: string }) => (
  <div className="flex items-start gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-base font-black text-white">
      {letter}
    </div>
    <div>
      <p className="font-black text-slate-900">{title}</p>
      <p className="mt-0.5 text-sm text-slate-500">{description}</p>
    </div>
  </div>
)

interface ProposalsClientProps {
  allFixtures: FixtureListItem[]
  seasonName: string
}

const ProposalsClient = ({ allFixtures, seasonName }: ProposalsClientProps) => {
  const roundGroups = useMemo(() => {
    const fixtures = allFixtures.filter(f => f.stage?.isCurrent || !f.stage)
    const stageMap = new Map<number, number>()
    for (const f of allFixtures) {
      if (!f.stage || !f.round) continue
      stageMap.set(f.stage.id, (stageMap.get(f.stage.id) ?? 0) + 1)
    }
    const currentStageId = Array.from(stageMap.entries())
      .sort((a, b) => b[1] - a[1])[0]?.[0] ?? null

    const filtered = currentStageId
      ? allFixtures.filter(f => f.stage?.id === currentStageId)
      : allFixtures
    return buildRoundGroups(filtered)
  }, [allFixtures])

  return (
    <main className="min-h-svh bg-slate-50">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-8 px-6 py-8 sm:px-8">

        <div>
          <h1 className="text-2xl font-black text-slate-900">Design proposals · Matches</h1>
          <p className="mt-1 text-sm text-slate-500">
            Season {seasonName} · {roundGroups.length} rounds · Pick the format you like best
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <ProposalHeader
            letter="A"
            title="Tab navigation"
            description="One round at a time. Round pills on top with a status indicator, arrows to navigate. Clean and fast."
          />
          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
            <ProposalA roundGroups={roundGroups} />
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <ProposalHeader
            letter="B"
            title="Compact results list"
            description="All rounds visible. Compact rows in sports-scoreboard style: crest · name · result · name · crest."
          />
          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
            <ProposalB roundGroups={roundGroups} />
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <ProposalHeader
            letter="C"
            title="Vertical timeline"
            description="Each round is a step on a timeline. Circular indicator with the round number, dark cards when expanded."
          />
          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
            <ProposalC roundGroups={roundGroups} />
          </div>
        </div>

      </div>
    </main>
  )
}

export default ProposalsClient
