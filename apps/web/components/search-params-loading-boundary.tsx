"use client"

import { useState, useEffect } from "react"
import type { ReactNode } from "react"

// ─── URL-change subscription ───────────────────────────────────────────────────
// Next.js App Router wraps router.push() in startTransition internally. That
// defers React state updates, so useSearchParams() still returns the OLD value
// while the transition is pending — the Suspense fallback never fires.
//
// The fix: patch history.pushState directly. The browser URL changes
// synchronously when pushState is called (before React touches anything), so
// reading window.location.search at that point gives us the new params and lets
// us show the skeleton immediately, outside of the transition machinery.

type Listener = () => void
let listeners: Listener[] = []
const notifyAll = () => listeners.forEach(fn => fn())

if (typeof window !== "undefined" && !(window as unknown as Record<string, unknown>).__splbPatched) {
  ;(window as unknown as Record<string, unknown>).__splbPatched = true
  const orig = history.pushState.bind(history)
  history.pushState = (...args: Parameters<typeof history.pushState>) => {
    orig(...args)
    notifyAll()
  }
  window.addEventListener("popstate", notifyAll)
}

// Returns window.location.search and updates whenever the URL changes.
// Starts as "" to avoid SSR/hydration mismatch.
const useWindowSearch = (): string => {
  const [search, setSearch] = useState("")

  useEffect(() => {
    const sync = () => setSearch(window.location.search)
    sync()
    listeners.push(sync)
    return () => {
      listeners = listeners.filter(fn => fn !== sync)
    }
  }, [])

  return search
}

// ─── Component ────────────────────────────────────────────────────────────────

interface SearchParamsLoadingBoundaryProps {
  // The param values the server actually rendered with (resolved, not raw URL).
  committedParams: Record<string, string | null>
  skeleton: ReactNode
  children: ReactNode
}

// Shows `skeleton` as soon as any URL param diverges from committedParams,
// then switches to `children` once the new server render arrives with matching
// committedParams. The switch happens outside React's transition so it is
// always immediate — no frozen UI.
const SearchParamsLoadingBoundary = ({
  committedParams,
  skeleton,
  children,
}: SearchParamsLoadingBoundaryProps) => {
  const urlParams = new URLSearchParams(useWindowSearch())

  const isNavigating = Object.entries(committedParams).some(([key, committedValue]) => {
    const urlValue = urlParams.get(key)
    // Param absent from URL → user hasn't touched it, default was rendered correctly
    if (urlValue === null) return false
    return urlValue !== committedValue
  })

  if (isNavigating) return <>{skeleton}</>
  return <>{children}</>
}

export default SearchParamsLoadingBoundary
