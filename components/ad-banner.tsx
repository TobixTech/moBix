import { getAdSettings } from "@/lib/server-actions"
import { auth } from "@clerk/nextjs/server"
import { db } from "@/lib/db"
import { users } from "@/lib/db/schema"
import { eq } from "drizzle-orm"

interface AdBannerProps {
  type?: "horizontal" | "vertical"
  className?: string
  placement: "homepage" | "movieDetail" | "dashboard" | "download"
}

export default async function AdBanner({ type = "horizontal", className = "", placement }: AdBannerProps) {
  const { userId } = await auth()

  if (userId) {
    try {
      const user = await db.query.users.findFirst({
        where: eq(users.clerkId, userId),
      })

      if (user?.role === "PREMIUM") {
        return null
      }
    } catch {
      // Continue to show ads if check fails
    }
  }

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
      className={`flex items-center justify-center bg-[#1A1B23] border border-cyan-500/10 rounded-lg overflow-hidden mx-auto ${className}`}
      style={{
        maxWidth: isHorizontal ? "728px" : "300px",
        width: "100%",
      }}
    >
      <div className="relative w-full">
        <div className="absolute top-1 left-1 bg-cyan-500 text-black text-[9px] font-bold px-1.5 py-0.5 rounded z-10">
          AD
        </div>
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
                  background: #1A1B23;
                  overflow: hidden;
                }
              </style>
            </head>
            <body>
              ${adCode}
            </body>
            </html>
          `}
          className="w-full"
          style={{
            border: "none",
            height: isHorizontal ? "90px" : "250px",
          }}
          scrolling="no"
          title="Advertisement"
          sandbox="allow-scripts allow-popups allow-popups-to-escape-sandbox allow-same-origin"
        />
      </div>
    </div>
  )
}
