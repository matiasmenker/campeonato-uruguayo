// Shared player card component — same design as home page top players.
// Used in: home page leaders, team detail squad grid.

const POSITION_CONFIG: Record<number, { label: string; bg: string }> = {
  24: { label: "AR", bg: "#f59e0b" },
  25: { label: "DF", bg: "#3b82f6" },
  26: { label: "MC", bg: "#10b981" },
  27: { label: "DL", bg: "#ef4444" },
}

const getPositionConfig = (positionId: number | null) =>
  positionId ? (POSITION_CONFIG[positionId] ?? { label: "—", bg: "#94a3b8" }) : { label: "—", bg: "#94a3b8" }

const getRatingColor = (value: number) => {
  if (value >= 8.0) return "#22c55e"
  if (value >= 7.0) return "#38bdf8"
  if (value >= 6.0) return "#f97316"
  return "#ef4444"
}

interface PlayerCardProps {
  name: string
  imagePath: string | null
  positionId: number | null
  teamImagePath?: string | null
  rating?: number | null
}

const PlayerCirclePhoto = ({ src, alt }: { src: string | null; alt: string }) => (
  <div style={{ width: 76, height: 76, borderRadius: "50%", overflow: "hidden", flexShrink: 0 }}>
    {src && !src.includes("placeholder") ? (
      <img src={src} alt={alt} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "top" }} />
    ) : (
      <svg viewBox="0 0 80 80" fill="none" style={{ width: "100%", height: "100%", background: "#f1f5f9" }}>
        <circle cx="40" cy="30" r="16" fill="#cbd5e1" />
        <path d="M12 78c0-15.464 12.536-28 28-28s28 12.536 28 28" fill="#cbd5e1" />
      </svg>
    )}
  </div>
)

const PlayerCard = ({ name, imagePath, positionId, teamImagePath, rating }: PlayerCardProps) => {
  const parts = name.split(" ")
  const first = parts[0]
  const last = parts.slice(1).join(" ")
  const positionConfig = getPositionConfig(positionId)
  const ratingColor = rating != null ? getRatingColor(rating) : "#94a3b8"

  return (
    <article
      className="relative flex flex-col overflow-hidden rounded-2xl"
      style={{
        aspectRatio: "2.5/3.5",
        background: "#f8fafc",
        boxShadow: "0 2px 12px rgba(15,23,42,0.07)",
        border: "1px solid #e2e8f0",
      }}
    >
      {/* Player name */}
      <div className="absolute inset-x-0 top-0 z-30 flex items-center justify-center px-3 pt-2.5" style={{ height: 40 }}>
        <div className="text-center">
          {last ? (
            <>
              <p className="text-[9px] font-black uppercase tracking-wide leading-tight text-slate-600">{first}</p>
              <p className="text-[11px] font-black uppercase tracking-wide leading-tight text-slate-600">{last}</p>
            </>
          ) : (
            <p className="text-[11px] font-black uppercase leading-tight text-slate-600">{first}</p>
          )}
        </div>
      </div>

      {/* Photo + position badge */}
      <div className="absolute inset-x-0 z-20 flex items-center justify-center" style={{ top: 42, bottom: 50 }}>
        <div className="relative">
          <PlayerCirclePhoto src={imagePath} alt={name} />
          <div
            style={{
              position: "absolute",
              bottom: 0,
              left: -4,
              width: 24,
              height: 24,
              borderRadius: "50%",
              background: positionConfig.bg,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: "2px solid #f8fafc",
              zIndex: 10,
            }}
          >
            <span style={{ fontSize: 8, fontWeight: 900, color: "white", letterSpacing: 0, lineHeight: 1 }}>
              {positionConfig.label}
            </span>
          </div>
        </div>
      </div>

      {/* Bottom strip */}
      <div className="absolute inset-x-0 bottom-0 z-30" style={{ height: 48 }}>
        <div className="absolute inset-0 bg-white" />
        <div className="absolute inset-x-0 top-0 h-px bg-slate-200" />
        <div className="relative z-10 flex h-full items-center justify-between px-3">
          {rating != null ? (
            <div className="flex items-center gap-1">
              <span className="text-xl font-black tabular-nums" style={{ color: ratingColor }}>
                {rating.toFixed(1)}
              </span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" style={{ color: ratingColor, opacity: 0.75, flexShrink: 0 }}>
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
            </div>
          ) : (
            <div className="h-5 w-10" />
          )}
          {teamImagePath && (
            <img src={teamImagePath} alt="" className="h-8 w-8 object-contain" />
          )}
        </div>
      </div>
    </article>
  )
}

export default PlayerCard
