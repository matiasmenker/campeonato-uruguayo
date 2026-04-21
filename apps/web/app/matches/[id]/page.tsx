import { notFound } from "next/navigation"
import Link from "next/link"
import { IconArrowLeft } from "@tabler/icons-react"
import {
  getFixture,
  getFixtureEvents,
  getFixtureLineups,
  getFixturePlayerStats,
  STAT_TYPE_RATING,
  type LineupPlayer,
  type FixtureEvent,
  type FixturePlayerStat,
} from "@/lib/matches"

export const dynamic = "force-dynamic"

// ─── Event type IDs ───────────────────────────────────────────────────────────

const EVENT_GOAL         = 14
const EVENT_SUBSTITUTION = 18
const EVENT_YELLOW       = 19
const EVENT_RED          = 20
const EVENT_YELLOW_RED   = 21

// ─── Formation position grouping ─────────────────────────────────────────────
// formationPosition: 1=GK, 2–5=DEF, 6–8=MID, 9–11=FWD

const getFormationRow = (pos: number): number => {
  if (pos === 1) return 0
  if (pos <= 5) return 1
  if (pos <= 8) return 2
  return 3
}

const HOME_X = [5, 22, 38, 50]
const AWAY_X = [95, 78, 62, 50]

const yPositions = (count: number): number[] => {
  if (count === 1) return [50]
  if (count === 2) return [30, 70]
  if (count === 3) return [20, 50, 80]
  if (count === 4) return [14, 38, 62, 86]
  if (count === 5) return [10, 27, 50, 73, 90]
  return Array.from({ length: count }, (_, i) => 10 + (i * 80) / (count - 1))
}

// ─── Score helpers ────────────────────────────────────────────────────────────

const ratingColor = (rating: number): string => {
  if (rating >= 7) return "#22c55e"   // green
  if (rating >= 5) return "#f97316"   // orange
  return "#ef4444"                     // red
}

const formatRating = (rating: number): string => rating.toFixed(1).replace(".0", "")

// ─── Date helpers ─────────────────────────────────────────────────────────────

const formatKickoff = (kickoffAt: string | null): string => {
  if (!kickoffAt) return "TBD"
  const date = new Date(kickoffAt)
  const weekday = new Intl.DateTimeFormat("es-UY", { weekday: "long", timeZone: "America/Montevideo" }).format(date)
  const rest = new Intl.DateTimeFormat("es-UY", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: "America/Montevideo" }).format(date)
  return `${weekday.charAt(0).toUpperCase()}${weekday.slice(1)} ${rest}`
}

const formatKickoffTime = (kickoffAt: string | null): string => {
  if (!kickoffAt) return "--:--"
  return new Intl.DateTimeFormat("es-UY", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "America/Montevideo" }).format(new Date(kickoffAt))
}

// ─── PlayerAvatar ─────────────────────────────────────────────────────────────

const PlayerAvatar = ({ player, size = 44 }: { player: LineupPlayer["player"]; size?: number }) => {
  const name = player.displayName ?? player.name
  if (player.imagePath && !player.imagePath.includes("placeholder")) {
    return (
      <img
        src={player.imagePath}
        alt={name}
        className="h-full w-full object-cover object-top"
      />
    )
  }
  return (
    <svg viewBox="0 0 32 32" fill="none" className="h-full w-full" style={{ background: "#475569" }}>
      <circle cx="16" cy="11" r="6" fill="#94a3b8" />
      <path d="M2 34c0-7.732 6.268-14 14-14s14 6.268 14 14" fill="#94a3b8" />
    </svg>
  )
}

// ─── EventIcons ───────────────────────────────────────────────────────────────

const EventIcons = ({ events }: { events: FixtureEvent[] }) => {
  const goals   = events.filter(e => e.typeId === EVENT_GOAL)
  const yellows = events.filter(e => e.typeId === EVENT_YELLOW)
  const reds    = events.filter(e => e.typeId === EVENT_RED || e.typeId === EVENT_YELLOW_RED)
  const subs    = events.filter(e => e.typeId === EVENT_SUBSTITUTION)

  if (!goals.length && !yellows.length && !reds.length && !subs.length) return null

  return (
    <div className="flex items-center justify-center gap-0.5 mb-0.5 flex-wrap">
      {goals.map((_, i) => (
        <span key={`g${i}`} style={{ fontSize: 11, lineHeight: 1 }}>⚽</span>
      ))}
      {yellows.map((_, i) => (
        <span key={`y${i}`} className="inline-block rounded-[2px] bg-yellow-400" style={{ width: 7, height: 10 }} />
      ))}
      {reds.map((_, i) => (
        <span key={`r${i}`} className="inline-block rounded-[2px] bg-red-500" style={{ width: 7, height: 10 }} />
      ))}
      {subs.map((_, i) => (
        <span key={`s${i}`} style={{ fontSize: 10, lineHeight: 1 }}>🔄</span>
      ))}
    </div>
  )
}

// ─── PlayerToken (on pitch) ───────────────────────────────────────────────────

interface PlayerTokenProps {
  player: LineupPlayer
  events: FixtureEvent[]
  rating: number | null
  x: number
  y: number
}

const PlayerToken = ({ player, events, rating, x, y }: PlayerTokenProps) => {
  const fullName = player.player.displayName ?? player.player.name
  // Use last name only for compactness on the pitch
  const parts = fullName.trim().split(" ")
  const displayName = parts.length > 1 ? parts[parts.length - 1] : fullName

  return (
    <div
      className="absolute flex flex-col items-center"
      style={{
        left: `${x}%`,
        top: `${y}%`,
        transform: "translate(-50%, -50%)",
        width: 64,
        gap: 2,
      }}
    >
      <EventIcons events={events} />

      {/* Avatar with jersey number badge */}
      <div className="relative">
        <div
          className="overflow-hidden rounded-full ring-2 ring-white/90 shadow-lg"
          style={{ width: 44, height: 44 }}
        >
          <PlayerAvatar player={player.player} />
        </div>

        {/* Jersey number — bottom left */}
        {player.jerseyNumber != null && (
          <span
            className="absolute -bottom-1 -left-1 flex items-center justify-center rounded-full text-white font-black leading-none"
            style={{ width: 16, height: 16, fontSize: 8, background: "rgba(0,0,0,0.75)", border: "1px solid rgba(255,255,255,0.4)" }}
          >
            {player.jerseyNumber}
          </span>
        )}

        {/* Rating — bottom right */}
        {rating !== null && (
          <span
            className="absolute -bottom-1 -right-1 flex items-center justify-center rounded-full text-white font-black leading-none"
            style={{ width: 18, height: 18, fontSize: 8, background: ratingColor(rating) }}
          >
            {formatRating(rating)}
          </span>
        )}
      </div>

      {/* Name label */}
      <span
        className="text-center text-white font-semibold leading-tight max-w-full"
        style={{
          fontSize: 9,
          textShadow: "0 1px 3px rgba(0,0,0,0.9), 0 0 6px rgba(0,0,0,0.8)",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
          maxWidth: 64,
        }}
      >
        {displayName}
      </span>
    </div>
  )
}

// ─── Pitch ────────────────────────────────────────────────────────────────────

interface PitchProps {
  homeLineup: LineupPlayer[]
  awayLineup: LineupPlayer[]
  eventsByPlayer: Map<number, FixtureEvent[]>
  ratingByPlayer: Map<number, number>
}

const Pitch = ({ homeLineup, awayLineup, eventsByPlayer, ratingByPlayer }: PitchProps) => {
  const renderTeam = (lineup: LineupPlayer[], isHome: boolean) => {
    const starters = lineup
      .filter(p => p.formationPosition !== null)
      .sort((a, b) => (a.formationPosition ?? 0) - (b.formationPosition ?? 0))

    const rows: LineupPlayer[][] = [[], [], [], []]
    for (const player of starters) {
      rows[getFormationRow(player.formationPosition!)].push(player)
    }

    const xPositions = isHome ? HOME_X : AWAY_X

    return rows.flatMap((rowPlayers, rowIndex) => {
      const yPos = yPositions(rowPlayers.length)
      return rowPlayers.map((player, playerIndex) => (
        <PlayerToken
          key={player.id}
          player={player}
          events={eventsByPlayer.get(player.player.id) ?? []}
          rating={ratingByPlayer.get(player.player.id) ?? null}
          x={xPositions[rowIndex]}
          y={yPos[playerIndex]}
        />
      ))
    })
  }

  return (
    <div className="relative w-full overflow-hidden rounded-2xl shadow-lg" style={{ aspectRatio: "16/9" }}>
      <img src="/pitch.avif" alt="Football pitch" className="absolute inset-0 h-full w-full object-cover" />
      <div className="absolute inset-0">
        {renderTeam(homeLineup, true)}
        {renderTeam(awayLineup, false)}
      </div>
    </div>
  )
}

// ─── BenchPlayer card ─────────────────────────────────────────────────────────

interface BenchPlayerCardProps {
  player: LineupPlayer
  events: FixtureEvent[]
  rating: number | null
}

const BenchPlayerCard = ({ player, events, rating }: BenchPlayerCardProps) => {
  const name = player.player.displayName ?? player.player.name

  return (
    <div className="flex flex-col items-center gap-1" style={{ width: 72 }}>
      <EventIcons events={events} />
      <div className="relative">
        <div className="overflow-hidden rounded-full ring-2 ring-slate-200 shadow" style={{ width: 48, height: 48 }}>
          <PlayerAvatar player={player.player} />
        </div>
        {player.jerseyNumber != null && (
          <span
            className="absolute -bottom-1 -left-1 flex items-center justify-center rounded-full text-white font-black leading-none"
            style={{ width: 16, height: 16, fontSize: 8, background: "rgba(15,23,42,0.75)", border: "1px solid rgba(255,255,255,0.3)" }}
          >
            {player.jerseyNumber}
          </span>
        )}
        {rating !== null && (
          <span
            className="absolute -bottom-1 -right-1 flex items-center justify-center rounded-full text-white font-black leading-none"
            style={{ width: 18, height: 18, fontSize: 8, background: ratingColor(rating) }}
          >
            {formatRating(rating)}
          </span>
        )}
      </div>
      <span className="text-center text-[10px] font-medium text-slate-700 leading-tight max-w-full" style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 72 }}>
        {name}
      </span>
    </div>
  )
}

// ─── Bench section ────────────────────────────────────────────────────────────

interface BenchProps {
  homeLineup: LineupPlayer[]
  awayLineup: LineupPlayer[]
  homeTeamName: string
  awayTeamName: string
  homeTeamImage: string | null
  awayTeamImage: string | null
  eventsByPlayer: Map<number, FixtureEvent[]>
  ratingByPlayer: Map<number, number>
}

const BenchSection = ({
  homeLineup, awayLineup,
  homeTeamName, awayTeamName,
  homeTeamImage, awayTeamImage,
  eventsByPlayer, ratingByPlayer,
}: BenchProps) => {
  const homeBench = homeLineup.filter(p => p.formationPosition === null)
  const awayBench = awayLineup.filter(p => p.formationPosition === null)

  if (!homeBench.length && !awayBench.length) return null

  const TeamBench = ({ bench, teamName, teamImage }: { bench: LineupPlayer[]; teamName: string; teamImage: string | null }) => (
    <div className="flex flex-1 flex-col gap-4">
      {/* Team header */}
      <div className="flex flex-col items-center gap-1">
        {teamImage && (
          <img src={teamImage} alt={teamName} className="h-9 w-9 object-contain" />
        )}
        <span className="text-sm font-bold text-slate-700">{teamName}</span>
      </div>
      {/* Players grid */}
      <div className="flex flex-wrap justify-center gap-x-4 gap-y-4">
        {bench.map(player => (
          <BenchPlayerCard
            key={player.id}
            player={player}
            events={eventsByPlayer.get(player.player.id) ?? []}
            rating={ratingByPlayer.get(player.player.id) ?? null}
          />
        ))}
      </div>
    </div>
  )

  return (
    <div className="flex flex-col gap-3">
      <h2 className="px-1 text-sm font-bold text-slate-700">Banquillo</h2>
      <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
        <div className="flex gap-6 divide-x divide-slate-100">
          <TeamBench bench={homeBench} teamName={homeTeamName} teamImage={homeTeamImage} />
          <div className="pl-6 flex-1">
            <TeamBench bench={awayBench} teamName={awayTeamName} teamImage={awayTeamImage} />
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Events timeline ──────────────────────────────────────────────────────────

const eventIcon = (typeId: number | null): string => {
  if (typeId === EVENT_GOAL)         return "⚽"
  if (typeId === EVENT_YELLOW)       return "🟨"
  if (typeId === EVENT_RED)          return "🟥"
  if (typeId === EVENT_YELLOW_RED)   return "🟥"
  if (typeId === EVENT_SUBSTITUTION) return "🔄"
  return "•"
}

const EventRow = ({ event }: { event: FixtureEvent }) => {
  const name = event.player?.displayName ?? event.player?.name ?? "—"
  const relevantTypes = [EVENT_GOAL, EVENT_YELLOW, EVENT_RED, EVENT_YELLOW_RED, EVENT_SUBSTITUTION]
  if (!relevantTypes.includes(event.typeId ?? -1)) return null

  return (
    <div className="flex items-center gap-3 py-2.5 border-b border-slate-100 last:border-0">
      <span className="text-base leading-none">{eventIcon(event.typeId)}</span>
      <span className="w-9 text-xs font-bold text-slate-400 tabular-nums shrink-0">
        {event.minute != null ? `${event.minute}'` : "—"}
      </span>
      <span className="text-sm font-medium text-slate-900 flex-1 min-w-0 truncate">{name}</span>
      {event.result && (
        <span className="text-xs font-bold text-slate-500 tabular-nums shrink-0">{event.result}</span>
      )}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

interface MatchPageProps {
  params: Promise<{ id: string }>
}

const MatchPage = async ({ params }: MatchPageProps) => {
  const { id } = await params
  const fixtureId = Number(id)
  if (isNaN(fixtureId)) notFound()

  const [fixtureResult, eventsResult, lineupsResult, statsResult] = await Promise.allSettled([
    getFixture(fixtureId),
    getFixtureEvents(fixtureId),
    getFixtureLineups(fixtureId),
    getFixturePlayerStats(fixtureId),
  ])

  if (fixtureResult.status === "rejected") notFound()

  const fixture = fixtureResult.value
  const events  = eventsResult.status  === "fulfilled" ? eventsResult.value  : []
  const lineups = lineupsResult.status === "fulfilled" ? lineupsResult.value : []
  const stats   = statsResult.status   === "fulfilled" ? statsResult.value   : []

  const homeTeam = fixture.homeTeam
  const awayTeam = fixture.awayTeam
  const isFinished = fixture.homeScore !== null && fixture.awayScore !== null

  // Split lineups by team
  const homeLineup = lineups.filter(p => p.team?.id === homeTeam?.id)
  const awayLineup = lineups.filter(p => p.team?.id === awayTeam?.id)

  // Events indexed by player id
  const eventsByPlayer = new Map<number, FixtureEvent[]>()
  for (const event of events) {
    if (!event.player) continue
    const existing = eventsByPlayer.get(event.player.id) ?? []
    existing.push(event)
    eventsByPlayer.set(event.player.id, existing)
  }

  // Ratings indexed by player id (typeId 118 = SofaScore rating)
  const ratingByPlayer = new Map<number, number>()
  for (const stat of stats) {
    if (stat.typeId === STAT_TYPE_RATING) {
      const value = stat.value.normalizedValue
      if (typeof value === "number") {
        ratingByPlayer.set(stat.player.id, value)
      }
    }
  }

  // Key events for timeline
  const keyEvents = events
    .filter(e => [EVENT_GOAL, EVENT_YELLOW, EVENT_RED, EVENT_YELLOW_RED, EVENT_SUBSTITUTION].includes(e.typeId ?? -1))
    .sort((a, b) => (a.minute ?? 0) - (b.minute ?? 0))

  const hasLineups = lineups.some(p => p.formationPosition !== null)

  return (
    <main className="min-h-svh bg-[linear-gradient(180deg,#f8fafc_0%,#f8fafc_48%,#eef2f7_100%)]">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-6 py-8 sm:px-8 lg:px-10">

        {/* ── Hero ──────────────────────────────────────────────────────────── */}
        <div className="overflow-hidden rounded-2xl shadow-lg">
          <div
            className="relative min-h-52 bg-slate-900"
            style={
              fixture.venue?.imagePath
                ? { backgroundImage: `url(${fixture.venue.imagePath})`, backgroundSize: "cover", backgroundPosition: "center 40%" }
                : undefined
            }
          >
            <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/60 to-black/85" />

            <div className="absolute left-5 top-5">
              <Link
                href="/"
                className="flex items-center gap-1.5 rounded-xl border border-white/20 bg-white/10 py-2 pl-3 pr-4 text-sm font-medium text-white/80 backdrop-blur-sm transition-colors hover:bg-white/20 hover:text-white"
              >
                <IconArrowLeft size={15} />
                Volver
              </Link>
            </div>

            {(fixture.stage || fixture.round) && (
              <div className="absolute right-5 top-5">
                <span className="rounded-xl border border-white/20 bg-white/10 px-3 py-2 text-xs font-semibold text-white/70 backdrop-blur-sm">
                  {fixture.stage?.name ?? ""}{fixture.round ? ` · Fecha ${fixture.round.name}` : ""}
                </span>
              </div>
            )}

            <div className="absolute bottom-0 left-0 right-0 p-6">
              <div className="flex items-end justify-center gap-6">

                <div className="flex min-w-0 flex-1 flex-col items-end gap-2">
                  {homeTeam?.imagePath && (
                    <img src={homeTeam.imagePath} alt={homeTeam.name} className="h-16 w-16 object-contain drop-shadow-xl" />
                  )}
                  <Link href={`/teams/${homeTeam?.id}`} className="hover:opacity-80">
                    <h2 className="text-right text-xl font-black text-white leading-tight drop-shadow">{homeTeam?.name ?? "Local"}</h2>
                  </Link>
                </div>

                <div className="flex shrink-0 flex-col items-center gap-1 pb-1">
                  {isFinished ? (
                    <p className="text-5xl font-black tabular-nums text-white drop-shadow-lg leading-none">
                      {fixture.homeScore} – {fixture.awayScore}
                    </p>
                  ) : (
                    <p className="text-3xl font-black tabular-nums text-white drop-shadow-lg leading-none">
                      {formatKickoffTime(fixture.kickoffAt)}
                    </p>
                  )}
                  <p className="text-xs font-medium text-white/60">{formatKickoff(fixture.kickoffAt)}</p>
                  {fixture.venue?.name && (
                    <p className="text-xs text-white/50">{fixture.venue.name}</p>
                  )}
                </div>

                <div className="flex min-w-0 flex-1 flex-col items-start gap-2">
                  {awayTeam?.imagePath && (
                    <img src={awayTeam.imagePath} alt={awayTeam.name} className="h-16 w-16 object-contain drop-shadow-xl" />
                  )}
                  <Link href={`/teams/${awayTeam?.id}`} className="hover:opacity-80">
                    <h2 className="text-left text-xl font-black text-white leading-tight drop-shadow">{awayTeam?.name ?? "Visitante"}</h2>
                  </Link>
                </div>

              </div>
            </div>
          </div>
        </div>

        {/* ── Pitch ─────────────────────────────────────────────────────────── */}
        {hasLineups ? (
          <div className="flex flex-col gap-3">
            {/* Team labels */}
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2">
                {homeTeam?.imagePath && <img src={homeTeam.imagePath} alt={homeTeam.name} className="h-5 w-5 object-contain" />}
                <span className="text-sm font-bold text-slate-700">{homeTeam?.name}</span>
              </div>
              <span className="text-xs font-medium text-slate-400">Alineación</span>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-slate-700">{awayTeam?.name}</span>
                {awayTeam?.imagePath && <img src={awayTeam.imagePath} alt={awayTeam.name} className="h-5 w-5 object-contain" />}
              </div>
            </div>
            <Pitch
              homeLineup={homeLineup}
              awayLineup={awayLineup}
              eventsByPlayer={eventsByPlayer}
              ratingByPlayer={ratingByPlayer}
            />
          </div>
        ) : (
          <div className="flex h-36 items-center justify-center rounded-2xl border border-dashed border-slate-200 text-sm text-slate-400">
            Alineación no disponible para este partido
          </div>
        )}

        {/* ── Bench ─────────────────────────────────────────────────────────── */}
        <BenchSection
          homeLineup={homeLineup}
          awayLineup={awayLineup}
          homeTeamName={homeTeam?.name ?? "Local"}
          awayTeamName={awayTeam?.name ?? "Visitante"}
          homeTeamImage={homeTeam?.imagePath ?? null}
          awayTeamImage={awayTeam?.imagePath ?? null}
          eventsByPlayer={eventsByPlayer}
          ratingByPlayer={ratingByPlayer}
        />

        {/* ── Events timeline ────────────────────────────────────────────────── */}
        {keyEvents.length > 0 && (
          <div className="flex flex-col gap-3">
            <h2 className="px-1 text-sm font-bold text-slate-700">Eventos del partido</h2>
            <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white px-5 shadow-sm">
              {keyEvents.map(event => (
                <EventRow key={event.id} event={event} />
              ))}
            </div>
          </div>
        )}

      </div>
    </main>
  )
}

export default MatchPage
