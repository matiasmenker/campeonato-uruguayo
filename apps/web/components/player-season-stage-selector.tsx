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
    params.set("stageId", value)
    signalNavigationStart()
    router.push(`?${params.toString()}`)
  }

  return (
    <div className="flex items-center gap-2">
      {stages.length > 1 && (
        <HeroSelect
          value={selectedStageId !== null ? String(selectedStageId) : String(stages[0]?.id ?? "")}
          onValueChange={handleStageChange}
          options={stages}
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
