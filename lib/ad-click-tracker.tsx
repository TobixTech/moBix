"use client"

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react"
import InterstitialAd from "@/components/interstitial-ad"

interface AdClickTrackerContextType {
  trackCardClick: () => void
  trackButtonClick: (buttonName: string) => void
  resetClickCount: () => void
}

const AdClickTrackerContext = createContext<AdClickTrackerContextType | undefined>(undefined)

export function AdClickTrackerProvider({ children }: { children: ReactNode }) {
  const [clickCount, setClickCount] = useState(0)
  const [showAd, setShowAd] = useState(false)
  const [adCode, setAdCode] = useState<string>("")
  const [clickPattern] = useState([2, 3]) // 2 clicks, then 3 clicks, repeat pattern
  const [patternIndex, setPatternIndex] = useState(0)

  useEffect(() => {
    fetch("/api/ad-settings")
      .then((res) => res.json())
      .then((data) => {
        if (data?.interstitialAdCode && data.interstitialAdCode.trim() !== "") {
          console.log("[v0] Interstitial ad code loaded successfully")
          setAdCode(data.interstitialAdCode)
        } else {
          console.log("[v0] No interstitial ad code found in settings")
        }
      })
      .catch((err) => console.error("[v0] Failed to load ad settings:", err))
  }, [])

  const trackCardClick = useCallback(() => {
    if (!adCode || adCode.trim() === "") {
      console.log("[v0] No ad code available, skipping interstitial")
      return
    }

    const newCount = clickCount + 1
    const targetClicks = clickPattern[patternIndex]

    console.log("[v0] Card click tracked:", newCount, "/", targetClicks)

    if (newCount >= targetClicks) {
      console.log("[v0] Showing interstitial ad")
      setShowAd(true)
      setClickCount(0)
      setPatternIndex((prev) => (prev + 1) % clickPattern.length)
    } else {
      setClickCount(newCount)
    }
  }, [clickCount, patternIndex, clickPattern, adCode])

  const trackButtonClick = useCallback(
    (buttonName: string) => {
      console.log("[v0] Button click tracked:", buttonName)
      if (adCode && adCode.trim() !== "" && Math.random() < 0.3) {
        console.log("[v0] Showing interstitial ad from button click")
        setShowAd(true)
      }
    },
    [adCode],
  )

  const resetClickCount = useCallback(() => {
    setClickCount(0)
    setPatternIndex(0)
  }, [])

  return (
    <AdClickTrackerContext.Provider value={{ trackCardClick, trackButtonClick, resetClickCount }}>
      {children}
      {showAd && adCode && adCode.trim() !== "" && <InterstitialAd adCode={adCode} onClose={() => setShowAd(false)} />}
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
