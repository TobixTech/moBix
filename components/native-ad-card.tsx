"use client"

import { useEffect, useState } from "react"
import { getAdSettings } from "@/lib/server-actions"

export default function NativeAdCard() {
  const [adCode, setAdCode] = useState<string | null>(null)

  useEffect(() => {
    const fetchAdCode = async () => {
      const settings = await getAdSettings()
      if (settings?.nativeAdCode) {
        setAdCode(settings.nativeAdCode)
      }
    }
    fetchAdCode()
  }, [])

  if (!adCode) {
    return null
  }

  return (
    <div className="flex-shrink-0 w-48 h-72 rounded overflow-hidden bg-gradient-to-br from-[#00FFFF]/10 to-[#00CCCC]/5 border border-[#00FFFF]/20 flex items-center justify-center">
      <div className="w-full h-full flex items-center justify-center" dangerouslySetInnerHTML={{ __html: adCode }} />
    </div>
  )
}
