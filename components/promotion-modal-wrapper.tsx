"use client"

import { useEffect, useState, useCallback } from "react"
import { useUser } from "@clerk/nextjs"
import PromotionModal from "@/components/promotion-modal"

interface PromotionSettings {
  isActive: boolean
  globallyDisabled: boolean
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
  const [isReady, setIsReady] = useState(false)
  const [targetedPromotion, setTargetedPromotion] = useState<any>(null)
  const [isNewUser, setIsNewUser] = useState(false)

  const checkForTargetedPromotion = useCallback(async (dbUserId: string) => {
    try {
      const res = await fetch(`/api/promotions/target-user?userId=${dbUserId}`, { cache: "no-store" })
      const data = await res.json()

      if (data.hasTargetedPromotion) {
        setTargetedPromotion(data.promotion)
        return true
      }
    } catch {
      // Ignore errors
    }
    return false
  }, [])

  useEffect(() => {
    if (!isLoaded) return

    async function fetchData() {
      try {
        // Fetch promotion settings
        const settingsRes = await fetch("/api/promotions/settings", { cache: "no-store" })
        const settingsData = await settingsRes.json()
        setSettings(settingsData)

        if (settingsData.globallyDisabled) {
          setIsReady(true)
          return
        }

        // Get user country
        let country = ""

        if (isSignedIn && user?.unsafeMetadata?.country) {
          country = user.unsafeMetadata.country as string
        } else {
          try {
            const ipRes = await fetch("/api/get-ip")
            const ipData = await ipRes.json()
            country = ipData.country || "Unknown"
          } catch {
            country = "Unknown"
          }
        }

        setUserCountry(country)

        if (isSignedIn && user?.createdAt) {
          const createdAt = new Date(user.createdAt)
          const now = new Date()
          const diffMinutes = (now.getTime() - createdAt.getTime()) / (1000 * 60)

          if (diffMinutes < 5) {
            setIsNewUser(true)
            // Clear any previous promo_modal_shown for new users
            localStorage.removeItem("promo_modal_shown")
          }
        }

        // Check for targeted promotion
        if (isSignedIn && user?.id) {
          try {
            const userDbRes = await fetch(`/api/user/me`)
            const userData = await userDbRes.json()

            if (userData?.id) {
              await checkForTargetedPromotion(userData.id)
            }
          } catch {
            // Continue
          }
        }

        setIsReady(true)
      } catch (err) {
        console.error("Error fetching promotion data:", err)
        setIsReady(true)
      }
    }

    fetchData()

    let pollInterval: NodeJS.Timeout | null = null

    if (isSignedIn) {
      pollInterval = setInterval(async () => {
        try {
          const userDbRes = await fetch(`/api/user/me`)
          const userData = await userDbRes.json()

          if (userData?.id && !targetedPromotion) {
            await checkForTargetedPromotion(userData.id)
          }
        } catch {
          // Ignore
        }
      }, 10000)
    }

    return () => {
      if (pollInterval) clearInterval(pollInterval)
    }
  }, [isLoaded, isSignedIn, user, checkForTargetedPromotion, targetedPromotion])

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
        setTargetedPromotion(null)
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
        setTargetedPromotion(null)
      } catch {
        // Ignore errors
      }
    }
  }

  if (!isReady || !settings || settings.globallyDisabled) {
    return null
  }

  if (!userCountry) {
    return null
  }

  const shouldForceShow = isNewUser || !!targetedPromotion

  return (
    <PromotionModal
      userCountry={userCountry}
      settings={settings}
      onClose={handleClose}
      onSuccess={handleSuccess}
      isTargeted={!!targetedPromotion}
      forceShow={shouldForceShow}
    />
  )
}

export default PromotionModalWrapper
