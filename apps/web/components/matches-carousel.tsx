"use client"
import { IconChevronLeft, IconChevronRight } from "@tabler/icons-react"
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  useCarousel,
} from "@/components/ui/carousel"

const CarouselArrows = () => {
  const { scrollPrev, scrollNext, canScrollPrev, canScrollNext } = useCarousel()
  return (
    <>
      {canScrollPrev && (
        <button
          onClick={scrollPrev}
          className="absolute -left-8 top-1/2 z-10 -translate-y-1/2 flex h-7 w-7 items-center justify-center rounded-full border border-slate-200 bg-white shadow-sm text-slate-500 hover:border-slate-300 hover:text-slate-800 hover:shadow-md transition-[box-shadow,border-color,color]"
        >
          <IconChevronLeft size={14} />
        </button>
      )}
      {canScrollNext && (
        <button
          onClick={scrollNext}
          className="absolute -right-8 top-1/2 z-10 -translate-y-1/2 flex h-7 w-7 items-center justify-center rounded-full border border-slate-200 bg-white shadow-sm text-slate-500 hover:border-slate-300 hover:text-slate-800 hover:shadow-md transition-[box-shadow,border-color,color]"
        >
          <IconChevronRight size={14} />
        </button>
      )}
    </>
  )
}
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import type { DashboardFixtureSummary, TeamSummary } from "@/lib/dashboard"


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
  const developerName = match.stateCode ?? ""
  if (LIVE_STATES.has(developerName)) return "live" as const
  if (FINISHED_STATES.has(developerName)) return "finished" as const
  if (match.homeScore !== null && match.awayScore !== null) return "finished" as const
  return "upcoming" as const
}

const formatDate = (value: string | null) => {
  if (!value) return ""
  const date = new Date(value)
  const timeZone = "America/Montevideo"
  const weekday = new Intl.DateTimeFormat("es-UY", { weekday: "long", timeZone }).format(date)
  const dayMonthYear = new Intl.DateTimeFormat("es-UY", { day: "2-digit", month: "2-digit", year: "numeric", timeZone }).format(date)
  return `${weekday.charAt(0).toUpperCase() + weekday.slice(1)}, ${dayMonthYear}`
}

const formatTime = (value: string | null) => {
  if (!value) return "--:--"
  return new Intl.DateTimeFormat("es-UY", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "America/Montevideo",
  }).format(new Date(value))
}

const getLiveLabel = (developerName: string | null) => {
  if (developerName === "HT") return "Entretiempo"
  if (developerName === "INPLAY_ET" || developerName === "INPLAY_ET_SECOND_HALF") return "Prórroga"
  if (developerName === "INPLAY_PENALTIES") return "Penales"
  if (developerName === "EXTRA_TIME_BREAK") return "Desc. prórroga"
  return "En vivo"
}

// Returns "37'" only for states with a running clock.
// HT, Penales, etc. return null — the bottom label already covers them.
const getMinutePill = (developerName: string | null, minute: number | null): string | null => {
  const hasRunningClock =
    developerName === "INPLAY_1ST_HALF" ||
    developerName === "INPLAY_2ND_HALF" ||
    developerName === "INPLAY_ET" ||
    developerName === "INPLAY_ET_SECOND_HALF"
  if (!hasRunningClock || minute == null) return null
  return `${minute}'`
}

const TeamLogo = ({ team }: { team: TeamSummary | null }) => {
  const name = team?.name ?? "—"
  const imagePath = team?.imagePath ?? null

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="flex h-6 w-6 shrink-0 items-center justify-center">
          {imagePath ? (
            <img src={imagePath} alt={name} className="h-6 w-6 object-contain drop-shadow-sm" />
          ) : (
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-white/15 text-[8px] font-bold text-white backdrop-blur-sm">
              {name.slice(0, 2).toUpperCase()}
            </div>
          )}
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
}

const MatchesCarousel = ({ matches, roundName }: MatchesCarouselProps) => {
  if (!matches.length) {
    return (
      <div className="flex h-32 items-center justify-center rounded-2xl border border-dashed border-slate-200 text-sm text-slate-400">
        No hay partidos disponibles
      </div>
    )
  }

  const statusOrder = { live: 0, upcoming: 1, finished: 2 } as const

  const sortedMatches = [...matches].sort((matchA, matchB) => {
    const orderA = statusOrder[getMatchStatus(matchA)]
    const orderB = statusOrder[getMatchStatus(matchB)]
    if (orderA !== orderB) return orderA - orderB
    return new Date(matchA.kickoffAt ?? 0).getTime() - new Date(matchB.kickoffAt ?? 0).getTime()
  })

  return (
    <div className="relative sm:px-8">
    <Carousel opts={{ align: "start", loop: false, containScroll: "keepSnaps", skipSnaps: false, dragFree: false }}>
      <CarouselContent className="-ml-2">
        {sortedMatches.map((match) => {
          const status = getMatchStatus(match)
          const isLive = status === "live"
          const isFinished = status === "finished"
          const hasVenueImage = !!match.venue?.imagePath
          const minutePill = isLive ? getMinutePill(match.stateCode, match.minute) : null

          return (
            <CarouselItem key={match.id} className="pl-2 basis-2/5 sm:basis-1/4 lg:basis-1/6">
              <div className="relative h-24 overflow-hidden rounded-xl">

                {/* Background */}
                {hasVenueImage ? (
                  <img
                    src={match.venue!.imagePath!}
                    alt={match.venue!.name}
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                ) : null}

                <div
                  className="absolute inset-0"
                  style={{
                    background: hasVenueImage
                      ? "linear-gradient(to top, rgba(5,10,20,0.95) 0%, rgba(5,10,20,0.7) 50%, rgba(5,10,20,0.45) 100%)"
                      : "linear-gradient(145deg, #0f172a 0%, #1e293b 60%, #0f172a 100%)",
                  }}
                />
                {!hasVenueImage ? (
                  <div
                    className="absolute inset-0"
                    style={{
                      background: "radial-gradient(ellipse at 50% 60%, rgba(255,255,255,0.04) 0%, transparent 70%)",
                    }}
                  />
                ) : null}

                {/* Red pulse overlay for live */}
                {isLive ? <div className="absolute inset-0 bg-red-950/25" /> : null}

                {/* Content */}
                <div className="absolute inset-0 flex flex-col justify-between p-2">

                  {/* Top row: round badge + minute pill (live) or date */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="shrink-0 whitespace-nowrap rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-semibold tracking-widest text-white/70 uppercase backdrop-blur-sm">
                      {roundName ? `Fecha ${roundName}` : "Fecha"}
                    </span>
                    {isLive && minutePill ? (
                      <span className="whitespace-nowrap rounded-full bg-red-500/80 px-2 py-0.5 text-[10px] font-bold tabular-nums text-white backdrop-blur-sm">
                        {minutePill}
                      </span>
                    ) : (
                      <span className="whitespace-nowrap text-[10px] text-white/50">
                        {formatDate(match.kickoffAt)}
                      </span>
                    )}
                  </div>

                  {/* Score / time */}
                  <div className="flex items-center justify-between gap-1">
                    <TeamLogo team={match.homeTeam} />
                    {isFinished || isLive ? (
                      <div className="flex items-center gap-1">
                        <span className="text-base font-black tabular-nums text-white">{match.homeScore}</span>
                        <span className="text-[10px] font-medium text-white/30">—</span>
                        <span className="text-base font-black tabular-nums text-white">{match.awayScore}</span>
                      </div>
                    ) : (
                      <span className="text-base font-black tabular-nums text-white/60">
                        {formatTime(match.kickoffAt)}
                      </span>
                    )}
                    <TeamLogo team={match.awayTeam} />
                  </div>

                  {/* Status row */}
                  <div className="flex items-center gap-1.5">
                    {isLive ? (
                      <>
                        <span className="relative flex h-2 w-2">
                          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
                          <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500" />
                        </span>
                        <span className="text-[10px] font-semibold text-red-400">
                          {getLiveLabel(match.stateCode)}
                        </span>
                      </>
                    ) : isFinished ? (
                      <>
                        <div className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                        <span className="text-[10px] text-emerald-400/80">Finalizado</span>
                      </>
                    ) : (
                      <>
                        <div className="h-1.5 w-1.5 rounded-full bg-white/30" />
                        <span className="text-[10px] text-white/40">Por jugar</span>
                      </>
                    )}
                  </div>

                </div>
              </div>
            </CarouselItem>
          )
        })}
      </CarouselContent>
      <CarouselArrows />
    </Carousel>
    </div>
  )
}

export default MatchesCarousel
