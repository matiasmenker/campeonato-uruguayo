import { getRatingFill } from "@/lib/rating"
import { resolvePlayerImageUrl } from "@/lib/player"

const POSITION_CONFIG: Record<number, { label: string; bg: string }> = {
  24: { label: "AR", bg: "#f59e0b" },
  25: { label: "DF", bg: "#3b82f6" },
  26: { label: "MC", bg: "#10b981" },
  27: { label: "DL", bg: "#ef4444" },
}

const getPositionConfig = (positionId: number | null) =>
  positionId ? (POSITION_CONFIG[positionId] ?? { label: "—", bg: "#94a3b8" }) : { label: "—", bg: "#94a3b8" }

interface PlayerCardProps {
  name: string
  imagePath: string | null
  positionId: number | null
  teamImagePath?: string | null
  rating?: number | null
}

const PlayerCirclePhoto = ({ src, alt }: { src: string | null; alt: string }) => (
  <div style={{ width: 76, height: 76, borderRadius: "50%", overflow: "hidden", flexShrink: 0 }}>
    <img src={resolvePlayerImageUrl(src)} alt={alt} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "top" }} />
  </div>
)

const PlayerCard = ({ name, imagePath, positionId, teamImagePath, rating }: PlayerCardProps) => {
  const parts = name.split(" ")
  const first = parts[0]
  const last = parts.slice(1).join(" ")
  const positionConfig = getPositionConfig(positionId)
  const ratingColor = rating != null ? getRatingFill(rating) : "#94a3b8"

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

      <div className="absolute inset-x-0 bottom-0 z-30" style={{ height: 48 }}>
        <div className="absolute inset-0 bg-white" />
        <div className="absolute inset-x-0 top-0 h-px bg-slate-200" />
        <div className="relative z-10 flex h-full items-center justify-between px-3">
          {rating != null ? (
            <div className="flex items-center gap-0.5">
              <svg width={12} height={12} viewBox="0 0 24 24" fill={ratingColor} xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
              <span className="tabular-nums font-black text-[13px]" style={{ color: ratingColor }}>{rating.toFixed(1)}</span>
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
