import { NextResponse } from "next/server"
import { incrementMovieView, rateLimitedAction } from "@/lib/server-actions"
import { headers } from "next/headers"

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params
    const movieId = resolvedParams.id

    // Get client IP for rate limiting
    const headersList = await headers()
    const ip = headersList.get("x-forwarded-for")?.split(",")[0] || headersList.get("x-real-ip") || "unknown"

    // Rate limit: max 1 view per movie per IP per 5 minutes
    const rateLimit = await rateLimitedAction(
      `${ip}:${movieId}`,
      "movie-view",
      1,
      300, // 5 minutes
    )

    if (!rateLimit.allowed) {
      return NextResponse.json({
        success: false,
        message: "View already counted",
        resetIn: rateLimit.resetIn,
      })
    }

    const count = await incrementMovieView(movieId)

    return NextResponse.json({
      success: true,
      viewCount: count,
    })
  } catch (error) {
    console.error("Error incrementing view:", error)
    return NextResponse.json({ error: "Failed to increment view" }, { status: 500 })
  }
}
