// Preview page — pick a hero variant for the teams page
// Delete this file once a variant is chosen

const variants = [

  // ── 1 · Midnight navy diagonal + electric blue glows ──────────────────────
  {
    id: 1,
    label: "Midnight Navy + Electric Blue",
    svg: (
      <svg className="absolute inset-0 h-full w-full" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice">
        <defs>
          <linearGradient id="v1-base" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#060d1f" />
            <stop offset="50%" stopColor="#0a2456" />
            <stop offset="100%" stopColor="#1a3a8f" />
          </linearGradient>
          <radialGradient id="v1-g1" cx="80%" cy="10%" r="50%">
            <stop offset="0%" stopColor="#60a5fa" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#60a5fa" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="v1-g2" cx="15%" cy="80%" r="40%">
            <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#22d3ee" stopOpacity="0" />
          </radialGradient>
          <pattern id="v1-dots" x="0" y="0" width="28" height="28" patternUnits="userSpaceOnUse">
            <circle cx="0" cy="0" r="1.2" fill="rgba(148,163,255,0.12)" />
            <circle cx="14" cy="14" r="1.2" fill="rgba(148,163,255,0.07)" />
          </pattern>
          <pattern id="v1-hatch" x="0" y="0" width="16" height="16" patternUnits="userSpaceOnUse" patternTransform="rotate(30)">
            <line x1="0" y1="0" x2="0" y2="16" stroke="rgba(255,255,255,0.04)" strokeWidth="0.5" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#v1-base)" />
        <rect width="100%" height="100%" fill="url(#v1-g1)" />
        <rect width="100%" height="100%" fill="url(#v1-g2)" />
        <rect width="100%" height="100%" fill="url(#v1-hatch)" />
        <rect width="100%" height="100%" fill="url(#v1-dots)" />
        <circle cx="108%" cy="120%" r="65%" fill="none" stroke="rgba(99,102,241,0.12)" strokeWidth="1.5" />
        <circle cx="108%" cy="120%" r="48%" fill="none" stroke="rgba(99,102,241,0.08)" strokeWidth="1" />
        <circle cx="-8%" cy="-15%" r="38%" fill="none" stroke="rgba(96,165,250,0.1)" strokeWidth="1" />
      </svg>
    ),
  },

  // ── 2 · Deep ocean — teal to dark blue ────────────────────────────────────
  {
    id: 2,
    label: "Deep Ocean — Teal → Navy",
    svg: (
      <svg className="absolute inset-0 h-full w-full" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice">
        <defs>
          <linearGradient id="v2-base" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#042f2e" />
            <stop offset="45%" stopColor="#0e4f5c" />
            <stop offset="100%" stopColor="#0c1a4a" />
          </linearGradient>
          <radialGradient id="v2-g1" cx="60%" cy="30%" r="55%">
            <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.22" />
            <stop offset="100%" stopColor="#06b6d4" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="v2-g2" cx="20%" cy="70%" r="40%">
            <stop offset="0%" stopColor="#0284c7" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#0284c7" stopOpacity="0" />
          </radialGradient>
          <pattern id="v2-wave" x="0" y="0" width="60" height="20" patternUnits="userSpaceOnUse">
            <path d="M0 10 Q15 0 30 10 Q45 20 60 10" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="0.8" />
          </pattern>
          <pattern id="v2-dots" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
            <circle cx="10" cy="10" r="0.8" fill="rgba(103,232,249,0.1)" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#v2-base)" />
        <rect width="100%" height="100%" fill="url(#v2-g1)" />
        <rect width="100%" height="100%" fill="url(#v2-g2)" />
        <rect width="100%" height="100%" fill="url(#v2-wave)" />
        <rect width="100%" height="100%" fill="url(#v2-dots)" />
        <ellipse cx="50%" cy="130%" rx="70%" ry="60%" fill="none" stroke="rgba(6,182,212,0.1)" strokeWidth="1" />
        <ellipse cx="50%" cy="130%" rx="55%" ry="48%" fill="none" stroke="rgba(6,182,212,0.07)" strokeWidth="0.5" />
      </svg>
    ),
  },

  // ── 3 · Purple dusk — indigo to violet ────────────────────────────────────
  {
    id: 3,
    label: "Purple Dusk — Indigo → Violet",
    svg: (
      <svg className="absolute inset-0 h-full w-full" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice">
        <defs>
          <linearGradient id="v3-base" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#1e1b4b" />
            <stop offset="50%" stopColor="#312e81" />
            <stop offset="100%" stopColor="#4c1d95" />
          </linearGradient>
          <radialGradient id="v3-g1" cx="75%" cy="20%" r="50%">
            <stop offset="0%" stopColor="#a78bfa" stopOpacity="0.28" />
            <stop offset="100%" stopColor="#a78bfa" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="v3-g2" cx="20%" cy="75%" r="45%">
            <stop offset="0%" stopColor="#818cf8" stopOpacity="0.22" />
            <stop offset="100%" stopColor="#818cf8" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="v3-g3" cx="50%" cy="50%" r="30%">
            <stop offset="0%" stopColor="#ec4899" stopOpacity="0.08" />
            <stop offset="100%" stopColor="#ec4899" stopOpacity="0" />
          </radialGradient>
          <pattern id="v3-grid" x="0" y="0" width="32" height="32" patternUnits="userSpaceOnUse">
            <path d="M32 0L0 0 0 32" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="0.5" />
          </pattern>
          <pattern id="v3-dots" x="0" y="0" width="24" height="24" patternUnits="userSpaceOnUse">
            <circle cx="0" cy="0" r="1" fill="rgba(196,181,253,0.1)" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#v3-base)" />
        <rect width="100%" height="100%" fill="url(#v3-g1)" />
        <rect width="100%" height="100%" fill="url(#v3-g2)" />
        <rect width="100%" height="100%" fill="url(#v3-g3)" />
        <rect width="100%" height="100%" fill="url(#v3-grid)" />
        <rect width="100%" height="100%" fill="url(#v3-dots)" />
        <circle cx="100%" cy="0%" r="45%" fill="none" stroke="rgba(167,139,250,0.12)" strokeWidth="1" />
        <circle cx="0%" cy="100%" r="40%" fill="none" stroke="rgba(129,140,248,0.1)" strokeWidth="1" />
      </svg>
    ),
  },

  // ── 4 · Steel & Ice — dark slate + cold blue highlight ────────────────────
  {
    id: 4,
    label: "Steel & Ice — Slate + Cold Blue",
    svg: (
      <svg className="absolute inset-0 h-full w-full" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice">
        <defs>
          <linearGradient id="v4-base" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#0f172a" />
            <stop offset="60%" stopColor="#1e293b" />
            <stop offset="100%" stopColor="#0f2744" />
          </linearGradient>
          <linearGradient id="v4-beam" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#38bdf8" stopOpacity="0" />
            <stop offset="40%" stopColor="#38bdf8" stopOpacity="0.12" />
            <stop offset="60%" stopColor="#38bdf8" stopOpacity="0.08" />
            <stop offset="100%" stopColor="#38bdf8" stopOpacity="0" />
          </linearGradient>
          <radialGradient id="v4-g1" cx="90%" cy="5%" r="40%">
            <stop offset="0%" stopColor="#7dd3fc" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#7dd3fc" stopOpacity="0" />
          </radialGradient>
          <pattern id="v4-fine" x="0" y="0" width="8" height="8" patternUnits="userSpaceOnUse">
            <rect width="8" height="1" fill="rgba(255,255,255,0.02)" />
          </pattern>
          <pattern id="v4-cross" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
            <line x1="0" y1="0" x2="40" y2="40" stroke="rgba(56,189,248,0.05)" strokeWidth="0.5" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#v4-base)" />
        <rect width="100%" height="100%" fill="url(#v4-beam)" />
        <rect width="100%" height="100%" fill="url(#v4-g1)" />
        <rect width="100%" height="100%" fill="url(#v4-fine)" />
        <rect width="100%" height="100%" fill="url(#v4-cross)" />
        <line x1="0%" y1="40%" x2="100%" y2="0%" stroke="rgba(56,189,248,0.07)" strokeWidth="1" />
        <line x1="0%" y1="50%" x2="100%" y2="10%" stroke="rgba(56,189,248,0.04)" strokeWidth="0.5" />
        <circle cx="50%" cy="-20%" r="55%" fill="none" stroke="rgba(56,189,248,0.06)" strokeWidth="1" />
        <circle cx="50%" cy="-20%" r="42%" fill="none" stroke="rgba(56,189,248,0.04)" strokeWidth="0.5" />
      </svg>
    ),
  },

  // ── 5 · Pitch night — dark green football field ───────────────────────────
  {
    id: 5,
    label: "Pitch Night — Dark Green + Gold",
    svg: (
      <svg className="absolute inset-0 h-full w-full" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice">
        <defs>
          <linearGradient id="v5-base" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#052e16" />
            <stop offset="50%" stopColor="#064e3b" />
            <stop offset="100%" stopColor="#0a3728" />
          </linearGradient>
          <radialGradient id="v5-g1" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#34d399" stopOpacity="0.1" />
            <stop offset="100%" stopColor="#34d399" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="v5-g2" cx="80%" cy="20%" r="40%">
            <stop offset="0%" stopColor="#fbbf24" stopOpacity="0.12" />
            <stop offset="100%" stopColor="#fbbf24" stopOpacity="0" />
          </radialGradient>
          <pattern id="v5-stripes" x="0" y="0" width="48" height="48" patternUnits="userSpaceOnUse">
            <rect x="0" y="0" width="24" height="48" fill="rgba(255,255,255,0.015)" />
          </pattern>
          <pattern id="v5-dots" x="0" y="0" width="16" height="16" patternUnits="userSpaceOnUse">
            <circle cx="8" cy="8" r="0.7" fill="rgba(52,211,153,0.12)" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#v5-base)" />
        <rect width="100%" height="100%" fill="url(#v5-stripes)" />
        <rect width="100%" height="100%" fill="url(#v5-g1)" />
        <rect width="100%" height="100%" fill="url(#v5-g2)" />
        <rect width="100%" height="100%" fill="url(#v5-dots)" />
        {/* Center circle — football pitch reference */}
        <circle cx="50%" cy="50%" r="22%" fill="none" stroke="rgba(52,211,153,0.08)" strokeWidth="1" />
        <circle cx="50%" cy="50%" r="2%" fill="rgba(52,211,153,0.12)" />
        <line x1="50%" y1="0%" x2="50%" y2="100%" stroke="rgba(52,211,153,0.06)" strokeWidth="1" />
        <rect x="35%" y="70%" width="30%" height="28%" fill="none" stroke="rgba(52,211,153,0.06)" strokeWidth="1" />
      </svg>
    ),
  },

  // ── 6 · Aurora — deep black + multicolor bands ───────────────────────────
  {
    id: 6,
    label: "Aurora — Black + Color Bands",
    svg: (
      <svg className="absolute inset-0 h-full w-full" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice">
        <defs>
          <linearGradient id="v6-base" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#020617" />
            <stop offset="100%" stopColor="#0c0a1e" />
          </linearGradient>
          <radialGradient id="v6-g1" cx="30%" cy="40%" r="45%">
            <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#06b6d4" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="v6-g2" cx="70%" cy="30%" r="40%">
            <stop offset="0%" stopColor="#6366f1" stopOpacity="0.22" />
            <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="v6-g3" cx="50%" cy="70%" r="35%">
            <stop offset="0%" stopColor="#10b981" stopOpacity="0.14" />
            <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
          </radialGradient>
          <pattern id="v6-dots" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
            <circle cx="10" cy="10" r="0.8" fill="rgba(255,255,255,0.05)" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#v6-base)" />
        <rect width="100%" height="100%" fill="url(#v6-g1)" />
        <rect width="100%" height="100%" fill="url(#v6-g2)" />
        <rect width="100%" height="100%" fill="url(#v6-g3)" />
        <rect width="100%" height="100%" fill="url(#v6-dots)" />
        {/* Aurora bands */}
        <path d="M-10% 60% Q25% 30% 60% 55% Q85% 70% 110% 45%" fill="none" stroke="rgba(6,182,212,0.1)" strokeWidth="20" />
        <path d="M-10% 55% Q30% 25% 65% 50% Q90% 65% 110% 40%" fill="none" stroke="rgba(99,102,241,0.08)" strokeWidth="14" />
        <path d="M-10% 65% Q20% 40% 55% 60% Q80% 75% 110% 52%" fill="none" stroke="rgba(16,185,129,0.07)" strokeWidth="10" />
      </svg>
    ),
  },

  // ── 7 · Carbon — near-black + fine grid + blue stripe ────────────────────
  {
    id: 7,
    label: "Carbon — Near Black + Blue Stripe",
    svg: (
      <svg className="absolute inset-0 h-full w-full" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice">
        <defs>
          <linearGradient id="v7-base" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#09090b" />
            <stop offset="100%" stopColor="#111827" />
          </linearGradient>
          <linearGradient id="v7-stripe" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#1d4ed8" stopOpacity="0" />
            <stop offset="30%" stopColor="#2563eb" stopOpacity="0.2" />
            <stop offset="70%" stopColor="#3b82f6" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#60a5fa" stopOpacity="0" />
          </linearGradient>
          <radialGradient id="v7-g1" cx="70%" cy="50%" r="45%">
            <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
          </radialGradient>
          <pattern id="v7-grid" x="0" y="0" width="24" height="24" patternUnits="userSpaceOnUse">
            <path d="M24 0H0V24" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="0.5" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#v7-base)" />
        <rect width="100%" height="100%" fill="url(#v7-grid)" />
        {/* Horizontal blue stripe */}
        <rect x="0" y="30%" width="100%" height="40%" fill="url(#v7-stripe)" />
        <rect width="100%" height="100%" fill="url(#v7-g1)" />
        <line x1="0%" y1="50%" x2="100%" y2="50%" stroke="rgba(59,130,246,0.1)" strokeWidth="1" />
        <circle cx="70%" cy="50%" r="30%" fill="none" stroke="rgba(59,130,246,0.07)" strokeWidth="1" />
        <circle cx="70%" cy="50%" r="18%" fill="none" stroke="rgba(59,130,246,0.05)" strokeWidth="0.5" />
      </svg>
    ),
  },

  // ── 8 · Denim fade — medium blue wash ────────────────────────────────────
  {
    id: 8,
    label: "Denim Fade — Mid Blue Wash",
    svg: (
      <svg className="absolute inset-0 h-full w-full" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice">
        <defs>
          <linearGradient id="v8-base" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#1e3a5f" />
            <stop offset="50%" stopColor="#1d4ed8" />
            <stop offset="100%" stopColor="#1e40af" />
          </linearGradient>
          <radialGradient id="v8-g1" cx="20%" cy="20%" r="50%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.07" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="v8-g2" cx="80%" cy="80%" r="45%">
            <stop offset="0%" stopColor="#0f172a" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#0f172a" stopOpacity="0" />
          </radialGradient>
          <pattern id="v8-dots" x="0" y="0" width="12" height="12" patternUnits="userSpaceOnUse">
            <circle cx="6" cy="6" r="0.7" fill="rgba(255,255,255,0.08)" />
          </pattern>
          <pattern id="v8-diag" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <rect x="0" y="0" width="10" height="20" fill="rgba(255,255,255,0.02)" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#v8-base)" />
        <rect width="100%" height="100%" fill="url(#v8-diag)" />
        <rect width="100%" height="100%" fill="url(#v8-g1)" />
        <rect width="100%" height="100%" fill="url(#v8-g2)" />
        <rect width="100%" height="100%" fill="url(#v8-dots)" />
        <circle cx="-10%" cy="110%" r="70%" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
        <circle cx="-10%" cy="110%" r="52%" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="0.5" />
      </svg>
    ),
  },

] as const

const HeroCard = ({ id, label, svg }: { id: number; label: string; svg: React.ReactNode }) => (
  <div className="flex flex-col gap-2">
    <p className="text-xs text-slate-500">
      <span className="font-bold text-slate-700">#{id}</span> · {label}
    </p>
    <div className="overflow-hidden rounded-2xl shadow-lg">
      <div className="relative min-h-44 bg-slate-900">
        {svg}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/60" />
        {/* Season selector mockup — top right */}
        <div className="absolute right-5 top-5">
          <div className="flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-3 py-2 backdrop-blur-sm">
            <span className="text-sm font-medium text-white/80">2026</span>
          </div>
        </div>
        {/* Back link mockup — top left */}
        <div className="absolute left-5 top-5">
          <div className="flex items-center gap-1.5 rounded-xl border border-white/20 bg-white/10 py-2 pl-3 pr-4 backdrop-blur-sm">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-3.5 w-3.5 text-white/70"><path d="M19 12H5M12 5l-7 7 7 7" /></svg>
            <span className="text-sm font-medium text-white/80">All teams</span>
          </div>
        </div>
        {/* Content — bottom left */}
        <div className="absolute bottom-0 left-0 right-0 flex items-end gap-5 p-6">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-sm ring-1 ring-white/20">
            <svg viewBox="0 0 24 24" fill="currentColor" className="h-8 w-8 text-white/70">
              <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z" />
            </svg>
          </div>
          <div className="flex flex-col gap-1 pb-1">
            <p className="text-3xl font-black text-white leading-none drop-shadow">Teams</p>
            <p className="text-sm text-white/70">Uruguayan Primera División · <span className="font-semibold text-white/90">2026</span></p>
          </div>
        </div>
      </div>
    </div>
  </div>
)

const TeamsHeroPreviewPage = () => (
  <main className="min-h-svh bg-slate-100">
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-10 px-6 py-10 sm:px-8 lg:px-10">
      <div>
        <h1 className="text-2xl font-black text-slate-900">Hero variants — Teams page</h1>
        <p className="mt-1 text-sm text-slate-500">Dime el número que más te gusta y lo aplico.</p>
      </div>
      <div className="flex flex-col gap-8">
        {variants.map((variant) => (
          <HeroCard key={variant.id} id={variant.id} label={variant.label} svg={variant.svg} />
        ))}
      </div>
    </div>
  </main>
)

export default TeamsHeroPreviewPage
