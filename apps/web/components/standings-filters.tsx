"use client"

import { useRouter, useSearchParams } from "next/navigation"
import type { Season, Stage } from "@/lib/seasons"

interface StandingsFiltersProps {
  seasons: Season[]
  stages: Stage[]
  selectedSeasonId: number
  selectedStageId: number | null
}

const selectClassName =
  "appearance-none rounded-xl border border-slate-200 bg-white py-2 pl-4 pr-9 text-sm font-medium text-slate-700 shadow-sm outline-none transition-colors hover:border-slate-300 focus:border-primary focus:ring-2 focus:ring-primary/20 bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2216%22%20height%3D%2216%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%2394a3b8%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpath%20d%3D%22M6%209l6%206%206-6%22%2F%3E%3C%2Fsvg%3E')] bg-[right_12px_center] bg-no-repeat cursor-pointer"

const MAIN_STAGE_NAMES = ["apertura", "clausura", "intermediate round"]

const isMainStage = (stageName: string) =>
  MAIN_STAGE_NAMES.some((name) => stageName.toLowerCase() === name)

const StandingsFilters = ({ seasons, stages, selectedSeasonId, selectedStageId }: StandingsFiltersProps) => {
  const router = useRouter()
  const searchParams = useSearchParams()

  const updateParam = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set(key, value)
    if (key === "seasonId") params.delete("stageId")
    router.push(`/standings?${params.toString()}`)
  }

  const visibleStages = stages.filter((stage) => isMainStage(stage.name))

  return (
    <div className="flex flex-wrap items-center gap-3">
      <select
        value={selectedSeasonId}
        onChange={(event) => updateParam("seasonId", event.target.value)}
        className={`w-28 ${selectClassName}`}
      >
        {seasons.map((season) => (
          <option key={season.id} value={season.id}>
            {season.name}
          </option>
        ))}
      </select>

      {visibleStages.length > 0 && (
        <select
          value={selectedStageId ?? ""}
          onChange={(event) => updateParam("stageId", event.target.value)}
          className={`w-48 ${selectClassName}`}
        >
          {visibleStages.map((stage) => (
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
