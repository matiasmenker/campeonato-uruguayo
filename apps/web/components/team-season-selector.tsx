"use client"

import { useTransition } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import HeroSelect from "@/components/hero-select"
import type { Season } from "@/lib/seasons"

interface TeamSeasonSelectorProps {
  seasons: Season[]
  selectedSeasonId: number
}

const TeamSeasonSelector = ({ seasons, selectedSeasonId }: TeamSeasonSelectorProps) => {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()

  const handleChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set("seasonId", value)
    startTransition(() => {
      router.push(`?${params.toString()}`)
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

export default TeamSeasonSelector
