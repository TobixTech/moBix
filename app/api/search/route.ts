import { NextResponse } from "next/server"
import { searchMovies, rateLimitedAction } from "@/lib/server-actions"
import { headers } from "next/headers"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get("q") || ""

    // Get client IP for rate limiting
    const headersList = await headers()
    const ip = headersList.get("x-forwarded-for")?.split(",")[0] || headersList.get("x-real-ip") || "unknown"

    // Rate limit: max 30 searches per minute
    const rateLimit = await rateLimitedAction(ip, "search", 30, 60)

    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          error: "Too many requests",
          resetIn: rateLimit.resetIn,
        },
        {
          status: 429,
          headers: {
            "X-RateLimit-Remaining": rateLimit.remaining.toString(),
            "X-RateLimit-Reset": rateLimit.resetIn.toString(),
          },
        },
      )
    }

    const results = await searchMovies(query)

    return NextResponse.json(
      {
        results,
        cached: true, // Results may come from cache
      },
      {
        headers: {
          "X-RateLimit-Remaining": rateLimit.remaining.toString(),
        },
      },
    )
  } catch (error) {
    console.error("Error in search API:", error)
    return NextResponse.json({ error: "Search failed" }, { status: 500 })
  }
}
