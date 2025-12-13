import { type NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { db } from "@/lib/db"
import { creatorIPLog, users } from "@/lib/db/schema"
import { eq, desc, and, gte } from "drizzle-orm"

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user is admin
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
    })

    if (user?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const searchParams = request.nextUrl.searchParams
    const targetUserId = searchParams.get("userId")
    const suspicious = searchParams.get("suspicious")
    const days = Number.parseInt(searchParams.get("days") || "7")

    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    const conditions = [gte(creatorIPLog.timestamp, startDate)]
    if (targetUserId) conditions.push(eq(creatorIPLog.userId, targetUserId))
    if (suspicious === "true") conditions.push(eq(creatorIPLog.isSuspicious, true))

    const logs = await db
      .select({
        id: creatorIPLog.id,
        userId: creatorIPLog.userId,
        userName: users.username,
        ipAddress: creatorIPLog.ipAddress,
        action: creatorIPLog.action,
        timestamp: creatorIPLog.timestamp,
        userAgent: creatorIPLog.userAgent,
        isSuspicious: creatorIPLog.isSuspicious,
      })
      .from(creatorIPLog)
      .leftJoin(users, eq(creatorIPLog.userId, users.id))
      .where(and(...conditions))
      .orderBy(desc(creatorIPLog.timestamp))
      .limit(100)

    return NextResponse.json({ logs })
  } catch (error) {
    console.error("Error fetching IP logs:", error)
    return NextResponse.json({ error: "Failed to fetch IP logs" }, { status: 500 })
  }
}
