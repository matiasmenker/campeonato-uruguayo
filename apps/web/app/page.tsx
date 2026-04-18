import type { ComponentType } from "react"
import {
  IconBallFootball,
  IconPlayerPlay,
  IconTrophy,
  IconUsersGroup,
} from "@tabler/icons-react"
import MatchesCarousel from "@/components/matches-carousel"
import {
  YoutubeVideoCard,
  type YoutubeVideo,
} from "@/components/youtube-video-card"
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
  type DashboardOverview,
} from "@/lib/dashboard"
import {
  getLeaders,
  type LeaderEntry,
  type LeadersContract,
} from "@/lib/metrics"

export const dynamic = "force-dynamic"

const formatRating = (value: number) => {
  return new Intl.NumberFormat("es-UY", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 2,
  }).format(value)
}

const getPlayerName = (leader: LeaderEntry) => {
  return leader.player.displayName ?? leader.player.name
}


const PlayerLeaderCard = ({ leader }: { leader: LeaderEntry }) => {
  const playerName = getPlayerName(leader)

  return (
    <article className="group relative flex flex-col items-center gap-0 overflow-hidden rounded-2xl bg-slate-900 px-3 pb-4 pt-5 shadow-md transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_16px_48px_-8px_rgba(16,185,129,0.22)]">
      {/* Emerald top accent */}
      <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-transparent via-emerald-400/60 to-transparent" />

      {/* Subtle background glow */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_0%,rgba(16,185,129,0.07),transparent)]" />

      {/* Avatar */}
      <div className="relative mb-3">
        <div className="h-[72px] w-[72px] overflow-hidden rounded-full bg-slate-800 ring-2 ring-slate-700/80">
          {leader.player.imagePath ? (
            <img
              src={leader.player.imagePath}
              alt={playerName}
              className="h-full w-full object-cover object-top"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <span className="text-xl font-black text-slate-500">
                {playerName.slice(0, 2).toUpperCase()}
              </span>
            </div>
          )}
        </div>
        {leader.team?.imagePath ? (
          <div className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center overflow-hidden rounded-full bg-slate-800 ring-2 ring-slate-900">
            <img
              src={leader.team.imagePath}
              alt={leader.team.name ?? ""}
              className="h-4 w-4 object-contain"
            />
          </div>
        ) : null}
      </div>

      {/* Name + team */}
      <p className="w-full truncate text-center text-[13px] font-bold leading-tight text-white">
        {playerName}
      </p>
      <p className="mt-0.5 w-full truncate text-center text-[11px] text-slate-500">
        {leader.team?.name ?? "—"}
      </p>

      {/* Divider */}
      <div className="my-3 w-8 border-t border-slate-800" />

      {/* Rating */}
      <span className="text-[1.7rem] font-black leading-none tabular-nums text-emerald-400">
        {formatRating(leader.value)}
      </span>
      <span className="mt-1 text-[9px] font-bold uppercase tracking-[0.18em] text-slate-600">
        Rating
      </span>
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

// MVP: hardcoded videos from Liga AUF Uruguaya playlist — replace with YouTube API fetch
// Filter logic for production: include titles matching Apertura/Clausura/Liga AUF/HL Largo/Resumen/Fecha
// Exclude: "Segunda Profesional", "Sub-", "Selección", "Femenin", "Copa AUF"
const AUF_VIDEOS_MVP: YoutubeVideo[] = [
  {
    videoId: "rJSbulDa9QM",
    title: "Show de goles | Liga AUF Uruguaya 2026 | Fecha 11 | Torneo Apertura",
    thumbnailUrl: "https://i.ytimg.com/vi/rJSbulDa9QM/hqdefault.jpg",
    publishedAt: "2026-04-13T12:00:00+00:00",
  },
  {
    videoId: "cylnr4P_dwo",
    title: "Peñarol 0-2 Liverpool | HL Largo | Fecha 11 | Torneo Apertura 2026",
    thumbnailUrl: "https://i.ytimg.com/vi/cylnr4P_dwo/hqdefault.jpg",
    publishedAt: "2026-04-12T20:00:00+00:00",
  },
  {
    videoId: "wrPvnG_qgYs",
    title: "Peñarol 0-2 Liverpool | Resumen | Fecha 11 | Torneo Apertura 2026",
    thumbnailUrl: "https://i.ytimg.com/vi/wrPvnG_qgYs/hqdefault.jpg",
    publishedAt: "2026-04-12T18:00:00+00:00",
  },
  {
    videoId: "ZSpTEVmSW94",
    title: "Racing 2-1 Juventud | HL Largo | Fecha 10 | Torneo Apertura 2026",
    thumbnailUrl: "https://i.ytimg.com/vi/ZSpTEVmSW94/hqdefault.jpg",
    publishedAt: "2026-04-07T20:00:00+00:00",
  },
  {
    videoId: "oU_YPM3AhYs",
    title: "Nota con el DT Gustavo Ferrín | Torneo Apertura 2026",
    thumbnailUrl: "https://i.ytimg.com/vi/oU_YPM3AhYs/hqdefault.jpg",
    publishedAt: "2026-04-06T18:00:00+00:00",
  },
  {
    videoId: "4ytXIbkJa34",
    title: "Gol de Ruben Bentancourt a Peñarol en la victoria de Liverpool en el CDS",
    thumbnailUrl: "https://i.ytimg.com/vi/4ytXIbkJa34/hqdefault.jpg",
    publishedAt: "2026-04-05T22:00:00+00:00",
  },
]

// MVP: fixture ID → YouTube video mapping — populate with real IDs once YouTube API is integrated
// Key: fixture ID from the API, Value: video data from AUF YouTube playlist
const FIXTURE_VIDEO_MAP: Record<number, { videoId: string; title: string; thumbnailUrl: string; publishedAt: string }> = {
  // Example entries — replace keys with real fixture IDs from the API:
  // 12345: { videoId: "cylnr4P_dwo", title: "Peñarol 0-2 Liverpool | HL Largo | Fecha 11", thumbnailUrl: "https://i.ytimg.com/vi/cylnr4P_dwo/hqdefault.jpg", publishedAt: "2026-04-12T20:00:00+00:00" },
  // 12346: { videoId: "ZSpTEVmSW94", title: "Racing 2-1 Juventud | HL Largo | Fecha 10", thumbnailUrl: "https://i.ytimg.com/vi/ZSpTEVmSW94/hqdefault.jpg", publishedAt: "2026-04-07T20:00:00+00:00" },
}

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
            fixtureVideoMap={FIXTURE_VIDEO_MAP}
          />
        </section>

        <div className="grid gap-6 lg:grid-cols-[3fr_2fr]">
          <div className="flex flex-col gap-8">
            <section className="flex flex-col gap-4">
              <SectionTitle
                icon={IconPlayerPlay}
                title="Últimos videos"
                description="Resúmenes y entrevistas del campeonato"
              />
              <div className="grid gap-3 sm:grid-cols-2">
                {AUF_VIDEOS_MVP.map((video) => (
                  <YoutubeVideoCard key={video.videoId} video={video} />
                ))}
              </div>
            </section>

            <section className="flex flex-col gap-4">
              <SectionTitle
                icon={IconUsersGroup}
                title="Mejores jugadores"
                description="Mejor rating promedio en la temporada actual"
              />
              {topRatedPlayers.length > 0 ? (
                <div className="grid grid-cols-3 gap-3">
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
                description={`${overview?.currentStage?.name ?? "Apertura"} ${overview?.season?.name ?? ""}`}
              />
              <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50">
                      <TableHead className="w-8 text-center text-xs">#</TableHead>
                      <TableHead className="text-xs">Equipo</TableHead>
                      <TableHead className="text-right text-xs" title="Partidos jugados">PJ</TableHead>
                      <TableHead className="text-right text-xs" title="Victorias">V</TableHead>
                      <TableHead className="text-right text-xs" title="Empates">E</TableHead>
                      <TableHead className="text-right text-xs" title="Derrotas">D</TableHead>
                      <TableHead className="text-right text-xs" title="Goles marcados">GF</TableHead>
                      <TableHead className="text-right text-xs" title="Goles en contra">GC</TableHead>
                      <TableHead className="text-right text-xs" title="Diferencia de goles">DG</TableHead>
                      <TableHead className="text-right text-xs" title="Puntos">PTS</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(overview?.standings ?? []).map((standing, index) => (
                      <TableRow key={standing.id}>
                        <TableCell className="text-center">
                          <span className="text-xs font-medium text-slate-400">
                            {standing.position}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {standing.team.imagePath ? (
                              <img
                                src={standing.team.imagePath}
                                alt={standing.team.name}
                                className="h-5 w-5 shrink-0 object-contain"
                              />
                            ) : (
                              <div className="h-5 w-5 shrink-0 rounded-full bg-slate-200" />
                            )}
                            <span className="text-xs font-medium text-slate-950">
                              {standing.team.name}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right text-xs text-slate-500">{standing.played}</TableCell>
                        <TableCell className="text-right text-xs text-emerald-600 font-medium">{standing.won}</TableCell>
                        <TableCell className="text-right text-xs text-slate-500">{standing.draw}</TableCell>
                        <TableCell className="text-right text-xs text-red-400">{standing.lost}</TableCell>
                        <TableCell className="text-right text-xs text-slate-500">{standing.goalsFor}</TableCell>
                        <TableCell className="text-right text-xs text-slate-500">{standing.goalsAgainst}</TableCell>
                        <TableCell className="text-right text-xs text-slate-500">
                          {standing.goalDifference > 0 ? "+" : ""}{standing.goalDifference}
                        </TableCell>
                        <TableCell className="text-right text-xs font-bold text-slate-950">{standing.points}</TableCell>
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
