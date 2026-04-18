"use client"

import {
  IconBallFootball,
  IconHomeFilled,
  IconRun,
  IconSearch,
  IconShieldFilled,
  IconTrophy,
} from "@tabler/icons-react"
import Image from "next/image"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState } from "react"
import { Input } from "@/components/ui/input"

const NAV_ITEMS = [
  { label: "Inicio", href: "/", icon: IconHomeFilled },
  { label: "Partidos", href: "/partidos", icon: IconBallFootball },
  { label: "Tabla", href: "/tabla", icon: IconTrophy },
  { label: "Jugadores", href: "/jugadores", icon: IconRun },
  { label: "Equipos", href: "/equipos", icon: IconShieldFilled },
]


const Header = () => {
  const [search, setSearch] = useState("")
  const pathname = usePathname()

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white shadow-sm">
      <div className="mx-auto flex h-14 w-full max-w-7xl items-center gap-6 px-6 sm:px-8 lg:px-10">

        <div className="shrink-0">
          <Link href="/">
            <Image src="/logo.png" alt="Campeonato Uruguayo" width={200} height={134} className="h-10 w-auto" />
          </Link>
        </div>

        <nav className="hidden flex-1 items-center justify-center gap-0.5 md:flex">
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

        <div className="relative ml-auto w-48 shrink-0 lg:w-56">
          <IconSearch className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            type="search"
            placeholder="Buscar..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="w-full pl-9 text-sm"
          />
        </div>
      </div>
    </header>
  )
}

export default Header
