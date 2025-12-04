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
  const { user, isSignedIn } = useUser()
  const [settings, setSettings] = useState<PromotionSettings | null>(null)
  const [userCountry, setUserCountry] = useState("")

  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch promotion settings
        const settingsRes = await fetch("/api/promotions/settings")
        const settingsData = await settingsRes.json()
        setSettings(settingsData)

        // Get user country from Clerk metadata or detect
        if (isSignedIn && user?.unsafeMetadata?.country) {
          setUserCountry(user.unsafeMetadata.country as string)
        } else {
          // Fallback to IP detection
          const ipRes = await fetch("/api/get-ip")
          const ipData = await ipRes.json()
          setUserCountry(ipData.country || "Unknown")
        }
      } catch {
        // Silently fail
      }
    }

    fetchData()
  }, [isSignedIn, user])

  if (!settings || !userCountry) return null

  return <PromotionModal userCountry={userCountry} settings={settings} />
}
