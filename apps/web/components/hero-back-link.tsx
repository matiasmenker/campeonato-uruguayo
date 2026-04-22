import Link from "next/link"
import { IconArrowLeft } from "@tabler/icons-react"

interface HeroBackLinkProps {
  href: string
  label: string
}

const HeroBackLink = ({ href, label }: HeroBackLinkProps) => (
  <Link
    href={href}
    className="inline-flex h-8 items-center gap-1.5 rounded-xl border border-white/15 bg-black/40 pl-3 pr-4 text-sm font-medium text-white/90 backdrop-blur-sm transition-colors hover:bg-black/55 hover:text-white"
  >
    <IconArrowLeft size={15} />
    {label}
  </Link>
)

export default HeroBackLink
