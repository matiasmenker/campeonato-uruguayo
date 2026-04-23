import { Suspense } from "react"
import Link from "next/link"
import { IconShieldFilled } from "@tabler/icons-react"
import HeroTexture from "@/components/hero-texture"
import SearchParamsLoadingBoundary from "@/components/search-params-loading-boundary"
import PlayerSeasonStageSelector from "@/components/player-season-stage-selector"
import { getSeasons, getStages, filterMainStages } from "@/lib/seasons"
import { getLeaders, type LeaderEntry } from "@/lib/metrics"
import { getRatingColors, getRatingFill } from "@/lib/rating"
import { resolvePlayerImageUrl } from "@/lib/player"
import { POSITION_CODES } from "@/lib/players"

export const revalidate = 300

const CATEGORY_LABELS: Record<string, string> = {
  topRated: "Best rated",
  topScorers: "Top scorers",
  topAssists: "Most assists",
  topYellowCards: "Yellow cards",
  topSaves: "Most saves",
  topMinutes: "Most minutes",
}

const CATEGORY_VALUE_LABELS: Record<string, string> = {
  topRated: "avg",
  topScorers: "goals",
  topAssists: "assists",
  topYellowCards: "cards",
  topSaves: "saves",
  topMinutes: "min",
}

const formatValue = (category: string, value: number): string => {
  if (category === "topRated") return value.toFixed(2)
  return String(value)
}

const CategoryHighlight = ({
  category,
  entry,
  seasonId,
  stageId,
}: {
  category: string
  entry: LeaderEntry | undefined
  seasonId: number
  stageId: number | null
}) => {
  if (!entry) return null
  const displayName = entry.player.displayName ?? entry.player.name
  const positionCode = entry.player.positionId ? (POSITION_CODES[entry.player.positionId] ?? null) : null
  const playerHref = stageId
    ? `/players/${entry.player.id}?seasonId=${seasonId}&stageId=${stageId}`
    : `/players/${entry.player.id}?seasonId=${seasonId}`
  return (
    <Link
      href={playerHref}
      className="group flex flex-col items-center gap-3 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm text-center transition-all hover:border-slate-300 hover:shadow-md"
    >
      <div className="h-14 w-14 overflow-hidden rounded-full bg-slate-100 ring-2 ring-slate-200 group-hover:ring-slate-300 transition-all">
        <img
          src={resolvePlayerImageUrl(entry.player.imagePath)}
          alt={displayName}
          className="h-full w-full object-cover object-top"
        />
      </div>
      <div className="flex flex-col items-center gap-0.5">
        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
          {CATEGORY_LABELS[category]}
        </span>
        {category === "topRated" ? (
          <span
            className="text-3xl font-black tabular-nums leading-none"
            style={{ color: getRatingColors(entry.value).text }}
          >
            {formatValue(category, entry.value)}
          </span>
        ) : (
          <span className="text-3xl font-black tabular-nums text-slate-950 leading-none">
            {formatValue(category, entry.value)}
          </span>
        )}
        <span className="text-[11px] text-slate-400">{CATEGORY_VALUE_LABELS[category]}</span>
      </div>
      <div className="flex flex-col items-center gap-0.5">
        <span className="text-sm font-bold text-slate-800 leading-tight">{displayName}</span>
        <div className="flex items-center gap-1.5">
          {entry.team?.imagePath ? (
            <img src={entry.team.imagePath} alt={entry.team.name} className="h-3.5 w-3.5 object-contain shrink-0" />
          ) : null}
          <span className="text-[11px] text-slate-400 truncate max-w-[110px]">{entry.team?.name ?? "—"}</span>
          {positionCode && (
            <span className="text-[10px] font-medium text-slate-300">· {positionCode}</span>
          )}
        </div>
      </div>
    </Link>
  )
}

const LeaderRow = ({
  rank,
  entry,
  category,
  seasonId,
  stageId,
}: {
  rank: number
  entry: LeaderEntry
  category: string
  seasonId: number
  stageId: number | null
}) => {
  const displayName = entry.player.displayName ?? entry.player.name
  const positionCode = entry.player.positionId ? (POSITION_CODES[entry.player.positionId] ?? null) : null
  const playerHref = stageId
    ? `/players/${entry.player.id}?seasonId=${seasonId}&stageId=${stageId}`
    : `/players/${entry.player.id}?seasonId=${seasonId}`

  return (
    <Link
      href={playerHref}
      className="flex items-center gap-3 px-4 py-2.5 transition-colors hover:bg-slate-50"
    >
      <span className="w-4 shrink-0 text-center text-xs font-semibold text-slate-400">{rank}</span>
      <div className="h-8 w-8 shrink-0 overflow-hidden rounded-full bg-slate-100 ring-1 ring-slate-200">
        <img
          src={resolvePlayerImageUrl(entry.player.imagePath)}
          alt={displayName}
          className="h-full w-full object-cover object-top"
        />
      </div>
      <div className="flex min-w-0 flex-1 flex-col">
        <span className="truncate text-sm font-semibold text-slate-900">{displayName}</span>
        <div className="flex items-center gap-1.5">
          {entry.team?.imagePath ? (
            <img
              src={entry.team.imagePath}
              alt={entry.team.name}
              className="h-3.5 w-3.5 object-contain"
            />
          ) : (
            <IconShieldFilled size={10} className="text-slate-300" />
          )}
          <span className="truncate text-[11px] text-slate-500">{entry.team?.name ?? "—"}</span>
          {positionCode && (
            <span className="text-[10px] font-medium text-slate-400">· {positionCode}</span>
          )}
        </div>
      </div>
      <div className="shrink-0 text-right">
        {category === "topRated" ? (
          <span
            className="inline-flex items-center justify-center rounded-md px-1.5 font-black tabular-nums text-sm leading-none text-white"
            style={{ background: getRatingFill(entry.value), minWidth: 34, height: 20 }}
          >
            {formatValue(category, entry.value)}
          </span>
        ) : (
          <>
            <span className="text-sm font-black tabular-nums text-slate-900">
              {formatValue(category, entry.value)}
            </span>
            <span className="ml-1 text-[10px] text-slate-400">{CATEGORY_VALUE_LABELS[category]}</span>
          </>
        )}
      </div>
    </Link>
  )
}

const LeaderList = ({
  category,
  label,
  entries,
  seasonId,
  stageId,
}: {
  category: string
  label: string
  entries: LeaderEntry[]
  seasonId: number
  stageId: number | null
}) => (
  <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
    <div className="border-b border-slate-100 bg-slate-50/60 px-4 py-2.5">
      <h2 className="text-xs font-bold uppercase tracking-widest text-slate-500">{label}</h2>
    </div>
    {entries.length === 0 ? (
      <div className="flex h-28 items-center justify-center text-sm text-slate-400">
        No data available
      </div>
    ) : (
      <div className="flex flex-col divide-y divide-slate-100">
        {entries.map((entry, index) => (
          <LeaderRow
            key={entry.player.id}
            rank={index + 1}
            entry={entry}
            category={category}
            seasonId={seasonId}
            stageId={stageId}
          />
        ))}
      </div>
    )}
  </div>
)

const ContentSkeleton = () => (
  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
    {Array.from({ length: 6 }).map((_, index) => (
      <div
        key={index}
        className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm"
      >
        <div className="border-b border-slate-100 bg-slate-50/60 px-4 py-2.5">
          <div className="h-3.5 w-24 animate-pulse rounded bg-slate-200" />
        </div>
        {Array.from({ length: 5 }).map((__, rowIndex) => (
          <div
            key={rowIndex}
            className={`flex items-center gap-3 px-4 py-2.5 ${rowIndex < 4 ? "border-b border-slate-100" : ""}`}
          >
            <div className="h-4 w-4 animate-pulse rounded bg-slate-100" />
            <div className="h-8 w-8 animate-pulse rounded-full bg-slate-100 shrink-0" />
            <div className="flex min-w-0 flex-1 flex-col gap-1">
              <div className="h-3.5 w-28 animate-pulse rounded bg-slate-100" />
              <div className="h-2.5 w-16 animate-pulse rounded bg-slate-100" />
            </div>
            <div className="h-5 w-10 animate-pulse rounded-full bg-slate-100 shrink-0" />
          </div>
        ))}
      </div>
    ))}
  </div>
)

const PlayersContent = async ({
  selectedSeasonId,
  selectedStageId,
}: {
  selectedSeasonId: number
  selectedStageId: number | null
}) => {
  const leaders = await getLeaders({
    seasonId: selectedSeasonId,
    stageId: selectedStageId ?? undefined,
    limit: 8,
  }).catch(() => null)

  if (!leaders) {
    return (
      <div className="flex h-36 items-center justify-center rounded-2xl border border-dashed border-slate-200 text-sm text-slate-400">
        Could not load player leaders. Try again later.
      </div>
    )
  }

  const categories: Array<{ key: keyof typeof leaders; entries: LeaderEntry[] }> = [
    { key: "topRated", entries: leaders.topRated.leaders },
    { key: "topScorers", entries: leaders.topScorers.leaders },
    { key: "topAssists", entries: leaders.topAssists.leaders },
    { key: "topMinutes", entries: leaders.topMinutes.leaders },
    { key: "topYellowCards", entries: leaders.topYellowCards.leaders },
    { key: "topSaves", entries: leaders.topSaves.leaders },
  ]

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-6">
        {categories.map(({ key, entries }) => (
          <CategoryHighlight
            key={key}
            category={key}
            entry={entries[0]}
            seasonId={selectedSeasonId}
            stageId={selectedStageId}
          />
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {categories.map(({ key, entries }) => (
          <LeaderList
            key={key}
            category={key}
            label={CATEGORY_LABELS[key] ?? key}
            entries={entries}
            seasonId={selectedSeasonId}
            stageId={selectedStageId}
          />
        ))}
      </div>
    </div>
  )
}

interface PlayersPageProps {
  searchParams: Promise<{ seasonId?: string; stageId?: string }>
}

const PlayersPage = async ({ searchParams }: PlayersPageProps) => {
  const { seasonId: seasonIdParam, stageId: stageIdParam } = await searchParams

  const seasons = await getSeasons().catch(() => [])
  const sortedSeasons = [...seasons].sort((firstSeason, secondSeason) =>
    Number(secondSeason.name) - Number(firstSeason.name)
  )

  // Default to the current active season, fall back to first available.
  const defaultSeason =
    sortedSeasons.find((season) => season.isCurrent) ??
    sortedSeasons[0]
  const selectedSeasonId = seasonIdParam ? Number(seasonIdParam) : (defaultSeason?.id ?? null)
  const selectedSeason = sortedSeasons.find((season) => season.id === selectedSeasonId) ?? defaultSeason

  if (!selectedSeason) {
    return (
      <main className="min-h-svh bg-slate-50">
        <div className="mx-auto w-full max-w-7xl px-6 py-8">
          <p className="text-sm text-slate-500">Season data unavailable.</p>
        </div>
      </main>
    )
  }

  const allStages = await getStages(selectedSeason.id).catch(() => [])
  const stages = filterMainStages(allStages)
  // Default to current stage, fallback to last main stage in the season.
  const defaultStage = stages.find((stage) => stage.isCurrent) ?? stages[stages.length - 1] ?? null
  const requestedStageId = stageIdParam ? Number(stageIdParam) : null
  const hasRequestedStage = requestedStageId !== null && stages.some((stage) => stage.id === requestedStageId)
  const selectedStageId: number | null = stages.length > 0
    ? (hasRequestedStage ? requestedStageId! : (defaultStage?.id ?? null))
    : null
  const selectedStage = stages.find((stage) => stage.id === selectedStageId) ?? defaultStage

  const committedParams: Record<string, string> = { seasonId: String(selectedSeason.id) }
  if (hasRequestedStage && selectedStageId !== null) committedParams.stageId = String(selectedStageId)

  return (
    <main className="min-h-svh bg-[linear-gradient(180deg,#f8fafc_0%,#f8fafc_48%,#eef2f7_100%)]">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-6 py-8 sm:px-8 lg:px-10">

        <div className="overflow-hidden rounded-2xl shadow-lg">
          <div className="relative min-h-52 bg-slate-900">
            <HeroTexture />
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/5 to-black/40 pointer-events-none" />
            <div className="absolute bottom-0 left-0 right-0 flex items-end justify-between gap-4 p-6">
              <div className="flex flex-col gap-0.5">
                <h1 className="text-3xl font-black text-white drop-shadow leading-none">Players</h1>
                <p className="text-sm text-white/60">
                  {selectedStage?.name ?? selectedSeason.name} {selectedStage ? selectedSeason.name : ""}
                </p>
              </div>
              <Suspense>
                <PlayerSeasonStageSelector
                  seasons={sortedSeasons}
                  stages={stages}
                  selectedSeasonId={selectedSeason.id}
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
            <PlayersContent
              selectedSeasonId={selectedSeason.id}
              selectedStageId={selectedStageId}
            />
          </SearchParamsLoadingBoundary>
        </Suspense>

      </div>
    </main>
  )
}

export default PlayersPage
