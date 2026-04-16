"use client"

import { useEffect, useState } from "react"
import { IconPlayerPlayFilled, IconX } from "@tabler/icons-react"
import { createPortal } from "react-dom"

export type YoutubeVideo = {
  videoId: string
  title: string
  thumbnailUrl: string
  publishedAt: string
}

const formatVideoDate = (isoDate: string) =>
  new Intl.DateTimeFormat("es-UY", {
    day: "numeric",
    month: "short",
    timeZone: "America/Montevideo",
  }).format(new Date(isoDate))

export const VideoModal = ({
  video,
  onClose,
}: {
  video: YoutubeVideo
  onClose: () => void
}) => {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose()
    }
    document.addEventListener("keydown", onKeyDown)
    document.body.style.overflow = "hidden"
    return () => {
      document.removeEventListener("keydown", onKeyDown)
      document.body.style.overflow = ""
    }
  }, [onClose])

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-8"
      role="dialog"
      aria-modal="true"
      aria-label={video.title}
    >
      <div
        className="absolute inset-0 bg-slate-950/85 backdrop-blur-md"
        onClick={onClose}
      />

      <div className="relative z-10 w-full max-w-4xl animate-in fade-in zoom-in-95 duration-200">
        <div className="mb-3 flex items-start justify-between gap-4 px-1">
          <div>
            <p className="text-[11px] font-semibold tracking-[0.18em] text-emerald-400 uppercase">
              AUF TV
            </p>
            <h2 className="mt-0.5 line-clamp-2 text-sm font-bold leading-snug text-white sm:text-base">
              {video.title}
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              {formatVideoDate(video.publishedAt)}
            </p>
          </div>
          <button
            onClick={onClose}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/8 text-slate-400 backdrop-blur-sm transition-colors hover:border-white/20 hover:bg-white/15 hover:text-white"
          >
            <IconX size={16} />
          </button>
        </div>

        <div className="overflow-hidden rounded-2xl border border-white/8 shadow-[0_32px_80px_-16px_rgba(0,0,0,0.8)]">
          <div className="relative aspect-video w-full bg-slate-950">
            <iframe
              src={`https://www.youtube.com/embed/${video.videoId}?autoplay=1&rel=0&modestbranding=1`}
              title={video.title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
              allowFullScreen
              className="absolute inset-0 h-full w-full"
            />
          </div>
        </div>

        <div className="mx-auto mt-3 h-px w-24 bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent" />
      </div>
    </div>,
    document.body,
  )
}

export const YoutubeVideoCard = ({ video }: { video: YoutubeVideo }) => {
  const [isModalOpen, setIsModalOpen] = useState(false)

  return (
    <>
      <article
        className="group cursor-pointer overflow-hidden rounded-2xl bg-slate-950 shadow-[0_8px_32px_-8px_rgba(15,23,42,0.6)] transition-transform duration-200 hover:-translate-y-0.5"
        onClick={() => setIsModalOpen(true)}
      >
        <div className="relative aspect-video w-full overflow-hidden">
          <img
            src={video.thumbnailUrl}
            alt={video.title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />

          {/* Fade que se une con el fondo de la card */}
          <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />

          {/* Play button centrado en el thumbnail */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-black/60 transition-all duration-200 group-hover:scale-110 group-hover:bg-black/80">
              <IconPlayerPlayFilled size={22} className="translate-x-[2px] text-white" />
            </div>
          </div>
        </div>

        <div className="flex items-baseline justify-between gap-2 px-3 py-2.5">
          <p className="line-clamp-1 text-[13px] leading-snug font-semibold text-white">
            {video.title}
          </p>
          <p className="shrink-0 text-[11px] text-slate-500">
            {formatVideoDate(video.publishedAt)}
          </p>
        </div>
      </article>

      {isModalOpen ? (
        <VideoModal video={video} onClose={() => setIsModalOpen(false)} />
      ) : null}
    </>
  )
}
