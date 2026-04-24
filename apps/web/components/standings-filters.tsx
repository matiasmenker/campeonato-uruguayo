"use client"

import { useRouter, useSearchParams } from "next/navigation"
import HeroSelect from "@/components/hero-select"
import { signalNavigationStart, useIsNavigating } from "@/components/search-params-loading-boundary"
import type { Season } from "@/lib/seasons"

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
  stages: Array<{ id: number; name: string }>
  selectedStageId: number | null
}

export const StandingsStageFilter = ({ stages, selectedStageId }: StandingsStageFilterProps) => {
  const { updateParam } = useStandingsNav()
  const isNavigating = useIsNavigating()

  return (
    <HeroSelect
      value={selectedStageId !== null ? String(selectedStageId) : ""}
      onValueChange={value => updateParam("stageId", value)}
      options={stages}
      isLoading={isNavigating}
    />
  )
}
