import { getAdSettings } from "@/lib/server-actions"

interface AdBannerProps {
  type?: "horizontal" | "vertical"
  className?: string
  placement: "homepage" | "movieDetail" | "dashboard" | "download"
}

export default async function AdBanner({ type = "horizontal", className = "", placement }: AdBannerProps) {
  let adSettings = null

  try {
    adSettings = await getAdSettings()
  } catch (error) {
    console.error("Error fetching ad settings:", error)
    return null
  }

  if (!adSettings) {
    return null
  }

  const isEnabled =
    (placement === "homepage" && adSettings.homepageEnabled === true) ||
    (placement === "movieDetail" && adSettings.movieDetailEnabled === true) ||
    (placement === "dashboard" && adSettings.dashboardEnabled === true) ||
    (placement === "download" && adSettings.showDownloadPageAds === true)

  if (!isEnabled) {
    // Ad placement is disabled for this location
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
