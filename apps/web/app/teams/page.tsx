import { Suspense } from "react"
import Link from "next/link"
import { IconShieldFilled } from "@tabler/icons-react"
import { getTeams, type Team } from "@/lib/teams"
import { getSeasons } from "@/lib/seasons"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import TeamsSeasonSelector from "@/components/teams-season-selector"

export const dynamic = "force-dynamic"

// Decorative hero background — layered blues with geometric accents
const HeroBackground = () => (
  <svg className="absolute inset-0 h-full w-full" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice">
    <defs>
      {/* Main diagonal gradient — midnight blue → royal blue → indigo */}
      <linearGradient id="base" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#060d1f" />
        <stop offset="35%" stopColor="#0a2456" />
        <stop offset="65%" stopColor="#1a3a8f" />
        <stop offset="100%" stopColor="#312e81" />
      </linearGradient>
      {/* Horizontal sweep — adds warm cobalt band */}
      <linearGradient id="sweep" x1="0%" y1="50%" x2="100%" y2="50%">
        <stop offset="0%" stopColor="#1d4ed8" stopOpacity="0" />
        <stop offset="40%" stopColor="#2563eb" stopOpacity="0.18" />
        <stop offset="100%" stopColor="#4f46e5" stopOpacity="0.08" />
      </linearGradient>
      {/* Glow — electric blue, top-right */}
      <radialGradient id="glowA" cx="80%" cy="10%" r="50%">
        <stop offset="0%" stopColor="#60a5fa" stopOpacity="0.28" />
        <stop offset="100%" stopColor="#60a5fa" stopOpacity="0" />
      </radialGradient>
      {/* Glow — cyan, center-left */}
      <radialGradient id="glowB" cx="15%" cy="55%" r="38%">
        <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.18" />
        <stop offset="100%" stopColor="#22d3ee" stopOpacity="0" />
      </radialGradient>
      {/* Glow — violet, bottom-right */}
      <radialGradient id="glowC" cx="90%" cy="95%" r="40%">
        <stop offset="0%" stopColor="#818cf8" stopOpacity="0.22" />
        <stop offset="100%" stopColor="#818cf8" stopOpacity="0" />
      </radialGradient>
      {/* Fine crosshatch */}
      <pattern id="hatch" x="0" y="0" width="16" height="16" patternUnits="userSpaceOnUse" patternTransform="rotate(30)">
        <line x1="0" y1="0" x2="0" y2="16" stroke="rgba(255,255,255,0.035)" strokeWidth="0.5" />
      </pattern>
      {/* Hex-dot grid */}
      <pattern id="hexdots" x="0" y="0" width="28" height="28" patternUnits="userSpaceOnUse">
        <circle cx="0"  cy="0"  r="1.2" fill="rgba(148,163,255,0.12)" />
        <circle cx="14" cy="14" r="1.2" fill="rgba(148,163,255,0.07)" />
        <circle cx="28" cy="0"  r="1.2" fill="rgba(148,163,255,0.12)" />
        <circle cx="0"  cy="28" r="1.2" fill="rgba(148,163,255,0.12)" />
        <circle cx="28" cy="28" r="1.2" fill="rgba(148,163,255,0.12)" />
      </pattern>
    </defs>

    {/* Base */}
    <rect width="100%" height="100%" fill="url(#base)" />

    {/* Color sweeps */}
    <rect width="100%" height="100%" fill="url(#sweep)" />
    <rect width="100%" height="100%" fill="url(#glowA)" />
    <rect width="100%" height="100%" fill="url(#glowB)" />
    <rect width="100%" height="100%" fill="url(#glowC)" />

    {/* Texture */}
    <rect width="100%" height="100%" fill="url(#hatch)" />
    <rect width="100%" height="100%" fill="url(#hexdots)" />

    {/* Decorative arcs — large sphere suggestion bottom-right */}
    <circle cx="108%" cy="120%" r="65%" fill="none" stroke="rgba(99,102,241,0.12)" strokeWidth="1.5" />
    <circle cx="108%" cy="120%" r="50%" fill="none" stroke="rgba(99,102,241,0.09)" strokeWidth="1" />
    <circle cx="108%" cy="120%" r="36%" fill="none" stroke="rgba(99,102,241,0.06)" strokeWidth="0.5" />

    {/* Accent arc — top-left */}
    <circle cx="-8%" cy="-15%" r="38%" fill="none" stroke="rgba(96,165,250,0.1)" strokeWidth="1" />

    {/* Diagonal accent line */}
    <line x1="55%" y1="0%" x2="100%" y2="60%" stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
    <line x1="60%" y1="0%" x2="100%" y2="55%" stroke="rgba(255,255,255,0.025)" strokeWidth="0.5" />
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
