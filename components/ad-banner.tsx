import { getAdSettings } from "@/lib/server-actions"

interface AdBannerProps {
  type?: "horizontal" | "vertical"
  className?: string
  placement: "homepage" | "movieDetail" | "dashboard"
}

export default async function AdBanner({ type = "horizontal", className = "", placement }: AdBannerProps) {
  const adSettings = await getAdSettings()

  const isEnabled =
    (placement === "homepage" && adSettings?.homepageEnabled) ||
    (placement === "movieDetail" && adSettings?.movieDetailEnabled) ||
    (placement === "dashboard" && adSettings?.dashboardEnabled)

  if (!isEnabled) {
    return null
  }

  const adCode = type === "horizontal" ? adSettings?.horizontalAdCode : adSettings?.verticalAdCode

  if (!adCode || adCode.trim() === "") {
    return null
  }

  const isHorizontal = type === "horizontal"

  return (
    <div
      className={`flex items-center justify-center bg-[#1A1B23] border border-[#2A2B33] rounded overflow-hidden ${className}`}
    >
      <iframe
        srcDoc={`
          <!DOCTYPE html>
          <html>
          <head>
            <style>
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
      />
    </div>
  )
}
