"use client"

import { useState, useEffect } from "react"
import type { ReactNode } from "react"

// ─── Pub-sub signal ───────────────────────────────────────────────────────────
// Selectors call signalNavigationStart() before router.push().
// The boundary subscribes and shows skeleton immediately.
// No history.pushState patching — avoids all useInsertionEffect issues.

type Listener = (loading: boolean) => void
const listeners = new Set<Listener>()

export const signalNavigationStart = () => {
  listeners.forEach(fn => fn(true))
}

const signalNavigationEnd = () => {
  listeners.forEach(fn => fn(false))
}

// ─── Hook ─────────────────────────────────────────────────────────────────────
// Use in selector components to disable themselves while navigation is in flight.

export const useIsNavigating = () => {
  const [isNavigating, setIsNavigating] = useState(false)

  useEffect(() => {
    listeners.add(setIsNavigating)
    return () => { listeners.delete(setIsNavigating) }
  }, [])

  return isNavigating
}

// ─── Component ────────────────────────────────────────────────────────────────

interface SearchParamsLoadingBoundaryProps {
  // The param values the server actually rendered with (resolved, not raw URL).
  committedParams: Record<string, string | null>
  skeleton: ReactNode
  children: ReactNode
}

const SearchParamsLoadingBoundary = ({
  committedParams,
  skeleton,
  children,
}: SearchParamsLoadingBoundaryProps) => {
  const [isNavigating, setIsNavigating] = useState(false)

  useEffect(() => {
    listeners.add(setIsNavigating)
    return () => { listeners.delete(setIsNavigating) }
  }, [])

  // When committedParams change it means the server delivered new content —
  // navigation is complete, hide the skeleton.
  const committedKey = JSON.stringify(committedParams)
  useEffect(() => {
    signalNavigationEnd()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [committedKey])

  if (isNavigating) return <>{skeleton}</>
  return <>{children}</>
}

export default SearchParamsLoadingBoundary
