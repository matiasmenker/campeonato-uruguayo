import { Suspense } from "react"
import Link from "next/link"
import { IconShieldFilled } from "@tabler/icons-react"
import { getTeams, type Team } from "@/lib/teams"
import { getSeasons } from "@/lib/seasons"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import TeamsSeasonSelector from "@/components/teams-season-selector"

export const dynamic = "force-dynamic"

// Hero background — Pitch Night (dark green + gold)
const HeroBackground = () => (
  <svg className="absolute inset-0 h-full w-full" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice">
    <defs>
      <linearGradient id="base" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#052e16" />
        <stop offset="50%" stopColor="#064e3b" />
        <stop offset="100%" stopColor="#0a3728" />
      </linearGradient>
      <radialGradient id="g1" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="#34d399" stopOpacity="0.1" />
        <stop offset="100%" stopColor="#34d399" stopOpacity="0" />
      </radialGradient>
      <radialGradient id="g2" cx="80%" cy="20%" r="40%">
        <stop offset="0%" stopColor="#fbbf24" stopOpacity="0.12" />
        <stop offset="100%" stopColor="#fbbf24" stopOpacity="0" />
      </radialGradient>
      <pattern id="stripes" x="0" y="0" width="48" height="48" patternUnits="userSpaceOnUse">
        <rect x="0" y="0" width="24" height="48" fill="rgba(255,255,255,0.015)" />
      </pattern>
      <pattern id="dots" x="0" y="0" width="16" height="16" patternUnits="userSpaceOnUse">
        <circle cx="8" cy="8" r="0.7" fill="rgba(52,211,153,0.12)" />
      </pattern>
    </defs>
    <rect width="100%" height="100%" fill="url(#base)" />
    <rect width="100%" height="100%" fill="url(#stripes)" />
    <rect width="100%" height="100%" fill="url(#g1)" />
    <rect width="100%" height="100%" fill="url(#g2)" />
    <rect width="100%" height="100%" fill="url(#dots)" />
    <circle cx="50%" cy="50%" r="22%" fill="none" stroke="rgba(52,211,153,0.08)" strokeWidth="1" />
    <circle cx="50%" cy="50%" r="2%" fill="rgba(52,211,153,0.12)" />
    <line x1="50%" y1="0%" x2="50%" y2="100%" stroke="rgba(52,211,153,0.06)" strokeWidth="1" />
    <rect x="35%" y="70%" width="30%" height="28%" fill="none" stroke="rgba(52,211,153,0.06)" strokeWidth="1" />
  </svg>
)

interface TeamsPageProps {
  searchParams: Promise<{ seasonId?: string }>
}

const TeamsPage = async ({ searchParams }: TeamsPageProps) => {
  const { seasonId: seasonIdParam } = await searchParams

  let teams: Team[] = []
  let errorMessage: string | null = null

  const [teamsResult, seasonsResult] = await Promise.allSettled([
    getTeams(),
    getSeasons(),
  ])

  if (teamsResult.status === "fulfilled") teams = teamsResult.value
  else errorMessage = "Could not load teams."

  const seasons = seasonsResult.status === "fulfilled" ? seasonsResult.value : []
  const currentSeason = seasons.find((season) => season.isCurrent) ?? seasons[0]
  const selectedSeasonId = seasonIdParam ? Number(seasonIdParam) : (currentSeason?.id ?? null)
  const selectedSeason = seasons.find((season) => season.id === selectedSeasonId) ?? currentSeason

  return (
    <main className="min-h-svh bg-[linear-gradient(180deg,#f8fafc_0%,#f8fafc_48%,#eef2f7_100%)]">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-6 py-8 sm:px-8 lg:px-10">

        {/* Hero — same pattern as team detail page */}
        <div className="overflow-hidden rounded-2xl shadow-lg">
          <div className="relative min-h-44 bg-slate-900">
            <HeroBackground />

            {/* Gradient overlay — darkens bottom for text legibility */}
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/60" />

            {/* Season selector — top right */}
            {seasons.length > 1 && (
              <div className="absolute right-5 top-5">
                <Suspense>
                  <TeamsSeasonSelector seasons={seasons} selectedSeasonId={selectedSeason?.id ?? 0} />
                </Suspense>
              </div>
            )}

            {/* Title — bottom left */}
            <div className="absolute bottom-0 left-0 right-0 flex items-end gap-5 p-6">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-sm ring-1 ring-white/20">
                <IconShieldFilled size={32} className="text-white/70" />
              </div>
              <div className="flex flex-col gap-1 pb-1">
                <h1 className="text-3xl font-black text-white leading-none drop-shadow">Teams</h1>
                <p className="text-sm text-white/70">
                  Uruguayan Primera División
                  {selectedSeason ? (
                    <span className="font-semibold text-white/90"> · {selectedSeason.name}</span>
                  ) : null}
                </p>
              </div>
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
