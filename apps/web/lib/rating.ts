/**
 * Centralized rating color system.
 *
 * Based on the official SofaScore rating scale:
 *
 *   ≥ 9.0  → blue        (perfect / outstanding)
 *   ≥ 8.0  → teal        (very good)
 *   ≥ 7.0  → green       (good)
 *   ≥ 6.5  → gold/amber  (starting rating — baseline)
 *   ≥ 6.0  → orange      (below average)
 *   ≥ 5.0  → dark red    (poor)
 *   < 5.0  → bright red  (very poor / minimal)
 */

export interface RatingColorSet {
  /** Solid fill — use for backgrounds, badges, pills */
  fill: string
  /** Muted/transparent variant — use for subtle backgrounds */
  muted: string
  /** Text color — legible on white/light backgrounds */
  text: string
}

export const getRatingColors = (rating: number): RatingColorSet => {
  // Round to 1 decimal so the color matches exactly what is displayed on screen.
  // e.g. 5.95 rounds to 6.0 and should show orange, not dark red.
  const r = Math.round(rating * 10) / 10

  if (r >= 9.0) return { fill: "#2563eb", muted: "rgba(37,99,235,0.15)",  text: "#1d4ed8" }  // blue-600
  if (r >= 8.0) return { fill: "#38bdf8", muted: "rgba(56,189,248,0.15)", text: "#0369a1" }  // sky-400 (celeste)
  if (r >= 7.0) return { fill: "#16a34a", muted: "rgba(22,163,74,0.15)",  text: "#15803d" }  // green-600
  if (r >= 6.5) return { fill: "#ca8a04", muted: "rgba(202,138,4,0.15)",  text: "#a16207" }  // yellow-600
  if (r >= 6.0) return { fill: "#ea580c", muted: "rgba(234,88,12,0.15)",  text: "#c2410c" }  // orange-600
  if (r >= 5.0) return { fill: "#b91c1c", muted: "rgba(185,28,28,0.15)",  text: "#991b1b" }  // red-700
  return                { fill: "#dc2626", muted: "rgba(220,38,38,0.15)",  text: "#b91c1c" }  // red-600
}

/** Convenience — just the fill hex. Most common usage. */
export const getRatingFill = (rating: number): string => getRatingColors(rating).fill

/** Convenience — text color for use on white/light backgrounds. */
export const getRatingText = (rating: number): string => getRatingColors(rating).text
