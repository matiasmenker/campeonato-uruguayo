import { Suspense } from "react"
import Link from "next/link"
import { IconBallFootball, IconStar, IconTrophy, IconUsers } from "@tabler/icons-react"
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
import StandingsFilters from "@/components/standings-filters"
import { getLeaders, type LeadersContract } from "@/lib/metrics"
import { getStandings, type StandingEntry } from "@/lib/standings"
import { getSeasons, getStages, getSeasonChampion, type Season, type Stage, type SeasonChampion } from "@/lib/seasons"

export const dynamic = "force-dynamic"

const RELEGATION_ZONE_SIZE = 3
const MAIN_STAGE_NAMES = ["apertura", "clausura", "intermediate round"]
const CHAMPIONSHIP_FINALS_NAME = "championship - finals"
const INTERMEDIATE_ROUND_FINAL_NAME = "intermediate round - final"

const getRatingColor = (value: number): string => {
  if (value >= 8.0) return "#22c55e"
  if (value >= 7.0) return "#38bdf8"
  if (value >= 6.0) return "#f97316"
  return "#ef4444"
}

const isMainStage = (stageName: string) =>
  MAIN_STAGE_NAMES.some((name) => stageName.toLowerCase() === name)

// ─── Table ────────────────────────────────────────────────────────────────────

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

// ─── Stat cards ───────────────────────────────────────────────────────────────

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
  const valueColor = isRating ? getRatingColor(value) : undefined
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

// ─── Page ─────────────────────────────────────────────────────────────────────

interface StandingsPageProps {
  searchParams: Promise<{ seasonId?: string; stageId?: string }>
}

const StandingsPage = async ({ searchParams }: StandingsPageProps) => {
  const { seasonId: seasonIdParam, stageId: stageIdParam } = await searchParams

  let seasons: Season[] = []
  let stages: Stage[] = []
  let standings: StandingEntry[] = []
  let leaders: LeadersContract | null = null
  let champion: SeasonChampion | null = null
  let errorMessage: string | null = null

  if (seasonIdParam) {
    const [seasonsResult, stagesResult] = await Promise.allSettled([
      getSeasons(),
      getStages(Number(seasonIdParam)),
    ])
    if (seasonsResult.status === "fulfilled") seasons = seasonsResult.value
    if (stagesResult.status === "fulfilled") stages = stagesResult.value
  } else {
    seasons = await getSeasons()
    const currentSeason = seasons.find((season) => season.isCurrent) ?? seasons[0]
    if (currentSeason) stages = await getStages(currentSeason.id)
  }

  const currentSeason = seasons.find((season) => season.isCurrent) ?? seasons[0]
  const selectedSeasonId = seasonIdParam ? Number(seasonIdParam) : (currentSeason?.id ?? 1)
  const selectedSeason = seasons.find((season) => season.id === selectedSeasonId)

  const visibleStages = stages.filter((stage) => isMainStage(stage.name))
  const currentStage = visibleStages.find((stage) => stage.isCurrent) ?? visibleStages[0]
  const selectedStageId = stageIdParam ? Number(stageIdParam) : (currentStage?.id ?? null)
  const selectedStage = stages.find((stage) => stage.id === selectedStageId)

  // Find the decisive stage for champion resolution.
  // Priority: Championship Finals → Intermediate Round Final (fallback for seasons where
  // the championship was decided before the finals stage, e.g. 2024).
  const championshipFinalsStage = stages.find((stage) =>
    stage.name.toLowerCase() === CHAMPIONSHIP_FINALS_NAME
  )
  const intermediateRoundFinalStage = stages.find((stage) =>
    stage.name.toLowerCase() === INTERMEDIATE_ROUND_FINAL_NAME
  )

  // Fetch standings and leaders in parallel, then resolve the champion sequentially
  // so we can fall back to the intermediate round final if the championship finals
  // stage has no fixture data.
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

  // Stage is considered over (winner, not just leader) when the season is done
  // or when the stage is no longer the current one
  const isStageOver = !selectedSeason?.isCurrent || !selectedStage?.isCurrent

  const getPlayerName = (displayName: string | null, name: string) => displayName ?? name

  return (
    <main className="min-h-svh bg-[linear-gradient(180deg,#f8fafc_0%,#f8fafc_48%,#eef2f7_100%)]">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-6 py-8 sm:px-8 lg:px-10">

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <IconTrophy size={20} className="text-slate-400" />
            <div>
              <h1 className="text-xl font-bold text-slate-950">Standings</h1>
              <p className="text-sm text-slate-400">
                {selectedStage?.name ?? "—"} · {selectedSeason?.name ?? "—"}
              </p>
            </div>
          </div>
          {seasons.length > 0 && (
            <Suspense>
              <StandingsFilters
                seasons={seasons}
                stages={stages}
                selectedSeasonId={selectedSeasonId}
                selectedStageId={selectedStageId}
              />
            </Suspense>
          )}
        </div>

        {errorMessage ? (
          <Alert className="border-amber-300 bg-amber-50 text-amber-950">
            <AlertTitle>Could not load standings</AlertTitle>
            <AlertDescription>{errorMessage}</AlertDescription>
          </Alert>
        ) : (
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
        )}

      </div>
    </main>
  )
}

export default StandingsPage
