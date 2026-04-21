import { Suspense } from "react"
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
import StandingsFilters from "@/components/standings-filters"
import { getLeaders, type LeadersContract } from "@/lib/metrics"
import { getStandings, type StandingEntry } from "@/lib/standings"
import { getSeasons, getStages, type Season, type Stage } from "@/lib/seasons"

export const dynamic = "force-dynamic"

const RELEGATION_ZONE_SIZE = 3

const PositionIndicator = ({ position, total }: { position: number; total: number }) => {
  const isRelegation = position > total - RELEGATION_ZONE_SIZE
  return (
    <div className="flex items-center gap-2">
      <div className={`h-3.5 w-1 rounded-full ${isRelegation ? "bg-red-400" : "bg-transparent"}`} />
      <span className="text-sm font-medium text-slate-400">{position}</span>
    </div>
  )
}

const StandingsTable = ({ standings }: { standings: StandingEntry[] }) => {
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
                  <div className="flex items-center gap-3">
                    {standing.team.imagePath ? (
                      <img
                        src={standing.team.imagePath}
                        alt={standing.team.name}
                        className="h-6 w-6 shrink-0 object-contain"
                      />
                    ) : (
                      <div className="h-6 w-6 shrink-0 rounded-full bg-slate-200" />
                    )}
                    <span className="text-sm font-medium text-slate-950">{standing.team.name}</span>
                  </div>
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

const StatCard = ({
  icon: Icon,
  label,
  name,
  value,
  imagePath,
}: {
  icon: React.ComponentType<{ size?: number; className?: string }>
  label: string
  name: string
  value: string
  imagePath: string | null
}) => (
  <div className="flex items-center gap-3 rounded-2xl border border-slate-200/80 bg-white px-4 py-3 shadow-sm">
    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-50">
      <Icon size={15} className="text-slate-400" />
    </div>
    <div className="min-w-0 flex-1">
      <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">{label}</p>
      <p className="truncate text-sm font-semibold text-slate-950">{name}</p>
    </div>
    <div className="flex shrink-0 items-center gap-2">
      {imagePath && (
        <img src={imagePath} alt="" className="h-6 w-6 object-contain" />
      )}
      <span className="text-sm font-bold text-slate-950">{value}</span>
    </div>
  </div>
)

const LeaderCard = ({ standing }: { standing: StandingEntry }) => (
  <div className="flex items-center gap-4 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
    {standing.team.imagePath && (
      <img
        src={standing.team.imagePath}
        alt={standing.team.name}
        className="h-14 w-14 shrink-0 object-contain"
      />
    )}
    <div className="min-w-0">
      <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">Stage leader</p>
      <p className="truncate text-base font-bold text-slate-950">{standing.team.name}</p>
      <p className="text-sm text-slate-500">{standing.points} pts · {standing.played} games</p>
    </div>
  </div>
)

interface StandingsPageProps {
  searchParams: Promise<{ seasonId?: string; stageId?: string }>
}

const StandingsPage = async ({ searchParams }: StandingsPageProps) => {
  const { seasonId: seasonIdParam, stageId: stageIdParam } = await searchParams

  let seasons: Season[] = []
  let stages: Stage[] = []
  let standings: StandingEntry[] = []
  let leaders: LeadersContract | null = null
  let errorMessage: string | null = null

  // Load seasons first to determine defaults
  try {
    seasons = await getSeasons()
  } catch {
    errorMessage = "Could not load seasons."
  }

  const currentSeason = seasons.find((season) => season.isCurrent) ?? seasons[0]
  const selectedSeasonId = seasonIdParam ? Number(seasonIdParam) : (currentSeason?.id ?? 1)

  // Parallelize stages + leaders — both depend only on seasonId
  const [stagesResult, leadersResult] = await Promise.allSettled([
    getStages(selectedSeasonId),
    getLeaders({ seasonId: selectedSeasonId, limit: 1 }),
  ])

  if (stagesResult.status === "fulfilled") stages = stagesResult.value
  if (leadersResult.status === "fulfilled") leaders = leadersResult.value

  const currentStage = stages.find((stage) => stage.isCurrent) ?? stages[0]
  const selectedStageId = stageIdParam ? Number(stageIdParam) : (currentStage?.id ?? null)

  try {
    standings = await getStandings({ seasonId: selectedSeasonId, stageId: selectedStageId ?? undefined })
  } catch (error) {
    errorMessage = error instanceof Error ? error.message : "Could not load standings."
  }

  const selectedSeason = seasons.find((season) => season.id === selectedSeasonId)
  const selectedStage = stages.find((stage) => stage.id === selectedStageId)
  const leader = standings[0] ?? null

  const topScorer = leaders?.topScorers.leaders[0] ?? null
  const topAssist = leaders?.topAssists.leaders[0] ?? null

  const getPlayerName = (displayName: string | null, name: string) => displayName ?? name

  return (
    <main className="min-h-svh bg-[linear-gradient(180deg,#f8fafc_0%,#f8fafc_48%,#eef2f7_100%)]">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-6 py-8 sm:px-8 lg:px-10">

        {/* Header */}
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
          <div className="grid gap-6 lg:grid-cols-[1fr_260px]">
            {/* Left — table */}
            <div className="flex flex-col gap-3">
              {standings.length === 0 ? (
                <div className="flex h-48 items-center justify-center rounded-2xl border border-dashed border-slate-200 text-sm text-slate-400">
                  No standings available for this stage
                </div>
              ) : (
                <>
                  <StandingsTable standings={standings} />
                  <div className="flex items-center gap-4 px-1 text-xs text-slate-400">
                    <div className="flex items-center gap-1.5">
                      <div className="h-3 w-1 rounded-full bg-red-400" />
                      <span>Relegation zone</span>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Right — stats */}
            <div className="flex flex-col gap-3">
              {leader && <LeaderCard standing={leader} />}

              {topScorer && (
                <StatCard
                  icon={IconBallFootball}
                  label="Top scorer"
                  name={getPlayerName(topScorer.player.displayName, topScorer.player.name)}
                  value={`${topScorer.value} goals`}
                  imagePath={topScorer.team?.imagePath ?? null}
                />
              )}

              {topAssist && (
                <StatCard
                  icon={IconUsers}
                  label="Top assists"
                  name={getPlayerName(topAssist.player.displayName, topAssist.player.name)}
                  value={`${topAssist.value} ast`}
                  imagePath={topAssist.team?.imagePath ?? null}
                />
              )}

              {leader && (
                <StatCard
                  icon={IconStar}
                  label="Best attack"
                  name={standings.reduce((best, standing) =>
                    standing.goalsFor > best.goalsFor ? standing : best
                  ).team.name}
                  value={`${standings.reduce((best, standing) =>
                    standing.goalsFor > best.goalsFor ? standing : best
                  ).goalsFor} goals`}
                  imagePath={standings.reduce((best, standing) =>
                    standing.goalsFor > best.goalsFor ? standing : best
                  ).team.imagePath ?? null}
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
