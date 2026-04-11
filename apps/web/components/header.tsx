"use client"
import { IconSearch } from "@tabler/icons-react"
import Image from "next/image"
import Link from "next/link"
import { useState } from "react"
import { Input } from "@/components/ui/input"

const NAV_ITEMS = [
  { label: "Partidos", href: "/partidos" },
  { label: "Tabla", href: "/tabla" },
  { label: "Jugadores", href: "/jugadores" },
  { label: "Equipos", href: "/equipos" },
]

const Header = () => {
  const [search, setSearch] = useState("")

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center gap-6 px-6 sm:px-8 lg:px-10">
        <Link href="/" className="flex shrink-0 items-center">
          <Image
            src="/logo.png"
            alt="Campeonato Uruguayo"
            width={36}
            height={36}
            className="h-9 w-auto"
          />
        </Link>

        <nav className="hidden flex-1 items-center justify-center gap-1 md:flex">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-lg px-3.5 py-1.5 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-950"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="relative ml-auto shrink-0">
          <IconSearch className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            type="search"
            placeholder="Buscar equipo o jugador..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="w-52 pl-9 text-sm lg:w-64"
          />
        </div>
      </div>
    </header>
  )
}

export default Header
