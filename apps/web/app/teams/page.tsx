import { Suspense } from "react"
import Link from "next/link"
import { IconShieldFilled } from "@tabler/icons-react"
import { getTeams, type Team } from "@/lib/teams"
import { getSeasons } from "@/lib/seasons"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import TeamsSeasonSelector from "@/components/teams-season-selector"

export const dynamic = "force-dynamic"

// Decorative hero background — gradient + geometric texture
const HeroBackground = () => (
  <svg className="absolute inset-0 h-full w-full" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice">
    <defs>
      {/* Base gradient: deep navy → vivid blue → teal */}
      <linearGradient id="heroGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#0f172a" />
        <stop offset="40%" stopColor="#1e3a5f" />
        <stop offset="75%" stopColor="#0d4f6c" />
        <stop offset="100%" stopColor="#064e3b" />
      </linearGradient>
      {/* Radial glow top-right */}
      <radialGradient id="glow1" cx="85%" cy="15%" r="45%">
        <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.25" />
        <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
      </radialGradient>
      {/* Radial glow bottom-left */}
      <radialGradient id="glow2" cx="10%" cy="90%" r="40%">
        <stop offset="0%" stopColor="#10b981" stopOpacity="0.2" />
        <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
      </radialGradient>
      {/* Diamond grid pattern */}
      <pattern id="diamonds" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
        <rect width="40" height="40" fill="none" />
        <rect x="0" y="0" width="40" height="1" fill="rgba(255,255,255,0.04)" />
        <rect x="0" y="0" width="1" height="40" fill="rgba(255,255,255,0.04)" />
      </pattern>
      {/* Dot accent pattern */}
      <pattern id="dots" x="0" y="0" width="24" height="24" patternUnits="userSpaceOnUse">
        <circle cx="1.5" cy="1.5" r="1" fill="rgba(255,255,255,0.06)" />
      </pattern>
    </defs>
    {/* Base gradient fill */}
    <rect width="100%" height="100%" fill="url(#heroGrad)" />
    {/* Glow accents */}
    <rect width="100%" height="100%" fill="url(#glow1)" />
    <rect width="100%" height="100%" fill="url(#glow2)" />
    {/* Texture layers */}
    <rect width="100%" height="100%" fill="url(#diamonds)" />
    <rect width="100%" height="100%" fill="url(#dots)" />
    {/* Large decorative circle arc — bottom right */}
    <circle cx="105%" cy="110%" r="55%" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="1.5" />
    <circle cx="105%" cy="110%" r="42%" fill="none" stroke="rgba(255,255,255,0.035)" strokeWidth="1" />
    {/* Small decorative circles — top left */}
    <circle cx="-5%" cy="-10%" r="30%" fill="none" stroke="rgba(59,130,246,0.08)" strokeWidth="1" />
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
