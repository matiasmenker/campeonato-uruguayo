"use client"

import { useTransition } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import HeroSelect from "@/components/hero-select"
import type { Season, Stage } from "@/lib/seasons"

// ---------------------------------------------------------------------------
// Shared navigation hook
// ---------------------------------------------------------------------------

const useStandingsNav = () => {
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

  return { isPending, updateParam }
}

// ---------------------------------------------------------------------------
// Season filter
// ---------------------------------------------------------------------------

interface StandingsSeasonFilterProps {
  seasons: Season[]
  selectedSeasonId: number
}

export const StandingsSeasonFilter = ({ seasons, selectedSeasonId }: StandingsSeasonFilterProps) => {
  const { isPending, updateParam } = useStandingsNav()

  return (
    <HeroSelect
      value={String(selectedSeasonId)}
      onValueChange={value => updateParam("seasonId", value)}
      options={seasons}
      disabled={isPending}
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
  const { isPending, updateParam } = useStandingsNav()

  return (
    <HeroSelect
      value={selectedStageId !== null ? String(selectedStageId) : ""}
      onValueChange={value => updateParam("stageId", value)}
      options={stages}
      disabled={isPending}
    />
  )
}
