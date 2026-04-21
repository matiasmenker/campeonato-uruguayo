"use client"

import { useTransition } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import type { Season } from "@/lib/seasons"

interface TeamsSeasonSelectorProps {
  seasons: Season[]
  selectedSeasonId: number
}

const selectClassName =
  "appearance-none rounded-xl border border-slate-200 bg-white py-2 pl-4 pr-9 text-sm font-medium text-slate-700 shadow-sm outline-none transition-colors hover:border-slate-300 focus:border-primary focus:ring-2 focus:ring-primary/20 bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2216%22%20height%3D%2216%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%2394a3b8%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpath%20d%3D%22M6%209l6%206%206-6%22%2F%3E%3C%2Fsvg%3E')] bg-[right_12px_center] bg-no-repeat cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed w-28"

const Spinner = () => (
  <svg className="h-4 w-4 animate-spin text-slate-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
  </svg>
)

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
    <div className="flex items-center gap-3">
      {isPending && <Spinner />}
      <select
        value={selectedSeasonId}
        onChange={(event) => handleChange(event.target.value)}
        disabled={isPending}
        className={selectClassName}
      >
        {seasons.map((season) => (
          <option key={season.id} value={season.id}>
            {season.name}
          </option>
        ))}
      </select>
    </div>
  )
}

export default TeamsSeasonSelector
