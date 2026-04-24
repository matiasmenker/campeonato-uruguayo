import { Suspense } from "react"
import Link from "next/link"
import { notFound } from "next/navigation"
import { IconShieldFilled, IconTrophy } from "@tabler/icons-react"
import HeroBackLink from "@/components/hero-back-link"
import HeroTexture from "@/components/hero-texture"
import SearchParamsLoadingBoundary from "@/components/search-params-loading-boundary"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import TeamSeasonSelector from "@/components/team-season-selector"
import { getTeam, getTeamFixtures, getTeamSquad, getTeamCoaches, getTeamVenue, type SquadMember, type TeamCoach, type TeamFixture } from "@/lib/teams"
import { resolvePlayerImageUrl } from "@/lib/player"
import { getSeasons, getStages, getSeasonChampion, type Season } from "@/lib/seasons"
import { getStageGroup } from "@/lib/stage-groups"

export const revalidate = 300

const POSITION_ORDER = [24, 25, 26, 27]
const POSITION_LABELS: Record<number, string> = {
  24: "Goalkeepers",
  25: "Defenders",
  26: "Midfielders",
  27: "Forwards",
}

const CHAMPIONSHIP_FINALS_NAME = "championship - finals"
const INTERMEDIATE_ROUND_FINAL_NAME = "intermediate round - final"

const formatKickoff = (kickoffAt: string | null): string => {
  if (!kickoffAt) return "TBD"
  const date = new Date(kickoffAt)
  const weekday = new Intl.DateTimeFormat("en-GB", { weekday: "long", timeZone: "America/Montevideo" }).format(date)
  const dayMonthYear = new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: "America/Montevideo" }).format(date)
  return `${weekday.charAt(0).toUpperCase()}${weekday.slice(1)} ${dayMonthYear}`
}

const formatKickoffTime = (kickoffAt: string | null): string => {
  if (!kickoffAt) return "--:--"
  return new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "America/Montevideo",
  }).format(new Date(kickoffAt))
}

const getMatchResult = (
  fixture: TeamFixture,
  teamId: number
): { label: string; bg: string; text: string } | null => {
  if (fixture.homeScore === null || fixture.awayScore === null) return null
  const isHome = fixture.homeTeam?.id === teamId
  const teamScore = isHome ? fixture.homeScore : fixture.awayScore
  const opponentScore = isHome ? fixture.awayScore : fixture.homeScore
  if (teamScore > opponentScore) return { label: "W", bg: "bg-emerald-100", text: "text-emerald-700" }
  if (teamScore < opponentScore) return { label: "L", bg: "bg-red-100", text: "text-red-600" }
  return { label: "D", bg: "bg-slate-100", text: "text-slate-600" }
}

const FixtureCard = ({ fixture, teamId }: { fixture: TeamFixture; teamId: number }) => {
  const isFinished = fixture.homeScore !== null && fixture.awayScore !== null
  const result = getMatchResult(fixture, teamId)
  const homeTeam = fixture.homeTeam
  const awayTeam = fixture.awayTeam

  return (
    <Link
      href={`/matches/${fixture.id}`}
      className="flex items-center gap-4 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm transition-all duration-150 hover:border-slate-300 hover:shadow-md"
    >
      <div className="flex min-w-0 flex-1 flex-col items-center gap-1.5">
        {homeTeam?.imagePath ? (
          <img src={homeTeam.imagePath} alt={homeTeam.name} className="h-10 w-10 object-contain" />
        ) : (
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100">
            <IconShieldFilled size={16} className="text-slate-300" />
          </div>
        )}
        <p className="w-full text-center text-[11px] font-semibold text-slate-800 leading-tight line-clamp-2">
          {homeTeam?.name ?? "—"}
        </p>
      </div>

      <div className="shrink-0 flex flex-col items-center gap-1">
        {isFinished ? (
          <>
            <p className="text-lg font-black tabular-nums text-slate-950">
              {fixture.homeScore} – {fixture.awayScore}
            </p>
            {result && (
              <span className={`rounded px-1.5 py-0.5 text-[10px] font-bold uppercase ${result.bg} ${result.text}`}>
                {result.label}
              </span>
            )}
            <p className="text-[10px] font-medium text-slate-400">{formatKickoff(fixture.kickoffAt)}</p>
          </>
        ) : (
          <>
            <p className="text-xl font-black tabular-nums text-slate-800">{formatKickoffTime(fixture.kickoffAt)}</p>
            <p className="text-[10px] font-medium text-slate-400">{formatKickoff(fixture.kickoffAt)}</p>
          </>
        )}
        <p className="text-[10px] text-slate-400">{fixture.stage?.name ?? "—"}</p>
      </div>

      <div className="flex min-w-0 flex-1 flex-col items-center gap-1.5">
        {awayTeam?.imagePath ? (
          <img src={awayTeam.imagePath} alt={awayTeam.name} className="h-10 w-10 object-contain" />
        ) : (
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100">
            <IconShieldFilled size={16} className="text-slate-300" />
          </div>
        )}
        <p className="w-full text-center text-[11px] font-semibold text-slate-800 leading-tight line-clamp-2">
          {awayTeam?.name ?? "—"}
        </p>
      </div>
    </Link>
  )
}

const ChampionBadge = async ({
  teamId,
  seasonId,
  isCurrent,
  seasonName,
}: {
  teamId: number
  seasonId: number
  isCurrent: boolean
  seasonName: string
}) => {
  if (isCurrent) return null

  const stages = await getStages(seasonId).catch(() => [])
  const championshipFinalsStage = stages.find((stage) =>
    stage.name.toLowerCase() === CHAMPIONSHIP_FINALS_NAME
  ) ?? null
  const intermediateRoundFinalStage = stages.find((stage) =>
    stage.name.toLowerCase() === INTERMEDIATE_ROUND_FINAL_NAME
  ) ?? null

  let champion = null
  if (championshipFinalsStage) {
    champion = await getSeasonChampion(championshipFinalsStage.id).catch(() => null)
  }
  if (!champion && intermediateRoundFinalStage) {
    champion = await getSeasonChampion(intermediateRoundFinalStage.id).catch(() => null)
  }

  if (champion?.team?.id !== teamId) return null

  return (
    <div className="absolute right-5 top-5 flex items-center gap-2.5 rounded-full border border-amber-400/40 bg-gradient-to-r from-amber-500/25 via-amber-400/15 to-amber-500/25 px-4 py-1.5 shadow-lg shadow-amber-900/20 backdrop-blur-sm">
      <IconTrophy size={14} className="shrink-0 text-amber-300 drop-shadow" />
      <div className="flex flex-col leading-none">
        <span className="text-[11px] font-black uppercase tracking-wide text-amber-200">Champion</span>
        <span className="text-[10px] text-amber-300/70">{seasonName}</span>
      </div>
    </div>
  )
}

const TeamHeroDetails = ({ venue }: { venue: { name: string } | null }) => {
  if (!venue) return null
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs text-white/50">{venue.name}</span>
    </div>
  )
}

const ContentSkeleton = () => (
  <div className="grid gap-x-6 gap-y-3 lg:grid-cols-[1fr_340px]">
    <div className="flex items-center gap-2 px-1">
      <div className="h-4 w-12 animate-pulse rounded bg-slate-200" />
      <div className="h-4 w-16 animate-pulse rounded bg-slate-100" />
    </div>
    <div className="px-1">
      <div className="h-4 w-24 animate-pulse rounded bg-slate-200" />
    </div>

    <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
      <div className="grid grid-cols-[28px_36px_1fr_56px_80px_44px] items-center border-b border-slate-100 px-4 py-2.5">
        {[4, 4, 12, 8, 14, 10].map((width, index) => (
          <div key={index} className={`h-3 w-${width} animate-pulse rounded bg-slate-100 ${index === 5 ? "ml-auto" : ""}`} />
        ))}
      </div>
      {[4, 5, 5, 4].map((rowCount, groupIndex) => (
        <div key={groupIndex}>
          <div className="border-b border-slate-100 bg-slate-50/60 px-4 py-1.5">
            <div className="h-2.5 w-20 animate-pulse rounded bg-slate-200" />
          </div>
          {Array.from({ length: rowCount }).map((_, rowIndex) => (
            <div
              key={rowIndex}
              className={`grid grid-cols-[28px_36px_1fr_56px_80px_44px] items-center px-4 py-2 ${rowIndex < rowCount - 1 ? "border-b border-slate-100" : ""}`}
            >
              <div className="h-3 w-4 animate-pulse rounded bg-slate-100" />
              <div className="h-7 w-7 animate-pulse rounded-full bg-slate-100" />
              <div className="h-4 w-32 animate-pulse rounded bg-slate-100" />
              <div className="mx-auto h-[14px] w-[22px] animate-pulse rounded-[2px] bg-slate-100" />
              <div className="mx-auto h-3 w-14 animate-pulse rounded bg-slate-100" />
              <div className="ml-auto h-3 w-10 animate-pulse rounded bg-slate-100" />
            </div>
          ))}
        </div>
      ))}
    </div>

    <div className="flex flex-col gap-2">
      {Array.from({ length: 5 }).map((_, index) => (
        <div
          key={index}
          className="flex items-center gap-4 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm"
        >
          <div className="flex flex-1 flex-col items-center gap-1.5">
            <div className="h-10 w-10 animate-pulse rounded-full bg-slate-100" />
            <div className="h-3 w-16 animate-pulse rounded bg-slate-100" />
          </div>
          <div className="flex shrink-0 flex-col items-center gap-1">
            <div className="h-6 w-14 animate-pulse rounded bg-slate-100" />
            <div className="h-3 w-20 animate-pulse rounded bg-slate-50" />
          </div>
          <div className="flex flex-1 flex-col items-center gap-1.5">
            <div className="h-10 w-10 animate-pulse rounded-full bg-slate-100" />
            <div className="h-3 w-16 animate-pulse rounded bg-slate-100" />
          </div>
        </div>
      ))}
    </div>
  </div>
)

const TeamContent = async ({
  teamId,
  selectedSeason,
}: {
  teamId: number
  selectedSeason: Season
}) => {
  const [squadResult, fixturesResult, coachesResult] = await Promise.allSettled([
    getTeamSquad(teamId, selectedSeason.id),
    getTeamFixtures(teamId, selectedSeason.id, 30),
    getTeamCoaches(teamId, selectedSeason.id),
  ])

  const squad = squadResult.status === "fulfilled" ? squadResult.value : []
  const coaches = coachesResult.status === "fulfilled" ? coachesResult.value : []
  const rawFixtures = fixturesResult.status === "fulfilled" ? fixturesResult.value : []
  const allFixtures = rawFixtures.filter((fixture) => fixture.stage && getStageGroup(fixture.stage.name) !== null)

  const recentFixtures = allFixtures
    .filter((fixture) => fixture.homeScore !== null && fixture.awayScore !== null)
    .slice(0, 5)

  const nextFixture = allFixtures
    .filter((fixture) => fixture.homeScore === null || fixture.awayScore === null)
    .at(-1) ?? null

  const squadByPosition = POSITION_ORDER.reduce<Record<number, SquadMember[]>>((groups, positionId) => {
    groups[positionId] = squad.filter((member) => member.positionId === positionId)
    return groups
  }, {})

  return (
    <div className="grid gap-x-6 gap-y-3 lg:grid-cols-[1fr_340px]">

      <div className="flex items-center gap-2 px-1">
        <h2 className="text-sm font-bold text-slate-700">Squad</h2>
        <span className="text-sm font-normal text-slate-400">· {selectedSeason.name}</span>
      </div>

      <h2 className="px-1 text-sm font-bold text-slate-700">
        {nextFixture ? "Next match" : recentFixtures.length > 0 ? "Last 5 results" : "Matches"}
      </h2>

      <div className="flex flex-col gap-0 overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
        {squad.length > 0 && (
          <div className="grid grid-cols-[28px_36px_1fr_56px_80px_44px] items-center border-b border-slate-100 px-4 py-2.5">
            <span className="text-xs text-slate-400">#</span>
            <span />
            <span className="text-xs font-semibold text-slate-500">Player</span>
            <span className="text-center text-xs font-semibold text-slate-500">Nat.</span>
            <span className="text-center text-xs font-semibold text-slate-500">Height</span>
            <span className="text-right text-xs font-semibold text-slate-500">Age</span>
          </div>
        )}
        {coaches.length > 0 && (
          <div>
            <div className="border-b border-slate-100 bg-slate-50/60 px-4 py-1.5">
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                {coaches.length > 1 ? "Coaches" : "Coach"}
              </p>
            </div>
            {coaches.map((coach, index) => {
              const isLast = index === coaches.length - 1
              return (
                <div
                  key={coach.id}
                  className={`grid grid-cols-[28px_36px_1fr_auto] items-center gap-3 px-4 py-2 ${!isLast ? "border-b border-slate-100" : ""}`}
                >
                  <span className="text-xs font-medium text-slate-300">—</span>
                  <div className="h-7 w-7 shrink-0 overflow-hidden rounded-full bg-slate-100 ring-1 ring-slate-200">
                    <img
                      src={resolvePlayerImageUrl(coach.imagePath)}
                      alt={coach.name}
                      className="h-full w-full object-cover object-top"
                    />
                  </div>
                  <span className="truncate text-sm font-medium text-slate-900">{coach.name}</span>
                  {coach.isCurrent ? (
                    <span className="shrink-0 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-700">
                      Current
                    </span>
                  ) : (
                    <span className="shrink-0 rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                      {selectedSeason.name}
                    </span>
                  )}
                </div>
              )
            })}
          </div>
        )}
        {squad.length === 0 && coaches.length === 0 ? (
          <div className="flex h-36 items-center justify-center text-sm text-slate-400">
            No squad data available for {selectedSeason.name}
          </div>
        ) : squad.length === 0 ? null : (
          POSITION_ORDER.map((positionId) => {
            const members = squadByPosition[positionId]
            if (!members || members.length === 0) return null
            return (
              <div key={positionId}>
                <div className="border-b border-slate-100 bg-slate-50/60 px-4 py-1.5">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                    {POSITION_LABELS[positionId]}
                  </p>
                </div>
                {members.map((member, index) => {
                  const displayName = member.player.displayName ?? member.player.name
                  const isLast = index === members.length - 1
                  const dob = member.player.dateOfBirth ? new Date(member.player.dateOfBirth) : null
                  const age = dob
                    ? Math.floor((Date.now() - dob.getTime()) / (365.25 * 24 * 60 * 60 * 1000))
                    : null
                  return (
                    <div
                      key={member.id}
                      className={`grid grid-cols-[28px_36px_1fr_56px_80px_44px] items-center px-4 py-2 ${!isLast ? "border-b border-slate-100" : ""}`}
                    >
                      <span className="text-xs font-medium text-slate-300">
                        {member.shirtNumber ?? "—"}
                      </span>
                      <div className="h-7 w-7 shrink-0 overflow-hidden rounded-full bg-slate-100 ring-1 ring-slate-200">
                        <img
                          src={resolvePlayerImageUrl(member.player.imagePath)}
                          alt={displayName}
                          className="h-full w-full object-cover object-top"
                        />
                      </div>
                      <Link
                        href={`/players/${member.player.id}`}
                        className="min-w-0 truncate pr-3 text-sm font-medium text-slate-900 hover:text-slate-600 transition-colors"
                      >
                        {displayName}
                      </Link>
                      <div className="flex justify-center">
                        {member.player.nationality?.imageUrl ? (
                          <img
                            src={member.player.nationality.imageUrl}
                            alt={member.player.nationality.name}
                            className="h-[14px] w-[22px] rounded-[2px] object-cover ring-1 ring-black/10"
                            title={member.player.nationality.name}
                          />
                        ) : (
                          <span className="text-xs text-slate-300">—</span>
                        )}
                      </div>
                      <span className="text-center text-xs text-slate-500">
                        {member.player.height ? `${member.player.height} cm` : "—"}
                      </span>
                      <span className="text-right text-xs text-slate-500">
                        {age != null ? `${age} yrs` : "—"}
                      </span>
                    </div>
                  )
                })}
              </div>
            )
          })
        )}
      </div>

      <div className="flex flex-col gap-2">
        {recentFixtures.length === 0 && !nextFixture ? (
          <div className="flex h-36 items-center justify-center rounded-2xl border border-dashed border-slate-200 text-sm text-slate-400">
            No fixtures available for {selectedSeason.name}
          </div>
        ) : (
          <>
            {nextFixture && (
              <div className="flex flex-col gap-2">
                <FixtureCard fixture={nextFixture} teamId={teamId} />
                {recentFixtures.length > 0 && (
                  <h2 className="px-1 pt-2 text-sm font-bold text-slate-700">Last 5 results</h2>
                )}
              </div>
            )}
            {recentFixtures.length > 0 && (
              <div className="flex flex-col gap-2">
                {recentFixtures.map((fixture) => (
                  <FixtureCard key={fixture.id} fixture={fixture} teamId={teamId} />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

interface TeamPageProps {
  params: Promise<{ id: string }>
  searchParams: Promise<{ seasonId?: string }>
}

const TeamPage = async ({ params, searchParams }: TeamPageProps) => {
  const [{ id }, { seasonId: seasonIdParam }] = await Promise.all([params, searchParams])
  const teamId = Number(id)

  if (isNaN(teamId)) notFound()

  const [teamResult, seasonsResult] = await Promise.allSettled([
    getTeam(teamId),
    getSeasons(),
  ])

  if (teamResult.status === "rejected") notFound()

  const team = teamResult.value
  const seasons = seasonsResult.status === "fulfilled" ? seasonsResult.value : []
  const currentSeason = seasons.find((season) => season.isCurrent) ?? seasons[0]
  const selectedSeasonId = seasonIdParam ? Number(seasonIdParam) : (currentSeason?.id ?? null)
  const selectedSeason = seasons.find((season) => season.id === selectedSeasonId) ?? currentSeason

  if (!selectedSeason) {
    return (
      <main className="min-h-svh bg-slate-50">
        <div className="mx-auto w-full max-w-7xl px-6 py-8">
          <Alert className="border-amber-300 bg-amber-50 text-amber-950">
            <AlertTitle>No season data</AlertTitle>
            <AlertDescription>Season information is not available.</AlertDescription>
          </Alert>
        </div>
      </main>
    )
  }

  const venueResult = await Promise.allSettled([getTeamVenue(teamId, selectedSeason.id)])
  const venue = venueResult[0].status === "fulfilled" ? venueResult[0].value : null

  return (
    <main className="min-h-svh bg-[linear-gradient(180deg,#f8fafc_0%,#f8fafc_48%,#eef2f7_100%)]">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-6 py-8 sm:px-8 lg:px-10">

        <div className="overflow-hidden rounded-2xl shadow-lg">
          <div className="relative min-h-52 bg-slate-900">
            <HeroTexture />
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/5 to-black/40 pointer-events-none" />

            <div className="absolute left-5 top-5">
              <HeroBackLink label="Back" href="/teams" />
            </div>

            <Suspense fallback={null}>
              <ChampionBadge
                teamId={teamId}
                seasonId={selectedSeason.id}
                isCurrent={selectedSeason.isCurrent}
                seasonName={selectedSeason.name}
              />
            </Suspense>

            <div className="absolute bottom-0 left-0 right-0 flex items-end justify-between gap-5 p-6">
              <div className="flex items-end gap-5 min-w-0">
                {team.imagePath && (
                  <img
                    src={team.imagePath}
                    alt={team.name}
                    className="h-20 w-20 shrink-0 object-contain drop-shadow-xl"
                  />
                )}
                <div className="min-w-0 flex flex-col gap-1 pb-1">
                  <h1 className="text-3xl font-black text-white leading-none drop-shadow">{team.name}</h1>
                  <TeamHeroDetails venue={venue} />
                </div>
              </div>
              {seasons.length > 1 && (
                <Suspense>
                  <TeamSeasonSelector seasons={seasons} selectedSeasonId={selectedSeason.id} />
                </Suspense>
              )}
            </div>
          </div>
        </div>

        <Suspense fallback={<ContentSkeleton />}>
          <SearchParamsLoadingBoundary
            committedParams={{ seasonId: String(selectedSeason.id) }}
            skeleton={<ContentSkeleton />}
          >
            <TeamContent teamId={teamId} selectedSeason={selectedSeason} />
          </SearchParamsLoadingBoundary>
        </Suspense>

      </div>
    </main>
  )
}

export default TeamPage
