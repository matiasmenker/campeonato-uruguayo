// Shared SVG background for all hero sections.
// Brand palette: #0a377b · #438fd7 · #1b5cab · #134692

const HeroTexture = () => (
  <svg
    className="absolute inset-0 h-full w-full"
    xmlns="http://www.w3.org/2000/svg"
    preserveAspectRatio="xMidYMid slice"
  >
    <defs>
      <linearGradient id="heroBase" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%"   stopColor="#0a377b" />
        <stop offset="50%"  stopColor="#071f48" />
        <stop offset="100%" stopColor="#030e22" />
      </linearGradient>
      <radialGradient id="heroGA" cx="82%" cy="8%" r="55%">
        <stop offset="0%"   stopColor="#438fd7" stopOpacity="0.70" />
        <stop offset="100%" stopColor="#438fd7" stopOpacity="0" />
      </radialGradient>
      <radialGradient id="heroGB" cx="10%" cy="85%" r="58%">
        <stop offset="0%"   stopColor="#1b5cab" stopOpacity="0.72" />
        <stop offset="100%" stopColor="#1b5cab" stopOpacity="0" />
      </radialGradient>
      <radialGradient id="heroGC" cx="48%" cy="50%" r="42%">
        <stop offset="0%"   stopColor="#134692" stopOpacity="0.28" />
        <stop offset="100%" stopColor="#134692" stopOpacity="0" />
      </radialGradient>
      <radialGradient id="heroGD" cx="88%" cy="82%" r="40%">
        <stop offset="0%"   stopColor="#0a377b" stopOpacity="0.50" />
        <stop offset="100%" stopColor="#0a377b" stopOpacity="0" />
      </radialGradient>
      <pattern id="heroDots" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
        <circle cx="2" cy="2" r="1.5" fill="rgba(67,143,215,0.12)" />
      </pattern>
    </defs>

    <rect width="100%" height="100%" fill="url(#heroBase)" />
    <rect width="100%" height="100%" fill="url(#heroGA)" />
    <rect width="100%" height="100%" fill="url(#heroGB)" />
    <rect width="100%" height="100%" fill="url(#heroGC)" />
    <rect width="100%" height="100%" fill="url(#heroGD)" />
    <rect width="100%" height="100%" fill="url(#heroDots)" />

    <circle cx="-4%" cy="112%" r="68%" fill="none" stroke="rgba(27,92,171,0.20)" strokeWidth="1.5" />
    <circle cx="-4%" cy="112%" r="50%" fill="none" stroke="rgba(27,92,171,0.12)" strokeWidth="1" />
    <circle cx="106%" cy="-8%" r="55%" fill="none" stroke="rgba(67,143,215,0.15)" strokeWidth="1" />
  </svg>
)

export default HeroTexture
