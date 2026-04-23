import { Suspense } from "react"
import Link from "next/link"
import { IconShieldFilled } from "@tabler/icons-react"
import { getTeams, type Team } from "@/lib/teams"
import { getSeasons, type Season } from "@/lib/seasons"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import TeamsSeasonSelector from "@/components/teams-season-selector"
import SearchParamsLoadingBoundary from "@/components/search-params-loading-boundary"
import HeroTexture from "@/components/hero-texture"

export const dynamic = "force-dynamic"

// ─── Content skeleton ─────────────────────────────────────────────────────────

const TeamsContentSkeleton = () => (
  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
    {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((index) => (
      <div
        key={index}
        className="flex flex-col items-center gap-3 overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm"
      >
        <div className="h-14 w-14 animate-pulse rounded-lg bg-slate-200" />
        <div className="h-3.5 w-20 animate-pulse rounded bg-slate-200" />
      </div>
    ))}
  </div>
)

// ─── Content (slow fetch) ─────────────────────────────────────────────────────

interface TeamsContentProps {
  selectedSeasonId: number | null
}

const TeamsContent = async ({ selectedSeasonId }: TeamsContentProps) => {
  let teams: Team[] = []
  let errorMessage: string | null = null

  const [teamsResult] = await Promise.allSettled([
    getTeams(selectedSeasonId ?? undefined),
  ])

  if (teamsResult.status === "fulfilled") teams = teamsResult.value
  else errorMessage = "Could not load teams."

  if (errorMessage) {
    return (
      <Alert className="border-amber-300 bg-amber-50 text-amber-950">
        <AlertTitle>Could not load teams</AlertTitle>
        <AlertDescription>{errorMessage}</AlertDescription>
      </Alert>
    )
  }

  return (
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
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

interface TeamsPageProps {
  searchParams: Promise<{ seasonId?: string }>
}

const TeamsPage = async ({ searchParams }: TeamsPageProps) => {
  const { seasonId: seasonIdParam } = await searchParams

  // Fast fetch — needed for hero
  let seasons: Season[] = []
  const seasonsResult = await Promise.allSettled([getSeasons()])
  if (seasonsResult[0].status === "fulfilled") seasons = seasonsResult[0].value

  const currentSeason = seasons.find((season) => season.isCurrent) ?? seasons[0]
  const selectedSeasonId = seasonIdParam ? Number(seasonIdParam) : (currentSeason?.id ?? null)
  const selectedSeason = seasons.find((season) => season.id === selectedSeasonId) ?? currentSeason

  return (
    <main className="min-h-svh bg-[linear-gradient(180deg,#f8fafc_0%,#f8fafc_48%,#eef2f7_100%)]">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-6 py-8 sm:px-8 lg:px-10">

        {/* Hero — renders immediately */}
        <div className="overflow-hidden rounded-2xl shadow-lg">
          <div className="relative min-h-52 bg-slate-900">
            <HeroTexture />
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/5 to-black/40 pointer-events-none" />

            <div className="absolute bottom-0 left-0 right-0 flex items-end justify-between gap-4 p-6">
              <div className="flex items-center gap-4">
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

              {seasons.length > 1 && (
                <div className="shrink-0">
                  <Suspense>
                    <TeamsSeasonSelector seasons={seasons} selectedSeasonId={selectedSeason?.id ?? 0} />
                  </Suspense>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Content — skeleton on initial stream AND on every client-side param change */}
        <Suspense fallback={<TeamsContentSkeleton />}>
          <SearchParamsLoadingBoundary
            committedParams={{ seasonId: String(selectedSeasonId) }}
            skeleton={<TeamsContentSkeleton />}
          >
            <TeamsContent selectedSeasonId={selectedSeasonId} />
          </SearchParamsLoadingBoundary>
        </Suspense>

      </div>
    </main>
  )
}

export default TeamsPage
