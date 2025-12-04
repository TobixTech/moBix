"use client"

import { useState, useEffect } from "react"
import { Bell, BellOff, X, Loader } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { subscribeToPush, unsubscribeFromPush } from "@/lib/server-actions"
import { useAuth } from "@clerk/nextjs"

export default function NotificationPermission() {
  const { isSignedIn } = useAuth()
  const [permission, setPermission] = useState<NotificationPermission>("default")
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [showPrompt, setShowPrompt] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      setPermission(Notification.permission)
    }

    // Check if already subscribed
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.ready.then((registration) => {
        registration.pushManager.getSubscription().then((subscription) => {
          setIsSubscribed(!!subscription)
        })
      })
    }

    // Show prompt after 5 seconds if not decided
    const timer = setTimeout(() => {
      if (Notification.permission === "default" && isSignedIn) {
        setShowPrompt(true)
      }
    }, 5000)

    return () => clearTimeout(timer)
  }, [isSignedIn])

  const handleSubscribe = async () => {
    if (!isSignedIn) {
      alert("Please sign in to enable notifications")
      return
    }

    setIsLoading(true)

    try {
      const permResult = await Notification.requestPermission()
      setPermission(permResult)

      if (permResult === "granted") {
        const registration = await navigator.serviceWorker.ready
        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || ""),
        })

        const result = await subscribeToPush({
          endpoint: subscription.endpoint,
          keys: {
            p256dh: arrayBufferToBase64(subscription.getKey("p256dh")!),
            auth: arrayBufferToBase64(subscription.getKey("auth")!),
          },
        })

        if (result.success) {
          setIsSubscribed(true)
        }
      }
    } catch (error) {
      console.error("Error subscribing to push:", error)
    }

    setIsLoading(false)
    setShowPrompt(false)
  }

  const handleUnsubscribe = async () => {
    setIsLoading(true)

    try {
      const registration = await navigator.serviceWorker.ready
      const subscription = await registration.pushManager.getSubscription()

      if (subscription) {
        await subscription.unsubscribe()
        await unsubscribeFromPush(subscription.endpoint)
        setIsSubscribed(false)
      }
    } catch (error) {
      console.error("Error unsubscribing:", error)
    }

    setIsLoading(false)
  }

  // Don't show if not supported
  if (typeof window === "undefined" || !("Notification" in window)) {
    return null
  }

  return (
    <>
      {/* Settings Toggle */}
      <button
        onClick={isSubscribed ? handleUnsubscribe : handleSubscribe}
        disabled={isLoading || permission === "denied"}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-all ${
          isSubscribed
            ? "bg-[#00FFFF]/20 border-[#00FFFF] text-[#00FFFF]"
            : permission === "denied"
              ? "bg-[#1A1B23] border-[#2A2B33] text-white/30 cursor-not-allowed"
              : "bg-[#1A1B23] border-[#2A2B33] text-white hover:border-[#00FFFF]"
        }`}
      >
        {isLoading ? (
          <Loader className="w-4 h-4 animate-spin" />
        ) : isSubscribed ? (
          <Bell className="w-4 h-4" />
        ) : (
          <BellOff className="w-4 h-4" />
        )}
        <span className="text-sm">{isSubscribed ? "Notifications On" : "Enable Notifications"}</span>
      </button>

      {/* Initial Prompt */}
      <AnimatePresence>
        {showPrompt && (
          <motion.div
            className="fixed bottom-24 right-4 z-50 max-w-sm"
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
          >
            <div className="bg-[#1A1B23] border border-[#2A2B33] rounded-2xl p-4 shadow-xl">
              <button
                onClick={() => setShowPrompt(false)}
                className="absolute top-2 right-2 p-1 hover:bg-white/10 rounded-lg"
              >
                <X className="w-4 h-4 text-white/50" />
              </button>
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 rounded-full bg-[#00FFFF]/20 flex items-center justify-center flex-shrink-0">
                  <Bell className="w-6 h-6 text-[#00FFFF]" />
                </div>
                <div>
                  <h4 className="text-white font-bold mb-1">Stay Updated!</h4>
                  <p className="text-white/50 text-sm mb-3">Get notified when new movies are added to moBix.</p>
                  <div className="flex gap-2">
                    <button
                      onClick={handleSubscribe}
                      disabled={isLoading}
                      className="px-4 py-2 bg-[#00FFFF] text-[#0B0C10] font-bold rounded-lg text-sm hover:shadow-lg hover:shadow-[#00FFFF]/50 transition"
                    >
                      {isLoading ? "Enabling..." : "Enable"}
                    </button>
                    <button
                      onClick={() => setShowPrompt(false)}
                      className="px-4 py-2 text-white/50 text-sm hover:text-white transition"
                    >
                      Not Now
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

// Helper functions
function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/")
  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}

function arrayBufferToBase64(buffer: ArrayBuffer) {
  const bytes = new Uint8Array(buffer)
  let binary = ""
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return window.btoa(binary)
}
