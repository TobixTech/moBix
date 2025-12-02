"use client"

import { useState, useEffect, useRef } from "react"

interface AdSettings {
  horizontalAdCode?: string
  verticalAdCode?: string
  homepageEnabled?: boolean
  movieDetailEnabled?: boolean
  dashboardEnabled?: boolean
}

interface AdBannerProps {
  type?: "horizontal" | "vertical"
  className?: string
  placement: "homepage" | "movieDetail" | "dashboard"
  adSettings?: AdSettings | null
}

export default function AdBanner({ type = "horizontal", className = "", placement, adSettings }: AdBannerProps) {
  const [settings, setSettings] = useState<AdSettings | null>(adSettings || null)
  const [loading, setLoading] = useState(!adSettings)
  const iframeRef = useRef<HTMLIFrameElement>(null)

  useEffect(() => {
    // If adSettings was passed as prop, use it
    if (adSettings) {
      setSettings(adSettings)
      setLoading(false)
      return
    }

    // Otherwise fetch settings
    const fetchSettings = async () => {
      try {
        const res = await fetch("/api/ad-settings")
        if (res.ok) {
          const data = await res.json()
          setSettings(data)
        }
      } catch (error) {
        console.error("Failed to fetch ad settings:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchSettings()
  }, [adSettings])

  if (loading) {
    return (
      <div className={`bg-[#1A1B23] border border-[#2A2B33] rounded animate-pulse ${className}`}>
        <div className={`${type === "horizontal" ? "h-[90px]" : "h-[250px]"}`} />
      </div>
    )
  }

  if (!settings) return null

  const isEnabled =
    (placement === "homepage" && settings.homepageEnabled) ||
    (placement === "movieDetail" && settings.movieDetailEnabled) ||
    (placement === "dashboard" && settings.dashboardEnabled)

  if (!isEnabled) return null

  const adCode = type === "horizontal" ? settings.horizontalAdCode : settings.verticalAdCode

  if (!adCode || adCode.trim() === "") return null

  const isHorizontal = type === "horizontal"

  return (
    <div
      className={`flex items-center justify-center bg-[#1A1B23] border border-[#2A2B33] rounded overflow-hidden ${className}`}
    >
      <iframe
        ref={iframeRef}
        srcDoc={`
          <!DOCTYPE html>
          <html>
          <head>
            <style>
              * { margin: 0; padding: 0; box-sizing: border-box; }
              body {
                margin: 0;
                padding: 8px;
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
        `}
        className={`w-full ${isHorizontal ? "min-h-[90px]" : "min-h-[250px]"}`}
        style={{ border: "none" }}
        scrolling="no"
        title="Advertisement"
        sandbox="allow-scripts allow-popups allow-popups-to-escape-sandbox allow-same-origin"
      />
    </div>
  )
}
