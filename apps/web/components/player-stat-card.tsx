import React from "react"
import { getRatingColors } from "@/lib/rating"
import { DASH } from "@/lib/display"

export const StatCard = ({
  label,
  value,
  icon,
  hasData,
}: {
  label: string
  value: string | number | null
  icon: React.ReactNode
  hasData: boolean
}) => (
  <div
    data-testid="stat-card"
    data-has-data={hasData ? "true" : "false"}
    className="flex flex-col items-center gap-2 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm text-center"
  >
    <div className="flex h-9 w-9 items-center justify-center">{icon}</div>
    <div className="flex flex-col items-center gap-0.5">
      <span className="text-2xl font-black tabular-nums text-slate-900 leading-none">
        {hasData && value !== null ? value : DASH}
      </span>
      <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
        {label}
      </span>
    </div>
  </div>
)

export const RatingStatCard = ({
  avgRating,
  hasData,
}: {
  avgRating: number | null
  hasData: boolean
}) => {
  const colors = hasData && avgRating !== null ? getRatingColors(avgRating) : null
  return (
    <div
      data-testid="rating-stat-card"
      data-has-data={hasData && avgRating !== null ? "true" : "false"}
      className="flex flex-col items-center gap-2 rounded-2xl border p-4 shadow-sm text-center"
      style={{ backgroundColor: "#eff6ff", borderColor: "#93c5fd" }}
    >
      <div className="flex h-9 w-9 items-center justify-center">
        <svg width={20} height={20} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M12 3l2.472 6.218L21 9.764l-4.944 4.33L17.472 21 12 17.27 6.528 21l1.416-6.906L3 9.764l6.528-.546Z"
            fill={colors?.fill ?? "#94a3b8"}
          />
        </svg>
      </div>
      <div className="flex flex-col items-center gap-0.5">
        <span
          className="text-2xl font-black tabular-nums leading-none"
          style={{ color: colors?.text ?? "#1e40af" }}
        >
          {hasData && avgRating !== null ? avgRating.toFixed(2) : DASH}
        </span>
        <span className="text-[10px] font-semibold uppercase tracking-wide text-blue-400">
          Avg rating
        </span>
      </div>
    </div>
  )
}
