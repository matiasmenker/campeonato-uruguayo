import { Suspense } from "react"
import Link from "next/link"
import { notFound } from "next/navigation"
import { IconArrowLeft, IconShieldFilled } from "@tabler/icons-react"
import HeroTexture from "@/components/hero-texture"
import SearchParamsLoadingBoundary from "@/components/search-params-loading-boundary"
import TeamSeasonSelector from "@/components/team-season-selector"
import { getSeasons, type Season } from "@/lib/seasons"
import { resolvePlayerImageUrl } from "@/lib/player"
import { getRatingColors, getRatingFill } from "@/lib/rating"
import {
  getPlayer,
  getPlayerSquadMemberships,
  getPlayerStatsByType,
  getPlayerSeasonEvents,
  computePlayerSeasonAggregates,
  STAT_TYPE_RATING,
  STAT_TYPE_MINUTES,
  STAT_TYPE_ASSISTS,
  POSITION_LABELS,
  POSITION_CODES,
  POSITION_COLORS,
  type PlayerDetail,
  type PlayerMembership,
  type PlayerStatEntry,
  type PlayerSeasonAggregates,
} from "@/lib/players"

export const revalidate = 300

// ─── Shared mini icons (same visual language as /matches/[id]) ───────────────

const BallIcon = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="11" fill="#fff" />
    <path fill="#1a1a1a" d="M12 0a12 12 0 1 0 12 12A12 12 0 0 0 12 0Zm8.42 6.63-.48 1.74-4.18 1.36-2.76-2v-4.4l1.5-1a10 10 0 0 1 5.92 4.3ZM9.5 2.33l1.5 1v4.4l-2.76 2-4.18-1.36-.48-1.74a10 10 0 0 1 5.92-4.3ZM2 12v-.49l1.55-1.21 4.11 1.34 1 3.2-2.54 3.5-1.94-.08A9.89 9.89 0 0 1 2 12Zm6.24 9.26-.58-1.58L10.33 16h3.34l2.67 3.68-.58 1.58a9.92 9.92 0 0 1-7.52 0Zm11.54-3-1.94.08-2.54-3.5 1-3.2 4.11-1.34L22 11.51V12a9.89 9.89 0 0 1-2.22 6.26Z" />
  </svg>
)

const AssistIcon = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="12" fill="#3b82f6" />
    <path d="M2 13h16.51l-4.23 4.3 1.44 1.4 5.87-6a1 1 0 0 0 0-1.39l-5.87-6-1.44 1.39 4.23 4.3H2Z" fill="#fff" />
  </svg>
)

const ClockIcon = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="12" fill="#64748b" />
    <circle cx="12" cy="12" r="7" stroke="#fff" strokeWidth="1.5" fill="none" />
    <path d="M12 8.5V12l2.5 2.5" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

const StarIcon = ({ size = 16, fill }: { size?: number; fill: string }) => (
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

// ─── Helpers ─────────────────────────────────────────────────────────────────

const formatAge = (dateOfBirth: string | null): string | null => {
  if (!dateOfBirth) return null
  const birthDate = new Date(dateOfBirth)
  return String(Math.floor((Date.now() - birthDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000)))
}

const formatDateOfBirth = (dateOfBirth: string | null): string | null => {
  if (!dateOfBirth) return null
  return new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric" }).format(
    new Date(dateOfBirth),
  )
}

// ─── Stat cards ──────────────────────────────────────────────────────────────

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
      style={
        colors
          ? { backgroundColor: colors.muted, borderColor: `${colors.fill}40` }
          : { borderColor: "rgba(226,232,240,0.8)" }
      }
    >
      <div className="flex h-9 w-9 items-center justify-center">
        <StarIcon size={20} fill={colors?.fill ?? "#94a3b8"} />
      </div>
      <div className="flex flex-col items-center gap-0.5">
        <span
          className="text-2xl font-black tabular-nums leading-none"
          style={{ color: colors?.text ?? "#0f172a" }}
        >
          {hasData && avgRating !== null ? avgRating.toFixed(2) : "—"}
        </span>
        <span
          className="text-[10px] font-semibold uppercase tracking-wide"
          style={{ color: colors ? `${colors.text}99` : "#94a3b8" }}
        >
          Avg rating
        </span>
      </div>
    </div>
  )
}

// ─── Recent form ─────────────────────────────────────────────────────────────

const RecentForm = ({ ratingStats }: { ratingStats: PlayerStatEntry[] }) => {
  const sortedByFixture = [...ratingStats]
    .sort((firstStat, secondStat) => secondStat.fixtureId - firstStat.fixtureId)
    .slice(0, 10)

  if (sortedByFixture.length === 0) return null

  return (
    <div className="flex flex-col gap-3">
      <h2 className="px-1 text-sm font-bold text-slate-700">Recent form</h2>
      <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
        <div className="flex items-end gap-1.5">
          {sortedByFixture.map((stat) => {
            const rating = typeof stat.value.normalizedValue === "number" ? stat.value.normalizedValue : null
            if (rating === null) return null
            const fillColor = getRatingFill(rating)
            const heightPct = Math.round(((rating - 4) / 6) * 100)
            return (
              <div
                key={stat.id}
                className="flex flex-1 flex-col items-center gap-1"
                title={`Fixture ${stat.fixtureId}: ${rating.toFixed(1)}`}
              >
                <span className="text-[10px] font-bold tabular-nums" style={{ color: fillColor }}>
                  {rating.toFixed(1)}
                </span>
                <div className="w-full overflow-hidden rounded-full" style={{ height: 48, background: "#f1f5f9" }}>
                  <div
                    className="w-full rounded-full transition-all"
                    style={{
                      height: `${Math.max(heightPct, 10)}%`,
                      marginTop: `${100 - Math.max(heightPct, 10)}%`,
                      background: fillColor,
                      opacity: 0.85,
                    }}
                  />
                </div>
              </div>
            )
          })}
        </div>
        <p className="mt-2 text-center text-[10px] text-slate-400">Last {sortedByFixture.length} matches · newest left</p>
      </div>
    </div>
  )
}

// ─── Season history row ───────────────────────────────────────────────────────

const SeasonHistoryRow = ({
  membership,
  isSelected,
}: {
  membership: PlayerMembership
  isSelected: boolean
}) => (
  <div className={`flex items-center gap-3 px-4 py-3 ${isSelected ? "bg-slate-50" : ""}`}>
    <span className="w-12 shrink-0 text-xs font-bold text-slate-400">{membership.season.name}</span>
    <div className="flex items-center gap-2 min-w-0 flex-1">
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
    {membership.shirtNumber !== null && (
      <span className="shrink-0 text-xs font-medium text-slate-400">#{membership.shirtNumber}</span>
    )}
    {isSelected && <div className="h-1.5 w-1.5 shrink-0 rounded-full bg-slate-900" />}
  </div>
)

// ─── Content skeleton ─────────────────────────────────────────────────────────

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

// ─── Season content (fetches & renders per-season stats) ─────────────────────

const PlayerSeasonContent = async ({
  player,
  memberships,
  selectedSeasonId,
}: {
  player: PlayerDetail
  memberships: PlayerMembership[]
  selectedSeasonId: number
}) => {
  const [ratingStats, minuteStats, assistStats, events] = await Promise.all([
    getPlayerStatsByType(player.id, STAT_TYPE_RATING, selectedSeasonId).catch(() => []),
    getPlayerStatsByType(player.id, STAT_TYPE_MINUTES, selectedSeasonId).catch(() => []),
    getPlayerStatsByType(player.id, STAT_TYPE_ASSISTS, selectedSeasonId).catch(() => []),
    getPlayerSeasonEvents(player.id, selectedSeasonId).catch(() => []),
  ])

  const aggregates: PlayerSeasonAggregates = computePlayerSeasonAggregates(
    ratingStats,
    minuteStats,
    assistStats,
    events,
  )

  const hasAppearances = aggregates.appearances > 0

  const sortedMemberships = [...memberships].sort(
    (firstMembership, secondMembership) =>
      Number(secondMembership.season.name) - Number(firstMembership.season.name),
  )

  const selectedMembership =
    sortedMemberships.find((membership) => membership.season.id === selectedSeasonId) ?? null

  const dobFormatted = formatDateOfBirth(player.dateOfBirth)
  const age = formatAge(player.dateOfBirth)

  return (
    <div className="flex flex-col gap-6">

      {/* ── Stat cards ── */}
      <div className="grid gap-3 grid-cols-2 sm:grid-cols-4 lg:grid-cols-7">
        <StatCard
          label="Matches"
          value={aggregates.appearances}
          icon={<BallIcon size={20} />}
          hasData={hasAppearances}
        />
        <RatingStatCard avgRating={aggregates.avgRating} hasData={hasAppearances} />
        <StatCard
          label="Minutes"
          value={aggregates.totalMinutes}
          icon={<ClockIcon size={20} />}
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
          label="Yellows"
          value={aggregates.yellowCards}
          icon={<YellowCard size={14} />}
          hasData={hasAppearances}
        />
        <StatCard
          label="Reds"
          value={aggregates.redCards}
          icon={<RedCard size={14} />}
          hasData={hasAppearances}
        />
      </div>

      {!hasAppearances && (
        <div className="flex h-12 items-center justify-center rounded-2xl border border-dashed border-slate-200 text-sm text-slate-400">
          No match data recorded for this season
        </div>
      )}

      {/* ── Recent form bar chart ── */}
      {hasAppearances && ratingStats.length > 0 && (
        <RecentForm ratingStats={ratingStats} />
      )}

      {/* ── Two-column: Season history + Profile ── */}
      <div className="grid gap-6 lg:grid-cols-[1fr_300px]">

        {sortedMemberships.length > 0 && (
          <div className="flex flex-col gap-3">
            <h2 className="px-1 text-sm font-bold text-slate-700">Season history</h2>
            <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm divide-y divide-slate-100">
              {sortedMemberships.map((membership) => (
                <SeasonHistoryRow
                  key={membership.id}
                  membership={membership}
                  isSelected={membership.season.id === selectedSeasonId}
                />
              ))}
            </div>
          </div>
        )}

        <div className="flex flex-col gap-3">
          <h2 className="px-1 text-sm font-bold text-slate-700">Profile</h2>
          <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm divide-y divide-slate-100">
            {dobFormatted && (
              <div className="flex items-center justify-between px-4 py-3">
                <span className="text-xs font-semibold text-slate-500">Date of birth</span>
                <span className="text-sm text-slate-800">
                  {dobFormatted}
                  {age && <span className="ml-1.5 text-slate-400">({age} yrs)</span>}
                </span>
              </div>
            )}
            {player.height && (
              <div className="flex items-center justify-between px-4 py-3">
                <span className="text-xs font-semibold text-slate-500">Height</span>
                <span className="text-sm text-slate-800">{player.height} cm</span>
              </div>
            )}
            {player.weight && (
              <div className="flex items-center justify-between px-4 py-3">
                <span className="text-xs font-semibold text-slate-500">Weight</span>
                <span className="text-sm text-slate-800">{player.weight} kg</span>
              </div>
            )}
            {player.country && (
              <div className="flex items-center justify-between px-4 py-3">
                <span className="text-xs font-semibold text-slate-500">Nationality</span>
                <div className="flex items-center gap-2">
                  {player.country.imageUrl && (
                    <img
                      src={player.country.imageUrl}
                      alt={player.country.name}
                      className="h-[14px] w-[22px] rounded-[2px] object-cover ring-1 ring-black/10"
                    />
                  )}
                  <span className="text-sm text-slate-800">{player.country.name}</span>
                </div>
              </div>
            )}
            {selectedMembership?.shirtNumber != null && (
              <div className="flex items-center justify-between px-4 py-3">
                <span className="text-xs font-semibold text-slate-500">Shirt number</span>
                <span className="text-sm font-bold text-slate-900">#{selectedMembership.shirtNumber}</span>
              </div>
            )}
            {!dobFormatted && !player.height && !player.country && !selectedMembership?.shirtNumber && (
              <div className="flex h-24 items-center justify-center text-sm text-slate-400">
                No profile data available
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

interface PlayerPageProps {
  params: Promise<{ id: string }>
  searchParams: Promise<{ seasonId?: string }>
}

const PlayerPage = async ({ params, searchParams }: PlayerPageProps) => {
  const [{ id }, { seasonId: seasonIdParam }] = await Promise.all([params, searchParams])
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

  // Default to the most recent season the player belongs to (sorted descending by year).
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

  const displayName = player.displayName ?? player.commonName ?? player.name
  const positionId = selectedMembership?.positionId ?? player.positionId ?? null
  const positionLabel = positionId ? (POSITION_LABELS[positionId] ?? null) : null
  const positionCode = positionId ? (POSITION_CODES[positionId] ?? null) : null
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

  return (
    <main className="min-h-svh bg-[linear-gradient(180deg,#f8fafc_0%,#f8fafc_48%,#eef2f7_100%)]">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-6 py-8 sm:px-8 lg:px-10">

        {/* ── Hero ── */}
        <div className="overflow-hidden rounded-2xl shadow-lg">
          <div className="relative min-h-56 bg-slate-900">
            <HeroTexture />
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/5 to-black/40 pointer-events-none" />

            {/* Direct link — no router.back() since label "Players" should always go to /players */}
            <div className="absolute left-5 top-5 z-10">
              <Link
                href="/players"
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
                    {positionCode && positionStyle && (
                      <span className={`rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${positionStyle.badge}`}>
                        {positionLabel ?? positionCode}
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
                </div>
              </div>

              {playerSeasons.length > 1 && (
                <Suspense>
                  <TeamSeasonSelector seasons={playerSeasons} selectedSeasonId={selectedSeasonId} />
                </Suspense>
              )}
            </div>
          </div>
        </div>

        {/* ── Season content ── */}
        <Suspense fallback={<ContentSkeleton />}>
          <SearchParamsLoadingBoundary
            committedParams={{ seasonId: String(selectedSeasonId) }}
            skeleton={<ContentSkeleton />}
          >
            <PlayerSeasonContent
              player={player}
              memberships={memberships}
              selectedSeasonId={selectedSeasonId}
            />
          </SearchParamsLoadingBoundary>
        </Suspense>

      </div>
    </main>
  )
}

export default PlayerPage
