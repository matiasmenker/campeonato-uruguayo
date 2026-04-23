"use client"

import { useRouter, useSearchParams } from "next/navigation"
import HeroSelect from "@/components/hero-select"
import { signalNavigationStart, useIsNavigating } from "@/components/search-params-loading-boundary"
import type { Season, Stage } from "@/lib/seasons"

interface PlayerSeasonStageSelectorProps {
  seasons: Season[]
  stages: Stage[]
  selectedSeasonId: number
  selectedStageId: number | null
}

const ALL_STAGES_ID = 0

const PlayerSeasonStageSelector = ({
  seasons,
  stages,
  selectedSeasonId,
  selectedStageId,
}: PlayerSeasonStageSelectorProps) => {
  const router = useRouter()
  const searchParams = useSearchParams()
  const isNavigating = useIsNavigating()

  const handleSeasonChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set("seasonId", value)
    params.delete("stageId")
    signalNavigationStart()
    router.push(`?${params.toString()}`)
  }

  const handleStageChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value === String(ALL_STAGES_ID)) {
      params.delete("stageId")
    } else {
      params.set("stageId", value)
    }
    signalNavigationStart()
    router.push(`?${params.toString()}`)
  }

  const stageOptions = [
    { id: ALL_STAGES_ID, name: "All stages" },
    ...stages,
  ]

  return (
    <div className="flex items-center gap-2">
      {stages.length > 0 && (
        <HeroSelect
          value={selectedStageId ? String(selectedStageId) : String(ALL_STAGES_ID)}
          onValueChange={handleStageChange}
          options={stageOptions}
          isLoading={isNavigating}
          openUp
        />
      )}
      {seasons.length > 1 && (
        <HeroSelect
          value={String(selectedSeasonId)}
          onValueChange={handleSeasonChange}
          options={seasons}
          isLoading={isNavigating}
          openUp
        />
      )}
    </div>
  )
}

export default PlayerSeasonStageSelector
