"use client"

import { IconSearch } from "@tabler/icons-react"
import Image from "next/image"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState } from "react"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

const NAV_ITEMS = [
  { label: "Inicio", href: "/" },
  { label: "Partidos", href: "/partidos" },
  { label: "Tabla", href: "/tabla" },
  { label: "Jugadores", href: "/jugadores" },
  { label: "Equipos", href: "/equipos" },
]

const Header = () => {
  const [search, setSearch] = useState("")
  const pathname = usePathname()

  return (
    <header className="sticky top-0 z-50 border-b border-[#1a5e99]/40 bg-[#237acc]">
      <div className="mx-auto flex h-20 w-full max-w-7xl items-center px-6 sm:px-8 lg:px-10">

        {/* Logo — ancho fijo igual al buscador para que el nav quede centrado */}
        <div className="w-52 shrink-0 lg:w-64">
          <Link href="/" className="flex items-center">
            <Image
              src="/logo.png"
              alt="Campeonato Uruguayo"
              width={200}
              height={134}
              className="h-14 w-auto drop-shadow-sm"
            />
          </Link>
        </div>

        {/* Nav — centrado real usando flex-1 + justify-center */}
        <nav className="hidden flex-1 items-center justify-center gap-0.5 md:flex">
          {NAV_ITEMS.map((item) => {
            const isActive = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "relative px-4 py-1.5 text-sm font-medium transition-colors duration-150",
                  isActive
                    ? "text-white"
                    : "text-white/75 hover:text-white"
                )}
              >
                {item.label}
                {/* Underline activo */}
                <span
                  className={cn(
                    "absolute inset-x-3 -bottom-[1px] h-[2px] rounded-full bg-white transition-opacity duration-150",
                    isActive ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                  )}
                />
              </Link>
            )
          })}
        </nav>

        {/* Buscador — ancho fijo mismo que el logo */}
        <div className="relative ml-auto w-52 shrink-0 lg:w-64">
          <IconSearch className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/60" />
          <Input
            type="search"
            placeholder="Buscar equipo o jugador..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="w-full border-white/25 bg-white/15 pl-9 text-sm text-white placeholder:text-white/50 focus-visible:ring-white/30"
          />
        </div>
      </div>
    </header>
  )
}

export default Header
