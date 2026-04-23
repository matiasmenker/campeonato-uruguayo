import type { ComponentType } from "react"
import Link from "next/link"
import {
  IconBallFootball,
  IconPlayerPlay,
  IconStar,
  IconTrophy,
} from "@tabler/icons-react"
import MatchesCarousel from "@/components/matches-carousel"
import PlayerCard from "@/components/player-card"
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
import { resolvePlayerImageUrl } from "@/lib/player"

export const dynamic = "force-dynamic"

const getPlayerName = (leader: LeaderEntry) =>
  leader.player.displayName ?? leader.player.name

const PlayerLeaderCard = ({ leader }: { leader: LeaderEntry }) => (
  <PlayerCard
    name={leader.player.displayName ?? leader.player.name}
    imagePath={leader.player.imagePath}
    positionId={leader.player.positionId}
    teamImagePath={leader.team?.imagePath}
    rating={leader.value}
  />
)

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

const FIXTURE_VIDEO_MAP: Record<number, { videoId: string; title: string; thumbnailUrl: string; publishedAt: string }> = {}

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
  } catch {}

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
              <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm [&_td]:py-2.5 [&_th]:py-2">
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
                    {(overview?.standings ?? []).map((standing) => (
                      <TableRow key={standing.id}>
                        <TableCell className="text-center">
                          <span className="text-xs font-medium text-slate-400">
                            {standing.position}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Link
                            href={`/teams/${standing.team.id}${overview?.season?.id ? `?seasonId=${overview.season.id}` : ""}`}
                            className="flex items-center gap-2 hover:opacity-80"
                          >
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
                          </Link>
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
                <div className="flex flex-1 flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
                  <div className="grid grid-cols-[36px_1fr_1fr_48px] border-b border-slate-100 bg-slate-50 px-3 py-2">
                    <span className="text-center text-xs text-slate-400">#</span>
                    <span className="text-xs text-slate-400">Player</span>
                    <span className="text-xs text-slate-400">Team</span>
                    <span className="text-center text-xs text-slate-400">Goals</span>
                  </div>
                  {topScorers.map((leader, index) => (
                    <div
                      key={`${leader.player.id}-${leader.value}`}
                      className="grid flex-1 grid-cols-[36px_1fr_1fr_48px] items-center border-b border-slate-100 px-3 py-1.5 last:border-0"
                    >
                      <span className="text-center text-xs font-medium text-slate-400">{index + 1}</span>
                      <div className="flex items-center gap-2">
                        <div className="h-7 w-7 shrink-0 overflow-hidden rounded-full bg-slate-100 ring-1 ring-slate-200">
                          <img src={resolvePlayerImageUrl(leader.player.imagePath)} alt={getPlayerName(leader)} className="h-full w-full object-cover object-top" />
                        </div>
                        <span className="text-xs font-medium text-slate-950">{getPlayerName(leader)}</span>
                      </div>
                      {leader.team?.id ? (
                        <Link
                          href={`/teams/${leader.team.id}${overview?.season?.id ? `?seasonId=${overview.season.id}` : ""}`}
                          className="flex items-center gap-1.5 hover:opacity-80"
                        >
                          {leader.team.imagePath ? (
                            <img src={leader.team.imagePath} alt={leader.team.name ?? ""} className="h-4 w-4 shrink-0 object-contain" />
                          ) : null}
                          <span className="text-xs text-slate-500">{leader.team.name ?? "No team"}</span>
                        </Link>
                      ) : (
                        <span className="text-xs text-slate-500">No team</span>
                      )}
                      <span className="text-center text-xs font-bold text-slate-950">{leader.value}</span>
                    </div>
                  ))}
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
