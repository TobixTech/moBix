import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { movies } from "@/lib/db/schema"
import { ilike, sql, desc } from "drizzle-orm"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const genre = searchParams.get("genre") || undefined
    const limit = Number.parseInt(searchParams.get("limit") || "20", 10)
    const offset = Number.parseInt(searchParams.get("offset") || "0", 10)
    const random = searchParams.get("random") === "true"

    // Direct database query instead of server action
    const result = await db.query.movies.findMany({
      where: genre ? ilike(movies.genre, `%${genre}%`) : undefined,
      limit,
      offset,
      orderBy: random ? sql`RANDOM()` : [desc(movies.createdAt)],
    })

    // Get total count
    const countResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(movies)
      .where(genre ? ilike(movies.genre, `%${genre}%`) : undefined)

    const total = Number(countResult[0]?.count || 0)

    return NextResponse.json({
      movies: result,
      total,
      hasMore: offset + result.length < total,
    })
  } catch (error) {
    console.error("Error fetching movies:", error)
    return NextResponse.json({ movies: [], total: 0, hasMore: false, error: "Failed to fetch movies" }, { status: 500 })
  }
}
