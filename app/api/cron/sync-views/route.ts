import { NextResponse } from "next/server"
import { syncViewCountsToDatabase } from "@/lib/server-actions"

// This endpoint should be called by a cron job every 5 minutes
// You can set this up in vercel.json or use Upstash QStash
export async function GET(request: Request) {
  try {
    // Verify cron secret (optional but recommended)
    const authHeader = request.headers.get("authorization")
    const cronSecret = process.env.CRON_SECRET

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const result = await syncViewCountsToDatabase()

    return NextResponse.json({
      success: true,
      message: `Synced ${result.synced} view counts to database`,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Error in sync-views cron:", error)
    return NextResponse.json({ error: "Failed to sync views" }, { status: 500 })
  }
}
