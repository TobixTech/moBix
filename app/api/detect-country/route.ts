import { type NextRequest, NextResponse } from "next/server"

// Country detection from IP using free API
export async function GET(request: NextRequest) {
  try {
    // Get IP from headers (Vercel provides this)
    const forwardedFor = request.headers.get("x-forwarded-for")
    const realIp = request.headers.get("x-real-ip")
    const ip = forwardedFor?.split(",")[0]?.trim() || realIp || "unknown"

    // Use ip-api.com (free, no key required)
    const response = await fetch(`http://ip-api.com/json/${ip}?fields=status,country,countryCode`, {
      next: { revalidate: 3600 }, // Cache for 1 hour
    })

    if (!response.ok) {
      return NextResponse.json({ country: "Unknown", countryCode: "XX", ip })
    }

    const data = await response.json()

    if (data.status === "success") {
      return NextResponse.json({
        country: data.country,
        countryCode: data.countryCode,
        ip,
      })
    }

    return NextResponse.json({ country: "Unknown", countryCode: "XX", ip })
  } catch (error) {
    console.error("Country detection error:", error)
    return NextResponse.json({ country: "Unknown", countryCode: "XX", ip: "unknown" })
  }
}
