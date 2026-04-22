import { getFixtures, type FixtureListItem } from "@/lib/matches"
import { getSeasons, type Season } from "@/lib/seasons"
import MatchesBrowser from "@/components/matches-browser"

export const dynamic = "force-dynamic"

interface MatchesPageProps {
  searchParams: Promise<{ seasonId?: string }>
}

const fetchAllFixtures = async (seasonId: number): Promise<FixtureListItem[]> => {
  const first = await getFixtures({ seasonId, pageSize: 100, page: 1 })
  const { totalPages } = first.pagination
  if (totalPages <= 1) return first.data
  const rest = await Promise.all(
    Array.from({ length: totalPages - 1 }, (_, i) =>
      getFixtures({ seasonId, pageSize: 100, page: i + 2 })
    )
  )
  return [first.data, ...rest.map(r => r.data)].flat()
}

const MatchesPage = async ({ searchParams }: MatchesPageProps) => {
  const { seasonId: seasonIdParam } = await searchParams

  const seasons: Season[] = await getSeasons().catch(() => [])
  const currentSeason = seasons.find((s) => s.isCurrent) ?? seasons[0] ?? null
  const selectedSeasonId = seasonIdParam ? Number(seasonIdParam) : (currentSeason?.id ?? null)

  let allFixtures: FixtureListItem[] = []
  if (selectedSeasonId) {
    allFixtures = await fetchAllFixtures(selectedSeasonId).catch(() => [])
  }

  return (
    <main className="min-h-svh bg-[linear-gradient(180deg,#f8fafc_0%,#f8fafc_48%,#eef2f7_100%)]">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-6 py-8 sm:px-8 lg:px-10">
        <MatchesBrowser
          seasons={seasons}
          initialSeasonId={selectedSeasonId}
          initialFixtures={allFixtures}
        />
      </div>
    </main>
  )
}

export default MatchesPage
