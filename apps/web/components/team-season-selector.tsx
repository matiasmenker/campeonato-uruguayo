"use client"

import { useRouter, useSearchParams } from "next/navigation"
import HeroSelect from "@/components/hero-select"
import { signalNavigationStart, useIsNavigating } from "@/components/search-params-loading-boundary"
import type { Season } from "@/lib/seasons"

interface TeamSeasonSelectorProps {
  seasons: Season[]
  selectedSeasonId: number
}

const TeamSeasonSelector = ({ seasons, selectedSeasonId }: TeamSeasonSelectorProps) => {
  const router = useRouter()
  const searchParams = useSearchParams()
  const isNavigating = useIsNavigating()

  const handleChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set("seasonId", value)
    signalNavigationStart()
    router.push(`?${params.toString()}`)
  }

  return (
    <HeroSelect
      value={String(selectedSeasonId)}
      onValueChange={handleChange}
      options={seasons}
      isLoading={isNavigating}
      openUp
    />
  )
}

export default TeamSeasonSelector
