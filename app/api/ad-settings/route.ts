import { NextResponse } from "next/server"
import { getAdSettings } from "@/lib/server-actions"

export async function GET() {
  try {
    const settings = await getAdSettings()
    return NextResponse.json({
      horizontalAdCode: settings?.horizontalAdCode || "",
      verticalAdCode: settings?.verticalAdCode || "",
      prerollAdCodes: settings?.prerollAdCodes || "[]",
      smartLinkUrl: settings?.smartLinkUrl || "",
      homepageEnabled: settings?.homepageEnabled ?? true,
      movieDetailEnabled: settings?.movieDetailEnabled ?? true,
      dashboardEnabled: settings?.dashboardEnabled ?? true,
      showPrerollAds: settings?.showPrerollAds ?? true,
      showDownloadPageAds: settings?.showDownloadPageAds ?? true,
      adTimeoutSeconds: settings?.adTimeoutSeconds || 20,
      skipDelaySeconds: settings?.skipDelaySeconds || 10,
      rotationIntervalSeconds: settings?.rotationIntervalSeconds || 5,
    })
  } catch (error) {
    console.error("Error fetching ad settings API:", error)
    return NextResponse.json({ error: "Failed to fetch ad settings" }, { status: 500 })
  }
}
