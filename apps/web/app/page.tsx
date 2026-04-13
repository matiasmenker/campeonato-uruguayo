import {
  IconPlayerPlay,
  IconTrophy,
  IconBallFootball,
  IconUsersGroup,
} from "@tabler/icons-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { getDashboardOverview, type DashboardOverview, type DashboardFixtureSummary } from "@/lib/dashboard"
import MatchesCarousel from "@/components/matches-carousel"

export const dynamic = "force-dynamic"

const formatResultDate = (value: string | null) => {
  if (!value) return "Sin fecha"
  return new Intl.DateTimeFormat("es-UY", {
    day: "numeric",
    month: "short",
    timeZone: "America/Montevideo",
  }).format(new Date(value))
}

const MatchVideoCard = ({ match }: { match: DashboardFixtureSummary }) => (
  <article className="group relative overflow-hidden rounded-2xl bg-slate-950">
    <div
      className="absolute inset-0 opacity-60"
      style={{
        background:
          "linear-gradient(150deg, #0a1628 0%, #0c2b1a 40%, #0a3320 70%, #050d1a 100%)",
      }}
    />
    <div
      className="absolute inset-0 opacity-[0.06]"
      style={{
        backgroundImage: `repeating-linear-gradient(
          0deg, transparent, transparent 19px,
          rgba(255,255,255,0.6) 19px, rgba(255,255,255,0.6) 20px
        ), repeating-linear-gradient(
          90deg, transparent, transparent 19px,
          rgba(255,255,255,0.6) 19px, rgba(255,255,255,0.6) 20px
        )`,
      }}
    />

    <div className="absolute inset-0 flex items-center justify-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/15 backdrop-blur-sm transition-transform group-hover:scale-110">
        <IconPlayerPlay className="h-5 w-5 translate-x-0.5 text-white" />
      </div>
    </div>

    <div className="relative flex flex-col justify-between p-4 pt-14">
      <div className="space-y-1">
        <p className="text-xs tracking-wider text-white/50 uppercase">
          {formatResultDate(match.kickoffAt)}
        </p>
        <p className="text-sm font-semibold leading-tight text-white">
          {match.homeTeam?.name ?? "Local"}{" "}
          <span className="font-black text-emerald-400">
            {match.homeScore ?? "-"} : {match.awayScore ?? "-"}
          </span>{" "}
          {match.awayTeam?.name ?? "Visitante"}
        </p>
      </div>
    </div>
  </article>
)

const SectionTitle = ({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ComponentType<{ className?: string }>
  title: string
  description?: string
}) => (
  <div className="flex items-center gap-3">
    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-950">
      <Icon className="h-4 w-4 text-white" />
    </div>
    <div>
      <h2 className="text-lg font-bold text-slate-950">{title}</h2>
      {description ? (
        <p className="text-xs text-slate-500">{description}</p>
      ) : null}
    </div>
  </div>
)

const HomePage = async () => {
  let overview: DashboardOverview | null = null
  let errorMessage: string | null = null

  try {
    overview = await getDashboardOverview()
  } catch (error) {
    errorMessage =
      error instanceof Error
        ? error.message
        : "No se pudo cargar la portada desde la API."
  }

  const topScorers = [...(overview?.standings ?? [])]
    .sort((a, b) => b.goalsFor - a.goalsFor)
    .slice(0, 8)

  return (
    <main className="min-h-svh bg-slate-50">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-6 py-8 sm:px-8 lg:px-10">
        {errorMessage ? (
          <Alert className="border-amber-300 bg-amber-50 text-amber-950">
            <AlertTitle>No pudimos cargar la API</AlertTitle>
            <AlertDescription>
              {errorMessage}. Si estás en local, levantá la API con{" "}
              <code className="rounded bg-amber-100 px-1.5 py-0.5 text-sm">
                PORT=3001 pnpm dev:api
              </code>{" "}
              y recargá la página.
            </AlertDescription>
          </Alert>
        ) : null}

        <section className="flex flex-col gap-3">
          <div className="flex items-baseline gap-2 px-1">
            <h2 className="text-sm font-semibold text-slate-700">
              Fecha {overview?.currentRound?.name ?? "—"}
            </h2>
            <span className="text-xs text-slate-400">
              {overview?.currentStage?.name ?? "Apertura"} {overview?.season?.name ?? ""}
            </span>
          </div>
          <MatchesCarousel
            matches={overview?.recentResults ?? []}
            roundName={overview?.currentRound?.name}
          />
        </section>

        <div className="grid gap-6 lg:grid-cols-[3fr_2fr]">
          <div className="flex flex-col gap-8">
            <section className="flex flex-col gap-4">
              <SectionTitle
                icon={IconPlayerPlay}
                title="Highlights"
                description="Resúmenes de los últimos partidos"
              />
              {(overview?.recentResults ?? []).length > 0 ? (
                <div className="grid gap-3 sm:grid-cols-2">
                  {(overview?.recentResults ?? []).map((match) => (
                    <MatchVideoCard key={match.id} match={match} />
                  ))}
                </div>
              ) : (
                <div className="flex h-36 items-center justify-center rounded-2xl border border-dashed border-slate-200 text-sm text-slate-400">
                  No hay highlights disponibles
                </div>
              )}
            </section>

            <section className="flex flex-col gap-4">
              <SectionTitle
                icon={IconUsersGroup}
                title="Mejores jugadores"
                description="Los más destacados de la fecha"
              />
              <div className="flex h-40 flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-slate-200 text-center">
                <IconUsersGroup className="h-8 w-8 text-slate-300" />
                <p className="text-sm font-medium text-slate-400">
                  Próximamente
                </p>
                <p className="text-xs text-slate-300">
                  Los puntos por jugador estarán disponibles en breve
                </p>
              </div>
            </section>
          </div>

          <div className="flex flex-col gap-8">
            <section className="flex flex-col gap-4">
              <SectionTitle
                icon={IconTrophy}
                title="Tabla de posiciones"
                description={overview?.currentStage?.name ?? "Apertura"}
              />
              <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50">
                      <TableHead className="w-10 text-center text-xs">#</TableHead>
                      <TableHead className="text-xs">Equipo</TableHead>
                      <TableHead className="text-right text-xs">PJ</TableHead>
                      <TableHead className="text-right text-xs">PTS</TableHead>
                      <TableHead className="text-right text-xs">DG</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(overview?.standings ?? []).map((standing, index) => (
                      <TableRow key={standing.id}>
                        <TableCell className="text-center">
                          <span
                            className={
                              index < 3
                                ? "text-xs font-bold text-emerald-600"
                                : "text-xs font-medium text-slate-400"
                            }
                          >
                            {standing.position}
                          </span>
                        </TableCell>
                        <TableCell className="text-xs font-medium text-slate-950">
                          {standing.team.name}
                        </TableCell>
                        <TableCell className="text-right text-xs text-slate-500">
                          {standing.played}
                        </TableCell>
                        <TableCell className="text-right text-xs font-bold text-slate-950">
                          {standing.points}
                        </TableCell>
                        <TableCell className="text-right text-xs text-slate-500">
                          {standing.goalDifference > 0 ? "+" : ""}
                          {standing.goalDifference}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </section>

            <section className="flex flex-col gap-4">
              <SectionTitle
                icon={IconBallFootball}
                title="Goleadores"
                description="Goles anotados por equipo"
              />
              <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50">
                      <TableHead className="w-10 text-center text-xs">#</TableHead>
                      <TableHead className="text-xs">Equipo</TableHead>
                      <TableHead className="text-right text-xs">GF</TableHead>
                      <TableHead className="text-right text-xs">GA</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {topScorers.map((standing, index) => (
                      <TableRow key={standing.id}>
                        <TableCell className="text-center text-xs font-medium text-slate-400">
                          {index + 1}
                        </TableCell>
                        <TableCell className="text-xs font-medium text-slate-950">
                          {standing.team.name}
                        </TableCell>
                        <TableCell className="text-right text-xs font-bold text-emerald-600">
                          {standing.goalsFor}
                        </TableCell>
                        <TableCell className="text-right text-xs text-slate-500">
                          {standing.goalsAgainst}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </section>
          </div>
        </div>
      </div>
    </main>
  )
}

export default HomePage
