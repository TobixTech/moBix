"use client"

import { useEffect, useState } from "react"

interface AdBannerClientProps {
  type?: "horizontal" | "vertical"
  className?: string
  placement: "homepage" | "movieDetail" | "dashboard" | "download"
  isPremium?: boolean
}

export function AdBannerClient({
  type = "horizontal",
  className = "",
  placement,
  isPremium = false,
}: AdBannerClientProps) {
  const [adSettings, setAdSettings] = useState<{
    homepageEnabled?: boolean
    movieDetailEnabled?: boolean
    dashboardEnabled?: boolean
    showDownloadPageAds?: boolean
    horizontalAdCode?: string
    verticalAdCode?: string
  } | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchAdSettings() {
      try {
        const response = await fetch("/api/ad-settings", { cache: "no-store" })
        if (response.ok) {
          const data = await response.json()
          setAdSettings(data)
        }
      } catch {
        // Silently fail - no ads shown
      } finally {
        setIsLoading(false)
      }
    }
    fetchAdSettings()
  }, [])

  // Don't show ads for premium users
  if (isPremium) {
    return null
  }

  if (isLoading || !adSettings) {
    return null
  }

  let isEnabled = false
  if (placement === "homepage") {
    isEnabled = adSettings.homepageEnabled === true
  } else if (placement === "movieDetail") {
    isEnabled = adSettings.movieDetailEnabled === true
  } else if (placement === "dashboard") {
    isEnabled = adSettings.dashboardEnabled === true
  } else if (placement === "download") {
    isEnabled = adSettings.showDownloadPageAds === true
  }

  if (!isEnabled) {
    return null
  }

  const adCode = type === "horizontal" ? adSettings.horizontalAdCode : adSettings.verticalAdCode

  if (!adCode || adCode.trim() === "") {
    return null
  }

  const isHorizontal = type === "horizontal"

  return (
    <div
      className={`flex items-center justify-center bg-[#1A1B23] border border-[#2A2B33] rounded-lg overflow-hidden ${className}`}
    >
      <iframe
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

export default AdBannerClient
