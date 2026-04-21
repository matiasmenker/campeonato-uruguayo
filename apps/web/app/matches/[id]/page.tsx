import { notFound } from "next/navigation"
import Link from "next/link"
import { IconArrowLeft, IconShieldFilled } from "@tabler/icons-react"
import { getFixture, getFixtureEvents, getFixtureLineups, type LineupPlayer, type FixtureEvent } from "@/lib/matches"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export const dynamic = "force-dynamic"

// ─── Constants ────────────────────────────────────────────────────────────────

const EVENT_GOAL        = 14
const EVENT_SUBSTITUTION = 18
const EVENT_YELLOW      = 19
const EVENT_RED         = 20
const EVENT_YELLOW_RED  = 21

// formationPosition grouping: 1=GK, 2-5=DEF, 6-8=MID, 9-11=FWD
const getFormationRow = (pos: number): number => {
  if (pos === 1) return 0
  if (pos <= 5) return 1
  if (pos <= 8) return 2
  return 3
}

// X positions (% from left) for each row — home team (left side)
const HOME_X = [5, 21, 36, 48]
// X positions for away team (right side, mirrored)
const AWAY_X = [95, 79, 64, 52]

// Y positions (% from top) for N players in a column
const yPositions = (count: number): number[] => {
  if (count === 1) return [50]
  if (count === 2) return [30, 70]
  if (count === 3) return [20, 50, 80]
  if (count === 4) return [16, 38, 62, 84]
  if (count === 5) return [12, 28, 50, 72, 88]
  return Array.from({ length: count }, (_, i) => 10 + (i * 80) / (count - 1))
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatKickoff = (kickoffAt: string | null): string => {
  if (!kickoffAt) return "TBD"
  const date = new Date(kickoffAt)
  const weekday = new Intl.DateTimeFormat("es-UY", { weekday: "long", timeZone: "America/Montevideo" }).format(date)
  const dayMonthYear = new Intl.DateTimeFormat("es-UY", {
    day: "2-digit", month: "2-digit", year: "numeric", timeZone: "America/Montevideo",
  }).format(date)
  return `${weekday.charAt(0).toUpperCase()}${weekday.slice(1)} ${dayMonthYear}`
}

const formatKickoffTime = (kickoffAt: string | null): string => {
  if (!kickoffAt) return "--:--"
  return new Intl.DateTimeFormat("es-UY", {
    hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "America/Montevideo",
  }).format(new Date(kickoffAt))
}

// ─── Sub-components ───────────────────────────────────────────────────────────

const PlayerAvatar = ({ player }: { player: LineupPlayer["player"] }) => {
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
    <svg viewBox="0 0 32 32" fill="none" className="h-full w-full bg-slate-600">
      <circle cx="16" cy="11" r="6" fill="#94a3b8" />
      <path d="M2 34c0-7.732 6.268-14 14-14s14 6.268 14 14" fill="#94a3b8" />
    </svg>
  )
}

const EventBadges = ({ events }: { events: FixtureEvent[] }) => {
  const goals   = events.filter(e => e.typeId === EVENT_GOAL)
  const yellows = events.filter(e => e.typeId === EVENT_YELLOW)
  const reds    = events.filter(e => e.typeId === EVENT_RED || e.typeId === EVENT_YELLOW_RED)
  const subs    = events.filter(e => e.typeId === EVENT_SUBSTITUTION)

  return (
    <div className="flex items-center justify-center gap-0.5 mb-0.5">
      {goals.map((g, i) => (
        <span key={i} className="text-[10px] leading-none">⚽</span>
      ))}
      {yellows.map((_, i) => (
        <span key={i} className="inline-block h-2.5 w-1.5 rounded-[1px] bg-yellow-400" />
      ))}
      {reds.map((_, i) => (
        <span key={i} className="inline-block h-2.5 w-1.5 rounded-[1px] bg-red-500" />
      ))}
      {subs.map((_, i) => (
        <span key={i} className="text-[10px] leading-none">🔄</span>
      ))}
    </div>
  )
}

interface PlayerTokenProps {
  player: LineupPlayer
  events: FixtureEvent[]
  x: number
  y: number
}

const PlayerToken = ({ player, events, x, y }: PlayerTokenProps) => {
  const name = player.player.displayName ?? player.player.name
  const shortName = name.split(" ").at(-1) ?? name

  return (
    <div
      className="absolute flex flex-col items-center gap-0.5"
      style={{
        left: `${x}%`,
        top:  `${y}%`,
        transform: "translate(-50%, -50%)",
        width: "52px",
      }}
    >
      <EventBadges events={events} />
      <div className="h-10 w-10 overflow-hidden rounded-full ring-2 ring-white/80 shadow-lg">
        <PlayerAvatar player={player.player} />
      </div>
      <div className="flex items-center gap-0.5 max-w-full">
        <span
          className="rounded px-1 py-px text-[9px] font-bold leading-tight text-white shadow"
          style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(2px)", maxWidth: "48px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
          title={name}
        >
          {shortName}
        </span>
        {player.jerseyNumber != null && (
          <span className="rounded px-1 py-px text-[9px] font-bold text-white leading-tight" style={{ background: "rgba(0,0,0,0.4)" }}>
            {player.jerseyNumber}
          </span>
        )}
      </div>
    </div>
  )
}

// ─── Pitch ────────────────────────────────────────────────────────────────────

interface PitchProps {
  homeLineup:  LineupPlayer[]
  awayLineup:  LineupPlayer[]
  eventsByPlayer: Map<number, FixtureEvent[]>
}

const Pitch = ({ homeLineup, awayLineup, eventsByPlayer }: PitchProps) => {
  const renderTeam = (lineup: LineupPlayer[], isHome: boolean) => {
    const starters = lineup
      .filter(p => p.formationPosition !== null)
      .sort((a, b) => (a.formationPosition ?? 0) - (b.formationPosition ?? 0))

    // Group by formation row
    const rows: LineupPlayer[][] = [[], [], [], []]
    for (const player of starters) {
      const row = getFormationRow(player.formationPosition!)
      rows[row].push(player)
    }

    const xPositions = isHome ? HOME_X : AWAY_X

    return rows.flatMap((rowPlayers, rowIndex) => {
      const yPos = yPositions(rowPlayers.length)
      return rowPlayers.map((player, playerIndex) => (
        <PlayerToken
          key={player.id}
          player={player}
          events={eventsByPlayer.get(player.player.id) ?? []}
          x={xPositions[rowIndex]}
          y={yPos[playerIndex]}
        />
      ))
    })
  }

  return (
    <div className="relative w-full overflow-hidden rounded-2xl shadow-lg" style={{ aspectRatio: "16/9" }}>
      {/* Pitch background image */}
      <img
        src="/pitch.avif"
        alt="Football pitch"
        className="absolute inset-0 h-full w-full object-cover"
      />

      {/* Player tokens */}
      <div className="absolute inset-0">
        {renderTeam(homeLineup, true)}
        {renderTeam(awayLineup, false)}
      </div>
    </div>
  )
}

// ─── Events timeline ──────────────────────────────────────────────────────────

const EventRow = ({ event }: { event: FixtureEvent }) => {
  const name = event.player?.displayName ?? event.player?.name ?? "—"
  const isGoal    = event.typeId === EVENT_GOAL
  const isYellow  = event.typeId === EVENT_YELLOW
  const isRed     = event.typeId === EVENT_RED || event.typeId === EVENT_YELLOW_RED
  const isSub     = event.typeId === EVENT_SUBSTITUTION

  if (!isGoal && !isYellow && !isRed && !isSub) return null

  const icon = isGoal ? "⚽" : isYellow ? "🟨" : isRed ? "🟥" : "🔄"

  return (
    <div className="flex items-center gap-3 py-2 border-b border-slate-100 last:border-0">
      <span className="text-base leading-none">{icon}</span>
      <span className="w-8 text-xs font-bold text-slate-400 tabular-nums">
        {event.minute != null ? `${event.minute}'` : "—"}
      </span>
      <span className="text-sm font-medium text-slate-900 flex-1">{name}</span>
      {event.result && (
        <span className="text-xs font-bold text-slate-500 tabular-nums">{event.result}</span>
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

  const [fixtureResult, eventsResult, lineupsResult] = await Promise.allSettled([
    getFixture(fixtureId),
    getFixtureEvents(fixtureId),
    getFixtureLineups(fixtureId),
  ])

  if (fixtureResult.status === "rejected") notFound()

  const fixture  = fixtureResult.value
  const events   = eventsResult.status   === "fulfilled" ? eventsResult.value   : []
  const lineups  = lineupsResult.status  === "fulfilled" ? lineupsResult.value  : []

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

  // Only goals and cards for the timeline (filter out subs for cleaner view)
  const keyEvents = events
    .filter(e => [EVENT_GOAL, EVENT_YELLOW, EVENT_RED, EVENT_YELLOW_RED].includes(e.typeId ?? -1))
    .sort((a, b) => (a.minute ?? 0) - (b.minute ?? 0))

  const hasLineups = homeLineup.some(p => p.formationPosition !== null) ||
                     awayLineup.some(p => p.formationPosition !== null)

  return (
    <main className="min-h-svh bg-[linear-gradient(180deg,#f8fafc_0%,#f8fafc_48%,#eef2f7_100%)]">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-6 py-8 sm:px-8 lg:px-10">

        {/* Hero */}
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

            {/* Back button */}
            <div className="absolute left-5 top-5">
              <Link
                href="/"
                className="flex items-center gap-1.5 rounded-xl border border-white/20 bg-white/10 py-2 pl-3 pr-4 text-sm font-medium text-white/80 backdrop-blur-sm transition-colors hover:bg-white/20 hover:text-white"
              >
                <IconArrowLeft size={15} />
                Back
              </Link>
            </div>

            {/* Stage / round */}
            {(fixture.stage || fixture.round) && (
              <div className="absolute right-5 top-5">
                <span className="rounded-xl border border-white/20 bg-white/10 px-3 py-2 text-xs font-semibold text-white/70 backdrop-blur-sm">
                  {fixture.stage?.name ?? ""}{fixture.round ? ` · Fecha ${fixture.round.name}` : ""}
                </span>
              </div>
            )}

            {/* Scoreboard */}
            <div className="absolute bottom-0 left-0 right-0 p-6">
              <div className="flex items-end justify-center gap-6">

                {/* Home team */}
                <div className="flex min-w-0 flex-1 flex-col items-end gap-2">
                  {homeTeam?.imagePath && (
                    <img src={homeTeam.imagePath} alt={homeTeam.name} className="h-16 w-16 object-contain drop-shadow-xl" />
                  )}
                  <Link href={`/teams/${homeTeam?.id}`} className="hover:opacity-80">
                    <h2 className="text-right text-xl font-black text-white leading-tight drop-shadow">{homeTeam?.name ?? "Home"}</h2>
                  </Link>
                </div>

                {/* Score */}
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

                {/* Away team */}
                <div className="flex min-w-0 flex-1 flex-col items-start gap-2">
                  {awayTeam?.imagePath && (
                    <img src={awayTeam.imagePath} alt={awayTeam.name} className="h-16 w-16 object-contain drop-shadow-xl" />
                  )}
                  <Link href={`/teams/${awayTeam?.id}`} className="hover:opacity-80">
                    <h2 className="text-left text-xl font-black text-white leading-tight drop-shadow">{awayTeam?.name ?? "Away"}</h2>
                  </Link>
                </div>

              </div>
            </div>
          </div>
        </div>

        {/* Pitch */}
        {hasLineups ? (
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2">
                {homeTeam?.imagePath && <img src={homeTeam.imagePath} alt={homeTeam.name} className="h-5 w-5 object-contain" />}
                <span className="text-sm font-bold text-slate-700">{homeTeam?.name}</span>
              </div>
              <span className="text-xs font-medium text-slate-400">Lineup</span>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-slate-700">{awayTeam?.name}</span>
                {awayTeam?.imagePath && <img src={awayTeam.imagePath} alt={awayTeam.name} className="h-5 w-5 object-contain" />}
              </div>
            </div>
            <Pitch homeLineup={homeLineup} awayLineup={awayLineup} eventsByPlayer={eventsByPlayer} />
          </div>
        ) : (
          <div className="flex h-36 items-center justify-center rounded-2xl border border-dashed border-slate-200 text-sm text-slate-400">
            Lineup not available for this match
          </div>
        )}

        {/* Key events timeline */}
        {keyEvents.length > 0 && (
          <div className="flex flex-col gap-3">
            <h2 className="px-1 text-sm font-bold text-slate-700">Match events</h2>
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
