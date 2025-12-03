"use client"

import { useState, useEffect, useCallback } from "react"
import { X, Timer } from "lucide-react"

interface MidrollAdCode {
  code: string
  name?: string
}

interface MidrollAdPlayerProps {
  adCodes: MidrollAdCode[]
  onComplete: () => void
  onSkip: () => void
  maxDuration?: number
  skipDelay?: number
  rotationInterval?: number
}

export default function MidrollAdPlayer({
  adCodes,
  onComplete,
  onSkip,
  maxDuration = 15,
  skipDelay = 5,
  rotationInterval = 5,
}: MidrollAdPlayerProps) {
  const [currentAdIndex, setCurrentAdIndex] = useState(0)
  const [timeRemaining, setTimeRemaining] = useState(maxDuration)
  const [canSkip, setCanSkip] = useState(false)
  const [skipCountdown, setSkipCountdown] = useState(skipDelay)

  const handleComplete = useCallback(() => {
    onComplete()
  }, [onComplete])

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          handleComplete()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [handleComplete])

  useEffect(() => {
    if (skipCountdown > 0) {
      const skipTimer = setInterval(() => {
        setSkipCountdown((prev) => {
          if (prev <= 1) {
            setCanSkip(true)
            return 0
          }
          return prev - 1
        })
      }, 1000)

      return () => clearInterval(skipTimer)
    }
  }, [skipCountdown])

  useEffect(() => {
    if (adCodes.length > 1 && rotationInterval > 0) {
      const rotationTimer = setInterval(() => {
        setCurrentAdIndex((prev) => (prev + 1) % adCodes.length)
      }, rotationInterval * 1000)

      return () => clearInterval(rotationTimer)
    }
  }, [adCodes.length, rotationInterval])

  const currentAd = adCodes[currentAdIndex]

  if (!currentAd || !currentAd.code) {
    handleComplete()
    return null
  }

  return (
    <div className="absolute inset-0 bg-black z-50 flex flex-col">
      <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-10">
        <div className="flex items-center gap-2 bg-black/80 backdrop-blur-sm px-3 py-2 rounded-lg">
          <Timer className="w-4 h-4 text-yellow-400" />
          <span className="text-white text-sm font-medium">Ad • {timeRemaining}s</span>
        </div>

        {canSkip ? (
          <button
            onClick={onSkip}
            className="flex items-center gap-2 bg-white/90 hover:bg-white text-black px-4 py-2 rounded-lg font-bold transition-all text-sm"
          >
            Skip Ad
            <X className="w-4 h-4" />
          </button>
        ) : (
          <div className="bg-black/80 backdrop-blur-sm px-4 py-2 rounded-lg">
            <span className="text-white/80 text-sm">Skip in {skipCountdown}s</span>
          </div>
        )}
      </div>

      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-2xl aspect-video bg-[#1A1B23] rounded-lg overflow-hidden border border-[#2A2B33]">
          <iframe
            srcDoc={`
              <!DOCTYPE html>
              <html>
                <head>
                  <style>
                    * { margin: 0; padding: 0; box-sizing: border-box; }
                    body { 
                      background: #1A1B23; 
                      display: flex; 
                      align-items: center; 
                      justify-content: center; 
                      min-height: 100vh;
                      overflow: hidden;
                    }
                  </style>
                </head>
                <body>${currentAd.code}</body>
              </html>
            `}
            className="w-full h-full"
            sandbox="allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox"
            title={currentAd.name || "Midroll Advertisement"}
          />
        </div>
      </div>

      {adCodes.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5">
          {adCodes.map((_, index) => (
            <div
              key={index}
              className={`w-2 h-2 rounded-full transition-all ${
                index === currentAdIndex ? "bg-[#00FFFF] w-4" : "bg-white/30"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  )
}
