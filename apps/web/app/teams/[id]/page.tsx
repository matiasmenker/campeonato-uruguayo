import { Suspense } from "react"
import Link from "next/link"
import { notFound } from "next/navigation"
import { IconArrowLeft, IconShieldFilled, IconUser } from "@tabler/icons-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import TeamSeasonSelector from "@/components/team-season-selector"
import { getTeam, getTeamFixtures, getTeamSquad, getTeamCoach, type SquadMember, type TeamFixture } from "@/lib/teams"
import { getSeasons } from "@/lib/seasons"
import { getStandings } from "@/lib/standings"
import { getPlayerRatingMap } from "@/lib/metrics"

export const dynamic = "force-dynamic"

const POSITION_ORDER = [24, 25, 26, 27]
const POSITION_LABELS: Record<number, string> = {
  24: "Goalkeepers",
  25: "Defenders",
  26: "Midfielders",
  27: "Forwards",
}
const POSITION_SHORT: Record<number, string> = {
  24: "GK",
  25: "DEF",
  26: "MID",
  27: "FWD",
}

const getRatingColor = (value: number): string => {
  if (value >= 8.0) return "bg-emerald-500"
  if (value >= 7.0) return "bg-sky-500"
  if (value >= 6.0) return "bg-orange-400"
  return "bg-red-400"
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatKickoff = (kickoffAt: string | null): string => {
  if (!kickoffAt) return "TBD"
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
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

// ─── Sub-components ───────────────────────────────────────────────────────────

const PlayerCard = ({ member, rating }: { member: SquadMember; rating: number | undefined }) => {
  const name = member.player.displayName ?? member.player.name
  const hasPhoto = !!member.player.imagePath && !member.player.imagePath.includes("placeholder")
  const positionId = member.positionId ?? 0

  return (
    <div className="relative flex flex-col items-center gap-2 overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
      {/* Rating badge */}
      {rating !== undefined && (
        <div className={`absolute right-3 top-3 rounded-lg px-1.5 py-0.5 ${getRatingColor(rating)}`}>
          <p className="text-[11px] font-black text-white tabular-nums">{rating.toFixed(1)}</p>
        </div>
      )}

      {/* Shirt number */}
      {member.shirtNumber !== null && (
        <div className="absolute left-3 top-3 flex h-5 w-5 items-center justify-center rounded-full bg-slate-950">
          <span className="text-[9px] font-bold text-white">{member.shirtNumber}</span>
        </div>
      )}

      {/* Player photo */}
      <div className="mt-2 h-16 w-16 overflow-hidden rounded-full bg-slate-100 ring-2 ring-slate-200">
        {hasPhoto ? (
          <img src={member.player.imagePath!} alt={name} className="h-full w-full object-cover object-top" />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <IconUser size={28} className="text-slate-300" />
          </div>
        )}
      </div>

      {/* Name and position */}
      <div className="flex flex-col items-center gap-0.5 text-center">
        <p className="line-clamp-2 text-xs font-semibold text-slate-950 leading-tight">{name}</p>
        <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-slate-500">
          {POSITION_SHORT[positionId] ?? "—"}
        </span>
        {member.isLoan && (
          <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-amber-600">
            Loan
          </span>
        )}
      </div>
    </div>
  )
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
      {/* Home team */}
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

      {/* Score / date */}
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
          </>
        ) : (
          <>
            <p className="text-base font-black text-slate-300">vs</p>
            <p className="text-[10px] font-medium text-slate-400">{formatKickoff(fixture.kickoffAt)}</p>
          </>
        )}
        <p className="text-[10px] text-slate-400">{fixture.stage?.name ?? "—"}</p>
      </div>

      {/* Away team */}
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

// ─── Page ─────────────────────────────────────────────────────────────────────

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

  const [squadResult, fixturesResult, standingsResult, coachResult, ratingMapResult] = await Promise.allSettled([
    getTeamSquad(teamId, selectedSeason.id),
    getTeamFixtures(teamId, selectedSeason.id, 15),
    getStandings({ seasonId: selectedSeason.id }),
    getTeamCoach(teamId, selectedSeason.id),
    getPlayerRatingMap(selectedSeason.id),
  ])

  const squad = squadResult.status === "fulfilled" ? squadResult.value : []
  const fixtures = fixturesResult.status === "fulfilled" ? fixturesResult.value : []
  const allStandings = standingsResult.status === "fulfilled" ? standingsResult.value : []
  const coach = coachResult.status === "fulfilled" ? coachResult.value : null
  const ratingMap = ratingMapResult.status === "fulfilled" ? ratingMapResult.value : new Map<number, number>()

  const teamStanding = allStandings.find((standing) => standing.team.id === teamId) ?? null

  // Home venue from first home fixture with an image
  const homeVenue = fixtures
    .filter((fixture) => fixture.homeTeam?.id === teamId && fixture.venue)
    .map((fixture) => fixture.venue)
    .find(Boolean) ?? null

  const squadByPosition = POSITION_ORDER.reduce<Record<number, SquadMember[]>>((groups, positionId) => {
    groups[positionId] = squad.filter((member) => member.positionId === positionId)
    return groups
  }, {})

  // Fixtures already sorted desc (most recent first) from the API
  const recentFixtures = fixtures.filter(
    (fixture) => fixture.homeScore !== null && fixture.awayScore !== null
  )
  const upcomingFixtures = fixtures
    .filter((fixture) => fixture.homeScore === null || fixture.awayScore === null)
    .reverse() // upcoming: earliest first
    .slice(0, 3)

  return (
    <main className="min-h-svh bg-[linear-gradient(180deg,#f8fafc_0%,#f8fafc_48%,#eef2f7_100%)]">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-6 py-8 sm:px-8 lg:px-10">

        <Link
          href={`/teams${selectedSeasonId ? `?seasonId=${selectedSeasonId}` : ""}`}
          className="flex w-fit items-center gap-1.5 text-sm font-medium text-slate-400 transition-colors hover:text-slate-700"
        >
          <IconArrowLeft size={15} />
          All teams
        </Link>

        {/* Hero card */}
        <div className="overflow-hidden rounded-2xl shadow-lg">
          <div
            className="relative min-h-52 bg-slate-900"
            style={
              homeVenue?.imagePath
                ? { backgroundImage: `url(${homeVenue.imagePath})`, backgroundSize: "cover", backgroundPosition: "center 40%" }
                : undefined
            }
          >
            {/* Gradient overlay — stronger at bottom for legibility */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/50 to-black/80" />

            {/* Season selector top-right */}
            {seasons.length > 1 && (
              <div className="absolute right-5 top-5">
                <Suspense>
                  <TeamSeasonSelector seasons={seasons} selectedSeasonId={selectedSeason.id} />
                </Suspense>
              </div>
            )}

            {/* Team info bottom */}
            <div className="absolute bottom-0 left-0 right-0 flex items-end gap-5 p-6">
              {/* Badge */}
              {team.imagePath && (
                <img
                  src={team.imagePath}
                  alt={team.name}
                  className="h-20 w-20 shrink-0 object-contain drop-shadow-xl"
                />
              )}
              <div className="min-w-0 flex flex-col gap-1.5 pb-1">
                <h1 className="text-3xl font-black text-white leading-none drop-shadow">{team.name}</h1>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-white/70">
                  {homeVenue?.name && (
                    <span>{homeVenue.name}{homeVenue.capacity ? ` · ${homeVenue.capacity.toLocaleString()} cap.` : ""}</span>
                  )}
                  {coach && (
                    <span>Coach: <span className="font-semibold text-white/90">{coach.name}</span></span>
                  )}
                </div>
                {teamStanding && (
                  <div className="mt-1 flex items-center gap-3">
                    <span className="text-sm font-bold text-white">
                      #{teamStanding.position}
                    </span>
                    <span className="text-white/60 text-sm">·</span>
                    <span className="text-sm text-white/80">
                      <span className="font-bold text-white">{teamStanding.points}</span> pts
                    </span>
                    <span className="text-white/60 text-sm">·</span>
                    <span className="text-sm text-white/80">
                      {teamStanding.won}W {teamStanding.draw}D {teamStanding.lost}L
                    </span>
                    <span className="text-white/60 text-sm">·</span>
                    <span className="text-sm text-white/80">{teamStanding.stage?.name}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_340px]">

          {/* Squad grid */}
          <div className="flex flex-col gap-4">
            <h2 className="px-1 text-sm font-bold text-slate-700">
              Squad · <span className="font-normal text-slate-400">{selectedSeason.name}</span>
            </h2>
            {squad.length === 0 ? (
              <div className="flex h-36 items-center justify-center rounded-2xl border border-dashed border-slate-200 text-sm text-slate-400">
                No squad data available for {selectedSeason.name}
              </div>
            ) : (
              <div className="flex flex-col gap-6">
                {POSITION_ORDER.map((positionId) => {
                  const members = squadByPosition[positionId]
                  if (!members || members.length === 0) return null
                  return (
                    <div key={positionId} className="flex flex-col gap-3">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 px-1">
                        {POSITION_LABELS[positionId]}
                      </p>
                      <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-3 xl:grid-cols-4">
                        {members.map((member) => (
                          <PlayerCard
                            key={member.id}
                            member={member}
                            rating={ratingMap.get(member.player.id)}
                          />
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Right column: fixtures */}
          <div className="flex flex-col gap-4">

            {recentFixtures.length > 0 && (
              <div className="flex flex-col gap-2">
                <h2 className="px-1 text-sm font-bold text-slate-700">Recent results</h2>
                <div className="flex flex-col gap-2">
                  {recentFixtures.map((fixture) => (
                    <FixtureCard key={fixture.id} fixture={fixture} teamId={teamId} />
                  ))}
                </div>
              </div>
            )}

            {upcomingFixtures.length > 0 && (
              <div className="flex flex-col gap-2">
                <h2 className="px-1 text-sm font-bold text-slate-700">Upcoming</h2>
                <div className="flex flex-col gap-2">
                  {upcomingFixtures.map((fixture) => (
                    <FixtureCard key={fixture.id} fixture={fixture} teamId={teamId} />
                  ))}
                </div>
              </div>
            )}

            {recentFixtures.length === 0 && upcomingFixtures.length === 0 && (
              <div className="flex h-36 items-center justify-center rounded-2xl border border-dashed border-slate-200 text-sm text-slate-400">
                No fixtures available for {selectedSeason.name}
              </div>
            )}

          </div>
        </div>

      </div>
    </main>
  )
}

export default TeamPage
