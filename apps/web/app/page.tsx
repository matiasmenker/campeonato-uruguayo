import type { ComponentType } from "react"
import {
  IconBallFootball,
  IconPlayerPlay,
  IconStar,
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
import { fetchLatestAufVideos } from "@/lib/youtube"

export const dynamic = "force-dynamic"

const getPlayerName = (leader: LeaderEntry) =>
  leader.player.displayName ?? leader.player.name

const POSITION_CONFIG: Record<number, { label: string; bg: string }> = {
  24: { label: "AR", bg: "#f59e0b" },  // ámbar — arquero
  25: { label: "DF", bg: "#3b82f6" },  // azul — defensa
  26: { label: "MC", bg: "#10b981" },  // verde — mediocampista
  27: { label: "DL", bg: "#ef4444" },  // rojo — delantero
}

const getPositionConfig = (positionId: number | null) =>
  positionId ? (POSITION_CONFIG[positionId] ?? { label: "—", bg: "#94a3b8" }) : { label: "—", bg: "#94a3b8" }

const getRatingColor = (value: number) => {
  if (value >= 8.0) return "#22c55e"
  if (value >= 7.0) return "#38bdf8"
  if (value >= 6.0) return "#f97316"
  return "#ef4444"
}

const formatRating = (value: number) =>
  new Intl.NumberFormat("en-US", { minimumFractionDigits: 1, maximumFractionDigits: 2 }).format(value)

const PlayerCirclePhoto = ({ src, alt }: { src: string | null; alt: string }) => (
  <div style={{ width: 76, height: 76, borderRadius: "50%", overflow: "hidden", flexShrink: 0 }}>
    {src ? (
      <img src={src} alt={alt} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "top" }} />
    ) : (
      <svg viewBox="0 0 80 80" fill="none" style={{ width: "100%", height: "100%", background: "#f1f5f9" }}>
        <circle cx="40" cy="30" r="16" fill="#cbd5e1" />
        <path d="M12 78c0-15.464 12.536-28 28-28s28 12.536 28 28" fill="#cbd5e1" />
      </svg>
    )}
  </div>
)


const PlayerLeaderCard = ({ leader }: { leader: LeaderEntry }) => {
  const name = getPlayerName(leader)
  const parts = name.split(" ")
  const first = parts[0]
  const last = parts.slice(1).join(" ")
  const positionConfig = getPositionConfig(leader.player.positionId ?? null)
  const ratingColor = getRatingColor(leader.value)
  return (
    <article className="relative flex flex-col overflow-hidden rounded-2xl"
      style={{ aspectRatio: "2.5/3.5", background: "#f8fafc", boxShadow: "0 2px 12px rgba(15,23,42,0.07)", border: "1px solid #e2e8f0" }}>
      {/* Nombre */}
      <div className="absolute inset-x-0 top-0 z-30 flex items-center justify-center px-3 pt-2.5" style={{ height: 40 }}>
        <div className="text-center">
          {last ? (
            <>
              <p className="text-[9px] font-black uppercase tracking-wide leading-tight text-slate-600">{first}</p>
              <p className="text-[11px] font-black uppercase tracking-wide leading-tight text-slate-600">{last}</p>
            </>
          ) : (
            <p className="text-[11px] font-black uppercase leading-tight text-slate-600">{first}</p>
          )}
        </div>
      </div>
      {/* Foto circular + badge posición */}
      <div className="absolute inset-x-0 z-20 flex items-center justify-center" style={{ top: 42, bottom: 50 }}>
        <div className="relative">
          <PlayerCirclePhoto src={leader.player.imagePath} alt={name} />
          {/* Position badge — bottom-left of photo circle */}
          <div style={{
            position: "absolute",
            bottom: 0,
            left: -4,
            width: 24,
            height: 24,
            borderRadius: "50%",
            background: positionConfig.bg,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            border: "2px solid #f8fafc",
            zIndex: 10,
          }}>
            <span style={{ fontSize: 8, fontWeight: 900, color: "white", letterSpacing: 0, lineHeight: 1 }}>
              {positionConfig.label}
            </span>
          </div>
        </div>
      </div>
      {/* Strip blanco con línea divisora */}
      <div className="absolute inset-x-0 bottom-0 z-30" style={{ height: 48 }}>
        <div className="absolute inset-0 bg-white" />
        <div className="absolute inset-x-0 top-0 h-px bg-slate-200" />
        <div className="relative z-10 flex h-full items-center justify-between px-3">
          <div className="flex items-center gap-1">
            <span className="text-xl font-black tabular-nums" style={{ color: ratingColor }}>{leader.value.toFixed(1)}</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" style={{ color: ratingColor, opacity: 0.75, flexShrink: 0 }}>
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
          </div>
          {leader.team?.imagePath && (
            <img src={leader.team.imagePath} alt="" className="h-8 w-8 object-contain" />
          )}
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

// Fallback videos used when YOUTUBE_API_KEY / YOUTUBE_CHANNEL_ID are not configured
const AUF_VIDEOS_FALLBACK: YoutubeVideo[] = [
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
  let aufVideos: YoutubeVideo[] = AUF_VIDEOS_FALLBACK

  try {
    overview = await getDashboardOverview()
  } catch (error) {
    errorMessage =
      error instanceof Error
        ? error.message
        : "Could not load the dashboard from the API."
  }

  // Two separate calls: round-scoped for ratings, season-scoped for scorers
  let seasonLeaders: LeadersContract | null = null

  if (overview?.season?.id) {
    const [roundResult, seasonResult] = await Promise.allSettled([
      getLeaders({
        seasonId: overview.season.id,
        stageId: overview.currentStage?.id,
        roundId: overview.lastCompletedRound?.id,
        limit: 10,
      }),
      getLeaders({
        seasonId: overview.season.id,
        stageId: overview.currentStage?.id,
        limit: 8,
      }),
    ])
    leaders = roundResult.status === "fulfilled" ? roundResult.value : null
    seasonLeaders = seasonResult.status === "fulfilled" ? seasonResult.value : null
  }

  try {
    const fetched = await fetchLatestAufVideos(6)
    if (fetched.length > 0) aufVideos = fetched
  } catch {
    // silently keep fallback
  }

  const topRatedPlayers = leaders?.topRated.leaders ?? []
  const topScorers = seasonLeaders?.topScorers.leaders ?? []

  return (
    <main className="bg-[linear-gradient(180deg,#f8fafc_0%,#f8fafc_48%,#eef2f7_100%)]">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-6 py-8 sm:px-8 lg:px-10">
        {errorMessage ? (
          <Alert className="border-amber-300 bg-amber-50 text-amber-950">
            <AlertTitle>Could not load the API</AlertTitle>
            <AlertDescription>
              {errorMessage}. If running locally, start the API with{" "}
              <code className="rounded bg-amber-100 px-1.5 py-0.5 text-sm">
                PORT=3001 pnpm dev:api
              </code>{" "}
              and reload the page.
            </AlertDescription>
          </Alert>
        ) : null}

        <section className="flex flex-col gap-4">
          <SectionTitle
            icon={IconBallFootball}
            title="Matches"
            badge={`${overview?.currentStage?.name ?? "Apertura"} ${overview?.season?.name ?? ""} · Round ${overview?.currentRound?.name ?? "—"}`}
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
                title="Latest videos"
                description="Highlights and interviews"
              />
              <div className="grid gap-3 sm:grid-cols-2">
                {aufVideos.map((video) => (
                  <YoutubeVideoCard key={video.videoId} video={video} />
                ))}
              </div>
            </section>

            <section className="flex flex-col gap-4">
              <SectionTitle
                icon={IconStar}
                title="Best Players"
                description={`Round ${overview?.lastCompletedRound?.name ?? "—"}`}
              />
              {topRatedPlayers.length > 0 ? (
                <div className="grid grid-cols-5 gap-3">
                  {topRatedPlayers.map((leader) => (
                    <PlayerLeaderCard
                      key={`${leader.player.id}-${leader.value}`}
                      leader={leader}
                    />
                  ))}
                </div>
              ) : (
                <div className="flex h-40 flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-slate-200 text-center">
                  <IconStar className="h-8 w-8 text-slate-300" />
                  <p className="text-sm font-medium text-slate-400">
                    No ratings available yet
                  </p>
                </div>
              )}
            </section>
          </div>

          <div className="flex h-full flex-col gap-8">
            <section className="flex flex-col gap-4">
              <SectionTitle
                icon={IconTrophy}
                title="Standings"
                description={`${overview?.currentStage?.name ?? "Apertura"} ${overview?.season?.name ?? ""}`}
              />
              <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50">
                      <TableHead className="w-8 text-center text-xs">#</TableHead>
                      <TableHead className="text-xs">Team</TableHead>
                      <TableHead className="text-right text-xs" title="Matches played">MP</TableHead>
                      <TableHead className="text-right text-xs" title="Wins">W</TableHead>
                      <TableHead className="text-right text-xs" title="Draws">D</TableHead>
                      <TableHead className="text-right text-xs" title="Losses">L</TableHead>
                      <TableHead className="text-right text-xs" title="Goals for">GF</TableHead>
                      <TableHead className="text-right text-xs" title="Goals against">GA</TableHead>
                      <TableHead className="text-right text-xs" title="Goal difference">GD</TableHead>
                      <TableHead className="text-center text-xs" title="Points">PTS</TableHead>
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
                        <TableCell className="text-center text-xs font-bold text-slate-950">{standing.points}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </section>

            <section className="flex flex-1 flex-col gap-4">
              <SectionTitle
                icon={IconBallFootball}
                title="Top Scorers"
                description={`${overview?.currentStage?.name ?? "Apertura"} ${overview?.season?.name ?? ""}`}
              />
              {topScorers.length > 0 ? (
                <div className="flex-1 overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-slate-50">
                        <TableHead className="w-10 text-center text-xs">
                          #
                        </TableHead>
                        <TableHead className="text-xs">Player</TableHead>
                        <TableHead className="text-xs">Team</TableHead>
                        <TableHead className="text-center text-xs">Goals</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {topScorers.map((leader, index) => (
                        <TableRow key={`${leader.player.id}-${leader.value}`}>
                          <TableCell className="text-center text-xs font-medium text-slate-400">
                            {index + 1}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div className="h-7 w-7 shrink-0 overflow-hidden rounded-full bg-slate-100 ring-1 ring-slate-200">
                                {leader.player.imagePath ? (
                                  <img
                                    src={leader.player.imagePath}
                                    alt={getPlayerName(leader)}
                                    className="h-full w-full object-cover object-top"
                                  />
                                ) : (
                                  <div className="flex h-full w-full items-center justify-center text-[10px] font-bold text-slate-400">
                                    {getPlayerName(leader).slice(0, 2).toUpperCase()}
                                  </div>
                                )}
                              </div>
                              <span className="text-xs font-medium text-slate-950">
                                {getPlayerName(leader)}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1.5">
                              {leader.team?.imagePath ? (
                                <img
                                  src={leader.team.imagePath}
                                  alt={leader.team.name ?? ""}
                                  className="h-4 w-4 shrink-0 object-contain"
                                />
                              ) : null}
                              <span className="text-xs text-slate-500">
                                {leader.team?.name ?? "No team"}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="text-center text-xs font-bold text-slate-950">
                            {leader.value}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="flex h-36 items-center justify-center rounded-2xl border border-dashed border-slate-200 text-sm text-slate-400">
                  No scorers available yet
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
