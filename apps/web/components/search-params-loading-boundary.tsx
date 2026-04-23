"use client"

import { useSearchParams } from "next/navigation"
import type { ReactNode } from "react"

interface SearchParamsLoadingBoundaryProps {
  // The resolved param values the server actually rendered with.
  // Keys are param names; values are the effective string values (or null if unused).
  committedParams: Record<string, string | null>
  skeleton: ReactNode
  children: ReactNode
}

// Renders `skeleton` as soon as any URL param diverges from what the server
// committed, then switches back to `children` once the new server render
// arrives with matching committedParams.
//
// This works because useSearchParams() reflects the URL instantly when
// router.push() fires — before Next.js sends the new RSC payload — so the
// boundary detects the mismatch and shows the skeleton immediately, bypassing
// the startTransition that Next.js applies internally to soft navigations
// (which would otherwise keep the old UI frozen with no loading indicator).
const SearchParamsLoadingBoundary = ({
  committedParams,
  skeleton,
  children,
}: SearchParamsLoadingBoundaryProps) => {
  const searchParams = useSearchParams()

  const isNavigating = Object.entries(committedParams).some(([key, committedValue]) => {
    const urlValue = searchParams.get(key)
    // Param absent from URL → user hasn't touched it, default was rendered correctly
    if (urlValue === null) return false
    return urlValue !== committedValue
  })

  if (isNavigating) return <>{skeleton}</>
  return <>{children}</>
}

export default SearchParamsLoadingBoundary
