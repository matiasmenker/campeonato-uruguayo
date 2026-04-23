"use client"

import { useState, useEffect } from "react"
import type { ReactNode } from "react"

type Listener = (loading: boolean) => void
const listeners = new Set<Listener>()

export const signalNavigationStart = () => {
  listeners.forEach(fn => fn(true))
}

const signalNavigationEnd = () => {
  listeners.forEach(fn => fn(false))
}

export const useIsNavigating = () => {
  const [isNavigating, setIsNavigating] = useState(false)

  useEffect(() => {
    listeners.add(setIsNavigating)
    return () => { listeners.delete(setIsNavigating) }
  }, [])

  return isNavigating
}

interface SearchParamsLoadingBoundaryProps {
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

  const committedKey = JSON.stringify(committedParams)
  useEffect(() => {
    signalNavigationEnd()
  }, [committedKey])

  if (isNavigating) return <>{skeleton}</>
  return <>{children}</>
}

export default SearchParamsLoadingBoundary
