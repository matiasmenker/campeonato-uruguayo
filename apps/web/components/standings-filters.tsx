"use client"

import { useRouter, useSearchParams } from "next/navigation"
import HeroSelect from "@/components/hero-select"
import type { Season, Stage } from "@/lib/seasons"

// ---------------------------------------------------------------------------
// Shared navigation hook
// ---------------------------------------------------------------------------

const useStandingsNav = () => {
  const router = useRouter()
  const searchParams = useSearchParams()

  const updateParam = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set(key, value)
    if (key === "seasonId") params.delete("stageId")
    router.push(`/standings?${params.toString()}`)
  }

  return { updateParam }
}

// ---------------------------------------------------------------------------
// Season filter
// ---------------------------------------------------------------------------

interface StandingsSeasonFilterProps {
  seasons: Season[]
  selectedSeasonId: number
}

export const StandingsSeasonFilter = ({ seasons, selectedSeasonId }: StandingsSeasonFilterProps) => {
  const { updateParam } = useStandingsNav()

  return (
    <HeroSelect
      value={String(selectedSeasonId)}
      onValueChange={value => updateParam("seasonId", value)}
      options={seasons}
      openUp
    />
  )
}

// ---------------------------------------------------------------------------
// Stage filter
// ---------------------------------------------------------------------------

interface StandingsStageFilterProps {
  stages: Stage[]
  selectedStageId: number | null
}

export const StandingsStageFilter = ({ stages, selectedStageId }: StandingsStageFilterProps) => {
  const { updateParam } = useStandingsNav()

  return (
    <HeroSelect
      value={selectedStageId !== null ? String(selectedStageId) : ""}
      onValueChange={value => updateParam("stageId", value)}
      options={stages}
    />
  )
}
