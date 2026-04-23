import { Suspense } from "react"
import Link from "next/link"
import { notFound } from "next/navigation"
import { IconShieldFilled } from "@tabler/icons-react"
import HeroBackLink from "@/components/hero-back-link"
import HeroTexture from "@/components/hero-texture"
import SearchParamsLoadingBoundary from "@/components/search-params-loading-boundary"
import TeamSeasonSelector from "@/components/team-season-selector"
import { getSeasons, type Season } from "@/lib/seasons"
import { resolvePlayerImageUrl } from "@/lib/player"
import { getRatingColors } from "@/lib/rating"
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
  type PlayerSeasonAggregates,
} from "@/lib/players"

export const revalidate = 300

const formatAge = (dateOfBirth: string | null): string | null => {
  if (!dateOfBirth) return null
  const birthDate = new Date(dateOfBirth)
  const ageInMs = Date.now() - birthDate.getTime()
  const ageInYears = Math.floor(ageInMs / (365.25 * 24 * 60 * 60 * 1000))
  return String(ageInYears)
}

const formatDateOfBirth = (dateOfBirth: string | null): string | null => {
  if (!dateOfBirth) return null
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(dateOfBirth))
}

const StatCard = ({ label, value }: { label: string; value: string | number | null }) => (
  <div className="flex flex-col items-center gap-1.5 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm text-center">
    <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">{label}</span>
    <span className="text-2xl font-black tabular-nums text-slate-900">{value ?? "—"}</span>
  </div>
)

const RatingStatCard = ({ avgRating }: { avgRating: number | null }) => {
  if (avgRating === null) {
    return (
      <div className="flex flex-col items-center gap-1.5 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm text-center">
        <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Avg rating</span>
        <span className="text-2xl font-black tabular-nums text-slate-900">—</span>
      </div>
    )
  }
  const colors = getRatingColors(avgRating)
  return (
    <div
      className="flex flex-col items-center gap-1.5 rounded-2xl border p-4 shadow-sm text-center"
      style={{
        backgroundColor: colors.muted,
        borderColor: `${colors.fill}33`,
      }}
    >
      <span className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: colors.text }}>
        Avg rating
      </span>
      <span className="text-2xl font-black tabular-nums" style={{ color: colors.text }}>
        {avgRating.toFixed(2)}
      </span>
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
          <div className="h-3 w-16 animate-pulse rounded bg-slate-100" />
          <div className="h-7 w-12 animate-pulse rounded bg-slate-200" />
        </div>
      ))}
    </div>
    <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
      <div className="flex flex-col gap-4">
        <div className="h-4 w-24 animate-pulse rounded bg-slate-200" />
        <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
          {Array.from({ length: 5 }).map((_, index) => (
            <div
              key={index}
              className={`flex items-center gap-4 px-4 py-3 ${index < 4 ? "border-b border-slate-100" : ""}`}
            >
              <div className="h-3 w-8 animate-pulse rounded bg-slate-100" />
              <div className="h-3 w-28 animate-pulse rounded bg-slate-100 flex-1" />
              <div className="h-3 w-12 animate-pulse rounded bg-slate-100" />
            </div>
          ))}
        </div>
      </div>
      <div className="flex flex-col gap-4">
        <div className="h-4 w-20 animate-pulse rounded bg-slate-200" />
        <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-3">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="flex justify-between">
                <div className="h-3 w-16 animate-pulse rounded bg-slate-100" />
                <div className="h-3 w-20 animate-pulse rounded bg-slate-100" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  </div>
)

const SeasonHistoryRow = ({
  membership,
  isSelected,
}: {
  membership: PlayerMembership
  isSelected: boolean
}) => (
  <div
    className={`flex items-center gap-3 px-4 py-3 ${isSelected ? "bg-slate-50" : ""}`}
  >
    <span className="w-12 shrink-0 text-xs font-semibold text-slate-500">{membership.season.name}</span>
    <div className="flex items-center gap-2 min-w-0 flex-1">
      {membership.team.imagePath ? (
        <img
          src={membership.team.imagePath}
          alt={membership.team.name}
          className="h-5 w-5 shrink-0 object-contain"
        />
      ) : (
        <IconShieldFilled size={14} className="shrink-0 text-slate-300" />
      )}
      <Link
        href={`/teams/${membership.team.id}`}
        className="truncate text-sm font-medium text-slate-800 hover:text-slate-600"
        onClick={(event) => event.stopPropagation()}
      >
        {membership.team.name}
      </Link>
      {membership.isLoan && (
        <span className="shrink-0 rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700">
          Loan
        </span>
      )}
    </div>
    {membership.shirtNumber !== null && (
      <span className="shrink-0 text-xs text-slate-400">#{membership.shirtNumber}</span>
    )}
    {isSelected && (
      <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-slate-900" />
    )}
  </div>
)

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

  const sortedMemberships = [...memberships].sort((firstMembership, secondMembership) =>
    Number(secondMembership.season.name) - Number(firstMembership.season.name)
  )

  const selectedMembership = sortedMemberships.find(
    (membership) => membership.season.id === selectedSeasonId,
  ) ?? null

  const dobFormatted = formatDateOfBirth(player.dateOfBirth)
  const age = formatAge(player.dateOfBirth)

  return (
    <div className="flex flex-col gap-6">

      <div className="grid gap-3 grid-cols-2 sm:grid-cols-4 lg:grid-cols-7">
        <StatCard label="Matches" value={aggregates.appearances > 0 ? aggregates.appearances : null} />
        <RatingStatCard avgRating={aggregates.avgRating} />
        <StatCard
          label="Minutes"
          value={aggregates.totalMinutes !== null ? aggregates.totalMinutes : null}
        />
        <StatCard label="Goals" value={aggregates.goals > 0 ? aggregates.goals : null} />
        <StatCard label="Assists" value={aggregates.assists > 0 ? aggregates.assists : null} />
        <StatCard label="Yellows" value={aggregates.yellowCards > 0 ? aggregates.yellowCards : null} />
        <StatCard label="Reds" value={aggregates.redCards > 0 ? aggregates.redCards : null} />
      </div>

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
          <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
            <div className="flex flex-col divide-y divide-slate-100">
              {dobFormatted && (
                <div className="flex items-center justify-between px-4 py-3">
                  <span className="text-xs font-semibold text-slate-500">Date of birth</span>
                  <span className="text-sm text-slate-800">
                    {dobFormatted}{age && <span className="ml-1 text-slate-400">({age} yrs)</span>}
                  </span>
                </div>
              )}
              {player.height && (
                <div className="flex items-center justify-between px-4 py-3">
                  <span className="text-xs font-semibold text-slate-500">Height</span>
                  <span className="text-sm text-slate-800">{player.height} cm</span>
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
                  <span className="text-sm text-slate-800">#{selectedMembership.shirtNumber}</span>
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
    </div>
  )
}

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

  const sortedMemberships = [...memberships].sort((firstMembership, secondMembership) =>
    Number(secondMembership.season.name) - Number(firstMembership.season.name)
  )

  const membershipSeasonIds = new Set(sortedMemberships.map((membership) => membership.season.id))
  const playerSeasons: Season[] = allSeasons
    .filter((season) => membershipSeasonIds.has(season.id))
    .sort((firstSeason, secondSeason) => Number(secondSeason.name) - Number(firstSeason.name))

  const currentMembership =
    sortedMemberships.find((membership) => membership.season.isCurrent) ?? sortedMemberships[0]

  const selectedSeasonId = seasonIdParam
    ? Number(seasonIdParam)
    : (currentMembership?.season.id ?? null)

  const selectedMembership =
    sortedMemberships.find((membership) => membership.season.id === selectedSeasonId) ??
    currentMembership ?? null

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

        <div className="overflow-hidden rounded-2xl shadow-lg">
          <div className="relative min-h-56 bg-slate-900">
            <HeroTexture />
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/5 to-black/40 pointer-events-none" />

            <div className="absolute left-5 top-5 z-10">
              <HeroBackLink label="Back" href="/players" />
            </div>

            <div className="absolute bottom-0 left-0 right-0 flex items-end justify-between gap-5 p-6">
              <div className="flex items-end gap-5 min-w-0">
                <div className="h-20 w-20 shrink-0 overflow-hidden rounded-full bg-slate-700 ring-2 ring-white/20">
                  <img
                    src={resolvePlayerImageUrl(player.imagePath)}
                    alt={displayName}
                    className="h-full w-full object-cover object-top"
                  />
                </div>
                <div className="min-w-0 flex flex-col gap-1 pb-1">
                  <h1 className="text-3xl font-black text-white leading-none drop-shadow">
                    {displayName}
                  </h1>
                  <div className="flex items-center gap-2 flex-wrap">
                    {positionCode && positionStyle && (
                      <span
                        className={`rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${positionStyle.badge}`}
                      >
                        {positionLabel ?? positionCode}
                      </span>
                    )}
                    {selectedMembership?.team && (
                      <div className="flex items-center gap-1.5">
                        {selectedMembership.team.imagePath && (
                          <img
                            src={selectedMembership.team.imagePath}
                            alt={selectedMembership.team.name}
                            className="h-4 w-4 object-contain"
                          />
                        )}
                        <Link
                          href={`/teams/${selectedMembership.team.id}`}
                          className="text-sm font-medium text-white/80 hover:text-white"
                        >
                          {selectedMembership.team.name}
                        </Link>
                      </div>
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
                  <TeamSeasonSelector
                    seasons={playerSeasons}
                    selectedSeasonId={selectedSeasonId}
                  />
                </Suspense>
              )}
            </div>
          </div>
        </div>

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
