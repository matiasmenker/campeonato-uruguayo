import { notFound } from "next/navigation"
import Link from "next/link"
import { IconArrowLeft, IconBallFootball, IconArrowsShuffle } from "@tabler/icons-react"
import {
  getFixture,
  getFixtureEvents,
  getFixtureLineups,
  getFixturePlayerRatings,
  getFixturePlayerAssists,
  type LineupPlayer,
  type FixtureEvent,
} from "@/lib/matches"

export const dynamic = "force-dynamic"

// ─── Event type IDs ───────────────────────────────────────────────────────────

const EVENT_GOAL         = 14
const EVENT_SUBSTITUTION = 18
const EVENT_YELLOW       = 19
const EVENT_RED          = 20
const EVENT_YELLOW_RED   = 21

// ─── Formation rows ───────────────────────────────────────────────────────────
// formationPosition: 1=GK, 2–5=DEF, 6–8=MID, 9–11=FWD

const getFormationRow = (pos: number): number => {
  if (pos === 1) return 0
  if (pos <= 5) return 1
  if (pos <= 8) return 2
  return 3
}

const HOME_X: Record<number, number> = { 0: 9, 1: 23, 2: 37, 3: 48 }
const AWAY_X: Record<number, number> = { 0: 91, 1: 77, 2: 63, 3: 52 }

const yPositions = (count: number): number[] => {
  if (count === 1) return [50]
  const top = 12
  const bot = 88
  const step = (bot - top) / (count - 1)
  return Array.from({ length: count }, (_, i) => top + i * step)
}

// ─── Rating helpers — same thresholds as player-card.tsx ─────────────────────
// ≥8.0 green · ≥7.0 celeste · ≥6.0 orange · <6.0 red

const ratingBg = (rating: number): string => {
  if (rating >= 8.0) return "#16a34a"  // green-600
  if (rating >= 7.0) return "#0ea5e9"  // sky-500 (celeste)
  if (rating >= 6.0) return "#ea580c"  // orange-600
  return "#dc2626"                      // red-600
}

const formatRating = (rating: number): string => {
  const s = rating.toFixed(1)
  return s.endsWith(".0") ? String(Math.round(rating)) : s
}

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
// Always white background, same circular crop

const PlayerAvatar = ({ player }: { player: LineupPlayer["player"] }) => {
  const name = player.displayName ?? player.name
  if (player.imagePath && !player.imagePath.includes("placeholder")) {
    return (
      <img
        src={player.imagePath}
        alt={name}
        className="h-full w-full object-cover object-top"
        style={{ background: "#fff" }}
      />
    )
  }
  return (
    <div className="h-full w-full flex items-end justify-center" style={{ background: "#fff" }}>
      <svg viewBox="0 0 40 48" fill="none" style={{ width: "90%", height: "90%" }}>
        <ellipse cx="20" cy="14" rx="9" ry="10" fill="#cbd5e1" />
        <path d="M1 48c0-10.493 8.507-19 19-19s19 8.507 19 19" fill="#cbd5e1" />
      </svg>
    </div>
  )
}

// ─── EventBadges ──────────────────────────────────────────────────────────────
// Always absolutely positioned inside a relative parent — no layout impact.

interface EventBadgesProps {
  events: FixtureEvent[]
  assists: number          // count of assist stats for this player
  offsetBottom?: number
}

// Small rectangle card (yellow / red)
const CardRect = ({ color }: { color: string }) => (
  <span style={{ display: "inline-block", width: 8, height: 11, borderRadius: 2, background: color, boxShadow: "0 1px 3px rgba(0,0,0,0.6)", flexShrink: 0 }} />
)

// Double card (yellow/red): two rectangles overlapping to signal it's one event
const DoubleCard = () => (
  <span className="relative inline-flex items-center" style={{ width: 13, height: 11 }}>
    <span style={{ position: "absolute", left: 0,  display: "inline-block", width: 8, height: 11, borderRadius: 2, background: "#facc15", boxShadow: "0 1px 3px rgba(0,0,0,0.5)" }} />
    <span style={{ position: "absolute", left: 5,  display: "inline-block", width: 8, height: 11, borderRadius: 2, background: "#ef4444", boxShadow: "0 1px 3px rgba(0,0,0,0.5)" }} />
  </span>
)

const EventBadges = ({ events, assists, offsetBottom = 0 }: EventBadgesProps) => {
  const goals      = events.filter(e => e.typeId === EVENT_GOAL).length
  const yellows    = events.filter(e => e.typeId === EVENT_YELLOW).length
  const yellowReds = events.filter(e => e.typeId === EVENT_YELLOW_RED).length
  const reds       = events.filter(e => e.typeId === EVENT_RED).length
  const subs       = events.filter(e => e.typeId === EVENT_SUBSTITUTION).length

  if (!goals && !assists && !yellows && !yellowReds && !reds && !subs) return null

  return (
    <div
      className="absolute flex items-center justify-center gap-1"
      style={{ bottom: `calc(100% + ${offsetBottom}px)`, left: "50%", transform: "translateX(-50%)", whiteSpace: "nowrap" }}
    >
      {/* Goal — native tabler icon */}
      {Array.from({ length: goals }).map((_, i) => (
        <IconBallFootball key={`g${i}`} size={13} color="#fff" style={{ filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.7))" }} />
      ))}
      {/* Assist — tabler icon in sky color */}
      {Array.from({ length: assists }).map((_, i) => (
        <IconBallFootball key={`a${i}`} size={13} color="#38bdf8" style={{ filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.7))" }} />
      ))}
      {/* Yellow card */}
      {Array.from({ length: yellows }).map((_, i)    => <CardRect key={`y${i}`}  color="#facc15" />)}
      {/* Yellow+Red (double yellow → red) */}
      {Array.from({ length: yellowReds }).map((_, i) => <DoubleCard key={`yr${i}`} />)}
      {/* Red card */}
      {Array.from({ length: reds }).map((_, i)       => <CardRect key={`r${i}`}  color="#ef4444" />)}
      {/* Substitution — tabler icon */}
      {Array.from({ length: subs }).map((_, i) => (
        <IconArrowsShuffle key={`s${i}`} size={12} color="#a3e635" style={{ filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.7))" }} />
      ))}
    </div>
  )
}

// ─── PlayerToken (pitch) ──────────────────────────────────────────────────────

interface PlayerTokenProps {
  player: LineupPlayer
  events: FixtureEvent[]
  rating: number | null
  assists: number
  x: number
  y: number
}

const PlayerToken = ({ player, events, rating, assists, x, y }: PlayerTokenProps) => {
  const fullName = player.player.displayName ?? player.player.name
  const parts = fullName.trim().split(/\s+/)
  const shortName = parts.length > 2 ? parts[parts.length - 1] : parts.slice(-2).join(" ")

  return (
    <div
      className="absolute flex flex-col items-center"
      style={{ left: `${x}%`, top: `${y}%`, transform: "translate(-50%,-50%)", width: 120, gap: 4 }}
    >
      {/* Avatar — event badges float above, no layout impact */}
      <div className="relative" style={{ width: 56, height: 56 }}>
        <EventBadges events={events} assists={assists} offsetBottom={2} />

        <div
          className="overflow-hidden rounded-full"
          style={{
            width: 56, height: 56,
            background: "#fff",
            border: "2.5px solid rgba(255,255,255,0.95)",
            boxShadow: "0 4px 14px rgba(0,0,0,0.6), 0 1px 4px rgba(0,0,0,0.4)",
          }}
        >
          <PlayerAvatar player={player.player} />
        </div>

        {/* Jersey number — no border */}
        {player.jerseyNumber != null && (
          <span
            className="absolute flex items-center justify-center rounded-full font-black text-white leading-none"
            style={{ width: 18, height: 18, fontSize: 8, bottom: -3, left: -3, background: "#0f172a", boxShadow: "0 1px 4px rgba(0,0,0,0.7)" }}
          >
            {player.jerseyNumber}
          </span>
        )}
      </div>

      {/* Name + rating — hero button style: rounded-xl, bg-white/10, backdrop-blur, NO border */}
      <div
        className="flex items-center gap-1.5 rounded-xl px-2.5 py-1"
        style={{ background: "rgba(0,0,0,0.52)", backdropFilter: "blur(6px)", maxWidth: 120 }}
      >
        <span
          className="text-white font-semibold leading-none"
          style={{ fontSize: 10, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flexShrink: 1, minWidth: 0 }}
          title={fullName}
        >
          {shortName}
        </span>
        <span
          className="flex items-center justify-center rounded font-black text-white leading-none shrink-0"
          style={{
            fontSize: 9,
            background: rating !== null ? ratingBg(rating) : "rgba(255,255,255,0.18)",
            minWidth: 22, height: 14,
            paddingLeft: 3, paddingRight: 3,
          }}
        >
          {rating !== null ? formatRating(rating) : "—"}
        </span>
      </div>
    </div>
  )
}

// ─── Pitch ────────────────────────────────────────────────────────────────────

interface PitchProps {
  homeLineup: LineupPlayer[]
  awayLineup: LineupPlayer[]
  eventsByPlayer: Map<number, FixtureEvent[]>
  ratingByPlayer: Map<number, number>
  assistsByPlayer: Map<number, number>
}

const Pitch = ({ homeLineup, awayLineup, eventsByPlayer, ratingByPlayer, assistsByPlayer }: PitchProps) => {
  const renderTeam = (lineup: LineupPlayer[], isHome: boolean) => {
    const starters = lineup
      .filter(p => p.formationPosition !== null)
      .sort((a, b) => (a.formationPosition ?? 0) - (b.formationPosition ?? 0))

    const rows: LineupPlayer[][] = [[], [], [], []]
    for (const player of starters) {
      rows[getFormationRow(player.formationPosition!)].push(player)
    }

    const xMap = isHome ? HOME_X : AWAY_X

    return rows.flatMap((rowPlayers, rowIndex) => {
      if (!rowPlayers.length) return []
      const yPos = yPositions(rowPlayers.length)
      return rowPlayers.map((player, playerIndex) => (
        <PlayerToken
          key={player.id}
          player={player}
          events={eventsByPlayer.get(player.player.id) ?? []}
          rating={ratingByPlayer.get(player.player.id) ?? null}
          assists={assistsByPlayer.get(player.player.id) ?? 0}
          x={xMap[rowIndex]}
          y={yPos[playerIndex]}
        />
      ))
    })
  }

  return (
    <div className="relative w-full overflow-hidden rounded-2xl shadow-xl" style={{ aspectRatio: "16/9" }}>
      <img src="/pitch.avif" alt="Campo de fútbol" className="absolute inset-0 h-full w-full object-cover" />
      <div className="absolute inset-0">
        {renderTeam(homeLineup, true)}
        {renderTeam(awayLineup, false)}
      </div>
    </div>
  )
}

// ─── BenchPlayer ─────────────────────────────────────────────────────────────

const BenchPlayer = ({
  player, events, rating, assists,
}: {
  player: LineupPlayer
  events: FixtureEvent[]
  rating: number | null
  assists: number
}) => {
  const name = player.player.displayName ?? player.player.name

  return (
    <div className="flex flex-col items-center gap-2" style={{ width: 76 }}>
      <div className="relative" style={{ width: 52, height: 52, marginTop: 16 }}>
        <EventBadges events={events} assists={assists} offsetBottom={2} />

        <div
          className="overflow-hidden rounded-full"
          style={{ width: 52, height: 52, background: "#fff", border: "2px solid #e2e8f0", boxShadow: "0 2px 8px rgba(0,0,0,0.12)" }}
        >
          <PlayerAvatar player={player.player} />
        </div>

        {/* Jersey — no border */}
        {player.jerseyNumber != null && (
          <span
            className="absolute flex items-center justify-center rounded-full font-black text-white leading-none"
            style={{ width: 17, height: 17, fontSize: 8, bottom: -2, left: -2, background: "#0f172a", boxShadow: "0 1px 3px rgba(0,0,0,0.4)" }}
          >
            {player.jerseyNumber}
          </span>
        )}
      </div>

      <span
        className="text-center text-slate-700 font-semibold leading-tight"
        style={{ fontSize: 10, maxWidth: 76, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
        title={name}
      >
        {name}
      </span>

      <span
        className="flex items-center justify-center rounded-md font-black text-white leading-none"
        style={{ fontSize: 10, background: rating !== null ? ratingBg(rating) : "#94a3b8", minWidth: 28, height: 16, paddingLeft: 5, paddingRight: 5, marginTop: -4 }}
      >
        {rating !== null ? formatRating(rating) : "—"}
      </span>
    </div>
  )
}

// ─── BenchSection ─────────────────────────────────────────────────────────────

interface BenchSectionProps {
  homeLineup: LineupPlayer[]
  awayLineup: LineupPlayer[]
  homeTeamName: string
  awayTeamName: string
  homeTeamImage: string | null
  awayTeamImage: string | null
  eventsByPlayer: Map<number, FixtureEvent[]>
  ratingByPlayer: Map<number, number>
  assistsByPlayer: Map<number, number>
}

const BenchSection = ({
  homeLineup, awayLineup,
  homeTeamName, awayTeamName,
  homeTeamImage, awayTeamImage,
  eventsByPlayer, ratingByPlayer, assistsByPlayer,
}: BenchSectionProps) => {
  const homeBench = homeLineup.filter(p => p.formationPosition === null)
  const awayBench = awayLineup.filter(p => p.formationPosition === null)
  if (!homeBench.length && !awayBench.length) return null

  const TeamBench = ({ bench, teamName, teamImage }: { bench: LineupPlayer[]; teamName: string; teamImage: string | null }) => (
    <div className="flex flex-1 flex-col gap-4 min-w-0">
      <div className="flex flex-col items-center gap-1">
        {teamImage && <img src={teamImage} alt={teamName} className="h-8 w-8 object-contain" />}
        <span className="text-xs font-bold text-slate-600">{teamName}</span>
      </div>
      <div className="flex flex-wrap justify-center gap-x-3 gap-y-5">
        {bench.map(player => (
          <BenchPlayer
            key={player.id}
            player={player}
            events={eventsByPlayer.get(player.player.id) ?? []}
            rating={ratingByPlayer.get(player.player.id) ?? null}
            assists={assistsByPlayer.get(player.player.id) ?? 0}
          />
        ))}
      </div>
    </div>
  )

  return (
    <div className="flex flex-col gap-3">
      <h2 className="px-1 text-sm font-bold text-slate-700">Banquillo</h2>
      <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
        <div className="flex gap-4">
          <TeamBench bench={homeBench} teamName={homeTeamName} teamImage={homeTeamImage} />
          <div className="w-px bg-slate-100 shrink-0" />
          <TeamBench bench={awayBench} teamName={awayTeamName} teamImage={awayTeamImage} />
        </div>
      </div>
    </div>
  )
}

// ─── EventRow ─────────────────────────────────────────────────────────────────

const EventRowIcon = ({ typeId }: { typeId: number | null }) => {
  if (typeId === EVENT_GOAL)
    return <IconBallFootball size={16} className="text-slate-700 shrink-0" />
  if (typeId === EVENT_SUBSTITUTION)
    return <IconArrowsShuffle size={16} className="text-emerald-500 shrink-0" />
  if (typeId === EVENT_YELLOW)
    return <span style={{ display: "inline-block", width: 11, height: 15, borderRadius: 2, background: "#facc15", flexShrink: 0 }} />
  if (typeId === EVENT_RED)
    return <span style={{ display: "inline-block", width: 11, height: 15, borderRadius: 2, background: "#ef4444", flexShrink: 0 }} />
  if (typeId === EVENT_YELLOW_RED)
    return (
      <span className="relative inline-flex items-center shrink-0" style={{ width: 18, height: 15 }}>
        <span style={{ position: "absolute", left: 0, width: 11, height: 15, borderRadius: 2, background: "#facc15" }} />
        <span style={{ position: "absolute", left: 7, width: 11, height: 15, borderRadius: 2, background: "#ef4444" }} />
      </span>
    )
  return <span className="text-slate-400 shrink-0">•</span>
}

const EventRow = ({ event }: { event: FixtureEvent }) => {
  const name = event.player?.displayName ?? event.player?.name ?? "—"
  const relevant = [EVENT_GOAL, EVENT_YELLOW, EVENT_RED, EVENT_YELLOW_RED, EVENT_SUBSTITUTION]
  if (!relevant.includes(event.typeId ?? -1)) return null

  return (
    <div className="flex items-center gap-3 py-2.5 border-b border-slate-100 last:border-0">
      <div className="flex w-5 items-center justify-center shrink-0">
        <EventRowIcon typeId={event.typeId} />
      </div>
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

  const [fixtureResult, eventsResult, lineupsResult, ratingsResult, assistsResult] = await Promise.allSettled([
    getFixture(fixtureId),
    getFixtureEvents(fixtureId),
    getFixtureLineups(fixtureId),
    getFixturePlayerRatings(fixtureId),
    getFixturePlayerAssists(fixtureId),
  ])

  if (fixtureResult.status === "rejected") notFound()

  const fixture  = fixtureResult.value
  const events   = eventsResult.status   === "fulfilled" ? eventsResult.value   : []
  const lineups  = lineupsResult.status  === "fulfilled" ? lineupsResult.value  : []
  const ratings  = ratingsResult.status  === "fulfilled" ? ratingsResult.value  : []
  const assists  = assistsResult.status  === "fulfilled" ? assistsResult.value  : []

  const homeTeam   = fixture.homeTeam
  const awayTeam   = fixture.awayTeam
  const isFinished = fixture.homeScore !== null && fixture.awayScore !== null

  const homeLineup = lineups.filter(p => p.team?.id === homeTeam?.id)
  const awayLineup = lineups.filter(p => p.team?.id === awayTeam?.id)

  const eventsByPlayer = new Map<number, FixtureEvent[]>()
  for (const event of events) {
    if (!event.player) continue
    const existing = eventsByPlayer.get(event.player.id) ?? []
    existing.push(event)
    eventsByPlayer.set(event.player.id, existing)
  }

  const ratingByPlayer = new Map<number, number>()
  for (const stat of ratings) {
    const value = stat.value.normalizedValue
    if (typeof value === "number") ratingByPlayer.set(stat.player.id, value)
  }

  // Assists: value is the count (1 assist = 1)
  const assistsByPlayer = new Map<number, number>()
  for (const stat of assists) {
    const value = stat.value.normalizedValue
    if (typeof value === "number" && value > 0) assistsByPlayer.set(stat.player.id, value)
  }

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

        {/* ── Pitch header ──────────────────────────────────────────────────── */}
        {hasLineups && (
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              {homeTeam?.imagePath && <img src={homeTeam.imagePath} alt={homeTeam?.name ?? ""} className="h-5 w-5 object-contain" />}
              <span className="text-sm font-bold text-slate-700">{homeTeam?.name}</span>
            </div>
            <span className="text-xs font-medium text-slate-400">Alineación</span>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-slate-700">{awayTeam?.name}</span>
              {awayTeam?.imagePath && <img src={awayTeam.imagePath} alt={awayTeam?.name ?? ""} className="h-5 w-5 object-contain" />}
            </div>
          </div>
        )}

        {/* ── Pitch ─────────────────────────────────────────────────────────── */}
        {hasLineups ? (
          <Pitch
            homeLineup={homeLineup}
            awayLineup={awayLineup}
            eventsByPlayer={eventsByPlayer}
            ratingByPlayer={ratingByPlayer}
            assistsByPlayer={assistsByPlayer}
          />
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
          assistsByPlayer={assistsByPlayer}
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
