import { NextRequest, NextResponse } from "next/server"
import { getFixtures } from "@/lib/matches"
import type { FixtureListItem } from "@/lib/matches"

export const dynamic = "force-dynamic"

export const GET = async (request: NextRequest): Promise<NextResponse> => {
  const seasonId = Number(request.nextUrl.searchParams.get("seasonId"))
  if (!seasonId || isNaN(seasonId)) {
    return NextResponse.json({ error: "seasonId required" }, { status: 400 })
  }

  try {
    const first = await getFixtures({ seasonId, pageSize: 100, page: 1 })
    const { totalPages } = first.pagination
    if (totalPages <= 1) return NextResponse.json(first.data)
    const rest = await Promise.all(
      Array.from({ length: totalPages - 1 }, (_, i) =>
        getFixtures({ seasonId, pageSize: 100, page: i + 2 })
      )
    )
    const allFixtures: FixtureListItem[] = [first.data, ...rest.map(r => r.data)].flat()
    return NextResponse.json(allFixtures)
  } catch {
    return NextResponse.json({ error: "Failed to fetch fixtures" }, { status: 500 })
  }
}
