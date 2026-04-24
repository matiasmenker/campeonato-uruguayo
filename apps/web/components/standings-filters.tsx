"use client"

import { useRouter, useSearchParams } from "next/navigation"
import HeroSelect from "@/components/hero-select"
import { signalNavigationStart, useIsNavigating } from "@/components/search-params-loading-boundary"
import type { Season } from "@/lib/seasons"
import type { StageGroupSelectOption, StageGroup } from "@/lib/stage-groups"

const useStandingsNav = () => {
  const router = useRouter()
  const searchParams = useSearchParams()

  const updateParam = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set(key, value)
    if (key === "seasonId") params.delete("stageId")
    signalNavigationStart()
    router.push(`/standings?${params.toString()}`)
  }

  return { updateParam }
}

interface StandingsSeasonFilterProps {
  seasons: Season[]
  selectedSeasonId: number
}

export const StandingsSeasonFilter = ({ seasons, selectedSeasonId }: StandingsSeasonFilterProps) => {
  const { updateParam } = useStandingsNav()
  const isNavigating = useIsNavigating()

  return (
    <HeroSelect
      value={String(selectedSeasonId)}
      onValueChange={value => updateParam("seasonId", value)}
      options={seasons}
      isLoading={isNavigating}
      openUp
    />
  )
}

interface StandingsStageFilterProps {
  stageOptions: StageGroupSelectOption[]
  selectedGroup: StageGroup | null
}

export const StandingsStageFilter = ({ stageOptions, selectedGroup }: StandingsStageFilterProps) => {
  const { updateParam } = useStandingsNav()
  const isNavigating = useIsNavigating()

  const firstEnabled = stageOptions.find((option) => !option.disabled)
  const activeValue = selectedGroup ?? firstEnabled?.group ?? stageOptions[0]?.group ?? ""

  const handleChange = (groupKey: string) => {
    const option = stageOptions.find((entry) => entry.group === groupKey)
    if (!option || option.disabled || option.primaryStageId === null) return
    updateParam("stageId", String(option.primaryStageId))
  }

  return (
    <HeroSelect
      value={activeValue}
      onValueChange={handleChange}
      options={stageOptions}
      isLoading={isNavigating}
    />
  )
}
