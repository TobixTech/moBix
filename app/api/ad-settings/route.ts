import { NextResponse } from "next/server"
import { getAdSettings } from "@/lib/server-actions"

export const dynamic = "force-dynamic"
export const revalidate = 0

export async function GET() {
  try {
    const settings = await getAdSettings()

    return NextResponse.json(
      {
        horizontalAdCode: settings?.horizontalAdCode || "",
        verticalAdCode: settings?.verticalAdCode || "",
        interstitialAdCode: settings?.interstitialAdCode || "", // Added interstitial ad code
        prerollAdCodes: settings?.prerollAdCodes || "[]",
        midrollAdCodes: settings?.midrollAdCodes || "[]",
        smartLinkUrl: settings?.smartLinkUrl || "",
        homepageEnabled: settings?.homepageEnabled === true,
        movieDetailEnabled: settings?.movieDetailEnabled === true,
        dashboardEnabled: settings?.dashboardEnabled === true,
        showPrerollAds: settings?.showPrerollAds === true,
        showMidrollAds: settings?.showMidrollAds === true,
        showDownloadPageAds: settings?.showDownloadPageAds === true,
        adTimeoutSeconds: settings?.adTimeoutSeconds || 20,
        skipDelaySeconds: settings?.skipDelaySeconds || 10,
        rotationIntervalSeconds: settings?.rotationIntervalSeconds || 5,
        midrollIntervalMinutes: settings?.midrollIntervalMinutes || 20,
      },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
      },
    )
  } catch (error) {
    console.error("[v0] Error fetching ad settings API:", error)
    return NextResponse.json({ error: "Failed to fetch ad settings" }, { status: 500 })
  }
}
