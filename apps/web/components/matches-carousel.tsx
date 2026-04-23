"use client"

import { useState } from "react"
import {
  IconChevronLeft,
  IconChevronRight,
} from "@tabler/icons-react"
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  useCarousel,
} from "@/components/ui/carousel"
import { VideoModal } from "@/components/youtube-video-card"
import MatchCard from "@/components/match-card"
import { getMatchStatus } from "@/components/match-card"
import type { DashboardFixtureSummary } from "@/lib/dashboard"
import { cn } from "@/lib/utils"

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
    const statusA = getMatchStatus(matchA.stateCode, matchA.homeScore, matchA.awayScore)
    const statusB = getMatchStatus(matchB.stateCode, matchB.homeScore, matchB.awayScore)
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
            const matchVideo = fixtureVideoMap[match.id] ?? null

            return (
              <CarouselItem
                key={match.id}
                className="basis-1/2 pl-3 sm:basis-1/3 lg:basis-1/4"
              >
                <MatchCard
                  id={match.id}
                  kickoffAt={match.kickoffAt}
                  homeScore={match.homeScore}
                  awayScore={match.awayScore}
                  stateCode={match.stateCode}
                  minute={match.minute}
                  venueImagePath={match.venue?.imagePath ?? null}
                  homeTeam={match.homeTeam}
                  awayTeam={match.awayTeam}
                  roundName={roundName ?? null}
                  onVideoClick={matchVideo ? () => setActiveVideo(matchVideo) : undefined}
                />
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
