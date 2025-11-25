"use client"

import { useState, useEffect } from "react"
import { Download, X } from "lucide-react" // Removed Smartphone import
import { Button } from "@/components/ui/button"
// 1. Import your logo image
import LogoImage from './IMG-20251117-WA0002.jpg' // **<--- CHECK THIS PATH!**
import Image from 'next/image' // Assuming you are using Next.js Image component for optimization

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>
}

export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [showPrompt, setShowPrompt] = useState(false)
  const [isIOS, setIsIOS] = useState(false)
  const [isStandalone, setIsStandalone] = useState(false)

  // ... (rest of the useEffect, handleInstall, handleDismiss functions remain the same) ...
  useEffect(() => {
    // Check if already installed (standalone mode)
    const standalone = window.matchMedia("(display-mode: standalone)").matches
    setIsStandalone(standalone)

    // Check if iOS
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent)
    setIsIOS(iOS)

    // Check if dismissed recently
    const dismissed = localStorage.getItem("pwa-prompt-dismissed")
    if (dismissed) {
      const dismissedTime = Number.parseInt(dismissed, 10)
      const daysSinceDismissed = (Date.now() - dismissedTime) / (1000 * 60 * 60 * 24)
      if (daysSinceDismissed < 7) return // Don't show for 7 days after dismissal
    }

    // Listen for beforeinstallprompt event (Chrome, Edge, etc.)
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      // Show prompt after a delay
      setTimeout(() => setShowPrompt(true), 3000)
    }

    window.addEventListener("beforeinstallprompt", handleBeforeInstall)

    // For iOS, show custom prompt after delay
    if (iOS && !standalone) {
      setTimeout(() => setShowPrompt(true), 5000)
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall)
    }
  }, [])

  const handleInstall = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice
      if (outcome === "accepted") {
        setShowPrompt(false)
      }
      setDeferredPrompt(null)
    }
  }

  const handleDismiss = () => {
    setShowPrompt(false)
    localStorage.setItem("pwa-prompt-dismissed", Date.now().toString())
  }
  // ...

  if (isStandalone || !showPrompt) return null

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-50 animate-in slide-in-from-bottom-4 duration-300">
      <div className="bg-[#1a1a2e] border border-white/10 rounded-xl p-4 shadow-2xl">
        <button
          onClick={handleDismiss}
          className="absolute top-3 right-3 text-white/40 hover:text-white transition-colors"
          aria-label="Dismiss"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-start gap-4">
          {/* 2. Replace the icon with the imported image */}
          <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-white overflow-hidden flex items-center justify-center">
            {/* Using Next.js Image component for a clean fit */}
            <Image 
                src={LogoImage} 
                alt="moBix App Logo"
                width={48} // w-12 is 48px
                height={48} // h-12 is 48px
                className="w-full h-full object-cover" // Ensure the image fills the container
            />
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="text-white font-semibold text-lg">Install moBix App</h3>
            <p className="text-white/60 text-sm mt-1">
              {isIOS
                ? "Tap the share button and select 'Add to Home Screen'"
                : "Get quick access and a better experience"}
            </p>

            {!isIOS && deferredPrompt && (
              <Button
                onClick={handleInstall}
                className="mt-3 bg-[#E50914] hover:bg-[#F40612] text-white w-full"
                size="sm"
              >
                <Download className="w-4 h-4 mr-2" />
                Install Now
              </Button>
            )}

            {isIOS && (
              <div className="mt-3 text-sm text-white/50">
                <p>
                  1. Tap <span className="inline-block px-1">⎙</span> Share
                </p>
                <p>2. Select "Add to Home Screen"</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
