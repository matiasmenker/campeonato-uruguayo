"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { IconShield, IconClock, IconPlayerPlayFilled } from "@tabler/icons-react"
import { cn } from "@/lib/utils"

const LIVE_STATES = new Set([
  "INPLAY_1ST_HALF",
  "INPLAY_2ND_HALF",
  "HT",
  "INPLAY_ET",
  "INPLAY_ET_SECOND_HALF",
  "INPLAY_PENALTIES",
  "EXTRA_TIME_BREAK",
  "BREAK",
])

const FINISHED_STATES = new Set(["FT", "AET", "FT_PEN", "AWARDED"])

export const getMatchStatus = (
  stateCode: string | null,
  _homeScore: number | null,
  _awayScore: number | null,
  _kickoffAt: string | null = null,
): "live" | "finished" | "upcoming" => {
  if (stateCode && LIVE_STATES.has(stateCode)) return "live"
  if (stateCode && FINISHED_STATES.has(stateCode)) return "finished"
  return "upcoming"
}

const getLiveLabel = (stateCode: string | null) => {
  if (stateCode === "HT") return "Half time"
  if (stateCode === "INPLAY_ET" || stateCode === "INPLAY_ET_SECOND_HALF") return "Extra time"
  if (stateCode === "INPLAY_PENALTIES") return "Penalties"
  if (stateCode === "EXTRA_TIME_BREAK") return "Break"
  return "Live"
}

export const getStatusBadge = (
  stateCode: string | null,
  homeScore: number | null,
  awayScore: number | null,
  kickoffAt: string | null = null,
) => {
  const status = getMatchStatus(stateCode, homeScore, awayScore, kickoffAt)
  if (status === "live") {
    return {
      isLive: true,
      dotClassName: "bg-red-500",
      label: getLiveLabel(stateCode),
      textClassName: "text-red-200",
      wrapperClassName: "border-red-400/20 bg-red-500/16 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]",
    }
  }
  if (status === "finished") {
    return {
      isLive: false,
      dotClassName: "bg-emerald-400",
      label: "Finished",
      textClassName: "text-emerald-100",
      wrapperClassName: "border-emerald-400/20 bg-emerald-500/14 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]",
    }
  }
  return {
    isLive: false,
    dotClassName: "bg-white/45",
    label: "Upcoming",
    textClassName: "text-white/80",
    wrapperClassName: "border-white/12 bg-white/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]",
  }
}

export const formatMatchDay = (value: string | null) => {
  if (!value) return "No date"
  const formatted = new Intl.DateTimeFormat("en-GB", {
    weekday: "long",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "America/Montevideo",
  }).format(new Date(value))
  return formatted.charAt(0).toUpperCase() + formatted.slice(1)
}

export const formatKickoffTime = (value: string | null) => {
  if (!value) return "--:--"
  return new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "America/Montevideo",
  }).format(new Date(value))
}

export const TeamBadge = ({
  team,
  align = "start",
}: {
  team: { id: number; name: string; imagePath: string | null } | null
  align?: "start" | "end"
}) => {
  const name = team?.name ?? "Team"
  const imagePath = team?.imagePath ?? null
  const isEnd = align === "end"
  const teamHref = team?.id ? `/teams/${team.id}` : null

  const logo = (
    <div className="flex h-14 w-14 shrink-0 items-center justify-center">
      {imagePath ? (
        <img
          src={imagePath}
          alt={name}
          className="h-11 w-11 object-contain drop-shadow-sm transition-transform duration-150 group-hover:scale-110"
        />
      ) : (
        <IconShield className="h-10 w-10 text-white/85 drop-shadow-sm" />
      )}
    </div>
  )

  if (teamHref) {
    return (
      <Link
        href={teamHref}
        className={cn(
          "group flex min-w-0 flex-1 items-center gap-3",
          isEnd ? "flex-row-reverse text-right" : "text-left"
        )}
        onClick={(event) => event.stopPropagation()}
      >
        {logo}
        <p className="min-w-0 truncate text-[13px] font-semibold text-white">{name}</p>
      </Link>
    )
  }

  return (
    <div className={cn("flex min-w-0 flex-1 items-center gap-3", isEnd ? "flex-row-reverse text-right" : "text-left")}>
      {logo}
      <p className="min-w-0 truncate text-[13px] font-semibold text-white">{name}</p>
    </div>
  )
}

export interface MatchCardProps {
  id: number
  kickoffAt: string | null
  homeScore: number | null
  awayScore: number | null
  stateCode: string | null
  minute?: number | null
  venueImagePath?: string | null
  homeTeam: { id: number; name: string; imagePath: string | null } | null
  awayTeam: { id: number; name: string; imagePath: string | null } | null
  roundName?: string | null
  onVideoClick?: () => void
}

const MatchCard = ({
  id,
  kickoffAt,
  homeScore,
  awayScore,
  stateCode,
  minute = null,
  venueImagePath,
  homeTeam,
  awayTeam,
  roundName,
  onVideoClick,
}: MatchCardProps) => {
  const router = useRouter()
  const status = getMatchStatus(stateCode, homeScore, awayScore, kickoffAt)
  const isLive = status === "live"
  const isFinished = status === "finished"
  const backgroundImage = venueImagePath ? `url("${venueImagePath}")` : undefined
  const statusBadge = getStatusBadge(stateCode, homeScore, awayScore, kickoffAt)

  const hasRunningMinute =
    minute != null &&
    (stateCode === "INPLAY_1ST_HALF" ||
      stateCode === "INPLAY_2ND_HALF" ||
      stateCode === "INPLAY_ET" ||
      stateCode === "INPLAY_ET_SECOND_HALF")

  return (
    <article
      className="group relative h-[188px] overflow-hidden rounded-[28px] bg-slate-900 cursor-pointer"
      onClick={() => router.push(`/matches/${id}`)}
      onKeyDown={(event) => { if (event.key === "Enter") router.push(`/matches/${id}`) }}
      role="link"
      tabIndex={0}
    >
        <div
          className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-105"
          style={{ backgroundImage, backgroundColor: "#0f172a" }}
        />
        <div
          className="absolute inset-0"
          style={{
            background: backgroundImage
              ? "linear-gradient(145deg, rgba(2,6,23,0.84) 0%, rgba(15,23,42,0.54) 42%, rgba(6,95,70,0.42) 100%)"
              : "linear-gradient(145deg, #0f172a 0%, #123528 50%, #0b1b16 100%)",
          }}
        />

        <div className="relative flex h-full flex-col justify-between p-4 sm:p-5">
          <div className="flex items-start justify-between gap-3">
            <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[10px] font-semibold tracking-[0.22em] text-white/80 uppercase backdrop-blur-sm">
              {roundName ? `Round ${roundName}` : "Latest round"}
            </span>
            <span className="text-[11px] font-medium text-white/78">
              {formatMatchDay(kickoffAt)}
            </span>
          </div>

          <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2">
            <TeamBadge team={homeTeam} />
            <div className="flex min-w-[96px] flex-col items-center rounded-[22px] border border-white/10 bg-black/20 px-4 py-2 text-center backdrop-blur-sm">
              {isFinished || isLive ? (
                <div className="flex items-center gap-3 text-white">
                  <span className="text-[1.65rem] leading-none font-black tabular-nums">
                    {homeScore ?? 0}
                  </span>
                  <span className="text-sm leading-none font-medium text-white/35">—</span>
                  <span className="text-[1.65rem] leading-none font-black tabular-nums">
                    {awayScore ?? 0}
                  </span>
                </div>
              ) : (
                <div className="text-[1.65rem] leading-none font-black tracking-tight text-white">
                  {formatKickoffTime(kickoffAt)}
                </div>
              )}
            </div>
            <TeamBadge team={awayTeam} align="end" />
          </div>

          <div className="flex items-center justify-between">
            <div
              className={cn(
                "flex items-center gap-2 rounded-full border px-3 py-1.5 backdrop-blur-sm",
                statusBadge.wrapperClassName
              )}
            >
              <span className="relative flex h-2 w-2">
                {statusBadge.isLive && (
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
                )}
                <span className={cn("relative inline-flex h-2 w-2 rounded-full", statusBadge.dotClassName)} />
              </span>
              <span className={cn("text-[11px] font-semibold", statusBadge.textClassName)}>
                {statusBadge.label}
              </span>
            </div>

            {isLive && hasRunningMinute && (
              <span className="flex items-center gap-1.5 rounded-full border border-red-400/20 bg-red-500/16 px-3 py-1.5 backdrop-blur-sm">
                <IconClock size={11} className="text-red-300" />
                <span className="text-[11px] font-black tabular-nums text-red-200">
                  {minute}
                  <span className="animate-pulse">&apos;</span>
                </span>
              </span>
            )}

            {onVideoClick && (
              <button
                onClick={(event) => {
                  event.preventDefault()
                  event.stopPropagation()
                  onVideoClick()
                }}
                className="flex h-8 w-8 items-center justify-center rounded-full border border-white/15 bg-white/10 text-white backdrop-blur-sm transition-all hover:border-primary/50 hover:bg-primary hover:scale-110"
                aria-label="Watch match highlights"
              >
                <IconPlayerPlayFilled size={13} className="translate-x-[1px]" />
              </button>
            )}
          </div>
        </div>
    </article>
  )
}

export default MatchCard
