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

export function PromotionModalWrapper() {
  const { user, isSignedIn, isLoaded } = useUser()
  const [settings, setSettings] = useState<PromotionSettings | null>(null)
  const [userCountry, setUserCountry] = useState("")
  const [userIp, setUserIp] = useState("")
  const [isReady, setIsReady] = useState(false)
  const [targetedPromotion, setTargetedPromotion] = useState<any>(null)

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
        let ip = ""

        if (isSignedIn && user?.unsafeMetadata?.country) {
          country = user.unsafeMetadata.country as string
        } else {
          // Fallback to IP detection
          try {
            const ipRes = await fetch("/api/get-ip")
            const ipData = await ipRes.json()
            country = ipData.country || "Unknown"
            ip = ipData.ip || ""
          } catch {
            country = "Unknown"
          }
        }

        console.log("[v0] User country:", country)
        setUserCountry(country)
        setUserIp(ip)

        if (isSignedIn && user?.id) {
          try {
            const userDbRes = await fetch(`/api/user/me`)
            const userData = await userDbRes.json()

            if (userData?.id) {
              const targetedRes = await fetch(`/api/promotions/target-user?userId=${userData.id}`)
              const targetedData = await targetedRes.json()

              if (targetedData.hasTargetedPromotion) {
                setTargetedPromotion(targetedData.promotion)

                // Record view for analytics
                await fetch("/api/promotions/analytics", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    userId: userData.id,
                    ipAddress: ip,
                    country: country,
                    submitted: false,
                  }),
                })
              }
            }
          } catch {
            // Continue with normal flow
          }
        }

        setIsReady(true)
      } catch (err) {
        console.error("[v0] Error fetching promotion data:", err)
      }
    }

    fetchData()
  }, [isLoaded, isSignedIn, user])

  const handleClose = async () => {
    if (targetedPromotion) {
      try {
        await fetch("/api/promotions/target-user", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            promotionId: targetedPromotion.id,
            action: "dismissed",
          }),
        })
      } catch {
        // Ignore errors
      }
    }
  }

  const handleSuccess = async () => {
    if (targetedPromotion) {
      try {
        await fetch("/api/promotions/target-user", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            promotionId: targetedPromotion.id,
            action: "shown",
          }),
        })
      } catch {
        // Ignore errors
      }
    }
  }

  if (!isReady || !settings || !userCountry) {
    return null
  }

  return (
    <PromotionModal
      userCountry={userCountry}
      settings={settings}
      onClose={handleClose}
      onSuccess={handleSuccess}
      isTargeted={!!targetedPromotion}
    />
  )
}

// Keep default export for backwards compatibility
export default PromotionModalWrapper
