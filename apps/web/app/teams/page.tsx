import { Suspense } from "react"
import Link from "next/link"
import { IconShieldFilled } from "@tabler/icons-react"
import { getTeams, type Team } from "@/lib/teams"
import { getSeasons } from "@/lib/seasons"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import TeamsSeasonSelector from "@/components/teams-season-selector"

export const dynamic = "force-dynamic"

// Hero background — brand blues (primary hue ~250)
const HeroBackground = () => (
  <svg className="absolute inset-0 h-full w-full" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice">
    <defs>
      <linearGradient id="teamsBase" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%"   stopColor="#0d1535" />
        <stop offset="35%"  stopColor="#162860" />
        <stop offset="70%"  stopColor="#1e3d90" />
        <stop offset="100%" stopColor="#162e78" />
      </linearGradient>
      <radialGradient id="teamsGA" cx="78%" cy="18%" r="52%">
        <stop offset="0%" stopColor="#60a5fa" stopOpacity="0.35" />
        <stop offset="100%" stopColor="#60a5fa" stopOpacity="0" />
      </radialGradient>
      <radialGradient id="teamsGB" cx="18%" cy="75%" r="55%">
        <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.28" />
        <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
      </radialGradient>
      <radialGradient id="teamsGC" cx="50%" cy="45%" r="45%">
        <stop offset="0%" stopColor="#2563eb" stopOpacity="0.16" />
        <stop offset="100%" stopColor="#2563eb" stopOpacity="0" />
      </radialGradient>
      <pattern id="teamsDots" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
        <circle cx="10" cy="10" r="1" fill="rgba(147,197,253,0.15)" />
      </pattern>
    </defs>
    <rect width="100%" height="100%" fill="url(#teamsBase)" />
    <rect width="100%" height="100%" fill="url(#teamsGA)" />
    <rect width="100%" height="100%" fill="url(#teamsGB)" />
    <rect width="100%" height="100%" fill="url(#teamsGC)" />
    <rect width="100%" height="100%" fill="url(#teamsDots)" />
    <circle cx="-5%" cy="108%" r="62%" fill="none" stroke="rgba(96,165,250,0.1)" strokeWidth="1.5" />
    <circle cx="-5%" cy="108%" r="46%" fill="none" stroke="rgba(96,165,250,0.07)" strokeWidth="1" />
    <circle cx="106%" cy="-6%" r="46%" fill="none" stroke="rgba(147,197,253,0.08)" strokeWidth="1" />
  </svg>
)

interface TeamsPageProps {
  searchParams: Promise<{ seasonId?: string }>
}

const TeamsPage = async ({ searchParams }: TeamsPageProps) => {
  const { seasonId: seasonIdParam } = await searchParams

  let teams: Team[] = []
  let errorMessage: string | null = null

  const seasonsResult = await Promise.allSettled([getSeasons()])
  const seasons = seasonsResult[0].status === "fulfilled" ? seasonsResult[0].value : []
  const currentSeason = seasons.find((season) => season.isCurrent) ?? seasons[0]
  const selectedSeasonId = seasonIdParam ? Number(seasonIdParam) : (currentSeason?.id ?? null)
  const selectedSeason = seasons.find((season) => season.id === selectedSeasonId) ?? currentSeason

  const [teamsResult] = await Promise.allSettled([
    getTeams(selectedSeasonId ?? undefined),
  ])

  if (teamsResult.status === "fulfilled") teams = teamsResult.value
  else errorMessage = "Could not load teams."

  return (
    <main className="min-h-svh bg-[linear-gradient(180deg,#f8fafc_0%,#f8fafc_48%,#eef2f7_100%)]">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-6 py-8 sm:px-8 lg:px-10">

        <div className="overflow-hidden rounded-2xl shadow-lg">
          <div className="relative min-h-52 bg-slate-900">
            <HeroBackground />
            <div className="absolute inset-0 bg-gradient-to-b from-black/5 via-black/15 to-black/60" />

            <div className="absolute bottom-0 left-0 right-0 p-6">
              {/* Title */}
              <div className="mb-4 flex items-center gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-sm ring-1 ring-white/20">
                  <IconShieldFilled size={28} className="text-white/80" />
                </div>
                <div className="flex flex-col gap-0.5">
                  <h1 className="text-3xl font-black text-white leading-none drop-shadow">Teams</h1>
                  <p className="text-sm text-white/65">
                    Uruguayan Primera División
                    {selectedSeason && <span className="font-semibold text-white/85"> · {selectedSeason.name}</span>}
                  </p>
                </div>
              </div>

              {/* Season selector */}
              {seasons.length > 1 && (
                <div className="flex items-center gap-2">
                  <Suspense>
                    <TeamsSeasonSelector seasons={seasons} selectedSeasonId={selectedSeason?.id ?? 0} />
                  </Suspense>
                </div>
              )}
            </div>
          </div>
        </div>

        {errorMessage ? (
          <Alert className="border-amber-300 bg-amber-50 text-amber-950">
            <AlertTitle>Could not load teams</AlertTitle>
            <AlertDescription>{errorMessage}</AlertDescription>
          </Alert>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {teams.map((team) => (
              <Link
                key={team.id}
                href={`/teams/${team.id}${selectedSeasonId ? `?seasonId=${selectedSeasonId}` : ""}`}
                className="group flex flex-col items-center gap-3 overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition-all duration-150 hover:border-slate-300 hover:shadow-md active:scale-95"
              >
                {team.imagePath ? (
                  <img
                    src={team.imagePath}
                    alt={team.name}
                    className="h-14 w-14 object-contain transition-transform duration-150 group-hover:scale-110"
                  />
                ) : (
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-100">
                    <IconShieldFilled size={28} className="text-slate-300" />
                  </div>
                )}
                <p className="text-center text-sm font-semibold text-slate-800 leading-tight">{team.name}</p>
              </Link>
            ))}
          </div>
        )}

      </div>
    </main>
  )
}

export default TeamsPage
