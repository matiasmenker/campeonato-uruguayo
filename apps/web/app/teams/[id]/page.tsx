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

const StatCell = ({ value, label }: { value: number | string; label: string }) => (
  <div className="flex flex-col items-center gap-0.5 py-4">
    <p className="text-xl font-black tabular-nums text-slate-950">{value}</p>
    <p className="text-[10px] font-medium uppercase tracking-wide text-slate-400">{label}</p>
  </div>
)

const SquadRow = ({ member, rating }: { member: SquadMember; rating: number | undefined }) => {
  const name = member.player.displayName ?? member.player.name
  return (
    <div className="flex items-center gap-4 px-5 py-3">
      <div className="relative shrink-0">
        <div className="h-10 w-10 overflow-hidden rounded-full bg-slate-100 ring-1 ring-slate-200">
          {member.player.imagePath && !member.player.imagePath.includes("placeholder") ? (
            <img src={member.player.imagePath} alt={name} className="h-full w-full object-cover object-top" />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <IconUser size={18} className="text-slate-300" />
            </div>
          )}
        </div>
        {member.shirtNumber !== null && (
          <span className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-slate-950 text-[9px] font-bold text-white ring-1 ring-white">
            {member.shirtNumber}
          </span>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-slate-950">{name}</p>
        <div className="flex items-center gap-1.5">
          <p className="text-[10px] text-slate-400">{POSITION_LABELS[member.positionId ?? 0] ?? "—"}</p>
          {member.isLoan && (
            <span className="rounded bg-amber-100 px-1 py-0.5 text-[9px] font-bold uppercase tracking-wide text-amber-600">
              Loan
            </span>
          )}
        </div>
      </div>
      {rating !== undefined && (
        <div className={`shrink-0 rounded-lg px-2 py-1 ${getRatingColor(rating)}`}>
          <p className="text-xs font-black text-white tabular-nums">{rating.toFixed(1)}</p>
        </div>
      )}
    </div>
  )
}

const FixtureCard = ({ fixture, teamId }: { fixture: TeamFixture; teamId: number }) => {
  const isHome = fixture.homeTeam?.id === teamId
  const opponent = isHome ? fixture.awayTeam : fixture.homeTeam
  const isFinished = fixture.homeScore !== null && fixture.awayScore !== null
  const result = getMatchResult(fixture, teamId)

  return (
    <Link
      href={`/matches/${fixture.id}`}
      className="flex items-center gap-3 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm transition-all duration-150 hover:border-slate-300 hover:shadow-md"
    >
      {/* Home / Away badge */}
      <span
        className={`shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
          isHome ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"
        }`}
      >
        {isHome ? "H" : "A"}
      </span>

      {/* Opponent badge */}
      {opponent?.imagePath ? (
        <img src={opponent.imagePath} alt={opponent?.name} className="h-8 w-8 shrink-0 object-contain" />
      ) : (
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100">
          <IconShieldFilled size={14} className="text-slate-300" />
        </div>
      )}

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-slate-950">{opponent?.name ?? "Unknown"}</p>
        <p className="text-[11px] text-slate-400">
          {fixture.stage?.name ?? "—"} · {formatKickoff(fixture.kickoffAt)}
        </p>
      </div>

      <div className="shrink-0 text-right">
        {isFinished ? (
          <>
            <p className="text-sm font-black tabular-nums text-slate-950">
              {fixture.homeScore}–{fixture.awayScore}
            </p>
            {result && (
              <span className={`inline-block rounded px-1.5 py-0.5 text-[10px] font-bold uppercase ${result.bg} ${result.text}`}>
                {result.label}
              </span>
            )}
          </>
        ) : (
          <p className="text-xs font-medium text-slate-400">Upcoming</p>
        )}
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
    getTeamFixtures(teamId, selectedSeason.id, 10),
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

  // Get home venue image from the first home fixture that has one
  const homeVenueImage = fixtures
    .filter((fixture) => fixture.homeTeam?.id === teamId && fixture.venue?.imagePath)
    .map((fixture) => fixture.venue?.imagePath)
    .find(Boolean) ?? null

  const squadByPosition = POSITION_ORDER.reduce<Record<number, SquadMember[]>>((groups, positionId) => {
    groups[positionId] = squad.filter((member) => member.positionId === positionId)
    return groups
  }, {})

  const recentFixtures = fixtures
    .filter((fixture) => fixture.homeScore !== null && fixture.awayScore !== null)
    .slice(0, 5)

  const upcomingFixtures = fixtures
    .filter((fixture) => fixture.homeScore === null || fixture.awayScore === null)
    .slice(0, 3)

  return (
    <main className="min-h-svh bg-[linear-gradient(180deg,#f8fafc_0%,#f8fafc_48%,#eef2f7_100%)]">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-6 py-8 sm:px-8 lg:px-10">

        <Link
          href="/teams"
          className="flex w-fit items-center gap-1.5 text-sm font-medium text-slate-400 transition-colors hover:text-slate-700"
        >
          <IconArrowLeft size={15} />
          All teams
        </Link>

        {/* Hero card with stadium background */}
        <div className="overflow-hidden rounded-2xl shadow-lg">
          {/* Stadium background */}
          <div
            className="relative min-h-48 bg-slate-900"
            style={
              homeVenueImage
                ? { backgroundImage: `url(${homeVenueImage})`, backgroundSize: "cover", backgroundPosition: "center" }
                : undefined
            }
          >
            {/* Dark gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/70 to-slate-900/30" />

            {/* Content */}
            <div className="relative flex flex-col justify-end gap-4 p-6 sm:flex-row sm:items-end sm:justify-between">
              <div className="flex items-end gap-5">
                {/* Team badge */}
                <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-sm p-3 ring-1 ring-white/20">
                  {team.imagePath ? (
                    <img src={team.imagePath} alt={team.name} className="h-full w-full object-contain drop-shadow-lg" />
                  ) : (
                    <IconShieldFilled size={40} className="text-white/40" />
                  )}
                </div>
                <div className="flex flex-col gap-1.5 pb-1">
                  <h1 className="text-3xl font-black text-white leading-none drop-shadow-sm">{team.name}</h1>
                  <div className="flex flex-wrap items-center gap-2">
                    {team.shortCode && (
                      <span className="rounded-md bg-white/15 px-2 py-0.5 text-xs font-bold uppercase tracking-widest text-white/80">
                        {team.shortCode}
                      </span>
                    )}
                    {coach && (
                      <span className="text-sm text-white/60">
                        Coach: <span className="font-semibold text-white/90">{coach.name}</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Season selector */}
              {seasons.length > 1 && (
                <Suspense>
                  <TeamSeasonSelector seasons={seasons} selectedSeasonId={selectedSeason.id} />
                </Suspense>
              )}
            </div>
          </div>

          {/* Stats strip */}
          {teamStanding ? (
            <div className="grid grid-cols-4 divide-x divide-slate-100 bg-white sm:grid-cols-8">
              <StatCell value={teamStanding.position} label="Pos" />
              <StatCell value={teamStanding.points} label="PTS" />
              <StatCell value={teamStanding.played} label="MP" />
              <StatCell value={teamStanding.won} label="W" />
              <StatCell value={teamStanding.draw} label="D" />
              <StatCell value={teamStanding.lost} label="L" />
              <StatCell value={teamStanding.goalsFor} label="GF" />
              <StatCell
                value={teamStanding.goalDifference > 0 ? `+${teamStanding.goalDifference}` : teamStanding.goalDifference}
                label="GD"
              />
            </div>
          ) : (
            <div className="flex items-center justify-center bg-white py-4 text-sm text-slate-400">
              No standings data for {selectedSeason.name}
            </div>
          )}
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_320px]">

          {/* Squad */}
          <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
            <div className="border-b border-slate-100 px-5 py-4">
              <h2 className="text-sm font-bold text-slate-700">
                Squad · <span className="font-normal text-slate-400">{selectedSeason.name}</span>
              </h2>
            </div>
            {squad.length === 0 ? (
              <div className="flex h-36 items-center justify-center text-sm text-slate-400">
                No squad data available for {selectedSeason.name}
              </div>
            ) : (
              <div className="divide-y divide-slate-50">
                {POSITION_ORDER.map((positionId) => {
                  const members = squadByPosition[positionId]
                  if (!members || members.length === 0) return null
                  return (
                    <div key={positionId}>
                      <div className="bg-slate-50 px-5 py-2">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                          {POSITION_LABELS[positionId]}
                        </p>
                      </div>
                      {members.map((member) => (
                        <SquadRow
                          key={member.id}
                          member={member}
                          rating={ratingMap.get(member.player.id)}
                        />
                      ))}
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Right column: results + upcoming */}
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
