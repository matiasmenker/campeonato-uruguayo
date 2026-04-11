"use client"
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
} from "@/components/ui/carousel"
import type { DashboardFixtureSummary } from "@/lib/dashboard"

const formatMatchDate = (value: string | null) => {
  if (!value) return "Sin fecha"
  return new Intl.DateTimeFormat("es-UY", {
    weekday: "short",
    day: "numeric",
    month: "short",
    timeZone: "America/Montevideo",
  }).format(new Date(value))
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

  return (
    <div className="relative px-12">
      <Carousel opts={{ align: "start", loop: false }}>
        <CarouselContent className="-ml-4">
          {matches.map((match) => (
            <CarouselItem
              key={match.id}
              className="pl-4 basis-1/2 sm:basis-1/3 lg:basis-1/4"
            >
              <div className="relative h-36 overflow-hidden rounded-2xl">
                {match.venue?.imagePath ? (
                  <img
                    src={match.venue.imagePath}
                    alt={match.venue.name}
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                ) : null}

                <div
                  className="absolute inset-0"
                  style={{
                    background: match.venue?.imagePath
                      ? "linear-gradient(to top, rgba(5,10,20,0.92) 0%, rgba(5,10,20,0.65) 50%, rgba(5,10,20,0.4) 100%)"
                      : "linear-gradient(150deg, #0a1628 0%, #0c2b1a 30%, #0a3320 55%, #071a10 80%, #050d1a 100%)",
                  }}
                />

                {!match.venue?.imagePath ? (
                  <>
                    <div
                      className="absolute inset-0 opacity-[0.06]"
                      style={{
                        backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 19px, rgba(255,255,255,0.6) 19px, rgba(255,255,255,0.6) 20px), repeating-linear-gradient(90deg, transparent, transparent 19px, rgba(255,255,255,0.6) 19px, rgba(255,255,255,0.6) 20px)`,
                      }}
                    />
                    <div className="absolute top-1/2 left-1/2 h-24 w-24 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/10" />
                  </>
                ) : null}

                <div className="absolute inset-0 flex flex-col justify-between p-4">
                  <div className="flex items-center justify-between">
                    <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-semibold tracking-widest text-white/70 uppercase backdrop-blur-sm">
                      {roundName ? `Fecha ${roundName}` : "Fecha"}
                    </span>
                    <span className="text-[10px] text-white/50">
                      {formatMatchDate(match.kickoffAt)}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="min-w-0 flex-1 text-left">
                      <p className="truncate text-xs font-bold leading-tight text-white">
                        {match.homeTeam?.name ?? "Local"}
                      </p>
                    </div>

                    <div className="flex shrink-0 items-center gap-1 rounded-lg bg-white/10 px-3 py-1.5 backdrop-blur-sm">
                      <span className="text-xl font-black tabular-nums text-white">
                        {match.homeScore ?? "-"}
                      </span>
                      <span className="text-sm font-light text-white/30">:</span>
                      <span className="text-xl font-black tabular-nums text-white">
                        {match.awayScore ?? "-"}
                      </span>
                    </div>

                    <div className="min-w-0 flex-1 text-right">
                      <p className="truncate text-xs font-bold leading-tight text-white">
                        {match.awayTeam?.name ?? "Visitante"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <div className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                      <span className="text-[10px] text-emerald-400/80">Finalizado</span>
                    </div>
                    {match.venue ? (
                      <span className="truncate text-[10px] text-white/35">
                        {match.venue.name}
                      </span>
                    ) : null}
                  </div>
                </div>
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious className="border-slate-200 bg-white shadow-sm hover:bg-slate-50" />
        <CarouselNext className="border-slate-200 bg-white shadow-sm hover:bg-slate-50" />
      </Carousel>
    </div>
  )
}

export default MatchesCarousel
