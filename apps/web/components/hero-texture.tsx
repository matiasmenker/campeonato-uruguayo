// Shared dot-grid texture for all hero sections without a photo background.
// Renders on top of bg-slate-900 — gives subtle depth without colour.

const HeroTexture = () => (
  <svg className="absolute inset-0 h-full w-full" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <pattern id="heroDots" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
        <circle cx="2" cy="2" r="1.5" fill="rgba(255,255,255,0.08)" />
      </pattern>
    </defs>
    <rect width="100%" height="100%" fill="url(#heroDots)" />
  </svg>
)

export default HeroTexture
