"use client"

import {
  IconBallFootball,
  IconHomeFilled,
  IconMail,
  IconRun,
  IconShieldFilled,
  IconTrophy,
} from "@tabler/icons-react"
import Image from "next/image"
import Link from "next/link"
import { usePathname } from "next/navigation"

const NAV_ITEMS = [
  { label: "Home", href: "/", icon: IconHomeFilled },
  { label: "Matches", href: "/partidos", icon: IconBallFootball },
  { label: "Standings", href: "/tabla", icon: IconTrophy },
  { label: "Players", href: "/jugadores", icon: IconRun },
  { label: "Teams", href: "/equipos", icon: IconShieldFilled },
]

const Header = () => {
  const pathname = usePathname()

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white shadow-sm">
      <div className="mx-auto flex h-14 w-full max-w-7xl items-center px-6 sm:px-8 lg:px-10">
        <div className="flex w-40 shrink-0 items-center">
          <Link href="/">
            <Image src="/logo.png" alt="Campeonato Uruguayo" width={200} height={134} className="h-10 w-auto" />
          </Link>
        </div>

        <nav className="flex flex-1 items-center justify-center gap-0.5">
          {NAV_ITEMS.map((item) => {
            const isActive = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href)
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`group flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-sm font-medium transition-all duration-150 ${
                  isActive
                    ? "bg-primary/10 text-primary font-semibold"
                    : "text-slate-400 hover:bg-slate-100 hover:text-slate-600 active:scale-95"
                }`}
              >
                <Icon
                  size={15}
                  className={`transition-transform duration-150 ${isActive ? "" : "group-hover:scale-110"}`}
                />
                {item.label}
              </Link>
            )
          })}
        </nav>

        <div className="flex w-40 items-center justify-end">
          <a
            href="mailto:campeonatouruguayo@proton.me"
            className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
          >
            <IconMail size={15} />
            Contact
          </a>
        </div>
      </div>
    </header>
  )
}

export default Header
