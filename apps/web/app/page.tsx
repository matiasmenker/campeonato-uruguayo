import {
  IconBallFootball,
  IconCalendar,
  IconShield,
  IconStar,
} from "@tabler/icons-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { getDashboardOverview, type DashboardOverview } from "@/lib/dashboard"

export const dynamic = "force-dynamic"

const uruguayDateFormatter = new Intl.DateTimeFormat("es-UY", {
  weekday: "short",
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "America/Montevideo",
})

const compactDateFormatter = new Intl.DateTimeFormat("es-UY", {
  day: "numeric",
  month: "short",
  timeZone: "America/Montevideo",
})

const formatKickoff = (value: string | null) => {
  if (!value) {
    return "Horario pendiente"
  }

  return `${uruguayDateFormatter.format(new Date(value))} UYT`
}

const formatResultDate = (value: string | null) => {
  if (!value) {
    return "Sin fecha"
  }

  return compactDateFormatter.format(new Date(value))
}

const buildHeroSummary = (overview: DashboardOverview | null) => {
  const leader = overview?.standings[0]

  if (!overview || !leader) {
    return "Seguimiento en tiempo real del Apertura uruguayo, con tabla, resultados y próximos partidos."
  }

  return `${leader.team.name} lidera con ${leader.points} puntos en ${leader.played} partidos, mientras la fecha ${overview.currentRound?.name ?? "actual"} ya empieza a mover la tabla.`
}

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

  const stats = [
    {
      label: "Equipos",
      value: overview?.totalTeams ?? 0,
      icon: IconShield,
    },
    {
      label: "Jugadores",
      value: overview?.totalPlayers ?? 0,
      icon: IconStar,
    },
    {
      label: "Partidos",
      value: overview?.totalFixtures ?? 0,
      icon: IconBallFootball,
    },
    {
      label: "Finalizados",
      value: overview?.completedFixtures ?? 0,
      icon: IconCalendar,
    },
  ]

  return (
    <main className="min-h-svh bg-[radial-gradient(circle_at_top_left,_rgba(125,211,252,0.35),_transparent_28%),radial-gradient(circle_at_85%_10%,_rgba(15,23,42,0.14),_transparent_24%),linear-gradient(180deg,_#f8fcff_0%,_#eef6ff_52%,_#f8fafc_100%)]">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-6 py-8 sm:px-8 lg:px-10 lg:py-10">
        <section className="relative overflow-hidden rounded-[2rem] border border-sky-200/70 bg-white/85 p-6 shadow-[0_30px_90px_-45px_rgba(14,116,144,0.55)] backdrop-blur sm:p-8 lg:p-10">
          <div className="absolute top-0 -left-16 h-40 w-40 rounded-full bg-sky-200/50 blur-3xl" />
          <div className="absolute right-0 bottom-0 h-48 w-48 rounded-full bg-slate-950/8 blur-3xl" />

          <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <Badge className="border border-sky-300/70 bg-sky-100 text-sky-900 hover:bg-sky-100">
                  {overview?.league?.name ?? "Campeonato Uruguayo"}
                </Badge>
                <Badge
                  variant="secondary"
                  className="bg-slate-950 text-slate-50 hover:bg-slate-950"
                >
                  Temporada {overview?.season?.name ?? "activa"}
                </Badge>
                <Badge variant="outline" className="bg-white/70">
                  {overview?.currentStage?.name ?? "Sin etapa activa"}
                </Badge>
                <Badge variant="outline" className="bg-white/70">
                  Fecha {overview?.currentRound?.name ?? "pendiente"}
                </Badge>
              </div>

              <div className="space-y-3">
                <p className="text-sm font-medium tracking-[0.28em] text-sky-700 uppercase">
                  Portada
                </p>
                <h1 className="max-w-2xl text-4xl font-black tracking-tight text-slate-950 sm:text-5xl">
                  El Apertura uruguayo, en una sola vista.
                </h1>
                <p className="max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
                  {buildHeroSummary(overview)}
                </p>
              </div>
            </div>

            <div className="grid w-full gap-3 sm:grid-cols-2 lg:w-[28rem]">
              {stats.map((stat) => {
                const Icon = stat.icon

                return (
                  <div
                    key={stat.label}
                    className="rounded-2xl border border-slate-200/80 bg-slate-950 px-4 py-4 text-white shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm text-slate-300">{stat.label}</p>
                        <p className="mt-3 text-3xl font-bold tracking-tight">
                          {stat.value}
                        </p>
                      </div>
                      <div className="rounded-xl bg-white/10 p-2 text-sky-300">
                        <Icon className="h-5 w-5" />
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </section>

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

        <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <Card className="overflow-hidden border-slate-200/80 bg-white/90 shadow-[0_24px_64px_-44px_rgba(15,23,42,0.45)]">
            <CardHeader className="border-b border-slate-100 bg-white/70">
              <CardTitle className="text-2xl font-bold text-slate-950">
                Tabla del Apertura
              </CardTitle>
              <CardDescription className="text-slate-600">
                Foto rápida de la parte alta de la liga.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-14">#</TableHead>
                    <TableHead>Equipo</TableHead>
                    <TableHead className="text-right">PJ</TableHead>
                    <TableHead className="text-right">PTS</TableHead>
                    <TableHead className="text-right">DG</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {overview?.standings.slice(0, 5).map((standing) => (
                    <TableRow key={standing.id}>
                      <TableCell className="font-semibold text-slate-500">
                        {standing.position}
                      </TableCell>
                      <TableCell className="font-medium text-slate-950">
                        {standing.team.name}
                      </TableCell>
                      <TableCell className="text-right text-slate-600">
                        {standing.played}
                      </TableCell>
                      <TableCell className="text-right font-semibold text-slate-950">
                        {standing.points}
                      </TableCell>
                      <TableCell className="text-right text-slate-600">
                        {standing.goalDifference > 0 ? "+" : ""}
                        {standing.goalDifference}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card className="border-slate-200/80 bg-white/90 shadow-[0_24px_64px_-44px_rgba(15,23,42,0.45)]">
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-slate-950">
                Próximos partidos
              </CardTitle>
              <CardDescription className="text-slate-600">
                Agenda inmediata en horario de Uruguay.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {overview?.upcomingFixtures.map((fixture) => (
                <article
                  key={fixture.id}
                  className="rounded-2xl border border-slate-200/80 bg-slate-50/70 px-4 py-4"
                >
                  <p className="text-xs font-medium tracking-[0.24em] text-sky-700 uppercase">
                    {formatKickoff(fixture.kickoffAt)}
                  </p>
                  <div className="mt-3 space-y-1">
                    <p className="text-base font-semibold text-slate-950">
                      {fixture.homeTeam?.name ?? "Local pendiente"}
                    </p>
                    <p className="text-sm text-slate-500">vs</p>
                    <p className="text-base font-semibold text-slate-950">
                      {fixture.awayTeam?.name ?? "Visitante pendiente"}
                    </p>
                  </div>
                </article>
              ))}
            </CardContent>
          </Card>
        </section>

        <Card className="border-slate-200/80 bg-white/90 shadow-[0_24px_64px_-44px_rgba(15,23,42,0.45)]">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-slate-950">
              Últimos resultados
            </CardTitle>
            <CardDescription className="text-slate-600">
              Los cierres más recientes de la temporada actual.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 lg:grid-cols-5">
            {overview?.recentResults.map((fixture) => (
              <article
                key={fixture.id}
                className="rounded-2xl border border-slate-200/80 bg-slate-950 px-4 py-4 text-white"
              >
                <p className="text-xs tracking-[0.24em] text-slate-400 uppercase">
                  {formatResultDate(fixture.kickoffAt)}
                </p>
                <div className="mt-4 space-y-3">
                  <div className="space-y-1">
                    <p className="text-sm text-slate-300">
                      {fixture.homeTeam?.name ?? "Local pendiente"}
                    </p>
                    <p className="text-3xl font-black tracking-tight">
                      {fixture.homeScore ?? "-"}
                    </p>
                  </div>
                  <div className="h-px bg-white/10" />
                  <div className="space-y-1">
                    <p className="text-sm text-slate-300">
                      {fixture.awayTeam?.name ?? "Visitante pendiente"}
                    </p>
                    <p className="text-3xl font-black tracking-tight">
                      {fixture.awayScore ?? "-"}
                    </p>
                  </div>
                </div>
              </article>
            ))}
          </CardContent>
        </Card>
      </div>
    </main>
  )
}

export default HomePage
