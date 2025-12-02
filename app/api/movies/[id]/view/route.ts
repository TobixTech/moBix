import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { movies } from "@/lib/db/schema"
import { eq, sql } from "drizzle-orm"

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params
    const movieId = resolvedParams.id

    // Increment views directly in the database
    await db
      .update(movies)
      .set({ views: sql`${movies.views} + 1` })
      .where(eq(movies.id, movieId))

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error tracking view:", error)
    return NextResponse.json({ success: false }, { status: 500 })
  }
}
