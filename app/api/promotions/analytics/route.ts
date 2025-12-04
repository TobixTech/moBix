import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { promotionViews } from "@/lib/db/schema"
import { eq, desc, count } from "drizzle-orm"

export const dynamic = "force-dynamic"

// Get promotion analytics
export async function GET(req: NextRequest) {
  try {
    // Get total views
    const [totalViews] = await db.select({ count: count() }).from(promotionViews)

    // Get submissions count
    const [submissions] = await db
      .select({ count: count() })
      .from(promotionViews)
      .where(eq(promotionViews.submitted, true))

    // Get views by country
    const viewsByCountry = await db
      .select({
        country: promotionViews.country,
        count: count(),
      })
      .from(promotionViews)
      .groupBy(promotionViews.country)

    // Get recent views
    const recentViews = await db.query.promotionViews.findMany({
      orderBy: [desc(promotionViews.viewedAt)],
      limit: 50,
    })

    return NextResponse.json({
      totalViews: totalViews.count,
      submissions: submissions.count,
      conversionRate: totalViews.count > 0 ? ((submissions.count / totalViews.count) * 100).toFixed(1) : 0,
      viewsByCountry,
      recentViews: recentViews.map((v) => ({
        ...v,
        viewedAt: v.viewedAt.toISOString(),
      })),
    })
  } catch (error) {
    console.error("Error fetching promotion analytics:", error)
    return NextResponse.json({ error: "Failed to fetch analytics" }, { status: 500 })
  }
}

// Record a view
export async function POST(req: NextRequest) {
  try {
    const { userId, ipAddress, country, submitted } = await req.json()

    await db.insert(promotionViews).values({
      userId: userId || null,
      ipAddress: ipAddress || "unknown",
      country: country || null,
      submitted: submitted || false,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error recording promotion view:", error)
    return NextResponse.json({ success: false }, { status: 500 })
  }
}
