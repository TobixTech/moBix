"use client"

import { useEffect, useRef } from "react"
import { motion } from "framer-motion"
import { ExternalLink } from "lucide-react"

interface NativeAdCardProps {
  adCode?: string
}

export default function NativeAdCard({ adCode }: NativeAdCardProps) {
  const adContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (adCode && adContainerRef.current) {
      // Clear any existing content
      adContainerRef.current.innerHTML = ""

      // Create a temporary container to parse the HTML
      const tempDiv = document.createElement("div")
      tempDiv.innerHTML = adCode.trim()

      // Extract scripts and other elements
      const scripts = tempDiv.querySelectorAll("script")
      const otherElements = Array.from(tempDiv.children).filter((el) => el.tagName !== "SCRIPT")

      // Append non-script elements first
      otherElements.forEach((el) => {
        adContainerRef.current?.appendChild(el.cloneNode(true))
      })

      // Execute scripts
      scripts.forEach((oldScript) => {
        const newScript = document.createElement("script")
        Array.from(oldScript.attributes).forEach((attr) => {
          newScript.setAttribute(attr.name, attr.value)
        })
        newScript.textContent = oldScript.textContent
        adContainerRef.current?.appendChild(newScript)
      })

      console.log("[v0] Ad script injected successfully")
    }
  }, [adCode])

  if (!adCode) return null

  return (
    <motion.div
      className="flex-shrink-0 w-[240px] sm:w-[280px]"
      initial={{ opacity: 0, scale: 0.8 }}
      whileInView={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      viewport={{ once: true }}
    >
      <div className="group relative bg-gradient-to-br from-[#00FFFF]/10 to-[#00CCCC]/5 border border-[#00FFFF]/30 rounded-lg overflow-hidden hover:border-[#00FFFF] hover:shadow-lg hover:shadow-[#00FFFF]/30 transition-all duration-300 h-full">
        {/* Ad Badge */}
        <div className="absolute top-2 right-2 z-10 px-2 py-1 bg-[#00FFFF]/20 backdrop-blur-sm rounded text-[#00FFFF] text-xs font-bold">
          Ad
        </div>

        {/* Ad Content - Script will be injected here */}
        <div ref={adContainerRef} className="w-full aspect-[2/3] flex items-center justify-center p-4 min-h-[360px]" />

        {/* Ad Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

        {/* Sponsored Label at Bottom */}
        <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/80 to-transparent">
          <div className="flex items-center justify-between">
            <span className="text-white/70 text-xs font-medium">Sponsored Content</span>
            <ExternalLink className="w-3 h-3 text-[#00FFFF]" />
          </div>
        </div>
      </div>
    </motion.div>
  )
}
