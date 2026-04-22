"use client"

import { useTransition } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { cn } from "@/lib/utils"
import type { Season, Stage } from "@/lib/seasons"

interface StandingsFiltersProps {
  seasons: Season[]
  stages: Stage[]
  selectedSeasonId: number
  selectedStageId: number | null
}

const MAIN_STAGE_NAMES = ["apertura", "clausura", "intermediate round"]

const isMainStage = (stageName: string) =>
  MAIN_STAGE_NAMES.some(name => stageName.toLowerCase() === name)

const StandingsFilters = ({ seasons, stages, selectedSeasonId, selectedStageId }: StandingsFiltersProps) => {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()

  const updateParam = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set(key, value)
    if (key === "seasonId") params.delete("stageId")
    startTransition(() => {
      router.push(`/standings?${params.toString()}`)
    })
  }

  const visibleStages = stages.filter(stage => isMainStage(stage.name))

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="flex gap-1.5">
        {seasons.map(season => (
          <button
            key={season.id}
            onClick={() => updateParam("seasonId", String(season.id))}
            disabled={isPending}
            className={cn(
              "rounded-full border px-3.5 py-1.5 text-xs font-bold transition-colors disabled:opacity-60",
              season.id === selectedSeasonId
                ? "border-slate-800 bg-slate-800 text-white"
                : "border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:text-slate-800"
            )}
          >
            {season.name}
          </button>
        ))}
      </div>

      {visibleStages.length > 0 && (
        <div className="flex gap-1.5">
          {visibleStages.map(stage => (
            <button
              key={stage.id}
              onClick={() => updateParam("stageId", String(stage.id))}
              disabled={isPending}
              className={cn(
                "rounded-full border px-3.5 py-1.5 text-xs font-bold transition-colors disabled:opacity-60",
                stage.id === selectedStageId
                  ? "border-slate-800 bg-slate-800 text-white"
                  : "border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:text-slate-800"
              )}
            >
              {stage.name}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default StandingsFilters
