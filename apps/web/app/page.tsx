import type { ComponentType } from "react"
import {
  IconBallFootball,
  IconPlayerPlay,
  IconTrophy,
  IconUsersGroup,
} from "@tabler/icons-react"
import MatchesCarousel from "@/components/matches-carousel"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  getDashboardOverview,
  type DashboardFixtureSummary,
  type DashboardOverview,
} from "@/lib/dashboard"
import {
  getLeaders,
  type LeaderEntry,
  type LeadersContract,
} from "@/lib/metrics"

export const dynamic = "force-dynamic"

const formatResultDate = (value: string | null) => {
  if (!value) return "Sin fecha"

  return new Intl.DateTimeFormat("es-UY", {
    day: "numeric",
    month: "short",
    timeZone: "America/Montevideo",
  }).format(new Date(value))
}

const formatRating = (value: number) => {
  return new Intl.NumberFormat("es-UY", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 2,
  }).format(value)
}

const getPlayerName = (leader: LeaderEntry) => {
  return leader.player.displayName ?? leader.player.name
}

const MatchVideoCard = ({ match }: { match: DashboardFixtureSummary }) => (
  <article className="group relative min-h-44 overflow-hidden rounded-[28px] bg-slate-950 shadow-[0_28px_65px_-38px_rgba(15,23,42,0.9)]">
    {match.venue?.imagePath ? (
      <div
        className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-105"
        style={{ backgroundImage: `url("${match.venue.imagePath}")` }}
      />
    ) : null}

    <div
      className="absolute inset-0"
      style={{
        background: match.venue?.imagePath
          ? "linear-gradient(160deg, rgba(2,6,23,0.86) 0%, rgba(15,23,42,0.58) 48%, rgba(6,78,59,0.5) 100%)"
          : "linear-gradient(150deg, #0a1628 0%, #0c2b1a 40%, #0a3320 70%, #050d1a 100%)",
      }}
    />

    <div
      className="absolute inset-0 opacity-[0.08]"
      style={{
        backgroundImage: `repeating-linear-gradient(
          0deg,
          transparent,
          transparent 19px,
          rgba(255,255,255,0.7) 19px,
          rgba(255,255,255,0.7) 20px
        ),
        repeating-linear-gradient(
          90deg,
          transparent,
          transparent 19px,
          rgba(255,255,255,0.28) 19px,
          rgba(255,255,255,0.28) 20px
        )`,
      }}
    />

    <div className="absolute inset-0 flex items-center justify-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full border border-white/15 bg-white/15 backdrop-blur-sm transition-transform group-hover:scale-110">
        <IconPlayerPlay className="h-5 w-5 translate-x-0.5 text-white" />
      </div>
    </div>

    <div className="relative flex h-full flex-col justify-between p-4 pt-16">
      <div className="flex items-center justify-between gap-3">
        <p className="rounded-full bg-white/10 px-3 py-1 text-[10px] font-semibold tracking-[0.2em] text-white/70 uppercase backdrop-blur-sm">
          Resumen
        </p>
        <p className="text-xs text-white/55">
          {formatResultDate(match.kickoffAt)}
        </p>
      </div>

      <div className="space-y-2">
        <p className="text-sm leading-tight font-semibold text-white">
          {match.homeTeam?.name ?? "Local"}{" "}
          <span className="font-black text-emerald-300">
            {match.homeScore ?? "-"} : {match.awayScore ?? "-"}
          </span>{" "}
          {match.awayTeam?.name ?? "Visitante"}
        </p>
        <p className="text-xs text-white/55">
          {match.venue?.name ?? "Partido sin estadio asignado"}
        </p>
      </div>
    </div>
  </article>
)

const PlayerLeaderCard = ({ leader }: { leader: LeaderEntry }) => {
  const playerName = getPlayerName(leader)

  return (
    <article className="group relative overflow-hidden rounded-[28px] border border-slate-200/80 bg-white p-4 shadow-sm transition-transform duration-300 hover:-translate-y-1 hover:shadow-xl">
      <div className="absolute inset-x-0 top-0 h-24 bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.22),transparent_72%)]" />

      <div className="relative flex items-start gap-4">
        <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-[22px] border border-slate-200 bg-slate-950">
          {leader.player.imagePath ? (
            <img
              src={leader.player.imagePath}
              alt={playerName}
              className="h-full w-full object-cover"
            />
          ) : (
            <span className="text-lg font-black tracking-wide text-white">
              {playerName.slice(0, 2).toUpperCase()}
            </span>
          )}
        </div>

        <div className="min-w-0 flex-1 space-y-1">
          <p className="text-[10px] font-semibold tracking-[0.2em] text-slate-400 uppercase">
            Rating promedio
          </p>
          <h3 className="truncate text-base font-bold text-slate-950">
            {playerName}
          </h3>
          <p className="truncate text-sm text-slate-500">
            {leader.team?.name ?? "Equipo sin asignar"}
          </p>
        </div>

        <div className="rounded-[22px] bg-slate-950 px-3 py-2 text-right text-white shadow-lg shadow-slate-950/15">
          <p className="text-[10px] font-semibold tracking-[0.16em] text-white/55 uppercase">
            Score
          </p>
          <p className="text-2xl leading-none font-black">
            {formatRating(leader.value)}
          </p>
        </div>
      </div>
    </article>
  )
}

const SectionTitle = ({
  icon: Icon,
  title,
  description,
  badge,
}: {
  icon?: ComponentType<{ size?: number; className?: string }>
  title: string
  description?: string
  badge?: string
}) => (
  <div className="flex items-center gap-2">
    {Icon ? <Icon size={16} className="shrink-0 text-slate-400" /> : null}
    <h2 className="text-base font-bold text-slate-950">{title}</h2>
    {badge ? (
      <span className="text-sm text-slate-400">{badge}</span>
    ) : description ? (
      <span className="text-sm text-slate-400">{description}</span>
    ) : null}
  </div>
)

const HomePage = async () => {
  let overview: DashboardOverview | null = null
  let leaders: LeadersContract | null = null
  let errorMessage: string | null = null

  try {
    overview = await getDashboardOverview()
  } catch (error) {
    errorMessage =
      error instanceof Error
        ? error.message
        : "No se pudo cargar la portada desde la API."
  }

  if (overview?.season?.id) {
    try {
      leaders = await getLeaders({
        seasonId: overview.season.id,
        stageId: overview.currentStage?.id,
        limit: 6,
      })
    } catch {
      leaders = null
    }
  }

  const topRatedPlayers = leaders?.topRated.leaders ?? []
  const topScorers = leaders?.topScorers.leaders ?? []

  return (
    <main className="min-h-svh bg-[linear-gradient(180deg,#f8fafc_0%,#f8fafc_48%,#eef2f7_100%)]">
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

        <section className="flex flex-col gap-4">
          <SectionTitle
            icon={IconBallFootball}
            title="Partidos"
            badge={`${overview?.currentStage?.name ?? "Apertura"} ${overview?.season?.name ?? ""} · Fecha ${overview?.currentRound?.name ?? "—"}`}
          />
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
                title="Últimos videos"
                description="Resúmenes visuales de los partidos más recientes"
              />
              {(overview?.recentResults ?? []).length > 0 ? (
                <div className="grid gap-4 sm:grid-cols-2">
                  {(overview?.recentResults ?? []).map((match) => (
                    <MatchVideoCard key={match.id} match={match} />
                  ))}
                </div>
              ) : (
                <div className="flex h-36 items-center justify-center rounded-2xl border border-dashed border-slate-200 text-sm text-slate-400">
                  No hay resúmenes disponibles
                </div>
              )}
            </section>

            <section className="flex flex-col gap-4">
              <SectionTitle
                icon={IconUsersGroup}
                title="Mejores jugadores"
                description="Mejor rating promedio en la temporada actual"
              />
              {topRatedPlayers.length > 0 ? (
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {topRatedPlayers.map((leader) => (
                    <PlayerLeaderCard
                      key={`${leader.player.id}-${leader.value}`}
                      leader={leader}
                    />
                  ))}
                </div>
              ) : (
                <div className="flex h-40 flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-slate-200 text-center">
                  <IconUsersGroup className="h-8 w-8 text-slate-300" />
                  <p className="text-sm font-medium text-slate-400">
                    Todavía no hay ratings disponibles
                  </p>
                  <p className="text-xs text-slate-300">
                    Esta sección se llenará cuando la API exponga puntuaciones
                    suficientes
                  </p>
                </div>
              )}
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
                      <TableHead className="w-10 text-center text-xs">
                        #
                      </TableHead>
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
                description="Máximos anotadores de la temporada"
              />
              {topScorers.length > 0 ? (
                <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-slate-50">
                        <TableHead className="w-10 text-center text-xs">
                          #
                        </TableHead>
                        <TableHead className="text-xs">Jugador</TableHead>
                        <TableHead className="text-xs">Equipo</TableHead>
                        <TableHead className="text-right text-xs">
                          Goles
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {topScorers.map((leader, index) => (
                        <TableRow key={`${leader.player.id}-${leader.value}`}>
                          <TableCell className="text-center text-xs font-medium text-slate-400">
                            {index + 1}
                          </TableCell>
                          <TableCell className="text-xs font-medium text-slate-950">
                            {getPlayerName(leader)}
                          </TableCell>
                          <TableCell className="text-xs text-slate-500">
                            {leader.team?.name ?? "Sin equipo"}
                          </TableCell>
                          <TableCell className="text-right text-xs font-bold text-emerald-600">
                            {leader.value}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="flex h-36 items-center justify-center rounded-2xl border border-dashed border-slate-200 text-sm text-slate-400">
                  No hay goleadores disponibles todavía
                </div>
              )}
            </section>
          </div>
        </div>
      </div>
    </main>
  )
}

export default HomePage
