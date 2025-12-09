import { db } from "@/lib/db"
import { siteSettings } from "@/lib/db/schema"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const settings = await db.select().from(siteSettings)

    const settingsObject: Record<string, any> = {
      maintenanceMode: false,
      allowRegistrations: true,
      enableComments: true,
      enableDownloads: true,
    }

    settings.forEach((setting) => {
      let value: any = setting.value
      if (setting.type === "boolean") {
        value = setting.value === "true"
      } else if (setting.type === "number") {
        value = Number(setting.value)
      }
      settingsObject[setting.key] = value
    })

    return NextResponse.json({ success: true, settings: settingsObject })
  } catch (error) {
    console.error("Error fetching public site settings:", error)
    return NextResponse.json({
      success: true,
      settings: {
        maintenanceMode: false,
        allowRegistrations: true,
        enableComments: true,
        enableDownloads: true,
      },
    })
  }
}
