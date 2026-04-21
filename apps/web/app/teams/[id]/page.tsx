import Link from "next/link"
import { notFound } from "next/navigation"
import { IconArrowLeft, IconShieldFilled, IconUser } from "@tabler/icons-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { getTeam, getTeamFixtures, getTeamSquad, getTeamCoach, type SquadMember, type TeamFixture } from "@/lib/teams"
import { getSeasons } from "@/lib/seasons"
import { getStandings, type StandingEntry } from "@/lib/standings"

export const dynamic = "force-dynamic"

// SportMonks position IDs for Uruguayan league
const POSITION_ORDER = [24, 25, 26, 27]
const POSITION_LABELS: Record<number, string> = {
  24: "Goalkeepers",
  25: "Defenders",
  26: "Midfielders",
  27: "Forwards",
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatKickoff = (kickoffAt: string | null): string => {
  if (!kickoffAt) return "TBD"
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "America/Montevideo",
  }).format(new Date(kickoffAt))
}

const getResultStyle = (
  fixture: TeamFixture,
  teamId: number
): { label: string; className: string } => {
  const isHome = fixture.homeTeam?.id === teamId
  const teamScore = isHome ? fixture.homeScore : fixture.awayScore
  const opponentScore = isHome ? fixture.awayScore : fixture.homeScore

  if (teamScore === null || opponentScore === null) return { label: "–", className: "bg-slate-100 text-slate-500" }
  if (teamScore > opponentScore) return { label: "W", className: "bg-emerald-100 text-emerald-700" }
  if (teamScore < opponentScore) return { label: "L", className: "bg-red-100 text-red-600" }
  return { label: "D", className: "bg-slate-100 text-slate-600" }
}

// ─── Sub-components ───────────────────────────────────────────────────────────

const StatCell = ({ value, label }: { value: number | string; label: string }) => (
  <div className="flex flex-col items-center gap-0.5 py-4">
    <p className="text-xl font-black tabular-nums text-slate-950">{value}</p>
    <p className="text-[10px] font-medium uppercase tracking-wide text-slate-400">{label}</p>
  </div>
)

const SquadRow = ({ member }: { member: SquadMember }) => {
  const name = member.player.displayName ?? member.player.name
  return (
    <div className="flex items-center gap-4 px-5 py-3">
      <div className="relative shrink-0">
        <div className="h-10 w-10 overflow-hidden rounded-full bg-slate-100 ring-1 ring-slate-200">
          {member.player.imagePath ? (
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
        {member.isLoan && (
          <p className="text-[10px] font-medium uppercase tracking-wide text-amber-500">On loan</p>
        )}
      </div>
    </div>
  )
}

const FixtureCard = ({ fixture, teamId }: { fixture: TeamFixture; teamId: number }) => {
  const isHome = fixture.homeTeam?.id === teamId
  const opponent = isHome ? fixture.awayTeam : fixture.homeTeam
  const isFinished = fixture.homeScore !== null && fixture.awayScore !== null
  const result = getResultStyle(fixture, teamId)

  return (
    <Link
      href={`/matches/${fixture.id}`}
      className="flex items-center gap-4 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm transition-all duration-150 hover:border-slate-300 hover:shadow-md"
    >
      {opponent?.imagePath ? (
        <img src={opponent.imagePath} alt={opponent.name} className="h-10 w-10 shrink-0 object-contain" />
      ) : (
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100">
          <IconShieldFilled size={18} className="text-slate-300" />
        </div>
      )}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-slate-950">
          {isHome ? "vs" : "@"} {opponent?.name ?? "Unknown"}
        </p>
        <p className="text-xs text-slate-400">
          {fixture.stage?.name ?? "—"} · {formatKickoff(fixture.kickoffAt)}
        </p>
      </div>
      <div className="shrink-0 text-right">
        {isFinished ? (
          <>
            <p className="text-sm font-black tabular-nums text-slate-950">
              {fixture.homeScore}–{fixture.awayScore}
            </p>
            <span className={`inline-block rounded px-1.5 py-0.5 text-[10px] font-bold uppercase ${result.className}`}>
              {result.label}
            </span>
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
}

const TeamPage = async ({ params }: TeamPageProps) => {
  const { id } = await params
  const teamId = Number(id)

  if (isNaN(teamId)) notFound()

  // Fetch team and seasons first
  const [teamResult, seasonsResult] = await Promise.allSettled([
    getTeam(teamId),
    getSeasons(),
  ])

  if (teamResult.status === "rejected") notFound()

  const team = teamResult.value
  const seasons = seasonsResult.status === "fulfilled" ? seasonsResult.value : []
  const currentSeason = seasons.find((season) => season.isCurrent) ?? seasons[0]

  if (!currentSeason) {
    return (
      <main className="min-h-svh bg-[linear-gradient(180deg,#f8fafc_0%,#f8fafc_48%,#eef2f7_100%)]">
        <div className="mx-auto w-full max-w-7xl px-6 py-8 sm:px-8 lg:px-10">
          <Alert className="border-amber-300 bg-amber-50 text-amber-950">
            <AlertTitle>No season data</AlertTitle>
            <AlertDescription>Season information is not available.</AlertDescription>
          </Alert>
        </div>
      </main>
    )
  }

  // Fetch squad, fixtures, standings and coach in parallel
  const [squadResult, fixturesResult, standingsResult, coachResult] = await Promise.allSettled([
    getTeamSquad(teamId, currentSeason.id),
    getTeamFixtures(teamId, currentSeason.id, 8),
    getStandings({ seasonId: currentSeason.id }),
    getTeamCoach(teamId, currentSeason.id),
  ])

  const squad = squadResult.status === "fulfilled" ? squadResult.value : []
  const fixtures = fixturesResult.status === "fulfilled" ? fixturesResult.value : []
  const allStandings = standingsResult.status === "fulfilled" ? standingsResult.value : []
  const coach = coachResult.status === "fulfilled" ? coachResult.value : null

  // Find this team's standing in the current stage
  const teamStanding = allStandings.find((standing) => standing.team.id === teamId) ?? null

  // Group squad by position
  const squadByPosition = POSITION_ORDER.reduce<Record<number, SquadMember[]>>((groups, positionId) => {
    groups[positionId] = squad.filter((member) => member.positionId === positionId)
    return groups
  }, {})

  // Split fixtures into recent (finished) and upcoming
  const recentFixtures = fixtures
    .filter((fixture) => fixture.homeScore !== null && fixture.awayScore !== null)
    .slice(0, 5)
  const upcomingFixtures = fixtures
    .filter((fixture) => fixture.homeScore === null || fixture.awayScore === null)
    .slice(0, 3)

  return (
    <main className="min-h-svh bg-[linear-gradient(180deg,#f8fafc_0%,#f8fafc_48%,#eef2f7_100%)]">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-6 py-8 sm:px-8 lg:px-10">

        {/* Back link */}
        <Link
          href="/teams"
          className="flex w-fit items-center gap-1.5 text-sm font-medium text-slate-400 transition-colors hover:text-slate-700"
        >
          <IconArrowLeft size={15} />
          All teams
        </Link>

        {/* Team header card */}
        <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
          <div className="flex flex-wrap items-center gap-6 p-6">
            {team.imagePath ? (
              <img src={team.imagePath} alt={team.name} className="h-20 w-20 shrink-0 object-contain drop-shadow-sm" />
            ) : (
              <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-slate-100">
                <IconShieldFilled size={36} className="text-slate-300" />
              </div>
            )}
            <div className="flex flex-col gap-1">
              <h1 className="text-2xl font-black text-slate-950">{team.name}</h1>
              <div className="flex items-center gap-2">
                {team.shortCode && (
                  <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-bold uppercase tracking-wide text-slate-500">
                    {team.shortCode}
                  </span>
                )}
                <span className="text-sm text-slate-400">{currentSeason.name} season</span>
              </div>
              {coach && (
                <p className="text-sm text-slate-500">
                  Coach: <span className="font-medium text-slate-700">{coach.name}</span>
                </p>
              )}
            </div>
          </div>

          {/* Stats strip */}
          {teamStanding && (
            <div className="grid grid-cols-4 divide-x divide-slate-100 border-t border-slate-100 sm:grid-cols-8">
              <StatCell value={teamStanding.position} label="Pos" />
              <StatCell value={teamStanding.points} label="PTS" />
              <StatCell value={teamStanding.played} label="MP" />
              <StatCell value={teamStanding.won} label="W" />
              <StatCell value={teamStanding.draw} label="D" />
              <StatCell value={teamStanding.lost} label="L" />
              <StatCell value={teamStanding.goalsFor} label="GF" />
              <StatCell value={teamStanding.goalDifference > 0 ? `+${teamStanding.goalDifference}` : teamStanding.goalDifference} label="GD" />
            </div>
          )}
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_320px]">

          {/* Squad */}
          <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
            <div className="border-b border-slate-100 px-5 py-4">
              <h2 className="text-sm font-bold text-slate-700">Squad</h2>
            </div>
            {squad.length === 0 ? (
              <div className="flex h-36 items-center justify-center text-sm text-slate-400">
                No squad data available
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
                        <SquadRow key={member.id} member={member} />
                      ))}
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Right column: recent results + upcoming */}
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
                No fixtures available
              </div>
            )}

          </div>
        </div>

      </div>
    </main>
  )
}

export default TeamPage
