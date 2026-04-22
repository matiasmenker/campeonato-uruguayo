"use client"

import { useTransition } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import HeroSelect from "@/components/hero-select"
import type { Season } from "@/lib/seasons"

interface TeamsSeasonSelectorProps {
  seasons: Season[]
  selectedSeasonId: number
}

const TeamsSeasonSelector = ({ seasons, selectedSeasonId }: TeamsSeasonSelectorProps) => {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()

  const handleChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set("seasonId", value)
    startTransition(() => {
      router.push(`/teams?${params.toString()}`)
    })
  }

  return (
    <HeroSelect
      value={String(selectedSeasonId)}
      onValueChange={handleChange}
      options={seasons}
      disabled={isPending}
      openUp
    />
  )
}

export default TeamsSeasonSelector
