interface AdBannerProps {
  type?: "horizontal" | "vertical"
  className?: string
}

export default function AdBanner({ type = "horizontal", className = "" }: AdBannerProps) {
  const isHorizontal = type === "horizontal"

  return (
    <div className={`flex items-center justify-center bg-[#1A1B23] border border-[#2A2B33] rounded ${className}`}>
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
    </div>
  )
}
