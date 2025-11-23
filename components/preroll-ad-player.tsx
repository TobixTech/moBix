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
  const [showPlaceholder, setShowPlaceholder] = useState(!vastUrl)
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    const skipTimer = setTimeout(() => {
      setCanSkip(true)
    }, skipDelay * 1000)

    const countdownInterval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(countdownInterval)
          onComplete()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => {
      clearTimeout(skipTimer)
      clearInterval(countdownInterval)
    }
  }, [skipDelay, maxDuration, onComplete])

  const handleSkip = () => {
    onSkip()
  }

  if (showPlaceholder) {
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

          {canSkip && (
            <motion.button
              onClick={handleSkip}
              className="mt-6 px-6 py-3 bg-[#00FFFF]/20 hover:bg-[#00FFFF]/30 border border-[#00FFFF] text-[#00FFFF] rounded-lg font-bold transition-all flex items-center gap-2 mx-auto"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <X className="w-5 h-5" />
              Skip Ad
            </motion.button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="absolute inset-0 bg-black z-40">
      <div className="relative w-full h-full">
        <video
          ref={videoRef}
          className="w-full h-full object-cover"
          src={vastUrl}
          autoPlay
          onEnded={onComplete}
          onError={(e) => {
            console.error("Error loading VAST ad:", e)
            setShowPlaceholder(true)
          }}
        />

        <div className="absolute top-4 right-4 flex items-center gap-4 z-50">
          <div className="bg-black/80 px-4 py-2 rounded-lg">
            <p className="text-white text-sm font-medium">Ad · {timeLeft}s</p>
          </div>

          {canSkip && (
            <motion.button
              onClick={handleSkip}
              className="px-4 py-2 bg-[#00FFFF] hover:bg-[#00CCCC] text-[#0B0C10] rounded-lg font-bold transition-all flex items-center gap-2"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <X className="w-4 h-4" />
              Skip Ad
            </motion.button>
          )}
        </div>
      </div>
    </div>
  )
}
