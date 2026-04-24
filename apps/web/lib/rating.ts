export interface RatingColorSet {
  fill: string
  muted: string
  text: string
}

export const getRatingColors = (rating: number): RatingColorSet => {
  const r = Math.round(rating * 10) / 10

  if (r >= 9.0) return { fill: "#2563eb", muted: "rgba(37,99,235,0.15)",  text: "#1d4ed8" }
  if (r >= 8.0) return { fill: "#38bdf8", muted: "rgba(56,189,248,0.15)", text: "#0369a1" }
  if (r >= 7.0) return { fill: "#16a34a", muted: "rgba(22,163,74,0.15)",  text: "#15803d" }
  if (r >= 6.5) return { fill: "#ca8a04", muted: "rgba(202,138,4,0.15)",  text: "#a16207" }
  if (r >= 6.0) return { fill: "#ea580c", muted: "rgba(234,88,12,0.15)",  text: "#c2410c" }
  if (r >= 5.0) return { fill: "#b91c1c", muted: "rgba(185,28,28,0.15)",  text: "#991b1b" }
  return                { fill: "#dc2626", muted: "rgba(220,38,38,0.15)",  text: "#b91c1c" }
}

export const getRatingFill = (rating: number): string => getRatingColors(rating).fill

export const getRatingText = (rating: number): string => getRatingColors(rating).text
