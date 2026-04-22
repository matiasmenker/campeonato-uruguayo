import { IconBallFootball } from "@tabler/icons-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { getFixtures, type FixtureListItem } from "@/lib/matches"
import { getSeasons, type Season } from "@/lib/seasons"
import MatchesBrowser from "@/components/matches-browser"

export const dynamic = "force-dynamic"

const HeroBackground = () => (
  <svg className="absolute inset-0 h-full w-full" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice">
    <defs>
      <linearGradient id="matchesBase" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#0a1628" />
        <stop offset="40%" stopColor="#0d2a1a" />
        <stop offset="75%" stopColor="#0f4a2a" />
        <stop offset="100%" stopColor="#0a3320" />
      </linearGradient>
      <radialGradient id="matchesGA" cx="80%" cy="15%" r="45%">
        <stop offset="0%" stopColor="#22c55e" stopOpacity="0.18" />
        <stop offset="100%" stopColor="#22c55e" stopOpacity="0" />
      </radialGradient>
      <radialGradient id="matchesGB" cx="20%" cy="70%" r="50%">
        <stop offset="0%" stopColor="#16a34a" stopOpacity="0.12" />
        <stop offset="100%" stopColor="#16a34a" stopOpacity="0" />
      </radialGradient>
      <pattern id="matchesDots" x="0" y="0" width="18" height="18" patternUnits="userSpaceOnUse">
        <circle cx="9" cy="9" r="0.8" fill="rgba(134,239,172,0.08)" />
      </pattern>
    </defs>
    <rect width="100%" height="100%" fill="url(#matchesBase)" />
    <rect width="100%" height="100%" fill="url(#matchesGA)" />
    <rect width="100%" height="100%" fill="url(#matchesGB)" />
    <rect width="100%" height="100%" fill="url(#matchesDots)" />
    <circle cx="-5%" cy="110%" r="65%" fill="none" stroke="rgba(34,197,94,0.07)" strokeWidth="1.5" />
    <circle cx="-5%" cy="110%" r="48%" fill="none" stroke="rgba(34,197,94,0.05)" strokeWidth="1" />
    <circle cx="108%" cy="-8%" r="48%" fill="none" stroke="rgba(134,239,174,0.06)" strokeWidth="1" />
  </svg>
)

interface MatchesPageProps {
  searchParams: Promise<{ seasonId?: string }>
}

const fetchAllFixtures = async (seasonId: number): Promise<FixtureListItem[]> => {
  const [page1, page2] = await Promise.all([
    getFixtures({ seasonId, pageSize: 100, page: 1 }),
    getFixtures({ seasonId, pageSize: 100, page: 2 }),
  ])
  return [...page1.data, ...page2.data]
}

const MatchesPage = async ({ searchParams }: MatchesPageProps) => {
  const { seasonId: seasonIdParam } = await searchParams

  const seasons: Season[] = await getSeasons().catch(() => [])
  const currentSeason = seasons.find((s) => s.isCurrent) ?? seasons[0] ?? null
  const selectedSeasonId = seasonIdParam ? Number(seasonIdParam) : (currentSeason?.id ?? null)
  const selectedSeason = seasons.find((s) => s.id === selectedSeasonId) ?? currentSeason

  let allFixtures: FixtureListItem[] = []
  let errorMessage: string | null = null

  if (selectedSeasonId) {
    try {
      allFixtures = await fetchAllFixtures(selectedSeasonId)
    } catch {
      errorMessage = "No se pudieron cargar los partidos."
    }
  }

  return (
    <main className="min-h-svh bg-[linear-gradient(180deg,#f8fafc_0%,#f8fafc_48%,#eef2f7_100%)]">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-6 py-8 sm:px-8 lg:px-10">

        <div className="overflow-hidden rounded-2xl shadow-lg">
          <div className="relative min-h-44 bg-slate-900">
            <HeroBackground />
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/60" />
            <div className="absolute bottom-0 left-0 right-0 flex items-end gap-5 p-6">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-sm ring-1 ring-white/20">
                <IconBallFootball size={32} className="text-white/70" />
              </div>
              <div className="flex flex-col gap-1 pb-1">
                <h1 className="text-3xl font-black text-white leading-none drop-shadow">Partidos</h1>
                <p className="text-sm text-white/70">
                  Primera División
                  {selectedSeason && <span className="font-semibold text-white/90"> · {selectedSeason.name}</span>}
                </p>
              </div>
            </div>
          </div>
        </div>

        {errorMessage ? (
          <Alert className="border-amber-300 bg-amber-50 text-amber-950">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{errorMessage}</AlertDescription>
          </Alert>
        ) : (
          <MatchesBrowser
            seasons={seasons}
            selectedSeasonId={selectedSeasonId}
            allFixtures={allFixtures}
          />
        )}

      </div>
    </main>
  )
}

export default MatchesPage
