"use client"

import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X } from "lucide-react"

interface PrerollAdPlayerProps {
  adSettings?: {
    horizontalAdCode?: string
    verticalAdCode?: string
  } | null
  onComplete: () => void
  onSkip: () => void
  skipDelay?: number
  totalAds?: number
  adDuration?: number
}

export default function PrerollAdPlayer({
  adSettings,
  onComplete,
  onSkip,
  skipDelay = 5,
  totalAds = 4,
  adDuration = 5,
}: PrerollAdPlayerProps) {
  const [currentAdIndex, setCurrentAdIndex] = useState(0)
  const [timeLeft, setTimeLeft] = useState(adDuration)
  const [canSkip, setCanSkip] = useState(false)
  const [skipTimeLeft, setSkipTimeLeft] = useState(skipDelay)
  const [totalTimeElapsed, setTotalTimeElapsed] = useState(0)

  const totalDuration = totalAds * adDuration

  // Handle ad rotation and countdown
  useEffect(() => {
    const timer = setInterval(() => {
      setTotalTimeElapsed((prev) => {
        const newTime = prev + 1

        // Enable skip after skipDelay
        if (newTime >= skipDelay) {
          setCanSkip(true)
        }

        // Update skip countdown
        setSkipTimeLeft((s) => Math.max(0, skipDelay - newTime))

        // Check if all ads are done
        if (newTime >= totalDuration) {
          clearInterval(timer)
          onComplete()
          return newTime
        }

        // Update current ad index every adDuration seconds
        const newAdIndex = Math.floor(newTime / adDuration)
        if (newAdIndex !== currentAdIndex && newAdIndex < totalAds) {
          setCurrentAdIndex(newAdIndex)
          setTimeLeft(adDuration)
        } else {
          setTimeLeft(adDuration - (newTime % adDuration))
        }

        return newTime
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [adDuration, totalAds, totalDuration, skipDelay, onComplete, currentAdIndex])

  const handleSkip = () => {
    if (canSkip) {
      onSkip()
    }
  }

  const adCode = adSettings?.horizontalAdCode || adSettings?.verticalAdCode

  return (
    <div className="absolute inset-0 bg-[#0B0C10] z-40 flex flex-col">
      {/* Ad Progress Bar */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-[#2A2B33] z-50">
        <motion.div
          className="h-full bg-[#00FFFF]"
          initial={{ width: 0 }}
          animate={{ width: `${(totalTimeElapsed / totalDuration) * 100}%` }}
          transition={{ duration: 0.5 }}
        />
      </div>

      {/* Ad Counter & Skip Button */}
      <div className="absolute top-4 right-4 flex items-center gap-4 z-50">
        <div className="bg-black/80 px-4 py-2 rounded-lg flex items-center gap-2">
          <span className="text-white text-sm font-medium">
            Ad {currentAdIndex + 1} of {totalAds}
          </span>
          <span className="text-[#00FFFF] text-sm">• {timeLeft}s</span>
        </div>

        <button
          onClick={handleSkip}
          disabled={!canSkip}
          className={`px-4 py-2 rounded-lg font-bold transition-all flex items-center gap-2 ${
            canSkip
              ? "bg-[#00FFFF] hover:bg-[#00CCCC] text-[#0B0C10] cursor-pointer"
              : "bg-black/50 text-white/50 cursor-not-allowed border border-white/20"
          }`}
        >
          {canSkip ? (
            <>
              <X className="w-4 h-4" />
              Skip Ads
            </>
          ) : (
            <span className="text-sm">Skip in {skipTimeLeft}s</span>
          )}
        </button>
      </div>

      {/* Main Ad Content Area */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="max-w-4xl w-full">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentAdIndex}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3 }}
              className="relative"
            >
              {adCode ? (
                <div className="bg-[#1A1B23] border border-[#00FFFF]/30 rounded-2xl overflow-hidden">
                  <div className="p-2 bg-[#0B0C10] text-center">
                    <span className="text-[#888888] text-xs uppercase tracking-wider">Advertisement</span>
                  </div>
                  <iframe
                    srcDoc={`
                      <!DOCTYPE html>
                      <html>
                      <head>
                        <style>
                          body { 
                            margin: 0; 
                            padding: 16px; 
                            display: flex; 
                            align-items: center; 
                            justify-content: center; 
                            background: #1A1B23;
                            min-height: 250px;
                          }
                        </style>
                      </head>
                      <body>${adCode}</body>
                      </html>
                    `}
                    className="w-full min-h-[280px]"
                    style={{ border: "none" }}
                    scrolling="no"
                    title={`Advertisement ${currentAdIndex + 1}`}
                  />
                </div>
              ) : (
                <div className="bg-gradient-to-br from-[#1A1B23] to-[#0F1018] border border-[#00FFFF]/30 rounded-2xl p-12 text-center">
                  <div className="w-20 h-20 mx-auto mb-6 bg-[#00FFFF]/10 rounded-full flex items-center justify-center">
                    <div className="w-12 h-12 border-4 border-[#00FFFF] border-t-transparent rounded-full animate-spin" />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-3">Loading Advertisement</h3>
                  <p className="text-[#CCCCCC] mb-2">
                    Ad {currentAdIndex + 1} of {totalAds}
                  </p>
                  <p className="text-[#888888] text-sm">Your video will start shortly...</p>
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          {/* Ad Dots Indicator */}
          <div className="flex justify-center gap-2 mt-6">
            {Array.from({ length: totalAds }).map((_, index) => (
              <div
                key={index}
                className={`w-2 h-2 rounded-full transition-all ${
                  index < currentAdIndex
                    ? "bg-[#00FFFF]"
                    : index === currentAdIndex
                      ? "bg-[#00FFFF] w-6"
                      : "bg-[#2A2B33]"
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Info */}
      <div className="p-4 text-center">
        <p className="text-[#888888] text-sm">
          Video will start after ads • {Math.max(0, totalDuration - totalTimeElapsed)}s remaining
        </p>
      </div>
    </div>
  )
}
