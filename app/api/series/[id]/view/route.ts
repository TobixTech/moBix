import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { series, contentSubmissions, creatorAnalytics } from "@/lib/db/schema"
import { eq, sql, and } from "drizzle-orm"

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params
    const seriesId = resolvedParams.id

    // Increment views directly in the database
    await db
      .update(series)
      .set({ views: sql`${series.views} + 1` })
      .where(eq(series.id, seriesId))

    // Track creator analytics if this series was uploaded by a creator
    try {
      const [submission] = await db
        .select()
        .from(contentSubmissions)
        .where(eq(contentSubmissions.publishedSeriesId, seriesId))
        .limit(1)

      if (submission) {
        await db
          .update(contentSubmissions)
          .set({ viewsCount: sql`${contentSubmissions.viewsCount} + 1` })
          .where(eq(contentSubmissions.id, submission.id))

        const today = new Date()
        today.setHours(0, 0, 0, 0)

        // Try to update existing analytics for today
        const [existing] = await db
          .select()
          .from(creatorAnalytics)
          .where(and(eq(creatorAnalytics.submissionId, submission.id), eq(creatorAnalytics.date, today)))
          .limit(1)

        if (existing) {
          await db
            .update(creatorAnalytics)
            .set({ views: sql`${creatorAnalytics.views} + 1` })
            .where(eq(creatorAnalytics.id, existing.id))
        } else {
          await db.insert(creatorAnalytics).values({
            submissionId: submission.id,
            date: today,
            views: 1,
            watchTimeMinutes: 0,
            likes: 0,
            favorites: 0,
          })
        }
      }
    } catch (analyticsError) {
      console.error("Error tracking creator analytics:", analyticsError)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error tracking view:", error)
    return NextResponse.json({ success: false }, { status: 500 })
  }
}
