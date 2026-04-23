// Shared SVG background for all hero sections.
// Amanecer — #438fd7 top bloom · #0a377b base · #1b5cab / #134692 accents

const HeroTexture = () => (
  <svg
    className="absolute inset-0 h-full w-full"
    xmlns="http://www.w3.org/2000/svg"
    preserveAspectRatio="xMidYMid slice"
  >
    <defs>
      <linearGradient id="heroBase" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%"   stopColor="#0f3572" />
        <stop offset="55%"  stopColor="#0d2a58" />
        <stop offset="100%" stopColor="#0f3068" />
      </linearGradient>
      <radialGradient id="heroG1" cx="55%" cy="2%" r="72%">
        <stop offset="0%"   stopColor="#438fd7" stopOpacity="1" />
        <stop offset="100%" stopColor="#438fd7" stopOpacity="0" />
      </radialGradient>
      <radialGradient id="heroG2" cx="10%" cy="80%" r="55%">
        <stop offset="0%"   stopColor="#0a377b" stopOpacity="0.85" />
        <stop offset="100%" stopColor="#0a377b" stopOpacity="0" />
      </radialGradient>
      <radialGradient id="heroG3" cx="85%" cy="78%" r="48%">
        <stop offset="0%"   stopColor="#1b5cab" stopOpacity="0.70" />
        <stop offset="100%" stopColor="#1b5cab" stopOpacity="0" />
      </radialGradient>
      <radialGradient id="heroG4" cx="50%" cy="45%" r="40%">
        <stop offset="0%"   stopColor="#134692" stopOpacity="0.35" />
        <stop offset="100%" stopColor="#134692" stopOpacity="0" />
      </radialGradient>
    </defs>

    <rect width="100%" height="100%" fill="url(#heroBase)" />
    <rect width="100%" height="100%" fill="url(#heroG1)" />
    <rect width="100%" height="100%" fill="url(#heroG2)" />
    <rect width="100%" height="100%" fill="url(#heroG3)" />
    <rect width="100%" height="100%" fill="url(#heroG4)" />

    <circle cx="50%" cy="-20%" r="88%" fill="none" stroke="rgba(67,143,215,0.16)" strokeWidth="2" />
    <circle cx="50%" cy="-20%" r="64%" fill="none" stroke="rgba(67,143,215,0.09)" strokeWidth="1" />
    <circle cx="-4%" cy="112%" r="65%" fill="none" stroke="rgba(10,55,123,0.22)" strokeWidth="1.5" />
  </svg>
)

export default HeroTexture
