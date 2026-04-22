import { notFound } from "next/navigation"
import Link from "next/link"
import { IconArrowLeft } from "@tabler/icons-react"
import {
  getFixture,
  getFixtureEvents,
  getFixtureLineups,
  getFixturePlayerRatings,
  getFixturePlayerAssists,
  type LineupPlayer,
  type FixtureEvent,
  type PlayerSummary,
} from "@/lib/matches"
import { getRatingFill } from "@/lib/rating"
import { resolvePlayerImageUrl } from "@/lib/player"

export const dynamic = "force-dynamic"

const EVENT_GOAL         = 14
const EVENT_GOAL_PENALTY = 16
const EVENT_GOAL_OWN     = 15
const EVENT_SUBSTITUTION = 18
const EVENT_YELLOW       = 19
const EVENT_RED          = 20
const EVENT_YELLOW_RED   = 21
const GOAL_TYPES = new Set([EVENT_GOAL, EVENT_GOAL_PENALTY, EVENT_GOAL_OWN])

const parseFormationField = (formationField: string): { row: number; col: number } => {
  const [rowStr, colStr] = formationField.split(":")
  return { row: parseInt(rowStr ?? "0", 10), col: parseInt(colStr ?? "0", 10) }
}

const AVATAR_SIZE = 52
const TOKEN_WIDTH = 112

const buildRowXPositions = (numRows: number, isHome: boolean): number[] => {
  const gkX  = isHome ? 6 : 94
  const fwdX = isHome ? 44 : 56
  if (numRows <= 1) return [gkX]
  const step = (fwdX - gkX) / (numRows - 1)
  return Array.from({ length: numRows }, (_, i) => gkX + i * step)
}

const yPositions = (count: number): number[] => {
  if (count === 1) return [50]
  if (count === 2) return [27, 73]
  const min = count >= 5 ? 10 : count >= 4 ? 13 : 15
  const max = count >= 5 ? 90 : count >= 4 ? 87 : 85
  const step = (max - min) / (count - 1)
  return Array.from({ length: count }, (_, i) => min + i * step)
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

interface SubstitutionEvent {
  minute: number | null
  extraMinute: number | null
  playerIn: FixtureEvent["player"]
  playerOut: FixtureEvent["player"]
}

const buildSubEvents = (events: FixtureEvent[]): SubstitutionEvent[] =>
  events
    .filter(e => e.typeId === EVENT_SUBSTITUTION && e.player != null)
    .sort((a, b) => (a.minute ?? 0) - (b.minute ?? 0) || (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
    .map(e => ({
      minute: e.minute,
      extraMinute: e.extraMinute,
      playerIn: e.player,
      playerOut: e.relatedPlayer,
    }))

const PlayerAvatar = ({ player, size }: { player: LineupPlayer["player"]; size: number }) => (
  <img
    src={resolvePlayerImageUrl(player.imagePath)}
    alt={player.displayName ?? player.name}
    style={{ width: size, height: size, objectFit: "cover", objectPosition: "top", borderRadius: "50%", background: "#f1f5f9", flexShrink: 0 }}
  />
)

const BallIcon = ({ size = 14, variant = "goal" }: { size?: number; variant?: "goal" | "own" }) => {
  const fill = variant === "own" ? "#b91c1c" : "#1a1a1a"
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="11" fill="#fff" />
      <path fill={fill} d="M12 0a12 12 0 1 0 12 12A12 12 0 0 0 12 0Zm8.42 6.63-.48 1.74-4.18 1.36-2.76-2v-4.4l1.5-1a10 10 0 0 1 5.92 4.3ZM9.5 2.33l1.5 1v4.4l-2.76 2-4.18-1.36-.48-1.74a10 10 0 0 1 5.92-4.3ZM2 12v-.49l1.55-1.21 4.11 1.34 1 3.2-2.54 3.5-1.94-.08A9.89 9.89 0 0 1 2 12Zm6.24 9.26-.58-1.58L10.33 16h3.34l2.67 3.68-.58 1.58a9.92 9.92 0 0 1-7.52 0Zm11.54-3-1.94.08-2.54-3.5 1-3.2 4.11-1.34L22 11.51V12a9.89 9.89 0 0 1-2.22 6.26Z" />
    </svg>
  )
}

const AssistIcon = ({ size = 14 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="12" fill="#3b82f6" />
    <path d="M2 13h16.51l-4.23 4.3 1.44 1.4 5.87-6a1 1 0 0 0 0-1.39l-5.87-6-1.44 1.39 4.23 4.3H2Z" fill="#fff" />
  </svg>
)

const SubOutIcon = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 14 14" xmlns="http://www.w3.org/2000/svg">
    <circle cx="7" cy="7" r="7" fill="#fff" />
    <path d="M4 7h6m0 0-2.5-2.5M10 7l-2.5 2.5" stroke="#ef4444" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" fill="none" />
  </svg>
)

const SubInIcon = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 14 14" xmlns="http://www.w3.org/2000/svg">
    <circle cx="7" cy="7" r="7" fill="#fff" />
    <path d="M10 7H4m0 0 2.5-2.5M4 7l2.5 2.5" stroke="#16a34a" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" fill="none" />
  </svg>
)

const CardRect = ({ color }: { color: string }) => (
  <span style={{ display: "inline-block", width: 8, height: 11, borderRadius: 2, background: color, flexShrink: 0 }} />
)

const DoubleCard = () => (
  <span style={{ position: "relative", display: "inline-flex", alignItems: "center", width: 13, height: 11, flexShrink: 0 }}>
    <span style={{ position: "absolute", left: 0, width: 8, height: 11, borderRadius: 2, background: "#facc15" }} />
    <span style={{ position: "absolute", left: 5, width: 8, height: 11, borderRadius: 2, background: "#ff0000" }} />
  </span>
)

interface EventBadgesProps {
  events: FixtureEvent[]
  assists: number
  offsetBottom?: number
  isStarter?: boolean
}

const EventBadges = ({ events, assists, offsetBottom = 0, isStarter = true }: EventBadgesProps) => {
  const regularGoals = events.filter(e => e.typeId === EVENT_GOAL || e.typeId === EVENT_GOAL_PENALTY)
  const ownGoals     = events.filter(e => e.typeId === EVENT_GOAL_OWN)
  const yellows      = events.filter(e => e.typeId === EVENT_YELLOW).length
  const yellowReds   = events.filter(e => e.typeId === EVENT_YELLOW_RED).length
  const reds         = events.filter(e => e.typeId === EVENT_RED).length
  const subEvents    = isStarter ? [] : events.filter(e => e.typeId === EVENT_SUBSTITUTION)

  if (!regularGoals.length && !ownGoals.length && !assists && !yellows && !yellowReds && !reds && !subEvents.length) return null

  return (
    <div
      className="absolute flex items-center justify-center gap-0.5"
      style={{ bottom: `calc(100% + ${offsetBottom}px)`, left: "50%", transform: "translateX(-50%)", whiteSpace: "nowrap" }}
    >
      {regularGoals.map((_, i) => (
        <span key={`g${i}`} style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <BallIcon size={13} />
        </span>
      ))}
      {ownGoals.map((_, i) => (
        <span key={`og${i}`} style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <BallIcon size={13} variant="own" />
        </span>
      ))}
      {Array.from({ length: assists }).map((_, i) => (
        <span key={`a${i}`} style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", color: "#38bdf8", flexShrink: 0 }}>
          <AssistIcon size={13} />
        </span>
      ))}
      {Array.from({ length: yellows }).map((_, i) => <CardRect key={`y${i}`} color="#facc15" />)}
      {Array.from({ length: yellowReds }).map((_, i) => <DoubleCard key={`yr${i}`} />)}
      {Array.from({ length: reds }).map((_, i) => <CardRect key={`r${i}`} color="#ff0000" />)}
      {subEvents.map((sub, i) => (
        <span
          key={`s${i}`}
          style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0, cursor: "default" }}
        >
          <SubInIcon size={13} />
        </span>
      ))}
    </div>
  )
}

interface PlayerTokenProps {
  player: LineupPlayer
  events: FixtureEvent[]
  rating: number | null
  assists: number
  x: number
  y: number
  substitutedOut: boolean
  subMinute: number | null
  subExtraMinute: number | null
}

const PlayerToken = ({ player, events, rating, assists, x, y, substitutedOut, subMinute, subExtraMinute }: PlayerTokenProps) => {
  const fullName = player.player.displayName ?? player.player.name
  const parts = fullName.trim().split(/\s+/)
  const shortName = parts.length > 2 ? parts[parts.length - 1] : parts.slice(-2).join(" ")

  return (
    <div
      className="absolute flex flex-col items-center"
      style={{ left: `${x}%`, top: `${y}%`, transform: "translate(-50%,-50%)", width: TOKEN_WIDTH, gap: 3 }}
    >
      <div className="relative" style={{ width: AVATAR_SIZE, height: AVATAR_SIZE }}>
        <EventBadges events={events} assists={assists} offsetBottom={1} isStarter={true} />
        <div
          className="overflow-hidden rounded-full"
          style={{ width: AVATAR_SIZE, height: AVATAR_SIZE, background: "#fff", border: "2px solid rgba(255,255,255,0.95)", boxShadow: "0 3px 10px rgba(0,0,0,0.55), 0 1px 3px rgba(0,0,0,0.35)" }}
        >
          <PlayerAvatar player={player.player} size={AVATAR_SIZE} />
        </div>
        {player.jerseyNumber != null && (
          <span
            className="absolute flex items-center justify-center rounded-full font-black text-white leading-none"
            style={{ width: 17, height: 17, fontSize: 8, bottom: -2, left: -2, background: "#0f172a", boxShadow: "0 1px 3px rgba(0,0,0,0.7)" }}
          >
            {player.jerseyNumber}
          </span>
        )}
        {substitutedOut && (
          <span
            style={{ position: "absolute", bottom: -2, right: -2, width: 16, height: 16, display: "flex", alignItems: "center", justifyContent: "center", cursor: "default" }}
          >
            <SubOutIcon size={16} />
          </span>
        )}
      </div>

      <div
        className="flex items-center gap-1 rounded-lg px-2 py-0.5"
        style={{ background: "rgba(0,0,0,0.52)", backdropFilter: "blur(6px)", maxWidth: TOKEN_WIDTH }}
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
          style={{ fontSize: 9, background: rating !== null ? getRatingFill(rating) : "rgba(255,255,255,0.18)", minWidth: 22, height: 14, paddingLeft: 2, paddingRight: 2 }}
        >
          {rating !== null ? formatRating(rating) : "—"}
        </span>
      </div>
    </div>
  )
}

interface PitchProps {
  homeLineup: LineupPlayer[]
  awayLineup: LineupPlayer[]
  eventsByPlayer: Map<number, FixtureEvent[]>
  ratingByPlayer: Map<number, number>
  assistsByPlayer: Map<number, number>
  subEvents: SubstitutionEvent[]
}

const Pitch = ({ homeLineup, awayLineup, eventsByPlayer, ratingByPlayer, assistsByPlayer, subEvents }: PitchProps) => {
  const substitutedOutMap = new Map<number, { minute: number | null; extraMinute: number | null }>()
  for (const subEvent of subEvents) {
    if (subEvent.playerOut?.id != null) {
      substitutedOutMap.set(subEvent.playerOut.id, { minute: subEvent.minute, extraMinute: subEvent.extraMinute })
    }
  }

  const renderTeam = (lineup: LineupPlayer[], isHome: boolean) => {
    const newStyleStarters = lineup.filter(p => p.typeId === 11 && p.formationField != null)
    if (newStyleStarters.length > 0) {
      const rowMap = new Map<number, LineupPlayer[]>()
      for (const player of newStyleStarters) {
        const { row } = parseFormationField(player.formationField!)
        const existing = rowMap.get(row) ?? []
        existing.push(player)
        rowMap.set(row, existing)
      }
      const sortedRows = Array.from(rowMap.entries())
        .sort(([rowA], [rowB]) => rowA - rowB)
        .map(([, players]) =>
          players.sort((playerA, playerB) => {
            const { col: colA } = parseFormationField(playerA.formationField!)
            const { col: colB } = parseFormationField(playerB.formationField!)
            return colA - colB
          })
        )
      const xPositions = buildRowXPositions(sortedRows.length, isHome)
      return sortedRows.flatMap((rowPlayers, rowIndex) => {
        const yPos = yPositions(rowPlayers.length)
        return rowPlayers.map((player, playerIndex) => {
          const subInfo = substitutedOutMap.get(player.player.id)
          return (
            <PlayerToken
              key={player.id}
              player={player}
              events={eventsByPlayer.get(player.player.id) ?? []}
              rating={ratingByPlayer.get(player.player.id) ?? null}
              assists={assistsByPlayer.get(player.player.id) ?? 0}
              x={xPositions[rowIndex] ?? 50}
              y={yPos[playerIndex] ?? 50}
              substitutedOut={subInfo != null}
              subMinute={subInfo?.minute ?? null}
              subExtraMinute={subInfo?.extraMinute ?? null}
            />
          )
        })
      })
    }

    const legacyStarters = lineup
      .filter(p => p.formationPosition !== null)
      .sort((a, b) => (a.formationPosition ?? 0) - (b.formationPosition ?? 0))
    const legacyRows: LineupPlayer[][] = [[], [], [], []]
    for (const player of legacyStarters) {
      const pos = player.formationPosition!
      const row = pos === 1 ? 0 : pos <= 5 ? 1 : pos <= 8 ? 2 : 3
      legacyRows[row].push(player)
    }
    const filledLegacyRows = legacyRows.filter(row => row.length > 0)
    const xPositions = buildRowXPositions(filledLegacyRows.length, isHome)
    return filledLegacyRows.flatMap((rowPlayers, rowIndex) => {
      const yPos = yPositions(rowPlayers.length)
      return rowPlayers.map((player, playerIndex) => {
        const subInfo = substitutedOutMap.get(player.player.id)
        return (
          <PlayerToken
            key={player.id}
            player={player}
            events={eventsByPlayer.get(player.player.id) ?? []}
            rating={ratingByPlayer.get(player.player.id) ?? null}
            assists={assistsByPlayer.get(player.player.id) ?? 0}
            x={xPositions[rowIndex] ?? 50}
            y={yPos[playerIndex] ?? 50}
            substitutedOut={subInfo != null}
            subMinute={subInfo?.minute ?? null}
            subExtraMinute={subInfo?.extraMinute ?? null}
          />
        )
      })
    })
  }

  return (
    <div className="relative w-full" style={{ aspectRatio: "3/2" }}>
      <div className="absolute inset-0 overflow-hidden rounded-2xl shadow-xl">
        <img src="/pitch.avif" alt="" className="h-full w-full object-cover" />
      </div>
      <div className="absolute inset-0">
        {renderTeam(homeLineup, true)}
        {renderTeam(awayLineup, false)}
      </div>
    </div>
  )
}

const BenchPlayer = ({ player, events, rating, assists }: {
  player: LineupPlayer
  events: FixtureEvent[]
  rating: number | null
  assists: number
}) => {
  const name = player.player.displayName ?? player.player.name
  const regularGoals = events.filter(e => e.typeId === EVENT_GOAL || e.typeId === EVENT_GOAL_PENALTY)
  const ownGoals     = events.filter(e => e.typeId === EVENT_GOAL_OWN)
  const yellows      = events.filter(e => e.typeId === EVENT_YELLOW).length
  const yellowReds   = events.filter(e => e.typeId === EVENT_YELLOW_RED).length
  const reds         = events.filter(e => e.typeId === EVENT_RED).length
  const subEvents    = events.filter(e => e.typeId === EVENT_SUBSTITUTION)

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
        {regularGoals.map((_, i) => (
          <span key={`g${i}`} style={{ display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
            <BallIcon size={13} />
          </span>
        ))}
        {ownGoals.map((_, i) => (
          <span key={`og${i}`} style={{ display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
            <BallIcon size={13} variant="own" />
          </span>
        ))}
        {Array.from({ length: assists }).map((_, i) => (
          <span key={`a${i}`} style={{ display: "inline-flex", color: "#38bdf8" }}>
            <AssistIcon size={13} />
          </span>
        ))}
        {Array.from({ length: yellows }).map((_, i) => <CardRect key={`y${i}`} color="#facc15" />)}
        {Array.from({ length: yellowReds }).map((_, i) => <DoubleCard key={`yr${i}`} />)}
        {Array.from({ length: reds }).map((_, i) => <CardRect key={`r${i}`} color="#ff0000" />)}
        {subEvents.map((sub, i) => (
          <span
            key={`s${i}`}
            style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", cursor: "default" }}
          >
            <SubInIcon size={13} />
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
        <div className="h-5 w-5 shrink-0 rounded-full bg-slate-200" />
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
  const homeBench = homeLineup.filter(p => p.typeId === 12 || (p.typeId == null && p.formationPosition === null))
  const awayBench = awayLineup.filter(p => p.typeId === 12 || (p.typeId == null && p.formationPosition === null))
  if (!homeBench.length && !awayBench.length) return null

  return (
    <div className="flex flex-col gap-3">
      <h2 className="text-sm font-bold text-slate-700 text-center">Bench</h2>
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

type TimelineItem =
  | { kind: "goal"; event: FixtureEvent; assister: PlayerSummary | null }
  | { kind: "card"; event: FixtureEvent }
  | { kind: "sub";  subEvent: SubstitutionEvent }

const getItemMinuteStr = (item: TimelineItem): string => {
  const minute   = item.kind === "sub" ? item.subEvent.minute    : item.event.minute
  const extraMin = item.kind === "sub" ? item.subEvent.extraMinute : item.event.extraMinute
  if (minute == null) return "—"
  return extraMin != null ? `${minute}+${extraMin}'` : `${minute}'`
}

const TimelineEventCard = ({ item }: { item: TimelineItem }) => {
  if (item.kind === "goal") {
    const { event } = item
    const name      = event.player?.displayName ?? event.player?.name ?? "—"
    const isOwnGoal = event.typeId === EVENT_GOAL_OWN
    const isPenalty = event.typeId === EVENT_GOAL_PENALTY
    const playerImg = resolvePlayerImageUrl(event.player?.imagePath ?? null)
    const assister  = item.assister
    return (
      <div className="flex items-start gap-2.5 rounded-xl bg-white border border-slate-100 px-3 py-2.5 shadow-sm w-full">
        <BallIcon size={15} variant={isOwnGoal ? "own" : "goal"} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 min-w-0">
            <img src={playerImg} alt={name} style={{ width: 22, height: 22, borderRadius: "50%", objectFit: "cover", objectPosition: "top", flexShrink: 0 }} />
            <p className="text-xs font-semibold text-slate-900 truncate leading-tight">{name}</p>
          </div>
          <div className="flex items-center gap-1.5 mt-0.5">
            {isPenalty && <span className="text-[10px] text-slate-400 font-semibold">Penalty</span>}
            {isOwnGoal && <span className="text-[10px] text-red-400 font-semibold">Own goal</span>}
            {event.result && <span className="text-[10px] text-emerald-600 font-black tabular-nums">{event.result}</span>}
          </div>
          {assister && (
            <div className="mt-2 pt-2 border-t border-slate-100 flex items-center gap-2 min-w-0">
              <img
                src={resolvePlayerImageUrl(assister.imagePath)}
                alt={assister.displayName ?? assister.name}
                style={{ width: 20, height: 20, borderRadius: "50%", objectFit: "cover", objectPosition: "top", flexShrink: 0, border: "1.5px solid #e2e8f0" }}
              />
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-semibold text-slate-600 truncate leading-tight">{assister.displayName ?? assister.name}</p>
                <div className="flex items-center gap-1">
                  <AssistIcon size={9} />
                  <span className="text-[9px] text-slate-400 font-medium">Assist</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }

  if (item.kind === "card") {
    const { event } = item
    const name      = event.player?.displayName ?? event.player?.name ?? "—"
    const isDouble  = event.typeId === EVENT_YELLOW_RED
    const playerImg = resolvePlayerImageUrl(event.player?.imagePath ?? null)
    return (
      <div className="flex items-center gap-2.5 rounded-xl bg-white border border-slate-100 px-3 py-2.5 shadow-sm w-full">
        {isDouble ? <DoubleCard /> : <CardRect color={event.typeId === EVENT_YELLOW ? "#facc15" : "#ff0000"} />}
        <img src={playerImg} alt={name} style={{ width: 26, height: 26, borderRadius: "50%", objectFit: "cover", objectPosition: "top", flexShrink: 0 }} />
        <p className="text-xs font-semibold text-slate-900 truncate flex-1 min-w-0">{name}</p>
      </div>
    )
  }

  const { subEvent } = item
  const nameIn  = subEvent.playerIn?.displayName  ?? subEvent.playerIn?.name  ?? "—"
  const nameOut = subEvent.playerOut?.displayName ?? subEvent.playerOut?.name ?? null
  const imgIn   = resolvePlayerImageUrl(subEvent.playerIn?.imagePath ?? null)
  const imgOut  = resolvePlayerImageUrl(subEvent.playerOut?.imagePath ?? null)
  return (
    <div className="flex flex-col gap-1.5 rounded-xl bg-white border border-slate-100 px-3 py-2.5 shadow-sm w-full">
      {nameOut && (
        <div className="flex items-center gap-2 min-w-0">
          <SubOutIcon size={14} />
          <img src={imgOut} alt={nameOut} style={{ width: 22, height: 22, borderRadius: "50%", objectFit: "cover", objectPosition: "top", flexShrink: 0 }} />
          <span className="text-xs text-slate-400 truncate">{nameOut}</span>
        </div>
      )}
      <div className="flex items-center gap-2 min-w-0">
        <SubInIcon size={14} />
        <img src={imgIn} alt={nameIn} style={{ width: 22, height: 22, borderRadius: "50%", objectFit: "cover", objectPosition: "top", flexShrink: 0 }} />
        <span className="text-xs font-semibold text-emerald-700 truncate">{nameIn}</span>
      </div>
    </div>
  )
}

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

  const playerSideMap = new Map<number, "home" | "away">()
  for (const lp of homeLineup) playerSideMap.set(lp.player.id, "home")
  for (const lp of awayLineup) playerSideMap.set(lp.player.id, "away")

  const goalEvents = events.filter(e => GOAL_TYPES.has(e.typeId ?? -1)).sort((a, b) => (a.minute ?? 0) - (b.minute ?? 0) || (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
  const cardEvents = events.filter(e => [EVENT_YELLOW, EVENT_RED, EVENT_YELLOW_RED].includes(e.typeId ?? -1)).sort((a, b) => (a.minute ?? 0) - (b.minute ?? 0) || (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
  const subEvents  = buildSubEvents(events)

  const sortedTimeline: TimelineItem[] = [
    ...goalEvents.map(event => ({
      kind: "goal" as const,
      event,
      assister: (event.typeId !== EVENT_GOAL_PENALTY && event.typeId !== EVENT_GOAL_OWN)
        ? (event.relatedPlayer ?? null)
        : null,
    })),
    ...cardEvents.map(event  => ({ kind: "card" as const, event })),
    ...subEvents.map(subEvent => ({ kind: "sub" as const, subEvent })),
  ].sort((itemA, itemB) => {
    const minuteA = itemA.kind === "sub" ? (itemA.subEvent.minute ?? 0) : (itemA.event.minute ?? 0)
    const minuteB = itemB.kind === "sub" ? (itemB.subEvent.minute ?? 0) : (itemB.event.minute ?? 0)
    return minuteA - minuteB
  })


  const getItemSide = (item: TimelineItem): "home" | "away" | null => {
    const playerId = item.kind === "sub" ? item.subEvent.playerIn?.id : item.event.player?.id
    return playerId != null ? (playerSideMap.get(playerId) ?? null) : null
  }

  const hasTimeline = sortedTimeline.length > 0
  const hasLineups  = lineups.some(p => (p.typeId === 11 && p.formationField != null) || p.formationPosition !== null)

  return (
    <main className="min-h-svh bg-[linear-gradient(180deg,#f8fafc_0%,#f8fafc_48%,#eef2f7_100%)]">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-6 py-8 sm:px-8 lg:px-10">

        <div className="overflow-hidden rounded-2xl shadow-lg">
          <div
            className="relative min-h-52 bg-slate-900"
            style={fixture.venue?.imagePath ? { backgroundImage: `url(${fixture.venue.imagePath})`, backgroundSize: "cover", backgroundPosition: "center 40%" } : undefined}
          >
            <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/60 to-black/85" />

            <div className="absolute left-5 top-5">
              <Link href="/matches" className="flex items-center gap-1.5 rounded-xl border border-white/20 bg-white/10 py-2 pl-3 pr-4 text-sm font-medium text-white/80 backdrop-blur-sm transition-colors hover:bg-white/20 hover:text-white">
                <IconArrowLeft size={15} />
                Back
              </Link>
            </div>

            {(fixture.stage || fixture.round) && (
              <div className="absolute right-5 top-5">
                <span className="rounded-xl border border-white/20 bg-white/10 px-3 py-2 text-xs font-semibold text-white/70 backdrop-blur-sm">
                  {fixture.stage?.name ?? ""}{fixture.round ? ` · Round ${fixture.round.name}` : ""}
                </span>
              </div>
            )}

            <div className="absolute bottom-0 left-0 right-0 p-6">
              <div className="flex items-end justify-center gap-6">
                <div className="flex min-w-0 flex-1 flex-col items-end gap-2">
                  {homeTeam?.imagePath
                    ? <img src={homeTeam.imagePath} alt={homeTeam.name} className="h-16 w-16 object-contain drop-shadow-xl" />
                    : <div className="h-16 w-16 rounded-full bg-white/20" />}
                  <Link href={`/teams/${homeTeam?.id}`} className="hover:opacity-80">
                    <h2 className="text-right text-xl font-black text-white leading-tight drop-shadow">{homeTeam?.name ?? "Home"}</h2>
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
                    : <div className="h-16 w-16 rounded-full bg-white/20" />}
                  <Link href={`/teams/${awayTeam?.id}`} className="hover:opacity-80">
                    <h2 className="text-left text-xl font-black text-white leading-tight drop-shadow">{awayTeam?.name ?? "Away"}</h2>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>

        {hasLineups && (
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              {homeTeam?.imagePath && <img src={homeTeam.imagePath} alt={homeTeam?.name ?? ""} className="h-5 w-5 object-contain" />}
              <div className="flex flex-col">
                <span className="text-sm font-bold text-slate-700">{homeTeam?.name}</span>
                {fixture.homeFormation && <span className="text-xs text-slate-400">{fixture.homeFormation}</span>}
              </div>
            </div>
            <span className="text-xs font-medium text-slate-400">Lineup</span>
            <div className="flex items-center gap-2">
              <div className="flex flex-col items-end">
                <span className="text-sm font-bold text-slate-700">{awayTeam?.name}</span>
                {fixture.awayFormation && <span className="text-xs text-slate-400">{fixture.awayFormation}</span>}
              </div>
              {awayTeam?.imagePath && <img src={awayTeam.imagePath} alt={awayTeam?.name ?? ""} className="h-5 w-5 object-contain" />}
            </div>
          </div>
        )}

        {hasLineups ? (
          <Pitch homeLineup={homeLineup} awayLineup={awayLineup} eventsByPlayer={eventsByPlayer} ratingByPlayer={ratingByPlayer} assistsByPlayer={assistsByPlayer} subEvents={subEvents} />
        ) : (
          <div className="flex h-36 items-center justify-center rounded-2xl border border-dashed border-slate-200 text-sm text-slate-400">
            Lineup not available
          </div>
        )}

        <BenchSection
          homeLineup={homeLineup} awayLineup={awayLineup}
          homeTeamName={homeTeam?.name ?? "Home"} awayTeamName={awayTeam?.name ?? "Away"}
          homeTeamImage={homeTeam?.imagePath ?? null} awayTeamImage={awayTeam?.imagePath ?? null}
          eventsByPlayer={eventsByPlayer} ratingByPlayer={ratingByPlayer} assistsByPlayer={assistsByPlayer}
        />

        {hasTimeline && (
          <div className="flex flex-col gap-3">
            <h2 className="text-sm font-bold text-slate-700 text-center">Match events</h2>

            <div className="grid grid-cols-[1fr_40px_1fr] items-center px-1">
              <div className="flex items-center gap-1.5">
                {homeTeam?.imagePath && <img src={homeTeam.imagePath} alt={homeTeam.name} className="h-4 w-4 object-contain shrink-0" />}
                <span className="text-xs font-bold text-slate-500 truncate">{homeTeam?.name ?? "Home"}</span>
              </div>
              <div />
              <div className="flex items-center justify-end gap-1.5">
                <span className="text-xs font-bold text-slate-500 truncate">{awayTeam?.name ?? "Away"}</span>
                {awayTeam?.imagePath && <img src={awayTeam.imagePath} alt={awayTeam.name} className="h-4 w-4 object-contain shrink-0" />}
              </div>
            </div>

            <div className="relative">
              <div className="absolute top-0 bottom-0 left-1/2 w-px -translate-x-1/2 bg-slate-200" style={{ bottom: 6 }} />

              <div className="flex flex-col gap-3 py-1">

                {/* Kick-off marker */}
                <div className="grid grid-cols-[1fr_40px_1fr] items-center">
                  <div />
                  <div className="relative z-10 flex flex-col items-center gap-0.5">
                    <div className="w-3 h-3 rounded-full bg-emerald-400 border-2 border-white shadow-sm" />
                    <span className="text-[9px] font-black text-emerald-500 leading-none">0&apos;</span>
                  </div>
                  <div />
                </div>

                {sortedTimeline.map((item, index) => {
                  const side      = getItemSide(item)
                  const minuteStr = getItemMinuteStr(item)
                  const isHome    = side === "home"
                  const isAway    = side === "away"
                  return (
                    <div key={index} className="grid grid-cols-[1fr_40px_1fr] items-center">
                      <div className="flex justify-end items-center">
                        {isHome && (
                          <>
                            <TimelineEventCard item={item} />
                            <div className="h-px w-2 bg-slate-200 shrink-0" />
                          </>
                        )}
                      </div>

                      <div className="relative z-10 flex flex-col items-center gap-0.5">
                        <div className="w-2.5 h-2.5 rounded-full bg-slate-400 border-2 border-white shadow-sm" />
                        <span className="text-[9px] font-black text-slate-400 tabular-nums leading-none whitespace-nowrap">
                          {minuteStr}
                        </span>
                      </div>

                      <div className="flex justify-start items-center">
                        {isAway && (
                          <>
                            <div className="h-px w-2 bg-slate-200 shrink-0" />
                            <TimelineEventCard item={item} />
                          </>
                        )}
                      </div>
                    </div>
                  )
                })}

                {isFinished && (
                  <div className="grid grid-cols-[1fr_40px_1fr] items-center">
                    <div />
                    <div className="relative z-10 flex flex-col items-center gap-0.5">
                      <div className="w-3 h-3 rounded-full bg-slate-800 border-2 border-white shadow-sm" />
                      <span className="text-[9px] font-black text-slate-700 leading-none tracking-tight">FT</span>
                    </div>
                    <div />
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

      </div>
    </main>
  )
}

export default MatchPage
