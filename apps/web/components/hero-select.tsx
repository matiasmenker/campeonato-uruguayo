"use client"

// Thin wrapper — applies frosted-glass styling to the Radix Select Trigger
// so it looks consistent on every dark hero section.

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

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
  /** Opens upward — use for selects anchored near the bottom of a hero */
  openUp?: boolean
}

const HeroSelect = ({
  value,
  onValueChange,
  options,
  placeholder,
  disabled,
  openUp = false,
}: HeroSelectProps) => (
  <Select value={value} onValueChange={onValueChange} disabled={disabled}>
    <SelectTrigger
      className="h-8 min-w-28 rounded-xl border-white/15 bg-black/40 px-3 text-xs font-semibold text-white/90 backdrop-blur-sm transition-colors hover:bg-black/55 focus-visible:ring-white/25 focus-visible:ring-offset-0 data-placeholder:text-white/50 [&_[data-slot=select-value]]:text-white [&_svg]:text-white/60"
    >
      <SelectValue placeholder={placeholder} />
    </SelectTrigger>
    <SelectContent
      position="popper"
      align="end"
      side={openUp ? "top" : "bottom"}
      sideOffset={6}
    >
      {options.map(option => (
        <SelectItem key={option.id} value={String(option.id)}>
          {option.name}
        </SelectItem>
      ))}
    </SelectContent>
  </Select>
)

export default HeroSelect
