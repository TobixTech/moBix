"use client"

import { useEffect, useState, useRef } from "react"
import { motion } from "framer-motion"
import { X } from "lucide-react"

interface PrerollAdPlayerProps {
  vastUrl?: string
  onComplete: () => void
  onSkip: () => void
  skipDelay?: number
  maxDuration?: number
}

export default function PrerollAdPlayer({
  vastUrl,
  onComplete,
  onSkip,
  skipDelay = 5,
  maxDuration = 20,
}: PrerollAdPlayerProps) {
  const [timeLeft, setTimeLeft] = useState(maxDuration)
  const [canSkip, setCanSkip] = useState(false)
  const [showPlaceholder, setShowPlaceholder] = useState(false)
  const [skipTimeLeft, setSkipTimeLeft] = useState(skipDelay)
  const [adLoaded, setAdLoaded] = useState(false)
  const iframeRef = useRef<HTMLIFrameElement>(null)

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
  }, [skipDelay, maxDuration, onComplete])

  const handleSkip = () => {
    onSkip()
  }

  if (!vastUrl) {
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
            <h3 className="text-2xl font-bold text-white mb-3">Advertisement</h3>
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

  return (
    <div className="absolute inset-0 bg-black z-40">
      <div className="relative w-full h-full bg-black flex items-center justify-center">
        <iframe
          ref={iframeRef}
          src={vastUrl}
          className="w-full h-full"
          allow="autoplay; fullscreen"
          allowFullScreen
          style={{ border: "none" }}
          onLoad={() => setAdLoaded(true)}
          onError={() => {
            console.error("Error loading VAST ad")
            setShowPlaceholder(true)
          }}
        />

        <div className="absolute top-4 right-4 flex items-center gap-4 z-50">
          <div className="bg-black/80 px-4 py-2 rounded-lg">
            <p className="text-white text-sm font-medium">Ad · {timeLeft}s</p>
          </div>

          <button
            onClick={canSkip ? handleSkip : undefined}
            disabled={!canSkip}
            className={`px-4 py-2 rounded-lg font-bold transition-all flex items-center gap-2 ${
              canSkip
                ? "bg-[#00FFFF] hover:bg-[#00CCCC] text-[#0B0C10]"
                : "bg-black/50 text-white/50 cursor-not-allowed border border-white/20"
            }`}
          >
            {canSkip ? (
              <>
                <X className="w-4 h-4" />
                Skip Ad
              </>
            ) : (
              <span className="text-sm">Skip in {skipTimeLeft}s</span>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
