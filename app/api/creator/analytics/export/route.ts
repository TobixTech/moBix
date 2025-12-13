import { type NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { db } from "@/lib/db"
import { creatorEarnings } from "@/lib/db/schema"
import { eq, and, gte } from "drizzle-orm"

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const format = searchParams.get("format") || "csv" // csv or json
    const timeRange = searchParams.get("timeRange") || "30"

    const startDate = new Date()
    startDate.setDate(startDate.getDate() - Number.parseInt(timeRange))

    // Get earnings data
    const earnings = await db
      .select()
      .from(creatorEarnings)
      .where(and(eq(creatorEarnings.userId, userId), gte(creatorEarnings.date, startDate)))
      .orderBy(creatorEarnings.date)

    if (format === "csv") {
      // Generate CSV
      const csvHeader = "Date,Content ID,Content Type,Views,Earnings (USD),Tier Rate,Bonus Multiplier\n"
      const csvRows = earnings
        .map(
          (e) =>
            `${e.date?.toISOString().split("T")[0]},${e.contentId},${e.contentType},${e.views},${e.earningsUSD},${e.tierRate},${e.bonusMultiplier}`,
        )
        .join("\n")

      const csv = csvHeader + csvRows

      return new NextResponse(csv, {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="earnings_${new Date().toISOString().split("T")[0]}.csv"`,
        },
      })
    } else {
      // Return JSON
      return NextResponse.json({ earnings })
    }
  } catch (error) {
    console.error("Error exporting analytics:", error)
    return NextResponse.json({ error: "Failed to export analytics" }, { status: 500 })
  }
}
