"use client"

import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X } from "lucide-react"

interface InterstitialAdProps {
  adCode: string
  onClose: () => void
  closeDelay?: number
}

export default function InterstitialAd({ adCode, onClose, closeDelay = 5 }: InterstitialAdProps) {
  const [canClose, setCanClose] = useState(false)
  const [countdown, setCountdown] = useState(closeDelay)

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          setCanClose(true)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  const getIframeSrcDoc = (code: string) => `
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
          background: #0B0C10;
          overflow: auto;
          padding: 20px;
        }
      </style>
    </head>
    <body>
      ${code}
    </body>
    </html>
  `

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[9999] bg-black/95 backdrop-blur-sm flex items-center justify-center p-4"
        onClick={canClose ? onClose : undefined}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="relative w-full max-w-4xl bg-[#1A1B23] rounded-xl overflow-hidden shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-black/80 border-b border-white/10">
            <div className="flex items-center gap-3">
              <span className="text-xs text-white/60 uppercase tracking-wider">Advertisement</span>
              <span className="bg-yellow-500/90 text-black text-xs font-bold px-2 py-1 rounded">AD</span>
            </div>
            <button
              onClick={canClose ? onClose : undefined}
              disabled={!canClose}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                canClose
                  ? "bg-white/20 hover:bg-white/30 text-white cursor-pointer"
                  : "bg-white/5 text-white/30 cursor-not-allowed"
              }`}
            >
              {canClose ? (
                <>
                  <X className="w-3 h-3" />
                  Close
                </>
              ) : (
                <span>{countdown}s</span>
              )}
            </button>
          </div>

          {/* Ad Content */}
          <div className="w-full h-[60vh] min-h-[400px] max-h-[600px]">
            <iframe
              srcDoc={getIframeSrcDoc(adCode)}
              className="w-full h-full"
              style={{ border: "none" }}
              title="Interstitial Advertisement"
              sandbox="allow-scripts allow-popups allow-popups-to-escape-sandbox allow-same-origin"
            />
          </div>

          {/* Footer hint */}
          {!canClose && (
            <div className="px-4 py-2 bg-black/60 text-center">
              <p className="text-white/60 text-xs">Please wait {countdown} seconds to continue</p>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
