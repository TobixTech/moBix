import { type NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { db } from "@/lib/db"
import { creatorViewAnalytics } from "@/lib/db/schema"
import { eq, and, sql, gte, desc } from "drizzle-orm"

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const timeRange = searchParams.get("timeRange") || "30" // days
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - Number.parseInt(timeRange))

    // Get geographic distribution
    const geoData = await db
      .select({
        country: creatorViewAnalytics.country,
        views: sql<number>`COUNT(*)::int`,
      })
      .from(creatorViewAnalytics)
      .where(and(eq(creatorViewAnalytics.userId, userId), gte(creatorViewAnalytics.viewedAt, startDate)))
      .groupBy(creatorViewAnalytics.country)
      .orderBy(desc(sql`COUNT(*)`))
      .limit(10)

    // Get device breakdown
    const deviceData = await db
      .select({
        device: creatorViewAnalytics.device,
        views: sql<number>`COUNT(*)::int`,
      })
      .from(creatorViewAnalytics)
      .where(and(eq(creatorViewAnalytics.userId, userId), gte(creatorViewAnalytics.viewedAt, startDate)))
      .groupBy(creatorViewAnalytics.device)

    // Get view sources (referrers)
    const referrerData = await db
      .select({
        referrer: creatorViewAnalytics.referrer,
        views: sql<number>`COUNT(*)::int`,
      })
      .from(creatorViewAnalytics)
      .where(and(eq(creatorViewAnalytics.userId, userId), gte(creatorViewAnalytics.viewedAt, startDate)))
      .groupBy(creatorViewAnalytics.referrer)
      .orderBy(desc(sql`COUNT(*)`))
      .limit(10)

    // Get daily views for chart
    const dailyViews = await db
      .select({
        date: sql<string>`DATE(${creatorViewAnalytics.viewedAt})`,
        views: sql<number>`COUNT(*)::int`,
      })
      .from(creatorViewAnalytics)
      .where(and(eq(creatorViewAnalytics.userId, userId), gte(creatorViewAnalytics.viewedAt, startDate)))
      .groupBy(sql`DATE(${creatorViewAnalytics.viewedAt})`)
      .orderBy(sql`DATE(${creatorViewAnalytics.viewedAt})`)

    return NextResponse.json({
      geoDistribution: geoData,
      deviceBreakdown: deviceData,
      viewSources: referrerData,
      dailyViews: dailyViews,
    })
  } catch (error) {
    console.error("Error fetching analytics:", error)
    return NextResponse.json({ error: "Failed to fetch analytics" }, { status: 500 })
  }
}
