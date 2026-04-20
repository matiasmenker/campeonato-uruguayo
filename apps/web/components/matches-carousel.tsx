"use client"

import { useState } from "react"
import {
  IconChevronLeft,
  IconChevronRight,
  IconClock,
  IconPlayerPlayFilled,
  IconShield,
} from "@tabler/icons-react"
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  useCarousel,
} from "@/components/ui/carousel"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { VideoModal } from "@/components/youtube-video-card"
import type { DashboardFixtureSummary, TeamSummary } from "@/lib/dashboard"
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

const getMatchStatus = (match: DashboardFixtureSummary) => {
  const stateCode = match.stateCode ?? ""

  if (LIVE_STATES.has(stateCode)) return "live" as const
  if (FINISHED_STATES.has(stateCode)) return "finished" as const
  if (match.homeScore !== null && match.awayScore !== null)
    return "finished" as const

  return "upcoming" as const
}

const formatMatchDay = (value: string | null) => {
  if (!value) return "Sin fecha"

  const formatted = new Intl.DateTimeFormat("es-UY", {
    weekday: "long",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "America/Montevideo",
  }).format(new Date(value))

  return formatted.charAt(0).toUpperCase() + formatted.slice(1)
}

const formatKickoffTime = (value: string | null) => {
  if (!value) return "--:--"

  return new Intl.DateTimeFormat("es-UY", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "America/Montevideo",
  }).format(new Date(value))
}

const getLiveLabel = (stateCode: string | null) => {
  if (stateCode === "HT") return "Entretiempo"
  if (stateCode === "INPLAY_ET" || stateCode === "INPLAY_ET_SECOND_HALF") {
    return "Prórroga"
  }
  if (stateCode === "INPLAY_PENALTIES") return "Penales"
  if (stateCode === "EXTRA_TIME_BREAK") return "Descanso"

  return "En vivo"
}

const getMinutePill = (stateCode: string | null, minute: number | null) => {
  const hasRunningClock =
    stateCode === "INPLAY_1ST_HALF" ||
    stateCode === "INPLAY_2ND_HALF" ||
    stateCode === "INPLAY_ET" ||
    stateCode === "INPLAY_ET_SECOND_HALF"

  if (!hasRunningClock || minute == null) return null

  return `${minute}'`
}

const getStatusBadge = (
  matchStatus: "live" | "finished" | "upcoming",
  stateCode: string | null,
  minute: number | null
) => {
  if (matchStatus === "live") {
    return {
      isLive: true,
      dotClassName: "bg-red-500",
      label: getLiveLabel(stateCode),
      textClassName: "text-red-200",
      wrapperClassName:
        "border-red-400/20 bg-red-500/16 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]",
    }
  }

  if (matchStatus === "finished") {
    return {
      isLive: false,
      dotClassName: "bg-emerald-400",
      label: "Finalizado",
      textClassName: "text-emerald-100",
      wrapperClassName:
        "border-emerald-400/20 bg-emerald-500/14 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]",
    }
  }

  return {
    isLive: false,
    dotClassName: "bg-white/45",
    label: "Próximo partido",
    textClassName: "text-white/80",
    wrapperClassName:
      "border-white/12 bg-white/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]",
  }
}

const CarouselPrevButton = () => {
  const { scrollPrev, canScrollPrev } = useCarousel()
  return (
    <button
      type="button"
      onClick={scrollPrev}
      disabled={!canScrollPrev}
      className={cn(
        "absolute top-1/2 left-0 z-10 hidden h-8 w-8 -translate-x-[calc(100%+10px)] -translate-y-1/2 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-xs transition-[opacity,box-shadow,background-color,color] hover:bg-slate-50 hover:text-slate-900 hover:shadow-sm sm:flex",
        !canScrollPrev && "pointer-events-none opacity-30"
      )}
      aria-label="Ir al partido anterior"
    >
      <IconChevronLeft size={15} />
    </button>
  )
}

const CarouselNextButton = () => {
  const { scrollNext, canScrollNext } = useCarousel()
  return (
    <button
      type="button"
      onClick={scrollNext}
      disabled={!canScrollNext}
      className={cn(
        "absolute top-1/2 right-0 z-10 hidden h-8 w-8 -translate-y-1/2 translate-x-[calc(100%+10px)] items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-xs transition-[opacity,box-shadow,background-color,color] hover:bg-slate-50 hover:text-slate-900 hover:shadow-sm sm:flex",
        !canScrollNext && "pointer-events-none opacity-30"
      )}
      aria-label="Ir al siguiente partido"
    >
      <IconChevronRight size={15} />
    </button>
  )
}

const TeamBadge = ({
  team,
  align = "start",
}: {
  team: TeamSummary | null
  align?: "start" | "end"
}) => {
  const name = team?.name ?? "Equipo"
  const imagePath = team?.imagePath ?? null
  const isEnd = align === "end"

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div
          className={cn(
            "flex min-w-0 flex-1 items-center gap-3",
            isEnd ? "flex-row-reverse text-right" : "text-left"
          )}
        >
          <div className="flex h-14 w-14 shrink-0 items-center justify-center">
            {imagePath ? (
              <img
                src={imagePath}
                alt={name}
                className="h-11 w-11 object-contain drop-shadow-sm"
              />
            ) : (
              <IconShield className="h-10 w-10 text-white/85 drop-shadow-sm" />
            )}
          </div>

          <p className="min-w-0 truncate text-[13px] font-semibold text-white">
            {name}
          </p>
        </div>
      </TooltipTrigger>
      <TooltipContent>
        <p>{name}</p>
      </TooltipContent>
    </Tooltip>
  )
}

interface MatchesCarouselProps {
  matches: DashboardFixtureSummary[]
  roundName?: string | null
  fixtureVideoMap?: Record<number, { videoId: string; title: string; thumbnailUrl: string; publishedAt: string }>
}

const MatchesCarousel = ({ matches, roundName, fixtureVideoMap = {} }: MatchesCarouselProps) => {
  const [activeVideo, setActiveVideo] = useState<{ videoId: string; title: string; thumbnailUrl: string; publishedAt: string } | null>(null)
  if (!matches.length) {
    return (
      <div className="flex h-32 items-center justify-center rounded-2xl border border-dashed border-slate-200 text-sm text-slate-400">
        No hay partidos disponibles
      </div>
    )
  }

  // Finished first (most recent → oldest), then live, then upcoming (soonest first)
  const statusOrder = { finished: 0, live: 1, upcoming: 2 } as const

  const sortedMatches = [...matches].sort((matchA, matchB) => {
    const statusA = getMatchStatus(matchA)
    const statusB = getMatchStatus(matchB)
    const orderA = statusOrder[statusA]
    const orderB = statusOrder[statusB]

    if (orderA !== orderB) return orderA - orderB

    const timeA = new Date(matchA.kickoffAt ?? 0).getTime()
    const timeB = new Date(matchB.kickoffAt ?? 0).getTime()

    // Finished: most recent first; upcoming: soonest first
    return statusA === "finished" ? timeB - timeA : timeA - timeB
  })

  return (
    <>
    <Carousel
      className="relative"
      opts={{
        align: "start",
        loop: false,
        containScroll: "keepSnaps",
        dragFree: false,
      }}
    >
      <CarouselPrevButton />
      <CarouselContent className="-ml-3">
          {sortedMatches.map((match) => {
            const status = getMatchStatus(match)
            const isLive = status === "live"
            const isFinished = status === "finished"
            const backgroundImage = match.venue?.imagePath
              ? `url("${match.venue.imagePath}")`
              : undefined
            const statusBadge = getStatusBadge(
              status,
              match.stateCode,
              match.minute
            )

            const matchVideo = fixtureVideoMap[match.id] ?? null

            return (
              <CarouselItem
                key={match.id}
                className="basis-1/2 pl-3 sm:basis-1/3 lg:basis-1/4"
              >
                <article className="group relative h-[188px] overflow-hidden rounded-[28px] bg-slate-900">
                  <div
                    className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-105"
                    style={{
                      backgroundImage,
                      backgroundColor: "#0f172a",
                    }}
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
                      <div className="flex items-center gap-2">
                        <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[10px] font-semibold tracking-[0.22em] text-white/80 uppercase backdrop-blur-sm">
                          {roundName ? `Fecha ${roundName}` : "Última fecha"}
                        </span>
                      </div>

                      <span className="text-[11px] font-medium text-white/78">
                        {formatMatchDay(match.kickoffAt)}
                      </span>
                    </div>

                    <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2">
                      <TeamBadge team={match.homeTeam} />

                      <div className="flex min-w-[96px] flex-col items-center rounded-[22px] border border-white/10 bg-black/20 px-4 py-2 text-center backdrop-blur-sm">
                        {isFinished || isLive ? (
                          <div className="flex items-center gap-3 text-white">
                            <span className="text-[1.65rem] leading-none font-black tabular-nums">
                              {match.homeScore ?? 0}
                            </span>
                            <span className="text-sm leading-none font-medium text-white/35">
                              —
                            </span>
                            <span className="text-[1.65rem] leading-none font-black tabular-nums">
                              {match.awayScore ?? 0}
                            </span>
                          </div>
                        ) : (
                          <div className="text-[1.65rem] leading-none font-black tracking-tight text-white">
                            {formatKickoffTime(match.kickoffAt)}
                          </div>
                        )}
                      </div>

                      <TeamBadge team={match.awayTeam} align="end" />
                    </div>

                    <div className="flex items-center justify-between">
                      <div
                        className={cn(
                          "flex items-center gap-2 rounded-full border px-3 py-1.5 backdrop-blur-sm",
                          statusBadge.wrapperClassName
                        )}
                      >
                        <span className="relative flex h-2 w-2">
                          {statusBadge.isLive ? (
                            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
                          ) : null}
                          <span
                            className={cn(
                              "relative inline-flex h-2 w-2 rounded-full",
                              statusBadge.dotClassName
                            )}
                          />
                        </span>
                        <span
                          className={cn(
                            "text-[11px] font-semibold",
                            statusBadge.textClassName
                          )}
                        >
                          {statusBadge.label}
                        </span>
                      </div>

                      {isLive && getMinutePill(match.stateCode, match.minute) ? (
                        <span className="flex items-center gap-1.5 rounded-full border border-red-400/20 bg-red-500/16 px-3 py-1.5 backdrop-blur-sm">
                          <IconClock size={11} className="text-red-300" />
                          <span className="text-[11px] font-black tabular-nums text-red-200">
                            {match.minute}
                            <span className="animate-pulse">&apos;</span>
                          </span>
                        </span>
                      ) : null}

                      {matchVideo ? (
                        <button
                          onClick={() => setActiveVideo(matchVideo)}
                          className="flex h-8 w-8 items-center justify-center rounded-full border border-white/15 bg-white/10 text-white backdrop-blur-sm transition-all hover:border-primary/50 hover:bg-primary hover:scale-110"
                          aria-label="Ver resumen del partido"
                        >
                          <IconPlayerPlayFilled size={13} className="translate-x-[1px]" />
                        </button>
                      ) : null}
                    </div>
                  </div>
                </article>
              </CarouselItem>
            )
          })}
        </CarouselContent>
      <CarouselNextButton />
    </Carousel>

    {activeVideo ? (
      <VideoModal video={activeVideo} onClose={() => setActiveVideo(null)} />
    ) : null}
    </>
  )
}

export default MatchesCarousel
