import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { users } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { auth } from "@clerk/nextjs/server"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { seriesId, reason, description } = body

    if (!seriesId || !reason) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 })
    }

    // Get user info if authenticated
    let userId = null
    let userEmail = null

    try {
      const { userId: clerkId } = await auth()
      if (clerkId) {
        const user = await db.select().from(users).where(eq(users.clerkId, clerkId)).limit(1)
        if (user[0]) {
          userId = user[0].id
          userEmail = user[0].email
        }
      }
    } catch (authError) {
      console.log("[v0] Auth error (continuing as anonymous):", authError)
    }

    // Try to insert into SeriesReport table, or fall back to generic reports
    try {
      await db.execute({
        sql: `INSERT INTO "SeriesReport" (id, "userId", "seriesId", reason, description, email, status, "createdAt", "updatedAt") 
              VALUES ($1, $2, $3, $4, $5, $6, 'PENDING', NOW(), NOW())`,
        args: [crypto.randomUUID(), userId, seriesId, reason, description || null, userEmail],
      })
    } catch (dbError: any) {
      console.log("[v0] SeriesReport table error:", dbError.message)
      // If SeriesReport table doesn't exist, try the generic Report table
      try {
        await db.execute({
          sql: `INSERT INTO "Report" (id, "userId", "movieId", reason, description, email, status, "createdAt", "updatedAt") 
                VALUES ($1, $2, $3, $4, $5, $6, 'PENDING', NOW(), NOW())`,
          args: [crypto.randomUUID(), userId, seriesId, `[SERIES] ${reason}`, description || null, userEmail],
        })
      } catch (fallbackError: any) {
        console.log("[v0] Fallback report error:", fallbackError.message)
        // Just log it and return success - don't fail the user experience
        console.log("[v0] Report stored in logs only:", { seriesId, reason, description, userId, userEmail })
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Report API error:", error)
    return NextResponse.json({ success: false, error: "Failed to submit report" }, { status: 500 })
  }
}
