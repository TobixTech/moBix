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
    <div className={`flex items-center justify-center bg-[#1A1B23] border border-[#2A2B33] rounded overflow-hidden ${className}`}>
      {adCode ? (
        <div
          className={`w-full ${isHorizontal ? "h-24" : "h-80"}`}
          dangerouslySetInnerHTML={{ __html: adCode }}
        />
      ) : (
        <div
          className={`flex items-center justify-center text-[#888888] font-semibold ${
            isHorizontal ? "w-full h-24" : "w-64 h-80"
          }`}
        >
          <div className="text-center">
            <div className="text-sm mb-2">Ad Placeholder</div>
            <div className="text-xs text-[#555555]">{isHorizontal ? "728x90" : "300x250"}</div>
          </div>
        </div>
      )}
    </div>
  )
}
