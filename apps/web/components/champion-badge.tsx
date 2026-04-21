// Original trophy badge design for Campeonato Uruguayo.
// Not affiliated with or copying any AUF official artwork.

const ChampionBadge = ({ year, size = 80 }: { year: string; size?: number }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 200 200"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-label={`Champion ${year}`}
  >
    {/* Cup body */}
    <path
      d="M68 110 Q68 140 100 148 Q132 140 132 110 L132 76 L68 76 Z"
      fill="url(#cupBody)"
      stroke="url(#silver)"
      strokeWidth="1.5"
    />

    {/* Cup body highlight */}
    <path
      d="M80 82 Q76 110 82 136"
      stroke="rgba(255,255,255,0.35)"
      strokeWidth="4"
      strokeLinecap="round"
      fill="none"
    />

    {/* Lid base */}
    <rect x="64" y="70" width="72" height="10" rx="5" fill="url(#cupLid)" stroke="url(#silver)" strokeWidth="1" />
    {/* Lid middle */}
    <rect x="74" y="58" width="52" height="14" rx="5" fill="url(#cupLid)" stroke="url(#silver)" strokeWidth="1" />
    {/* Lid top */}
    <rect x="86" y="46" width="28" height="14" rx="4" fill="url(#cupLid)" stroke="url(#silver)" strokeWidth="1" />
    {/* Knob */}
    <circle cx="100" cy="40" r="7" fill="url(#cupLid)" stroke="url(#silver)" strokeWidth="1.5" />
    <circle cx="100" cy="40" r="3" fill="rgba(255,255,255,0.4)" />

    {/* Left handle */}
    <path
      d="M68 84 Q44 84 44 106 Q44 128 68 126"
      stroke="url(#handle)"
      strokeWidth="8"
      fill="none"
      strokeLinecap="round"
    />
    <path
      d="M68 84 Q48 84 48 106 Q48 124 68 122"
      stroke="rgba(255,255,255,0.25)"
      strokeWidth="2"
      fill="none"
      strokeLinecap="round"
    />

    {/* Right handle */}
    <path
      d="M132 84 Q156 84 156 106 Q156 128 132 126"
      stroke="url(#handle)"
      strokeWidth="8"
      fill="none"
      strokeLinecap="round"
    />
    <path
      d="M132 84 Q152 84 152 106 Q152 124 132 122"
      stroke="rgba(255,255,255,0.25)"
      strokeWidth="2"
      fill="none"
      strokeLinecap="round"
    />

    {/* Stem */}
    <rect x="94" y="148" width="12" height="20" rx="3" fill="url(#cupLid)" stroke="url(#silver)" strokeWidth="1" />

    {/* Base tiers */}
    <rect x="76" y="167" width="48" height="10" rx="4" fill="url(#cupLid)" stroke="url(#silver)" strokeWidth="1" />
    <rect x="68" y="176" width="64" height="10" rx="4" fill="url(#cupLid)" stroke="url(#silver)" strokeWidth="1.5" />

    {/* Year — large, crisp */}
    <text
      x="100"
      y="165"
      textAnchor="middle"
      dominantBaseline="middle"
      fontSize="0"
      fill="transparent"
    />

    <defs>
      <linearGradient id="cupBody" x1="68" y1="76" x2="132" y2="148" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#94a3b8" />
        <stop offset="40%" stopColor="#cbd5e1" />
        <stop offset="100%" stopColor="#64748b" />
      </linearGradient>
      <linearGradient id="cupLid" x1="68" y1="40" x2="132" y2="186" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#e2e8f0" />
        <stop offset="50%" stopColor="#b8c5d6" />
        <stop offset="100%" stopColor="#78909c" />
      </linearGradient>
      <linearGradient id="handle" x1="44" y1="84" x2="44" y2="128" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#b0bec5" />
        <stop offset="100%" stopColor="#607d8b" />
      </linearGradient>
      <linearGradient id="silver" x1="0" y1="0" x2="200" y2="200" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#e2e8f0" />
        <stop offset="50%" stopColor="#94a3b8" />
        <stop offset="100%" stopColor="#475569" />
      </linearGradient>
    </defs>
  </svg>
)

export default ChampionBadge
