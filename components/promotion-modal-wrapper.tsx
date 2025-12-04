"use client"

import { useEffect, useState } from "react"
import { useUser } from "@clerk/nextjs"
import PromotionModal from "@/components/promotion-modal"

interface PromotionSettings {
  isActive: boolean
  enabledCountries: string[]
  headline: string
  subtext: string
  successMessage: string
  networkOptions: Record<string, string[]>
}

export default function PromotionModalWrapper() {
  const { user, isSignedIn, isLoaded } = useUser()
  const [settings, setSettings] = useState<PromotionSettings | null>(null)
  const [userCountry, setUserCountry] = useState("")
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    if (!isLoaded) return

    async function fetchData() {
      try {
        // Fetch promotion settings
        const settingsRes = await fetch("/api/promotions/settings", { cache: "no-store" })
        const settingsData = await settingsRes.json()

        console.log("[v0] Promotion settings:", settingsData)

        setSettings(settingsData)

        // Get user country from Clerk metadata or detect
        let country = ""
        if (isSignedIn && user?.unsafeMetadata?.country) {
          country = user.unsafeMetadata.country as string
        } else {
          // Fallback to IP detection
          try {
            const ipRes = await fetch("/api/get-ip")
            const ipData = await ipRes.json()
            country = ipData.country || "Unknown"
          } catch {
            country = "Unknown"
          }
        }

        console.log("[v0] User country:", country)
        setUserCountry(country)
        setIsReady(true)
      } catch (err) {
        console.error("[v0] Error fetching promotion data:", err)
      }
    }

    fetchData()
  }, [isLoaded, isSignedIn, user])

  if (!isReady || !settings || !userCountry) {
    return null
  }

  return <PromotionModal userCountry={userCountry} settings={settings} />
}
