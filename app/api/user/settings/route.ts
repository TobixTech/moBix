import { type NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { Redis } from "@upstash/redis"

const redis = new Redis({
  url: process.env.KV_REST_API_URL!,
  token: process.env.KV_REST_API_TOKEN!,
})

export const dynamic = "force-dynamic"

// GET user settings
export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ success: false, error: "Not authenticated", settings: null })
    }

    const { searchParams } = new URL(req.url)
    const type = searchParams.get("type") as "notifications" | "privacy"

    if (!type || !["notifications", "privacy"].includes(type)) {
      return NextResponse.json({ success: false, error: "Invalid type", settings: null })
    }

    const key = `user:${userId}:${type}`
    const settings = await redis.get(key)

    // Return default settings if none found
    if (!settings) {
      const defaults =
        type === "notifications"
          ? { emailUpdates: true, newReleases: true, watchlistReminders: false, promotions: false }
          : { profileVisibility: true, watchHistory: true, showActivityStatus: false }

      return NextResponse.json({ success: true, settings: defaults })
    }

    return NextResponse.json({ success: true, settings })
  } catch (error) {
    console.error("[v0] Error getting user settings:", error)
    return NextResponse.json({ success: false, error: "Failed to get settings", settings: null })
  }
}

// POST save user settings
export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ success: false, error: "Not authenticated" })
    }

    const { type, settings } = await req.json()

    if (!type || !["notifications", "privacy"].includes(type)) {
      return NextResponse.json({ success: false, error: "Invalid type" })
    }

    const key = `user:${userId}:${type}`
    await redis.set(key, JSON.stringify(settings))

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Error saving user settings:", error)
    return NextResponse.json({ success: false, error: "Failed to save settings" })
  }
}
