"use client"

import { useRouter, useSearchParams } from "next/navigation"
import HeroSelect from "@/components/hero-select"
import { signalNavigationStart } from "@/components/search-params-loading-boundary"
import type { Season } from "@/lib/seasons"

interface TeamsSeasonSelectorProps {
  seasons: Season[]
  selectedSeasonId: number
}

const TeamsSeasonSelector = ({ seasons, selectedSeasonId }: TeamsSeasonSelectorProps) => {
  const router = useRouter()
  const searchParams = useSearchParams()

  const handleChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set("seasonId", value)
    signalNavigationStart()
    router.push(`/teams?${params.toString()}`)
  }

  return (
    <HeroSelect
      value={String(selectedSeasonId)}
      onValueChange={handleChange}
      options={seasons}
      openUp
    />
  )
}

export default TeamsSeasonSelector
