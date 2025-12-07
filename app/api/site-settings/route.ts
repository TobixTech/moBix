import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { siteSettings } from "@/lib/db/schema"

// GET - Fetch all site settings
export async function GET() {
  try {
    const settings = await db.select().from(siteSettings)

    // Convert to key-value object
    const settingsObject: Record<string, any> = {}
    settings.forEach((setting) => {
      let value: any = setting.value
      // Parse value based on type
      if (setting.type === "boolean") {
        value = setting.value === "true"
      } else if (setting.type === "number") {
        value = Number(setting.value)
      }
      settingsObject[setting.key] = value
    })

    return NextResponse.json({ success: true, settings: settingsObject })
  } catch (error: any) {
    console.error("Error fetching site settings:", error)
    return NextResponse.json({ success: false, error: error.message || "Failed to fetch settings" }, { status: 500 })
  }
}

// POST - Update site settings
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { key, value } = body

    if (!key) {
      return NextResponse.json({ success: false, error: "Setting key is required" }, { status: 400 })
    }

    // Determine type
    let type = "string"
    let stringValue = String(value)
    if (typeof value === "boolean") {
      type = "boolean"
      stringValue = value ? "true" : "false"
    } else if (typeof value === "number") {
      type = "number"
      stringValue = String(value)
    }

    // Upsert setting
    await db
      .insert(siteSettings)
      .values({
        key,
        value: stringValue,
        type,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: siteSettings.key,
        set: {
          value: stringValue,
          type,
          updatedAt: new Date(),
        },
      })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Error updating site setting:", error)
    return NextResponse.json({ success: false, error: error.message || "Failed to update setting" }, { status: 500 })
  }
}
