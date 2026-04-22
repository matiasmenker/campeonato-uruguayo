"use client"

import { useTransition } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { cn } from "@/lib/utils"
import type { Season } from "@/lib/seasons"

interface TeamsSeasonSelectorProps {
  seasons: Season[]
  selectedSeasonId: number
}

const TeamsSeasonSelector = ({ seasons, selectedSeasonId }: TeamsSeasonSelectorProps) => {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()

  const handleChange = (seasonId: number) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set("seasonId", String(seasonId))
    startTransition(() => {
      router.push(`/teams?${params.toString()}`)
    })
  }

  return (
    <div className="flex items-center gap-1.5">
      {seasons.map(season => (
        <button
          key={season.id}
          onClick={() => handleChange(season.id)}
          disabled={isPending}
          className={cn(
            "rounded-full border px-3.5 py-1.5 text-xs font-bold backdrop-blur-sm transition-colors disabled:opacity-60",
            season.id === selectedSeasonId
              ? "border-white/40 bg-white/25 text-white"
              : "border-white/20 bg-white/10 text-white/65 hover:bg-white/20 hover:text-white"
          )}
        >
          {season.name}
        </button>
      ))}
    </div>
  )
}

export default TeamsSeasonSelector
