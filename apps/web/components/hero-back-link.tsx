"use client"

import { useRouter } from "next/navigation"
import { IconArrowLeft } from "@tabler/icons-react"

interface HeroBackLinkProps {
  label: string
  href: string
}

const HeroBackLink = ({ label, href }: HeroBackLinkProps) => {
  const router = useRouter()

  const handleClick = () => {
    const cameFromSameSite =
      document.referrer !== "" &&
      new URL(document.referrer).origin === window.location.origin
    if (cameFromSameSite) {
      router.back()
    } else {
      router.push(href)
    }
  }

  return (
    <button
      onClick={handleClick}
      className="inline-flex h-8 items-center gap-1.5 rounded-xl border border-white/20 bg-white/15 pl-3 pr-4 text-sm font-semibold text-white backdrop-blur-sm transition-colors hover:bg-white/25"
    >
      <IconArrowLeft size={15} />
      {label}
    </button>
  )
}

export default HeroBackLink
