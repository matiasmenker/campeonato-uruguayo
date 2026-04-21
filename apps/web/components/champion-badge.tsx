// Original badge design inspired by Uruguayan football championship patches.
// Shield shape + stylized trophy cup. Not a copy of any official AUF artwork.

const ChampionBadge = ({ year, size = 80 }: { year: string; size?: number }) => (
  <svg
    width={size}
    height={size * 1.15}
    viewBox="0 0 100 115"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-label={`Champion badge ${year}`}
  >
    {/* Shield outline */}
    <path
      d="M50 4 L92 18 L92 58 Q92 88 50 112 Q8 88 8 58 L8 18 Z"
      fill="url(#shieldGrad)"
      stroke="url(#borderGrad)"
      strokeWidth="1.5"
    />

    {/* Inner shield inset */}
    <path
      d="M50 11 L85 23 L85 57 Q85 82 50 104 Q15 82 15 57 L15 23 Z"
      fill="none"
      stroke="rgba(255,255,255,0.15)"
      strokeWidth="0.8"
    />

    {/* Trophy cup — body */}
    <path
      d="M38 52 Q38 64 50 67 Q62 64 62 52 L62 42 L38 42 Z"
      fill="url(#cupGrad)"
      stroke="rgba(255,255,255,0.3)"
      strokeWidth="0.6"
    />

    {/* Trophy cup — lid */}
    <rect x="36" y="39" width="28" height="4" rx="2" fill="url(#cupGrad)" stroke="rgba(255,255,255,0.3)" strokeWidth="0.5" />
    <rect x="41" y="36" width="18" height="4" rx="2" fill="url(#cupGrad)" stroke="rgba(255,255,255,0.3)" strokeWidth="0.5" />
    <rect x="46" y="33" width="8" height="4" rx="1.5" fill="url(#cupGrad)" stroke="rgba(255,255,255,0.3)" strokeWidth="0.5" />
    {/* Knob */}
    <circle cx="50" cy="32" r="2" fill="url(#cupGrad)" stroke="rgba(255,255,255,0.4)" strokeWidth="0.5" />

    {/* Trophy handles */}
    <path d="M38 45 Q30 45 30 52 Q30 58 38 57" stroke="url(#cupGrad)" strokeWidth="2.5" fill="none" strokeLinecap="round" />
    <path d="M62 45 Q70 45 70 52 Q70 58 62 57" stroke="url(#cupGrad)" strokeWidth="2.5" fill="none" strokeLinecap="round" />

    {/* Trophy stem */}
    <rect x="47" y="67" width="6" height="8" rx="1" fill="url(#cupGrad)" stroke="rgba(255,255,255,0.2)" strokeWidth="0.5" />

    {/* Trophy base */}
    <rect x="40" y="74" width="20" height="4" rx="2" fill="url(#cupGrad)" stroke="rgba(255,255,255,0.3)" strokeWidth="0.5" />
    <rect x="37" y="77" width="26" height="3.5" rx="1.5" fill="url(#cupGrad)" stroke="rgba(255,255,255,0.3)" strokeWidth="0.5" />

    {/* Year text */}
    <text
      x="50"
      y="96"
      textAnchor="middle"
      fontSize="7"
      fontFamily="system-ui, sans-serif"
      fontWeight="700"
      letterSpacing="1.5"
      fill="rgba(255,255,255,0.9)"
    >
      {year}
    </text>

    {/* "CHAMPION" label */}
    <text
      x="50"
      y="105"
      textAnchor="middle"
      fontSize="5"
      fontFamily="system-ui, sans-serif"
      fontWeight="600"
      letterSpacing="1"
      fill="rgba(255,255,255,0.55)"
    >
      CHAMPION
    </text>

    <defs>
      <linearGradient id="shieldGrad" x1="50" y1="4" x2="50" y2="112" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#334155" />
        <stop offset="100%" stopColor="#0f172a" />
      </linearGradient>
      <linearGradient id="borderGrad" x1="0" y1="0" x2="100" y2="115" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#94a3b8" />
        <stop offset="50%" stopColor="#e2e8f0" />
        <stop offset="100%" stopColor="#64748b" />
      </linearGradient>
      <linearGradient id="cupGrad" x1="38" y1="32" x2="62" y2="80" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#e2e8f0" />
        <stop offset="40%" stopColor="#cbd5e1" />
        <stop offset="100%" stopColor="#94a3b8" />
      </linearGradient>
    </defs>
  </svg>
)

export default ChampionBadge
