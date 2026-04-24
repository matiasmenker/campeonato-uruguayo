import { getFixtures, type FixtureListItem, type Round } from "@/lib/matches"
import { getSeasons } from "@/lib/seasons"
import ProposalsClient from "./proposals-client"

export const dynamic = "force-dynamic"

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

const MatchesPreviewPage = async () => {
  const seasons = await getSeasons().catch(() => [])
  const currentSeason = seasons.find(s => s.isCurrent) ?? seasons[0] ?? null
  if (!currentSeason) {
    return <p className="p-8 text-slate-500">No seasons available.</p>
  }
  const allFixtures = await fetchAllFixtures(currentSeason.id).catch(() => [] as FixtureListItem[])
  return <ProposalsClient allFixtures={allFixtures} seasonName={currentSeason.name} />
}

export default MatchesPreviewPage
