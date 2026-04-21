"use client"

import { useTransition } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import type { Season } from "@/lib/seasons"

interface TeamSeasonSelectorProps {
  seasons: Season[]
  selectedSeasonId: number
}

const selectClassName =
  "appearance-none rounded-xl border border-white/20 bg-white/10 backdrop-blur-sm py-1.5 pl-3 pr-8 text-sm font-semibold text-white shadow-sm outline-none transition-colors hover:bg-white/20 focus:bg-white/20 bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2216%22%20height%3D%2216%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22rgba(255,255,255,0.7)%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpath%20d%3D%22M6%209l6%206%206-6%22%2F%3E%3C%2Fsvg%3E')] bg-[right_8px_center] bg-no-repeat cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"

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
    <select
      value={selectedSeasonId}
      onChange={(event) => handleChange(event.target.value)}
      disabled={isPending}
      className={selectClassName}
    >
      {seasons.map((season) => (
        <option key={season.id} value={season.id} className="bg-slate-900 text-white">
          {season.name}
        </option>
      ))}
    </select>
  )
}

export default TeamSeasonSelector
