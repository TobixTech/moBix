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
  const [clickThreshold] = useState(2)

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
    console.log("[v0] Card click tracked:", newCount, "/", clickThreshold)

    if (newCount >= clickThreshold) {
      console.log("[v0] Showing interstitial ad after", clickThreshold, "clicks")
      setShowAd(true)
      setClickCount(0)
    } else {
      setClickCount(newCount)
    }
  }, [clickCount, clickThreshold, adCode])

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
