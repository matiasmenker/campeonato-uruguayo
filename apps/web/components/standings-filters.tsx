"use client"

import { useRouter, useSearchParams } from "next/navigation"
import type { Season, Stage } from "@/lib/seasons"

interface StandingsFiltersProps {
  seasons: Season[]
  stages: Stage[]
  selectedSeasonId: number
  selectedStageId: number | null
}

const StandingsFilters = ({ seasons, stages, selectedSeasonId, selectedStageId }: StandingsFiltersProps) => {
  const router = useRouter()
  const searchParams = useSearchParams()

  const updateParam = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set(key, value)
    if (key === "seasonId") params.delete("stageId")
    router.push(`/tabla?${params.toString()}`)
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <select
        value={selectedSeasonId}
        onChange={(event) => updateParam("seasonId", event.target.value)}
        className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 shadow-sm outline-none transition-colors hover:border-slate-300 focus:border-primary focus:ring-2 focus:ring-primary/20"
      >
        {seasons.map((season) => (
          <option key={season.id} value={season.id}>
            {season.name}
          </option>
        ))}
      </select>

      {stages.length > 0 && (
        <select
          value={selectedStageId ?? ""}
          onChange={(event) => updateParam("stageId", event.target.value)}
          className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 shadow-sm outline-none transition-colors hover:border-slate-300 focus:border-primary focus:ring-2 focus:ring-primary/20"
        >
          {stages.map((stage) => (
            <option key={stage.id} value={stage.id}>
              {stage.name}
            </option>
          ))}
        </select>
      )}
    </div>
  )
}

export default StandingsFilters
