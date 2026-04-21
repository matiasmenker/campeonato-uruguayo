import { notFound } from "next/navigation"
import Link from "next/link"
import { IconArrowLeft, IconArrowUp, IconArrowDown } from "@tabler/icons-react"
import {
  getFixture,
  getFixtureEvents,
  getFixtureLineups,
  getFixturePlayerRatings,
  getFixturePlayerAssists,
  type LineupPlayer,
  type FixtureEvent,
} from "@/lib/matches"
import { getRatingFill } from "@/lib/rating"

export const dynamic = "force-dynamic"

// ─── Event type IDs ───────────────────────────────────────────────────────────

const EVENT_GOAL         = 14
const EVENT_SUBSTITUTION = 18
const EVENT_YELLOW       = 19
const EVENT_RED          = 20
const EVENT_YELLOW_RED   = 21

// ─── Formation helpers ────────────────────────────────────────────────────────

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
  const step = (88 - 12) / (count - 1)
  return Array.from({ length: count }, (_, i) => 12 + i * step)
}

const formatRating = (rating: number): string => {
  const s = rating.toFixed(1)
  return s.endsWith(".0") ? String(Math.round(rating)) : s
}

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

// ─── Substitution pairing ─────────────────────────────────────────────────────
// SportMonks sends consecutive events (by sortOrder) at the same minute as pairs.
// First of pair = player going OUT, second = player coming IN.

interface SubstitutionPair {
  minute: number | null
  extraMinute: number | null
  playerOut: FixtureEvent["player"]
  playerIn: FixtureEvent["player"] | null  // null when data is incomplete
}

const buildSubstitutionPairs = (events: FixtureEvent[]): SubstitutionPair[] => {
  const subs = events
    .filter(e => e.typeId === EVENT_SUBSTITUTION)
    .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))

  const pairs: SubstitutionPair[] = []
  let i = 0
  while (i < subs.length) {
    const current = subs[i]
    const next = subs[i + 1]
    // Pair if the next event is at the same minute and consecutive sortOrder
    if (next && current.minute === next.minute) {
      pairs.push({ minute: current.minute, extraMinute: current.extraMinute, playerOut: current.player, playerIn: next.player })
      i += 2
    } else {
      pairs.push({ minute: current.minute, extraMinute: current.extraMinute, playerOut: current.player, playerIn: null })
      i += 1
    }
  }
  return pairs
}

// ─── Shared player silhouette ─────────────────────────────────────────────────

const PlayerSilhouette = ({ size }: { size: number }) => (
  <div style={{ width: size, height: size, background: "#f1f5f9", borderRadius: "50%", display: "flex", alignItems: "flex-end", justifyContent: "center", overflow: "hidden", flexShrink: 0 }}>
    <svg viewBox="0 0 40 46" fill="none" style={{ width: "78%", height: "78%" }}>
      <ellipse cx="20" cy="13" rx="9" ry="10" fill="#cbd5e1" />
      <path d="M0 46c0-11.046 8.954-20 20-20s20 8.954 20 20" fill="#cbd5e1" />
    </svg>
  </div>
)

const PlayerAvatar = ({ player, size }: { player: LineupPlayer["player"]; size: number }) => {
  if (player.imagePath && !player.imagePath.includes("placeholder")) {
    return (
      <img
        src={player.imagePath}
        alt={player.displayName ?? player.name}
        style={{ width: size, height: size, objectFit: "cover", objectPosition: "top", borderRadius: "50%", background: "#fff", flexShrink: 0 }}
      />
    )
  }
  return <PlayerSilhouette size={size} />
}

// ─── Event icon SVGs ──────────────────────────────────────────────────────────

// Football (goal) — no border, flat
const BallIcon = ({ size = 14 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="10" fill="#1a1a1a" />
    <polygon points="12,4 14.5,8.5 19.5,8.5 15.5,12 17,17 12,13.5 7,17 8.5,12 4.5,8.5 9.5,8.5" fill="#fff" opacity="0.15" />
    <path d="M12 4.5 L14 8 L18.5 9 L15 13 L16 18 L12 15.5 L8 18 L9 13 L5.5 9 L10 8 Z" fill="none" stroke="#fff" strokeWidth="0.8" opacity="0.6" />
    <circle cx="12" cy="12" r="2.5" fill="#fff" opacity="0.1" />
    {/* Pentagon patches */}
    <path d="M12 5.5 l1.8 2.8 h-3.6 Z" fill="#fff" opacity="0.9" />
    <path d="M17.5 10 l-2.5 1.8 -1-3h3.5Z" fill="#fff" opacity="0.9" />
    <path d="M15.5 15.5 l-3.5-2.5 3-1.5Z" fill="#fff" opacity="0.9" />
    <path d="M8.5 15.5 l3.5-2.5 -3-1.5Z" fill="#fff" opacity="0.9" />
    <path d="M6.5 10 l2.5 1.8 1-3h-3.5Z" fill="#fff" opacity="0.9" />
  </svg>
)

// Boot (assist) — kicking foot, no border
const BootIcon = ({ size = 14 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M5 18 C5 18 6 14 8 12 C9.5 10.5 11 10 12 9 L12 5 C12 4.4 12.4 4 13 4 L15 4 C15.6 4 16 4.4 16 5 L16 10 C16 10 18 11 19 13 C19.5 14 19.5 15 19 16 L18 18 C17.6 18.8 16.8 19 16 19 L6 19 C5.4 19 5 18.6 5 18 Z" fill="currentColor" />
    <path d="M5 18 L19 18" stroke="white" strokeWidth="0.5" opacity="0.3" />
  </svg>
)

// Card rectangle — yellow or red
const CardRect = ({ color }: { color: string }) => (
  <span style={{ display: "inline-block", width: 8, height: 11, borderRadius: 2, background: color, flexShrink: 0 }} />
)

// Double card (yellow+red)
const DoubleCard = () => (
  <span style={{ position: "relative", display: "inline-flex", alignItems: "center", width: 13, height: 11, flexShrink: 0 }}>
    <span style={{ position: "absolute", left: 0, width: 8, height: 11, borderRadius: 2, background: "#facc15" }} />
    <span style={{ position: "absolute", left: 5, width: 8, height: 11, borderRadius: 2, background: "#ef4444" }} />
  </span>
)

// ─── Event chips (pitch & bench) ──────────────────────────────────────────────

interface EventBadgesProps {
  events: FixtureEvent[]
  assists: number
  offsetBottom?: number
  // minute info for subs (from eventsByPlayer data)
  minuteByEventType?: Map<number, number | null>
}

const EventBadges = ({ events, assists, offsetBottom = 0 }: EventBadgesProps) => {
  const goals      = events.filter(e => e.typeId === EVENT_GOAL).length
  const yellows    = events.filter(e => e.typeId === EVENT_YELLOW).length
  const yellowReds = events.filter(e => e.typeId === EVENT_YELLOW_RED).length
  const reds       = events.filter(e => e.typeId === EVENT_RED).length
  const subEvents  = events.filter(e => e.typeId === EVENT_SUBSTITUTION)
  const subs       = subEvents.length

  if (!goals && !assists && !yellows && !yellowReds && !reds && !subs) return null

  return (
    <div
      className="absolute flex items-center justify-center gap-0.5"
      style={{ bottom: `calc(100% + ${offsetBottom}px)`, left: "50%", transform: "translateX(-50%)", whiteSpace: "nowrap" }}
    >
      {Array.from({ length: goals }).map((_, i) => (
        <span key={`g${i}`} style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <BallIcon size={13} />
        </span>
      ))}
      {Array.from({ length: assists }).map((_, i) => (
        <span key={`a${i}`} style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", color: "#38bdf8", flexShrink: 0 }}>
          <BootIcon size={13} />
        </span>
      ))}
      {Array.from({ length: yellows }).map((_, i) => <CardRect key={`y${i}`} color="#facc15" />)}
      {Array.from({ length: yellowReds }).map((_, i) => <DoubleCard key={`yr${i}`} />)}
      {Array.from({ length: reds }).map((_, i) => <CardRect key={`r${i}`} color="#ef4444" />)}
      {subEvents.map((sub, i) => (
        <span
          key={`s${i}`}
          title={sub.minute != null ? `Cambio en el minuto ${sub.minute}${sub.extraMinute != null ? `+${sub.extraMinute}` : ""}'` : "Cambio"}
          style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 13, height: 13, borderRadius: "50%", background: "#475569", flexShrink: 0, cursor: "default" }}
        >
          <span style={{ fontSize: 8, color: "#fff", lineHeight: 1 }}>↕</span>
        </span>
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
      <div className="relative" style={{ width: 56, height: 56 }}>
        <EventBadges events={events} assists={assists} offsetBottom={2} />
        <div
          className="overflow-hidden rounded-full"
          style={{ width: 56, height: 56, background: "#fff", border: "2.5px solid rgba(255,255,255,0.95)", boxShadow: "0 4px 14px rgba(0,0,0,0.6), 0 1px 4px rgba(0,0,0,0.4)" }}
        >
          <PlayerAvatar player={player.player} size={56} />
        </div>
        {player.jerseyNumber != null && (
          <span
            className="absolute flex items-center justify-center rounded-full font-black text-white leading-none"
            style={{ width: 18, height: 18, fontSize: 8, bottom: -3, left: -3, background: "#0f172a", boxShadow: "0 1px 4px rgba(0,0,0,0.7)" }}
          >
            {player.jerseyNumber}
          </span>
        )}
      </div>

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
          style={{ fontSize: 9, background: rating !== null ? getRatingFill(rating) : "rgba(255,255,255,0.18)", minWidth: 22, height: 14, paddingLeft: 3, paddingRight: 3 }}
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
    for (const player of starters) rows[getFormationRow(player.formationPosition!)].push(player)
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

// ─── BenchPlayer ──────────────────────────────────────────────────────────────

const BenchPlayer = ({ player, events, rating, assists }: {
  player: LineupPlayer
  events: FixtureEvent[]
  rating: number | null
  assists: number
}) => {
  const name = player.player.displayName ?? player.player.name
  const goals      = events.filter(e => e.typeId === EVENT_GOAL).length
  const yellows    = events.filter(e => e.typeId === EVENT_YELLOW).length
  const yellowReds = events.filter(e => e.typeId === EVENT_YELLOW_RED).length
  const reds       = events.filter(e => e.typeId === EVENT_RED).length
  const subEvents  = events.filter(e => e.typeId === EVENT_SUBSTITUTION)

  return (
    <div className="flex items-center gap-3 py-2 border-b border-slate-100 last:border-0">
      <div className="relative shrink-0">
        <div style={{ width: 36, height: 36, borderRadius: "50%", overflow: "hidden", border: "1.5px solid #e2e8f0" }}>
          <PlayerAvatar player={player.player} size={36} />
        </div>
        {player.jerseyNumber != null && (
          <span
            className="absolute flex items-center justify-center rounded-full font-black text-white leading-none"
            style={{ width: 14, height: 14, fontSize: 7, bottom: -1, left: -1, background: "#0f172a" }}
          >
            {player.jerseyNumber}
          </span>
        )}
      </div>

      <span className="flex-1 min-w-0 truncate text-sm font-medium text-slate-800" title={name}>{name}</span>

      <div className="flex items-center gap-1 shrink-0">
        {Array.from({ length: goals }).map((_, i) => (
          <span key={`g${i}`} style={{ display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
            <BallIcon size={13} />
          </span>
        ))}
        {Array.from({ length: assists }).map((_, i) => (
          <span key={`a${i}`} style={{ display: "inline-flex", color: "#38bdf8" }}>
            <BootIcon size={13} />
          </span>
        ))}
        {Array.from({ length: yellows }).map((_, i) => <CardRect key={`y${i}`} color="#facc15" />)}
        {Array.from({ length: yellowReds }).map((_, i) => <DoubleCard key={`yr${i}`} />)}
        {Array.from({ length: reds }).map((_, i) => <CardRect key={`r${i}`} color="#ef4444" />)}
        {subEvents.map((sub, i) => (
          <span
            key={`s${i}`}
            title={sub.minute != null ? `Cambio en el minuto ${sub.minute}${sub.extraMinute != null ? `+${sub.extraMinute}` : ""}'` : "Cambio"}
            style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 13, height: 13, borderRadius: "50%", background: "#475569", cursor: "default" }}
          >
            <span style={{ fontSize: 7, color: "#fff", lineHeight: 1 }}>↕</span>
          </span>
        ))}
      </div>

      <span
        className="flex items-center justify-center rounded-md font-black text-white leading-none shrink-0"
        style={{ fontSize: 10, background: rating !== null ? getRatingFill(rating) : "#cbd5e1", minWidth: 28, height: 18, paddingLeft: 5, paddingRight: 5 }}
      >
        {rating !== null ? formatRating(rating) : "—"}
      </span>
    </div>
  )
}

// ─── BenchSection ─────────────────────────────────────────────────────────────

interface TeamBenchProps {
  bench: LineupPlayer[]
  teamName: string
  teamImage: string | null
  eventsByPlayer: Map<number, FixtureEvent[]>
  ratingByPlayer: Map<number, number>
  assistsByPlayer: Map<number, number>
}

const TeamBench = ({ bench, teamName, teamImage, eventsByPlayer, ratingByPlayer, assistsByPlayer }: TeamBenchProps) => (
  <div className="flex flex-1 flex-col min-w-0">
    <div className="flex items-center gap-2 pb-2 mb-1 border-b border-slate-100">
      {teamImage ? (
        <img src={teamImage} alt={teamName} className="h-5 w-5 object-contain shrink-0" />
      ) : (
        <PlayerSilhouette size={20} />
      )}
      <span className="text-xs font-bold text-slate-600 truncate">{teamName}</span>
    </div>
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
)

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

  return (
    <div className="flex flex-col gap-3">
      <h2 className="px-1 text-sm font-bold text-slate-700">Banquillo</h2>
      <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
        <div className="grid grid-cols-2 divide-x divide-slate-100">
          <div className="p-4">
            <TeamBench bench={homeBench} teamName={homeTeamName} teamImage={homeTeamImage} eventsByPlayer={eventsByPlayer} ratingByPlayer={ratingByPlayer} assistsByPlayer={assistsByPlayer} />
          </div>
          <div className="p-4">
            <TeamBench bench={awayBench} teamName={awayTeamName} teamImage={awayTeamImage} eventsByPlayer={eventsByPlayer} ratingByPlayer={ratingByPlayer} assistsByPlayer={assistsByPlayer} />
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Events timeline ──────────────────────────────────────────────────────────

const GoalRow = ({ event }: { event: FixtureEvent }) => {
  const name = event.player?.displayName ?? event.player?.name ?? "—"
  const minute = event.minute != null ? `${event.minute}${event.extraMinute != null ? `+${event.extraMinute}` : ""}'` : "—"
  return (
    <div className="flex items-center gap-3 py-2.5 border-b border-slate-100 last:border-0">
      <div className="flex w-6 items-center justify-center shrink-0">
        <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 22, height: 22, borderRadius: "50%", background: "#dcfce7" }}>
          <BallIcon size={13} />
        </span>
      </div>
      <span className="w-9 text-xs font-bold text-slate-400 tabular-nums shrink-0">{minute}</span>
      <span className="text-sm font-semibold text-slate-900 flex-1 min-w-0 truncate">{name}</span>
      {event.result && <span className="text-xs font-bold text-emerald-600 tabular-nums shrink-0">{event.result}</span>}
    </div>
  )
}

const CardRow = ({ event }: { event: FixtureEvent }) => {
  const name = event.player?.displayName ?? event.player?.name ?? "—"
  const minute = event.minute != null ? `${event.minute}${event.extraMinute != null ? `+${event.extraMinute}` : ""}'` : "—"
  const isDouble = event.typeId === EVENT_YELLOW_RED

  return (
    <div className="flex items-center gap-3 py-2.5 border-b border-slate-100 last:border-0">
      <div className="flex w-6 items-center justify-center shrink-0">
        {isDouble ? (
          <DoubleCard />
        ) : (
          <CardRect color={event.typeId === EVENT_YELLOW ? "#facc15" : "#ef4444"} />
        )}
      </div>
      <span className="w-9 text-xs font-bold text-slate-400 tabular-nums shrink-0">{minute}</span>
      <span className="text-sm font-medium text-slate-900 flex-1 min-w-0 truncate">{name}</span>
    </div>
  )
}

const SubstitutionRow = ({ pair }: { pair: SubstitutionPair }) => {
  const minute = pair.minute != null ? `${pair.minute}${pair.extraMinute != null ? `+${pair.extraMinute}` : ""}'` : "—"
  const nameOut = pair.playerOut?.displayName ?? pair.playerOut?.name ?? "—"
  const nameIn  = pair.playerIn?.displayName  ?? pair.playerIn?.name  ?? null

  return (
    <div
      className="flex items-start gap-3 py-2.5 border-b border-slate-100 last:border-0"
      title={`Cambio en el minuto ${minute}`}
    >
      {/* Icon column */}
      <div className="flex w-6 items-center justify-center shrink-0 pt-0.5">
        <div className="flex flex-col items-center gap-0.5">
          <IconArrowDown size={12} style={{ color: "#dc2626" }} />
          <IconArrowUp   size={12} style={{ color: "#16a34a" }} />
        </div>
      </div>

      {/* Minute */}
      <span className="w-9 text-xs font-bold text-slate-400 tabular-nums shrink-0 pt-0.5">{minute}</span>

      {/* Players */}
      <div className="flex flex-col gap-0.5 flex-1 min-w-0">
        {/* Out */}
        <div className="flex items-center gap-1.5 min-w-0">
          <span style={{ display: "inline-block", width: 6, height: 6, borderRadius: "50%", background: "#dc2626", flexShrink: 0 }} />
          <span className="text-sm font-medium text-slate-500 truncate">{nameOut}</span>
        </div>
        {/* In */}
        {nameIn && (
          <div className="flex items-center gap-1.5 min-w-0">
            <span style={{ display: "inline-block", width: 6, height: 6, borderRadius: "50%", background: "#16a34a", flexShrink: 0 }} />
            <span className="text-sm font-semibold text-slate-900 truncate">{nameIn}</span>
          </div>
        )}
      </div>
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

  const assistsByPlayer = new Map<number, number>()
  for (const stat of assists) {
    const value = stat.value.normalizedValue
    if (typeof value === "number" && value > 0) assistsByPlayer.set(stat.player.id, value)
  }

  // Build ordered timeline events
  const goalEvents  = events.filter(e => e.typeId === EVENT_GOAL).sort((a, b) => (a.minute ?? 0) - (b.minute ?? 0))
  const cardEvents  = events.filter(e => [EVENT_YELLOW, EVENT_RED, EVENT_YELLOW_RED].includes(e.typeId ?? -1)).sort((a, b) => (a.minute ?? 0) - (b.minute ?? 0))
  const subPairs    = buildSubstitutionPairs(events)

  // Interleave all event types sorted by minute
  type TimelineItem =
    | { kind: "goal"; event: FixtureEvent }
    | { kind: "card"; event: FixtureEvent }
    | { kind: "sub"; pair: SubstitutionPair }

  const timeline: TimelineItem[] = [
    ...goalEvents.map(event => ({ kind: "goal" as const, event })),
    ...cardEvents.map(event => ({ kind: "card" as const, event })),
    ...subPairs.map(pair => ({ kind: "sub" as const, pair })),
  ].sort((itemA, itemB) => {
    const minuteA = itemA.kind === "sub" ? (itemA.pair.minute ?? 0) : (itemA.event.minute ?? 0)
    const minuteB = itemB.kind === "sub" ? (itemB.pair.minute ?? 0) : (itemB.event.minute ?? 0)
    return minuteA - minuteB
  })

  const hasLineups = lineups.some(p => p.formationPosition !== null)

  return (
    <main className="min-h-svh bg-[linear-gradient(180deg,#f8fafc_0%,#f8fafc_48%,#eef2f7_100%)]">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-6 py-8 sm:px-8 lg:px-10">

        {/* ── Hero ──────────────────────────────────────────────────────────── */}
        <div className="overflow-hidden rounded-2xl shadow-lg">
          <div
            className="relative min-h-52 bg-slate-900"
            style={fixture.venue?.imagePath ? { backgroundImage: `url(${fixture.venue.imagePath})`, backgroundSize: "cover", backgroundPosition: "center 40%" } : undefined}
          >
            <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/60 to-black/85" />

            <div className="absolute left-5 top-5">
              <Link href="/matches" className="flex items-center gap-1.5 rounded-xl border border-white/20 bg-white/10 py-2 pl-3 pr-4 text-sm font-medium text-white/80 backdrop-blur-sm transition-colors hover:bg-white/20 hover:text-white">
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
                  {homeTeam?.imagePath
                    ? <img src={homeTeam.imagePath} alt={homeTeam.name} className="h-16 w-16 object-contain drop-shadow-xl" />
                    : <PlayerSilhouette size={64} />}
                  <Link href={`/teams/${homeTeam?.id}`} className="hover:opacity-80">
                    <h2 className="text-right text-xl font-black text-white leading-tight drop-shadow">{homeTeam?.name ?? "Local"}</h2>
                  </Link>
                </div>

                <div className="flex shrink-0 flex-col items-center gap-1 pb-1">
                  {isFinished
                    ? <p className="text-5xl font-black tabular-nums text-white drop-shadow-lg leading-none">{fixture.homeScore} – {fixture.awayScore}</p>
                    : <p className="text-3xl font-black tabular-nums text-white drop-shadow-lg leading-none">{formatKickoffTime(fixture.kickoffAt)}</p>}
                  <p className="text-xs font-medium text-white/60">{formatKickoff(fixture.kickoffAt)}</p>
                  {fixture.venue?.name && <p className="text-xs text-white/50">{fixture.venue.name}</p>}
                </div>

                <div className="flex min-w-0 flex-1 flex-col items-start gap-2">
                  {awayTeam?.imagePath
                    ? <img src={awayTeam.imagePath} alt={awayTeam.name} className="h-16 w-16 object-contain drop-shadow-xl" />
                    : <PlayerSilhouette size={64} />}
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
          <Pitch homeLineup={homeLineup} awayLineup={awayLineup} eventsByPlayer={eventsByPlayer} ratingByPlayer={ratingByPlayer} assistsByPlayer={assistsByPlayer} />
        ) : (
          <div className="flex h-36 items-center justify-center rounded-2xl border border-dashed border-slate-200 text-sm text-slate-400">
            Alineación no disponible para este partido
          </div>
        )}

        {/* ── Bench ─────────────────────────────────────────────────────────── */}
        <BenchSection
          homeLineup={homeLineup} awayLineup={awayLineup}
          homeTeamName={homeTeam?.name ?? "Local"} awayTeamName={awayTeam?.name ?? "Visitante"}
          homeTeamImage={homeTeam?.imagePath ?? null} awayTeamImage={awayTeam?.imagePath ?? null}
          eventsByPlayer={eventsByPlayer} ratingByPlayer={ratingByPlayer} assistsByPlayer={assistsByPlayer}
        />

        {/* ── Events timeline ────────────────────────────────────────────────── */}
        {timeline.length > 0 && (
          <div className="flex flex-col gap-3">
            <h2 className="px-1 text-sm font-bold text-slate-700">Eventos del partido</h2>
            <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white px-5 shadow-sm">
              {timeline.map((item, index) => {
                if (item.kind === "goal") return <GoalRow key={`g-${item.event.id}`} event={item.event} />
                if (item.kind === "card") return <CardRow key={`c-${item.event.id}`} event={item.event} />
                return <SubstitutionRow key={`s-${index}`} pair={item.pair} />
              })}
            </div>
          </div>
        )}

      </div>
    </main>
  )
}

export default MatchPage
