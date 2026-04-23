import { Suspense } from "react"
import { getRatingFill } from "@/lib/rating"
import Link from "next/link"
import { IconBallFootball, IconStar, IconTrophy, IconUsers } from "@tabler/icons-react"
import HeroTexture from "@/components/hero-texture"
import SearchParamsLoadingBoundary from "@/components/search-params-loading-boundary"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import ChampionBadge from "@/components/champion-badge"
import { StandingsSeasonFilter, StandingsStageFilter } from "@/components/standings-filters"
import { getLeaders, type LeadersContract } from "@/lib/metrics"
import { getStandings, type StandingEntry } from "@/lib/standings"
import { getSeasons, getStages, getSeasonChampion, type Season, type Stage, type SeasonChampion } from "@/lib/seasons"

export const revalidate = 300

const RELEGATION_ZONE_SIZE = 3
const MAIN_STAGE_NAMES = ["apertura", "clausura", "intermediate round"]
const CHAMPIONSHIP_FINALS_NAME = "championship - finals"
const INTERMEDIATE_ROUND_FINAL_NAME = "intermediate round - final"

const isMainStage = (stageName: string) =>
  MAIN_STAGE_NAMES.some((name) => stageName.toLowerCase() === name)

const PositionIndicator = ({ position, total }: { position: number; total: number }) => {
  const isRelegation = position > total - RELEGATION_ZONE_SIZE
  return (
    <div className="flex items-center gap-2">
      <div className={`h-3.5 w-1 rounded-full ${isRelegation ? "bg-red-400" : "bg-transparent"}`} />
      <span className="text-sm font-medium text-slate-400">{position}</span>
    </div>
  )
}

const StandingsTable = ({ standings, seasonId }: { standings: StandingEntry[]; seasonId: number }) => {
  const total = standings.length
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
      <Table>
        <TableHeader>
          <TableRow className="bg-slate-50">
            <TableHead className="w-10 text-center text-xs">#</TableHead>
            <TableHead className="text-xs">Team</TableHead>
            <TableHead className="text-center text-xs" title="Matches played">MP</TableHead>
            <TableHead className="text-center text-xs" title="Wins">W</TableHead>
            <TableHead className="text-center text-xs" title="Draws">D</TableHead>
            <TableHead className="text-center text-xs" title="Losses">L</TableHead>
            <TableHead className="text-center text-xs" title="Goals for">GF</TableHead>
            <TableHead className="text-center text-xs" title="Goals against">GA</TableHead>
            <TableHead className="text-center text-xs" title="Goal difference">GD</TableHead>
            <TableHead className="text-center text-xs font-bold" title="Points">PTS</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {standings.map((standing) => {
            const isRelegation = standing.position > total - RELEGATION_ZONE_SIZE
            return (
              <TableRow key={standing.id} className={isRelegation ? "bg-red-50/40" : undefined}>
                <TableCell className="py-3">
                  <PositionIndicator position={standing.position} total={total} />
                </TableCell>
                <TableCell className="py-3">
                  <Link
                    href={`/teams/${standing.team.id}?seasonId=${seasonId}`}
                    className="flex items-center gap-3 hover:opacity-80"
                  >
                    {standing.team.imagePath ? (
                      <img src={standing.team.imagePath} alt={standing.team.name} className="h-6 w-6 shrink-0 object-contain" />
                    ) : (
                      <div className="h-6 w-6 shrink-0 rounded-full bg-slate-200" />
                    )}
                    <span className="text-sm font-medium text-slate-950">{standing.team.name}</span>
                  </Link>
                </TableCell>
                <TableCell className="py-3 text-center text-sm text-slate-500">{standing.played}</TableCell>
                <TableCell className="py-3 text-center text-sm font-medium text-emerald-600">{standing.won}</TableCell>
                <TableCell className="py-3 text-center text-sm text-slate-500">{standing.draw}</TableCell>
                <TableCell className="py-3 text-center text-sm text-red-400">{standing.lost}</TableCell>
                <TableCell className="py-3 text-center text-sm text-slate-500">{standing.goalsFor}</TableCell>
                <TableCell className="py-3 text-center text-sm text-slate-500">{standing.goalsAgainst}</TableCell>
                <TableCell className="py-3 text-center text-sm text-slate-500">
                  {standing.goalDifference > 0 ? "+" : ""}{standing.goalDifference}
                </TableCell>
                <TableCell className="py-3 text-center text-sm font-bold text-slate-950">{standing.points}</TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}

const ChampionCard = ({ champion, seasonName, seasonId }: { champion: SeasonChampion; seasonName: string; seasonId: number }) => (
  <Link href={`/teams/${champion.team.id}?seasonId=${seasonId}`} className="block hover:opacity-90 transition-opacity">
    <div className="overflow-hidden rounded-2xl border border-slate-700 bg-gradient-to-br from-slate-800 to-slate-950 shadow-lg">
      <div className="flex items-center gap-4 px-5 py-4">
        <ChampionBadge year={seasonName} size={64} />
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Champion</p>
          <p className="mt-1 truncate text-xl font-black text-white leading-tight">{champion.team.name}</p>
          <p className="mt-0.5 text-xs font-semibold text-slate-400">{seasonName}</p>
        </div>
        {champion.team.imagePath && (
          <img src={champion.team.imagePath} alt={champion.team.name} className="h-14 w-14 shrink-0 object-contain opacity-90 drop-shadow-md" />
        )}
      </div>
    </div>
  </Link>
)

const LeaderCard = ({ standing, stageName, isWinner, seasonId }: { standing: StandingEntry; stageName: string; isWinner: boolean; seasonId: number }) => (
  <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
    <div className="px-4 py-3 border-b border-slate-100">
      <div className="flex items-center gap-1.5">
        <IconTrophy size={13} className={isWinner ? "text-slate-700" : "text-slate-400"} />
        <span className="text-xs font-bold uppercase tracking-wide text-slate-600">
          {isWinner ? `${stageName} winner` : `${stageName} leader`}
        </span>
      </div>
    </div>
    <div className="p-4">
      <Link href={`/teams/${standing.team.id}?seasonId=${seasonId}`} className="flex items-center gap-4 hover:opacity-80">
        {standing.team.imagePath && (
          <img src={standing.team.imagePath} alt={standing.team.name} className="h-14 w-14 shrink-0 object-contain drop-shadow-sm" />
        )}
        <div className="min-w-0 flex-1">
          <p className="truncate text-base font-bold text-slate-950">{standing.team.name}</p>
          <p className="text-xs text-slate-400">{standing.played} matches played</p>
        </div>
      </Link>
      <div className="mt-4 grid grid-cols-3 divide-x divide-slate-100 rounded-xl bg-slate-50 py-3">
        <div className="flex flex-col items-center gap-0.5">
          <p className="text-2xl font-black text-slate-950">{standing.points}</p>
          <p className="text-[10px] font-medium uppercase tracking-wide text-slate-400">PTS</p>
        </div>
        <div className="flex flex-col items-center gap-0.5">
          <p className="text-2xl font-black text-emerald-600">{standing.won}</p>
          <p className="text-[10px] font-medium uppercase tracking-wide text-slate-400">W</p>
        </div>
        <div className="flex flex-col items-center gap-0.5">
          <p className="text-2xl font-black text-slate-700">
            {standing.goalDifference > 0 ? `+${standing.goalDifference}` : standing.goalDifference}
          </p>
          <p className="text-[10px] font-medium uppercase tracking-wide text-slate-400">GD</p>
        </div>
      </div>
    </div>
  </div>
)

const PlayerStatCard = ({
  icon: Icon,
  accentColor,
  label,
  playerName,
  playerImage,
  teamImage,
  teamName,
  value,
  unit,
  isRating,
}: {
  icon: React.ComponentType<{ size?: number; className?: string }>
  accentColor: string
  label: string
  playerName: string
  playerImage: string | null
  teamImage: string | null
  teamName: string | null
  value: number
  unit: string
  isRating?: boolean
}) => {
  const valueColor = isRating ? getRatingFill(value) : undefined
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
      <div className="flex items-center gap-4 p-4">
        <div className="shrink-0">
          <div className="h-14 w-14 overflow-hidden rounded-full bg-slate-100 ring-2 ring-slate-200">
            {playerImage ? (
              <img src={playerImage} alt={playerName} className="h-full w-full object-cover object-top" />
            ) : (
              <svg viewBox="0 0 80 80" fill="none" className="h-full w-full">
                <circle cx="40" cy="30" r="16" fill="#cbd5e1" />
                <path d="M12 78c0-15.464 12.536-28 28-28s28 12.536 28 28" fill="#cbd5e1" />
              </svg>
            )}
          </div>
        </div>
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex items-center gap-1.5">
            <Icon size={12} className={accentColor} />
            <p className={`text-[10px] font-bold uppercase tracking-wide ${accentColor}`}>{label}</p>
          </div>
          <p className="truncate text-sm font-semibold text-slate-950 leading-tight">{playerName}</p>
          {teamImage && teamName && (
            <div className="mt-1.5 flex items-center gap-1">
              <img src={teamImage} alt={teamName} className="h-4 w-4 shrink-0 object-contain" />
              <span className="text-[11px] text-slate-400 truncate">{teamName}</span>
            </div>
          )}
        </div>
        <div className="shrink-0 text-right">
          <p className="text-2xl font-black tabular-nums" style={{ color: valueColor ?? "#0f172a" }}>{value}</p>
          <p className="text-[10px] uppercase tracking-wide text-slate-400">{unit}</p>
        </div>
      </div>
    </div>
  )
}

const StandingsContentSkeleton = () => (
  <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
    <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
      <div className="flex items-center gap-3 border-b border-slate-100 bg-slate-50 px-4 py-3">
        <div className="h-3 w-6 animate-pulse rounded bg-slate-200" />
        <div className="h-3 flex-1 animate-pulse rounded bg-slate-200" />
        {[...Array(7)].map((_, i) => (
          <div key={i} className="h-3 w-6 animate-pulse rounded bg-slate-200" />
        ))}
        <div className="h-3 w-8 animate-pulse rounded bg-slate-200" />
      </div>
      {[...Array(16)].map((_, rowIndex) => (
        <div
          key={rowIndex}
          className="flex items-center gap-3 border-b border-slate-100 px-4 py-2.5 last:border-0"
        >
          <div className="flex items-center gap-2">
            <div className="h-3.5 w-1 animate-pulse rounded-full bg-slate-100" />
            <div className="h-3 w-4 animate-pulse rounded bg-slate-100" />
          </div>
          <div className="flex flex-1 items-center gap-3">
            <div className="h-5 w-5 animate-pulse rounded-full bg-slate-100 shrink-0" />
            <div className="h-3.5 w-28 animate-pulse rounded bg-slate-100" />
          </div>
          {[...Array(8)].map((_, colIndex) => (
            <div key={colIndex} className="h-3 w-6 animate-pulse rounded bg-slate-100" />
          ))}
        </div>
      ))}
    </div>

    <div className="flex flex-col gap-3">
      <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 animate-pulse rounded-2xl bg-slate-100 shrink-0" />
          <div className="flex flex-1 flex-col gap-2">
            <div className="h-2.5 w-12 animate-pulse rounded bg-slate-200" />
            <div className="h-5 w-28 animate-pulse rounded bg-slate-200" />
            <div className="h-3 w-16 animate-pulse rounded bg-slate-100" />
          </div>
        </div>
      </div>
      {[0, 1, 2].map((index) => (
        <div key={index} className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
          <div className="flex items-center gap-4 p-4">
            <div className="h-14 w-14 animate-pulse rounded-full bg-slate-200 shrink-0 ring-2 ring-slate-100" />
            <div className="flex flex-1 flex-col gap-1.5">
              <div className="h-2.5 w-14 animate-pulse rounded bg-slate-200" />
              <div className="h-4 w-24 animate-pulse rounded bg-slate-100" />
              <div className="flex items-center gap-1 mt-0.5">
                <div className="h-3.5 w-3.5 animate-pulse rounded bg-slate-100" />
                <div className="h-3 w-16 animate-pulse rounded bg-slate-100" />
              </div>
            </div>
            <div className="shrink-0 flex flex-col items-end gap-1">
              <div className="h-7 w-8 animate-pulse rounded bg-slate-200" />
              <div className="h-2.5 w-8 animate-pulse rounded bg-slate-100" />
            </div>
          </div>
        </div>
      ))}
    </div>
  </div>
)

interface StandingsContentProps {
  selectedSeasonId: number
  selectedStageId: number | null
  selectedSeason: Season | undefined
  selectedStage: Stage | undefined
  stages: Stage[]
}

const StandingsContent = async ({
  selectedSeasonId,
  selectedStageId,
  selectedSeason,
  selectedStage,
  stages,
}: StandingsContentProps) => {
  let standings: StandingEntry[] = []
  let leaders: LeadersContract | null = null
  let champion: SeasonChampion | null = null
  let errorMessage: string | null = null

  const championshipFinalsStage = stages.find((stage) =>
    stage.name.toLowerCase() === CHAMPIONSHIP_FINALS_NAME
  )
  const intermediateRoundFinalStage = stages.find((stage) =>
    stage.name.toLowerCase() === INTERMEDIATE_ROUND_FINAL_NAME
  )

  const [standingsResult, leadersResult] = await Promise.allSettled([
    getStandings({ seasonId: selectedSeasonId, stageId: selectedStageId ?? undefined }),
    getLeaders({ seasonId: selectedSeasonId, stageId: selectedStageId ?? undefined, limit: 1 }),
  ])

  if (standingsResult.status === "fulfilled") standings = standingsResult.value
  else errorMessage = "Could not load standings."
  if (leadersResult.status === "fulfilled") leaders = leadersResult.value

  if (!selectedSeason?.isCurrent) {
    if (championshipFinalsStage) {
      champion = await getSeasonChampion(championshipFinalsStage.id).catch(() => null)
    }
    if (!champion && intermediateRoundFinalStage) {
      champion = await getSeasonChampion(intermediateRoundFinalStage.id).catch(() => null)
    }
  }

  const leaderStanding = standings[0] ?? null
  const topScorer = leaders?.topScorers.leaders[0] ?? null
  const topAssist = leaders?.topAssists.leaders[0] ?? null
  const topRated = leaders?.topRated.leaders[0] ?? null

  const isStageOver = !selectedSeason?.isCurrent || !selectedStage?.isCurrent

  const getPlayerName = (displayName: string | null, name: string) => displayName ?? name

  if (errorMessage) {
    return (
      <Alert className="border-amber-300 bg-amber-50 text-amber-950">
        <AlertTitle>Could not load standings</AlertTitle>
        <AlertDescription>{errorMessage}</AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
      <div className="flex flex-col gap-3">
        {standings.length === 0 ? (
          <div className="flex h-48 items-center justify-center rounded-2xl border border-dashed border-slate-200 text-sm text-slate-400">
            No standings available for this stage
          </div>
        ) : (
          <>
            <StandingsTable standings={standings} seasonId={selectedSeasonId} />
            <div className="flex items-center gap-1.5 px-1 text-xs text-slate-400">
              <div className="h-3 w-1 rounded-full bg-red-400" />
              <span>Relegation zone</span>
            </div>
          </>
        )}
      </div>

      <div className="flex flex-col gap-3">
        {champion && (
          <ChampionCard champion={champion} seasonName={selectedSeason?.name ?? "—"} seasonId={selectedSeasonId} />
        )}
        {leaderStanding && (
          <LeaderCard
            standing={leaderStanding}
            stageName={selectedStage?.name ?? "Stage"}
            isWinner={isStageOver}
            seasonId={selectedSeasonId}
          />
        )}
        {topScorer && (
          <PlayerStatCard
            icon={IconBallFootball}
            accentColor="text-emerald-500"
            label="Top scorer"
            playerName={getPlayerName(topScorer.player.displayName, topScorer.player.name)}
            playerImage={topScorer.player.imagePath}
            teamImage={topScorer.team?.imagePath ?? null}
            teamName={topScorer.team?.name ?? null}
            value={topScorer.value}
            unit="goals"
          />
        )}
        {topAssist && (
          <PlayerStatCard
            icon={IconUsers}
            accentColor="text-sky-500"
            label="Top assists"
            playerName={getPlayerName(topAssist.player.displayName, topAssist.player.name)}
            playerImage={topAssist.player.imagePath}
            teamImage={topAssist.team?.imagePath ?? null}
            teamName={topAssist.team?.name ?? null}
            value={topAssist.value}
            unit="assists"
          />
        )}
        {topRated && (
          <PlayerStatCard
            icon={IconStar}
            accentColor="text-amber-500"
            label="Best rated"
            playerName={getPlayerName(topRated.player.displayName, topRated.player.name)}
            playerImage={topRated.player.imagePath}
            teamImage={topRated.team?.imagePath ?? null}
            teamName={topRated.team?.name ?? null}
            value={topRated.value}
            unit="rating"
            isRating
          />
        )}
      </div>
    </div>
  )
}

interface StandingsPageProps {
  searchParams: Promise<{ seasonId?: string; stageId?: string }>
}

const StandingsPage = async ({ searchParams }: StandingsPageProps) => {
  const { seasonId: seasonIdParam, stageId: stageIdParam } = await searchParams

  let seasons: Season[] = []
  let stages: Stage[] = []

  const [seasonsResult, stagesResult] = await Promise.allSettled([
    getSeasons(),
    getStages(seasonIdParam ? Number(seasonIdParam) : undefined),
  ])

  if (seasonsResult.status === "fulfilled") seasons = seasonsResult.value
  if (stagesResult.status === "fulfilled") {
    const resolvedSeasons = seasonsResult.status === "fulfilled" ? seasonsResult.value : []
    const targetSeasonId = seasonIdParam
      ? Number(seasonIdParam)
      : (resolvedSeasons.find((season) => season.isCurrent) ?? resolvedSeasons[0])?.id
    stages = stagesResult.value.filter((stage) => stage.season.id === targetSeasonId)
  }

  const currentSeason = seasons.find((season) => season.isCurrent) ?? seasons[0]
  const selectedSeasonId = seasonIdParam ? Number(seasonIdParam) : (currentSeason?.id ?? 1)
  const selectedSeason = seasons.find((season) => season.id === selectedSeasonId)

  const visibleStages = stages.filter((stage) => isMainStage(stage.name))
  const currentStage = visibleStages.find((stage) => stage.isCurrent) ?? visibleStages[0]
  const selectedStageId = stageIdParam ? Number(stageIdParam) : (currentStage?.id ?? null)
  const selectedStage = stages.find((stage) => stage.id === selectedStageId)

  return (
    <main className="min-h-svh bg-[linear-gradient(180deg,#f8fafc_0%,#f8fafc_48%,#eef2f7_100%)]">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-6 py-8 sm:px-8 lg:px-10">

        <div className="overflow-hidden rounded-2xl shadow-lg">
          <div className="relative min-h-52 bg-slate-900">
            <HeroTexture />
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/5 to-black/40 pointer-events-none" />

            <div className="absolute bottom-0 left-0 right-0 flex items-end justify-between gap-4 p-6">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-sm ring-1 ring-white/20">
                  <IconTrophy size={28} className="text-white/80" />
                </div>
                <div className="flex flex-col gap-0.5">
                  <h1 className="text-3xl font-black text-white leading-none drop-shadow">Standings</h1>
                  <p className="text-sm text-white/65">
                    {selectedStage?.name ?? "First Division"}{selectedSeason && ` ${selectedSeason.name}`}
                  </p>
                </div>
              </div>

              {(seasons.length > 0 || visibleStages.length > 0) && (
                <div className="flex shrink-0 items-center gap-2">
                  {seasons.length > 0 && (
                    <Suspense>
                      <StandingsSeasonFilter seasons={seasons} selectedSeasonId={selectedSeasonId} />
                    </Suspense>
                  )}
                  {visibleStages.length > 0 && (
                    <Suspense>
                      <StandingsStageFilter stages={visibleStages} selectedStageId={selectedStageId} />
                    </Suspense>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        <Suspense fallback={<StandingsContentSkeleton />}>
          <SearchParamsLoadingBoundary
            committedParams={{
              seasonId: String(selectedSeasonId),
              stageId: selectedStageId !== null ? String(selectedStageId) : null,
            }}
            skeleton={<StandingsContentSkeleton />}
          >
            <StandingsContent
              selectedSeasonId={selectedSeasonId}
              selectedStageId={selectedStageId}
              selectedSeason={selectedSeason}
              selectedStage={selectedStage}
              stages={stages}
            />
          </SearchParamsLoadingBoundary>
        </Suspense>

      </div>
    </main>
  )
}

export default StandingsPage
