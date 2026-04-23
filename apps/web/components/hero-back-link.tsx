"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { IconArrowLeft } from "@tabler/icons-react"

interface HeroBackLinkProps {
  label: string
  href: string
}

const HeroBackLink = ({ label, href }: HeroBackLinkProps) => {
  const router = useRouter()

  return (
    <Link
      href={href}
      onClick={(event) => {
        if (window.history.length > 2) {
          event.preventDefault()
          router.back()
        }
      }}
      className="inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-xl border border-white/20 bg-white/15 pl-3 pr-4 text-sm font-semibold text-white backdrop-blur-sm transition-colors hover:bg-white/25"
    >
      <IconArrowLeft size={15} />
      {label}
    </Link>
  )
}

export default HeroBackLink
