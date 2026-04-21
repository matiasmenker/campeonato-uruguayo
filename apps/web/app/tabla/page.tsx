import { IconTrophy } from "@tabler/icons-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { getDashboardOverview } from "@/lib/dashboard"
import { getStandings, type StandingEntry } from "@/lib/standings"

export const dynamic = "force-dynamic"

const RELEGATION_ZONE_SIZE = 3

const PositionIndicator = ({ position, total }: { position: number; total: number }) => {
  const isRelegation = position > total - RELEGATION_ZONE_SIZE
  return (
    <div className="flex items-center gap-2">
      {isRelegation ? (
        <div className="h-3.5 w-1 rounded-full bg-red-400" />
      ) : (
        <div className="h-3.5 w-1 rounded-full bg-transparent" />
      )}
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
              <TableRow
                key={standing.id}
                className={isRelegation ? "bg-red-50/40" : undefined}
              >
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

const StandingsPage = async () => {
  let standings: StandingEntry[] = []
  let errorMessage: string | null = null
  let seasonName = "2026"
  let stageName = "Apertura"

  try {
    const overview = await getDashboardOverview()
    seasonName = overview.season?.name ?? seasonName
    stageName = overview.currentStage?.name ?? stageName
    standings = await getStandings({ seasonId: overview.season?.id })
  } catch (error) {
    errorMessage = error instanceof Error ? error.message : "Could not load standings."
  }

  return (
    <main className="min-h-svh bg-[linear-gradient(180deg,#f8fafc_0%,#f8fafc_48%,#eef2f7_100%)]">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-6 py-8 sm:px-8 lg:px-10">

        <div className="flex items-center gap-3">
          <IconTrophy size={20} className="text-slate-400" />
          <div>
            <h1 className="text-xl font-bold text-slate-950">Standings</h1>
            <p className="text-sm text-slate-400">{stageName} {seasonName}</p>
          </div>
        </div>

        {errorMessage ? (
          <Alert className="border-amber-300 bg-amber-50 text-amber-950">
            <AlertTitle>Could not load standings</AlertTitle>
            <AlertDescription>{errorMessage}</AlertDescription>
          </Alert>
        ) : standings.length === 0 ? (
          <div className="flex h-48 items-center justify-center rounded-2xl border border-dashed border-slate-200 text-sm text-slate-400">
            No standings available yet
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
    </main>
  )
}

export default StandingsPage
