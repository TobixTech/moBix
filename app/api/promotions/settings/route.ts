import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { promotionSettings } from "@/lib/db/schema"
import { eq } from "drizzle-orm"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const settings = await db.query.promotionSettings.findFirst({
      where: eq(promotionSettings.id, "default-promotion-settings"),
    })

    if (!settings) {
      return NextResponse.json({
        isActive: false,
        globallyDisabled: false,
        enabledCountries: ["Nigeria"],
        headline: "Fill Details to Get 1.5GB Data!",
        subtext: "(Lucky Draw - Winners announced weekly)",
        successMessage: "Entry recorded! Winners announced every Monday",
        networkOptions: {
          Nigeria: ["MTN", "Airtel", "Glo", "9mobile", "Other"],
        },
      })
    }

    return NextResponse.json({
      isActive: settings.isActive,
      globallyDisabled: (settings as any).globallyDisabled ?? false,
      enabledCountries: JSON.parse(settings.enabledCountries || '["Nigeria"]'),
      headline: settings.headline,
      subtext: settings.subtext,
      successMessage: settings.successMessage,
      networkOptions: JSON.parse(settings.networkOptions || "{}"),
    })
  } catch (error) {
    console.error("Error fetching promotion settings:", error)
    return NextResponse.json({
      isActive: false,
      globallyDisabled: false,
      enabledCountries: [],
      headline: "",
      subtext: "",
      successMessage: "",
      networkOptions: {},
    })
  }
}
