import { NextResponse } from "next/server"
import { getAdSettings } from "@/lib/server-actions"

export async function GET() {
  try {
    const settings = await getAdSettings()
    return NextResponse.json({
      horizontalAdCode: settings?.horizontalAdCode || "",
      verticalAdCode: settings?.verticalAdCode || "",
      vastUrl: settings?.vastUrl || "",
      smartLinkUrl: settings?.smartLinkUrl || "",
      homepageEnabled: settings?.homepageEnabled ?? false,
      movieDetailEnabled: settings?.movieDetailEnabled ?? false,
      dashboardEnabled: settings?.dashboardEnabled ?? false,
      showPrerollAds: settings?.showPrerollAds ?? false,
      adTimeoutSeconds: settings?.adTimeoutSeconds || 20,
    })
  } catch (error) {
    console.error("[v0] Error fetching ad settings API:", error)
    return NextResponse.json({ error: "Failed to fetch ad settings" }, { status: 500 })
  }
}
