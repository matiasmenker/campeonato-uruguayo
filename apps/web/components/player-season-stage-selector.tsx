"use client"

import { useRouter, useSearchParams } from "next/navigation"
import HeroSelect from "@/components/hero-select"
import { signalNavigationStart, useIsNavigating } from "@/components/search-params-loading-boundary"
import type { Season } from "@/lib/seasons"
import type { GroupedStages } from "@/lib/stage-groups"

interface PlayerSeasonStageSelectorProps {
  seasons: Season[]
  stageGroups: GroupedStages[]
  selectedSeasonId: number
  selectedGroupStageId: number | null
}

const PlayerSeasonStageSelector = ({
  seasons,
  stageGroups,
  selectedSeasonId,
  selectedGroupStageId,
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

  const availableGroups = stageGroups.filter((group) => group.primaryStageId !== null)
  const stageOptions = availableGroups.map((group) => ({
    id: group.primaryStageId as number,
    name: group.label,
  }))
  const fallbackStageId = availableGroups[0]?.primaryStageId ?? null

  return (
    <div className="flex items-center gap-2">
      {stageOptions.length > 1 && (
        <HeroSelect
          value={selectedGroupStageId !== null ? String(selectedGroupStageId) : fallbackStageId !== null ? String(fallbackStageId) : ""}
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
