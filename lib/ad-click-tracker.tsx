"use client"

import { createContext, useContext, useState, useCallback, type ReactNode } from "react"

interface AdClickTrackerContextType {
  trackCardClick: () => boolean // Returns true if ad should show
  resetClickCount: () => void
}

const AdClickTrackerContext = createContext<AdClickTrackerContextType | undefined>(undefined)

export function AdClickTrackerProvider({ children }: { children: ReactNode }) {
  const [clickCount, setClickCount] = useState(0)
  const CLICKS_BEFORE_AD = 3 // Show ad after every 3 clicks

  const trackCardClick = useCallback(() => {
    const newCount = clickCount + 1
    setClickCount(newCount)

    // Show ad every 3 clicks
    if (newCount >= CLICKS_BEFORE_AD) {
      setClickCount(0) // Reset counter
      return true
    }
    return false
  }, [clickCount])

  const resetClickCount = useCallback(() => {
    setClickCount(0)
  }, [])

  return (
    <AdClickTrackerContext.Provider value={{ trackCardClick, resetClickCount }}>
      {children}
    </AdClickTrackerContext.Provider>
  )
}

export function useAdClickTracker() {
  const context = useContext(AdClickTrackerContext)
  if (!context) {
    throw new Error("useAdClickTracker must be used within AdClickTrackerProvider")
  }
  return context
}
