import { NextResponse } from "next/server"
import { headers } from "next/headers"

export async function GET() {
  const headersList = await headers()

  // Get IP from various headers (Vercel, Cloudflare, etc.)
  const ip =
    headersList.get("x-real-ip") ||
    headersList.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    headersList.get("cf-connecting-ip") ||
    "unknown"

  // Try to detect country from IP using a free service
  let country = "Unknown"
  try {
    if (ip !== "unknown" && ip !== "127.0.0.1" && ip !== "::1") {
      const response = await fetch(`https://ipapi.co/${ip}/country_name/`, {
        next: { revalidate: 86400 }, // Cache for 24 hours
      })
      if (response.ok) {
        country = await response.text()
      }
    }
  } catch {
    // Fallback if IP lookup fails
  }

  return NextResponse.json({ ip, country })
}
