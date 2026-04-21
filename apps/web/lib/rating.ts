/**
 * Centralized rating color system.
 *
 * Scale (matches the official rating gradient):
 *   < 6.0   → red      (poor)
 *   6.0–6.4 → orange   (below average)
 *   6.5–6.9 → amber    (average)
 *   7.0–7.9 → lime     (good)
 *   8.0–8.9 → green    (very good)
 *   ≥ 9.0   → cyan     (outstanding)
 */

export interface RatingColorSet {
  /** Solid fill — use for backgrounds, badges, pills */
  fill: string
  /** Muted/transparent variant — use for subtle backgrounds (e.g. 15% opacity ring) */
  muted: string
  /** Text color — always legible on white backgrounds */
  text: string
}

export const getRatingColors = (rating: number): RatingColorSet => {
  if (rating >= 9.0) return { fill: "#06b6d4", muted: "rgba(6,182,212,0.15)", text: "#0e7490" }   // cyan-500 / cyan-700
  if (rating >= 8.0) return { fill: "#22c55e", muted: "rgba(34,197,94,0.15)",  text: "#15803d" }   // green-500 / green-700
  if (rating >= 7.0) return { fill: "#84cc16", muted: "rgba(132,204,22,0.15)", text: "#4d7c0f" }   // lime-500 / lime-700
  if (rating >= 6.5) return { fill: "#f59e0b", muted: "rgba(245,158,11,0.15)", text: "#b45309" }   // amber-500 / amber-700
  if (rating >= 6.0) return { fill: "#f97316", muted: "rgba(249,115,22,0.15)", text: "#c2410c" }   // orange-500 / orange-700
  return                      { fill: "#ef4444", muted: "rgba(239,68,68,0.15)",  text: "#b91c1c" }  // red-500 / red-700
}

/** Convenience — just the fill hex. Most common usage. */
export const getRatingFill = (rating: number): string => getRatingColors(rating).fill

/** Convenience — text color for use on white/light backgrounds. */
export const getRatingText = (rating: number): string => getRatingColors(rating).text
