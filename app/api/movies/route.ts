import { type NextRequest, NextResponse } from "next/server"
import { getMoviesPaginated } from "@/lib/server-actions"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const genre = searchParams.get("genre") || undefined
    const limit = Number.parseInt(searchParams.get("limit") || "20", 10)
    const offset = Number.parseInt(searchParams.get("offset") || "0", 10)
    const random = searchParams.get("random") === "true"

    const result = await getMoviesPaginated({ genre, limit, offset, random })

    return NextResponse.json(result)
  } catch (error) {
    console.error("Error fetching movies:", error)
    return NextResponse.json({ movies: [], total: 0, hasMore: false, error: "Failed to fetch movies" }, { status: 500 })
  }
}
