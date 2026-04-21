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
const MAIN_STAGE_NAMES = ["apertura", "clausura", "intermediate round"]

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

const LeaderCard = ({ standing, stageName }: { standing: StandingEntry; stageName: string }) => (
  <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
    <div className="border-b border-slate-100 bg-slate-50 px-4 py-2.5">
      <div className="flex items-center gap-1.5">
        <IconTrophy size={13} className="text-slate-400" />
        <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">{stageName} leader</span>
      </div>
    </div>
    <div className="flex items-center gap-4 p-4">
      {standing.team.imagePath && (
        <img
          src={standing.team.imagePath}
          alt={standing.team.name}
          className="h-16 w-16 shrink-0 object-contain"
        />
      )}
      <div className="min-w-0 flex-1">
        <p className="truncate text-lg font-bold text-slate-950">{standing.team.name}</p>
        <div className="mt-1 flex items-center gap-3">
          <div className="text-center">
            <p className="text-xl font-black text-slate-950">{standing.points}</p>
            <p className="text-[10px] uppercase tracking-wide text-slate-400">pts</p>
          </div>
          <div className="h-8 w-px bg-slate-100" />
          <div className="text-center">
            <p className="text-xl font-black text-emerald-600">{standing.won}</p>
            <p className="text-[10px] uppercase tracking-wide text-slate-400">wins</p>
          </div>
          <div className="h-8 w-px bg-slate-100" />
          <div className="text-center">
            <p className="text-xl font-black text-slate-950">{standing.goalDifference > 0 ? `+${standing.goalDifference}` : standing.goalDifference}</p>
            <p className="text-[10px] uppercase tracking-wide text-slate-400">GD</p>
          </div>
        </div>
      </div>
    </div>
  </div>
)

const PlayerStatCard = ({
  icon: Icon,
  label,
  playerName,
  playerImage,
  teamImage,
  value,
  unit,
}: {
  icon: React.ComponentType<{ size?: number; className?: string }>
  label: string
  playerName: string
  playerImage: string | null
  teamImage: string | null
  value: number
  unit: string
}) => (
  <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
    <div className="border-b border-slate-100 bg-slate-50 px-4 py-2.5">
      <div className="flex items-center gap-1.5">
        <Icon size={13} className="text-slate-400" />
        <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</span>
      </div>
    </div>
    <div className="flex items-center gap-3 p-4">
      <div className="relative shrink-0">
        <div className="h-11 w-11 overflow-hidden rounded-full bg-slate-100 ring-2 ring-slate-200">
          {playerImage ? (
            <img src={playerImage} alt={playerName} className="h-full w-full object-cover object-top" />
          ) : (
            <svg viewBox="0 0 80 80" fill="none" className="h-full w-full">
              <circle cx="40" cy="30" r="16" fill="#cbd5e1" />
              <path d="M12 78c0-15.464 12.536-28 28-28s28 12.536 28 28" fill="#cbd5e1" />
            </svg>
          )}
        </div>
        {teamImage && (
          <img
            src={teamImage}
            alt=""
            className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full border border-white bg-white object-contain"
          />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-slate-950">{playerName}</p>
      </div>
      <div className="shrink-0 text-right">
        <p className="text-xl font-black text-slate-950">{value}</p>
        <p className="text-[10px] uppercase tracking-wide text-slate-400">{unit}</p>
      </div>
    </div>
  </div>
)

const TeamStatCard = ({
  icon: Icon,
  label,
  teamName,
  teamImage,
  value,
  unit,
}: {
  icon: React.ComponentType<{ size?: number; className?: string }>
  label: string
  teamName: string
  teamImage: string | null
  value: number
  unit: string
}) => (
  <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
    <div className="border-b border-slate-100 bg-slate-50 px-4 py-2.5">
      <div className="flex items-center gap-1.5">
        <Icon size={13} className="text-slate-400" />
        <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</span>
      </div>
    </div>
    <div className="flex items-center gap-3 p-4">
      {teamImage && (
        <img src={teamImage} alt={teamName} className="h-10 w-10 shrink-0 object-contain" />
      )}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-slate-950">{teamName}</p>
      </div>
      <div className="shrink-0 text-right">
        <p className="text-xl font-black text-slate-950">{value}</p>
        <p className="text-[10px] uppercase tracking-wide text-slate-400">{unit}</p>
      </div>
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

  try {
    seasons = await getSeasons()
  } catch {
    errorMessage = "Could not load seasons."
  }

  const currentSeason = seasons.find((season) => season.isCurrent) ?? seasons[0]
  const selectedSeasonId = seasonIdParam ? Number(seasonIdParam) : (currentSeason?.id ?? 1)

  const [stagesResult, leadersResult] = await Promise.allSettled([
    getStages(selectedSeasonId),
    getLeaders({ seasonId: selectedSeasonId, limit: 1 }),
  ])

  if (stagesResult.status === "fulfilled") stages = stagesResult.value
  if (leadersResult.status === "fulfilled") leaders = leadersResult.value

  const visibleStages = stages.filter((stage) => isMainStage(stage.name))
  const currentStage = visibleStages.find((stage) => stage.isCurrent) ?? visibleStages[0]
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
  const bestAttack = standings.length > 0
    ? standings.reduce((best, standing) => standing.goalsFor > best.goalsFor ? standing : best)
    : null

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
                  <StandingsTable standings={standings} />
                  <div className="flex items-center gap-1.5 px-1 text-xs text-slate-400">
                    <div className="h-3 w-1 rounded-full bg-red-400" />
                    <span>Relegation zone</span>
                  </div>
                </>
              )}
            </div>

            <div className="flex flex-col gap-3">
              {leader && (
                <LeaderCard standing={leader} stageName={selectedStage?.name ?? "Stage"} />
              )}
              {topScorer && (
                <PlayerStatCard
                  icon={IconBallFootball}
                  label="Top scorer"
                  playerName={getPlayerName(topScorer.player.displayName, topScorer.player.name)}
                  playerImage={topScorer.player.imagePath}
                  teamImage={topScorer.team?.imagePath ?? null}
                  value={topScorer.value}
                  unit="goals"
                />
              )}
              {topAssist && (
                <PlayerStatCard
                  icon={IconUsers}
                  label="Top assists"
                  playerName={getPlayerName(topAssist.player.displayName, topAssist.player.name)}
                  playerImage={topAssist.player.imagePath}
                  teamImage={topAssist.team?.imagePath ?? null}
                  value={topAssist.value}
                  unit="assists"
                />
              )}
              {bestAttack && (
                <TeamStatCard
                  icon={IconStar}
                  label="Best attack"
                  teamName={bestAttack.team.name}
                  teamImage={bestAttack.team.imagePath ?? null}
                  value={bestAttack.goalsFor}
                  unit="goals"
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
