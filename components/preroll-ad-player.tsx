"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { X } from "lucide-react"

interface PrerollAdCode {
  code: string
  name?: string
}

interface PrerollAdPlayerProps {
  adCodes?: PrerollAdCode[]
  onComplete: () => void
  onSkip: () => void
  skipDelay?: number
  maxDuration?: number
  rotationInterval?: number
}

export default function PrerollAdPlayer({
  adCodes = [],
  onComplete,
  onSkip,
  skipDelay = 10,
  maxDuration = 20,
  rotationInterval = 5,
}: PrerollAdPlayerProps) {
  const [timeLeft, setTimeLeft] = useState(maxDuration)
  const [canSkip, setCanSkip] = useState(false)
  const [skipTimeLeft, setSkipTimeLeft] = useState(skipDelay)
  const [currentAdIndex, setCurrentAdIndex] = useState(0)

  // Rotate through ad codes
  useEffect(() => {
    if (adCodes.length <= 1) return

    const rotationTimer = setInterval(() => {
      setCurrentAdIndex((prev) => (prev + 1) % adCodes.length)
    }, rotationInterval * 1000)

    return () => clearInterval(rotationTimer)
  }, [adCodes.length, rotationInterval])

  // Main countdown timer
  useEffect(() => {
    const timer = setInterval(() => {
      setSkipTimeLeft((prev) => {
        if (prev <= 1) {
          setCanSkip(true)
          return 0
        }
        return prev - 1
      })

      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          onComplete()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [maxDuration, onComplete])

  const handleSkip = () => {
    onSkip()
  }

  const currentAd = adCodes[currentAdIndex]
  const hasAds = adCodes.length > 0 && adCodes.some((ad) => ad.code && ad.code.trim() !== "")

  // If no ads configured, show loading and auto-complete
  if (!hasAds) {
    return (
      <div className="absolute inset-0 bg-[#0B0C10] z-40 flex items-center justify-center">
        <div className="max-w-2xl mx-auto p-8 text-center">
          <motion.div
            className="bg-gradient-to-br from-[#1A1B23] to-[#0F1018] border border-[#00FFFF]/30 rounded-xl p-12"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <div className="w-20 h-20 mx-auto mb-6 bg-[#00FFFF]/10 rounded-full flex items-center justify-center">
              <div className="w-12 h-12 border-4 border-[#00FFFF] border-t-transparent rounded-full animate-spin" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-3">Preparing Your Video</h3>
            <p className="text-[#CCCCCC] mb-6">Your video will start in {timeLeft} seconds...</p>
          </motion.div>

          <button
            onClick={canSkip ? handleSkip : undefined}
            disabled={!canSkip}
            className={`mt-6 px-6 py-3 rounded-lg font-bold transition-all flex items-center gap-2 mx-auto ${
              canSkip
                ? "bg-[#00FFFF]/20 hover:bg-[#00FFFF]/30 border border-[#00FFFF] text-[#00FFFF] cursor-pointer"
                : "bg-gray-800 text-gray-500 cursor-not-allowed"
            }`}
          >
            {canSkip ? (
              <>
                <X className="w-5 h-5" />
                Skip Ad
              </>
            ) : (
              <span>Skip in {skipTimeLeft}s</span>
            )}
          </button>
        </div>
      </div>
    )
  }

  // Generate iframe srcDoc for the current ad code
  const getIframeSrcDoc = (adCode: string) => `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 100vh;
          background: transparent;
          overflow: hidden;
        }
      </style>
    </head>
    <body>
      ${adCode}
    </body>
    </html>
  `

  return (
    <div className="absolute inset-0 bg-[#0B0C10] z-40 flex flex-col">
      {/* Ad Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-black/80">
        <div className="flex items-center gap-3">
          <span className="text-xs text-white/60 uppercase tracking-wider">Advertisement</span>
          {adCodes.length > 1 && (
            <span className="text-xs text-[#00FFFF]">
              {currentAdIndex + 1} / {adCodes.length}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <span className="text-white text-sm font-medium bg-white/10 px-3 py-1 rounded-full">{timeLeft}s</span>
          <button
            onClick={canSkip ? handleSkip : undefined}
            disabled={!canSkip}
            className={`px-4 py-2 rounded-lg font-bold transition-all flex items-center gap-2 text-sm ${
              canSkip
                ? "bg-[#00FFFF] hover:bg-[#00CCCC] text-[#0B0C10]"
                : "bg-white/10 text-white/50 cursor-not-allowed"
            }`}
          >
            {canSkip ? (
              <>
                <X className="w-4 h-4" />
                Skip Ad
              </>
            ) : (
              <span>Skip in {skipTimeLeft}s</span>
            )}
          </button>
        </div>
      </div>

      {/* Ad Content - Using iframe for HTML ad codes */}
      <div className="flex-1 flex items-center justify-center p-4 overflow-hidden">
        {currentAd && currentAd.code && (
          <div key={currentAdIndex} className="w-full max-w-4xl h-full flex items-center justify-center">
            <iframe
              srcDoc={getIframeSrcDoc(currentAd.code)}
              className="w-full h-full min-h-[300px] max-h-[70vh]"
              style={{ border: "none", background: "transparent" }}
              scrolling="no"
              title={currentAd.name || `Advertisement ${currentAdIndex + 1}`}
              sandbox="allow-scripts allow-popups allow-popups-to-escape-sandbox allow-same-origin"
            />
          </div>
        )}
      </div>

      {/* Progress dots for multiple ads */}
      {adCodes.length > 1 && (
        <div className="flex justify-center gap-2 py-3">
          {adCodes.map((_, index) => (
            <div
              key={index}
              className={`w-2 h-2 rounded-full transition-colors ${
                index === currentAdIndex ? "bg-[#00FFFF]" : "bg-white/30"
              }`}
            />
          ))}
        </div>
      )}

      {/* Progress bar */}
      <div className="h-1 bg-white/10">
        <motion.div
          className="h-full bg-[#00FFFF]"
          initial={{ width: "100%" }}
          animate={{ width: "0%" }}
          transition={{ duration: maxDuration, ease: "linear" }}
        />
      </div>
    </div>
  )
}
