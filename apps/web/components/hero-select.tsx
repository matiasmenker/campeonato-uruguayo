"use client"

// Styled native <select> for dark hero sections.
// Uses the same chevron SVG as the team-season-selector to keep a consistent look.

const CHEVRON_SVG = `url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2216%22%20height%3D%2216%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22rgba(255%2C255%2C255%2C0.65)%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpath%20d%3D%22M6%209l6%206%206-6%22%2F%3E%3C%2Fsvg%3E')`

interface HeroSelectOption {
  id: number
  name: string
}

interface HeroSelectProps {
  value: string
  onValueChange: (value: string) => void
  options: HeroSelectOption[]
  placeholder?: string
  disabled?: boolean
  /** Ignored for native select — kept for API compatibility */
  openUp?: boolean
}

const HeroSelect = ({
  value,
  onValueChange,
  options,
  disabled,
}: HeroSelectProps) => (
  <select
    value={value}
    onChange={event => onValueChange(event.target.value)}
    disabled={disabled}
    className="h-8 min-w-28 cursor-pointer appearance-none rounded-xl border border-white/15 bg-black/40 pl-3 pr-8 text-sm font-semibold text-white/90 backdrop-blur-sm outline-none transition-colors hover:bg-black/55 disabled:cursor-not-allowed disabled:opacity-50"
    style={{ backgroundImage: CHEVRON_SVG, backgroundPosition: "right 8px center", backgroundRepeat: "no-repeat" }}
  >
    {options.map(option => (
      <option key={option.id} value={String(option.id)} className="bg-slate-900 text-white">
        {option.name}
      </option>
    ))}
  </select>
)

export default HeroSelect
