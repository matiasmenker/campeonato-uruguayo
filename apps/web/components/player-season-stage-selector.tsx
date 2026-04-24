"use client"

import { useRouter, useSearchParams } from "next/navigation"
import HeroSelect from "@/components/hero-select"
import { signalNavigationStart, useIsNavigating } from "@/components/search-params-loading-boundary"
import type { Season } from "@/lib/seasons"
import { buildStageGroupSelectOptions, type GroupedStages, type StageGroup } from "@/lib/stage-groups"

interface PlayerSeasonStageSelectorProps {
  seasons: Season[]
  stageGroups: GroupedStages[]
  selectedSeasonId: number
  selectedGroup: StageGroup | null
}

const PlayerSeasonStageSelector = ({
  seasons,
  stageGroups,
  selectedSeasonId,
  selectedGroup,
}: PlayerSeasonStageSelectorProps) => {
  const router = useRouter()
  const searchParams = useSearchParams()
  const isNavigating = useIsNavigating()

  const stageOptions = buildStageGroupSelectOptions(stageGroups)
  const firstEnabled = stageOptions.find((option) => !option.disabled)
  const activeValue = selectedGroup ?? firstEnabled?.group ?? stageOptions[0]?.group ?? ""

  const handleSeasonChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set("seasonId", value)
    params.delete("stageId")
    signalNavigationStart()
    router.push(`?${params.toString()}`)
  }

  const handleGroupChange = (groupKey: string) => {
    const option = stageOptions.find((entry) => entry.group === groupKey)
    if (!option || option.disabled || option.primaryStageId === null) return
    const params = new URLSearchParams(searchParams.toString())
    params.set("stageId", String(option.primaryStageId))
    signalNavigationStart()
    router.push(`?${params.toString()}`)
  }

  return (
    <div className="flex items-center gap-2">
      {stageOptions.length > 0 && (
        <HeroSelect
          value={activeValue}
          onValueChange={handleGroupChange}
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
