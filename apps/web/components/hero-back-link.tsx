import Link from "next/link"
import { IconArrowLeft } from "@tabler/icons-react"

interface HeroBackLinkProps {
  href: string
  label: string
}

const HeroBackLink = ({ href, label }: HeroBackLinkProps) => (
  <Link
    href={href}
    className="inline-flex h-8 items-center gap-1.5 rounded-xl border border-white/20 bg-white/10 pl-3 pr-4 text-sm font-medium text-white/80 backdrop-blur-sm transition-colors hover:bg-white/20 hover:text-white"
  >
    <IconArrowLeft size={15} />
    {label}
  </Link>
)

export default HeroBackLink
