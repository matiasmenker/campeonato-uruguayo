"use client"

import { useState } from "react"
import { IconArrowLeft, IconBallFootball, IconChevronDown, IconCheck } from "@tabler/icons-react"
import Link from "next/link"

// ─── Types ────────────────────────────────────────────────────────────────────

interface HeroVariant {
  id: string
  name: string
  description: string
  overlay: string
  renderBackground: (prefix: string) => React.ReactNode
}

// ─── Brand palette ────────────────────────────────────────────────────────────
// #0a377b — deep navy
// #438fd7 — sky blue (lightest, most vibrant)
// #1b5cab — royal blue (mid)
// #134692 — dark royal (between navy and royal)

const VARIANTS: HeroVariant[] = [

  // 1. Clásico — #438fd7 arriba-derecha + #1b5cab abajo-izquierda
  {
    id: "clasico",
    name: "Clásico",
    description: "#438fd7 upper-right · #1b5cab lower-left",
    overlay: "from-transparent via-black/8 to-black/55",
    renderBackground: (p) => (
      <svg className="absolute inset-0 h-full w-full" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice">
        <defs>
          <linearGradient id={`${p}-b`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%"   stopColor="#0a377b" />
            <stop offset="50%"  stopColor="#071f48" />
            <stop offset="100%" stopColor="#030e22" />
          </linearGradient>
          <radialGradient id={`${p}-g1`} cx="82%" cy="8%" r="62%">
            <stop offset="0%"   stopColor="#438fd7" stopOpacity="0.85" />
            <stop offset="100%" stopColor="#438fd7" stopOpacity="0" />
          </radialGradient>
          <radialGradient id={`${p}-g2`} cx="10%" cy="85%" r="60%">
            <stop offset="0%"   stopColor="#1b5cab" stopOpacity="0.75" />
            <stop offset="100%" stopColor="#1b5cab" stopOpacity="0" />
          </radialGradient>
          <radialGradient id={`${p}-g3`} cx="50%" cy="48%" r="45%">
            <stop offset="0%"   stopColor="#134692" stopOpacity="0.28" />
            <stop offset="100%" stopColor="#134692" stopOpacity="0" />
          </radialGradient>
        </defs>
        <rect width="100%" height="100%" fill={`url(#${p}-b)`} />
        <rect width="100%" height="100%" fill={`url(#${p}-g1)`} />
        <rect width="100%" height="100%" fill={`url(#${p}-g2)`} />
        <rect width="100%" height="100%" fill={`url(#${p}-g3)`} />
        <circle cx="-4%" cy="112%" r="68%" fill="none" stroke="rgba(27,92,171,0.20)" strokeWidth="1.5" />
        <circle cx="-4%" cy="112%" r="50%" fill="none" stroke="rgba(27,92,171,0.12)" strokeWidth="1" />
        <circle cx="106%" cy="-8%" r="55%" fill="none" stroke="rgba(67,143,215,0.15)" strokeWidth="1" />
      </svg>
    ),
  },

  // 2. Cielo — #438fd7 explota desde el centro-arriba
  {
    id: "cielo",
    name: "Cielo",
    description: "#438fd7 bloom desde centro-top",
    overlay: "from-transparent via-black/5 to-black/52",
    renderBackground: (p) => (
      <svg className="absolute inset-0 h-full w-full" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice">
        <defs>
          <linearGradient id={`${p}-b`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%"   stopColor="#0a377b" />
            <stop offset="55%"  stopColor="#061c40" />
            <stop offset="100%" stopColor="#030d20" />
          </linearGradient>
          <radialGradient id={`${p}-g1`} cx="50%" cy="-5%" r="82%">
            <stop offset="0%"   stopColor="#438fd7" stopOpacity="0.90" />
            <stop offset="55%"  stopColor="#438fd7" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#438fd7" stopOpacity="0" />
          </radialGradient>
          <radialGradient id={`${p}-g2`} cx="8%" cy="82%" r="55%">
            <stop offset="0%"   stopColor="#1b5cab" stopOpacity="0.65" />
            <stop offset="100%" stopColor="#1b5cab" stopOpacity="0" />
          </radialGradient>
          <radialGradient id={`${p}-g3`} cx="92%" cy="80%" r="48%">
            <stop offset="0%"   stopColor="#134692" stopOpacity="0.55" />
            <stop offset="100%" stopColor="#134692" stopOpacity="0" />
          </radialGradient>
        </defs>
        <rect width="100%" height="100%" fill={`url(#${p}-b)`} />
        <rect width="100%" height="100%" fill={`url(#${p}-g1)`} />
        <rect width="100%" height="100%" fill={`url(#${p}-g2)`} />
        <rect width="100%" height="100%" fill={`url(#${p}-g3)`} />
        <circle cx="50%" cy="-25%" r="90%" fill="none" stroke="rgba(67,143,215,0.14)" strokeWidth="2" />
        <circle cx="50%" cy="-25%" r="65%" fill="none" stroke="rgba(67,143,215,0.09)" strokeWidth="1" />
        <circle cx="-4%" cy="112%" r="65%" fill="none" stroke="rgba(27,92,171,0.16)" strokeWidth="1.5" />
      </svg>
    ),
  },

  // 3. Profundo — #0a377b base oscuro, sutil destello #438fd7
  {
    id: "profundo",
    name: "Profundo",
    description: "#0a377b oscuro, #438fd7 sutil destello",
    overlay: "from-transparent via-black/10 to-black/58",
    renderBackground: (p) => (
      <svg className="absolute inset-0 h-full w-full" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice">
        <defs>
          <linearGradient id={`${p}-b`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%"   stopColor="#0a377b" />
            <stop offset="45%"  stopColor="#061a38" />
            <stop offset="100%" stopColor="#020a1a" />
          </linearGradient>
          <radialGradient id={`${p}-g1`} cx="80%" cy="6%" r="58%">
            <stop offset="0%"   stopColor="#438fd7" stopOpacity="0.60" />
            <stop offset="100%" stopColor="#438fd7" stopOpacity="0" />
          </radialGradient>
          <radialGradient id={`${p}-g2`} cx="12%" cy="82%" r="58%">
            <stop offset="0%"   stopColor="#134692" stopOpacity="0.70" />
            <stop offset="100%" stopColor="#134692" stopOpacity="0" />
          </radialGradient>
          <radialGradient id={`${p}-g3`} cx="50%" cy="48%" r="42%">
            <stop offset="0%"   stopColor="#1b5cab" stopOpacity="0.30" />
            <stop offset="100%" stopColor="#1b5cab" stopOpacity="0" />
          </radialGradient>
          <pattern id={`${p}-dots`} x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
            <circle cx="2" cy="2" r="1.5" fill="rgba(67,143,215,0.13)" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill={`url(#${p}-b)`} />
        <rect width="100%" height="100%" fill={`url(#${p}-g1)`} />
        <rect width="100%" height="100%" fill={`url(#${p}-g2)`} />
        <rect width="100%" height="100%" fill={`url(#${p}-g3)`} />
        <rect width="100%" height="100%" fill={`url(#${p}-dots)`} />
        <circle cx="-4%" cy="112%" r="70%" fill="none" stroke="rgba(10,55,123,0.28)" strokeWidth="2" />
        <circle cx="-4%" cy="112%" r="52%" fill="none" stroke="rgba(10,55,123,0.16)" strokeWidth="1" />
        <circle cx="106%" cy="-8%" r="55%" fill="none" stroke="rgba(67,143,215,0.13)" strokeWidth="1" />
      </svg>
    ),
  },

  // 4. Horizonte — #438fd7 izquierda, #134692 derecha (split lateral)
  {
    id: "horizonte",
    name: "Horizonte",
    description: "#438fd7 izquierda · #134692 derecha",
    overlay: "from-transparent via-black/5 to-black/50",
    renderBackground: (p) => (
      <svg className="absolute inset-0 h-full w-full" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice">
        <defs>
          <linearGradient id={`${p}-b`} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%"   stopColor="#0d2e62" />
            <stop offset="50%"  stopColor="#091d42" />
            <stop offset="100%" stopColor="#0d2e62" />
          </linearGradient>
          <radialGradient id={`${p}-g1`} cx="8%" cy="48%" r="65%">
            <stop offset="0%"   stopColor="#438fd7" stopOpacity="0.82" />
            <stop offset="100%" stopColor="#438fd7" stopOpacity="0" />
          </radialGradient>
          <radialGradient id={`${p}-g2`} cx="92%" cy="48%" r="65%">
            <stop offset="0%"   stopColor="#134692" stopOpacity="0.82" />
            <stop offset="100%" stopColor="#134692" stopOpacity="0" />
          </radialGradient>
          <radialGradient id={`${p}-g3`} cx="50%" cy="50%" r="42%">
            <stop offset="0%"   stopColor="#1b5cab" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#1b5cab" stopOpacity="0" />
          </radialGradient>
        </defs>
        <rect width="100%" height="100%" fill={`url(#${p}-b)`} />
        <rect width="100%" height="100%" fill={`url(#${p}-g1)`} />
        <rect width="100%" height="100%" fill={`url(#${p}-g2)`} />
        <rect width="100%" height="100%" fill={`url(#${p}-g3)`} />
        <circle cx="50%" cy="-18%" r="82%" fill="none" stroke="rgba(67,143,215,0.10)" strokeWidth="1.5" />
        <circle cx="-4%" cy="112%" r="65%" fill="none" stroke="rgba(27,92,171,0.18)" strokeWidth="1.5" />
        <circle cx="106%" cy="-6%" r="55%" fill="none" stroke="rgba(19,70,146,0.16)" strokeWidth="1" />
      </svg>
    ),
  },

  // 5. Amanecer — #438fd7 explota arriba, #0a377b profundo abajo
  {
    id: "amanecer",
    name: "Amanecer",
    description: "#438fd7 arriba · #0a377b abajo",
    overlay: "from-transparent via-black/5 to-black/52",
    renderBackground: (p) => (
      <svg className="absolute inset-0 h-full w-full" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice">
        <defs>
          <linearGradient id={`${p}-b`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%"   stopColor="#0d3068" />
            <stop offset="55%"  stopColor="#081a40" />
            <stop offset="100%" stopColor="#040e24" />
          </linearGradient>
          <radialGradient id={`${p}-g1`} cx="55%" cy="2%" r="72%">
            <stop offset="0%"   stopColor="#438fd7" stopOpacity="0.88" />
            <stop offset="100%" stopColor="#438fd7" stopOpacity="0" />
          </radialGradient>
          <radialGradient id={`${p}-g2`} cx="10%" cy="80%" r="55%">
            <stop offset="0%"   stopColor="#0a377b" stopOpacity="0.70" />
            <stop offset="100%" stopColor="#0a377b" stopOpacity="0" />
          </radialGradient>
          <radialGradient id={`${p}-g3`} cx="85%" cy="78%" r="48%">
            <stop offset="0%"   stopColor="#1b5cab" stopOpacity="0.55" />
            <stop offset="100%" stopColor="#1b5cab" stopOpacity="0" />
          </radialGradient>
          <radialGradient id={`${p}-g4`} cx="50%" cy="45%" r="40%">
            <stop offset="0%"   stopColor="#134692" stopOpacity="0.22" />
            <stop offset="100%" stopColor="#134692" stopOpacity="0" />
          </radialGradient>
        </defs>
        <rect width="100%" height="100%" fill={`url(#${p}-b)`} />
        <rect width="100%" height="100%" fill={`url(#${p}-g1)`} />
        <rect width="100%" height="100%" fill={`url(#${p}-g2)`} />
        <rect width="100%" height="100%" fill={`url(#${p}-g3)`} />
        <rect width="100%" height="100%" fill={`url(#${p}-g4)`} />
        <circle cx="50%" cy="-20%" r="88%" fill="none" stroke="rgba(67,143,215,0.13)" strokeWidth="2" />
        <circle cx="50%" cy="-20%" r="64%" fill="none" stroke="rgba(67,143,215,0.08)" strokeWidth="1" />
        <circle cx="-4%" cy="112%" r="65%" fill="none" stroke="rgba(10,55,123,0.20)" strokeWidth="1.5" />
      </svg>
    ),
  },

  // 6. Central — #1b5cab explota desde el centro
  {
    id: "central",
    name: "Central",
    description: "#1b5cab glow desde el centro",
    overlay: "from-transparent via-black/5 to-black/52",
    renderBackground: (p) => (
      <svg className="absolute inset-0 h-full w-full" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice">
        <defs>
          <linearGradient id={`${p}-b`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%"   stopColor="#0c2a5e" />
            <stop offset="50%"  stopColor="#071638" />
            <stop offset="100%" stopColor="#030c20" />
          </linearGradient>
          <radialGradient id={`${p}-g1`} cx="50%" cy="40%" r="70%">
            <stop offset="0%"   stopColor="#1b5cab" stopOpacity="0.80" />
            <stop offset="100%" stopColor="#1b5cab" stopOpacity="0" />
          </radialGradient>
          <radialGradient id={`${p}-g2`} cx="85%" cy="5%" r="52%">
            <stop offset="0%"   stopColor="#438fd7" stopOpacity="0.72" />
            <stop offset="100%" stopColor="#438fd7" stopOpacity="0" />
          </radialGradient>
          <radialGradient id={`${p}-g3`} cx="5%" cy="90%" r="52%">
            <stop offset="0%"   stopColor="#134692" stopOpacity="0.65" />
            <stop offset="100%" stopColor="#134692" stopOpacity="0" />
          </radialGradient>
          <radialGradient id={`${p}-g4`} cx="80%" cy="82%" r="40%">
            <stop offset="0%"   stopColor="#438fd7" stopOpacity="0.30" />
            <stop offset="100%" stopColor="#438fd7" stopOpacity="0" />
          </radialGradient>
        </defs>
        <rect width="100%" height="100%" fill={`url(#${p}-b)`} />
        <rect width="100%" height="100%" fill={`url(#${p}-g1)`} />
        <rect width="100%" height="100%" fill={`url(#${p}-g2)`} />
        <rect width="100%" height="100%" fill={`url(#${p}-g3)`} />
        <rect width="100%" height="100%" fill={`url(#${p}-g4)`} />
        <circle cx="50%" cy="-16%" r="78%" fill="none" stroke="rgba(27,92,171,0.14)" strokeWidth="1.5" />
        <circle cx="-4%" cy="112%" r="68%" fill="none" stroke="rgba(27,92,171,0.18)" strokeWidth="1.5" />
        <circle cx="106%" cy="-7%" r="55%" fill="none" stroke="rgba(67,143,215,0.14)" strokeWidth="1" />
      </svg>
    ),
  },

  // 7. Diagonal — #0a377b top-right → #438fd7 bottom-left
  {
    id: "diagonal",
    name: "Diagonal",
    description: "#0a377b top-right · #438fd7 bottom-left",
    overlay: "from-transparent via-black/5 to-black/50",
    renderBackground: (p) => (
      <svg className="absolute inset-0 h-full w-full" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice">
        <defs>
          <linearGradient id={`${p}-b`} x1="100%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%"   stopColor="#0a377b" />
            <stop offset="45%"  stopColor="#08204c" />
            <stop offset="100%" stopColor="#0c2e58" />
          </linearGradient>
          <radialGradient id={`${p}-g1`} cx="92%" cy="5%" r="62%">
            <stop offset="0%"   stopColor="#134692" stopOpacity="0.88" />
            <stop offset="100%" stopColor="#134692" stopOpacity="0" />
          </radialGradient>
          <radialGradient id={`${p}-g2`} cx="5%" cy="92%" r="62%">
            <stop offset="0%"   stopColor="#438fd7" stopOpacity="0.85" />
            <stop offset="100%" stopColor="#438fd7" stopOpacity="0" />
          </radialGradient>
          <radialGradient id={`${p}-g3`} cx="48%" cy="48%" r="45%">
            <stop offset="0%"   stopColor="#1b5cab" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#1b5cab" stopOpacity="0" />
          </radialGradient>
        </defs>
        <rect width="100%" height="100%" fill={`url(#${p}-b)`} />
        <rect width="100%" height="100%" fill={`url(#${p}-g1)`} />
        <rect width="100%" height="100%" fill={`url(#${p}-g2)`} />
        <rect width="100%" height="100%" fill={`url(#${p}-g3)`} />
        <circle cx="106%" cy="-8%" r="65%" fill="none" stroke="rgba(10,55,123,0.22)" strokeWidth="1.5" />
        <circle cx="-4%" cy="112%" r="65%" fill="none" stroke="rgba(67,143,215,0.20)" strokeWidth="1.5" />
        <circle cx="-4%" cy="112%" r="48%" fill="none" stroke="rgba(67,143,215,0.12)" strokeWidth="1" />
      </svg>
    ),
  },

  // 8. Tritono — los 4 azules en 3 focos distintos
  {
    id: "tritono",
    name: "Tritono",
    description: "Los 4 azules en 3 focos",
    overlay: "from-transparent via-black/5 to-black/52",
    renderBackground: (p) => (
      <svg className="absolute inset-0 h-full w-full" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice">
        <defs>
          <linearGradient id={`${p}-b`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%"   stopColor="#0b2252" />
            <stop offset="55%"  stopColor="#071438" />
            <stop offset="100%" stopColor="#040c22" />
          </linearGradient>
          <radialGradient id={`${p}-g1`} cx="82%" cy="10%" r="54%">
            <stop offset="0%"   stopColor="#438fd7" stopOpacity="0.85" />
            <stop offset="100%" stopColor="#438fd7" stopOpacity="0" />
          </radialGradient>
          <radialGradient id={`${p}-g2`} cx="8%" cy="50%" r="52%">
            <stop offset="0%"   stopColor="#1b5cab" stopOpacity="0.80" />
            <stop offset="100%" stopColor="#1b5cab" stopOpacity="0" />
          </radialGradient>
          <radialGradient id={`${p}-g3`} cx="50%" cy="90%" r="54%">
            <stop offset="0%"   stopColor="#0a377b" stopOpacity="0.72" />
            <stop offset="100%" stopColor="#0a377b" stopOpacity="0" />
          </radialGradient>
          <radialGradient id={`${p}-g4`} cx="50%" cy="42%" r="38%">
            <stop offset="0%"   stopColor="#134692" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#134692" stopOpacity="0" />
          </radialGradient>
        </defs>
        <rect width="100%" height="100%" fill={`url(#${p}-b)`} />
        <rect width="100%" height="100%" fill={`url(#${p}-g1)`} />
        <rect width="100%" height="100%" fill={`url(#${p}-g2)`} />
        <rect width="100%" height="100%" fill={`url(#${p}-g3)`} />
        <rect width="100%" height="100%" fill={`url(#${p}-g4)`} />
        <circle cx="-4%" cy="112%" r="65%" fill="none" stroke="rgba(27,92,171,0.18)" strokeWidth="1.5" />
        <circle cx="106%" cy="-6%" r="52%" fill="none" stroke="rgba(67,143,215,0.15)" strokeWidth="1" />
      </svg>
    ),
  },

  // 9. Vívido — saturación máxima, #438fd7 + #1b5cab a tope
  {
    id: "vivido",
    name: "Vívido",
    description: "Saturación máxima, #438fd7 + #1b5cab",
    overlay: "from-transparent via-black/5 to-black/48",
    renderBackground: (p) => (
      <svg className="absolute inset-0 h-full w-full" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice">
        <defs>
          <linearGradient id={`${p}-b`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%"   stopColor="#0d3270" />
            <stop offset="50%"  stopColor="#0a1e4a" />
            <stop offset="100%" stopColor="#060f28" />
          </linearGradient>
          <radialGradient id={`${p}-g1`} cx="80%" cy="8%" r="60%">
            <stop offset="0%"   stopColor="#438fd7" stopOpacity="0.95" />
            <stop offset="100%" stopColor="#438fd7" stopOpacity="0" />
          </radialGradient>
          <radialGradient id={`${p}-g2`} cx="8%" cy="80%" r="60%">
            <stop offset="0%"   stopColor="#1b5cab" stopOpacity="0.88" />
            <stop offset="100%" stopColor="#1b5cab" stopOpacity="0" />
          </radialGradient>
          <radialGradient id={`${p}-g3`} cx="50%" cy="42%" r="52%">
            <stop offset="0%"   stopColor="#438fd7" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#438fd7" stopOpacity="0" />
          </radialGradient>
          <radialGradient id={`${p}-g4`} cx="85%" cy="80%" r="40%">
            <stop offset="0%"   stopColor="#134692" stopOpacity="0.48" />
            <stop offset="100%" stopColor="#134692" stopOpacity="0" />
          </radialGradient>
        </defs>
        <rect width="100%" height="100%" fill={`url(#${p}-b)`} />
        <rect width="100%" height="100%" fill={`url(#${p}-g1)`} />
        <rect width="100%" height="100%" fill={`url(#${p}-g2)`} />
        <rect width="100%" height="100%" fill={`url(#${p}-g3)`} />
        <rect width="100%" height="100%" fill={`url(#${p}-g4)`} />
        <circle cx="-4%" cy="112%" r="70%" fill="none" stroke="rgba(27,92,171,0.24)" strokeWidth="2" />
        <circle cx="-4%" cy="112%" r="52%" fill="none" stroke="rgba(27,92,171,0.14)" strokeWidth="1" />
        <circle cx="106%" cy="-8%" r="58%" fill="none" stroke="rgba(67,143,215,0.18)" strokeWidth="1" />
      </svg>
    ),
  },

  // 10. Atardecer — #134692 top oscuro, #438fd7 bloom bottom-left
  {
    id: "atardecer",
    name: "Atardecer",
    description: "#134692 top · #438fd7 bloom abajo",
    overlay: "from-transparent via-black/5 to-black/52",
    renderBackground: (p) => (
      <svg className="absolute inset-0 h-full w-full" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice">
        <defs>
          <linearGradient id={`${p}-b`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%"   stopColor="#081a38" />
            <stop offset="50%"  stopColor="#0a1e48" />
            <stop offset="100%" stopColor="#0d2e62" />
          </linearGradient>
          <radialGradient id={`${p}-g1`} cx="82%" cy="5%" r="55%">
            <stop offset="0%"   stopColor="#134692" stopOpacity="0.78" />
            <stop offset="100%" stopColor="#134692" stopOpacity="0" />
          </radialGradient>
          <radialGradient id={`${p}-g2`} cx="8%" cy="88%" r="65%">
            <stop offset="0%"   stopColor="#438fd7" stopOpacity="0.88" />
            <stop offset="100%" stopColor="#438fd7" stopOpacity="0" />
          </radialGradient>
          <radialGradient id={`${p}-g3`} cx="80%" cy="82%" r="45%">
            <stop offset="0%"   stopColor="#1b5cab" stopOpacity="0.58" />
            <stop offset="100%" stopColor="#1b5cab" stopOpacity="0" />
          </radialGradient>
          <radialGradient id={`${p}-g4`} cx="45%" cy="48%" r="42%">
            <stop offset="0%"   stopColor="#438fd7" stopOpacity="0.22" />
            <stop offset="100%" stopColor="#438fd7" stopOpacity="0" />
          </radialGradient>
        </defs>
        <rect width="100%" height="100%" fill={`url(#${p}-b)`} />
        <rect width="100%" height="100%" fill={`url(#${p}-g1)`} />
        <rect width="100%" height="100%" fill={`url(#${p}-g2)`} />
        <rect width="100%" height="100%" fill={`url(#${p}-g3)`} />
        <rect width="100%" height="100%" fill={`url(#${p}-g4)`} />
        <circle cx="106%" cy="-6%" r="55%" fill="none" stroke="rgba(19,70,146,0.18)" strokeWidth="1.5" />
        <circle cx="-4%" cy="112%" r="68%" fill="none" stroke="rgba(67,143,215,0.22)" strokeWidth="1.5" />
        <circle cx="-4%" cy="112%" r="50%" fill="none" stroke="rgba(67,143,215,0.13)" strokeWidth="1" />
      </svg>
    ),
  },

  // 11. Puntos — base + grid de puntos #438fd7 visible
  {
    id: "puntos",
    name: "Puntos",
    description: "Grid de puntos #438fd7 sobre navy",
    overlay: "from-transparent via-black/8 to-black/55",
    renderBackground: (p) => (
      <svg className="absolute inset-0 h-full w-full" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice">
        <defs>
          <linearGradient id={`${p}-b`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%"   stopColor="#0a377b" />
            <stop offset="50%"  stopColor="#071f48" />
            <stop offset="100%" stopColor="#030e22" />
          </linearGradient>
          <radialGradient id={`${p}-g1`} cx="82%" cy="8%" r="58%">
            <stop offset="0%"   stopColor="#438fd7" stopOpacity="0.72" />
            <stop offset="100%" stopColor="#438fd7" stopOpacity="0" />
          </radialGradient>
          <radialGradient id={`${p}-g2`} cx="10%" cy="85%" r="58%">
            <stop offset="0%"   stopColor="#1b5cab" stopOpacity="0.68" />
            <stop offset="100%" stopColor="#1b5cab" stopOpacity="0" />
          </radialGradient>
          <pattern id={`${p}-dots`} x="0" y="0" width="18" height="18" patternUnits="userSpaceOnUse">
            <circle cx="2" cy="2" r="1.8" fill="rgba(67,143,215,0.22)" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill={`url(#${p}-b)`} />
        <rect width="100%" height="100%" fill={`url(#${p}-g1)`} />
        <rect width="100%" height="100%" fill={`url(#${p}-g2)`} />
        <rect width="100%" height="100%" fill={`url(#${p}-dots)`} />
        <circle cx="-4%" cy="112%" r="68%" fill="none" stroke="rgba(27,92,171,0.22)" strokeWidth="1.5" />
        <circle cx="-4%" cy="112%" r="50%" fill="none" stroke="rgba(27,92,171,0.13)" strokeWidth="1" />
        <circle cx="106%" cy="-8%" r="55%" fill="none" stroke="rgba(67,143,215,0.16)" strokeWidth="1" />
      </svg>
    ),
  },

  // 12. Suave — mezcla equilibrada de los 4, overlay ligero
  {
    id: "suave",
    name: "Suave",
    description: "Los 4 azules en mezcla equilibrada",
    overlay: "from-transparent via-black/5 to-black/45",
    renderBackground: (p) => (
      <svg className="absolute inset-0 h-full w-full" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice">
        <defs>
          <linearGradient id={`${p}-b`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%"   stopColor="#0e3268" />
            <stop offset="50%"  stopColor="#0b224e" />
            <stop offset="100%" stopColor="#071530" />
          </linearGradient>
          <radialGradient id={`${p}-g1`} cx="55%" cy="0%" r="85%">
            <stop offset="0%"   stopColor="#438fd7" stopOpacity="0.78" />
            <stop offset="45%"  stopColor="#438fd7" stopOpacity="0.38" />
            <stop offset="100%" stopColor="#438fd7" stopOpacity="0" />
          </radialGradient>
          <radialGradient id={`${p}-g2`} cx="5%" cy="65%" r="58%">
            <stop offset="0%"   stopColor="#1b5cab" stopOpacity="0.68" />
            <stop offset="100%" stopColor="#1b5cab" stopOpacity="0" />
          </radialGradient>
          <radialGradient id={`${p}-g3`} cx="92%" cy="78%" r="48%">
            <stop offset="0%"   stopColor="#134692" stopOpacity="0.52" />
            <stop offset="100%" stopColor="#134692" stopOpacity="0" />
          </radialGradient>
          <radialGradient id={`${p}-g4`} cx="48%" cy="50%" r="45%">
            <stop offset="0%"   stopColor="#438fd7" stopOpacity="0.14" />
            <stop offset="100%" stopColor="#438fd7" stopOpacity="0" />
          </radialGradient>
        </defs>
        <rect width="100%" height="100%" fill={`url(#${p}-b)`} />
        <rect width="100%" height="100%" fill={`url(#${p}-g1)`} />
        <rect width="100%" height="100%" fill={`url(#${p}-g2)`} />
        <rect width="100%" height="100%" fill={`url(#${p}-g3)`} />
        <rect width="100%" height="100%" fill={`url(#${p}-g4)`} />
        <circle cx="50%" cy="-22%" r="88%" fill="none" stroke="rgba(67,143,215,0.13)" strokeWidth="2" />
        <circle cx="50%" cy="-22%" r="65%" fill="none" stroke="rgba(67,143,215,0.08)" strokeWidth="1" />
        <circle cx="-4%" cy="112%" r="65%" fill="none" stroke="rgba(27,92,171,0.16)" strokeWidth="1.5" />
        <circle cx="106%" cy="-7%" r="55%" fill="none" stroke="rgba(19,70,146,0.14)" strokeWidth="1" />
      </svg>
    ),
  },
]

// ─── Page ─────────────────────────────────────────────────────────────────────

const HeroPreviewPage = () => {
  const [selectedId, setSelectedId] = useState<string>(VARIANTS[0]!.id)
  const selected = VARIANTS.find((v) => v.id === selectedId) ?? VARIANTS[0]!

  return (
    <main className="min-h-svh bg-[linear-gradient(180deg,#f8fafc_0%,#f8fafc_48%,#eef2f7_100%)]">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-6 py-8 sm:px-8 lg:px-10">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-slate-950">Hero Backgrounds</h1>
            <p className="mt-0.5 text-sm text-slate-500">
              <span className="font-mono">#0a377b · #438fd7 · #1b5cab · #134692</span>
              {" · "}{VARIANTS.length} variantes
            </p>
          </div>
          <Link
            href="/"
            className="inline-flex h-8 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-600 shadow-sm hover:bg-slate-50"
          >
            <IconArrowLeft size={14} />
            Volver
          </Link>
        </div>

        {/* Large preview */}
        <div className="overflow-hidden rounded-2xl shadow-xl">
          <div className="relative min-h-72 bg-slate-900">
            {selected.renderBackground(`preview-${selected.id}`)}
            <div className={`absolute inset-0 bg-gradient-to-b ${selected.overlay}`} />

            <div className="absolute left-5 top-5">
              <span className="inline-flex h-8 items-center gap-1.5 rounded-xl border border-white/20 bg-white/15 pl-3 pr-4 text-sm font-semibold text-white backdrop-blur-sm">
                <IconArrowLeft size={15} />
                Back
              </span>
            </div>

            <div className="absolute bottom-0 left-0 right-0 flex items-end justify-between gap-4 p-6">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-sm ring-1 ring-white/20">
                  <IconBallFootball size={28} className="text-white/80" />
                </div>
                <div className="flex flex-col gap-0.5">
                  <h2 className="text-3xl font-black leading-none text-white drop-shadow">Partidos</h2>
                  <p className="text-sm text-white/65">
                    Uruguayan Primera División
                    <span className="font-semibold text-white/85"> · 2025</span>
                  </p>
                </div>
              </div>
              <span className="inline-flex h-8 items-center gap-1.5 rounded-xl border border-white/20 bg-white/15 pl-3 pr-2.5 text-sm font-semibold text-white backdrop-blur-sm">
                Apertura
                <IconChevronDown size={14} className="text-white/65" />
              </span>
            </div>
          </div>
        </div>

        {/* Info bar */}
        <div className="flex items-center gap-3 rounded-xl border border-slate-200/80 bg-white px-4 py-2.5 shadow-sm">
          <span className="text-sm text-slate-500">Seleccionado</span>
          <span className="font-black text-slate-950">{selected.name}</span>
          <span className="text-sm text-slate-400">·</span>
          <span className="text-sm text-slate-500">{selected.description}</span>
          <code className="ml-auto rounded-lg bg-slate-100 px-2.5 py-1 font-mono text-xs text-slate-600">
            &quot;{selected.id}&quot;
          </code>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {VARIANTS.map((variant) => {
            const isSelected = variant.id === selectedId
            return (
              <button
                key={variant.id}
                onClick={() => setSelectedId(variant.id)}
                className={`group relative overflow-hidden rounded-2xl text-left transition-all duration-150 ${
                  isSelected
                    ? "scale-[1.02] shadow-lg ring-2 ring-offset-2 ring-slate-900"
                    : "hover:scale-[1.02] hover:shadow-md"
                }`}
              >
                <div className="relative h-36 bg-slate-900">
                  {variant.renderBackground(variant.id)}
                  <div className={`absolute inset-0 bg-gradient-to-b ${variant.overlay}`} />

                  {isSelected && (
                    <div className="absolute right-2.5 top-2.5 flex h-6 w-6 items-center justify-center rounded-full bg-white shadow-md">
                      <IconCheck size={13} className="text-slate-900" strokeWidth={3} />
                    </div>
                  )}

                  <div className="absolute bottom-0 left-0 right-0 flex items-end gap-2 p-3">
                    <div className="h-8 w-8 shrink-0 rounded-lg bg-white/10 ring-1 ring-white/20" />
                    <div className="flex flex-col gap-1 pb-0.5">
                      <div className="h-2.5 w-14 rounded bg-white/70" />
                      <div className="h-1.5 w-9 rounded bg-white/35" />
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-0.5 rounded-b-2xl border border-t-0 border-slate-200/80 bg-white px-3 py-2.5">
                  <span className="truncate text-sm font-bold text-slate-900">{variant.name}</span>
                  <span className="truncate text-[11px] text-slate-400">{variant.description}</span>
                </div>
              </button>
            )
          })}
        </div>

      </div>
    </main>
  )
}

export default HeroPreviewPage
