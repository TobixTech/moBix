import { type NextRequest, NextResponse } from "next/server"
import { currentUser } from "@clerk/nextjs/server"
import { db } from "@/lib/db"
import { users, creatorProfiles, creatorEarnings, creatorTiers, contentSubmissions } from "@/lib/db/schema"
import { eq, and, desc, sql, gte } from "drizzle-orm"

export async function GET(req: NextRequest) {
  try {
    const clerkUser = await currentUser()
    if (!clerkUser) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const [user] = await db.select().from(users).where(eq(users.clerkId, clerkUser.id)).limit(1)
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const [profile] = await db.select().from(creatorProfiles).where(eq(creatorProfiles.userId, user.id)).limit(1)
    if (!profile) {
      return NextResponse.json({ error: "Not a creator" }, { status: 403 })
    }

    // Get tier info
    const [tier] = await db
      .select()
      .from(creatorTiers)
      .where(eq(creatorTiers.userId, user.id))
      .orderBy(desc(creatorTiers.upgradedAt))
      .limit(1)

    // Get current balance (unpaid earnings)
    const [balanceResult] = await db
      .select({
        total: sql<number>`COALESCE(SUM(${creatorEarnings.earningsUsd}), 0)`,
      })
      .from(creatorEarnings)
      .where(and(eq(creatorEarnings.userId, user.id), eq(creatorEarnings.isPaid, false)))

    // Get total earnings (all time)
    const [totalResult] = await db
      .select({
        total: sql<number>`COALESCE(SUM(${creatorEarnings.earningsUsd}), 0)`,
      })
      .from(creatorEarnings)
      .where(eq(creatorEarnings.userId, user.id))

    // Get total views
    const [viewsResult] = await db
      .select({
        total: sql<number>`COALESCE(SUM(${creatorEarnings.views}), 0)`,
      })
      .from(creatorEarnings)
      .where(eq(creatorEarnings.userId, user.id))

    // Get this month's views
    const firstDayOfMonth = new Date()
    firstDayOfMonth.setDate(1)
    firstDayOfMonth.setHours(0, 0, 0, 0)

    const [monthViewsResult] = await db
      .select({
        total: sql<number>`COALESCE(SUM(${creatorEarnings.views}), 0)`,
      })
      .from(creatorEarnings)
      .where(and(eq(creatorEarnings.userId, user.id), gte(creatorEarnings.date, firstDayOfMonth)))

    // Get earnings history (last 30 days)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const earningsHistory = await db
      .select({
        date: creatorEarnings.date,
        views: sql<number>`SUM(${creatorEarnings.views})`,
        earnings: sql<number>`SUM(${creatorEarnings.earningsUsd})`,
      })
      .from(creatorEarnings)
      .where(and(eq(creatorEarnings.userId, user.id), gte(creatorEarnings.date, thirtyDaysAgo)))
      .groupBy(creatorEarnings.date)
      .orderBy(creatorEarnings.date)

    // Get content performance (top earning content)
    const contentPerformance = await db
      .select({
        contentId: creatorEarnings.contentId,
        contentType: creatorEarnings.contentType,
        views: sql<number>`SUM(${creatorEarnings.views})`,
        earnings: sql<number>`SUM(${creatorEarnings.earningsUsd})`,
      })
      .from(creatorEarnings)
      .where(eq(creatorEarnings.userId, user.id))
      .groupBy(creatorEarnings.contentId, creatorEarnings.contentType)
      .orderBy(desc(sql<number>`SUM(${creatorEarnings.earningsUsd})`))
      .limit(10)

    // Get content titles
    const contentWithTitles = await Promise.all(
      contentPerformance.map(async (item) => {
        const [submission] = await db
          .select({ title: contentSubmissions.title })
          .from(contentSubmissions)
          .where(eq(contentSubmissions.id, item.contentId))
          .limit(1)

        return {
          ...item,
          title: submission?.title || "Unknown",
        }
      }),
    )

    const currentBalance = Number(balanceResult.total) || 0
    const totalEarnings = Number(totalResult.total) || 0
    const totalViews = Number(viewsResult.total) || 0
    const monthViews = Number(monthViewsResult.total) || 0

    return NextResponse.json({
      success: true,
      tier: tier || { tierLevel: "bronze", ratePerView: "0.0008", totalViews: 0 },
      currentBalance,
      totalEarnings,
      totalViews,
      monthViews,
      earningsPerView: tier?.ratePerView || "0.0008",
      earningsHistory,
      contentPerformance: contentWithTitles,
    })
  } catch (error) {
    console.error("Error fetching earnings:", error)
    return NextResponse.json({ error: "Failed to fetch earnings" }, { status: 500 })
  }
}
