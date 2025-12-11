"use client"

import { useEffect, useRef, useState } from "react"
import { motion } from "framer-motion"
import { ExternalLink } from "lucide-react"

interface NativeAdCardProps {
  adCode?: string
}

export default function NativeAdCard({ adCode }: NativeAdCardProps) {
  const adContainerRef = useRef<HTMLDivElement>(null)
  const [adLoaded, setAdLoaded] = useState(false)

  useEffect(() => {
    if (!adCode || !adContainerRef.current) return

    const container = adContainerRef.current
    container.innerHTML = ""

    const iframe = document.createElement("iframe")
    iframe.style.width = "100%"
    iframe.style.height = "100%"
    iframe.style.border = "none"
    iframe.setAttribute("scrolling", "no")
    iframe.setAttribute("frameborder", "0")

    container.appendChild(iframe)

    const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document
    if (iframeDoc) {
      iframeDoc.open()
      iframeDoc.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body {
              margin: 0;
              padding: 0;
              display: flex;
              align-items: center;
              justify-content: center;
              min-height: 100%;
              background: transparent;
              overflow: hidden;
            }
          </style>
        </head>
        <body>
          ${adCode}
        </body>
        </html>
      `)
      iframeDoc.close()
      setAdLoaded(true)
    }
  }, [adCode])

  if (!adCode) return null

  return (
    <motion.div
      className="w-full h-full"
      initial={{ opacity: 0, scale: 0.8 }}
      whileInView={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      viewport={{ once: true }}
    >
      <div className="relative bg-gradient-to-br from-[#00FFFF]/10 to-[#00CCCC]/5 border border-[#00FFFF]/30 rounded-lg overflow-hidden hover:border-[#00FFFF] hover:shadow-lg hover:shadow-[#00FFFF]/20 transition-all duration-300 w-full aspect-[2/3]">
        {/* Ad Badge */}
        <div className="absolute top-2 right-2 z-10 px-1.5 py-0.5 bg-[#00FFFF]/20 backdrop-blur-sm rounded text-[#00FFFF] text-[10px] font-bold">
          Ad
        </div>

        {/* Ad Content Container */}
        <div ref={adContainerRef} className="w-full h-full flex items-center justify-center" />

        {/* Loading state */}
        {!adLoaded && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-[#00FFFF]/20 border-t-[#00FFFF] rounded-full animate-spin" />
          </div>
        )}

        {/* Sponsored Label at Bottom */}
        <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/80 to-transparent">
          <div className="flex items-center justify-between">
            <span className="text-white/70 text-[10px] font-medium">Sponsored</span>
            <ExternalLink className="w-3 h-3 text-[#00FFFF]" />
          </div>
        </div>
      </div>
    </motion.div>
  )
}
