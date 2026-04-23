"use client"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { IconChevronDown } from "@tabler/icons-react"

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
  isLoading?: boolean
  openUp?: boolean
}

const HeroSelect = ({
  value,
  onValueChange,
  options,
  placeholder,
  disabled,
  isLoading = false,
  openUp = false,
}: HeroSelectProps) => (
  <Select value={value} onValueChange={onValueChange} disabled={disabled || isLoading}>
    <SelectTrigger
      className="h-8 min-w-28 gap-1.5 rounded-xl border border-white/20 bg-white/15 pl-3 pr-2.5 text-sm font-semibold text-white outline-none ring-0 backdrop-blur-sm transition-colors hover:bg-white/25 focus:ring-0 disabled:cursor-not-allowed disabled:opacity-50 [&_svg[aria-hidden]]:hidden"
    >
      <SelectValue placeholder={placeholder} />
      {isLoading ? (
        <span className="h-3.5 w-3.5 shrink-0 animate-spin rounded-full border-2 border-white/30 border-t-white" />
      ) : (
        <IconChevronDown size={14} className="shrink-0 text-white/65" />
      )}
    </SelectTrigger>
    <SelectContent
      position="popper"
      align="end"
      side={openUp ? "top" : "bottom"}
      sideOffset={6}
      className="min-w-36 overflow-hidden rounded-xl border border-slate-200/80 bg-white p-1 shadow-lg"
    >
      {options.map(option => (
        <SelectItem
          key={option.id}
          value={String(option.id)}
          className="cursor-pointer rounded-lg px-3 py-2 text-sm font-semibold text-slate-800 transition-colors hover:bg-slate-100 focus:bg-slate-100 data-[state=checked]:text-slate-950"
        >
          {option.name}
        </SelectItem>
      ))}
    </SelectContent>
  </Select>
)

export default HeroSelect
