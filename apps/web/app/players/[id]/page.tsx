import React, { Suspense } from "react"
import Link from "next/link"
import { notFound } from "next/navigation"
import { IconArrowLeft, IconBallFootball, IconShieldFilled } from "@tabler/icons-react"
import HeroTexture from "@/components/hero-texture"
import SearchParamsLoadingBoundary from "@/components/search-params-loading-boundary"
import PlayerSeasonStageSelector from "@/components/player-season-stage-selector"
import { getSeasons, getStages, filterMainStages, type Season, type Stage } from "@/lib/seasons"
import { resolvePlayerImageUrl } from "@/lib/player"
import { getRatingColors, getRatingFill } from "@/lib/rating"
import {
  getPlayer,
  getPlayerSquadMemberships,
  getPlayerStatsByType,
  getPlayerSeasonEvents,
  getPlayerTeamFixtures,
  computePlayerSeasonAggregates,
  STAT_TYPE_RATING,
  STAT_TYPE_MINUTES,
  STAT_TYPE_ASSISTS,
  STAT_TYPE_SAVES,
  POSITION_LABELS,
  POSITION_COLORS,
  type PlayerDetail,
  type PlayerMembership,
  type PlayerStatEntry,
  type PlayerFixture,
  type PlayerSeasonAggregates,
} from "@/lib/players"

export const revalidate = 300

const POSITION_CONFIG: Record<number, { label: string; bg: string }> = {
  24: { label: "AR", bg: "#f59e0b" },
  25: { label: "DF", bg: "#3b82f6" },
  26: { label: "MC", bg: "#10b981" },
  27: { label: "DL", bg: "#ef4444" },
}

const PositionCircle = ({ positionId, size = 20 }: { positionId: number | null; size?: number }) => {
  if (!positionId) return null
  const config = POSITION_CONFIG[positionId]
  if (!config) return null
  return (
    <span
      style={{
        display: "inline-flex", alignItems: "center", justifyContent: "center",
        width: size + 4, height: size + 4, borderRadius: "50%",
        background: config.bg, flexShrink: 0,
      }}
    >
      <span style={{ fontSize: Math.round(size * 0.42), fontWeight: 900, color: "white", lineHeight: 1, letterSpacing: "-0.01em", WebkitFontSmoothing: "antialiased" } as React.CSSProperties}>
        {config.label}
      </span>
    </span>
  )
}

const ShirtIcon = ({ size = 20 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M20.38 3.46 16 2a4 4 0 0 1-8 0L3.62 3.46 2 12h3v10h14V12h3L20.38 3.46z"
      fill="#64748b"
    />
  </svg>
)

const BallIcon = ({ size = 20 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="11" fill="#fff" />
    <path fill="#1a1a1a" d="M12 0a12 12 0 1 0 12 12A12 12 0 0 0 12 0Zm8.42 6.63-.48 1.74-4.18 1.36-2.76-2v-4.4l1.5-1a10 10 0 0 1 5.92 4.3ZM9.5 2.33l1.5 1v4.4l-2.76 2-4.18-1.36-.48-1.74a10 10 0 0 1 5.92-4.3ZM2 12v-.49l1.55-1.21 4.11 1.34 1 3.2-2.54 3.5-1.94-.08A9.89 9.89 0 0 1 2 12Zm6.24 9.26-.58-1.58L10.33 16h3.34l2.67 3.68-.58 1.58a9.92 9.92 0 0 1-7.52 0Zm11.54-3-1.94.08-2.54-3.5 1-3.2 4.11-1.34L22 11.51V12a9.89 9.89 0 0 1-2.22 6.26Z" />
  </svg>
)

const AssistIcon = ({ size = 20 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="12" fill="#3b82f6" />
    <path d="M2 13h16.51l-4.23 4.3 1.44 1.4 5.87-6a1 1 0 0 0 0-1.39l-5.87-6-1.44 1.39 4.23 4.3H2Z" fill="#fff" />
  </svg>
)

const ClockIcon = ({ size = 20 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="12" fill="#64748b" />
    <circle cx="12" cy="12" r="7" stroke="#fff" strokeWidth="1.5" fill="none" />
    <path d="M12 8.5V12l2.5 2.5" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

const StarIcon = ({ size = 20, fill }: { size?: number; fill: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="12" fill={fill} />
    <path d="M12 5l1.854 5.707H19.5l-4.927 3.58 1.854 5.706L12 16.413l-4.427 3.58 1.854-5.706L4.5 10.707h5.646z" fill="#fff" />
  </svg>
)

const YellowCard = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={Math.round(size * 1.3)} viewBox="0 0 16 21" xmlns="http://www.w3.org/2000/svg">
    <rect x="0" y="0" width="16" height="21" rx="3" fill="#facc15" />
  </svg>
)

const RedCard = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={Math.round(size * 1.3)} viewBox="0 0 16 21" xmlns="http://www.w3.org/2000/svg">
    <rect x="0" y="0" width="16" height="21" rx="3" fill="#ef4444" />
  </svg>
)

const SavesIcon = ({ size = 20 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="12" fill="#6366f1" />
    <g transform="translate(3.5 3.5) scale(0.7)" fill="#fff">
      <path d="M20 20H10a2 2 0 0 0 0 4h10a2 2 0 0 0 0-4Z"/>
      <path d="M22.88 4.53a2 2 0 0 0-1.65-2.1L9.35.29A2.19 2.19 0 0 0 9 .26a2 2 0 0 0-2 2v8.1L3.83 8.78a1.83 1.83 0 0 0-.71-.14 2 2 0 0 0-2 2v.11a2 2 0 0 0 .79 1.59L8 17.74h14Zm-2.76 11.21H8.75l-5.52-4.89-.06-.05v-.09l3 1.49L9 13.6V2.26l2.5.45V10h1V2.89l2 .36V10h1V3.43l2 .36V10h1V4l2.38.42Z"/>
    </g>
  </svg>
)

const formatAge = (dateOfBirth: string | null): string | null => {
  if (!dateOfBirth) return null
  return String(Math.floor((Date.now() - new Date(dateOfBirth).getTime()) / (365.25 * 24 * 60 * 60 * 1000)))
}

const formatDateOfBirth = (dateOfBirth: string | null): string | null => {
  if (!dateOfBirth) return null
  return new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(dateOfBirth))
}

const formatDate = (kickoffAt: string | null): string => {
  if (!kickoffAt) return ""
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit", month: "2-digit", year: "numeric", timeZone: "America/Montevideo",
  }).format(new Date(kickoffAt))
}

const StatCard = ({
  label,
  value,
  icon,
  hasData,
}: {
  label: string
  value: string | number | null
  icon: React.ReactNode
  hasData: boolean
}) => (
  <div className="flex flex-col items-center gap-2 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm text-center">
    <div className="flex h-9 w-9 items-center justify-center">{icon}</div>
    <div className="flex flex-col items-center gap-0.5">
      <span className="text-2xl font-black tabular-nums text-slate-900 leading-none">
        {hasData && value !== null ? value : "—"}
      </span>
      <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">{label}</span>
    </div>
  </div>
)

const RatingStatCard = ({ avgRating, hasData }: { avgRating: number | null; hasData: boolean }) => {
  const colors = hasData && avgRating !== null ? getRatingColors(avgRating) : null
  return (
    <div
      className="flex flex-col items-center gap-2 rounded-2xl border p-4 shadow-sm text-center"
      style={{ backgroundColor: "#eff6ff", borderColor: "#93c5fd" }}
    >
      <div className="flex h-9 w-9 items-center justify-center">
        <StarIcon size={20} fill={colors?.fill ?? "#94a3b8"} />
      </div>
      <div className="flex flex-col items-center gap-0.5">
        <span
          className="text-2xl font-black tabular-nums leading-none"
          style={{ color: colors?.text ?? "#1e40af" }}
        >
          {hasData && avgRating !== null ? avgRating.toFixed(2) : "—"}
        </span>
        <span className="text-[10px] font-semibold uppercase tracking-wide text-blue-400">
          Avg rating
        </span>
      </div>
    </div>
  )
}

const getMatchResult = (
  fixture: PlayerFixture,
  teamId: number,
): { label: "W" | "D" | "L"; color: string; bg: string } | null => {
  if (fixture.homeScore === null || fixture.awayScore === null) return null
  const isHome = fixture.homeTeam?.id === teamId
  const teamScore = isHome ? fixture.homeScore : fixture.awayScore
  const opponentScore = isHome ? fixture.awayScore : fixture.homeScore
  if (teamScore > opponentScore) return { label: "W", color: "#15803d", bg: "#dcfce7" }
  if (teamScore < opponentScore) return { label: "L", color: "#b91c1c", bg: "#fee2e2" }
  return { label: "D", color: "#475569", bg: "#f1f5f9" }
}

const RecentFormCard = ({
  stat,
  fixture,
  teamId,
}: {
  stat: PlayerStatEntry
  fixture: PlayerFixture
  teamId: number
}) => {
  const rating = typeof stat.value.normalizedValue === "number" ? stat.value.normalizedValue : null
  if (rating === null) return null

  const isHome = fixture.homeTeam?.id === teamId
  const ownTeam = isHome ? fixture.homeTeam : fixture.awayTeam
  const opponent = isHome ? fixture.awayTeam : fixture.homeTeam
  const result = getMatchResult(fixture, teamId)
  const ratingFill = getRatingFill(rating)
  const isFinished = fixture.homeScore !== null && fixture.awayScore !== null
  const ownScore = isHome ? fixture.homeScore : fixture.awayScore
  const opponentScore = isHome ? fixture.awayScore : fixture.homeScore

  return (
    <Link
      href={`/matches/${fixture.id}`}
      className="group flex flex-col gap-2 rounded-xl border border-slate-200/80 bg-white p-3 shadow-sm transition-all hover:border-slate-300 hover:shadow-md flex-1 min-w-0"
    >
      <div className="flex items-center justify-between gap-2">
        {fixture.round && (
          <span className="text-[10px] font-semibold text-slate-500 leading-none">
            Round {fixture.round.name}
          </span>
        )}
        <span className="text-[9px] font-bold uppercase tracking-wide text-slate-400 leading-none">
          {isHome ? "Home" : "Away"}
        </span>
      </div>

      <div className="flex items-center gap-2">
        <div className="flex flex-col items-center gap-1 flex-1 min-w-0">
          <img
            src={resolvePlayerImageUrl(ownTeam?.imagePath ?? null)}
            alt={ownTeam?.name ?? "—"}
            className="h-8 w-8 object-contain"
          />
          <span className="text-[10px] font-semibold text-slate-700 leading-tight text-center truncate w-full">
            {ownTeam?.shortCode ?? ownTeam?.name ?? "—"}
          </span>
        </div>

        <div className="flex flex-col items-center gap-1 shrink-0">
          {isFinished ? (
            <span className="text-base font-black tabular-nums text-slate-900 leading-none">
              {ownScore}–{opponentScore}
            </span>
          ) : (
            <span className="text-[10px] font-medium text-slate-400 leading-none">vs</span>
          )}
          {result && (
            <span
              className="inline-block rounded-full px-1.5 py-0.5 text-[9px] font-black leading-none"
              style={{ color: result.color, background: result.bg }}
            >
              {result.label}
            </span>
          )}
        </div>

        <div className="flex flex-col items-center gap-1 flex-1 min-w-0">
          <img
            src={resolvePlayerImageUrl(opponent?.imagePath ?? null)}
            alt={opponent?.name ?? "—"}
            className="h-8 w-8 object-contain"
          />
          <span className="text-[10px] font-semibold text-slate-700 leading-tight text-center truncate w-full">
            {opponent?.shortCode ?? opponent?.name ?? "—"}
          </span>
        </div>
      </div>

      <div className="flex items-center justify-center">
        <div
          className="flex items-center gap-1 rounded-full px-2 py-1"
          style={{ background: ratingFill }}
        >
          <svg width={11} height={11} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 3l2.472 6.218L21 9.764l-4.944 4.33L17.472 21 12 17.27 6.528 21l1.416-6.906L3 9.764l6.528-.546Z" fill="#fff" />
          </svg>
          <span className="text-sm font-black tabular-nums text-white leading-none">{rating.toFixed(1)}</span>
        </div>
      </div>
    </Link>
  )
}

const RecentFormSkeleton = () => (
  <div className="flex flex-col gap-2 rounded-xl border border-slate-200/80 bg-white p-3 shadow-sm flex-1 min-w-0">
    <div className="flex items-center justify-between">
      <div className="h-2.5 w-12 animate-pulse rounded bg-slate-100" />
      <div className="h-2 w-8 animate-pulse rounded bg-slate-100" />
    </div>
    <div className="flex items-center gap-2">
      <div className="flex flex-col items-center gap-1 flex-1">
        <div className="h-8 w-8 animate-pulse rounded-full bg-slate-100" />
        <div className="h-2.5 w-10 animate-pulse rounded bg-slate-100" />
      </div>
      <div className="flex flex-col items-center gap-1">
        <div className="h-4 w-10 animate-pulse rounded bg-slate-100" />
        <div className="h-2.5 w-5 animate-pulse rounded bg-slate-100" />
      </div>
      <div className="flex flex-col items-center gap-1 flex-1">
        <div className="h-8 w-8 animate-pulse rounded-full bg-slate-100" />
        <div className="h-2.5 w-10 animate-pulse rounded bg-slate-100" />
      </div>
    </div>
    <div className="flex items-center justify-center">
      <div className="h-6 w-16 animate-pulse rounded-full bg-slate-100" />
    </div>
  </div>
)

const RecentFormEmptySlot = () => (
  <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-slate-200 bg-white/40 p-3 shadow-sm flex-1 min-w-0 min-h-[132px]">
    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100">
      <IconBallFootball size={14} className="text-slate-300" />
    </div>
    <span className="text-[10px] font-semibold text-slate-400">No match</span>
  </div>
)

const RECENT_FORM_SLOTS = 5

const RecentForm = ({
  ratingStats,
  fixtures,
  teamId,
}: {
  ratingStats: PlayerStatEntry[]
  fixtures: PlayerFixture[]
  teamId: number | null
}) => {
  const fixtureMap = new Map(fixtures.map((fixture) => [fixture.id, fixture]))

  const last5 = teamId
    ? [...ratingStats]
        .filter((stat) => typeof stat.value.normalizedValue === "number")
        .map((stat) => ({ stat, fixture: fixtureMap.get(stat.fixtureId) ?? null }))
        .filter((slot): slot is { stat: PlayerStatEntry; fixture: PlayerFixture } => slot.fixture !== null)
        .sort((slotA, slotB) => {
          const kickoffA = slotA.fixture.kickoffAt ? new Date(slotA.fixture.kickoffAt).getTime() : 0
          const kickoffB = slotB.fixture.kickoffAt ? new Date(slotB.fixture.kickoffAt).getTime() : 0
          if (kickoffA !== kickoffB) return kickoffB - kickoffA
          return slotB.stat.fixtureId - slotA.stat.fixtureId
        })
        .slice(0, RECENT_FORM_SLOTS)
    : []

  const missingSlots = Math.max(0, RECENT_FORM_SLOTS - last5.length)

  return (
    <div className="flex flex-col gap-3">
      <h2 className="px-1 text-sm font-bold text-slate-700">Last matches</h2>
      <div className="flex gap-2">
        {last5.map(({ stat, fixture }) => (
          <RecentFormCard key={stat.id} stat={stat} fixture={fixture} teamId={teamId!} />
        ))}
        {Array.from({ length: missingSlots }).map((_, index) => (
          <RecentFormEmptySlot key={`empty-${index}`} />
        ))}
      </div>
    </div>
  )
}

const careerColumnTemplate = (showSaves: boolean) =>
  showSaves
    ? "grid-cols-[64px_minmax(160px,1fr)_72px_72px_64px_72px_88px_64px_56px_64px_80px]"
    : "grid-cols-[64px_minmax(160px,1fr)_72px_72px_64px_72px_88px_64px_56px_80px]"

const CareerHistoryHeader = ({ showSaves }: { showSaves: boolean }) => (
  <div className={`grid ${careerColumnTemplate(showSaves)} items-center gap-2 border-b border-slate-100 bg-slate-50/60 px-4 py-2.5`}>
    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Season</span>
    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Team</span>
    <span className="text-center text-[10px] font-bold uppercase tracking-widest text-slate-500">Matches</span>
    <span className="text-center text-[10px] font-bold uppercase tracking-widest text-slate-500">Minutes</span>
    <span className="text-center text-[10px] font-bold uppercase tracking-widest text-slate-500">Goals</span>
    <span className="text-center text-[10px] font-bold uppercase tracking-widest text-slate-500">Assists</span>
    <span className="text-center text-[10px] font-bold uppercase tracking-widest text-slate-500">Goal contr.</span>
    <span className="text-center text-[10px] font-bold uppercase tracking-widest text-slate-500">Yellows</span>
    <span className="text-center text-[10px] font-bold uppercase tracking-widest text-slate-500">Reds</span>
    {showSaves && (
      <span className="text-center text-[10px] font-bold uppercase tracking-widest text-slate-500">Saves</span>
    )}
    <span className="text-right text-[10px] font-bold uppercase tracking-widest text-slate-500">Avg rating</span>
  </div>
)

const formatMinutes = (minutes: number | null) => {
  if (minutes == null) return null
  return new Intl.NumberFormat("en-GB").format(minutes)
}

const CareerHistoryRow = ({
  season,
  membership,
  isSelected,
  aggregates,
  showSaves,
}: {
  season: { id: number; name: string }
  membership: PlayerMembership | null
  isSelected: boolean
  aggregates: PlayerSeasonAggregates | null
  showSaves: boolean
}) => {
  const hasPlayed = aggregates !== null && aggregates.appearances > 0
  const appearances = hasPlayed ? aggregates.appearances : null
  const goals = hasPlayed ? aggregates.goals : null
  const assists = hasPlayed ? aggregates.assists : null
  const minutes = hasPlayed ? aggregates.totalMinutes : null
  const avgRating = hasPlayed ? aggregates.avgRating : null
  const yellows = hasPlayed ? aggregates.yellowCards : null
  const reds = hasPlayed ? aggregates.redCards : null
  const saves = hasPlayed ? aggregates.saves : null
  const goalContributions = hasPlayed && goals != null && assists != null ? goals + assists : null

  const numericCell = (value: number | null) => (
    <span className="text-center text-xs font-semibold tabular-nums text-slate-800">
      {value != null ? value : <span className="text-slate-300">—</span>}
    </span>
  )

  return (
    <div className={`grid ${careerColumnTemplate(showSaves)} items-center gap-2 px-4 py-3 ${isSelected ? "bg-slate-50" : ""}`}>
      <span className="text-xs font-bold text-slate-600">{season.name}</span>
      {membership ? (
        <div className="flex items-center gap-2 min-w-0">
          {membership.team.imagePath ? (
            <img src={membership.team.imagePath} alt={membership.team.name} className="h-5 w-5 shrink-0 object-contain" />
          ) : (
            <IconShieldFilled size={14} className="shrink-0 text-slate-300" />
          )}
          <Link
            href={`/teams/${membership.team.id}`}
            className="truncate text-sm font-semibold text-slate-800 hover:text-slate-600 transition-colors"
          >
            {membership.team.name}
          </Link>
          {membership.isLoan && (
            <span className="shrink-0 rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-700">
              Loan
            </span>
          )}
        </div>
      ) : (
        <span className="text-sm text-slate-400">No data</span>
      )}
      {numericCell(appearances)}
      <span className="text-center text-xs font-semibold tabular-nums text-slate-800">
        {minutes != null ? formatMinutes(minutes) : <span className="text-slate-300">—</span>}
      </span>
      {numericCell(goals)}
      {numericCell(assists)}
      {numericCell(goalContributions)}
      <span className="flex items-center justify-center gap-1">
        {yellows != null && yellows > 0 && <YellowCard size={10} />}
        <span className="text-xs font-semibold tabular-nums text-slate-800">
          {yellows != null ? yellows : <span className="text-slate-300">—</span>}
        </span>
      </span>
      <span className="flex items-center justify-center gap-1">
        {reds != null && reds > 0 && <RedCard size={10} />}
        <span className="text-xs font-semibold tabular-nums text-slate-800">
          {reds != null ? reds : <span className="text-slate-300">—</span>}
        </span>
      </span>
      {showSaves && numericCell(saves)}
      <div className="flex justify-end">
        {avgRating !== null ? (
          <span
            className="inline-flex items-center justify-center rounded-md px-2 font-black tabular-nums text-xs text-white"
            style={{ background: getRatingFill(avgRating), minWidth: 48, height: 22 }}
          >
            {avgRating.toFixed(2)}
          </span>
        ) : (
          <span className="text-xs text-slate-300">—</span>
        )}
      </div>
    </div>
  )
}

const ContentSkeleton = () => (
  <div className="flex flex-col gap-6">
    <div className="grid gap-3 grid-cols-2 sm:grid-cols-4 lg:grid-cols-7">
      {Array.from({ length: 7 }).map((_, index) => (
        <div
          key={index}
          className="flex flex-col items-center gap-2 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm"
        >
          <div className="h-9 w-9 animate-pulse rounded-full bg-slate-100" />
          <div className="h-7 w-10 animate-pulse rounded bg-slate-200" />
          <div className="h-2.5 w-14 animate-pulse rounded bg-slate-100" />
        </div>
      ))}
    </div>
    <div className="flex flex-col gap-3">
      <div className="h-4 w-24 animate-pulse rounded bg-slate-200" />
      <div className="flex gap-2">
        {Array.from({ length: RECENT_FORM_SLOTS }).map((_, index) => (
          <RecentFormSkeleton key={index} />
        ))}
      </div>
    </div>
    <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
      <div className="flex flex-col gap-3">
        <div className="h-4 w-24 animate-pulse rounded bg-slate-200" />
        <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className={`flex items-center gap-4 px-4 py-3 ${index < 3 ? "border-b border-slate-100" : ""}`}>
              <div className="h-3 w-10 animate-pulse rounded bg-slate-100" />
              <div className="h-5 w-5 animate-pulse rounded-full bg-slate-100 shrink-0" />
              <div className="h-3.5 w-32 animate-pulse rounded bg-slate-100 flex-1" />
              <div className="h-3 w-10 animate-pulse rounded bg-slate-100" />
            </div>
          ))}
        </div>
      </div>
      <div className="flex flex-col gap-3">
        <div className="h-4 w-20 animate-pulse rounded bg-slate-200" />
        <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="flex justify-between">
                <div className="h-3 w-16 animate-pulse rounded bg-slate-100" />
                <div className="h-3 w-24 animate-pulse rounded bg-slate-100" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  </div>
)

const PlayerSeasonContent = async ({
  player,
  memberships,
  allSeasons,
  selectedSeasonId,
  selectedStageId,
}: {
  player: PlayerDetail
  memberships: PlayerMembership[]
  allSeasons: import("@/lib/seasons").Season[]
  selectedSeasonId: number
  selectedStageId: number | null
}) => {
  const selectedMembership =
    memberships.find((membership) => membership.season.id === selectedSeasonId) ?? null

  const teamId = selectedMembership?.team.id ?? null
  const resolvedPositionId =
    selectedMembership?.positionId ??
    player.positionId ??
    memberships.find((m) => m.positionId != null)?.positionId ??
    null
  const isGoalkeeper = resolvedPositionId === 24

  const [ratingStats, minuteStats, assistStats, events, fixtures, saveStats] = await Promise.all([
    getPlayerStatsByType(player.id, STAT_TYPE_RATING, selectedSeasonId, selectedStageId ?? undefined).catch(() => []),
    getPlayerStatsByType(player.id, STAT_TYPE_MINUTES, selectedSeasonId, selectedStageId ?? undefined).catch(() => []),
    getPlayerStatsByType(player.id, STAT_TYPE_ASSISTS, selectedSeasonId, selectedStageId ?? undefined).catch(() => []),
    getPlayerSeasonEvents(player.id, selectedSeasonId, selectedStageId ?? undefined).catch(() => []),
    teamId
      ? getPlayerTeamFixtures(teamId, selectedSeasonId, selectedStageId ?? undefined).catch(() => [])
      : Promise.resolve([]),
    getPlayerStatsByType(player.id, STAT_TYPE_SAVES, selectedSeasonId, selectedStageId ?? undefined).catch(() => []),
  ])

  const aggregates: PlayerSeasonAggregates = computePlayerSeasonAggregates(
    ratingStats, minuteStats, assistStats, events, saveStats,
  )

  const hasAppearances = aggregates.appearances > 0
  const showSavesCard = isGoalkeeper || aggregates.saves > 0

  const seasonAggregatesMap = new Map<number, PlayerSeasonAggregates>()
  if (memberships.length > 0) {
    const perSeasonResults = await Promise.all(
      memberships.map(async (membership) => {
        const seasonId = membership.season.id
        const isMembershipGoalkeeper = membership.positionId === 24 || isGoalkeeper
        const seasonStages = filterMainStages(await getStages(seasonId).catch(() => []))
        if (seasonStages.length === 0) {
          return { seasonId, aggregates: computePlayerSeasonAggregates([], [], [], [], []) }
        }
        const perStageResults = await Promise.all(
          seasonStages.map((stage) =>
            Promise.all([
              getPlayerStatsByType(player.id, STAT_TYPE_RATING, seasonId, stage.id).catch(() => []),
              getPlayerStatsByType(player.id, STAT_TYPE_MINUTES, seasonId, stage.id).catch(() => []),
              getPlayerStatsByType(player.id, STAT_TYPE_ASSISTS, seasonId, stage.id).catch(() => []),
              getPlayerSeasonEvents(player.id, seasonId, stage.id).catch(() => []),
              isMembershipGoalkeeper
                ? getPlayerStatsByType(player.id, STAT_TYPE_SAVES, seasonId, stage.id).catch(() => [])
                : Promise.resolve([] as PlayerStatEntry[]),
            ])
          )
        )
        const ratings = perStageResults.flatMap((stageResult) => stageResult[0])
        const minutes = perStageResults.flatMap((stageResult) => stageResult[1])
        const assists = perStageResults.flatMap((stageResult) => stageResult[2])
        const seasonEvents = perStageResults.flatMap((stageResult) => stageResult[3])
        const saves = perStageResults.flatMap((stageResult) => stageResult[4])
        return { seasonId, aggregates: computePlayerSeasonAggregates(ratings, minutes, assists, seasonEvents, saves) }
      })
    )
    for (const entry of perSeasonResults) {
      seasonAggregatesMap.set(entry.seasonId, entry.aggregates)
    }
  }

  const sortedAllSeasons = [...allSeasons].sort(
    (firstSeason, secondSeason) => Number(secondSeason.name) - Number(firstSeason.name),
  )
  const membershipBySeasonId = new Map(memberships.map((membership) => [membership.season.id, membership]))
  const careerShowSaves =
    isGoalkeeper || Array.from(seasonAggregatesMap.values()).some((entry) => entry.saves > 0)

  return (
    <div className="flex flex-col gap-6">

      
      <div className="grid gap-3 grid-cols-2 sm:grid-cols-4 lg:grid-cols-7">
        <RatingStatCard avgRating={aggregates.avgRating} hasData={hasAppearances} />
        <StatCard
          label="Matches"
          value={aggregates.appearances}
          icon={<ShirtIcon size={20} />}
          hasData={hasAppearances}
        />
        <StatCard
          label="Goals"
          value={aggregates.goals}
          icon={<BallIcon size={20} />}
          hasData={hasAppearances}
        />
        <StatCard
          label="Assists"
          value={aggregates.assists}
          icon={<AssistIcon size={20} />}
          hasData={hasAppearances}
        />
        <StatCard
          label="Minutes"
          value={aggregates.totalMinutes}
          icon={<ClockIcon size={20} />}
          hasData={hasAppearances}
        />
        <StatCard
          label="Yellows"
          value={aggregates.yellowCards}
          icon={<YellowCard size={14} />}
          hasData={hasAppearances}
        />
        {showSavesCard ? (
          <StatCard
            label="Saves"
            value={aggregates.saves}
            icon={<SavesIcon size={20} />}
            hasData={hasAppearances}
          />
        ) : (
          <StatCard
            label="Reds"
            value={aggregates.redCards}
            icon={<RedCard size={14} />}
            hasData={hasAppearances}
          />
        )}
      </div>

      {!hasAppearances && (
        <div className="flex h-12 items-center justify-center rounded-2xl border border-dashed border-slate-200 text-sm text-slate-400">
          No match data recorded for this season
        </div>
      )}

      
      <RecentForm ratingStats={ratingStats} fixtures={fixtures} teamId={teamId} />

      
      <div className="flex flex-col gap-3">
        <div className="flex items-baseline justify-between px-1">
          <h2 className="text-sm font-bold text-slate-700">Career history</h2>
          <span className="text-[11px] text-slate-400">Apertura + Clausura · {sortedAllSeasons.length} seasons</span>
        </div>
        {sortedAllSeasons.length === 0 ? (
          <div className="flex h-24 items-center justify-center rounded-2xl border border-dashed border-slate-200 text-sm text-slate-400">
            No season data available
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-slate-200/80 bg-white shadow-sm">
            <div className="min-w-[960px]">
              <CareerHistoryHeader showSaves={careerShowSaves} />
              <div className="divide-y divide-slate-100">
                {sortedAllSeasons.map((season) => (
                  <CareerHistoryRow
                    key={season.id}
                    season={season}
                    membership={membershipBySeasonId.get(season.id) ?? null}
                    isSelected={season.id === selectedSeasonId}
                    aggregates={seasonAggregatesMap.get(season.id) ?? null}
                    showSaves={careerShowSaves}
                  />
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

    </div>
  )
}

interface PlayerPageProps {
  params: Promise<{ id: string }>
  searchParams: Promise<{ seasonId?: string; stageId?: string }>
}

const PlayerPage = async ({ params, searchParams }: PlayerPageProps) => {
  const [{ id }, { seasonId: seasonIdParam, stageId: stageIdParam }] = await Promise.all([params, searchParams])
  const playerId = Number(id)

  if (isNaN(playerId)) notFound()

  const [playerResult, membershipsResult, seasonsResult] = await Promise.allSettled([
    getPlayer(playerId),
    getPlayerSquadMemberships(playerId),
    getSeasons(),
  ])

  if (playerResult.status === "rejected") notFound()

  const player = playerResult.value
  const memberships = membershipsResult.status === "fulfilled" ? membershipsResult.value : []
  const allSeasons = seasonsResult.status === "fulfilled" ? seasonsResult.value : []

  const sortedMemberships = [...memberships].sort(
    (firstMembership, secondMembership) =>
      Number(secondMembership.season.name) - Number(firstMembership.season.name),
  )

  const membershipSeasonIds = new Set(sortedMemberships.map((membership) => membership.season.id))
  const playerSeasons: Season[] = allSeasons
    .filter((season) => membershipSeasonIds.has(season.id))
    .sort((firstSeason, secondSeason) => Number(secondSeason.name) - Number(firstSeason.name))

  const defaultMembership = sortedMemberships[0] ?? null

  const requestedSeasonId = seasonIdParam ? Number(seasonIdParam) : null
  const hasRequestedMembership =
    requestedSeasonId !== null &&
    sortedMemberships.some((membership) => membership.season.id === requestedSeasonId)

  const selectedSeasonId = hasRequestedMembership
    ? requestedSeasonId
    : (defaultMembership?.season.id ?? null)

  const selectedMembership =
    sortedMemberships.find((membership) => membership.season.id === selectedSeasonId) ??
    defaultMembership ??
    null

  const allStages: Stage[] = selectedSeasonId
    ? await getStages(selectedSeasonId).catch(() => [])
    : []
  const stages = filterMainStages(allStages)

  const defaultStage = stages.find((stage) => stage.isCurrent) ?? stages[stages.length - 1] ?? null
  const requestedStageId = stageIdParam ? Number(stageIdParam) : null
  const hasRequestedStage =
    requestedStageId !== null && stages.some((stage) => stage.id === requestedStageId)
  const selectedStageId: number | null = stages.length > 0
    ? (hasRequestedStage ? requestedStageId! : (defaultStage?.id ?? null))
    : null

  const displayName = player.displayName ?? player.commonName ?? player.name
  const positionId = selectedMembership?.positionId ?? player.positionId ?? null
  const positionLabel = positionId ? (POSITION_LABELS[positionId] ?? null) : null
  const positionStyle = positionId ? (POSITION_COLORS[positionId] ?? null) : null

  if (!selectedSeasonId) {
    return (
      <main className="min-h-svh bg-slate-50">
        <div className="mx-auto w-full max-w-7xl px-6 py-8">
          <p className="text-sm text-slate-500">No season data available for this player.</p>
        </div>
      </main>
    )
  }

  const committedParams: Record<string, string> = { seasonId: String(selectedSeasonId) }
  if (hasRequestedStage && selectedStageId !== null) committedParams.stageId = String(selectedStageId)

  const heroAge = formatAge(player.dateOfBirth)
  const heroDob = formatDateOfBirth(player.dateOfBirth)
  const heroMetaParts: string[] = []
  if (heroDob) heroMetaParts.push(heroAge ? `${heroDob} (${heroAge} yrs)` : heroDob)
  if (player.height) heroMetaParts.push(`${player.height} cm`)
  if (player.weight) heroMetaParts.push(`${player.weight} kg`)
  if (selectedMembership?.shirtNumber != null) heroMetaParts.push(`#${selectedMembership.shirtNumber}`)

  return (
    <main className="min-h-svh bg-[linear-gradient(180deg,#f8fafc_0%,#f8fafc_48%,#eef2f7_100%)]">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-6 py-8 sm:px-8 lg:px-10">

        
        <div className="overflow-hidden rounded-2xl shadow-lg">
          <div className="relative min-h-56 bg-slate-900">
            <HeroTexture />
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/5 to-black/40 pointer-events-none" />

            <div className="absolute left-5 top-5 z-10">
              <Link
                href={`/players?seasonId=${selectedSeasonId}${selectedStageId ? `&stageId=${selectedStageId}` : ""}`}
                className="inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-xl border border-white/20 bg-white/15 pl-3 pr-4 text-sm font-semibold text-white backdrop-blur-sm transition-colors hover:bg-white/25"
              >
                <IconArrowLeft size={15} />
                Players
              </Link>
            </div>

            <div className="absolute bottom-0 left-0 right-0 flex items-end justify-between gap-5 p-6">
              <div className="flex items-end gap-5 min-w-0">
                <div className="h-20 w-20 shrink-0 overflow-hidden rounded-full bg-slate-700 ring-2 ring-white/20 shadow-xl">
                  <img
                    src={resolvePlayerImageUrl(player.imagePath)}
                    alt={displayName}
                    className="h-full w-full object-cover object-top"
                  />
                </div>
                <div className="min-w-0 flex flex-col gap-1.5 pb-1">
                  <h1 className="text-3xl font-black text-white leading-none drop-shadow">{displayName}</h1>
                  <div className="flex flex-wrap items-center gap-2">
                    {positionId && POSITION_CONFIG[positionId] && (
                      <PositionCircle positionId={positionId} size={20} />
                    )}
                    {positionStyle && !POSITION_CONFIG[positionId ?? -1] && (
                      <span className={`rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${positionStyle.badge}`}>
                        {positionLabel}
                      </span>
                    )}
                    {selectedMembership?.team && (
                      <Link
                        href={`/teams/${selectedMembership.team.id}`}
                        className="flex items-center gap-1.5 hover:opacity-80 transition-opacity"
                      >
                        {selectedMembership.team.imagePath && (
                          <img src={selectedMembership.team.imagePath} alt={selectedMembership.team.name} className="h-4 w-4 object-contain" />
                        )}
                        <span className="text-sm font-semibold text-white/80">{selectedMembership.team.name}</span>
                      </Link>
                    )}
                    {player.country && (
                      <div className="flex items-center gap-1.5">
                        {player.country.imageUrl && (
                          <img
                            src={player.country.imageUrl}
                            alt={player.country.name}
                            className="h-[12px] w-[18px] rounded-[2px] object-cover ring-1 ring-white/20"
                          />
                        )}
                        <span className="text-xs text-white/60">{player.country.name}</span>
                      </div>
                    )}
                  </div>
                  {heroMetaParts.length > 0 && (
                    <p className="text-[11px] text-white/55">
                      {heroMetaParts.join(" · ")}
                    </p>
                  )}
                </div>
              </div>

              <Suspense>
                <PlayerSeasonStageSelector
                  seasons={playerSeasons}
                  stages={stages}
                  selectedSeasonId={selectedSeasonId}
                  selectedStageId={selectedStageId}
                />
              </Suspense>
            </div>
          </div>
        </div>

        
        <Suspense fallback={<ContentSkeleton />}>
          <SearchParamsLoadingBoundary
            committedParams={committedParams}
            skeleton={<ContentSkeleton />}
          >
            <PlayerSeasonContent
              player={player}
              memberships={memberships}
              allSeasons={allSeasons}
              selectedSeasonId={selectedSeasonId}
              selectedStageId={selectedStageId}
            />
          </SearchParamsLoadingBoundary>
        </Suspense>

      </div>
    </main>
  )
}

export default PlayerPage
